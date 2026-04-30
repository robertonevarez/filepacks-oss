import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {mkdir, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import test from 'node:test'
import {pipeline} from 'node:stream/promises'
import tar from 'tar-stream'

import {
  inspect,
  pack,
  verify,
} from '../dist/index.js'

const VALID_EXAMPLE_DIGEST = 'a35179c718785730d16677f9775a76d2a76ac3f990e5d5f595bba9c1d6b29a72'

test('writes byte-for-byte identical archives for identical logical input', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'filepacks-core-determinism-'))
  try {
    const first = join(tempRoot, 'first.fpk')
    const second = join(tempRoot, 'second.fpk')
    const inputDirectory = await writeGoldenInputDirectory(tempRoot)

    await pack({input: inputDirectory, output: first})
    await pack({input: inputDirectory, output: second})

    assert.deepEqual(await readFile(first), await readFile(second))
  } finally {
    await rm(tempRoot, {force: true, recursive: true})
  }
})

test('writes cross-platform deterministic archives independent of caller file order', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'filepacks-core-cross-platform-'))
  try {
    const posixOrder = join(tempRoot, 'posix.fpk')
    const platformOrder = join(tempRoot, 'platform.fpk')
    const inputDirectory = await writeGoldenInputDirectory(tempRoot)

    await pack({input: inputDirectory, output: posixOrder})
    await pack({input: inputDirectory, output: platformOrder})

    assert.deepEqual(await readFile(posixOrder), await readFile(platformOrder))
  } finally {
    await rm(tempRoot, {force: true, recursive: true})
  }
})

test('keeps the minimal valid example artifact byte-stable and verifiable', async () => {
  const artifactPath = new URL('../../../spec/examples/valid-minimal.fpk', import.meta.url)
  const bytes = await readFile(artifactPath)
  const result = await verify({artifact: artifactPath.pathname})
  const artifact = await inspect({artifact: artifactPath.pathname})

  assert.equal(hashBufferSHA256(bytes), VALID_EXAMPLE_DIGEST)
  assert.equal(result.ok, true)
  assert.equal(artifact.artifactDigest, VALID_EXAMPLE_DIGEST)
  assert.equal(artifact.manifest.artifact_name, 'valid-minimal')
})

test('keeps the minimal invalid example artifact readable but unverifiable', async () => {
  const artifactPath = new URL('../../../spec/examples/invalid-payload-digest.fpk', import.meta.url)
  const result = await verify({artifact: artifactPath.pathname})

  assert.equal(result.ok, false)
  assert.equal(result.mismatches.some(mismatch => mismatch.code === 'digest_mismatch'), true)
})

test('rejects unsupported generic manifest format versions', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'filepacks-core-format-version-'))
  try {
    const artifactPath = join(tempRoot, 'unsupported.fpk')
    const manifest = {
      artifact_name: 'golden',
      created_with: 'filepacks',
      file_count: 2,
      files: [
        {
          hash: hashBufferSHA256(Buffer.from('alpha\n', 'utf8')),
          path: 'a/alpha.txt',
          size: 6,
        },
        {
          hash: hashBufferSHA256(Buffer.from('bravo\n', 'utf8')),
          path: 'b/bravo.txt',
          size: 6,
        },
      ],
      format_version: 2,
      payload_digest: hashBufferSHA256('invalid'),
      total_bytes: 12,
    }

    await writeTarArchive(artifactPath, [
      {content: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, 'utf8'), name: 'manifest.json'},
      {content: Buffer.from('alpha\n', 'utf8'), name: 'payload/a/alpha.txt'},
      {content: Buffer.from('bravo\n', 'utf8'), name: 'payload/b/bravo.txt'},
    ])

    const result = await verify({artifact: artifactPath})

    assert.equal(result.ok, false)
    assert.equal(result.mismatches.some(mismatch => mismatch.code === 'manifest_invalid'), true)
  } finally {
    await rm(tempRoot, {force: true, recursive: true})
  }
})

test('rejects archives where manifest.json is not the first entry', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'filepacks-core-manifest-first-'))
  try {
    const artifactPath = join(tempRoot, 'manifest-second.fpk')
    await writeTarArchive(artifactPath, [
      {content: Buffer.from('alpha\n', 'utf8'), name: 'payload/a/alpha.txt'},
      {content: Buffer.from('{\n  "format_version": 1\n}\n', 'utf8'), name: 'manifest.json'},
    ])

    const result = await verify({artifact: artifactPath})

    assert.equal(result.ok, false)
    assert.deepEqual(result.mismatches, [
      {
        code: 'archive_malformed',
        message: 'Artifact manifest.json must be the first archive entry.',
      },
    ])
  } finally {
    await rm(tempRoot, {force: true, recursive: true})
  }
})

test('rejects malformed non-file tar entries deterministically', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'filepacks-core-malformed-entry-'))
  try {
    const artifactPath = join(tempRoot, 'directory-entry.fpk')
    const pack = tar.pack()
    const output = (await import('node:fs')).createWriteStream(artifactPath)
    const finalize = pipeline(pack, output)

    await addTarEntry(pack, {content: Buffer.from('{\n  "format_version": 1\n}\n', 'utf8'), name: 'manifest.json'})
    await new Promise((resolve, reject) => {
      pack.entry(
        {
          gid: 0,
          gname: '',
          mode: 0o755,
          mtime: new Date(0),
          name: 'payload/a',
          type: 'directory',
          uid: 0,
          uname: '',
        },
        error => {
          if (error) reject(error)
          else resolve()
        },
      )
    })
    pack.finalize()
    await finalize

    const result = await verify({artifact: artifactPath})

    assert.equal(result.ok, false)
    assert.deepEqual(result.mismatches, [
      {
        code: 'archive_malformed',
        message: 'Unsupported archive entry type: directory',
      },
    ])
  } finally {
    await rm(tempRoot, {force: true, recursive: true})
  }
})

async function writeGoldenInputDirectory(tempRoot) {
  const inputDirectory = join(tempRoot, 'input')
  await mkdir(join(inputDirectory, 'a'), {recursive: true})
  await mkdir(join(inputDirectory, 'b'), {recursive: true})
  await writeFile(join(inputDirectory, 'a/alpha.txt'), 'alpha\n', 'utf8')
  await writeFile(join(inputDirectory, 'b/bravo.txt'), 'bravo\n', 'utf8')
  return inputDirectory
}

async function writeTarArchive(artifactPath, entries) {
  const pack = tar.pack()
  const output = (await import('node:fs')).createWriteStream(artifactPath)
  const finalize = pipeline(pack, output)

  for (const entry of entries) {
    // eslint-disable-next-line no-await-in-loop
    await addTarEntry(pack, entry)
  }

  pack.finalize()
  await finalize
}

async function addTarEntry(pack, entry) {
  await new Promise((resolve, reject) => {
    pack.entry(
      {
        gid: 0,
        gname: '',
        mode: 0o644,
        mtime: new Date(0),
        name: entry.name,
        size: entry.content.length,
        uid: 0,
        uname: '',
      },
      entry.content,
      error => {
        if (error) reject(error)
        else resolve()
      },
    )
  })
}

function hashBufferSHA256(contents) {
  return createHash('sha256').update(contents).digest('hex')
}
