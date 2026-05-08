import {readdir, readFile} from 'node:fs/promises'
import {dirname, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

type JsonSchema = {
  additionalProperties?: boolean
  enum?: unknown[]
  format?: string
  items?: JsonSchema
  minLength?: number
  pattern?: string
  properties?: Record<string, JsonSchema>
  required?: string[]
  type?: string | string[]
}

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const candidatesDir = resolve(repoRoot, 'evals/candidates')
const schemasDir = resolve(repoRoot, 'evals/schemas')

async function main(): Promise<void> {
  const files = await candidateFiles()
  const repoSchema = await readJson<JsonSchema>(join(schemasDir, 'candidate-repo.schema.json'))
  const issueSchema = await readJson<JsonSchema>(join(schemasDir, 'candidate-issue.schema.json'))
  const errors: string[] = []
  const repoIds = new Set<string>()
  const issueRepoRefs: Array<{path: string, repoId: string}> = []

  for (const file of files) {
    const candidateType = inferCandidateType(file)
    if (!candidateType) {
      errors.push(`${relativeFromRoot(join(candidatesDir, file))}: filename must include repo or issue`)
      continue
    }

    const path = join(candidatesDir, file)
    const value = await readJson<unknown>(path).catch(error => {
      errors.push(`${relativeFromRoot(path)}: ${error instanceof Error ? error.message : 'Invalid JSON.'}`)
      return undefined
    })

    if (value !== undefined) {
      const schema = candidateType === 'repo' ? repoSchema : issueSchema
      errors.push(...validate(value, schema, relativeFromRoot(path)))
      if (candidateType === 'repo') collectRepoIds(value, repoIds)
      if (candidateType === 'issue') collectIssueRepoRefs(value, relativeFromRoot(path), issueRepoRefs)
    }
  }

  for (const ref of issueRepoRefs) {
    if (!repoIds.has(ref.repoId)) {
      errors.push(`${ref.path}.repo_id: unknown candidate repo id ${ref.repoId}`)
    }
  }

  if (errors.length > 0) {
    for (const error of errors) console.error(error)
    process.exitCode = 1
    return
  }

  console.log(`validated ${files.length} candidate file${files.length === 1 ? '' : 's'}`)
}

function inferCandidateType(file: string): 'issue' | 'repo' | undefined {
  if (file.includes('issue')) return 'issue'
  if (file.includes('repo')) return 'repo'
  return undefined
}

function collectRepoIds(value: unknown, repoIds: Set<string>): void {
  if (!Array.isArray(value)) return
  for (const item of value) {
    if (isPlainObject(item) && typeof item.id === 'string') repoIds.add(item.id)
  }
}

function collectIssueRepoRefs(value: unknown, path: string, refs: Array<{path: string, repoId: string}>): void {
  if (!Array.isArray(value)) return
  value.forEach((item, index) => {
    if (isPlainObject(item) && typeof item.repo_id === 'string') {
      refs.push({path: `${path}[${index}]`, repoId: item.repo_id})
    }
  })
}

async function candidateFiles(): Promise<string[]> {
  const entries = await readdir(candidatesDir, {withFileTypes: true}).catch(() => [])
  return entries
    .filter(entry => entry.isFile() && entry.name.endsWith('.json'))
    .map(entry => entry.name)
    .sort()
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, 'utf8')) as T
}

function validate(value: unknown, schema: JsonSchema, path: string): string[] {
  const errors: string[] = []
  const allowedTypes = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : []

  if (allowedTypes.length > 0 && !allowedTypes.some(type => matchesType(value, type))) {
    errors.push(`${path}: expected ${allowedTypes.join(' or ')}`)
    return errors
  }

  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${path}: expected one of ${schema.enum.map(String).join(', ')}`)
  }

  if (typeof value === 'string') {
    if (typeof schema.minLength === 'number' && value.length < schema.minLength) {
      errors.push(`${path}: expected at least ${schema.minLength} character${schema.minLength === 1 ? '' : 's'}`)
    }
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
      errors.push(`${path}: does not match pattern ${schema.pattern}`)
    }
    if (schema.format === 'date-time' && Number.isNaN(Date.parse(value))) {
      errors.push(`${path}: expected date-time string`)
    }
  }

  if (Array.isArray(value) && schema.items) {
    value.forEach((item, index) => {
      errors.push(...validate(item, schema.items as JsonSchema, `${path}[${index}]`))
    })
  }

  if (isPlainObject(value)) {
    const properties = schema.properties ?? {}
    for (const required of schema.required ?? []) {
      if (!(required in value)) errors.push(`${path}.${required}: missing required property`)
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!(key in properties)) errors.push(`${path}.${key}: unexpected property`)
      }
    }
    for (const [key, propertySchema] of Object.entries(properties)) {
      if (key in value) errors.push(...validate(value[key], propertySchema, `${path}.${key}`))
    }
  }

  return errors
}

function matchesType(value: unknown, type: string): boolean {
  if (type === 'array') return Array.isArray(value)
  if (type === 'object') return isPlainObject(value)
  if (type === 'integer') return Number.isInteger(value)
  if (type === 'number') return typeof value === 'number' && Number.isFinite(value)
  if (type === 'null') return value === null
  return typeof value === type
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function relativeFromRoot(path: string): string {
  return path.startsWith(repoRoot) ? path.slice(repoRoot.length + 1) : path
}

main().catch(error => {
  const message = error instanceof Error ? error.message : 'Unexpected validate-candidates failure.'
  console.error(message)
  process.exitCode = 1
})
