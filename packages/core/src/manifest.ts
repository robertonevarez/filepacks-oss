import {createHash} from 'node:crypto'

import {FilepacksError} from './errors.js'

export const FORMAT_VERSION = 1
const SHA256_HEX_PATTERN = /^[a-f0-9]{64}$/u

export type ManifestFile = {
  hash: string
  path: string
  size: number
}

export type Manifest = {
  'artifact_name': string
  'created_with': 'filepacks'
  'file_count': number
  files: ManifestFile[]
  'format_version': number
  'payload_digest': string
  'total_bytes': number
}

export function buildManifest(name: string, files: ManifestFile[]): Manifest {
  const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path))
  const fileCount = sortedFiles.length
  const totalBytes = sortedFiles.reduce((sum, file) => sum + file.size, 0)
  const payloadDigest = computePayloadDigest(sortedFiles)

  return {
    'artifact_name': name,
    'created_with': 'filepacks',
    'file_count': fileCount,
    files: sortedFiles,
    'format_version': FORMAT_VERSION,
    'payload_digest': payloadDigest,
    'total_bytes': totalBytes,
  }
}

export function serializeManifest(manifest: Manifest): Buffer {
  return Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
}

export function computePayloadDigest(files: ManifestFile[]): string {
  const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path))
  const hash = createHash('sha256')

  for (const file of sortedFiles) {
    hash.update(file.path)
    hash.update('\0')
    hash.update(String(file.size))
    hash.update('\0')
    hash.update(file.hash)
    hash.update('\n')
  }

  return hash.digest('hex')
}

export function parseManifest(manifestBytes: Buffer): Manifest {
  let parsedJson: unknown
  try {
    parsedJson = JSON.parse(manifestBytes.toString('utf8'))
  } catch (error) {
    throw new FilepacksError(
      'manifest.json is not valid JSON.',
      'Recreate the artifact with `filepacks pack` and try again.',
      {cause: error as Error},
    )
  }

  return validateManifest(parsedJson)
}

function validateManifest(value: unknown): Manifest {
  if (!isRecord(value)) {
    throw new FilepacksError(
      'manifest.json must be a JSON object.',
      'Recreate the artifact with `filepacks pack` and try again.',
    )
  }

  if ('schema_version' in value || 'artifact_type' in value) {
    throw new FilepacksError(
      'Typed artifact manifests are not part of the v0 OSS surface.',
      'Use a generic format_version=1 .fpk artifact.',
    )
  }

  const artifactName = value.artifact_name
  const createdWith = value.created_with
  const fileCount = value.file_count
  const filesValue = value.files
  const formatVersion = value.format_version
  const payloadDigest = value.payload_digest
  const totalBytes = value.total_bytes

  if (typeof artifactName !== 'string' || artifactName.trim() === '') {
    throw new FilepacksError('manifest.json field `artifact_name` is invalid.')
  }

  if (createdWith !== 'filepacks') {
    throw new FilepacksError('manifest.json field `created_with` must be `filepacks`.')
  }

  if (!isNonNegativeInteger(fileCount)) {
    throw new FilepacksError('manifest.json field `file_count` is invalid.')
  }

  if (!isNonNegativeInteger(formatVersion) || formatVersion !== FORMAT_VERSION) {
    throw new FilepacksError(
      `Unsupported manifest format version: ${String(formatVersion)}.`,
      'Upgrade filepacks to a version that supports this manifest format, or recreate the artifact with a supported version.',
    )
  }

  if (typeof payloadDigest !== 'string' || !SHA256_HEX_PATTERN.test(payloadDigest)) {
    throw new FilepacksError('manifest.json field `payload_digest` is invalid.')
  }

  if (!isNonNegativeInteger(totalBytes)) {
    throw new FilepacksError('manifest.json field `total_bytes` is invalid.')
  }

  if (!Array.isArray(filesValue)) {
    throw new FilepacksError('manifest.json field `files` must be an array.')
  }

  const files = filesValue.map((fileValue, index) => validateManifestFile(fileValue, index))
  const pathSet = new Set<string>()

  for (const file of files) {
    if (pathSet.has(file.path)) {
      throw new FilepacksError(`manifest.json contains duplicate file path: ${file.path}`)
    }

    pathSet.add(file.path)
  }

  if (files.length !== fileCount) {
    throw new FilepacksError('manifest.json `file_count` does not match files list length.')
  }

  const computedTotalBytes = files.reduce((sum, file) => sum + file.size, 0)
  if (computedTotalBytes !== totalBytes) {
    throw new FilepacksError('manifest.json `total_bytes` does not match files list sizes.')
  }

  const computedDigest = computePayloadDigest(files)
  if (computedDigest !== payloadDigest) {
    throw new FilepacksError('manifest.json `payload_digest` does not match files list entries.')
  }

  return {
    'artifact_name': artifactName,
    'created_with': createdWith,
    'file_count': fileCount,
    files,
    'format_version': formatVersion,
    'payload_digest': payloadDigest,
    'total_bytes': totalBytes,
  }
}

function validateManifestFile(value: unknown, index: number): ManifestFile {
  if (!isRecord(value)) {
    throw new FilepacksError(`manifest.json file entry at index ${index} must be an object.`)
  }

  const {hash, path, size} = value

  if (typeof path !== 'string' || !isNormalizedRelativePath(path)) {
    throw new FilepacksError(`manifest.json file entry path is invalid: ${String(path)}`)
  }

  if (!isNonNegativeInteger(size)) {
    throw new FilepacksError(`manifest.json file entry size is invalid for: ${path}`)
  }

  if (typeof hash !== 'string' || !SHA256_HEX_PATTERN.test(hash)) {
    throw new FilepacksError(`manifest.json file entry hash is invalid for: ${path}`)
  }

  return {hash, path, size}
}

export function isNormalizedRelativePath(value: string): boolean {
  if (value.length === 0) return false
  if (value.startsWith('/')) return false
  if (value.includes('\\')) return false
  if (value.includes('//')) return false

  const segments = value.split('/')
  return !segments.some(segment => segment.length === 0 || segment === '.' || segment === '..')
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
