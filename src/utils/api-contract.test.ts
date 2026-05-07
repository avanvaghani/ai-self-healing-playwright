import { describe, expect, test } from 'vitest';
import { isWithinLatencyBudget, validateOrderContract } from './api-contract.js';

const validOrder = {
  orderId: 'ord_1001',
  customerEmail: 'qa@example.com',
  items: [{ sku: 'SKU-1', quantity: 2, price: 24.5 }],
  total: 49,
  currency: 'USD',
  status: 'created',
  responseTimeMs: 128,
};

describe('validateOrderContract', () => {
  test('accepts a valid order payload', () => {
    expect(validateOrderContract(validOrder)).toEqual({ valid: true, errors: [] });
  });

  test('returns actionable errors for invalid fields', () => {
    const result = validateOrderContract({
      orderId: '',
      customerEmail: 'broken-email',
      items: [{ sku: '', quantity: 0, price: -1 }],
      total: 0,
      currency: 'EUR',
      status: 'unknown',
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('orderId must be a non-empty string');
    expect(result.errors).toContain('customerEmail must be a valid email address');
    expect(result.errors).toContain('items[0].sku must be a non-empty string');
    expect(result.errors).toContain('currency must be USD');
  });

  test('rejects non-object payloads', () => {
    expect(validateOrderContract(null)).toEqual({
      valid: false,
      errors: ['payload must be an object'],
    });
  });
});

describe('isWithinLatencyBudget', () => {
  test('accepts values inside the budget', () => {
    expect(isWithinLatencyBudget(150, 250)).toBe(true);
  });

  test('rejects values outside the budget', () => {
    expect(isWithinLatencyBudget(500, 250)).toBe(false);
  });
});
