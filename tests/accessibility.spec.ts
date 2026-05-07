import { AxeBuilder } from '@axe-core/playwright';
import { test, expect } from '@playwright/test';
import { annotateScenario } from '../src/utils/qa-scenarios.js';

test.describe('Accessibility quality gates', () => {
  test('checkout page has no serious accessibility violations', async ({ page }, testInfo) => {
    annotateScenario(testInfo, 'QA-A11Y-001');

    await page.goto('http://localhost:8080/checkout.html');

    const results = await new AxeBuilder({ page }).include('body').analyze();
    const seriousViolations = results.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    );

    expect(
      seriousViolations,
      JSON.stringify(
        seriousViolations.map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          nodes: violation.nodes.length,
        })),
      ),
    ).toEqual([]);
  });
});
