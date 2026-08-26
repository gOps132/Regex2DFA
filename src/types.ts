export type ASTNodeType = 'EMPTY_SET' | 'EPSILON' | 'SYMBOL' | 'UNION' | 'CONCAT' | 'STAR';

export interface ASTNode {
  type: ASTNodeType;
  symbol?: string;
  left?: ASTNode;
  right?: ASTNode;
  child?: ASTNode;
}

export interface ParseResult {
  ast: ASTNode | null;
  alphabet: string[];
  error?: string;
  errorIndex?: number;
  formattedRegex?: string;
}

export interface NFATransition {
  from: number;
  to: number;
  symbol: string; // 'ε' for epsilon
}

export interface NFA {
  states: number[];
  alphabet: string[];
  transitions: NFATransition[];
  startState: number;
  acceptStates: number[];
}

export interface DFATransition {
  from: string;
  to: string;
  symbol: string;
}

export interface DFAState {
  id: string;
  label: string;
  isStart: boolean;
  isAccept: boolean;
  nfaSubsetState?: number[];
  x?: number;
  y?: number;
}

export interface DFA {
  states: DFAState[];
  alphabet: string[];
  transitions: DFATransition[];
  startStateId: string;
  acceptStateIds: string[];
  // Transition map: stateId -> symbol -> nextStateId
  transitionMap: Record<string, Record<string, string>>;
  // Subsets table details for educational view
  subsetTable?: {
    dfaState: string;
    nfaSubset: number[];
    isAccept: boolean;
    transitions: Record<string, string>;
  }[];
}

export interface MinimizationStep {
  partitions: string[][];
  description: string;
}

export interface SimulationStep {
  stepIndex: number;
  char: string | null;
  fromState: string;
  toState: string | null;
  remainingString: string;
  consumedString: string;
  isValidTransition: boolean;
  isAccepted: boolean;
}

export interface StringTestResult {
  input: string;
  isAccepted: boolean;
  path: string[];
}

export interface MachineLayoutNode {
  id: string;
  label: string;
  isStart: boolean;
  isAccept: boolean;
  x: number;
  y: number;
  radius: number;
}

export interface MachineLayoutEdge {
  id: string;
  from: string;
  to: string;
  symbols: string[];
  isSelfLoop: boolean;
  curveOffset: number; // For multiple edges between same nodes
}
