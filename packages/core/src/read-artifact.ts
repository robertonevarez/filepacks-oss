import {readFile} from 'node:fs/promises'
import tar from 'tar-stream'

import {FilepacksError} from './errors.js'
import {hashBufferSHA256} from './hash.js'
import {isNormalizedRelativePath, type Manifest, parseManifest} from './manifest.js'

const MANIFEST_PATH = 'manifest.json'
const PAYLOAD_PREFIX = 'payload/'

type ArchiveEntry = {
  content: Buffer
  name: string
}

export class ArtifactReadError extends FilepacksError {
  readonly code: 'archive_malformed' | 'manifest_invalid' | 'manifest_missing'

  public constructor(
    code: 'archive_malformed' | 'manifest_invalid' | 'manifest_missing',
    message: string,
    hint?: string,
    options?: ErrorOptions,
  ) {
    super(message, hint, options)
    this.name = 'ArtifactReadError'
    this.code = code
  }
}

export type PayloadFile = {
  content: Buffer
  path: string
  size: number
}

export type ReadArtifactResult = {
  archiveDigest: string
  artifactDigest: string
  manifest: Manifest
  payloadFiles: PayloadFile[]
}

export async function readArtifact(artifactPath: string): Promise<ReadArtifactResult> {
  let archiveBytes
  try {
    archiveBytes = await readFile(artifactPath)
  } catch (error) {
    throw new FilepacksError(
      `Unable to read artifact: ${artifactPath}`,
      'Check file permissions and try again.',
      {cause: error as Error},
    )
  }

  const entries = await extractArchiveEntries(archiveBytes)
  const manifestEntries = entries.filter(entry => entry.name === MANIFEST_PATH)

  if (manifestEntries.length === 0) {
    throw new ArtifactReadError(
      'manifest_missing',
      'Artifact is missing manifest.json.',
      'Recreate the artifact with `filepacks pack` and try again.',
    )
  }

  if (manifestEntries.length > 1) {
    throw new ArtifactReadError('archive_malformed', 'Artifact contains multiple manifest.json entries.')
  }

  if (entries[0].name !== MANIFEST_PATH) {
    throw new ArtifactReadError(
      'archive_malformed',
      'Artifact manifest.json must be the first archive entry.',
      'Recreate the artifact with `filepacks pack` and try again.',
    )
  }

  let manifest
  try {
    manifest = parseManifest(manifestEntries[0].content)
  } catch (error) {
    const hint = error instanceof FilepacksError
      ? error.hint
      : 'Recreate the artifact with `filepacks pack` and try again.'

    throw new ArtifactReadError(
      'manifest_invalid',
      `Invalid manifest.json: ${(error as Error).message}`,
      hint,
      {cause: error as Error},
    )
  }

  const payloadFiles = collectPayloadFiles(entries)
  const archiveDigest = hashBufferSHA256(archiveBytes)

  return {
    archiveDigest,
    'artifactDigest': archiveDigest,
    manifest,
    payloadFiles,
  }
}

async function extractArchiveEntries(archiveBytes: Buffer): Promise<ArchiveEntry[]> {
  const extract = tar.extract()
  const entries: ArchiveEntry[] = []

  await new Promise<void>((resolve, reject) => {
    extract.on('entry', (header, stream, next) => {
      if (header.type !== 'file') {
        reject(new ArtifactReadError('archive_malformed', `Unsupported archive entry type: ${header.type}`))
        return
      }

      const chunks: Buffer[] = []
      stream.on('data', (chunk: Buffer) => chunks.push(chunk))
      stream.on('error', error => {
        reject(new ArtifactReadError('archive_malformed', 'Failed while reading artifact contents.', undefined, {cause: error}))
      })
      stream.on('end', () => {
        entries.push({
          content: Buffer.concat(chunks),
          name: header.name,
        })
        next()
      })
      stream.resume()
    })

    extract.on('error', error => {
      reject(new ArtifactReadError('archive_malformed', 'Artifact is malformed and cannot be read.', undefined, {cause: error}))
    })

    extract.on('finish', resolve)
    extract.end(archiveBytes)
  })

  return entries
}

function collectPayloadFiles(entries: ArchiveEntry[]): PayloadFile[] {
  const payloadFiles: PayloadFile[] = []
  const seenPaths = new Set<string>()

  for (const entry of entries) {
    if (entry.name === MANIFEST_PATH) continue

    if (!entry.name.startsWith(PAYLOAD_PREFIX)) {
      throw new ArtifactReadError('archive_malformed', `Unexpected archive entry: ${entry.name}`)
    }

    const relativePath = entry.name.slice(PAYLOAD_PREFIX.length)
    if (!isNormalizedRelativePath(relativePath)) {
      throw new ArtifactReadError('archive_malformed', `Invalid payload path in archive: ${entry.name}`)
    }

    if (seenPaths.has(relativePath)) {
      throw new ArtifactReadError('archive_malformed', `Duplicate payload path in archive: ${relativePath}`)
    }

    seenPaths.add(relativePath)
    payloadFiles.push({
      content: entry.content,
      path: relativePath,
      size: entry.content.length,
    })
  }

  payloadFiles.sort((a, b) => a.path.localeCompare(b.path))
  return payloadFiles
}
