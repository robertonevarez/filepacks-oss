import {hashBufferSHA256} from './hash.js'
import {computePayloadDigest, type ManifestFile} from './manifest.js'
import {ArtifactReadError, readArtifact} from './read-artifact.js'

export type VerificationMismatchCode =
  | 'archive_malformed'
  | 'digest_mismatch'
  | 'hash_mismatch'
  | 'manifest_invalid'
  | 'missing_payload_file'
  | 'size_mismatch'
  | 'unexpected_payload_file'

export type VerificationMismatch = {
  actual?: number | string
  code: VerificationMismatchCode
  expected?: number | string
  message: string
  path?: string
}

export type VerifyArtifactResult = {
  'artifact_name'?: string
  'artifact_path': string
  digest?: string
  'file_count_checked'?: number
  mismatches: VerificationMismatch[]
  ok: boolean
}

export async function verifyArtifact(artifactPath: string): Promise<VerifyArtifactResult> {
  try {
    const {artifactDigest, manifest, payloadFiles} = await readArtifact(artifactPath)

    const payloadByPath = new Map(
      [...payloadFiles].sort((left, right) => left.path.localeCompare(right.path)).map(file => [
        file.path,
        {
          hash: hashBufferSHA256(file.content),
          size: file.size,
        },
      ]),
    )

    const expectedByPath = new Map(manifest.files.map(file => [file.path, file]))
    const mismatches: VerificationMismatch[] = []

    for (const expectedFile of [...manifest.files].sort((left, right) => left.path.localeCompare(right.path))) {
      const actualFile = payloadByPath.get(expectedFile.path)
      if (!actualFile) {
        mismatches.push({
          code: 'missing_payload_file',
          message: `Missing payload file: ${expectedFile.path}`,
          path: expectedFile.path,
        })
        continue
      }

      if (actualFile.size !== expectedFile.size) {
        mismatches.push({
          actual: actualFile.size,
          code: 'size_mismatch',
          expected: expectedFile.size,
          message: `Size mismatch for: ${expectedFile.path}`,
          path: expectedFile.path,
        })
      }

      if (actualFile.hash !== expectedFile.hash) {
        mismatches.push({
          actual: actualFile.hash,
          code: 'hash_mismatch',
          expected: expectedFile.hash,
          message: `Hash mismatch for: ${expectedFile.path}`,
          path: expectedFile.path,
        })
      }
    }

    for (const actualPath of [...payloadByPath.keys()].sort((left, right) => left.localeCompare(right))) {
      if (expectedByPath.has(actualPath)) continue

      mismatches.push({
        code: 'unexpected_payload_file',
        message: `Unexpected payload file: ${actualPath}`,
        path: actualPath,
      })
    }

    const payloadDigest = computePayloadDigest(
      Array.from(payloadByPath, ([path, value]): ManifestFile => ({
        hash: value.hash,
        path,
        size: value.size,
      })),
    )

    if (payloadDigest !== manifest.payload_digest) {
      mismatches.push({
        actual: payloadDigest,
        code: 'digest_mismatch',
        expected: manifest.payload_digest,
        message: 'Payload digest mismatch.',
      })
    }

    return {
      'artifact_name': manifest.artifact_name,
      'artifact_path': artifactPath,
      digest: artifactDigest,
      'file_count_checked': manifest.files.length,
      mismatches,
      ok: mismatches.length === 0,
    }
  } catch (error) {
    if (error instanceof ArtifactReadError) {
      const code = error.code === 'manifest_missing' || error.code === 'manifest_invalid' ? 'manifest_invalid' : 'archive_malformed'
      return {
        'artifact_path': artifactPath,
        mismatches: [
          {
            code,
            message: error.message,
          },
        ],
        ok: false,
      }
    }

    throw error
  }
}
