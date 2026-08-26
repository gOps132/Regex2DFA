import { describe, expect, test } from 'bun:test';
import { minimizeDFA, nfaToDFA } from './dfaConverter';
import { parseRegex } from './regexParser';
import { astToThompsonNFA } from './thompson';

function convert(regex) {
  const parsed = parseRegex(regex);
  if (!parsed.ast) throw new Error(parsed.error);
  return nfaToDFA(astToThompsonNFA(parsed.ast, parsed.alphabet));
}

function expectTotalTransitionFunction(dfa) {
  for (const state of dfa.states) {
    for (const symbol of dfa.alphabet) {
      expect(dfa.transitionMap[state.id]?.[symbol]).toBeDefined();
    }
  }
}

describe('DFA transition completeness', () => {
  test('powerset construction adds an explicit dead state for the empty subset', () => {
    const dfa = convert('(b+ab)*(a+e)');
    const deadState = dfa.states.find(state => state.nfaSubsetState?.length === 0);

    expect(deadState).toBeDefined();
    expect(deadState?.isAccept).toBe(false);
    expect(dfa.transitionMap[deadState.id]).toEqual({ a: deadState.id, b: deadState.id });
    expectTotalTransitionFunction(dfa);
  });

  test('minimization preserves a total transition function', () => {
    const dfa = minimizeDFA(convert('(b+ab)*(a+e)'));

    expectTotalTransitionFunction(dfa);
  });
});
