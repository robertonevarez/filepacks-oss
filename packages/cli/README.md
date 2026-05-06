# filepacks CLI

The `filepacks` package is the public command-line interface for deterministic `.fpk` artifacts.

It packages a directory into one artifact, prints a summary, verifies integrity, compares two artifacts with stable exit codes, and includes an experimental temporary review handoff command for demos.

## Quick trial

```bash
npx filepacks --help
```

## Persistent install

```bash
npm install -g filepacks
filepacks --help
```

If you add `filepacks` to a project instead of installing it globally, run it with `npx filepacks ...`.

## Public commands

```bash
filepacks pack <input> --output <file>
filepacks inspect <file>
filepacks verify <file>
filepacks compare <baseline> <candidate>
filepacks push <artifact> --endpoint <url> [--open]
filepacks push <baseline> <candidate> --endpoint <url> [--open]
```

Add `--json` to any command when an agent, CI job, or script needs structured output:

```bash
filepacks pack <input> --output <file> --json
filepacks inspect <file> --json
filepacks verify <file> --json
filepacks compare <baseline> <candidate> --json
filepacks push <baseline> <candidate> --endpoint <url> --json
```

## First useful workflow

```bash
npx filepacks pack ./run-output --output ./run.fpk
npx filepacks inspect ./run.fpk
npx filepacks verify ./run.fpk
npx filepacks compare ./baseline.fpk ./run.fpk
npx filepacks push ./baseline.fpk ./run.fpk --endpoint http://localhost:3000 --open
```

`push` is experimental. It sends `.fpk` artifacts to a preview review endpoint for the current request, receives a small structured review result, and can open `/app#review=...` in a browser. It does not store artifacts, create a registry record, or upload to cloud storage.

## Output conventions

- `pack` prints `input=`, `output=`, `name=`, `digest=`, `files=`, `bytes=`
- `inspect` prints `path=`, `name=`, `version=`, `digest=`, `files=`, `bytes=`
- `verify` prints `ok=true` or `ok=false`
- `compare` exits `0` for identical artifacts and `20` for structural differences
- `push` exits `0` when the temporary review handoff succeeds, even when a comparison reports differences
- `--json` prints one parseable JSON object with `ok`, command-specific fields, and structured errors when practical

## When to use the CLI

Use the CLI when you want a shell-friendly workflow for:

- agent run artifacts
- eval output snapshots
- CI evidence capture
- baseline-versus-candidate review

If you need structured results inside Node.js code, use `@filepacks/core` instead.

## Public boundary

Commands outside the list above are intentionally not part of the v0 OSS surface.

That includes:

- registry, remote storage, durable upload, and sync commands
- local store, tag, alias, and baseline commands
- typed eval/import adapters
- history, events, show, list, and unpack commands

See the repository docs for the full CLI reference and workflows:

- https://github.com/robertonevarez/filepacks-oss/tree/main/docs/cli
