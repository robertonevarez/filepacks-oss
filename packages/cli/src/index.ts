import {
  compare,
  FilepacksError,
  inspect,
  pack,
  verify,
  type CliJsonResult,
  type CompareJsonResult,
  type InspectJsonResult,
  type PackJsonResult,
  type PushJsonResult,
  type VerifyJsonResult,
} from '@filepacks/core'
import {readFile} from 'node:fs/promises'
import {platform} from 'node:os'
import {resolve} from 'node:path'
import {spawn} from 'node:child_process'

const HELP_FLAGS = new Set(['--help', '-h'])
const COMMAND_NAMES = ['pack', 'inspect', 'verify', 'compare', 'push'] as const

type SupportedCommand = (typeof COMMAND_NAMES)[number]

type CommandResult = {
  exitCode: number
  stderr?: string
  stdout?: string
}

type ParsedFlags = {
  endpoint?: string
  json?: boolean
  open?: boolean
  output?: string
}

type ArtifactSummary = {
  digest: `sha256:${string}`
  fileCount: number
  formatVersion?: number
  name: string
  totalBytes: number
}

type PreviewApiErrorResult = {
  error: {
    code: string
    hint?: string
    message: string
  }
  ok: false
  operation: 'inspect' | 'verify' | 'compare'
  preview: true
}

type PreviewVerifyResult = {
  filesChecked: number
  mismatches: Array<{
    code: string
    message: string
    path?: string
  }>
  ok: boolean
  operation: 'verify'
  preview: true
}

type PreviewCompareResult = {
  files: {
    added: string[]
    changed: string[]
    removed: string[]
  }
  ok: boolean
  operation: 'compare'
  preview: true
  summary: {
    added: number
    changed: number
    removed: number
  }
}

type SingleReviewPayload = {
  artifact: ArtifactSummary
  stored: false
  type: 'single_artifact_review'
  verification: {
    filesChecked: number
    mismatches: PreviewVerifyResult['mismatches']
    ok: boolean
  }
}

type CompareReviewPayload = {
  baseline: ArtifactSummary
  candidate: ArtifactSummary
  comparison: {
    files: PreviewCompareResult['files']
    ok: boolean
    summary: PreviewCompareResult['summary']
  }
  stored: false
  type: 'artifact_compare_review'
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
    if (command === 'push') return await pushCommand(rest)

    return fail(`Unknown command: ${command ?? ''}`.trim(), "Run 'filepacks --help' for usage")
  } catch (error) {
    if (error instanceof FilepacksError) {
      const supportedCommand = command && isSupportedCommand(command) ? command : undefined
      if (supportedCommand && hasJsonFlag(rest)) {
        return failJson(supportedCommand, error.message, error.hint)
      }

      return fail(error.message, error.hint)
    }

    throw error
  }
}

