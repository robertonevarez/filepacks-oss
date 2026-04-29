# Contributing to filepacks

Status: active

filepacks is building open artifact infrastructure around deterministic `.fpk`
artifacts. Contributions should preserve the core project guarantees:
determinism, portability, inspectability, reproducibility, and local trust.

## Contribution Scope

Good contributions include:

- Artifact format and manifest improvements within the published `.fpk` spec.
- Deterministic packaging fixes.
- Verification and archive safety fixes.
- Canonical structural comparison behavior.
- Shared manifest, file, and diff type improvements.
- CLI improvements for `pack`, `inspect`, `verify`, and `compare`.

Changes that add hosted product behavior, private cloud workflows,
organization policy, billing, proprietary intelligence, or managed orchestration
belong outside the open repo unless they are implementing an open protocol
contract.

For v0, contributions should not add public commitments around cloud features,
remote registry/storage/sync, local store abstractions, tagging/aliasing, auth,
workspaces, multi-user features, import adapters, typed eval datasets, or
internal-only commands.

## Standards

Contributions should:

- Keep artifact output deterministic.
- Preserve backwards-compatible reader behavior unless a spec version changes.
- Include sanitized public fixtures only when they are necessary for format or
  verification changes.
- Avoid adding dependencies to core packages unless the dependency is small,
  audited, and clearly worth the supply-chain cost.
- Keep cloud-only assumptions out of the open artifact path.
- Make canonical behavior reproducible without any hosted service.

## Developer Certificate of Origin

filepacks uses Developer Certificate of Origin sign-off for contributions.

Every commit must include a sign-off line:

```text
Signed-off-by: Contributor Name <email@example.com>
```

By signing off, you certify that you have the right to submit the contribution
under the project license and that the contribution can be included in
filepacks.

Use:

```sh
git commit -s
```

The DCO text is published at https://developercertificate.org/.

## Pull Requests

Before opening a pull request:

1. Keep the change scoped to one behavior or decision.
2. Add or update tests for behavior changes.
3. Add or update conformance fixtures when canonical behavior changes.
4. Update `spec` for any artifact contract change.
5. Update docs when commands, schemas, or compatibility claims change.
6. Confirm commits are signed off.

## Compatibility Claims

Do not describe an implementation as "filepacks compatible" unless it passes
the published conformance suite for the relevant spec version.

Compatibility claims must name:

- The artifact format version.
- The typed artifact version, if applicable.
- The conformance suite version or commit.

Vendor extensions must not replace canonical verification, canonical hashing,
or canonical comparison behavior.

## Security Issues

Do not open public issues for suspected vulnerabilities. Follow
`SECURITY.md`.
