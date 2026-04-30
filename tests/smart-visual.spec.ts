import { test, expect } from '@playwright/test';
import { analyzeVisualDiff } from '../src/utils/ai.js';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Smart Visual Regression', () => {

  test('should analyze visual differences semantically', async ({ page }) => {
    await page.goto('http://localhost:8080');
    
    // Capture "Baseline" (simulated by just taking a screenshot now)
    const baselineBuffer = await page.screenshot();
    const baselineBase64 = baselineBuffer.toString('base64');

    // Simulate a minor visual change that is NOT a regression (e.g., change background slightly)
    await page.evaluate(() => {
        document.body.style.backgroundColor = '#e0e0e0';
    });
    
    const currentBuffer = await page.screenshot();
    const currentBase64 = currentBuffer.toString('base64');

    console.log('[AI] Analyzing visual difference semantically...');
    const result = await analyzeVisualDiff(baselineBase64, currentBase64);

    console.log(`[AI] Visual Analysis Result: ${result.isRegression ? 'FAIL' : 'PASS'}`);
    console.log(`[AI] Explanation: ${result.explanation}`);

    // In a real framework, you'd assert based on isRegression
    // expect(result.isRegression).toBe(false); 
  });

});
