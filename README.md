# AI Self-Healing and Visual QA with Playwright

[![CI](https://github.com/avanvaghani/ai-self-healing-playwright/actions/workflows/ci.yml/badge.svg)](https://github.com/avanvaghani/ai-self-healing-playwright/actions/workflows/ci.yml)

An AI-enhanced QA automation project built with **Playwright**, **TypeScript**, and **Google Gemini**.  
It demonstrates two practical ideas for modern test engineering:

- resilient selector recovery when UI locators break
- semantic visual regression analysis instead of pixel-only noise

## Why This Project Stands Out

- **Self-healing actions:** `smartFill` and `smartClick` attempt the original selector, then deterministic fallback strategies, then Gemini healing.
- **Semantic visual checks:** Gemini compares baseline and current screenshots and returns structured JSON (`isRegression` + explanation).
- **Execution evidence:** selector recoveries are written to `healed-selectors.json` with strategy metadata.
- **CI ready:** GitHub Actions workflow runs type-check + Playwright tests and uploads the Playwright report artifact.

## Healing flow

`smartClick` / `smartFill` only call Gemini **after** the primary selector fails — not on every action.

```mermaid
flowchart LR
  A[Try original selector] -->|fails| B[Try deterministic fallbacks]
  B -->|success| L[Log strategy: fallback]
  B -->|fails| C[Send DOM + goal to Gemini]
  C -->|new selector| D[Retry action]
  D --> L2[Log strategy: ai]
  C -->|NOT_FOUND| E[Re-throw original error]
```

## Architecture

```text
.
├── demo/                          # Local demo apps with unstable selectors
│   ├── index.html                 # Login form — dynamic IDs
│   └── checkout.html              # Checkout form — IDs, classes, button text
├── src/
│   ├── fixtures/
│   │   ├── ai-fixtures.ts         # smartPage fixture (retry + fallback + AI healing)
│   │   └── ai-fixtures.test.ts    # Vitest unit tests for fallback rules
│   └── utils/
│       ├── ai.ts                  # Gemini integration (selector + visual analysis)
│       └── ai.test.ts             # Vitest unit tests for the Gemini wrapper
├── tests/
│   ├── self-healing.spec.ts       # Login flow with broken selectors
│   ├── smart-visual.spec.ts       # Semantic visual diff
│   └── healing-scenarios.spec.ts  # Class rename, text change, dynamic ID
├── .github/workflows/ci.yml       # CI pipeline
├── eslint.config.js               # ESLint flat config
├── .prettierrc.json               # Prettier config
├── vitest.config.ts               # Unit-test runner
└── playwright.config.ts
```

## Healing strategies

| Order | Strategy              | When it runs                                                                                                                                                                   |
| ----: | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|     1 | **Original selector** | First attempt (`click` / `fill` with timeout).                                                                                                                                 |
|     2 | **Fallback CSS**      | If the action goal mentions a known intent (username, password, login, quantity, address, place-order / checkout / purchase), tries placeholder / type / text-based selectors. |
|     3 | **AI healing**        | If fallbacks fail, sends full page HTML + goal to Gemini; expects a single CSS/XPath string or `NOT_FOUND`.                                                                    |

Two demo pages exercise different breakage modes:

- **`demo/index.html`** — randomizes element IDs on the login form (**dynamic ID**).
- **`demo/checkout.html`** — randomizes IDs _and_ renames classes _and_ rotates the order CTA's text between four synonyms (**dynamic ID + class rename + text change**).

Adding more scenarios (DOM restructuring, attribute swaps, RTL/i18n label changes) is a natural next step.

## Quick Start

### Prerequisites

- Node.js 18+ (see `package.json` → `engines`)
- Gemini API key (for AI tests and CI)

### Install

```bash
npm install
npx playwright install
```

The second command downloads Chromium, Firefox, and WebKit binaries for Playwright. CI uses `playwright install --with-deps` automatically.

### Environment

Copy the example file and edit:

```bash
cp .env.example .env
```

On Windows PowerShell: `Copy-Item .env.example .env`

Set `GEMINI_API_KEY` in `.env` (never commit `.env`).

## Run Locally

```bash
npm test            # Full Playwright suite (3 browsers)
npm run test:unit   # Fast Vitest unit tests (mocked Gemini, no API calls)
```

Useful commands:

```bash
npm run typecheck       # TypeScript validation
npm run lint            # ESLint
npm run lint:fix        # ESLint with auto-fix
npm run format          # Apply Prettier
npm run format:check    # Check formatting only
npm run test:headed     # Playwright in a visible browser
npm run test:ui         # Playwright UI mode
npm run report          # Open the last Playwright report
```

## Cost, limits, and production use

- **Gemini API calls cost money** and count against your quota. This repo calls the API only when a selector heal or visual analysis runs, not on every step.
- **CI:** add `GEMINI_API_KEY` as a GitHub Actions secret so tests do not skip; be aware each run may incur API usage.
- **Rate limits / caching:** there is no caching layer in this demo. For real products, consider caching DOM hashes → resolved selectors, backoff on 429, and strict budgets per run.

Dependency note: **`@google/genai`** is Google’s GenAI SDK for JavaScript/TypeScript. If a version looks unfamiliar, run `npm view @google/genai version` and align with [the package’s release notes](https://www.npmjs.com/package/@google/genai).

## Prompt transparency (high level)

Selector healing (`healSelector` in `src/utils/ai.ts`) sends Gemini:

- the failing selector and a short **goal** string (what the test is trying to do)
- the **full page HTML** as context (fine for a toy demo; production code should trim or scope the DOM)

Visual analysis (`analyzeVisualDiff`) sends:

- instructions to compare baseline vs current screenshots and return **JSON** with `isRegression` and `explanation`
- two PNG images as inline data

## CI Pipeline

The GitHub workflow runs, in order:

- `npm ci`
- `npm run lint` (ESLint)
- `npm run format:check` (Prettier)
- `npm run typecheck` (TypeScript)
- `npm run test:unit` (Vitest, mocked Gemini)
- `npx playwright install --with-deps chromium firefox webkit`
- `npm run test:ci` (Playwright across all three browsers)
- Uploads `playwright-report` as an artifact on success or failure.

## Example Healing Log

`healed-selectors.json` entries include:

- original selector
- recovered selector
- action goal
- recovery strategy (`fallback` or `ai`)
- timestamp and URL

This makes test recovery auditable and useful for improving locator design.

## Results (fill after a run)

After a local or CI run, you can summarize recoveries from `healed-selectors.json`:

| Metric                   | Example     |
| ------------------------ | ----------- |
| Total heal events        | _e.g. 6_    |
| Resolved by **fallback** | _e.g. 100%_ |
| Resolved by **AI**       | _e.g. 0%_   |

Low **AI** percentage on the current demo is expected: fallbacks often succeed before Gemini runs.

## Demo

Record a short terminal or headed run and save as `docs/assets/self-healing-demo.gif`, then commit it.

![Self-healing demo](docs/assets/self-healing-demo.gif)

## Notes

- AI-based tests are skipped when `GEMINI_API_KEY` is missing.
- The included `demo` app intentionally mutates element IDs to simulate real-world flaky locator failures.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT
