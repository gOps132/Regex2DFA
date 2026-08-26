import React, { useMemo } from 'react';
import { DFA } from '../types';
import { generateSampleStrings } from '../engine/stringGenerator';
import { CheckCircle, XCircle, Play, Sparkles } from 'lucide-react';

interface StringTesterProps {
  dfa: DFA | null;
  onSelectStringForSimulation: (str: string) => void;
  selectedString: string;
}

export const StringTester: React.FC<StringTesterProps> = ({
  dfa,
  onSelectStringForSimulation,
  selectedString,
}) => {
  const samples = useMemo(() => {
    if (!dfa) return { accepted: [], rejected: [] };
    return generateSampleStrings(dfa, 6, 8, 8);
  }, [dfa]);

  if (!dfa) return null;

  return (
    <div id="string-tester-panel" className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Generated Language Test Suite
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Systematically generated test strings over alphabet Σ = {'{'}{dfa.alphabet.join(', ')}{'}'}. Click any to simulate.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {/* Accepted Strings */}
        <div className="bg-slate-950/70 border border-emerald-950/60 rounded-lg p-3.5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
              <CheckCircle className="w-3.5 h-3.5" />
              Valid Strings (Accepted by DFA)
            </span>
            <span className="text-[11px] bg-emerald-950 text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-800/60">
              {samples.accepted.length} found
            </span>
          </div>

          {samples.accepted.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2">No accepted strings found in short search depth (language may be empty).</p>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
              {samples.accepted.map((item, idx) => {
                const rawStr = item.input.startsWith('ε') ? '' : item.input;
                const isSelected = selectedString === rawStr;
                return (
                  <button
                    key={idx}
                    onClick={() => onSelectStringForSimulation(rawStr)}
                    className={`group flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-mono text-xs transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white font-bold ring-2 ring-emerald-400 shadow-md'
                        : 'bg-slate-900 hover:bg-emerald-950/60 text-emerald-200 border border-emerald-900/40 hover:border-emerald-700'
                    }`}
                  >
                    <span>"{item.input}"</span>
                    <Play className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Rejected Strings */}
        <div className="bg-slate-950/70 border border-rose-950/60 rounded-lg p-3.5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
              <XCircle className="w-3.5 h-3.5" />
              Invalid Strings (Rejected by DFA)
            </span>
            <span className="text-[11px] bg-rose-950 text-rose-300 font-mono px-2 py-0.5 rounded border border-rose-800/60">
              {samples.rejected.length} found
            </span>
          </div>

          {samples.rejected.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2">No rejected strings found (language may be $\Sigma^*$).</p>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
              {samples.rejected.map((item, idx) => {
                const isSelected = selectedString === item.input;
                return (
                  <button
                    key={idx}
                    onClick={() => onSelectStringForSimulation(item.input)}
                    className={`group flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-mono text-xs transition-all ${
                      isSelected
                        ? 'bg-rose-600 text-white font-bold ring-2 ring-rose-400 shadow-md'
                        : 'bg-slate-900 hover:bg-rose-950/60 text-rose-200 border border-rose-950/40 hover:border-rose-700'
                    }`}
                  >
                    <span>"{item.input}"</span>
                    <Play className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
