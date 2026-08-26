import { DFA, DFAState, DFATransition, NFA } from '../types';
import { EPSILON } from './thompson';

/**
 * Computes epsilon-closure of a set of NFA states
 */
export function epsilonClosure(states: Set<number>, nfa: NFA): Set<number> {
  const closure = new Set<number>(states);
  const stack = Array.from(states);
  
  while (stack.length > 0) {
    const current = stack.pop()!;
    for (const t of nfa.transitions) {
      if (t.from === current && t.symbol === EPSILON) {
        if (!closure.has(t.to)) {
          closure.add(t.to);
          stack.push(t.to);
        }
      }
    }
  }
  
  return closure;
}

/**
 * Move(states, symbol) - computes states reachable on symbol
 */
export function move(states: Set<number>, symbol: string, nfa: NFA): Set<number> {
  const result = new Set<number>();
  for (const s of states) {
    for (const t of nfa.transitions) {
      if (t.from === s && t.symbol === symbol) {
        result.add(t.to);
      }
    }
  }
  return result;
}

function setToKey(s: Set<number>): string {
  return Array.from(s).sort((a, b) => a - b).join(',');
}

/**
 * Converts NFA to unminimized DFA using Powerset / Subset Construction
 */
export function nfaToDFA(nfa: NFA): DFA {
  const alphabet = nfa.alphabet;
  
  const startClosure = epsilonClosure(new Set([nfa.startState]), nfa);
  const startKey = setToKey(startClosure);
  
  const dfaStatesMap = new Map<string, {
    subset: Set<number>;
    id: string;
    label: string;
    isStart: boolean;
    isAccept: boolean;
  }>();
  
  let stateIndex = 0;
  function getOrAddState(subset: Set<number>, isStart = false) {
    const key = setToKey(subset);
    if (!dfaStatesMap.has(key)) {
      const isAccept = Array.from(subset).some(s => nfa.acceptStates.includes(s));
      const id = `q${stateIndex++}`;
      const sortedArray = Array.from(subset).sort((a, b) => a - b);
      const label = sortedArray.length > 0 ? `{${sortedArray.join(',')}}` : '∅';
      dfaStatesMap.set(key, {
        subset,
        id,
        label,
        isStart,
        isAccept,
      });
    }
    return dfaStatesMap.get(key)!;
  }
  
  const startStateObj = getOrAddState(startClosure, true);
  
  const queue: Set<number>[] = [startClosure];
  const processed = new Set<string>();
  const transitions: DFATransition[] = [];
  const transitionMap: Record<string, Record<string, string>> = {};
  
  while (queue.length > 0) {
    const currentSubset = queue.shift()!;
    const currentKey = setToKey(currentSubset);
    if (processed.has(currentKey)) continue;
    processed.add(currentKey);
    
    const fromState = dfaStatesMap.get(currentKey)!;
    if (!transitionMap[fromState.id]) {
      transitionMap[fromState.id] = {};
    }
    
    for (const sym of alphabet) {
      const moveResult = move(currentSubset, sym, nfa);
      const targetClosure = epsilonClosure(moveResult, nfa);

      // The empty subset is the explicit non-accepting dead state. Processing it
      // like any other subset gives it a self-loop for every alphabet symbol.
      const targetKey = setToKey(targetClosure);
      const toState = getOrAddState(targetClosure, false);

      transitions.push({
        from: fromState.id,
        to: toState.id,
        symbol: sym,
      });

      transitionMap[fromState.id][sym] = toState.id;

      if (!processed.has(targetKey)) {
        queue.push(targetClosure);
      }
    }
  }
  
  const states: DFAState[] = Array.from(dfaStatesMap.values()).map(s => ({
    id: s.id,
    label: s.label,
    isStart: s.isStart,
    isAccept: s.isAccept,
    nfaSubsetState: Array.from(s.subset).sort((a, b) => a - b),
  }));
  
  const acceptStateIds = states.filter(s => s.isAccept).map(s => s.id);
  
  const subsetTable = states.map(s => {
    const rowTransitions: Record<string, string> = {};
    for (const sym of alphabet) {
      rowTransitions[sym] = transitionMap[s.id]?.[sym] || '—';
    }
    return {
      dfaState: s.id,
      nfaSubset: s.nfaSubsetState || [],
      isAccept: s.isAccept,
      transitions: rowTransitions,
    };
  });
  
  return {
    states,
    alphabet,
    transitions,
    startStateId: startStateObj.id,
    acceptStateIds,
    transitionMap,
    subsetTable,
  };
}

/**
 * Minimizes a DFA using Hopcroft's / Partition Refinement algorithm
 */
