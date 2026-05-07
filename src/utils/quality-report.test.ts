import { describe, expect, test } from 'vitest';
import type { HealingEvent, TestScenario } from '../types/qa-report.js';
import {
  buildQaRunSummary,
  buildQualityGateResults,
  classifyFlakeSignals,
  renderMarkdownSummary,
  summarizeHealingEvents,
} from './quality-report.js';

const healingEvents: HealingEvent[] = [
  {
    timestamp: '2026-05-07T00:00:00.000Z',
    oldSelector: '#login-button-stable',
    newSelector: 'button[type="submit"]',
    goal: 'click the login button',
    url: 'http://localhost:8080/',
    strategy: 'fallback',
  },
  {
    timestamp: '2026-05-07T00:00:01.000Z',
    oldSelector: '#login-button-stable',
    newSelector: 'button[type="submit"]',
    goal: 'click the login button',
    url: 'http://localhost:8080/',
    strategy: 'fallback',
  },
  {
    timestamp: '2026-05-07T00:00:02.000Z',
    oldSelector: '#submit',
    newSelector: 'button.checkout',
    goal: 'place order',
    url: 'http://localhost:8080/checkout.html',
    strategy: 'ai',
  },
];

const scenarios: TestScenario[] = [
  {
    id: 'QA-API-001',
    title: 'API contract',
    gate: 'api-contract',
    riskArea: 'schema',
    severity: 'critical',
    tags: ['api'],
  },
];

describe('quality report helpers', () => {
  test('summarizes healing events by strategy', () => {
    expect(summarizeHealingEvents(healingEvents)).toEqual({ fallback: 2, ai: 1 });
  });

  test('builds quality gate coverage from scenario metadata', () => {
    const gates = buildQualityGateResults(scenarios);
    const apiGate = gates.find((gate) => gate.gate === 'api-contract');

    expect(apiGate).toEqual({
      gate: 'api-contract',
      status: 'covered',
      totalScenarios: 1,
      criticalScenarios: 1,
    });
  });

  test('classifies repeated selector healing and AI recovery signals', () => {
    const signals = classifyFlakeSignals(healingEvents);

    expect(signals.some((signal) => signal.signal === 'repeated-heal')).toBe(true);
    expect(signals.some((signal) => signal.signal === 'ai-recovery')).toBe(true);
  });

  test('builds a complete QA run summary', () => {
    const summary = buildQaRunSummary({
      healingEvents,
      scenarios,
      generatedAt: '2026-05-07T00:00:00.000Z',
    });

    expect(summary.projectName).toContain('QA Expert Lab');
    expect(summary.totalHealingEvents).toBe(3);
    expect(summary.scenarioCount).toBe(1);
    expect(summary.recommendations.length).toBeGreaterThan(0);
  });

  test('renders markdown suitable for a CI artifact', () => {
    const markdown = renderMarkdownSummary(
      buildQaRunSummary({
        healingEvents: [],
        scenarios,
        generatedAt: '2026-05-07T00:00:00.000Z',
      }),
    );

    expect(markdown).toContain('# QA Intelligence Report');
    expect(markdown).toContain('| api-contract | covered | 1 | 1 |');
  });
});
