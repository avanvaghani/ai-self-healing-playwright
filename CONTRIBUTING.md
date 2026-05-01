# Contributing

Thanks for your interest in improving the project! This guide covers everything
you need to set up locally, the checks that run on every PR, and the
conventions we follow for branches, commits, and code style.

## Setup

1. Node.js 18 or newer (see `package.json` `engines`).
2. `npm ci`
3. `npx playwright install` (or `npx playwright install chromium firefox webkit`).
4. Copy `.env.example` to `.env` and set `GEMINI_API_KEY` for AI tests.

## Local commands

| Command                | What it does                                     |
| ---------------------- | ------------------------------------------------ |
| `npm run typecheck`    | TypeScript validation (no emit).                 |
| `npm run lint`         | ESLint over the whole repo.                      |
| `npm run lint:fix`     | Auto-fix lint issues where possible.             |
| `npm run format`       | Apply Prettier to the whole repo.                |
| `npm run format:check` | Check formatting without writing.                |
| `npm run test:unit`    | Vitest unit tests (mocked Gemini, no API calls). |
| `npm test`             | Run the full Playwright suite.                   |
| `npm run test:headed`  | Playwright in headed mode.                       |
| `npm run test:ui`      | Playwright UI mode.                              |

## Checks before opening a PR

Run all of these locally — they also run in CI:

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test:unit
npm test
```

## Code style

- **Language:** TypeScript, strict mode.
- **Formatter:** Prettier owns formatting (`.prettierrc.json`). Don't fight it
  — run `npm run format` before committing.
- **Linter:** ESLint with `typescript-eslint` (`eslint.config.js`).
- **Imports:** use `.js` suffix on relative imports (NodeNext module resolution
  requires it, even for `.ts` files).
- **`any` is a warning, not an error.** Prefer narrower types when practical;
  if you do reach for `any`, leave a one-line comment explaining why.

## Branch naming

Use a short, descriptive prefix:

- `feat/<short-description>` — new healing scenario, fixture, capability
- `fix/<short-description>` — bug fix
- `chore/<short-description>` — tooling, deps, config
- `docs/<short-description>` — README / CONTRIBUTING / templates
- `test/<short-description>` — tests-only changes

Example: `feat/dom-restructure-scenario`, `fix/visual-diff-json-parsing`.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(optional-scope): <short summary in present tense>

<optional body — what and why, not how>
```

Common types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `style`,
`perf`, `ci`. Keep the subject line under ~72 characters.

Examples:

````
feat(fixtures): add fallback strategies for checkout CTA
fix(ai): handle ```json fenced output from Gemini
test: add unit coverage for getFallbackSelectors
````

## Pull request guidelines

- One logical change per PR. Split unrelated work into separate PRs.
- Fill in the PR template — especially the checklist and any healing-log
  excerpts for new scenarios.
- Keep diffs reviewable: avoid drive-by formatting on unrelated files
  (Prettier already handles that on the files you actually touch).
- Link any related issue (`Closes #123`).

## Things not to commit

- `.env` files, API keys, or any other secrets.
- Local Playwright output: `playwright-report/`, `test-results/`,
  `blob-report/`, `playwright/.cache/`.
- `healed-selectors.json` — it's regenerated on every run and is in
  `.gitignore`.

## Cost note for AI tests

The Gemini-backed tests call Google's API and may incur cost on your account.
Use a key you control, and prefer `npm run test:unit` (mocked) for fast
feedback during development. The Playwright AI tests skip automatically when
`GEMINI_API_KEY` is missing.
