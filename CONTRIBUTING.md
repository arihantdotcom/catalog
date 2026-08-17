# Contributing to Catalog

First off, thanks for taking the time to contribute! Your help is what keeps this project moving forward.

Please take a moment to read our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold it.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Scripts](#scripts)
- [Code Style & Quality](#code-style--quality)
- [Commit Guidelines](#commit-guidelines)
- [Opening Issues](#opening-issues)
- [Submitting Pull Requests](#submitting-pull-requests)
- [Testing](#testing)
- [Packaging & Icons](#packaging--icons)

## Getting Started

1. **Fork** the repository and clone your fork.
2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Run the app in development mode:**

   ```bash
   npm run dev
   ```

## Development Workflow

1. Create a branch for your work:

   ```bash
   git checkout -b feat/my-new-feature
   ```

2. Make your changes. Keep them focused — one logical change per PR.
3. Run the checks below before committing.
4. Push and open a pull request.

## Project Structure

```
src/
├── main/          Electron main process (window, SQLite, file I/O, IPC)
├── preload/       Context-bridged IPC API exposed as window.api
├── renderer/
│   └── src/
│       ├── components/  UI components (item card, dialogs, settings drawer)
│       ├── lib/         cover pipeline, PDF info, search, thumbnail utils
│       └── App.tsx      Main application
└── shared/         Shared TypeScript types
```

- `src/main/` runs in the Electron main process — this is where file system access, SQLite, and IPC live. Never call Node APIs from the renderer directly.
- `src/preload/` is the only bridge between the renderer and the main process. New IPC capabilities should be exposed here as typed methods on `window.api`.
- `src/renderer/` is a standard React app built with Vite. Use the `@/` alias for imports from `src/renderer/src`.
- `src/shared/` holds types shared between main and renderer — put cross-process types here.

## Scripts

| Command             | Description                              |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | Start the app in development mode (HMR)  |
| `npm run typecheck` | Type-check main, preload, and renderer   |
| `npm run lint`      | Lint the codebase                        |
| `npm run format`    | Format all files with Prettier           |
| `npm run build`     | Type-check and bundle the app            |
| `npm run build:*`   | Package installers for each platform     |

## Code Style & Quality

This project uses **ESLint** (with the `@electron-toolkit` configs) and **Prettier**. Before submitting, make sure everything passes:

```bash
npm run lint
npm run typecheck
npm run format
```

Other conventions:

- Use **Prettier defaults** — don't add custom formatting rules unless discussed.
- **TypeScript strictness matters** — avoid `any`; prefer proper types, generics, and discriminated unions.
- New IPC handlers should validate input in the main process, never trust the renderer.
- UI components should follow the existing patterns in `src/renderer/src/components/` (shadcn-style, Base UI / vaul). Reuse existing components instead of creating new ones.
- Prefer `import type` for type-only imports.
- Don't introduce new dependencies without discussing them first in an issue or PR description.

## Commit Guidelines

Write clear, concise commit messages that describe the **what** and **why**, not the mechanics:

```
feat: add bulk import progress indicator
fix: resolve flicker when switching themes
refactor: extract cover pipeline into lib module
docs: clarify import behavior in README
```

Use `feat:`, `fix:`, `refactor:`, `docs:`, `style:`, `test:`, `chore:` prefixes where appropriate. Keep the subject under ~72 characters and add a body when the change needs explanation.

## Opening Issues

Before opening an issue:

1. **Search existing issues** — yours may already be reported or fixed.
2. Use a clear, descriptive title.
3. Include:
   - Your OS and Electron version (see the app's settings drawer → About).
   - Steps to reproduce.
   - Expected vs. actual behavior.
   - Screenshots or logs if relevant.

## Submitting Pull Requests

1. Keep PRs **small and focused**. One PR = one feature or fix.
2. Reference any related issue: `Closes #123`.
3. Describe what changed and why, plus any manual verification you performed.
4. Make sure `npm run lint` and `npm run typecheck` pass.
5. Keep your branch up to date with the default branch (`git rebase` preferred over `git merge`).

## Testing

There is no automated test suite yet. Manual verification is expected:

- Run the app with `npm run dev` and exercise the changed flow.
- Verify the build passes: `npm run build`.
- If your change touches main-process code, verify it on your platform (or note if cross-platform testing is needed).

> Help wanted: adding a test framework and coverage for the main-process logic would be a great first contribution!

## Packaging & Icons

If your change affects packaging:

- App icons live in `build/` (`icon.ico` for Windows, `icon.icns` for macOS, `icon.png` for Linux) and are used by electron-builder.
- The in-app logo and window icon (dev mode) come from `src/renderer/src/assets/app-logos/` — `catalog.svg` is the master source; `catalog.png` is the 1024×1024 raster used by the main process window.
- When regenerating icons, keep both locations in sync. A change to the logo must update `build/` **and** `resources/icon.png`.
- Verify packaged builds with `npm run build:win` / `build:mac` / `build:linux` (platform-permitting).

## Attribution

This file is a living document — if a convention isn't listed here, follow the existing code and update this guide when you discover something worth documenting.
