// ═══════════════════════════════════════════════════════════
// Predictive Safety Score (0-100) — ahead-of-time signal
// Combines recent incidents, zone discipline, heartbeat stability,
// motion anomalies. Predicts next 24h risk trend.
// ═══════════════════════════════════════════════════════════

import type { Incident, SafetyScore } from '@/types';

interface Inputs {
  incidents: Incident[];      // last 7 days
  zoneDiscipline: number;     // 0..1 (higher = better)
  heartbeatStability: number; // 0..1 (higher = better)
  motionAnomalies24h: number;
  mockSuspicions24h: number;
}

export class PredictiveSafetyScore {
  compute(inputs: Inputs): SafetyScore {
    const { incidents, zoneDiscipline, heartbeatStability } = inputs;

    const weights = {
      zoneDiscipline: 0.30,
      heartbeatStability: 0.25,
      incidentPenalty: 0.30,
      motionPenalty: 0.10,
      mockPenalty: 0.05,
    };

    const now = Date.now();
    const last7d = incidents.filter((i) => now - i.startedAt < 7 * 24 * 3600 * 1000);
    const severityWeight: Record<string, number> = {
      safe: 0, low: 1, medium: 3, high: 7, critical: 12,
    };
    const incidentPenalty = Math.min(
      1,
      last7d.reduce((sum, i) => sum + (severityWeight[i.severity] ?? 1), 0) / 40
    );

    const motionPenalty = Math.min(1, inputs.motionAnomalies24h / 8);
    const mockPenalty = Math.min(1, inputs.mockSuspicions24h / 3);

    const raw =
      weights.zoneDiscipline * zoneDiscipline +
      weights.heartbeatStability * heartbeatStability +
      weights.incidentPenalty * (1 - incidentPenalty) +
      weights.motionPenalty * (1 - motionPenalty) +
      weights.mockPenalty * (1 - mockPenalty);

    const score = Math.round(raw * 100);

    // Trend from incidents timeline (last 3 days vs previous 4)
    const recent = last7d.filter((i) => now - i.startedAt < 3 * 24 * 3600 * 1000).length;
    const older = last7d.length - recent;
    const trend: SafetyScore['trend'] =
      recent < older ? 'improving' : recent > older ? 'declining' : 'stable';

    // Predicted next 24h: naive projection from trend
    const projected =
      trend === 'improving' ? Math.min(100, score + 5) :
      trend === 'declining' ? Math.max(0, score - 7) :
      score;

    return {
      score,
      trend,
      predictedNext24h: projected,
      factors: [
        { name: 'zoneDiscipline', impact: Math.round(weights.zoneDiscipline * zoneDiscipline * 100) },
        { name: 'heartbeat', impact: Math.round(weights.heartbeatStability * heartbeatStability * 100) },
        { name: 'incidents', impact: -Math.round(incidentPenalty * 100) },
        { name: 'motion', impact: -Math.round(motionPenalty * 100) },
        { name: 'mock', impact: -Math.round(mockPenalty * 100) },
      ],
    };
  }
}
