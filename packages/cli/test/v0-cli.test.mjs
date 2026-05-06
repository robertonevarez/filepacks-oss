import assert from 'node:assert/strict'
import {mkdir, mkdtemp, rm, writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import test from 'node:test'

import {run} from '../dist/index.js'

test('pack inspect verify compare v0 roundtrip', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'filepacks-v0-cli-'))
  try {
    const input = join(tempRoot, 'input')
    const artifact = join(tempRoot, 'artifact.fpk')
    await mkdir(input, {recursive: true})
    await writeFile(join(input, 'hello.txt'), 'hello\n')

    const pack = await run(['pack', input, '--output', artifact])
    assert.equal(pack.exitCode, 0)
    assert.match(pack.stdout, /^Pack\n/m)

    const inspect = await run(['inspect', artifact])
    assert.equal(inspect.exitCode, 0)
    assert.match(inspect.stdout, /files=1\n/)

    const verify = await run(['verify', artifact])
    assert.equal(verify.exitCode, 0)
    assert.match(verify.stdout, /ok=true\n/)

    const compare = await run(['compare', artifact, artifact])
    assert.equal(compare.exitCode, 0)
    assert.match(compare.stdout, /ok=true\n/)
  } finally {
    await rm(tempRoot, {force: true, recursive: true})
  }
})

test('pack inspect verify compare support parseable json output', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'filepacks-v0-cli-json-'))
  try {
    const input = join(tempRoot, 'input')
    const artifact = join(tempRoot, 'artifact.fpk')
    await mkdir(input, {recursive: true})
    await writeFile(join(input, 'hello.txt'), 'hello\n')

    const pack = await run(['pack', input, '--output', artifact, '--json'])
    assert.equal(pack.exitCode, 0)
    const packJson = JSON.parse(pack.stdout)
    assert.equal(packJson.command, 'pack')
    assert.equal(packJson.ok, true)
    assert.equal(packJson.inputDirectory, input)
    assert.equal(packJson.outputPath, artifact)
    assert.equal(packJson.artifact.name, 'input')
    assert.match(packJson.artifact.digest, /^sha256:[a-f0-9]{64}$/)
    assert.equal(packJson.artifact.fileCount, 1)
    assert.equal(packJson.artifact.totalBytes, 6)

    const inspect = await run(['inspect', artifact, '--json'])
    assert.equal(inspect.exitCode, 0)
    const inspectJson = JSON.parse(inspect.stdout)
    assert.equal(inspectJson.command, 'inspect')
    assert.equal(inspectJson.ok, true)
    assert.equal(inspectJson.path, artifact)
    assert.equal(inspectJson.artifact.name, 'input')
    assert.equal(inspectJson.artifact.formatVersion, 1)
    assert.equal(inspectJson.artifact.fileCount, 1)

    const verify = await run(['verify', artifact, '--json'])
    assert.equal(verify.exitCode, 0)
    const verifyJson = JSON.parse(verify.stdout)
    assert.equal(verifyJson.command, 'verify')
    assert.equal(verifyJson.ok, true)
    assert.equal(verifyJson.path, artifact)
    assert.equal(verifyJson.filesChecked, 1)
    assert.deepEqual(verifyJson.mismatches, [])

    const compare = await run(['compare', artifact, artifact, '--json'])
    assert.equal(compare.exitCode, 0)
    const compareJson = JSON.parse(compare.stdout)
    assert.equal(compareJson.command, 'compare')
    assert.equal(compareJson.ok, true)
    assert.equal(compareJson.baseline, artifact)
    assert.equal(compareJson.candidate, artifact)
    assert.deepEqual(compareJson.summary, {added: 0, changed: 0, removed: 0})
    assert.deepEqual(compareJson.files, {added: [], changed: [], removed: []})
  } finally {
    await rm(tempRoot, {force: true, recursive: true})
  }
})

