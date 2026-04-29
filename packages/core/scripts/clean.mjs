import {rm} from 'node:fs/promises'
import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

await Promise.all([
  rm(resolve(packageRoot, 'dist'), {force: true, recursive: true}),
  rm(resolve(packageRoot, 'tsconfig.tsbuildinfo'), {force: true}),
])
