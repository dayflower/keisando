# Principles

- Prefer changing code and tests over adding explanatory prose.
- Keep docs short; link to concrete files instead of duplicating behavior descriptions.
- When docs and code disagree, fix docs immediately in the same change.

# Stack Snapshot

- Language: TypeScript
- UI framework: React 19
- Build/dev server: Vite
- Test runner: Vitest
- Lint/format: Biome

For exact versions and scripts, see `package.json`.

# Where To Read First

- App entry and top-level routing/state: `src/App.tsx`, `src/main.tsx`
- Shared domain model and constants: `src/shared/*`
- Feature logic and tests: `src/features/**/logic.ts`, `src/features/**/*.test.ts`
- Persistence layer: `src/storage/repositories/*`
- CI/release contract: `.github/workflows/ci.yml`, `.github/workflows/release.yml`
- Tooling/runtime contract: `package.json`, `vite.config.ts`, `vitest.config.ts`, `biome.json`

# Change Workflow (Minimal)

1. Implement or adjust behavior in code.
2. Add/update tests near the changed logic.
3. Run `npm run check && npm run test && npm run build`.
4. Update docs only if strictly necessary and keep them concise.
