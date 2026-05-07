import type { TestInfo } from '@playwright/test';
import type { TestScenario } from '../types/qa-report.js';

export const QA_SCENARIOS: TestScenario[] = [
  {
    id: 'QA-UI-001',
    title: 'Login flow recovers from dynamic authentication selectors',
    gate: 'self-healing',
    riskArea: 'Authentication locator drift',
    severity: 'high',
    tags: ['playwright', 'self-healing', 'ui'],
  },
  {
    id: 'QA-UI-002',
    title: 'Checkout flow recovers dynamic IDs, class renames, and CTA text changes',
    gate: 'self-healing',
    riskArea: 'Checkout locator drift',
    severity: 'high',
    tags: ['playwright', 'self-healing', 'checkout'],
  },
  {
    id: 'QA-API-001',
    title: 'Order API response satisfies the required contract',
    gate: 'api-contract',
    riskArea: 'API schema compatibility',
    severity: 'critical',
    tags: ['api', 'contract', 'schema'],
  },
  {
    id: 'QA-API-002',
    title: 'Order API contract failures return actionable validation errors',
    gate: 'api-contract',
    riskArea: 'API defect diagnosis',
    severity: 'high',
    tags: ['api', 'negative', 'schema'],
  },
  {
    id: 'QA-A11Y-001',
    title: 'Checkout page has no serious accessibility violations',
    gate: 'accessibility',
    riskArea: 'Accessible checkout completion',
    severity: 'high',
    tags: ['accessibility', 'axe', 'checkout'],
  },
  {
    id: 'QA-PERF-001',
    title: 'Checkout page renders inside the local performance budget',
    gate: 'performance',
    riskArea: 'User-perceived page load speed',
    severity: 'medium',
    tags: ['performance', 'navigation', 'checkout'],
  },
  {
    id: 'QA-VIS-001',
    title: 'Semantic visual analysis validates screenshot payloads',
    gate: 'visual',
    riskArea: 'Visual regression triage',
    severity: 'medium',
    tags: ['visual', 'gemini', 'screenshots'],
  },
];

export function getScenario(id: string): TestScenario {
  const scenario = QA_SCENARIOS.find((candidate) => candidate.id === id);

  if (!scenario) {
    throw new Error(`Unknown QA scenario: ${id}`);
  }

  return scenario;
}

export function annotateScenario(testInfo: TestInfo, scenarioId: string): TestScenario {
  const scenario = getScenario(scenarioId);
  testInfo.annotations.push({ type: 'scenario', description: scenario.id });
  testInfo.annotations.push({ type: 'quality-gate', description: scenario.gate });
  testInfo.annotations.push({ type: 'risk-area', description: scenario.riskArea });
  return scenario;
}
