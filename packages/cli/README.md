# filepacks CLI

The `filepacks` package is the public command-line interface for deterministic `.fpk` artifacts.

It packages a directory into one artifact, prints a summary, verifies integrity, and compares two artifacts with stable exit codes.

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
```

## First useful workflow

```bash
npx filepacks pack ./run-output --output ./run.fpk
npx filepacks inspect ./run.fpk
npx filepacks verify ./run.fpk
npx filepacks compare ./baseline.fpk ./run.fpk
```

## Output conventions

- `pack` prints `input=`, `output=`, `name=`, `digest=`, `files=`, `bytes=`
- `inspect` prints `path=`, `name=`, `version=`, `digest=`, `files=`, `bytes=`
- `verify` prints `ok=true` or `ok=false`
- `compare` exits `0` for identical artifacts and `20` for structural differences

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

- registry, remote storage, and sync commands
- local store, tag, alias, and baseline commands
- typed eval/import adapters
- history, events, show, list, and unpack commands

See the repository docs for the full CLI reference and workflows:

- https://github.com/robertonevarez/filepacks-oss/tree/main/docs/cli
