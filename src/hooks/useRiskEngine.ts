import { useMemo } from 'react';
import { RiskScorer, type RiskInputs } from '@/ai/RiskScorer';

export function useRiskEngine(inputs: RiskInputs) {
  return useMemo(() => new RiskScorer().compute(inputs), [JSON.stringify(inputs)]);
}
