import type {VerificationMismatch} from './verify-artifact.js'

export type ArtifactSummary = {
  digest: `sha256:${string}`
  fileCount: number
  formatVersion?: number
  name: string
  totalBytes: number
}

export type ArtifactJsonError = {
  code: string
  hint?: string
  message: string
}

export type PackJsonResult =
  | {
      artifact: ArtifactSummary
      command: 'pack'
      inputDirectory: string
      ok: true
      outputPath: string
    }
  | {
      command: 'pack'
      error: ArtifactJsonError
      ok: false
    }

export type InspectJsonResult =
  | {
      artifact: ArtifactSummary & {
        formatVersion: number
      }
      command: 'inspect'
      ok: true
      path: string
    }
  | {
      command: 'inspect'
      error: ArtifactJsonError
      ok: false
    }

export type VerifyJsonResult =
  | {
      command: 'verify'
      filesChecked: number
      mismatches: VerificationMismatch[]
      ok: boolean
      path?: string
    }
  | {
      command: 'verify'
      error: ArtifactJsonError
      ok: false
    }

export type CompareJsonResult =
  | {
      baseline: string
      candidate: string
      command: 'compare'
      files: {
        added: string[]
        changed: string[]
        removed: string[]
      }
      ok: boolean
      summary: {
        added: number
        changed: number
        removed: number
      }
    }
  | {
      command: 'compare'
      error: ArtifactJsonError
      ok: false
    }

export type CliJsonResult =
  | PackJsonResult
  | InspectJsonResult
  | VerifyJsonResult
  | CompareJsonResult

export type ArtifactApiErrorResult = {
  error: ArtifactJsonError
  ok: false
  operation: 'inspect' | 'verify' | 'compare'
}

export type ArtifactApiSuccessResult<TPayload extends object = object> = TPayload & {
  ok: true
  operation: 'inspect' | 'verify' | 'compare'
}
