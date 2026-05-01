# Contributing

## Setup

1. Node.js 18 or newer (see `package.json` `engines`).
2. `npm ci`
3. `npx playwright install` (or `npx playwright install chromium firefox webkit`)
4. Copy `.env.example` to `.env` and set `GEMINI_API_KEY` for AI tests.

## Checks before a PR

- `npm run typecheck`
- `npm test` (or `npm run test:ci`)

## Notes

- Do not commit `.env`, API keys, or local Playwright output (`playwright-report/`, `test-results/`).
- AI-powered tests call the Gemini API and may incur cost; use a key you control and avoid running large batches unnecessarily.
