# filepacks CLI

The v0 CLI exposes only the stable public commands:

```bash
filepacks pack <input> --output <file>
filepacks inspect <file>
filepacks verify <file>
filepacks compare <baseline> <candidate>
```

Commands outside that list are intentionally not part of the v0 OSS surface.

## Deferred Commands

The following command families are intentionally absent from the v0 public CLI:

- registry, remote storage, and sync commands
- local store, tag, alias, and baseline commands
- typed eval/import adapters
- history, events, show, list, and unpack commands

Those areas may be revisited later, but they are not bundled into this package
and are not public commitments for v0.
