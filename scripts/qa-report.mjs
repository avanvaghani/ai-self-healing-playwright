import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const reportsDir = path.join(rootDir, 'reports');

const scenarios = [
  { id: 'QA-UI-001', gate: 'self-healing', severity: 'high' },
  { id: 'QA-UI-002', gate: 'self-healing', severity: 'high' },
  { id: 'QA-API-001', gate: 'api-contract', severity: 'critical' },
  { id: 'QA-API-002', gate: 'api-contract', severity: 'high' },
  { id: 'QA-A11Y-001', gate: 'accessibility', severity: 'high' },
  { id: 'QA-PERF-001', gate: 'performance', severity: 'medium' },
  { id: 'QA-VIS-001', gate: 'visual', severity: 'medium' },
];

const gateOrder = ['self-healing', 'api-contract', 'accessibility', 'performance', 'visual'];

function readJsonArray(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function collectHealingEvents() {
  const files = [];

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

  const seen = new Set();
  return files
    .flatMap(readJsonArray)
    .filter((event) => event.strategy === 'fallback' || event.strategy === 'ai')
    .filter((event) => {
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

function summarizeHealing(events) {
  return events.reduce(
    (summary, event) => {
      summary[event.strategy] += 1;
      return summary;
    },
    { fallback: 0, ai: 0 },
  );
}

function buildGateSummary() {
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

function classifyFlakeSignals(events) {
  const grouped = new Map();

  for (const event of events) {
    const key = `${event.oldSelector}|${event.goal}|${event.url}`;
    grouped.set(key, [...(grouped.get(key) ?? []), event]);
  }

  const signals = [];

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

    signals.push({
      id: `flake-${signals.length + 1}`,
      source: `${goal} on ${url}`,
      signal: aiEvents.length > 0 ? 'ai-recovery' : 'selector-drift',
      count: aiEvents.length > 0 ? aiEvents.length : group.length,
      recommendation:
        aiEvents.length > 0
          ? 'Promote the AI-recovered selector into the deterministic fallback map.'
          : 'Review locator strategy before this fallback becomes a hidden dependency.',
    });
  }

  return signals;
}

function renderMarkdown(summary) {
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

const healingEvents = collectHealingEvents();
const summary = {
  generatedAt: new Date().toISOString(),
  projectName: 'QA Expert Lab: AI Self-Healing TestOps Suite',
  scenarioCount: scenarios.length,
  totalHealingEvents: healingEvents.length,
  healingByStrategy: summarizeHealing(healingEvents),
  gates: buildGateSummary(),
  scenarios,
  flakeSignals: classifyFlakeSignals(healingEvents),
  recommendations:
    healingEvents.length > 0
      ? [
          'Review repeated healed selectors and convert stable recoveries into first-class locators.',
          'Track AI recoveries separately so model-assisted fixes stay auditable.',
        ]
      : ['No healed selector events found. Run qa:demo to generate recovery evidence.'],
};

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
fs.writeFileSync(path.join(reportsDir, 'quality-summary.md'), renderMarkdown(summary));

console.log(`QA report generated: ${path.join('reports', 'quality-summary.md')}`);
