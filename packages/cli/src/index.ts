import {
  compare,
  FilepacksError,
  inspect,
  pack,
  verify,
} from '@filepacks/core'
import {resolve} from 'node:path'

const HELP_FLAGS = new Set(['--help', '-h'])
const COMMAND_NAMES = ['pack', 'inspect', 'verify', 'compare'] as const

type SupportedCommand = (typeof COMMAND_NAMES)[number]

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
  const help = requestedHelp(command, rest)

  if (help) return ok(help)

  try {
    if (command === 'pack') return await packCommand(rest)
    if (command === 'inspect') return await inspectCommand(rest)
    if (command === 'verify') return await verifyCommand(rest)
    if (command === 'compare') return await compareCommand(rest)

    return fail(`Unknown command: ${command ?? ''}`.trim(), "Run 'filepacks --help' for usage")
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
    return fail('Usage: filepacks pack <input> --output <file>', "Run 'filepacks pack --help' for usage")
  }

  if (!flags.output.endsWith('.fpk')) {
    return fail(`Output path must end with .fpk: ${flags.output}`, 'Provide an output path ending in .fpk.')
  }

  const inputDirectory = resolve(input)
  const outputPath = resolve(flags.output)
  const result = await pack({
    input: inputDirectory,
    output: outputPath,
  })

  return ok([
    'Pack',
    `input=${result.inputDirectory}`,
    `output=${result.outputPath}`,
    `name=${result.manifest.artifact_name}`,
    `digest=sha256:${result.artifactDigest}`,
    `files=${result.manifest.file_count}`,
    `bytes=${result.manifest.total_bytes}`,
  ].join('\n') + '\n')
}

async function inspectCommand(args: string[]): Promise<CommandResult> {
  if (args.length !== 1) {
    return fail('Usage: filepacks inspect <file>', "Run 'filepacks inspect --help' for usage")
  }

  const artifactPath = resolve(args[0])
  const artifact = await inspect({artifact: artifactPath})

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
  if (args.length !== 1) {
    return fail('Usage: filepacks verify <file>', "Run 'filepacks verify --help' for usage")
  }

  const artifactPath = resolve(args[0])
  const result = await verify({artifact: artifactPath})

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
  if (args.length !== 2) {
    return fail(
      'Usage: filepacks compare <baseline> <candidate>',
      "Run 'filepacks compare --help' for usage",
    )
  }

  const baselinePath = resolve(args[0])
  const candidatePath = resolve(args[1])
  const result = await compare({baseline: baselinePath, candidate: candidatePath})

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

function requestedHelp(command: string | undefined, rest: string[]): string | undefined {
  if (command === undefined) return helpText()
  if (isTopLevelHelpCommand(command, rest)) return helpText()

  if (isSupportedCommand(command) && isCommandHelp(rest)) {
    return commandHelpText(command)
  }

  return undefined
}

function helpText(): string {
  return [
    'filepacks — deterministic artifact CLI',
    '',
    'Usage:',
    '  filepacks <command> [options]',
    '',
    'Commands:',
    '  pack       Create a .fpk artifact from a directory',
    '  inspect    Read artifact metadata',
    '  verify     Validate artifact integrity',
    '  compare    Structurally compare two artifacts',
    '',
    'Quick trial:',
    '  npx filepacks pack ./agent-run --output ./agent-run.fpk',
    '',
    'Persistent install:',
    '  npm install -g filepacks',
    '  filepacks --help',
    '',
    'More help:',
    '  filepacks <command> --help',
    '',
  ].join('\n')
}

function commandHelpText(command: SupportedCommand): string {
  if (command === 'pack') return packHelpText()
  if (command === 'inspect') return inspectHelpText()
  if (command === 'verify') return verifyHelpText()
  return compareHelpText()
}

function packHelpText(): string {
  return [
    'filepacks pack — create a deterministic .fpk artifact from a directory',
    '',
    'Usage:',
    '  filepacks pack <input> --output <file>',
    '',
    'Arguments:',
    '  <input>           Directory to package',
    '',
    'Flags:',
    '  --output <file>   Required output path ending in .fpk',
    '',
    'Example:',
    '  npx filepacks pack ./agent-run --output ./agent-run.fpk',
    '',
    'Exit behavior:',
    '  0   Artifact created successfully',
    '  1   Usage or file/path error',
    '',
  ].join('\n')
}

function inspectHelpText(): string {
  return [
    'filepacks inspect — summarize an artifact without verifying integrity',
    '',
    'Usage:',
    '  filepacks inspect <file>',
    '',
    'Arguments:',
    '  <file>            Path to an existing .fpk artifact',
    '',
    'Example:',
    '  npx filepacks inspect ./agent-run.fpk',
    '',
    'Notes:',
    '  inspect reads the manifest summary only.',
    '  Run `filepacks verify <file>` before trusting or comparing an artifact.',
    '',
    'Exit behavior:',
    '  0   Artifact summary printed',
    '  1   Usage or file/path error',
    '',
  ].join('\n')
}

function verifyHelpText(): string {
  return [
    'filepacks verify — check artifact integrity against the manifest',
    '',
    'Usage:',
    '  filepacks verify <file>',
    '',
    'Arguments:',
    '  <file>            Path to an existing .fpk artifact',
    '',
    'Example:',
    '  npx filepacks verify ./agent-run.fpk',
    '',
    'Notes:',
    '  verify checks archive structure, manifest validity, and payload hashes.',
    '',
    'Exit behavior:',
    '  0   Artifact is valid',
    '  1   Artifact is invalid, unreadable, or the command was used incorrectly',
    '',
  ].join('\n')
}

function compareHelpText(): string {
  return [
    'filepacks compare — structurally compare two artifacts',
    '',
    'Usage:',
    '  filepacks compare <baseline> <candidate>',
    '',
    'Arguments:',
    '  <baseline>        Existing .fpk artifact used as the reference',
    '  <candidate>       Existing .fpk artifact you want to review',
    '',
    'Example:',
    '  npx filepacks compare ./baseline.fpk ./candidate.fpk',
    '',
    'Notes:',
    '  compare reports added, removed, and changed packaged files.',
    '  Exit 20 means the artifacts differ, not that the CLI crashed.',
    '',
    'Exit behavior:',
    '  0   Artifacts are structurally identical',
    '  20  Artifacts differ structurally',
    '  1   Usage or file/path error',
    '',
  ].join('\n')
}

function isTopLevelHelpCommand(command: string | undefined, rest: string[]): boolean {
  return (command === '--help' || command === '-h' || command === 'help') && rest.length === 0
}

function isCommandHelp(args: string[]): boolean {
  return args.length === 1 && HELP_FLAGS.has(args[0])
}

function isSupportedCommand(command: string): command is SupportedCommand {
  return COMMAND_NAMES.includes(command as SupportedCommand)
}
