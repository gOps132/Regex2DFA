import React from 'react';
import { DFA } from '../types';
import { Table, CheckCircle2, ArrowRight } from 'lucide-react';

interface TransitionTableViewProps {
  dfa: DFA | null;
  activeStateId: string | null;
}

export const TransitionTableView: React.FC<TransitionTableViewProps> = ({
  dfa,
  activeStateId,
}) => {
  if (!dfa || dfa.states.length === 0) return null;

  const alphabet = dfa.alphabet;
  const states = dfa.states;

  return (
    <div id="transition-table-panel" className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
            <Table className="w-4 h-4 text-sky-400" />
            Transition Table & Formal 5-Tuple
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            DFA Definition M = (Q, Σ, δ, q₀, F)
          </p>
        </div>
      </div>

      {/* Formal 5-Tuple Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4">
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
          <span className="text-[11px] text-slate-400 font-semibold block uppercase">States Q</span>
          <span className="font-mono text-xs text-sky-300">
            {`{${states.map(s => s.id).join(', ')}}`}
          </span>
        </div>
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
          <span className="text-[11px] text-slate-400 font-semibold block uppercase">Alphabet Σ</span>
          <span className="font-mono text-xs text-amber-300">
            {`{${alphabet.join(', ')}}`}
          </span>
        </div>
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
          <span className="text-[11px] text-slate-400 font-semibold block uppercase">Start State q₀</span>
          <span className="font-mono text-xs text-indigo-300 font-bold">
            {dfa.startStateId || '—'}
          </span>
        </div>
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
          <span className="text-[11px] text-slate-400 font-semibold block uppercase">Accept States F</span>
          <span className="font-mono text-xs text-emerald-300 font-bold">
            {dfa.acceptStateIds.length > 0 ? `{${dfa.acceptStateIds.join(', ')}}` : '∅'}
          </span>
        </div>
      </div>

      {/* Transition Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-900 text-slate-300 border-b border-slate-800 font-semibold">
            <tr>
              <th className="py-2.5 px-3 w-16">Type</th>
              <th className="py-2.5 px-3">State</th>
              <th className="py-2.5 px-3 text-slate-400">NFA Subsets</th>
              {alphabet.map(sym => (
                <th key={sym} className="py-2.5 px-3 text-amber-300 bg-slate-900/80">
                  δ(q, '{sym}')
                </th>
              ))}
              <th className="py-2.5 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {states.map(state => {
              const isStart = state.id === dfa.startStateId;
              const isAccept = dfa.acceptStateIds.includes(state.id);
              const isActive = activeStateId === state.id;

              return (
                <tr
                  key={state.id}
                  className={`transition-colors ${
                    isActive
                      ? 'bg-sky-950/70 text-white font-bold'
                      : 'hover:bg-slate-900/50 text-slate-300'
                  }`}
                >
                  <td className="py-2 px-3 text-slate-400 font-sans">
                    <div className="flex items-center gap-1">
                      {isStart && <span className="text-indigo-400 font-bold" title="Start State">→</span>}
                      {isAccept && <span className="text-emerald-400 font-bold" title="Accept State">*</span>}
                    </div>
                  </td>
                  <td className="py-2 px-3 font-bold text-sky-400">
                    {state.id}
                  </td>
                  <td className="py-2 px-3 text-slate-500">
                    {state.nfaSubsetState && state.nfaSubsetState.length > 0
                      ? `{${state.nfaSubsetState.join(', ')}}`
                      : '—'}
                  </td>
                  {alphabet.map(sym => {
                    const target = dfa.transitionMap[state.id]?.[sym];
                    return (
                      <td key={sym} className="py-2 px-3">
                        {target ? (
                          <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-200">
                            {target}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="py-2 px-3 text-center">
                    {isAccept ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900 font-sans">
                        <CheckCircle2 className="w-3 h-3" /> Accept
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px] font-sans">Reject</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
