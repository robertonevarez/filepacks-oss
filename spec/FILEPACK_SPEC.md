# filepack `.fpk` Specification

Status: v0.1.0 trust anchor

This document defines the stable `.fpk` artifact format for filepacks v0. The
artifact byte stream is the trust anchor. CLI and programmatic APIs may evolve
before v1.0, but valid `.fpk` artifacts produced under this specification should
remain readable and verifiable.

## 1. Archive Format

A `.fpk` artifact is a POSIX tar archive containing exactly one manifest and
zero or more payload files.

Canonical archive layout:

```text
manifest.json
payload/<relative-path>
payload/<relative-path>
...
```

Producer requirements:

- The first archive entry MUST be `manifest.json`.
- Payload entries MUST be stored under `payload/`.
- Payload entries MUST be regular file entries.
- Directory entries MUST NOT be emitted.
- Entries outside `manifest.json` and `payload/` MUST NOT be emitted.
- Duplicate archive entry names MUST NOT be emitted.
- Duplicate payload relative paths MUST NOT be emitted.
- Payload entries MUST be emitted in lexical order by payload relative path.

Verifier requirements:

- `manifest.json` MUST exist exactly once.
- Archive entries MUST be regular files.
- Entries outside `manifest.json` and `payload/` MUST be rejected.
- Payload paths that are not normalized relative paths MUST be rejected.
- Duplicate payload relative paths MUST be rejected.
- Payload entries MAY be read in any physical order, but verification MUST use
  normalized payload paths and manifest entries.

## 2. Tar Header Canonicalization

Canonical producers MUST write every archive entry with these tar header values:

| Field | Value |
| --- | --- |
| `uid` | `0` |
| `gid` | `0` |
| `uname` | empty string |
| `gname` | empty string |
| `mode` | `0644` |
| `mtime` | Unix epoch, `1970-01-01T00:00:00.000Z` |
| `type` | regular file |

Entry `size` MUST equal the exact byte length of the entry content.

## 3. Payload Paths

Payload paths are represented in `manifest.json` without the `payload/` prefix.

A normalized relative path:

- MUST be non-empty.
- MUST NOT start with `/`.
- MUST NOT contain backslashes.
- MUST NOT contain `//`.
- MUST NOT contain empty path segments.
- MUST NOT contain `.` or `..` path segments.
- MUST use `/` as the separator on every platform.

Examples:

| Path | Valid |
| --- | --- |
| `results.jsonl` | yes |
| `outputs/run-1.json` | yes |
| `/outputs/run-1.json` | no |
| `outputs\\run-1.json` | no |
| `outputs/../run-1.json` | no |
| `outputs//run-1.json` | no |

## 4. Manifest Schema

`manifest.json` is UTF-8 encoded JSON. Canonical producers MUST write it as
pretty JSON with two-space indentation followed by a single trailing newline.

Generic v0 manifests use `format_version: 1`.

```json
{
  "artifact_name": "example",
  "created_with": "filepacks",
  "file_count": 1,
  "files": [
    {
      "hash": "64 lowercase hex SHA-256 digest",
      "path": "hello.txt",
      "size": 12
    }
  ],
  "format_version": 1,
  "payload_digest": "64 lowercase hex SHA-256 digest",
  "total_bytes": 12
}
```

Required fields:

| Field | Type | Rule |
| --- | --- | --- |
| `artifact_name` | string | Non-empty artifact name. |
| `created_with` | string | MUST be `filepacks`. |
| `file_count` | integer | Non-negative count of `files` entries. |
| `files` | array | Sorted list of payload file descriptors. |
| `format_version` | integer | MUST be `1` for generic v0 artifacts. |
| `payload_digest` | string | Lowercase hex SHA-256 digest over the manifest file list, as defined below. |
| `total_bytes` | integer | Sum of every `files[*].size`. |

Each file descriptor has:

| Field | Type | Rule |
| --- | --- | --- |
| `path` | string | Normalized payload-relative path. |
| `size` | integer | Non-negative payload byte length. |
| `hash` | string | Lowercase hex SHA-256 digest of exact payload bytes. |

Manifest validation requirements:

- `files` MUST NOT contain duplicate paths.
- `file_count` MUST equal `files.length`.
- `total_bytes` MUST equal the sum of `files[*].size`.
- `payload_digest` MUST match the digest computed from the sorted file list.
- Implementations MUST reject invalid path, size, hash, count, total, or digest
  values.

## 5. Hashing Rules

All hashes use SHA-256 and lowercase hexadecimal encoding.

Payload file hash:

```text
sha256(exact payload file bytes)
```

Payload digest:

1. Sort manifest file entries lexically by `path`.
2. For each file entry, append this UTF-8 sequence to the hash input:

```text
<path>\0<size>\0<hash>\n
```

3. The SHA-256 digest of the concatenated sequence is `payload_digest`.

Archive digest:

```text
sha256(exact .fpk tar archive bytes)
```

For generic v0 artifacts, artifact identity is the archive digest.

## 6. Determinism Guarantees

For the same logical input, canonical producers MUST produce the same `.fpk`
archive bytes across platforms, subject to this specification.

Canonical production requires:

- Normalize all payload paths to `/`.
- Traverse and emit payload files in lexical path order.
- Sort manifest file entries lexically by `path`.
- Use exact payload byte contents without line-ending conversion.
- Use the canonical tar header values in this document.
- Emit no directory entries, platform metadata, owner metadata, permissions from
  the source filesystem, current timestamps, extended attributes, or symlinks.
- Emit `manifest.json` first.
- Emit `manifest.json` as canonical UTF-8 JSON with one trailing newline.

## 7. Example Artifacts

Minimal public example artifacts live under `spec/examples/`:

- `valid-minimal.fpk`: a valid artifact with one payload file.
- `invalid-payload-digest.fpk`: an invalid artifact whose manifest
  `payload_digest` does not match the payload file list.

These examples are intentionally synthetic and contain no private fixtures,
eval datasets, proprietary examples, credentials, or internal product data.
