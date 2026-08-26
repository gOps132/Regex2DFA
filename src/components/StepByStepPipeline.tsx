import React, { useState } from 'react';
import { ASTNode, DFA, NFA } from '../types';
import { Layers, GitBranch, Table, Cpu, ChevronRight, Check } from 'lucide-react';

interface StepByStepPipelineProps {
  regex: string;
  ast: ASTNode | null;
  nfa: NFA | null;
  unminimizedDfa: DFA | null;
  minimizedDfa: DFA | null;
}

export const StepByStepPipeline: React.FC<StepByStepPipelineProps> = ({
  regex,
  ast,
  nfa,
  unminimizedDfa,
  minimizedDfa,
}) => {
  const [activeTab, setActiveTab] = useState<'ast' | 'thompson' | 'powerset' | 'minimization'>('powerset');

  const renderASTNode = (node: ASTNode | null | undefined, depth: number = 0): React.ReactNode => {
    if (!node) return null;
    
    let label = '';
    let colorClass = 'text-slate-300';
    
    switch (node.type) {
      case 'SYMBOL':
        label = `Symbol: '${node.symbol}'`;
        colorClass = 'text-emerald-400 font-bold';
        break;
      case 'EPSILON':
        label = `Epsilon: ε`;
        colorClass = 'text-amber-400 font-bold';
        break;
      case 'EMPTY_SET':
        label = `Empty Set: Ø`;
        colorClass = 'text-rose-400 font-bold';
        break;
      case 'UNION':
        label = `Union: +`;
        colorClass = 'text-sky-400 font-bold';
        break;
      case 'CONCAT':
        label = `Concat: •`;
        colorClass = 'text-indigo-400 font-bold';
        break;
      case 'STAR':
        label = `Kleene Star: *`;
        colorClass = 'text-purple-400 font-bold';
        break;
    }

    return (
      <div className="pl-4 border-l border-slate-800 text-xs font-mono my-1">
        <span className={colorClass}>{label}</span>
        {node.left && renderASTNode(node.left, depth + 1)}
        {node.right && renderASTNode(node.right, depth + 1)}
        {node.child && renderASTNode(node.child, depth + 1)}
      </div>
    );
  };

  return (
    <div id="step-by-step-pipeline" className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            Conversion Pipeline (Formal Theory Trace)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Inspect each theoretical phase from Regular Expression to Minimized DFA
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab('ast')}
            className={`px-2.5 py-1.5 rounded-md transition-all ${
              activeTab === 'ast'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Parse AST
          </button>
          <button
            onClick={() => setActiveTab('thompson')}
            className={`px-2.5 py-1.5 rounded-md transition-all ${
              activeTab === 'thompson'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            2. Thompson NFA
          </button>
          <button
            onClick={() => setActiveTab('powerset')}
            className={`px-2.5 py-1.5 rounded-md transition-all ${
              activeTab === 'powerset'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            3. Powerset / Subsets
          </button>
          <button
            onClick={() => setActiveTab('minimization')}
            className={`px-2.5 py-1.5 rounded-md transition-all ${
              activeTab === 'minimization'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            4. Minimization
          </button>
        </div>
      </div>

      <div className="mt-4">
        {/* TAB 1: AST */}
        {activeTab === 'ast' && (
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between mb-3 text-xs text-slate-400 border-b border-slate-800 pb-2">
              <span className="font-semibold text-slate-300">Abstract Syntax Tree (AST) Hierarchy</span>
              <span className="font-mono bg-slate-900 px-2 py-0.5 rounded text-sky-300">Input: {regex}</span>
            </div>
            {ast ? (
              <div className="py-1">
                {renderASTNode(ast)}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No AST available.</p>
            )}
          </div>
        )}

        {/* TAB 2: Thompson NFA */}
        {activeTab === 'thompson' && (
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
              <span className="font-semibold text-slate-300">Thompson ε-NFA Structure</span>
              <span>
                {nfa?.states.length || 0} States, {nfa?.transitions.length || 0} Transitions
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
              <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                <span className="text-slate-400 block text-[11px] font-sans font-semibold">Start State</span>
                <span className="text-indigo-400 font-bold">{nfa?.startState}</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                <span className="text-slate-400 block text-[11px] font-sans font-semibold">Accept State(s)</span>
                <span className="text-emerald-400 font-bold">{`{${nfa?.acceptStates.join(', ')}}`}</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                <span className="text-slate-400 block text-[11px] font-sans font-semibold">Alphabet</span>
                <span className="text-amber-400 font-bold">{`{${nfa?.alphabet.join(', ')}}`}</span>
              </div>
            </div>

            <div className="max-h-56 overflow-y-auto rounded border border-slate-800 bg-slate-900/60 p-2">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800">
                    <th className="py-1.5 px-2">From NFA State</th>
                    <th className="py-1.5 px-2">Symbol</th>
                    <th className="py-1.5 px-2">To NFA State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {nfa?.transitions.map((t, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="py-1 px-2 text-indigo-300">{t.from}</td>
                      <td className="py-1 px-2 font-bold text-amber-300">{t.symbol}</td>
                      <td className="py-1 px-2 text-emerald-300">{t.to}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Powerset / Subsets */}
        {activeTab === 'powerset' && (
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between mb-3 text-xs text-slate-400 border-b border-slate-800 pb-2">
              <div>
                <span className="font-semibold text-slate-300 block">Subset / Powerset Construction Table</span>
                <span className="text-[11px] text-slate-500">Each DFA state corresponds to an ε-closure subset of NFA states</span>
              </div>
              <span className="font-mono bg-slate-900 px-2 py-0.5 rounded text-sky-400">
                {unminimizedDfa?.states.length || 0} Powerset States
              </span>
            </div>

            <div className="overflow-x-auto rounded border border-slate-800 bg-slate-900/60">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900 text-slate-300 border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">DFA State</th>
                    <th className="py-2 px-3 text-purple-300">NFA ε-Closure Subset</th>
                    {unminimizedDfa?.alphabet.map(sym => (
                      <th key={sym} className="py-2 px-3 text-amber-300">
                        Move & Closure ('{sym}')
                      </th>
                    ))}
                    <th className="py-2 px-3">Accepting?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {unminimizedDfa?.subsetTable?.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 text-slate-300">
                      <td className="py-2 px-3 font-bold text-sky-400">
                        {row.dfaState}
                        {row.dfaState === unminimizedDfa.startStateId && ' (Start)'}
                      </td>
                      <td className="py-2 px-3 text-purple-300">
                        {`{${row.nfaSubset.join(', ')}}`}
                      </td>
                      {unminimizedDfa.alphabet.map(sym => (
                        <td key={sym} className="py-2 px-3">
                          {row.transitions[sym] || '—'}
                        </td>
                      ))}
                      <td className="py-2 px-3">
                        {row.isAccept ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Yes
                          </span>
                        ) : (
                          <span className="text-slate-500">No</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: Minimization */}
        {activeTab === 'minimization' && (
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
              <span className="font-semibold text-slate-300">Hopcroft DFA Minimization</span>
              <span className="text-emerald-400 font-mono">
                {unminimizedDfa?.states.length || 0} States → {minimizedDfa?.states.length || 0} Minimal States
              </span>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-semibold">Equivalence Partitioning:</span>
              </div>
              <p className="text-slate-400 text-xs pl-4">
                Initial partition groups states into Accept (F) and Non-Accept (Q \ F). Partitions are iteratively refined until all states in each group have equivalent transitions for every symbol in Σ.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[11px] font-sans font-semibold mb-1">
                  Original Unminimized DFA
                </span>
                <span className="text-slate-300">
                  {unminimizedDfa?.states.length} states, {unminimizedDfa?.transitions.length} transitions
                </span>
              </div>
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <span className="text-emerald-400 block text-[11px] font-sans font-semibold mb-1">
                  Canonical Minimal DFA
                </span>
                <span className="text-emerald-300 font-bold">
                  {minimizedDfa?.states.length} states, {minimizedDfa?.transitions.length} transitions
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
