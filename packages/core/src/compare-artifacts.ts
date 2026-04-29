import type {Manifest, ManifestFile} from './manifest.js'

export type CompareFileAdded = {
  hash: string
  path: string
  size: number
}

export type CompareFileRemoved = {
  hash: string
  path: string
  size: number
}

export type CompareFileChanged = {
  'left_hash': string
  'left_size': number
  path: string
  'right_hash': string
  'right_size': number
}

export type StructuralCompareArtifactsResult = {
  added: CompareFileAdded[]
  changed: CompareFileChanged[]
  left: {
    digest: string
    name: string
    path: string
  }
  mode: 'structural'
  ok: boolean
  removed: CompareFileRemoved[]
  right: {
    digest: string
    name: string
    path: string
  }
  summary: {
    added: number
    changed: number
    removed: number
  }
}

type CompareInput = {
  left: {
    artifactDigest: string
    manifest: Manifest
    path: string
  }
  right: {
    artifactDigest: string
    manifest: Manifest
    path: string
  }
}

export function compareArtifacts(input: CompareInput): StructuralCompareArtifactsResult {
  const leftByPath = indexManifestFiles(input.left.manifest.files)
  const rightByPath = indexManifestFiles(input.right.manifest.files)

  const added: CompareFileAdded[] = []
  const removed: CompareFileRemoved[] = []
  const changed: CompareFileChanged[] = []

  for (const [path, leftFile] of leftByPath) {
    const rightFile = rightByPath.get(path)
    if (!rightFile) {
      removed.push({
        hash: leftFile.hash,
        path,
        size: leftFile.size,
      })
      continue
    }

    if (leftFile.hash !== rightFile.hash || leftFile.size !== rightFile.size) {
      changed.push({
        'left_hash': leftFile.hash,
        'left_size': leftFile.size,
        path,
        'right_hash': rightFile.hash,
        'right_size': rightFile.size,
      })
    }
  }

  for (const [path, rightFile] of rightByPath) {
    if (leftByPath.has(path)) continue

    added.push({
      hash: rightFile.hash,
      path,
      size: rightFile.size,
    })
  }

  const sortedAdded = [...added].sort((a, b) => a.path.localeCompare(b.path))
  const sortedRemoved = [...removed].sort((a, b) => a.path.localeCompare(b.path))
  const sortedChanged = [...changed].sort((a, b) => a.path.localeCompare(b.path))

  return {
    added: sortedAdded,
    changed: sortedChanged,
    left: {
      digest: input.left.artifactDigest,
      name: input.left.manifest.artifact_name,
      path: input.left.path,
    },
    mode: 'structural',
    ok: sortedAdded.length === 0 && sortedRemoved.length === 0 && sortedChanged.length === 0,
    removed: sortedRemoved,
    right: {
      digest: input.right.artifactDigest,
      name: input.right.manifest.artifact_name,
      path: input.right.path,
    },
    summary: {
      added: sortedAdded.length,
      changed: sortedChanged.length,
      removed: sortedRemoved.length,
    },
  }
}

function indexManifestFiles(files: ManifestFile[]): Map<string, ManifestFile> {
  return new Map(files.map(file => [file.path, file]))
}
