import { test as base, Page, Locator } from '@playwright/test';
import { healSelector } from '../utils/ai.js';
import * as fs from 'fs';
import * as path from 'path';

// Define the type for our custom fixture
type SmartPage = Page & {
  smartClick: (selector: string, goal: string) => Promise<void>;
  smartFill: (selector: string, value: string, goal: string) => Promise<void>;
};

export const test = base.extend<{ smartPage: SmartPage }>({
  smartPage: async ({ page }, use) => {
    const healedSelectorsFile = path.join(process.cwd(), 'healed-selectors.json');

    const logHealedSelector = (oldSelector: string, newSelector: string, goal: string) => {
      let log = [];
      if (fs.existsSync(healedSelectorsFile)) {
        log = JSON.parse(fs.readFileSync(healedSelectorsFile, 'utf-8'));
      }
      log.push({
        timestamp: new Date().toISOString(),
        oldSelector,
        newSelector,
        goal,
        url: page.url()
      });
      fs.writeFileSync(healedSelectorsFile, JSON.stringify(log, null, 2));
    };

    const smartPage: SmartPage = Object.assign(page, {
      smartClick: async (selector: string, goal: string) => {
        try {
          await page.click(selector, { timeout: 5000 });
        } catch (error) {
          console.log(`[AI] Selector "${selector}" failed. Attempting to heal...`);
          const dom = await page.content();
          const newSelector = await healSelector(selector, dom, goal);
          
          if (newSelector) {
            console.log(`[AI] Healed selector found: "${newSelector}". Retrying click...`);
            await page.click(newSelector);
            logHealedSelector(selector, newSelector, goal);
          } else {
            throw error;
          }
        }
      },

      smartFill: async (selector: string, value: string, goal: string) => {
        try {
          await page.fill(selector, value, { timeout: 5000 });
        } catch (error) {
          console.log(`[AI] Selector "${selector}" failed. Attempting to heal...`);
          const dom = await page.content();
          const newSelector = await healSelector(selector, dom, goal);
          
          if (newSelector) {
            console.log(`[AI] Healed selector found: "${newSelector}". Retrying fill...`);
            await page.fill(newSelector, value);
            logHealedSelector(selector, newSelector, goal);
          } else {
            throw error;
          }
        }
      }
    });

    await use(smartPage);
  },
});

export { expect } from '@playwright/test';
