import {access, readdir, readFile} from 'node:fs/promises'
import {constants} from 'node:fs'
import {dirname, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {verify} from '@filepacks/core'

type CandidateIssue = {
  id: string
  selected_for_batch?: boolean
}

type RunMetadata = {
  candidate_issue_id?: string
  expected_evidence_paths?: string[]
  execution_attempt?: {
    artifact_created?: boolean
    artifact_path?: string | null
    issue_fix_attempted?: boolean
    issue_reproduced?: boolean
    result?: string
  }
  executor_command?: string
  executor_prompt?: string
  executor_tool?: string
  id?: string
  model?: string
  model_identifier?: string | null
  model_substitution_reason?: string | null
  provider?: string
  status?: string
}

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const runsDir = resolve(repoRoot, 'evals/runs')

async function main(): Promise<void> {
  const issues = await readJson<CandidateIssue[]>(resolve(repoRoot, 'evals/candidates/issues.shortlist.json'))
  const selectedIssueIds = issues
    .filter(issue => issue.selected_for_batch)
    .map(issue => issue.id)
    .sort()
  const runs = await readRuns()
  const errors: string[] = []
  const warnings: string[] = []

  for (const issueId of selectedIssueIds) {
    const matchingRuns = runs.filter(run => run.metadata.candidate_issue_id === issueId)
    if (matchingRuns.length !== 1) {
      errors.push(`${issueId}: expected exactly one prepared run folder, found ${matchingRuns.length}`)
      continue
    }

    const run = matchingRuns[0]
    const metadata = run.metadata
    if (metadata.executor_tool !== 'opencode') errors.push(`${run.id}: executor_tool must be opencode`)
    if (metadata.provider !== 'github-copilot') errors.push(`${run.id}: provider must be github-copilot`)
    if (metadata.model !== 'gpt-5-mini') errors.push(`${run.id}: model must be gpt-5-mini`)
    if (metadata.model_identifier !== 'github-copilot/gpt-5-mini') {
      errors.push(`${run.id}: model_identifier must be github-copilot/gpt-5-mini`)
    }
    if (metadata.model_substitution_reason !== null) errors.push(`${run.id}: model_substitution_reason must remain null before fallback use`)
    if (!['not_executed', 'failed', 'completed', 'incomplete', 'rejected'].includes(metadata.status ?? '')) {
      errors.push(`${run.id}: unsupported status ${metadata.status}`)
    }
    if (metadata.executor_prompt !== `${run.id}/executor-prompt.md`) errors.push(`${run.id}: executor_prompt path mismatch`)
    if (metadata.executor_command !== `opencode run "$(cat evals/runs/${run.id}/executor-prompt.md)"`) {
      errors.push(`${run.id}: executor_command mismatch`)
    }
    if (!run.prompt.includes(`opencode run "$(cat evals/runs/${run.id}/executor-prompt.md)"`)) {
      errors.push(`${run.id}: executor prompt is missing required command pattern`)
    }
    if (!run.prompt.includes('Do not switch models mid-run')) {
      errors.push(`${run.id}: executor prompt is missing model switching rule`)
    }

    const artifactPath = join(runsDir, run.id, 'artifact.fpk')
    const hasArtifact = await pathExists(artifactPath)
    const hasArtifactTgz = await pathExists(join(runsDir, run.id, 'artifact.tgz'))
    const hasEvidenceDirectory = await pathExists(join(runsDir, run.id, 'evidence'))
    const hasFinalizationMarker = await pathExists(join(runsDir, run.id, 'finalization.json'))
    const notesPath = join(runsDir, run.id, 'notes.md')
    const hasNotes = await pathExists(notesPath)
    const expectedEvidencePaths = metadata.expected_evidence_paths ?? []
    const executionAttempt = metadata.execution_attempt

    if (metadata.status === 'completed' && !hasArtifact) {
      warnings.push(`${run.id}: completed run has no artifact.fpk`)
    }
    if (metadata.status === 'completed' && !hasFinalizationMarker) {
      warnings.push(`${run.id}: completed run has no deterministic finalization marker`)
    }
    if (metadata.status === 'incomplete' && !hasNotes) {
      warnings.push(`${run.id}: incomplete run has no notes.md`)
    }
    if (metadata.status === 'incomplete' && hasArtifact) {
      warnings.push(`${run.id}: incomplete run has artifact.fpk; confirm status is intentional`)
    }
    if (hasArtifact) {
      const verification = await verify({artifact: artifactPath})
      if (!verification.ok) warnings.push(`${run.id}: artifact.fpk present but verification fails`)
    }
    if (hasArtifactTgz) {
      warnings.push(`${run.id}: artifact.tgz present; future runs must use evals:finalize-run to create artifact.fpk`)
    }
    if (hasEvidenceDirectory && !hasArtifact) {
      warnings.push(`${run.id}: evidence directory exists but artifact.fpk is missing`)
    }
    if (executionAttempt?.issue_fix_attempted && !expectedEvidencePaths.includes('changes.patch')) {
      warnings.push(`${run.id}: patch outcome does not expect changes.patch`)
    }
    if (
      executionAttempt &&
      executionAttempt.issue_fix_attempted === false &&
      executionAttempt.issue_reproduced === false &&
      expectedEvidencePaths.includes('changes.patch')
    ) {
      warnings.push(`${run.id}: no-repro/no-change outcome still expects changes.patch`)
    }
  }

  if (errors.length > 0) {
    for (const error of errors) console.error(error)
    process.exitCode = 1
    return
  }

  for (const warning of warnings) console.warn(`warning: ${warning}`)

  console.log(`validated ${selectedIssueIds.length} prepared selected batch run folders`)
}

async function readRuns(): Promise<Array<{id: string, metadata: RunMetadata, prompt: string}>> {
  const entries = await readdir(runsDir, {withFileTypes: true}).catch(() => [])
  const runs = []
  for (const entry of entries) {
    if (!entry.isDirectory() || !/^run-[0-9]+$/.test(entry.name)) continue
    const runDir = join(runsDir, entry.name)
    const metadata = await readJson<RunMetadata>(join(runDir, 'run.json')).catch(() => undefined)
    const prompt = await readFile(join(runDir, 'executor-prompt.md'), 'utf8').catch(() => '')
    if (metadata) runs.push({id: entry.name, metadata, prompt})
  }
  return runs
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, 'utf8')) as T
}

async function pathExists(path: string): Promise<boolean> {
  return access(path, constants.F_OK)
    .then(() => true)
    .catch(() => false)
}

main().catch(error => {
  const message = error instanceof Error ? error.message : 'Unexpected validate-batch-runs failure.'
  console.error(message)
  process.exitCode = 1
})
