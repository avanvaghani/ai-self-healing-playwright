import { describe, expect, test } from 'vitest';
import { getFallbackSelectors } from './ai-fixtures.js';

describe('getFallbackSelectors', () => {
  test('returns username fallbacks for username goal', () => {
    expect(getFallbackSelectors('fill the username input')).toEqual([
      'input[placeholder*="username" i]',
      'input[type="text"]',
    ]);
  });

  test('returns password fallbacks for password goal', () => {
    expect(getFallbackSelectors('fill password')).toEqual([
      'input[placeholder*="password" i]',
      'input[type="password"]',
    ]);
  });

  test('returns login button fallbacks for login goal', () => {
    expect(getFallbackSelectors('click the login button')).toContain('button[type="submit"]');
  });

  test('returns quantity fallbacks for quantity goal', () => {
    expect(getFallbackSelectors('set quantity to 2')).toEqual([
      'input[placeholder*="quantity" i]',
      'input[type="number"]',
    ]);
  });

  test('returns address fallbacks for address goal', () => {
    expect(getFallbackSelectors('fill the shipping address')).toEqual([
      'input[placeholder*="address" i]',
      'input[type="text"]',
    ]);
  });

  test('returns multiple text-based fallbacks for place order goal', () => {
    const fallbacks = getFallbackSelectors('place order');
    expect(fallbacks).toContain('button:has-text("Place Order")');
    expect(fallbacks).toContain('button:has-text("Pay Now")');
    expect(fallbacks).toContain('button[type="submit"]');
  });

  test('matches "checkout" and "purchase" synonyms for the order CTA', () => {
    expect(getFallbackSelectors('checkout')).toContain('button[type="submit"]');
    expect(getFallbackSelectors('complete the purchase')).toContain('button[type="submit"]');
  });

  test('is case-insensitive', () => {
    expect(getFallbackSelectors('FILL USERNAME')).toEqual(getFallbackSelectors('fill username'));
  });

  test('returns empty array for unknown goals', () => {
    expect(getFallbackSelectors('do something arbitrary')).toEqual([]);
  });
});
