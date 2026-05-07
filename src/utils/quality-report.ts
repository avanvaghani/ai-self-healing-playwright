import * as fs from 'fs';
import * as path from 'path';
import { QA_SCENARIOS } from './qa-scenarios.js';
import type {
  FlakeSignal,
  HealingEvent,
  QaRunSummary,
  QualityGate,
  QualityGateResult,
  RecoveryStrategy,
  TestScenario,
} from '../types/qa-report.js';

export const REPORTS_DIR = path.join(process.cwd(), 'reports');

const gateOrder: QualityGate[] = [
  'self-healing',
  'api-contract',
  'accessibility',
  'performance',
  'visual',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isHealingEvent(value: unknown): value is HealingEvent {
  return (
    isRecord(value) &&
    typeof value.timestamp === 'string' &&
    typeof value.oldSelector === 'string' &&
    typeof value.newSelector === 'string' &&
    typeof value.goal === 'string' &&
    typeof value.url === 'string' &&
    (value.strategy === 'fallback' || value.strategy === 'ai')
  );
}

function uniqueEvents(events: HealingEvent[]): HealingEvent[] {
  const seen = new Set<string>();
  return events.filter((event) => {
    const key = [
      event.timestamp,
      event.oldSelector,
      event.newSelector,
      event.goal,
      event.url,
      event.strategy,
    ].join('|');
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function readHealingEventsFromFile(filePath: string): HealingEvent[] {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as unknown;

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.filter(isHealingEvent);
}

export function collectHealingEvents(
  rootDir = process.cwd(),
  reportsDir = path.join(rootDir, 'reports'),
): HealingEvent[] {
  const files: string[] = [];

  if (fs.existsSync(rootDir)) {
    files.push(
      ...fs
        .readdirSync(rootDir)
        .filter((fileName) => /^healed-selectors\.\d+\.json$/.test(fileName))
        .map((fileName) => path.join(rootDir, fileName)),
    );
  }

  if (fs.existsSync(reportsDir)) {
    files.push(
      ...fs
        .readdirSync(reportsDir)
        .filter((fileName) => /^healed-selectors(?:\.\d+)?\.json$/.test(fileName))
        .map((fileName) => path.join(reportsDir, fileName)),
    );
  }

  return uniqueEvents(files.flatMap(readHealingEventsFromFile));
}

export function summarizeHealingEvents(events: HealingEvent[]): Record<RecoveryStrategy, number> {
  return events.reduce<Record<RecoveryStrategy, number>>(
    (summary, event) => {
      summary[event.strategy] += 1;
      return summary;
    },
    { fallback: 0, ai: 0 },
  );
}

export function buildQualityGateResults(
  scenarios: TestScenario[] = QA_SCENARIOS,
): QualityGateResult[] {
  return gateOrder.map((gate) => {
    const gateScenarios = scenarios.filter((scenario) => scenario.gate === gate);
    return {
      gate,
      status: gateScenarios.length > 0 ? 'covered' : 'not-covered',
      totalScenarios: gateScenarios.length,
      criticalScenarios: gateScenarios.filter((scenario) => scenario.severity === 'critical')
        .length,
    };
  });
}

export function classifyFlakeSignals(events: HealingEvent[]): FlakeSignal[] {
  const grouped = new Map<string, HealingEvent[]>();

  for (const event of events) {
    const key = `${event.oldSelector}|${event.goal}|${event.url}`;
    grouped.set(key, [...(grouped.get(key) ?? []), event]);
  }

  const signals: FlakeSignal[] = [];

  for (const [key, group] of grouped) {
    const [oldSelector, goal, url] = key.split('|');
    const aiEvents = group.filter((event) => event.strategy === 'ai');

    if (group.length > 1) {
      signals.push({
        id: `flake-${signals.length + 1}`,
        source: `${goal} on ${url}`,
        signal: 'repeated-heal',
        count: group.length,
        recommendation: `Replace ${oldSelector} with a stable test id or role-based locator.`,
      });
    }

    if (aiEvents.length > 0) {
      signals.push({
        id: `flake-${signals.length + 1}`,
        source: `${goal} on ${url}`,
        signal: 'ai-recovery',
        count: aiEvents.length,
        recommendation: 'Promote the AI-recovered selector into the deterministic fallback map.',
      });
    } else {
      signals.push({
        id: `flake-${signals.length + 1}`,
        source: `${goal} on ${url}`,
        signal: 'selector-drift',
        count: group.length,
        recommendation: 'Review locator strategy before this fallback becomes a hidden dependency.',
      });
    }
  }

  return signals;
}

export function buildQaRunSummary(options: {
  healingEvents?: HealingEvent[];
  scenarios?: TestScenario[];
  generatedAt?: string;
  projectName?: string;
}): QaRunSummary {
  const healingEvents = options.healingEvents ?? [];
  const scenarios = options.scenarios ?? QA_SCENARIOS;
  const flakeSignals = classifyFlakeSignals(healingEvents);

  return {
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    projectName: options.projectName ?? 'QA Expert Lab: AI Self-Healing TestOps Suite',
    scenarioCount: scenarios.length,
    totalHealingEvents: healingEvents.length,
    healingByStrategy: summarizeHealingEvents(healingEvents),
    gates: buildQualityGateResults(scenarios),
    scenarios,
    flakeSignals,
    recommendations:
      flakeSignals.length > 0
        ? [
            'Review repeated healed selectors and convert stable recoveries into first-class locators.',
            'Track AI recoveries separately so model-assisted fixes stay auditable.',
          ]
        : ['No healed selector events found. Run qa:demo to generate recovery evidence.'],
  };
}

export function renderMarkdownSummary(summary: QaRunSummary): string {
  const gateRows = summary.gates
    .map(
      (gate) =>
        `| ${gate.gate} | ${gate.status} | ${gate.totalScenarios} | ${gate.criticalScenarios} |`,
    )
    .join('\n');

  const signalRows =
    summary.flakeSignals.length > 0
      ? summary.flakeSignals
          .map(
            (signal) =>
              `| ${signal.signal} | ${signal.count} | ${signal.source} | ${signal.recommendation} |`,
          )
          .join('\n')
      : '| none | 0 | No selector drift evidence collected | Run `npm run qa:demo` |';

  return `# QA Intelligence Report

Generated: ${summary.generatedAt}

Project: ${summary.projectName}

## Coverage

| Gate | Status | Scenarios | Critical |
| --- | --- | ---: | ---: |
${gateRows}

## Healing Evidence

- Total healed selector events: ${summary.totalHealingEvents}
- Fallback recoveries: ${summary.healingByStrategy.fallback}
- AI recoveries: ${summary.healingByStrategy.ai}

## Flake Signals

| Signal | Count | Source | Recommendation |
| --- | ---: | --- | --- |
${signalRows}
`;
}

export function writeQaArtifacts(
  summary: QaRunSummary,
  healingEvents: HealingEvent[],
  reportsDir = REPORTS_DIR,
): void {
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(
    path.join(reportsDir, 'healed-selectors.json'),
    JSON.stringify(healingEvents, null, 2),
  );
  fs.writeFileSync(
    path.join(reportsDir, 'flake-analysis.json'),
    JSON.stringify(summary.flakeSignals, null, 2),
  );
  fs.writeFileSync(path.join(reportsDir, 'quality-summary.json'), JSON.stringify(summary, null, 2));
  fs.writeFileSync(path.join(reportsDir, 'quality-summary.md'), renderMarkdownSummary(summary));
}
