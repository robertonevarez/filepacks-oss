import {
  buildManifest,
  collectSourceFiles,
  compareArtifacts,
  deriveArtifactName,
  FilepacksError,
  hashFileSHA256,
  readArtifact,
  serializeManifest,
  verifyArtifact,
  writeDeterministicArchive,
} from '@filepacks/core'
import {resolve} from 'node:path'

type CommandResult = {
  exitCode: number
  stderr?: string
  stdout?: string
}

type ParsedFlags = {
  output?: string
}

export async function main(argv: string[]): Promise<void> {
  const result = await run(argv)
  if (result.stdout) process.stdout.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)
  process.exitCode = result.exitCode
}

export async function run(argv: string[]): Promise<CommandResult> {
  const [command, ...rest] = argv

  try {
    if (command === 'pack') return await packCommand(rest)
    if (command === 'inspect') return await inspectCommand(rest)
    if (command === 'verify') return await verifyCommand(rest)
    if (command === 'compare') return await compareCommand(rest)

    return fail(`Unknown command: ${command ?? ''}`.trim(), usage())
  } catch (error) {
    if (error instanceof FilepacksError) {
      return fail(error.message, error.hint)
    }

    throw error
  }
}

async function packCommand(args: string[]): Promise<CommandResult> {
  const {flags, positional} = parseFlags(args)
  const input = positional[0]

  if (!input || !flags.output || positional.length !== 1) {
    return fail('Usage: filepacks pack <input> --output <file>')
  }

  const inputDirectory = resolve(input)
  const outputPath = resolve(flags.output)
  const sourceFiles = await collectSourceFiles(inputDirectory)
  const manifestFiles = await Promise.all(sourceFiles.map(async file => ({
    hash: await hashFileSHA256(file.absolutePath),
    path: file.relativePath,
    size: file.size,
  })))
  const manifest = buildManifest(deriveArtifactName(inputDirectory), manifestFiles)

  await writeDeterministicArchive({
    files: sourceFiles,
    manifestBytes: serializeManifest(manifest),
    outputPath,
  })

  const digest = await hashFileSHA256(outputPath)

  return ok([
    'Pack',
    `input=${inputDirectory}`,
    `output=${outputPath}`,
    `name=${manifest.artifact_name}`,
    `digest=sha256:${digest}`,
    `files=${manifest.file_count}`,
    `bytes=${manifest.total_bytes}`,
  ].join('\n') + '\n')
}

async function inspectCommand(args: string[]): Promise<CommandResult> {
  if (args.length !== 1) return fail('Usage: filepacks inspect <file>')

  const artifactPath = resolve(args[0])
  const artifact = await readArtifact(artifactPath)

  return ok([
    'Inspect',
    `path=${artifactPath}`,
    `name=${artifact.manifest.artifact_name}`,
    `version=${artifact.manifest.format_version}`,
    `digest=sha256:${artifact.artifactDigest}`,
    `files=${artifact.manifest.file_count}`,
    `bytes=${artifact.manifest.total_bytes}`,
  ].join('\n') + '\n')
}

async function verifyCommand(args: string[]): Promise<CommandResult> {
  if (args.length !== 1) return fail('Usage: filepacks verify <file>')

  const artifactPath = resolve(args[0])
  const result = await verifyArtifact(artifactPath)

  if (result.ok) {
    return ok([
      'Verify',
      `path=${artifactPath}`,
      `ok=true`,
      `files_checked=${result.file_count_checked ?? 0}`,
    ].join('\n') + '\n')
  }

  return {
    exitCode: 1,
    stdout: [
      'Verify',
      `path=${artifactPath}`,
      'ok=false',
      ...result.mismatches.map(mismatch => `error=${mismatch.code}:${mismatch.message}`),
    ].join('\n') + '\n',
  }
}

async function compareCommand(args: string[]): Promise<CommandResult> {
  if (args.length !== 2) return fail('Usage: filepacks compare <baseline> <candidate>')

  const baselinePath = resolve(args[0])
  const candidatePath = resolve(args[1])
  const baseline = await readArtifact(baselinePath)
  const candidate = await readArtifact(candidatePath)
  const result = compareArtifacts({
    left: {
      artifactDigest: baseline.artifactDigest,
      manifest: baseline.manifest,
      path: baselinePath,
    },
    right: {
      artifactDigest: candidate.artifactDigest,
      manifest: candidate.manifest,
      path: candidatePath,
    },
  })

  return {
    exitCode: result.ok ? 0 : 20,
    stdout: [
      'Compare',
      `baseline=${baselinePath}`,
      `candidate=${candidatePath}`,
      `ok=${String(result.ok)}`,
      `added=${result.summary.added}`,
      `removed=${result.summary.removed}`,
      `changed=${result.summary.changed}`,
      ...result.added.map(file => `added_file=${file.path}`),
      ...result.removed.map(file => `removed_file=${file.path}`),
      ...result.changed.map(file => `changed_file=${file.path}`),
    ].join('\n') + '\n',
  }
}

function parseFlags(args: string[]): {flags: ParsedFlags; positional: string[]} {
  const flags: ParsedFlags = {}
  const positional: string[] = []

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index]
    if (value === '--output') {
      flags.output = args[index + 1]
      index += 1
      continue
    }

    positional.push(value)
  }

  return {flags, positional}
}

function ok(stdout: string): CommandResult {
  return {exitCode: 0, stdout}
}

function fail(message: string, hint?: string): CommandResult {
  return {
    exitCode: 1,
    stderr: [`error ${message}`, hint ? `hint ${hint}` : undefined]
      .filter(Boolean)
      .join('\n') + '\n',
  }
}

function usage(): string {
  return [
    'filepacks pack <input> --output <file>',
    'filepacks inspect <file>',
    'filepacks verify <file>',
    'filepacks compare <baseline> <candidate>',
  ].join('\n')
}
