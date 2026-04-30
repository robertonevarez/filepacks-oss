# Filepacks Public Docs

This directory is the canonical home of the public Filepacks docs site.

It belongs to the public `filepacks-oss` repo and should only contain public-safe
documentation, config, and assets.

Mintlify owns docs hosting for this site.

## Ownership

- The public repo owns CLI, core, spec docs, examples, and the canonical docs site.
- The private repo owns `apps/web`, `filepacks.com`, early access, and web deployment config.
- `filepacks.com/docs` should proxy this docs site through a Vercel rewrite, not by duplicating the docs content in the private repo.
- Connect Mintlify to the public `filepacks-oss` repo, not the private repo.
- If Mintlify asks for a docs path or content directory, use `docs`.

## Local Development

Mintlify requires Node.js 22 LTS.

From `filepacks-oss/docs`:

```bash
nvm use
mint dev --port 3001
```

Or from the `filepacks-oss` repo root:

```bash
npm run docs:dev
```

Validation commands:

From `filepacks-oss/docs`:

```bash
mint validate
mint broken-links
```

Or from the repo root:

```bash
npm run docs:validate
npm run docs:links
```

The docs config file is `docs.json`.

Internal docs links in MDX should use root-relative docs paths such as `/quickstart`
and `/cli/compare`, not `/docs/quickstart`.

## Relationship To `filepacks.com/docs`

The marketing site should link to relative paths such as `/docs`, `/docs/quickstart`,
and `/docs/cli`.

The private web app must not own or duplicate this docs content. Instead,
`filepacks.com/docs` should be served via a Vercel rewrite/proxy to the real docs
origin for this site.

## Manual Deployment Note

The production docs origin is the Mintlify deployment URL for this docs site.

That origin is intentionally not committed here unless this repo already owns the
deployment metadata. The private web app must be configured with the real
Mintlify origin before a production deploy that proxies `/docs`.

Do not put private material in this docs directory.
