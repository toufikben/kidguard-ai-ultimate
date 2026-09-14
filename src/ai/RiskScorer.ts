// ═══════════════════════════════════════════════════════════
// Risk Scorer — combines all signals into a single level
// Feeds AlertEscalation + Heartbeat + incident creation.
// ═══════════════════════════════════════════════════════════

import type { RiskLevel } from '@/types';
import { RISK_WEIGHTS } from '@/utils/constants';

export interface RiskInputs {
  outsideZone: boolean;
  heartbeatLost: boolean;
  mockScore: number;             // 0..1
  antitheftTriggered: boolean;
  panicWord: boolean;
  heartRateAnomaly: boolean;
  motionAnomaly: boolean;
  deadmanExpired: boolean;
  anomalyConfidence: number;     // 0..1
}

export interface RiskBreakdown {
  score: number;
  level: RiskLevel;
  factors: { name: string; contribution: number }[];
}

export class RiskScorer {
  compute(inp: RiskInputs): RiskBreakdown {
    const factors: { name: string; contribution: number }[] = [];
    let score = 0;

    const add = (name: string, value: number) => {
      if (value > 0) {
        factors.push({ name, contribution: value });
        score += value;
      }
    };

    add('outsideZone', inp.outsideZone ? RISK_WEIGHTS.outsideZone : 0);
    add('heartbeatLost', inp.heartbeatLost ? RISK_WEIGHTS.heartbeatLost : 0);
    add('mockLocation', inp.mockScore * RISK_WEIGHTS.mockLocation);
    add('antitheft', inp.antitheftTriggered ? RISK_WEIGHTS.antitheftTriggered : 0);
    add('panicWord', inp.panicWord ? RISK_WEIGHTS.panicWord : 0);
    add('heartRateAnomaly', inp.heartRateAnomaly ? RISK_WEIGHTS.heartRateAnomaly : 0);
    add('motionAnomaly', inp.motionAnomaly ? RISK_WEIGHTS.motionAnomaly : 0);
    add('deadman', inp.deadmanExpired ? RISK_WEIGHTS.deadmanExpired : 0);
    add('anomalyConfidence', inp.anomalyConfidence * 15);

    score = Math.min(100, Math.round(score));

    let level: RiskLevel = 'safe';
    if (score >= 80) level = 'critical';
    else if (score >= 55) level = 'high';
    else if (score >= 30) level = 'medium';
    else if (score >= 12) level = 'low';

    return { score, level, factors };
  }
}
