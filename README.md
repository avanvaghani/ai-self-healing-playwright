# AI Visual & Self-Healing Playwright Framework 🤖✨

This is a next-generation test automation framework built with **Playwright**, **TypeScript**, and **Google Gemini AI**. It addresses the common pain point of brittle selectors and rigid visual regression in modern web applications.

## Key Features

- **Self-Healing Locators:** Automatically recovers from broken selectors (ID changes, class renames, structural shifts) by using Gemini AI to infer the correct element based on context and goal.
- **Smart Visual Regression:** Performs semantic visual analysis using Gemini Vision. It distinguishes between meaningful regressions and harmless UI updates, reducing false positives.
- **Auto-Logging:** Generates a `healed-selectors.json` report during execution, providing engineers with the exact selector updates needed for their codebase.
- **Clean Architecture:** Implements a professional Page Object Model (POM) structure with custom Playwright fixtures.

## Project Structure

```text
├── src/
│   ├── fixtures/   # Custom Playwright fixtures (smartPage)
│   ├── utils/      # AI utilities (Gemini integration)
│   └── pages/      # Page Object Models
├── tests/          # Test suites (Self-healing & Visual)
├── demo/           # Local demo application for testing
├── playwright.config.ts
└── tsconfig.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- A Google Gemini API Key

### Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables:
   Create a `.env` file in the root:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

### Running Tests

To run the self-healing demonstration:
```bash
npm test
```

To run tests in headed mode:
```bash
npm run test:headed
```

## How It Works

### Self-Healing
When a `smartClick` or `smartFill` action fails due to a locator timeout, the framework captures the current DOM content and sends it to Gemini. The AI analyzes the DOM against the original "goal" of the action and returns a new, valid selector. The test then retries the action and logs the fix.

### Smart Visual Regression
Instead of a byte-for-byte pixel comparison, the framework sends two screenshots to Gemini Vision. The AI returns a structured JSON response indicating whether the change is a regression and provides a natural language explanation of its reasoning.

## License
MIT