test('compare exits 20 when artifacts differ', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'filepacks-v0-cli-diff-'))
  try {
    const leftInput = join(tempRoot, 'left-input')
    const rightInput = join(tempRoot, 'right-input')
    const left = join(tempRoot, 'left.fpk')
    const right = join(tempRoot, 'right.fpk')
    await mkdir(leftInput, {recursive: true})
    await mkdir(rightInput, {recursive: true})
    await writeFile(join(leftInput, 'hello.txt'), 'hello\n')
    await writeFile(join(rightInput, 'hello.txt'), 'HELLO\n')

    assert.equal((await run(['pack', leftInput, '--output', left])).exitCode, 0)
    assert.equal((await run(['pack', rightInput, '--output', right])).exitCode, 0)

    const compare = await run(['compare', left, right])
    assert.equal(compare.exitCode, 20)
    assert.match(compare.stdout, /changed=1\n/)
    assert.match(compare.stdout, /changed_file=hello\.txt\n/)
  } finally {
    await rm(tempRoot, {force: true, recursive: true})
  }
})

test('compare json exits 20 and reports changed files when artifacts differ', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'filepacks-v0-cli-json-diff-'))
  try {
    const leftInput = join(tempRoot, 'left-input')
    const rightInput = join(tempRoot, 'right-input')
    const left = join(tempRoot, 'left.fpk')
    const right = join(tempRoot, 'right.fpk')
    await mkdir(leftInput, {recursive: true})
    await mkdir(rightInput, {recursive: true})
    await writeFile(join(leftInput, 'hello.txt'), 'hello\n')
    await writeFile(join(rightInput, 'hello.txt'), 'HELLO\n')

    assert.equal((await run(['pack', leftInput, '--output', left])).exitCode, 0)
    assert.equal((await run(['pack', rightInput, '--output', right])).exitCode, 0)

    const compare = await run(['compare', left, right, '--json'])
    assert.equal(compare.exitCode, 20)
    const json = JSON.parse(compare.stdout)
    assert.equal(json.ok, false)
    assert.deepEqual(json.summary, {added: 0, changed: 1, removed: 0})
    assert.deepEqual(json.files.changed, ['hello.txt'])
  } finally {
    await rm(tempRoot, {force: true, recursive: true})
  }
})

test('json errors are parseable and keep exit code 1', async () => {
  const result = await run(['inspect', 'missing.fpk', '--json'])

  assert.equal(result.exitCode, 1)
  assert.equal(result.stderr, undefined)
  const json = JSON.parse(result.stdout)
  assert.equal(json.command, 'inspect')
  assert.equal(json.ok, false)
  assert.equal(typeof json.error.message, 'string')
  assert.equal(typeof json.error.code, 'string')
})

test('rejects non-v0 commands', async () => {
  for (const command of ['show', 'list', 'tag', 'unpack', 'history', 'events', 'import', 'registry', 'baseline']) {
    const result = await run([command])

    assert.equal(result.exitCode, 1)
    assert.match(result.stderr, new RegExp(`Unknown command: ${command}`))
  }
})

