# GitHub Roadmap and Issue Backlog

Use this file to create milestones and seed issues in the repository.

## Milestones

### v1.1 Stability and Signal Quality

- Remove noisy fallback dependencies from core flows.
- Reduce repeated-heal signals in checkout/login scenarios.
- Ensure all required CI checks are green before merge.

### v1.2 Observability and Triage

- Improve artifact quality for faster failure diagnosis.
- Add trend tracking for flake-analysis outputs.
- Expand QA report details for reviewer readability.

### v1.3 Scale and Coverage

- Add richer API negative-path coverage.
- Introduce smoke/full test profile strategy.
- Prepare additional demo scenarios for portfolio storytelling.

## Ready-to-Create Issues

### 1) Replace flaky fallback selectors with stable locators

- **Type:** Refactor / code quality
- **Milestone:** v1.1 Stability and Signal Quality
- **Description:** Replace selectors flagged by repeated-heal and selector-drift signals with stable test ids or role-based locators in login and checkout flows.
- **Definition of done:** `reports/flake-analysis.json` shows a clear reduction in repeated-heal counts for top offenders.

### 2) Add smoke tag profile for fast PR feedback

- **Type:** CI / tooling
- **Milestone:** v1.3 Scale and Coverage
- **Description:** Introduce a smoke test subset (`@smoke`) and CI command to run it quickly on pull requests while keeping full suite on push/nightly.
- **Definition of done:** PR checks complete faster with stable smoke coverage and documented commands.

### 3) Add API boundary and enum validation scenarios

- **Type:** New feature / healing scenario
- **Milestone:** v1.3 Scale and Coverage
- **Description:** Expand API contract tests with boundary values, missing required fields, and invalid enum cases.
- **Definition of done:** New failing payload fixtures and assertions are covered in `tests/api-contract.spec.ts`.

### 4) Publish CI artifact triage guide

- **Type:** Documentation
- **Milestone:** v1.2 Observability and Triage
- **Description:** Document how to inspect `playwright-report`, `test-results`, and `qa-intelligence-report` artifacts for quick diagnosis.
- **Definition of done:** `README.md` links to a short triage section with actionable steps.

### 5) Add release tagging and changelog process

- **Type:** CI / tooling
- **Milestone:** v1.1 Stability and Signal Quality
- **Description:** Define a lightweight release flow with semantic tags and changelog notes for each milestone completion.
- **Definition of done:** First tagged release and changelog entry are published.

### 6) Track flake-analysis trends across CI runs

- **Type:** New feature / healing scenario
- **Milestone:** v1.2 Observability and Triage
- **Description:** Persist historical flake-analysis metrics per run to monitor drift and stability improvements over time.
- **Definition of done:** Historical trend data is available in CI artifacts for at least recent runs.
