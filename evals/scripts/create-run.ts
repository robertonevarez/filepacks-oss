import {copyFile, mkdir, readdir, stat, writeFile} from 'node:fs/promises'
import {dirname, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

type RunMetadata = {
  agent: string
  baseline_group?: 'loose_files' | 'filepacks_artifact'
  expected_evidence_paths: string[]
  id: string
  model: string
  notes?: string
  repository: string
  task_type: TaskType
  timestamp: string
}

type TaskType =
  | 'api_integration'
  | 'bugfix'
  | 'ci_fix'
  | 'db_migration'
  | 'docs_update'
  | 'other'
  | 'refactor'
  | 'test_repair'
  | 'ui_change'

const taskTypes = new Set<TaskType>([
  'api_integration',
  'bugfix',
  'ci_fix',
  'db_migration',
  'docs_update',
  'other',
  'refactor',
  'test_repair',
  'ui_change',
])

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  const runsDir = resolve(repoRoot, args['runs-dir'] ?? 'evals/runs')
  const id = args.id ?? await nextRunId(runsDir)
  const taskType = requireTaskType(args['task-type'])

  const metadata: RunMetadata = {
    agent: requireFlag(args, 'agent'),
    expected_evidence_paths: splitList(args['expected-evidence']),
    id,
    model: requireFlag(args, 'model'),
    repository: requireFlag(args, 'repository'),
    task_type: taskType,
    timestamp: args.timestamp ?? new Date().toISOString(),
  }

  if (args['baseline-group']) {
    if (args['baseline-group'] !== 'loose_files' && args['baseline-group'] !== 'filepacks_artifact') {
      throw new Error('--baseline-group must be loose_files or filepacks_artifact.')
    }
    metadata.baseline_group = args['baseline-group']
  }

  const taskPath = resolveInputPath(requireFlag(args, 'task'))
  const artifactPath = resolveInputPath(requireFlag(args, 'artifact'))
  const baselinePath = args.baseline ? resolveInputPath(args.baseline) : undefined
  const notesPath = args.notes ? resolveInputPath(args.notes) : undefined

  await assertFile(taskPath, '--task')
  await assertFile(artifactPath, '--artifact')
  if (baselinePath) await assertFile(baselinePath, '--baseline')
  if (notesPath) await assertFile(notesPath, '--notes')

  const runDir = join(runsDir, id)
  await mkdir(runDir, {recursive: false})
  await copyFile(taskPath, join(runDir, 'task.md'))
  await copyFile(artifactPath, join(runDir, 'artifact.fpk'))
  if (baselinePath) await copyFile(baselinePath, join(runDir, 'baseline.fpk'))

  if (notesPath) {
    await copyFile(notesPath, join(runDir, 'notes.md'))
  } else {
    await writeFile(join(runDir, 'notes.md'), '', 'utf8')
  }

  await writeJson(join(runDir, 'run.json'), metadata)
  await writeJson(join(runDir, 'review.json'), {
    decision: 'needs_review',
    confidence: null,
    review_started_at: null,
    review_ended_at: null,
    review_duration_minutes: null,
    missing_context_count: 0,
    clarification_request_count: 0,
    missed_regression_count: 0,
    re_review_count: 0,
    reusable_by_another_agent: null,
    reproduction_success: null,
    time_to_understand_minutes: null,
    notes: [],
  })
  await writeJson(join(runDir, 'timing.json'), {
    agent_execution_seconds: null,
    artifact_packaging_seconds: null,
    review_seconds: null,
  })

  console.log(`created ${relativeFromRoot(runDir)}`)
  console.log(`artifact=${relativeFromRoot(join(runDir, 'artifact.fpk'))}`)
  console.log('next=complete review.json and timing.json after human review')
}

function parseArgs(argv: string[]): Record<string, string | undefined> {
  const parsed: Record<string, string | undefined> = {}

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (!arg.startsWith('--')) {
      throw new Error(`Unexpected argument: ${arg}`)
    }

    const key = arg.slice(2)
    const value = argv[index + 1]
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for --${key}.`)
    }

    parsed[key] = value
    index += 1
  }

  return parsed
}

function requireFlag(args: Record<string, string | undefined>, name: string): string {
  const value = args[name]
  if (!value) throw new Error(`Missing required --${name}.`)
  return value
}

function requireTaskType(value: string | undefined): TaskType {
  if (!value) throw new Error('Missing required --task-type.')
  if (!taskTypes.has(value as TaskType)) {
    throw new Error(`Unsupported --task-type: ${value}`)
  }
  return value as TaskType
}

function splitList(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

function resolveInputPath(path: string): string {
  return resolve(process.cwd(), path)
}

async function assertFile(path: string, flag: string): Promise<void> {
  const stats = await stat(path).catch(() => undefined)
  if (!stats?.isFile()) {
    throw new Error(`${flag} must point to an existing file: ${path}`)
  }
}

async function nextRunId(runsDir: string): Promise<string> {
  await mkdir(runsDir, {recursive: true})
  const entries = await readdir(runsDir, {withFileTypes: true})
  const max = entries
    .filter(entry => entry.isDirectory() && /^run-[0-9]+$/.test(entry.name))
    .map(entry => Number(entry.name.slice('run-'.length)))
    .filter(Number.isFinite)
    .reduce((currentMax, value) => Math.max(currentMax, value), 0)

  return `run-${String(max + 1).padStart(4, '0')}`
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function relativeFromRoot(path: string): string {
  return path.startsWith(repoRoot) ? path.slice(repoRoot.length + 1) : path
}

main().catch(error => {
  const message = error instanceof Error ? error.message : 'Unexpected create-run failure.'
  console.error(message)
  process.exitCode = 1
})