test('help entrypoints return stable output and exit 0', async () => {
  const expected = [
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

  for (const args of [[], ['--help'], ['-h'], ['help']]) {
    const result = await run(args)
    assert.equal(result.exitCode, 0)
    assert.equal(result.stderr, undefined)
    assert.equal(result.stdout, expected)
  }
})

test('command-specific help entrypoints exit 0', async () => {
  const expectations = new Map([
    [
      'pack',
      [
        'filepacks pack — create a deterministic .fpk artifact from a directory',
        'Usage:',
        '  filepacks pack <input> --output <file>',
        'Flags:',
        '  --output <file>   Required output path ending in .fpk',
        '  --json            Print structured JSON for agents and automation',
        'Example:',
        '  npx filepacks pack ./agent-run --output ./agent-run.fpk',
      ],
    ],
    [
      'inspect',
      [
        'filepacks inspect — summarize an artifact without verifying integrity',
        'Usage:',
        '  filepacks inspect <file>',
        'Flags:',
        '  --json            Print structured JSON for agents and automation',
        'Notes:',
        '  Run `filepacks verify <file>` before trusting or comparing an artifact.',
      ],
    ],
    [
      'verify',
      [
        'filepacks verify — check artifact integrity against the manifest',
        'Usage:',
        '  filepacks verify <file>',
        'Flags:',
        '  --json            Print structured JSON for agents and automation',
        'Exit behavior:',
        '  0   Artifact is valid',
      ],
    ],
    [
      'compare',
      [
        'filepacks compare — structurally compare two artifacts',
        'Usage:',
        '  filepacks compare <baseline> <candidate>',
        'Flags:',
        '  --json            Print structured JSON for agents and automation',
        'Notes:',
        '  Exit 20 means the artifacts differ, not that the CLI crashed.',
      ],
    ],
    [
      'push',
      [
        'filepacks push — send .fpk artifacts to a temporary review endpoint',
        'Usage:',
        '  filepacks push <artifact> --endpoint <url> [--open] [--json]',
        '  filepacks push <baseline> <candidate> --endpoint <url> [--open] [--json]',
        'Flags:',
        '  --endpoint <url>  Required preview endpoint such as http://localhost:3000',
        'Notes:',
        '  Artifacts are processed by the preview API for the request and are not stored.',
      ],
    ],
  ])

  for (const [command, snippets] of expectations) {
    for (const helpFlag of ['--help', '-h']) {
      const result = await run([command, helpFlag])
      assert.equal(result.exitCode, 0)
      assert.equal(result.stderr, undefined)
      for (const snippet of snippets) {
        assert.match(result.stdout, new RegExp(escapeRegExp(snippet)))
      }
    }
  }
})

test('push validates endpoint and artifact arguments', async () => {
  const missingEndpoint = await run(['push', 'candidate.fpk'])
  assert.equal(missingEndpoint.exitCode, 1)
  assert.match(missingEndpoint.stderr, /Usage: filepacks push <artifact> --endpoint <url>/)

  const invalidEndpoint = await run(['push', 'candidate.fpk', '--endpoint', 'localhost:3000', '--json'])
  assert.equal(invalidEndpoint.exitCode, 1)
  const json = JSON.parse(invalidEndpoint.stdout)
  assert.equal(json.command, 'push')
  assert.equal(json.ok, false)
  assert.equal(json.error.code, 'invalid_endpoint')
})

test('push sends one artifact to temporary verify endpoint with json output', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'filepacks-v0-cli-push-single-'))
  const endpoint = 'http://preview.example'
  const fetchMock = mockFetch({
    filesChecked: 1,
    mismatches: [],
    ok: true,
    operation: 'verify',
    preview: true,
  })

  try {
    const input = join(tempRoot, 'candidate-output')
    const artifact = join(tempRoot, 'candidate.fpk')
    await mkdir(input, {recursive: true})
    await writeFile(join(input, 'result.txt'), 'ok\n')
    assert.equal((await run(['pack', input, '--output', artifact])).exitCode, 0)

    const result = await withFetchMock(fetchMock, () =>
      run(['push', artifact, '--endpoint', endpoint, '--json']),
    )
    assert.equal(result.exitCode, 0)
    assert.equal(fetchMock.calls.length, 1)
    assert.equal(fetchMock.calls[0].url, `${endpoint}/api/preview/artifacts/verify`)
    assert.equal(fetchMock.calls[0].method, 'POST')
    assert.deepEqual(fetchMock.calls[0].fields, ['artifact'])

    const json = JSON.parse(result.stdout)
    assert.equal(json.command, 'push')
    assert.equal(json.ok, true)
    assert.equal(json.mode, 'temporary_review')
    assert.equal(json.stored, false)
    assert.equal(json.endpoint, endpoint)
    assert.equal(json.opened, false)
    const payload = decodeReviewUrl(json.reviewUrl)
    assert.equal(payload.type, 'single_artifact_review')
    assert.equal(payload.stored, false)
    assert.equal(payload.artifact.name, 'candidate-output')
    assert.deepEqual(payload.verification, {filesChecked: 1, mismatches: [], ok: true})
  } finally {
    await rm(tempRoot, {force: true, recursive: true})
  }
})

