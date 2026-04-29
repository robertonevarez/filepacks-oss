import {readdir, stat} from 'node:fs/promises'
import {basename, resolve, sep} from 'node:path'

import {FilepacksError} from './errors.js'

export type SourceFile = {
  absolutePath: string
  relativePath: string
  size: number
}

export async function resolveAndValidateInputDirectory(inputPath: string): Promise<string> {
  const absolutePath = resolve(inputPath)

  let inputStats
  try {
    inputStats = await stat(absolutePath)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new FilepacksError(
        `Input path does not exist: ${inputPath}`,
        'Provide a valid directory path and try again.',
      )
    }

    throw new FilepacksError(
      `Unable to access input path: ${inputPath}`,
      'Check file permissions and try again.',
      {cause: error as Error},
    )
  }

  if (!inputStats.isDirectory()) {
    throw new FilepacksError(
      `Input path is not a directory: ${inputPath}`,
      'Use a directory path as the pack input.',
    )
  }

  return absolutePath
}

export async function resolveAndValidateArtifactPath(artifactPath: string): Promise<string> {
  const absolutePath = resolve(artifactPath)

  if (!absolutePath.endsWith('.fpk')) {
    throw new FilepacksError(
      `Artifact path must end with .fpk: ${artifactPath}`,
      'Provide a .fpk artifact file path.',
    )
  }

  let artifactStats
  try {
    artifactStats = await stat(absolutePath)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new FilepacksError(
        `Artifact path does not exist: ${artifactPath}`,
        'Provide a valid .fpk file path and try again.',
      )
    }

    throw new FilepacksError(
      `Unable to access artifact path: ${artifactPath}`,
      'Check file permissions and try again.',
      {cause: error as Error},
    )
  }

  if (!artifactStats.isFile()) {
    throw new FilepacksError(
      `Artifact path is not a file: ${artifactPath}`,
      'Provide a .fpk file path and try again.',
    )
  }

  return absolutePath
}

export async function collectSourceFiles(rootDirectory: string): Promise<SourceFile[]> {
  const files: SourceFile[] = []
  await walkDirectory(rootDirectory, rootDirectory, files)
  return files
}

async function walkDirectory(rootDirectory: string, currentDirectory: string, files: SourceFile[]): Promise<void> {
  let entries
  try {
    entries = await readdir(currentDirectory, {withFileTypes: true})
  } catch (error) {
    throw new FilepacksError(
      `Unable to read directory: ${currentDirectory}`,
      'Check file permissions and try again.',
      {cause: error as Error},
    )
  }

  entries.sort((a, b) => a.name.localeCompare(b.name))

  for (const entry of entries) {
    const absolutePath = resolve(currentDirectory, entry.name)

    if (entry.isDirectory()) {
      // Recursion is intentionally awaited in lexical order for deterministic traversal.
      // eslint-disable-next-line no-await-in-loop
      await walkDirectory(rootDirectory, absolutePath, files)
      continue
    }

    if (!entry.isFile()) {
      throw new FilepacksError(
        `Unsupported file type at: ${absolutePath}`,
        'Only regular files are supported in Phase 1 packaging.',
      )
    }

    let fileStats
    try {
      // Metadata is read sequentially to match deterministic traversal order.
      // eslint-disable-next-line no-await-in-loop
      fileStats = await stat(absolutePath)
    } catch (error) {
      throw new FilepacksError(
        `Unable to read file metadata: ${absolutePath}`,
        'Check file permissions and try again.',
        {cause: error as Error},
      )
    }

    files.push({
      absolutePath,
      relativePath: normalizeRelativePath(absolutePath.slice(rootDirectory.length + 1)),
      size: fileStats.size,
    })
  }
}

export function deriveArtifactName(inputDirectory: string, providedName?: string): string {
  const candidate = (providedName ?? basename(inputDirectory)).trim()

  if (!candidate) {
    throw new FilepacksError(
      'Artifact name is empty.',
      'Provide --name with a non-empty value.',
    )
  }

  if (candidate.includes('/') || candidate.includes('\\')) {
    throw new FilepacksError(
      `Artifact name is invalid: ${candidate}`,
      'Use --name without path separators.',
    )
  }

  return candidate
}

function normalizeRelativePath(value: string): string {
  if (sep === '/') return value
  return value.split(sep).join('/')
}
