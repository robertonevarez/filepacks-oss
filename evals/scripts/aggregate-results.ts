import {
  measureRunEvidence,
  type RunEvidenceMeasurement,
  type RunEvidenceReviewInput,
  type ReviewConfidence,
  type ReviewDecision,
} from '@filepacks/core'
import {mkdir, readdir, readFile, stat, writeFile} from 'node:fs/promises'
import {dirname, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

type RunMetadata = {
  expected_evidence_paths?: string[]
  id: string
  repository: string
  status?: string
  task_type: string
}

type ReviewMetadata = {
  clarification_request_count?: number
  confidence?: ReviewConfidence | null
  decision?: ReviewDecision | null
  missed_regression_count?: number
  missing_context_count?: number
  re_review_count?: number
  reproduction_success?: boolean | null
  reusable_by_another_agent?: boolean | null
  review_duration_minutes?: number | null
  review_ended_at?: string | null
  review_started_at?: string | null
  time_to_understand_minutes?: number | null
}

type TimingMetadata = {
  agent_execution_seconds?: number | null
  artifact_packaging_seconds?: number | null
  review_seconds?: number | null
}

type RunSummary = {
  artifact_tgz_present: boolean
  id: string
  measurement?: RunEvidenceMeasurement
  paths: {
    artifact: string
    baseline?: string
    directory: string
  }
  repository: string
  review: ReviewMetadata
  status: string
  task_type: string
  timing: TimingMetadata
  warnings: string[]
}

type AggregateReport = {
  current_state: {
    completed_runs: number
    incomplete_measured_artifacts: number
    infra_failures: number
    invalid_packaging_attempts: number
    measured_artifacts: number
    no_repro_artifacts: number
    not_executed_runs: number
  }
  comparison: {
    added_count: number
    baseline_count: number
    changed_count: number
    removed_count: number
    total_changed_files: number
  }
  evidence: {
    average_missing_evidence_count: number | null
    expected_count: number
    missing_count: number
    present_count: number
  }
  generated_at: string
  measured_run_count: number
  repository_counts: Record<string, number>
  reuse: {
    average_time_to_understand_minutes: number | null
    reproduction_success_count: number
    reproduction_success_rate: number | null
    reusable_by_another_agent_count: number
    reusable_by_another_agent_rate: number | null
  }
  review: {
    average_review_duration_minutes: number | null
    clarification_request_count: number
    decisions: Record<string, number>
    missed_regression_count: number
    re_review_count: number
  }
  run_count: number
  runs: RunSummary[]
  task_type_counts: Record<string, number>
  verification: {
    mismatch_count: number
    pass_count: number
    pass_rate: number | null
  }
}

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const runsDir = resolve(repoRoot, 'evals/runs')
const reportsDir = resolve(repoRoot, 'evals/reports')

async function main(): Promise<void> {
  const summaries = await collectRuns()
  const report = aggregate(summaries)

  await mkdir(reportsDir, {recursive: true})
  await writeFile(join(reportsDir, 'summary.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  await writeFile(join(reportsDir, 'summary.md'), renderMarkdown(report), 'utf8')

  console.log(`runs=${summaries.length}`)
  console.log(`measured=${report.measured_run_count}`)
  console.log('wrote evals/reports/summary.json')
  console.log('wrote evals/reports/summary.md')
}

async function collectRuns(): Promise<RunSummary[]> {
  const entries = await readdir(runsDir, {withFileTypes: true}).catch(() => [])
  const runDirs = entries
    .filter(entry => entry.isDirectory() && /^run-[0-9]+$/.test(entry.name))
    .map(entry => join(runsDir, entry.name))
    .sort()

  const summaries: RunSummary[] = []
  for (const runDir of runDirs) {
    summaries.push(await summarizeRun(runDir))
  }
  return summaries
}

async function summarizeRun(runDir: string): Promise<RunSummary> {
  const run = await readJson<RunMetadata>(join(runDir, 'run.json'))
  const review = await readJson<ReviewMetadata>(join(runDir, 'review.json'))
  const timing = await readJson<TimingMetadata>(join(runDir, 'timing.json'))
  const artifactPath = join(runDir, 'artifact.fpk')
  const artifactTgzPath = join(runDir, 'artifact.tgz')
  const baselinePath = join(runDir, 'baseline.fpk')
  const warnings: string[] = []
  const summary: RunSummary = {
    id: run.id,
    artifact_tgz_present: await fileExists(artifactTgzPath),
    paths: {
      artifact: relativeFromRoot(artifactPath),
      directory: relativeFromRoot(runDir),
    },
    repository: run.repository,
    review,
    status: run.status ?? 'unknown',
    task_type: run.task_type,
    timing,
    warnings,
  }

  if (await fileExists(baselinePath)) {
    summary.paths.baseline = relativeFromRoot(baselinePath)
  }

  if (!await fileExists(artifactPath)) {
    warnings.push('Missing artifact.fpk; run was not measured.')
    return summary
  }

  try {
    summary.measurement = await measureRunEvidence({
      baseline: await fileExists(baselinePath) ? baselinePath : undefined,
      candidate: artifactPath,
      expectedEvidencePaths: run.expected_evidence_paths ?? [],
      review: toMeasureReview(review),
    })
  } catch (error) {
    warnings.push(error instanceof Error ? error.message : 'Unable to measure run evidence.')
  }

  return summary
}

function toMeasureReview(review: ReviewMetadata): RunEvidenceReviewInput | undefined {
  const result: RunEvidenceReviewInput = {}

  if (review.confidence) result.confidence = review.confidence
  if (review.decision) result.decision = review.decision
  if (review.review_started_at) result.startedAt = review.review_started_at
  if (review.review_ended_at) result.endedAt = review.review_ended_at
  if (typeof review.reusable_by_another_agent === 'boolean') {
    result.reusableByAnotherAgent = review.reusable_by_another_agent
  }

  return Object.keys(result).length > 0 ? result : undefined
}

function aggregate(runs: RunSummary[]): AggregateReport {
  const measurements = runs.map(run => run.measurement).filter((measurement): measurement is RunEvidenceMeasurement => Boolean(measurement))
  const reviewDecisions = measurements.flatMap(measurement => (
    measurement.review?.decision ? [measurement.review.decision] : []
  ))
  const decisions = countBy(reviewDecisions)
  const verificationPassCount = measurements.filter(measurement => measurement.verification.ok).length
  const reusableCount = measurements.filter(measurement => measurement.review?.reusableByAnotherAgent === true).length
  const reproductionSuccessCount = runs.filter(run => run.review.reproduction_success === true).length

  return {
    generated_at: new Date().toISOString(),
    run_count: runs.length,
    measured_run_count: measurements.length,
    current_state: {
      measured_artifacts: measurements.length,
      completed_runs: runs.filter(run => run.status === 'completed').length,
      incomplete_measured_artifacts: runs.filter(run => run.status === 'incomplete' && run.measurement).length,
      infra_failures: runs.filter(run => run.status === 'failed').length,
      invalid_packaging_attempts: runs.filter(run => run.artifact_tgz_present || (run.paths.artifact && run.warnings.some(warning => warning.includes('Unable to measure') || warning.includes('malformed') || warning.includes('not a valid')))).length,
      no_repro_artifacts: runs.filter(run => run.measurement && run.measurement.evidence.present.includes('no-changes.md')).length,
      not_executed_runs: runs.filter(run => run.status === 'not_executed').length,
    },
    task_type_counts: countBy(runs.map(run => run.task_type)),
    repository_counts: countBy(runs.map(run => run.repository)),
    review: {
      decisions,
      average_review_duration_minutes: average(runs.map(reviewDurationMinutes)),
      clarification_request_count: sum(runs.map(run => run.review.clarification_request_count)),
      missed_regression_count: sum(runs.map(run => run.review.missed_regression_count)),
      re_review_count: sum(runs.map(run => run.review.re_review_count)),
    },
    evidence: {
      expected_count: sum(measurements.map(measurement => measurement.evidence.expected.length)),
      present_count: sum(measurements.map(measurement => measurement.evidence.presentCount)),
      missing_count: sum(measurements.map(measurement => measurement.evidence.missingCount)),
      average_missing_evidence_count: average(measurements.map(measurement => measurement.evidence.missingCount)),
    },
    verification: {
      pass_count: verificationPassCount,
      pass_rate: ratio(verificationPassCount, measurements.length),
      mismatch_count: sum(measurements.map(measurement => measurement.verification.mismatchCount)),
    },
    comparison: {
      baseline_count: measurements.filter(measurement => measurement.comparison).length,
      added_count: sum(measurements.map(measurement => measurement.comparison?.added)),
      changed_count: sum(measurements.map(measurement => measurement.comparison?.changed)),
      removed_count: sum(measurements.map(measurement => measurement.comparison?.removed)),
      total_changed_files: sum(measurements.map(measurement => measurement.comparison?.totalChangedFiles)),
    },
    reuse: {
      reusable_by_another_agent_count: reusableCount,
      reusable_by_another_agent_rate: ratio(reusableCount, measurements.length),
      reproduction_success_count: reproductionSuccessCount,
      reproduction_success_rate: ratio(reproductionSuccessCount, runs.length),
      average_time_to_understand_minutes: average(runs.map(run => run.review.time_to_understand_minutes)),
    },
    runs,
  }
}

function renderMarkdown(report: AggregateReport): string {
  const lines = [
    '# filepacks eval summary',
    '',
    `Generated: ${report.generated_at}`,
    '',
    '## Overview',
    '',
    `- Runs: ${report.run_count}`,
    `- Measured artifacts: ${report.measured_run_count}`,
    `- Verification pass rate: ${formatRate(report.verification.pass_rate)} (${report.verification.pass_count}/${report.measured_run_count})`,
    `- Average review duration: ${formatNumber(report.review.average_review_duration_minutes)} minutes`,
    `- Expected evidence paths: ${report.evidence.expected_count}`,
    `- Present expected evidence paths: ${report.evidence.present_count}`,
    `- Missing expected evidence paths: ${report.evidence.missing_count}`,
    `- Compared changed files: ${report.comparison.total_changed_files}`,
    '',
    '## Current State',
    '',
    `- Measured artifacts: ${report.current_state.measured_artifacts}`,
    `- Completed runs: ${report.current_state.completed_runs}`,
    `- Incomplete measured artifacts: ${report.current_state.incomplete_measured_artifacts}`,
    `- Infra failures: ${report.current_state.infra_failures}`,
    `- Invalid packaging attempts: ${report.current_state.invalid_packaging_attempts}`,
    `- No-repro/no-change artifacts: ${report.current_state.no_repro_artifacts}`,
    `- Not executed runs: ${report.current_state.not_executed_runs}`,
    '',
    'No improvement claims are supported yet. The strongest current finding is protocol-level: deterministic finalization improved valid artifact production compared with executor-created packaging.',
    '',
    '## Decisions',
    '',
    ...renderCountList(report.review.decisions),
    '',
    '## Runs',
    '',
    '| Run | Status | Task | Repo | Measured | Verify | Decision | Confidence | Missing Evidence | Changed Files |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...report.runs.map(run => [
      run.id,
      run.status,
      run.task_type,
      run.repository,
      run.measurement ? 'yes' : 'no',
      run.measurement ? (run.measurement.verification.ok ? 'pass' : 'fail') : 'n/a',
      run.measurement?.review?.decision ?? 'n/a',
      run.measurement?.review?.confidence ?? 'n/a',
      String(run.measurement?.evidence.missingCount ?? 'n/a'),
      String(run.measurement?.comparison?.totalChangedFiles ?? ''),
    ].join(' | ')).map(row => `| ${row} |`),
    '',
  ]

  return `${lines.join('\n')}\n`
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, 'utf8')) as T
}

