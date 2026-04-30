import {compareArtifacts, type StructuralCompareArtifactsResult} from './compare-artifacts.js'
import {collectSourceFiles, deriveArtifactName, resolveAndValidateArtifactPath, resolveAndValidateInputDirectory} from './fs.js'
import {hashFileSHA256} from './hash.js'
import {buildManifest, serializeManifest, type Manifest} from './manifest.js'
import {readArtifact, type ReadArtifactResult} from './read-artifact.js'
import {verifyArtifact, type VerifyArtifactResult} from './verify-artifact.js'
import {writeDeterministicArchive} from './archive.js'

export type PackInput = {
  input: string
  name?: string
  output: string
}

export type PackResult = {
  artifactDigest: string
  inputDirectory: string
  manifest: Manifest
  outputPath: string
}

export type InspectInput = {
  artifact: string
}

export type CompareInput = {
  baseline: string
  candidate: string
}

export async function pack(input: PackInput): Promise<PackResult> {
  const inputDirectory = await resolveAndValidateInputDirectory(input.input)
  const sourceFiles = await collectSourceFiles(inputDirectory)
  const manifestFiles = await Promise.all(sourceFiles.map(async file => ({
    hash: await hashFileSHA256(file.absolutePath),
    path: file.relativePath,
    size: file.size,
  })))
  const manifest = buildManifest(deriveArtifactName(inputDirectory, input.name), manifestFiles)

  await writeDeterministicArchive({
    files: sourceFiles,
    manifestBytes: serializeManifest(manifest),
    outputPath: input.output,
  })

  return {
    artifactDigest: await hashFileSHA256(input.output),
    inputDirectory,
    manifest,
    outputPath: input.output,
  }
}

export async function inspect(input: InspectInput): Promise<ReadArtifactResult> {
  const artifactPath = await resolveAndValidateArtifactPath(input.artifact)
  return readArtifact(artifactPath)
}

export async function verify(input: InspectInput): Promise<VerifyArtifactResult> {
  const artifactPath = await resolveAndValidateArtifactPath(input.artifact)
  return verifyArtifact(artifactPath)
}

export async function compare(input: CompareInput): Promise<StructuralCompareArtifactsResult> {
  const baselinePath = await resolveAndValidateArtifactPath(input.baseline)
  const candidatePath = await resolveAndValidateArtifactPath(input.candidate)
  const baseline = await readArtifact(baselinePath)
  const candidate = await readArtifact(candidatePath)

  return compareArtifacts({
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
}