test('push sends baseline and candidate to temporary compare endpoint', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'filepacks-v0-cli-push-compare-'))
  const endpoint = 'http://preview.example'
  const fetchMock = mockFetch({
    files: {
      added: ['added.txt'],
      changed: ['changed.txt'],
      removed: ['removed.txt'],
    },
    ok: false,
    operation: 'compare',
    preview: true,
    summary: {
      added: 1,
      changed: 1,
      removed: 1,
    },
  })

  try {
    const baselineInput = join(tempRoot, 'baseline-output')
    const candidateInput = join(tempRoot, 'candidate-output')
    const baseline = join(tempRoot, 'baseline.fpk')
    const candidate = join(tempRoot, 'candidate.fpk')
    await mkdir(baselineInput, {recursive: true})
    await mkdir(candidateInput, {recursive: true})
    await writeFile(join(baselineInput, 'changed.txt'), 'old\n')
    await writeFile(join(baselineInput, 'removed.txt'), 'remove\n')
    await writeFile(join(candidateInput, 'changed.txt'), 'new\n')
    await writeFile(join(candidateInput, 'added.txt'), 'added\n')
    assert.equal((await run(['pack', baselineInput, '--output', baseline])).exitCode, 0)
    assert.equal((await run(['pack', candidateInput, '--output', candidate])).exitCode, 0)

    const result = await withFetchMock(fetchMock, () =>
      run(['push', baseline, candidate, '--endpoint', endpoint]),
    )
    assert.equal(result.exitCode, 0)
    assert.equal(fetchMock.calls.length, 1)
    assert.equal(fetchMock.calls[0].url, `${endpoint}/api/preview/artifacts/compare`)
    assert.equal(fetchMock.calls[0].method, 'POST')
    assert.deepEqual(fetchMock.calls[0].fields, ['baseline', 'candidate'])
    assert.match(result.stdout, /mode=temporary_compare_review\n/)
    assert.match(result.stdout, /stored=false\n/)
    assert.match(result.stdout, /added=1\n/)
    assert.match(result.stdout, /changed=1\n/)
    assert.match(result.stdout, /removed=1\n/)

    const reviewUrl = result.stdout.match(/review_url=(.+)\n/)?.[1]
    assert.ok(reviewUrl)
    const payload = decodeReviewUrl(reviewUrl)
    assert.equal(payload.type, 'artifact_compare_review')
    assert.equal(payload.stored, false)
    assert.deepEqual(payload.comparison.summary, {added: 1, changed: 1, removed: 1})
    assert.deepEqual(payload.comparison.files.changed, ['changed.txt'])
  } finally {
    await rm(tempRoot, {force: true, recursive: true})
  }
})

test('pack rejects output paths without .fpk extension', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'filepacks-v0-cli-output-extension-'))
  try {
    const input = join(tempRoot, 'input')
    await mkdir(input, {recursive: true})
    await writeFile(join(input, 'hello.txt'), 'hello\n')

    const result = await run(['pack', input, '--output', join(tempRoot, 'artifact')])
    assert.equal(result.exitCode, 1)
    assert.match(result.stderr, /Output path must end with \.fpk:/)
    assert.match(result.stderr, /Provide an output path ending in \.fpk\./)
  } finally {
    await rm(tempRoot, {force: true, recursive: true})
  }
})

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function mockFetch(payload) {
  const calls = []
  const fetch = async (url, init) => {
    calls.push({
      fields: Array.from(init.body.keys()),
      method: init.method,
      url: String(url),
    })

    return {
      json: async () => payload,
    }
  }

  fetch.calls = calls
  return fetch
}

async function withFetchMock(fetchMock, callback) {
  const originalFetch = globalThis.fetch
  globalThis.fetch = fetchMock
  try {
    return await callback()
  } finally {
    globalThis.fetch = originalFetch
  }
}

function decodeReviewUrl(reviewUrl) {
  const encoded = new URL(reviewUrl).hash.replace(/^#review=/, '')
  return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
}
