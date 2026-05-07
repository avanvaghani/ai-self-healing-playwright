import { test as base, Page } from '@playwright/test';
import { healSelector } from '../utils/ai.js';
import * as fs from 'fs';
import * as path from 'path';

// Define the type for our custom fixture
type SmartPage = Page & {
  smartClick: (selector: string, goal: string) => Promise<void>;
  smartFill: (selector: string, value: string, goal: string) => Promise<void>;
};

type HealedSelectorLogEntry = {
  timestamp: string;
  oldSelector: string;
  newSelector: string;
  goal: string;
  url: string;
  strategy: 'fallback' | 'ai';
};

export function getFallbackSelectors(goal: string): string[] {
  const normalizedGoal = goal.toLowerCase();

  if (normalizedGoal.includes('username')) {
    return ['input[placeholder*="username" i]', 'input[type="text"]'];
  }
  if (normalizedGoal.includes('password')) {
    return ['input[placeholder*="password" i]', 'input[type="password"]'];
  }
  if (normalizedGoal.includes('login')) {
    return ['button:has-text("Login")', 'button[type="submit"]'];
  }
  if (normalizedGoal.includes('quantity')) {
    return ['input[placeholder*="quantity" i]', 'input[type="number"]'];
  }
  if (normalizedGoal.includes('address')) {
    return ['input[placeholder*="address" i]', 'input[type="text"]'];
  }
  if (
    normalizedGoal.includes('place order') ||
    normalizedGoal.includes('checkout') ||
    normalizedGoal.includes('purchase')
  ) {
    return [
      'button:has-text("Place Order")',
      'button:has-text("Confirm Order")',
      'button:has-text("Submit Order")',
      'button:has-text("Pay Now")',
      'button:has-text("Complete Purchase")',
      'button[type="submit"]',
    ];
  }

  return [];
}

async function tryActionWithFallbacks(
  page: Page,
  action: 'click' | 'fill',
  value: string | undefined,
  selectors: string[],
): Promise<string | null> {
  for (const candidate of selectors) {
    try {
      if (action === 'click') {
        await page.click(candidate, { timeout: 1500 });
      } else {
        await page.fill(candidate, value ?? '', { timeout: 1500 });
      }
      return candidate;
    } catch {
      // Continue trying the next candidate selector.
    }
  }
  return null;
}

export const test = base.extend<{ smartPage: SmartPage }>({
  smartPage: async ({ page }, use) => {
    // Per-worker file so parallel Playwright workers do not corrupt each other's writes.
    const workerIndex = process.env.TEST_PARALLEL_INDEX ?? '0';
    const reportsDir = path.join(process.cwd(), 'reports');
    fs.mkdirSync(reportsDir, { recursive: true });
    const healedSelectorsFile = path.join(reportsDir, `healed-selectors.${workerIndex}.json`);

    const logHealedSelector = (
      oldSelector: string,
      newSelector: string,
      goal: string,
      strategy: HealedSelectorLogEntry['strategy'],
    ) => {
      let log: HealedSelectorLogEntry[] = [];
      if (fs.existsSync(healedSelectorsFile)) {
        try {
          log = JSON.parse(fs.readFileSync(healedSelectorsFile, 'utf-8'));
        } catch {
          // Corrupted file from a previous interrupted run — start fresh.
          log = [];
        }
      }
      log.push({
        timestamp: new Date().toISOString(),
        oldSelector,
        newSelector,
        goal,
        url: page.url(),
        strategy,
      });
      fs.writeFileSync(healedSelectorsFile, JSON.stringify(log, null, 2));
    };

    const smartPage: SmartPage = Object.assign(page, {
      smartClick: async (selector: string, goal: string) => {
        try {
          await page.click(selector, { timeout: 5000 });
        } catch (error) {
          const fallbackSelector = await tryActionWithFallbacks(
            page,
            'click',
            undefined,
            getFallbackSelectors(goal),
          );
          if (fallbackSelector) {
            console.log(`[Recovery] Fallback selector found: "${fallbackSelector}".`);
            logHealedSelector(selector, fallbackSelector, goal, 'fallback');
            return;
          }

          console.log(`[AI] Selector "${selector}" failed. Attempting AI healing...`);
          const dom = await page.content();
          const newSelector = await healSelector(selector, dom, goal);

          if (!newSelector) {
            throw error;
          }

          console.log(`[AI] Healed selector found: "${newSelector}". Retrying click...`);
          await page.click(newSelector);
          logHealedSelector(selector, newSelector, goal, 'ai');
        }
      },

      smartFill: async (selector: string, value: string, goal: string) => {
        try {
          await page.fill(selector, value, { timeout: 5000 });
        } catch (error) {
          const fallbackSelector = await tryActionWithFallbacks(
            page,
            'fill',
            value,
            getFallbackSelectors(goal),
          );
          if (fallbackSelector) {
            console.log(`[Recovery] Fallback selector found: "${fallbackSelector}".`);
            logHealedSelector(selector, fallbackSelector, goal, 'fallback');
            return;
          }

          console.log(`[AI] Selector "${selector}" failed. Attempting AI healing...`);
          const dom = await page.content();
          const newSelector = await healSelector(selector, dom, goal);

          if (!newSelector) {
            throw error;
          }

          console.log(`[AI] Healed selector found: "${newSelector}". Retrying fill...`);
          await page.fill(newSelector, value);
          logHealedSelector(selector, newSelector, goal, 'ai');
        }
      },
    });

    await use(smartPage);
  },
});

export { expect } from '@playwright/test';
