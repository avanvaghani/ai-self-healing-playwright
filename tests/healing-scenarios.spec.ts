import { test, expect } from '../src/fixtures/ai-fixtures.js';
import { annotateScenario } from '../src/utils/qa-scenarios.js';

/**
 * Exercises three breakage modes the demo checkout page randomizes on every load:
 *  1. Dynamic ID         — quantity input
 *  2. Class rename + ID  — address input
 *  3. Text + class + ID  — order CTA button
 *
 * The fallback strategies in `ai-fixtures.ts` are designed to recover scenarios
 * 1 and 2 without an API call. Scenario 3 (the CTA) covers multiple text variants.
 * If fallbacks miss, AI healing kicks in (requires GEMINI_API_KEY).
 */
test.describe('Healing scenarios on the checkout page', () => {
  test('recovers from dynamic ID on a number input', async ({ smartPage }, testInfo) => {
    annotateScenario(testInfo, 'QA-UI-002');
    await smartPage.goto('http://localhost:8080/checkout.html');

    await smartPage.smartFill('#quantity-stable', '3', 'set quantity');

    const filled = await smartPage.locator('input[type="number"]').inputValue();
    expect(filled).toBe('3');
  });

  test('recovers from class rename on a text input', async ({ smartPage }, testInfo) => {
    annotateScenario(testInfo, 'QA-UI-002');
    await smartPage.goto('http://localhost:8080/checkout.html');

    await smartPage.smartFill('input.addr-input', '221B Baker Street', 'fill the shipping address');

    const filled = await smartPage.locator('input[placeholder*="address" i]').inputValue();
    expect(filled).toBe('221B Baker Street');
  });

  test('recovers from text + class change on the order button', async ({ smartPage }, testInfo) => {
    annotateScenario(testInfo, 'QA-UI-002');
    await smartPage.goto('http://localhost:8080/checkout.html');

    await smartPage.smartFill('#quantity-stable', '1', 'set quantity');
    await smartPage.smartFill('input.addr-input', '1 Test Lane', 'fill the shipping address');
    await smartPage.smartClick('button.primary-cta', 'place order');

    await expect(smartPage.locator('#confirm')).toBeVisible();
  });
});
