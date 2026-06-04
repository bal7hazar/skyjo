# Skyjo Solo

A full-client (no backend, no contract) solo adaptation of the number game
**Skyjo**, built as a playable web prototype. See [`CONTEXT.md`](./CONTEXT.md)
for the design spec and rules.

> The player only ever sees **numbers, slots and reveals** — there is
> deliberately no card metaphor anywhere on screen.

## Stack

- **pnpm** workspace + **Turborepo** at the root for task running
- **client/** — React 19 + Vite 7 + TypeScript, **Vitest** for tests, **Biome**
  for lint/format
- Pure, isolated game logic (`client/src/game/`) so it is easy to unit-test and
  could later be ported to an on-chain/Dojo context

## Develop

```bash
pnpm install
pnpm dev        # turbo → vite dev server
pnpm test       # turbo → vitest (deck + engine + UI)
pnpm build      # type-check + production build → client/dist
pnpm format     # biome --write
```

## Project layout

```
.
├── turbo.json              # task graph
├── pnpm-workspace.yaml
└── client/
    ├── index.html
    ├── vite.config.ts      # base path for GitHub Pages (/skyjo/)
    └── src/
        ├── game/           # pure logic: deck, rng, engine, types (+ tests)
        ├── components/     # Slot, Grid, Hud, Controls, GameOver
        ├── useGame.ts      # React hook wrapping the engine
        └── App.tsx
```

## Hosting on GitHub Pages (no CLI)

Deployment is fully automated by
[`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml): every push to
`main` runs tests, builds the client and publishes `client/dist` to Pages.

One-time setup in the GitHub UI (no `gh` CLI needed):

1. Push this repo to GitHub.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**

After that, every push to `main` deploys automatically. The site is served at
`https://<user>.github.io/skyjo/` — the Vite `base` is set to `/skyjo/` to match
the repository name. If you host under a different name or a custom domain, set
`BASE_PATH` at build time (e.g. `BASE_PATH=/ pnpm build`).
