import { DFA, StringTestResult } from '../types';
import { simulateStringOnDFA } from './stringSimulator';

/**
 * Generates sample valid (accepted) and invalid (rejected) strings for a DFA
 */
export function generateSampleStrings(
  dfa: DFA,
  maxLength: number = 6,
  maxAcceptedCount: number = 8,
  maxRejectedCount: number = 8
): {
  accepted: StringTestResult[];
  rejected: StringTestResult[];
} {
  const alphabet = dfa.alphabet.length > 0 ? dfa.alphabet : ['a', 'b'];
  const accepted: StringTestResult[] = [];
  const rejected: StringTestResult[] = [];
  
  const visited = new Set<string>();
  
  // BFS queue: string
  const queue: string[] = [''];
  visited.add('');
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    const sim = simulateStringOnDFA(dfa, current);
    
    const path = sim.steps.map(s => s.toState || 'trap');
    
    if (sim.isAccepted) {
      if (accepted.length < maxAcceptedCount) {
        accepted.push({
          input: current === '' ? 'ε (empty string)' : current,
          isAccepted: true,
          path,
        });
      }
    } else {
      if (rejected.length < maxRejectedCount && current !== '') {
        rejected.push({
          input: current,
          isAccepted: false,
          path,
        });
      }
    }
    
    if (accepted.length >= maxAcceptedCount && rejected.length >= maxRejectedCount) {
      break;
    }
    
    if (current.length < maxLength) {
      for (const sym of alphabet) {
        const nextStr = current + sym;
        if (!visited.has(nextStr)) {
          visited.add(nextStr);
          queue.push(nextStr);
        }
      }
    }
  }
  
  return { accepted, rejected };
}
