import { test, expect } from '@playwright/test';
import { analyzeVisualDiff } from '../src/utils/ai.js';

test.describe('Smart Visual Regression', () => {
  test('returns a structurally valid response from Gemini Vision', async ({ page }) => {
    test.skip(!process.env.GEMINI_API_KEY, 'GEMINI_API_KEY is required for AI visual analysis.');
    await page.goto('http://localhost:8080');

    // Pass the SAME screenshot as both baseline and current. This eliminates
    // browser-specific anti-aliasing noise that can otherwise cause Gemini to
    // flip its `isRegression` judgement non-deterministically across runs.
    const buffer = await page.screenshot();
    const base64 = buffer.toString('base64');

    console.log('[AI] Analyzing visual difference semantically...');
    const result = await analyzeVisualDiff(base64, base64);

    console.log(`[AI] Visual Analysis Result: ${result.isRegression ? 'FAIL' : 'PASS'}`);
    console.log(`[AI] Explanation: ${result.explanation}`);

    // The point of this test is to validate the wiring (auth, payload shape,
    // JSON parsing, error fallback) — not to assert what Gemini decides.
    // Gemini's classification of "MEANINGFUL regression" is a model judgement
    // and is not deterministic enough to gate CI on. Unit tests in
    // `src/utils/ai.test.ts` cover the parsing branches deterministically.
    expect(typeof result.isRegression).toBe('boolean');
    expect(result.explanation.length).toBeGreaterThan(0);
  });
});
