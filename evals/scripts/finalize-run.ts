import {pack, verify} from '@filepacks/core'
import {access, mkdir, readFile, stat, writeFile} from 'node:fs/promises'
import {constants} from 'node:fs'
import {dirname, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

type Args = {
  force: boolean
  runId: string
}

type RunMetadata = {
  execution_attempt?: {
    artifact_created?: boolean
    artifact_path?: string | null
  }
  finalized_by?: string
  finalized_at?: string
  id?: string
  status?: string
}

const requiredMetadataFiles = ['run.json', 'task.md', 'notes.md', 'timing.json', 'review.json']
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  const runDir = resolve(repoRoot, 'evals/runs', args.runId)
  const evidenceDir = join(runDir, 'evidence')
  const artifactPath = join(runDir, 'artifact.fpk')
  const finalizationPath = join(runDir, 'finalization.json')

  await assertDirectory(runDir, `Run directory not found: ${relativeFromRoot(runDir)}`)
  await assertDirectory(evidenceDir, `Evidence directory not found: ${relativeFromRoot(evidenceDir)}`)

  for (const file of requiredMetadataFiles) {
    await assertFile(join(runDir, file), `Missing required metadata file: ${relativeFromRoot(join(runDir, file))}`)
  }

  const runMetadataPath = join(runDir, 'run.json')
  const runMetadata = await readJson<RunMetadata>(runMetadataPath)
  if (runMetadata.id && runMetadata.id !== args.runId) {
    throw new Error(`run.json id mismatch: expected ${args.runId}, found ${runMetadata.id}`)
  }

  const evidenceFiles = await countEvidenceFiles(evidenceDir)
  if (evidenceFiles === 0) {
    throw new Error(`Evidence directory is empty: ${relativeFromRoot(evidenceDir)}`)
  }

  if (await pathExists(artifactPath)) {
    if (!args.force) {
      throw new Error(`Refusing to overwrite existing artifact: ${relativeFromRoot(artifactPath)}. Pass --force to replace it.`)
    }
  }

  const startedAt = new Date().toISOString()
  const result = await pack({
    input: evidenceDir,
    name: args.runId,
    output: artifactPath,
  })
  const verification = await verify({artifact: artifactPath})
  if (!verification.ok) {
    throw new Error(`Created artifact did not verify: ${verification.mismatches.map(mismatch => mismatch.message).join('; ')}`)
  }

  const finalizedAt = new Date().toISOString()
  runMetadata.finalized_by = 'evals:finalize-run'
  runMetadata.finalized_at = finalizedAt
  if (runMetadata.execution_attempt) {
    runMetadata.execution_attempt.artifact_created = true
    runMetadata.execution_attempt.artifact_path = `evals/runs/${args.runId}/artifact.fpk`
  }
  await writeJson(runMetadataPath, runMetadata)

  await writeJson(finalizationPath, {
    artifact_digest: result.artifactDigest,
    artifact_path: `evals/runs/${args.runId}/artifact.fpk`,
    evidence_file_count: evidenceFiles,
    evidence_path: `evals/runs/${args.runId}/evidence`,
    finalized_at: finalizedAt,
    finalized_by: 'evals:finalize-run',
    started_at: startedAt,
    verification_ok: verification.ok,
  })

  console.log(`finalized ${args.runId}`)
  console.log(`artifact=${relativeFromRoot(artifactPath)}`)
  console.log(`evidence_files=${evidenceFiles}`)
  console.log(`verify_ok=${verification.ok}`)
}

function parseArgs(argv: string[]): Args {
  const values = [...argv]
  const forceIndex = values.indexOf('--force')
  const force = forceIndex !== -1
  if (force) values.splice(forceIndex, 1)

  const runId = values[0]
  if (!runId || values.length !== 1) {
    throw new Error('Usage: npm run evals:finalize-run -- <run-id> [--force]')
  }
  if (!/^run-[0-9]{4,}$/.test(runId)) {
    throw new Error(`Invalid run id: ${runId}`)
  }

  return {force, runId}
}

async function countEvidenceFiles(path: string): Promise<number> {
  const {readdir} = await import('node:fs/promises')
  const entries = await readdir(path, {recursive: true, withFileTypes: true})
  return entries.filter(entry => entry.isFile()).length
}

async function assertDirectory(path: string, message: string): Promise<void> {
  const stats = await stat(path).catch(() => undefined)
  if (!stats?.isDirectory()) throw new Error(message)
}

async function assertFile(path: string, message: string): Promise<void> {
  const stats = await stat(path).catch(() => undefined)
  if (!stats?.isFile()) throw new Error(message)
}

async function pathExists(path: string): Promise<boolean> {
  return access(path, constants.F_OK)
    .then(() => true)
    .catch(() => false)
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, 'utf8')) as T
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), {recursive: true})
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function relativeFromRoot(path: string): string {
  return path.startsWith(repoRoot) ? path.slice(repoRoot.length + 1) : path
}

main().catch(error => {
  const message = error instanceof Error ? error.message : 'Unexpected finalize-run failure.'
  console.error(message)
  process.exitCode = 1
})