async function packCommand(args: string[]): Promise<CommandResult> {
  const {flags, positional} = parseFlags(args)
  const input = positional[0]

  if (!input || !flags.output || positional.length !== 1) {
    if (flags.json) {
      return failJson('pack', 'Usage: filepacks pack <input> --output <file>', "Run 'filepacks pack --help' for usage")
    }

    return fail('Usage: filepacks pack <input> --output <file>', "Run 'filepacks pack --help' for usage")
  }

  if (!flags.output.endsWith('.fpk')) {
    if (flags.json) {
      return failJson('pack', `Output path must end with .fpk: ${flags.output}`, 'Provide an output path ending in .fpk.')
    }

    return fail(`Output path must end with .fpk: ${flags.output}`, 'Provide an output path ending in .fpk.')
  }

  const inputDirectory = resolve(input)
  const outputPath = resolve(flags.output)
  const result = await pack({
    input: inputDirectory,
    output: outputPath,
  })

  if (flags.json) {
    return okJson({
      artifact: {
        digest: `sha256:${result.artifactDigest}`,
        fileCount: result.manifest.file_count,
        name: result.manifest.artifact_name,
        totalBytes: result.manifest.total_bytes,
      },
      command: 'pack',
      inputDirectory: result.inputDirectory,
      ok: true,
      outputPath: result.outputPath,
    } satisfies PackJsonResult)
  }

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
  const {flags, positional} = parseFlags(args)

  if (positional.length !== 1) {
    if (flags.json) {
      return failJson('inspect', 'Usage: filepacks inspect <file>', "Run 'filepacks inspect --help' for usage")
    }

    return fail('Usage: filepacks inspect <file>', "Run 'filepacks inspect --help' for usage")
  }

  const artifactPath = resolve(positional[0])
  const artifact = await inspect({artifact: artifactPath})

  if (flags.json) {
    return okJson({
      artifact: {
        digest: `sha256:${artifact.artifactDigest}`,
        fileCount: artifact.manifest.file_count,
        formatVersion: artifact.manifest.format_version,
        name: artifact.manifest.artifact_name,
        totalBytes: artifact.manifest.total_bytes,
      },
      command: 'inspect',
      ok: true,
      path: artifactPath,
    } satisfies InspectJsonResult)
  }

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
  const {flags, positional} = parseFlags(args)

  if (positional.length !== 1) {
    if (flags.json) {
      return failJson('verify', 'Usage: filepacks verify <file>', "Run 'filepacks verify --help' for usage")
    }

    return fail('Usage: filepacks verify <file>', "Run 'filepacks verify --help' for usage")
  }

  const artifactPath = resolve(positional[0])
  const result = await verify({artifact: artifactPath})

  if (flags.json) {
    return {
      exitCode: result.ok ? 0 : 1,
      stdout: jsonLine({
        command: 'verify',
        filesChecked: result.file_count_checked ?? 0,
        mismatches: result.mismatches,
        ok: result.ok,
        path: artifactPath,
      } satisfies VerifyJsonResult),
    }
  }

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
  const {flags, positional} = parseFlags(args)

  if (positional.length !== 2) {
    if (flags.json) {
      return failJson(
        'compare',
        'Usage: filepacks compare <baseline> <candidate>',
        "Run 'filepacks compare --help' for usage",
      )
    }

    return fail(
      'Usage: filepacks compare <baseline> <candidate>',
      "Run 'filepacks compare --help' for usage",
    )
  }

  const baselinePath = resolve(positional[0])
  const candidatePath = resolve(positional[1])
  const result = await compare({baseline: baselinePath, candidate: candidatePath})

  if (flags.json) {
    return {
      exitCode: result.ok ? 0 : 20,
      stdout: jsonLine({
        baseline: baselinePath,
        candidate: candidatePath,
        command: 'compare',
        files: {
          added: result.added.map(file => file.path),
          changed: result.changed.map(file => file.path),
          removed: result.removed.map(file => file.path),
        },
        ok: result.ok,
        summary: result.summary,
      } satisfies CompareJsonResult),
    }
  }

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

async function pushCommand(args: string[]): Promise<CommandResult> {
  const {flags, positional} = parseFlags(args)

  if (!flags.endpoint || positional.length < 1 || positional.length > 2) {
    if (flags.json) {
      return failJson(
        'push',
        'Usage: filepacks push <artifact> --endpoint <url> [--open] [--json]',
        "Run 'filepacks push --help' for usage",
      )
    }

    return fail(
      'Usage: filepacks push <artifact> --endpoint <url> [--open] [--json]',
      "Run 'filepacks push --help' for usage",
    )
  }

  const endpoint = normalizeEndpoint(flags.endpoint)
  if (!endpoint) {
    if (flags.json) {
      return failJson('push', `Invalid endpoint URL: ${flags.endpoint}`, 'Provide an absolute http:// or https:// URL.')
    }

    return fail(`Invalid endpoint URL: ${flags.endpoint}`, 'Provide an absolute http:// or https:// URL.')
  }

  if (positional.length === 1) {
    return await pushSingleArtifact({
      artifactPath: resolve(positional[0]),
      endpoint,
      json: Boolean(flags.json),
      open: Boolean(flags.open),
    })
  }

  return await pushCompareArtifacts({
    baselinePath: resolve(positional[0]),
    candidatePath: resolve(positional[1]),
    endpoint,
    json: Boolean(flags.json),
    open: Boolean(flags.open),
  })
}

async function pushSingleArtifact({
  artifactPath,
  endpoint,
  json,
  open,
}: {
  artifactPath: string
  endpoint: string
  json: boolean
  open: boolean
}): Promise<CommandResult> {
  const [artifact, verification] = await Promise.all([
    inspect({artifact: artifactPath}),
    verify({artifact: artifactPath}),
  ])

  if (!verification.ok) {
    return json
      ? failJson('push', 'Local artifact verification failed.', 'Run `filepacks verify <artifact>` for details.')
      : fail('Local artifact verification failed.', 'Run `filepacks verify <artifact>` for details.')
  }

  const preview = await postMultipart<PreviewVerifyResult | PreviewApiErrorResult>({
    endpoint,
    files: [{field: 'artifact', path: artifactPath}],
    route: '/api/preview/artifacts/verify',
  })

  if ('error' in preview) {
    return json
      ? failJson('push', preview.error.message, preview.error.hint)
      : fail(preview.error.message, preview.error.hint)
  }

  const payload: SingleReviewPayload = {
    artifact: summarizeArtifact(artifact),
    stored: false,
    type: 'single_artifact_review',
    verification: {
      filesChecked: preview.filesChecked,
      mismatches: preview.mismatches,
      ok: preview.ok,
    },
  }
  const reviewUrl = buildReviewUrl(endpoint, payload)
  const opened = open ? await openUrl(reviewUrl) : false

  if (json) {
    return okJson({
      command: 'push',
      endpoint,
      mode: 'temporary_review',
      ok: true,
      opened,
      reviewUrl,
      stored: false,
    } satisfies PushJsonResult)
  }

  return ok([
    'Push',
    'mode=temporary_review',
    'stored=false',
    `artifact=${artifactPath}`,
    `endpoint=${endpoint}`,
    `verified=${String(preview.ok)}`,
    open ? `opened=${reviewUrl}` : `review_url=${reviewUrl}`,
    open && !opened ? 'open_failed=true' : undefined,
  ].filter(Boolean).join('\n') + '\n')
}

async function pushCompareArtifacts({
  baselinePath,
  candidatePath,
  endpoint,
  json,
  open,
}: {
  baselinePath: string
  candidatePath: string
  endpoint: string
  json: boolean
  open: boolean
}): Promise<CommandResult> {
  const [baseline, candidate, baselineVerify, candidateVerify] = await Promise.all([
    inspect({artifact: baselinePath}),
    inspect({artifact: candidatePath}),
    verify({artifact: baselinePath}),
    verify({artifact: candidatePath}),
  ])

  if (!baselineVerify.ok || !candidateVerify.ok) {
    return json
      ? failJson('push', 'Local artifact verification failed.', 'Run `filepacks verify <artifact>` for details.')
      : fail('Local artifact verification failed.', 'Run `filepacks verify <artifact>` for details.')
  }

  const preview = await postMultipart<PreviewCompareResult | PreviewApiErrorResult>({
    endpoint,
    files: [
      {field: 'baseline', path: baselinePath},
      {field: 'candidate', path: candidatePath},
    ],
    route: '/api/preview/artifacts/compare',
  })

  if ('error' in preview) {
    return json
      ? failJson('push', preview.error.message, preview.error.hint)
      : fail(preview.error.message, preview.error.hint)
  }

  const payload: CompareReviewPayload = {
    baseline: summarizeArtifact(baseline),
    candidate: summarizeArtifact(candidate),
    comparison: {
      files: preview.files,
      ok: preview.ok,
      summary: preview.summary,
    },
    stored: false,
    type: 'artifact_compare_review',
  }
  const reviewUrl = buildReviewUrl(endpoint, payload)
  const opened = open ? await openUrl(reviewUrl) : false

  if (json) {
    return okJson({
      command: 'push',
      endpoint,
      mode: 'temporary_compare_review',
      ok: true,
      opened,
      reviewUrl,
      stored: false,
      summary: preview.summary,
    } satisfies PushJsonResult)
  }

  return ok([
    'Push',
    'mode=temporary_compare_review',
    'stored=false',
    `baseline=${baselinePath}`,
    `candidate=${candidatePath}`,
    `endpoint=${endpoint}`,
    `added=${preview.summary.added}`,
    `changed=${preview.summary.changed}`,
    `removed=${preview.summary.removed}`,
    open ? `opened=${reviewUrl}` : `review_url=${reviewUrl}`,
    open && !opened ? 'open_failed=true' : undefined,
  ].filter(Boolean).join('\n') + '\n')
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

    if (value === '--endpoint') {
      flags.endpoint = args[index + 1]
      index += 1
      continue
    }

    if (value === '--json') {
      flags.json = true
      continue
    }

    if (value === '--open') {
      flags.open = true
      continue
    }

    positional.push(value)
  }

  return {flags, positional}
}

