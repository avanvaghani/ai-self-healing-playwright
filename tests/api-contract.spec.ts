import { test, expect } from '@playwright/test';
import { isWithinLatencyBudget, validateOrderContract } from '../src/utils/api-contract.js';
import { annotateScenario } from '../src/utils/qa-scenarios.js';

test.describe('API contract quality gates', () => {
  test('validates the happy-path order API contract', async ({ request }, testInfo) => {
    annotateScenario(testInfo, 'QA-API-001');

    const response = await request.get('http://localhost:8080/api/orders.valid.json');
    expect(response.ok()).toBe(true);

    const payload = await response.json();
    const result = validateOrderContract(payload);

    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  test('flags invalid order payloads with actionable errors', async ({ request }, testInfo) => {
    annotateScenario(testInfo, 'QA-API-002');

    const response = await request.get('http://localhost:8080/api/orders.invalid.json');
    expect(response.ok()).toBe(true);

    const payload = await response.json();
    const result = validateOrderContract(payload);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('orderId must be a non-empty string');
    expect(result.errors).toContain('customerEmail must be a valid email address');
    expect(result.errors).toContain('currency must be USD');
  });

  test('keeps the demo API inside the response-time budget', async ({ request }, testInfo) => {
    annotateScenario(testInfo, 'QA-PERF-001');

    const startedAt = Date.now();
    const response = await request.get('http://localhost:8080/api/orders.valid.json');
    const elapsedMs = Date.now() - startedAt;
    const payload = await response.json();

    expect(response.ok()).toBe(true);
    expect(elapsedMs).toBeLessThan(1000);
    expect(isWithinLatencyBudget(payload.responseTimeMs, 250)).toBe(true);
  });
});
