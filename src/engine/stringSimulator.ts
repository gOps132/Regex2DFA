import { DFA, SimulationStep } from '../types';

/**
 * Runs a string on the given DFA and returns detailed step-by-step trace
 */
export function simulateStringOnDFA(dfa: DFA, input: string): {
  isAccepted: boolean;
  steps: SimulationStep[];
  finalState: string | null;
} {
  const steps: SimulationStep[] = [];
  
  if (dfa.states.length === 0 || !dfa.startStateId) {
    return {
      isAccepted: false,
      steps: [],
      finalState: null,
    };
  }
  
  let currentState: string | null = dfa.startStateId;
  const isStartAccept = dfa.acceptStateIds.includes(currentState);
  
  // Step 0: Initial state before consuming any character
  steps.push({
    stepIndex: 0,
    char: null,
    fromState: currentState,
    toState: currentState,
    consumedString: '',
    remainingString: input,
    isValidTransition: true,
    isAccepted: input.length === 0 ? isStartAccept : false,
  });
  
  if (input.length === 0) {
    return {
      isAccepted: isStartAccept,
      steps,
      finalState: currentState,
    };
  }
  
  let consumed = '';
  
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    consumed += char;
    const remaining = input.slice(i + 1);
    
    if (currentState === null) {
      // Already rejected/in invalid state
      steps.push({
        stepIndex: i + 1,
        char,
        fromState: 'TRAP/DEAD',
        toState: null,
        consumedString: consumed,
        remainingString: remaining,
        isValidTransition: false,
        isAccepted: false,
      });
      continue;
    }
    
    const nextState = dfa.transitionMap[currentState]?.[char] || null;
    const isStepAccepted = (i === input.length - 1) && (nextState !== null) && dfa.acceptStateIds.includes(nextState);
    
    steps.push({
      stepIndex: i + 1,
      char,
      fromState: currentState,
      toState: nextState,
      consumedString: consumed,
      remainingString: remaining,
      isValidTransition: nextState !== null,
      isAccepted: isStepAccepted,
    });
    
    currentState = nextState;
  }
  
  const finalAccepted = currentState !== null && dfa.acceptStateIds.includes(currentState);
  
  return {
    isAccepted: finalAccepted,
    steps,
    finalState: currentState,
  };
}
