export type QualityGate =
  | 'self-healing'
  | 'api-contract'
  | 'accessibility'
  | 'performance'
  | 'visual';

export type ScenarioSeverity = 'critical' | 'high' | 'medium' | 'low';

export type GateStatus = 'covered' | 'not-covered';

export type RecoveryStrategy = 'fallback' | 'ai';

export type HealingEvent = {
  timestamp: string;
  oldSelector: string;
  newSelector: string;
  goal: string;
  url: string;
  strategy: RecoveryStrategy;
};

export type TestScenario = {
  id: string;
  title: string;
  gate: QualityGate;
  riskArea: string;
  severity: ScenarioSeverity;
  tags: string[];
};

export type FlakeSignal = {
  id: string;
  source: string;
  signal: 'selector-drift' | 'ai-recovery' | 'repeated-heal';
  count: number;
  recommendation: string;
};

export type QualityGateResult = {
  gate: QualityGate;
  status: GateStatus;
  totalScenarios: number;
  criticalScenarios: number;
};

export type QaRunSummary = {
  generatedAt: string;
  projectName: string;
  scenarioCount: number;
  totalHealingEvents: number;
  healingByStrategy: Record<RecoveryStrategy, number>;
  gates: QualityGateResult[];
  scenarios: TestScenario[];
  flakeSignals: FlakeSignal[];
  recommendations: string[];
};