function ok(stdout: string): CommandResult {
  return {exitCode: 0, stdout}
}

function okJson(result: CliJsonResult): CommandResult {
  return {exitCode: 0, stdout: jsonLine(result)}
}

function failJson(command: SupportedCommand, message: string, hint?: string): CommandResult {
  return {
    exitCode: 1,
    stdout: jsonLine({
      command,
      error: {
        code: errorCodeForMessage(message),
        hint,
        message,
      },
      ok: false,
    } as CliJsonResult),
  }
}

function jsonLine(result: CliJsonResult): string {
  return `${JSON.stringify(result, null, 2)}\n`
}

function fail(message: string, hint?: string): CommandResult {
  return {
    exitCode: 1,
    stderr: [`error ${message}`, hint ? `hint ${hint}` : undefined]
      .filter(Boolean)
      .join('\n') + '\n',
  }
}

function hasJsonFlag(args: string[]): boolean {
  return args.includes('--json')
}

function errorCodeForMessage(message: string): string {
  if (message.startsWith('Usage:')) return 'usage'
  if (message.includes('endpoint')) return 'invalid_endpoint'
  if (message.includes('verification failed')) return 'invalid_artifact'
  if (message.includes('must end with .fpk')) return 'invalid_output_path'
  if (message.includes('does not exist')) return 'not_found'
  if (message.includes('not a directory')) return 'invalid_input'
  if (message.includes('manifest') || message.includes('archive')) return 'invalid_artifact'
  return 'filepacks_error'
}