export function minimizeDFA(dfa: DFA): DFA {
  const alphabet = dfa.alphabet;
  const states = dfa.states;
  
  // 1. Filter unreachable states from startStateId
  const reachable = new Set<string>();
  const stack = [dfa.startStateId];
  reachable.add(dfa.startStateId);
  
  while (stack.length > 0) {
    const curr = stack.pop()!;
    const out = dfa.transitionMap[curr] || {};
    for (const sym of Object.keys(out)) {
      const next = out[sym];
      if (next && !reachable.has(next)) {
        reachable.add(next);
        stack.push(next);
      }
    }
  }
  
  const reachableStates = states.filter(s => reachable.has(s.id));
  const acceptStates = reachableStates.filter(s => s.isAccept).map(s => s.id);
  const nonAcceptStates = reachableStates.filter(s => !s.isAccept).map(s => s.id);
  
  // Initial partition: Accept states and Non-Accept states
  let partitions: string[][] = [];
  if (acceptStates.length > 0) partitions.push(acceptStates);
  if (nonAcceptStates.length > 0) partitions.push(nonAcceptStates);
  
  if (partitions.length === 0) {
    return dfa;
  }
  
  // Find which partition a state belongs to
  function getPartitionIndex(stateId: string, parts: string[][]): number {
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].includes(stateId)) return i;
    }
    return -1;
  }
  
  // Refine partitions
  let changed = true;
  while (changed) {
    changed = false;
    const newPartitions: string[][] = [];
    
    for (const group of partitions) {
      if (group.length <= 1) {
        newPartitions.push(group);
        continue;
      }
      
      // Group states by signature of where their transitions land
      const signatureMap = new Map<string, string[]>();
      
      for (const sId of group) {
        const trans = dfa.transitionMap[sId] || {};
        const sigParts = alphabet.map(sym => {
          const target = trans[sym];
          return target ? getPartitionIndex(target, partitions) : -1;
        });
        const sig = sigParts.join('|');
        
        if (!signatureMap.has(sig)) {
          signatureMap.set(sig, []);
        }
        signatureMap.get(sig)!.push(sId);
      }
      
      const subGroups = Array.from(signatureMap.values());
      if (subGroups.length > 1) {
        changed = true;
      }
      for (const sg of subGroups) {
        newPartitions.push(sg);
      }
    }
    
    partitions = newPartitions;
  }
  
  // Sort partitions so that partition containing startState comes first
  partitions.sort((a, b) => {
    const aHasStart = a.includes(dfa.startStateId);
    const bHasStart = b.includes(dfa.startStateId);
    if (aHasStart && !bHasStart) return -1;
    if (!aHasStart && bHasStart) return 1;
    return 0;
  });
  
  // Assign new state IDs: q0, q1, q2...
  const stateIdToNewId = new Map<string, string>();
  const newStates: DFAState[] = [];
  const newAcceptIds: string[] = [];
  let newStartId = '';
  
  partitions.forEach((group, idx) => {
    const newId = `q${idx}`;
    const isStart = group.includes(dfa.startStateId);
    const isAccept = group.some(id => dfa.acceptStateIds.includes(id));
    
    if (isStart) newStartId = newId;
    if (isAccept) newAcceptIds.push(newId);
    
    // Combine subset names or original labels
    const memberLabels = group
      .map(id => dfa.states.find(s => s.id === id)?.label || id)
      .join(' ∪ ');
      
    // Combine all underlying NFA subset state numbers
    const combinedNfaSubsets = Array.from(
      new Set(
        group.flatMap(id => dfa.states.find(s => s.id === id)?.nfaSubsetState || [])
      )
    ).sort((a, b) => a - b);
    
    group.forEach(id => {
      stateIdToNewId.set(id, newId);
    });
    
    newStates.push({
      id: newId,
      label: newId,
      isStart,
      isAccept,
      nfaSubsetState: combinedNfaSubsets,
    });
  });
  
  // Build new transitions
  const newTransitions: DFATransition[] = [];
  const newTransitionMap: Record<string, Record<string, string>> = {};
  const addedTransitionKeys = new Set<string>();
  
  for (const s of newStates) {
    newTransitionMap[s.id] = {};
  }
  
  for (const oldState of reachableStates) {
    const fromNewId = stateIdToNewId.get(oldState.id)!;
    const oldTrans = dfa.transitionMap[oldState.id] || {};
    
    for (const sym of alphabet) {
      const targetOldId = oldTrans[sym];
      if (targetOldId) {
        const toNewId = stateIdToNewId.get(targetOldId)!;
        const key = `${fromNewId}->${toNewId}:${sym}`;
        
        if (!addedTransitionKeys.has(key)) {
          addedTransitionKeys.add(key);
          newTransitions.push({
            from: fromNewId,
            to: toNewId,
            symbol: sym,
          });
          newTransitionMap[fromNewId][sym] = toNewId;
        }
      }
    }
  }
  
  const subsetTable = newStates.map(s => {
    const rowTransitions: Record<string, string> = {};
    for (const sym of alphabet) {
      rowTransitions[sym] = newTransitionMap[s.id]?.[sym] || '—';
    }
    return {
      dfaState: s.id,
      nfaSubset: s.nfaSubsetState || [],
      isAccept: s.isAccept,
      transitions: rowTransitions,
    };
  });
  
  return {
    states: newStates,
    alphabet,
    transitions: newTransitions,
    startStateId: newStartId,
    acceptStateIds: newAcceptIds,
    transitionMap: newTransitionMap,
    subsetTable,
  };
}
