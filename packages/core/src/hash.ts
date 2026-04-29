import {createHash} from 'node:crypto'
import {readFile} from 'node:fs/promises'

export async function hashFileSHA256(filePath: string): Promise<string> {
  const contents = await readFile(filePath)
  return hashBufferSHA256(contents)
}

export function hashBufferSHA256(contents: Buffer | string): string {
  return createHash('sha256').update(contents).digest('hex')
}
