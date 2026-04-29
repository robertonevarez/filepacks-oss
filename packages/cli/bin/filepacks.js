#!/usr/bin/env node
import {main} from '../dist/index.js'

main(process.argv.slice(2)).catch(error => {
  const message = error instanceof Error ? error.message : 'Unexpected filepacks error.'
  process.stderr.write(`error ${message}\n`)
  process.exitCode = 1
})