async function fileExists(path: string): Promise<boolean> {
  const stats = await stat(path).catch(() => undefined)
  return stats?.isFile() ?? false
}

function countBy(values: string[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const value of values) counts[value] = (counts[value] ?? 0) + 1
  return counts
}

function renderCountList(counts: Record<string, number>): string[] {
  const entries = Object.entries(counts)
  return entries.length > 0 ? entries.map(([key, count]) => `- ${key}: ${count}`) : ['- none recorded']
}

function sum(values: Array<number | null | undefined>): number {
  return values.reduce<number>((total, value) => total + (typeof value === 'number' ? value : 0), 0)
}

function average(values: Array<number | null | undefined>): number | null {
  const numbers = values.filter((value): value is number => typeof value === 'number')
  if (numbers.length === 0) return null
  return round(sum(numbers) / numbers.length)
}

function ratio(numerator: number, denominator: number): number | null {
  if (denominator === 0) return null
  return round(numerator / denominator)
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000
}

function millisecondsToMinutes(value: number | undefined): number | undefined {
  return typeof value === 'number' ? value / 60000 : undefined
}

function reviewDurationMinutes(run: RunSummary): number | null | undefined {
  return millisecondsToMinutes(run.measurement?.review?.durationMs) ?? run.review.review_duration_minutes
}

function formatRate(value: number | null): string {
  if (value === null) return 'n/a'
  return `${Math.round(value * 1000) / 10}%`
}

function formatNumber(value: number | null | undefined): string {
  return typeof value === 'number' ? String(value) : 'n/a'
}

function relativeFromRoot(path: string): string {
  return path.startsWith(repoRoot) ? path.slice(repoRoot.length + 1) : path
}

main().catch(error => {
  const message = error instanceof Error ? error.message : 'Unexpected aggregate-results failure.'
  console.error(message)
  process.exitCode = 1
})