function usage(): string {
  return [
    'filepacks pack <input> --output <file>',
    'filepacks inspect <file>',
    'filepacks verify <file>',
    'filepacks compare <baseline> <candidate>',
    'filepacks push <artifact> --endpoint <url> [--open]',
    'filepacks push <baseline> <candidate> --endpoint <url> [--open]',
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
    '  push       Send artifacts to a temporary review endpoint',
    '',
    'Quick trial:',
    '  npx filepacks pack ./agent-run --output ./agent-run.fpk',
    '  npx filepacks inspect ./agent-run.fpk --json',
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
  if (command === 'compare') return compareHelpText()
  return pushHelpText()
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
    '  --json            Print structured JSON for agents and automation',
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
    'Flags:',
    '  --json            Print structured JSON for agents and automation',
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
    'Flags:',
    '  --json            Print structured JSON for agents and automation',
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
    'Flags:',
    '  --json            Print structured JSON for agents and automation',
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

function pushHelpText(): string {
  return [
    'filepacks push — send .fpk artifacts to a temporary review endpoint',
    '',
    'Usage:',
    '  filepacks push <artifact> --endpoint <url> [--open] [--json]',
    '  filepacks push <baseline> <candidate> --endpoint <url> [--open] [--json]',
    '',
    'Arguments:',
    '  <artifact>        Existing .fpk artifact to verify and review',
    '  <baseline>        Existing .fpk artifact used as the reference',
    '  <candidate>       Existing .fpk artifact you want to review',
    '',
    'Flags:',
    '  --endpoint <url>  Required preview endpoint such as http://localhost:3000',
    '  --open            Open /app with the encoded review result in a browser',
    '  --json            Print structured JSON for agents and automation',
    '',
    'Notes:',
    '  push is an experimental review handoff command.',
    '  Artifacts are processed by the preview API for the request and are not stored.',
    '  Use --open to open the human review surface in a browser.',
    '',
    'Exit behavior:',
    '  0   Temporary review handoff succeeded',
    '  1   Usage, path, network, API, or local verification error',
    '',
  ].join('\n')
}

function normalizeEndpoint(value: string): string {
  try {
    const url = new URL(value)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return ''
    url.hash = ''
    url.search = ''
    return url.toString().replace(/\/$/, '')
  } catch {
    return ''
  }
}

function buildReviewUrl(endpoint: string, payload: SingleReviewPayload | CompareReviewPayload): string {
  return `${endpoint}/app#review=${encodeBase64Url(JSON.stringify(payload))}`
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function summarizeArtifact(artifact: Awaited<ReturnType<typeof inspect>>): ArtifactSummary {
  return {
    digest: `sha256:${artifact.artifactDigest}`,
    fileCount: artifact.manifest.file_count,
    formatVersion: artifact.manifest.format_version,
    name: artifact.manifest.artifact_name,
    totalBytes: artifact.manifest.total_bytes,
  }
}

async function postMultipart<TResult>({
  endpoint,
  files,
  route,
}: {
  endpoint: string
  files: Array<{field: string; path: string}>
  route: string
}): Promise<TResult> {
  const formData = new FormData()

  for (const file of files) {
    const bytes = await readFile(file.path)
    formData.set(file.field, new Blob([new Uint8Array(bytes)]), basename(file.path))
  }

  let response: Response
  try {
    response = await fetch(`${endpoint}${route}`, {
      body: formData,
      method: 'POST',
    })
  } catch (error) {
    throw new FilepacksError(
      `Unable to reach preview endpoint: ${endpoint}`,
      'Check --endpoint and confirm the private web app is running.',
      {cause: error},
    )
  }

  let json: TResult
  try {
    json = await response.json() as TResult
  } catch (error) {
    throw new FilepacksError(
      `Preview endpoint returned a non-JSON response: ${endpoint}`,
      'Use the private web app preview artifact endpoint.',
      {cause: error},
    )
  }

  return json
}

function basename(path: string): string {
  return path.split(/[\\/]/).pop() ?? path
}

async function openUrl(url: string): Promise<boolean> {
  const opener =
    platform() === 'darwin'
      ? {command: 'open', args: [url]}
      : platform() === 'win32'
        ? {command: 'cmd', args: ['/c', 'start', '', url]}
        : {command: 'xdg-open', args: [url]}

  return await new Promise(resolveOpen => {
    const child = spawn(opener.command, opener.args, {
      detached: true,
      stdio: 'ignore',
    })
    child.once('error', () => resolveOpen(false))
    child.once('spawn', () => {
      child.unref()
      resolveOpen(true)
    })
  })
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
