import { test, expect } from '@playwright/test';
import { analyzeVisualDiff } from '../src/utils/ai.js';

test.describe('Smart Visual Regression', () => {

  test('should analyze visual differences semantically', async ({ page }) => {
    test.skip(!process.env.GEMINI_API_KEY, 'GEMINI_API_KEY is required for AI visual analysis.');
    await page.goto('http://localhost:8080');
    
    // Capture "Baseline" (simulated by just taking a screenshot now)
    const baselineBuffer = await page.screenshot();
    const baselineBase64 = baselineBuffer.toString('base64');

    // Keep the second capture unchanged to validate a clear non-regression scenario.
    const currentBuffer = await page.screenshot();
    const currentBase64 = currentBuffer.toString('base64');

    console.log('[AI] Analyzing visual difference semantically...');
    const result = await analyzeVisualDiff(baselineBase64, currentBase64);

    console.log(`[AI] Visual Analysis Result: ${result.isRegression ? 'FAIL' : 'PASS'}`);
    console.log(`[AI] Explanation: ${result.explanation}`);

    expect(result.isRegression).toBe(false);
    expect(result.explanation.length).toBeGreaterThan(0);
  });

});
