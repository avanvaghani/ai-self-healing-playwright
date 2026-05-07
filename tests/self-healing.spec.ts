import { test, expect } from '../src/fixtures/ai-fixtures.js';
import { annotateScenario } from '../src/utils/qa-scenarios.js';

test.describe('AI Self-Healing Tests', () => {
  test('should login successfully even with broken selectors', async ({ smartPage }, testInfo) => {
    annotateScenario(testInfo, 'QA-UI-001');
    await smartPage.goto('http://localhost:8080');

    // These selectors are "broken" because the demo page randomizes them on load.
    // The smartPage fixture will use AI to heal them.

    await smartPage.smartFill('#username-stable', 'admin', 'fill the username input');
    await smartPage.smartFill('#password-stable', 'password123', 'fill the password input');
    await smartPage.smartClick('#login-button-stable', 'click the login button');

    // Verify login success
    await expect(smartPage.locator('#message')).toBeVisible();
    await expect(smartPage.locator('#message')).toHaveText('Login Successful!');
  });
});
