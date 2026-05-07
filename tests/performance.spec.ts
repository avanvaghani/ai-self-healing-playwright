import { test, expect } from '@playwright/test';
import { annotateScenario } from '../src/utils/qa-scenarios.js';

type NavigationTiming = {
  domContentLoadedMs: number;
  loadMs: number;
};

test.describe('Performance quality gates', () => {
  test('checkout page renders inside the local performance budget', async ({ page }, testInfo) => {
    annotateScenario(testInfo, 'QA-PERF-001');

    await page.goto('http://localhost:8080/checkout.html');

    const timing = await page.evaluate<NavigationTiming>(() => {
      const [entry] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];

      return {
        domContentLoadedMs: entry.domContentLoadedEventEnd - entry.startTime,
        loadMs: entry.loadEventEnd - entry.startTime,
      };
    });

    expect(timing.domContentLoadedMs).toBeLessThan(1500);
    expect(timing.loadMs).toBeLessThan(2500);
  });
});
