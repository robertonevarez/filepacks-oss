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
        'Notes:',
        '  Exit 20 means the artifacts differ, not that the CLI crashed.',
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
