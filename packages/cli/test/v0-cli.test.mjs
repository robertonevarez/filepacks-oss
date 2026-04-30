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
    '  inspect    Read artifact metadata and file list',
    '  verify     Validate artifact integrity',
    '  compare    Show differences between two artifacts',
    '',
    'Example:',
    '  filepacks pack ./run --output run.fpk',
    '',
  ].join('\n')

  for (const args of [['--help'], ['-h'], ['help']]) {
    const result = await run(args)
    assert.equal(result.exitCode, 0)
    assert.equal(result.stderr, undefined)
    assert.equal(result.stdout, expected)
  }
})
