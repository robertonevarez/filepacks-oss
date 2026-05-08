import {compareArtifacts, type StructuralCompareArtifactsResult} from './compare-artifacts.js'
import {resolveAndValidateArtifactPath} from './fs.js'
import type {Manifest} from './manifest.js'
import {readArtifact} from './read-artifact.js'
import {verifyArtifact, type VerificationMismatch} from './verify-artifact.js'

export type ReviewDecision = 'approved' | 'rejected' | 'needs_review'
export type ReviewConfidence = 'low' | 'medium' | 'high'

export type RunEvidenceReviewInput = {
  confidence?: ReviewConfidence
  decision?: ReviewDecision
  endedAt?: string
  reusableByAnotherAgent?: boolean
  startedAt?: string
}

export type MeasureRunEvidenceInput = {
  baseline?: string
  candidate: string
  expectedEvidencePaths?: string[]
  review?: RunEvidenceReviewInput
}

export type RunEvidenceMeasurement = {
  baseline?: {
    digest: string
    name: string
    path: string
  }
  candidate: {
    digest: string
    fileCount: number
    name: string
    path: string
    totalBytes: number
  }
  comparison?: {
    added: number
    changed: number
    ok: boolean
    removed: number
    totalChangedFiles: number
  }
  evidence: {
    expected: string[]
    missing: string[]
    missingCount: number
    present: string[]
    presentCount: number
  }
  review?: RunEvidenceReviewMeasurement
  verification: {
    filesChecked: number
    mismatchCount: number
    mismatches: VerificationMismatch[]
    ok: boolean
  }
}

export type RunEvidenceReviewMeasurement = {
  confidence?: ReviewConfidence
  decision?: ReviewDecision
  durationMs?: number
  endedAt?: string
  reusableByAnotherAgent?: boolean
  startedAt?: string
}

export async function measureRunEvidence(input: MeasureRunEvidenceInput): Promise<RunEvidenceMeasurement> {
  const candidatePath = await resolveAndValidateArtifactPath(input.candidate)
  const baselinePath = input.baseline
    ? await resolveAndValidateArtifactPath(input.baseline)
    : undefined
  const [candidate, verification] = await Promise.all([
    readArtifact(candidatePath),
    verifyArtifact(candidatePath),
  ])

  const comparison = baselinePath
    ? await compareAgainstBaseline({
      baselinePath,
      candidateDigest: candidate.artifactDigest,
      candidateManifest: candidate.manifest,
      candidatePath,
    })
    : undefined

  return {
    baseline: comparison?.baseline,
    candidate: {
      digest: candidate.artifactDigest,
      fileCount: candidate.manifest.file_count,
      name: candidate.manifest.artifact_name,
      path: candidatePath,
      totalBytes: candidate.manifest.total_bytes,
    },
    comparison: comparison?.summary,
    evidence: summarizeEvidence(candidate.manifest, input.expectedEvidencePaths ?? []),
    review: input.review ? summarizeReview(input.review) : undefined,
    verification: {
      filesChecked: verification.file_count_checked ?? 0,
      mismatchCount: verification.mismatches.length,
      mismatches: verification.mismatches,
      ok: verification.ok,
    },
  }
}

async function compareAgainstBaseline(input: {
  baselinePath: string
  candidateDigest: string
  candidateManifest: Manifest
  candidatePath: string
}): Promise<{
  baseline: RunEvidenceMeasurement['baseline']
  summary: RunEvidenceMeasurement['comparison']
}> {
  const baseline = await readArtifact(input.baselinePath)
  const comparison: StructuralCompareArtifactsResult = compareArtifacts({
    left: {
      artifactDigest: baseline.artifactDigest,
      manifest: baseline.manifest,
      path: input.baselinePath,
    },
    right: {
      artifactDigest: input.candidateDigest,
      manifest: input.candidateManifest,
      path: input.candidatePath,
    },
  })

  return {
    baseline: {
      digest: baseline.artifactDigest,
      name: baseline.manifest.artifact_name,
      path: input.baselinePath,
    },
    summary: {
      added: comparison.summary.added,
      changed: comparison.summary.changed,
      ok: comparison.ok,
      removed: comparison.summary.removed,
      totalChangedFiles:
        comparison.summary.added +
        comparison.summary.changed +
        comparison.summary.removed,
    },
  }
}

function summarizeEvidence(manifest: Manifest, expectedPaths: string[]): RunEvidenceMeasurement['evidence'] {
  const artifactPaths = new Set(manifest.files.map(file => file.path))
  const expected = [...expectedPaths]
  const present = expected.filter(path => artifactPaths.has(path))
  const missing = expected.filter(path => !artifactPaths.has(path))

  return {
    expected,
    missing,
    missingCount: missing.length,
    present,
    presentCount: present.length,
  }
}

function summarizeReview(review: RunEvidenceReviewInput): RunEvidenceReviewMeasurement {
  const durationMs = computeDurationMs(review.startedAt, review.endedAt)

  return {
    confidence: review.confidence,
    decision: review.decision,
    durationMs,
    endedAt: review.endedAt,
    reusableByAnotherAgent: review.reusableByAnotherAgent,
    startedAt: review.startedAt,
  }
}

function computeDurationMs(startedAt: string | undefined, endedAt: string | undefined): number | undefined {
  if (!startedAt || !endedAt) return undefined

  const started = Date.parse(startedAt)
  const ended = Date.parse(endedAt)
  if (!Number.isFinite(started) || !Number.isFinite(ended) || ended < started) return undefined

  return ended - started
}
