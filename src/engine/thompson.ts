import { ASTNode, NFA, NFATransition } from '../types';

export const EPSILON = 'ε';

interface SubNFA {
  start: number;
  accept: number;
  transitions: NFATransition[];
}

export function astToThompsonNFA(ast: ASTNode, alphabet: string[]): NFA {
  let stateCounter = 0;
  
  function nextState(): number {
    return stateCounter++;
  }
  
  function build(node: ASTNode): SubNFA {
    switch (node.type) {
      case 'SYMBOL': {
        const start = nextState();
        const accept = nextState();
        return {
          start,
          accept,
          transitions: [{ from: start, to: accept, symbol: node.symbol || 'a' }],
        };
      }
      
      case 'EPSILON': {
        const start = nextState();
        const accept = nextState();
        return {
          start,
          accept,
          transitions: [{ from: start, to: accept, symbol: EPSILON }],
        };
      }
      
      case 'EMPTY_SET': {
        const start = nextState();
        const accept = nextState();
        return {
          start,
          accept,
          transitions: [], // No path from start to accept
        };
      }
      
      case 'CONCAT': {
        const leftSub = build(node.left!);
        const rightSub = build(node.right!);
        
        // Connect left accept to right start via epsilon
        const transitions: NFATransition[] = [
          ...leftSub.transitions,
          ...rightSub.transitions,
          { from: leftSub.accept, to: rightSub.start, symbol: EPSILON },
        ];
        
        return {
          start: leftSub.start,
          accept: rightSub.accept,
          transitions,
        };
      }
      
      case 'UNION': {
        const leftSub = build(node.left!);
        const rightSub = build(node.right!);
        const start = nextState();
        const accept = nextState();
        
        const transitions: NFATransition[] = [
          ...leftSub.transitions,
          ...rightSub.transitions,
          { from: start, to: leftSub.start, symbol: EPSILON },
          { from: start, to: rightSub.start, symbol: EPSILON },
          { from: leftSub.accept, to: accept, symbol: EPSILON },
          { from: rightSub.accept, to: accept, symbol: EPSILON },
        ];
        
        return {
          start,
          accept,
          transitions,
        };
      }
      
      case 'STAR': {
        const childSub = build(node.child!);
        const start = nextState();
        const accept = nextState();
        
        const transitions: NFATransition[] = [
          ...childSub.transitions,
          { from: start, to: childSub.start, symbol: EPSILON },
          { from: start, to: accept, symbol: EPSILON },
          { from: childSub.accept, to: childSub.start, symbol: EPSILON },
          { from: childSub.accept, to: accept, symbol: EPSILON },
        ];
        
        return {
          start,
          accept,
          transitions,
        };
      }
    }
  }
  
  const rootSub = build(ast);
  
  // Collect all states
  const statesSet = new Set<number>();
  statesSet.add(rootSub.start);
  statesSet.add(rootSub.accept);
  
  for (const t of rootSub.transitions) {
    statesSet.add(t.from);
    statesSet.add(t.to);
  }
  
  const states = Array.from(statesSet).sort((a, b) => a - b);
  
  return {
    states,
    alphabet,
    transitions: rootSub.transitions,
    startState: rootSub.start,
    acceptStates: [rootSub.accept],
  };
}
