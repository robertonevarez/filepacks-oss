#!/usr/bin/env node
const yargs = require('./evals/workspaces/run-0015/yargs')

const argv = yargs()
  .option('auth.username', { type: 'string' })
  .option('auth.password', { type: 'string' })
  .strict()
  .config('config')
  .parse(['--config','/tmp/auth-config.json'])

console.log('argv keys:', Object.keys(argv))
console.log(JSON.stringify(argv, null, 2))
