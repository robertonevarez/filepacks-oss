import {createWriteStream} from 'node:fs'
import {readFile} from 'node:fs/promises'
import {pipeline} from 'node:stream/promises'
import tar from 'tar-stream'

import type {SourceFile} from './fs.js'

import {FilepacksError} from './errors.js'

const FIXED_MTIME = new Date(0)

type ArchiveInput = {
  files: SourceFile[]
  manifestBytes: Buffer
  outputPath: string
}

type BufferedPayloadFile = {
  content: Buffer
  path: string
}

type BufferedArchiveInput = {
  manifestBytes: Buffer
  outputPath: string
  payloadFiles: BufferedPayloadFile[]
}

export async function writeDeterministicArchive(input: ArchiveInput): Promise<void> {
  await writeDeterministicArchiveEntries({
    'manifestBytes': input.manifestBytes,
    outputPath: input.outputPath,
    'payloadFiles': await Promise.all(
      input.files.map(async file => {
        let fileContent
        try {
          fileContent = await readFile(file.absolutePath)
        } catch (error) {
          throw new FilepacksError(
            `Unable to read file for packaging: ${file.relativePath}`,
            'Check file permissions and try again.',
            {cause: error as Error},
          )
        }

        return {
          content: fileContent,
          path: file.relativePath,
        }
      }),
    ),
  })
}

export async function writeDeterministicArchiveFromBuffers(input: BufferedArchiveInput): Promise<void> {
  await writeDeterministicArchiveEntries(input)
}

async function writeDeterministicArchiveEntries(input: BufferedArchiveInput): Promise<void> {
  const pack = tar.pack()
  const outputStream = createWriteStream(input.outputPath)
  const finalize = pipeline(pack, outputStream)

  await addEntry(pack, 'manifest.json', input.manifestBytes)

  const sortedPayloadFiles = [...input.payloadFiles].sort((left, right) => left.path.localeCompare(right.path))

  for (const file of sortedPayloadFiles) {
    // eslint-disable-next-line no-await-in-loop
    await addEntry(pack, `payload/${file.path}`, file.content)
  }

  pack.finalize()

  try {
    await finalize
  } catch (error) {
    throw new FilepacksError(
      `Failed to write artifact: ${input.outputPath}`,
      'Confirm the output path is writable and try again.',
      {cause: error as Error},
    )
  }
}

async function addEntry(pack: tar.Pack, name: string, content: Buffer): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    pack.entry(
      {
        gid: 0,
        gname: '',
        mode: 0o644,
        mtime: FIXED_MTIME,
        name,
        size: content.length,
        uid: 0,
        uname: '',
      },
      content,
      (error?: Error | null) => {
        if (error) {
          reject(error)
          return
        }

        resolve()
      },
    )
  })
}
