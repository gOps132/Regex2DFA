import React, { useState, useMemo, useEffect } from 'react';
import { parseRegex } from './engine/regexParser';
import { astToThompsonNFA } from './engine/thompson';
import { nfaToDFA, minimizeDFA } from './engine/dfaConverter';
import { DFA, NFA } from './types';
import { FSMCanvas } from './components/FSMCanvas';
import { RegexInputBar } from './components/RegexInputBar';
import { SimulationPanel } from './components/SimulationPanel';
import { StringTester } from './components/StringTester';
import { TransitionTableView } from './components/TransitionTableView';
import { StepByStepPipeline } from './components/StepByStepPipeline';
import { ExportModal } from './components/ExportModal';
import { Download, Cpu, Sparkles, Layers, Eye, Code, Share2 } from 'lucide-react';

export default function App() {
  // Initial default regular expression: (a + b)*aa(a + b)*
  const [regexInput, setRegexInput] = useState<string>('(a+b)*aa(a+b)*');
  const [testString, setTestString] = useState<string>('aabaa');
  const [viewType, setViewType] = useState<'minimized' | 'unminimized'>('minimized');
  const [showSubsets, setShowSubsets] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  // Active Simulation Glow States
  const [activeStateId, setActiveStateId] = useState<string | null>(null);
  const [activeTransition, setActiveTransition] = useState<{
    from: string;
    to: string;
    symbol: string;
  } | null>(null);

  // Parse Regex and generate AST, NFA, Unminimized DFA, and Minimized DFA
  const pipelineResult = useMemo(() => {
    const parseRes = parseRegex(regexInput);
    if (!parseRes.ast || parseRes.error) {
      return {
        isValid: false,
        error: parseRes.error || 'Invalid regex syntax',
        ast: null,
        nfa: null,
        unminimizedDfa: null,
        minimizedDfa: null,
        alphabet: [],
      };
    }

    try {
      const alphabet = parseRes.alphabet.length > 0 ? parseRes.alphabet : ['a', 'b'];
      const nfa = astToThompsonNFA(parseRes.ast, alphabet);
      const unminimizedDfa = nfaToDFA(nfa);
      const minimizedDfa = minimizeDFA(unminimizedDfa);

      return {
        isValid: true,
        error: undefined,
        ast: parseRes.ast,
        nfa,
        unminimizedDfa,
        minimizedDfa,
        alphabet,
      };
    } catch (err: any) {
      return {
        isValid: false,
        error: err?.message || 'Error processing automaton',
        ast: parseRes.ast,
        nfa: null,
        unminimizedDfa: null,
        minimizedDfa: null,
        alphabet: [],
      };
    }
  }, [regexInput]);

  const currentDfa: DFA | null = useMemo(() => {
    if (!pipelineResult.isValid) return null;
    return viewType === 'minimized' ? pipelineResult.minimizedDfa : pipelineResult.unminimizedDfa;
  }, [pipelineResult, viewType]);

  const handleSelectPreset = (preset: string) => {
    setRegexInput(preset);
  };

  const handleSelectStringForSimulation = (str: string) => {
    setTestString(str);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-sky-500/30 selection:text-sky-200">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight flex items-center gap-2">
              Simple Regular Expression to DFA Converter
            </h1>
            <p className="text-xs text-slate-400">
              Interactive Finite State Machine Designer with Step-by-Step Glowing Simulation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-open-export"
            onClick={() => setIsExportOpen(true)}
            disabled={!pipelineResult.isValid}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200 text-xs font-medium rounded-lg border border-slate-700 shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Export (SVG / LaTeX)</span>
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* 1. Regex Input Bar */}
        <RegexInputBar
          regexInput={regexInput}
          onRegexChange={setRegexInput}
          isValid={pipelineResult.isValid}
          errorMessage={pipelineResult.error}
          onSelectPreset={handleSelectPreset}
        />

        {/* 2. Automaton Canvas Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
          {/* Canvas View Switcher and Options Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-200">
                Finite State Machine Diagram
              </span>
              {currentDfa && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  <span className="text-sky-400 font-bold">{currentDfa.states.length}</span> states
                  <span className="text-slate-600">•</span>
                  <span className="text-amber-400 font-bold">{currentDfa.transitions.length}</span> transitions
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Toggle Minimized vs Powerset */}
              <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  id="btn-view-minimized"
                  onClick={() => setViewType('minimized')}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${
                    viewType === 'minimized'
                      ? 'bg-sky-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Canonical Minimized DFA
                </button>
                <button
                  id="btn-view-unminimized"
                  onClick={() => setViewType('unminimized')}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${
                    viewType === 'unminimized'
                      ? 'bg-sky-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Direct Powerset DFA
                </button>
              </div>

              {/* Toggle Subsets Label */}
              <button
                id="btn-toggle-subsets"
                onClick={() => setShowSubsets(!showSubsets)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all ${
                  showSubsets
                    ? 'bg-purple-950/70 border-purple-600 text-purple-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Show NFA Subsets</span>
              </button>
            </div>
          </div>

          {/* Canvas Rendering */}
          <FSMCanvas
            dfa={currentDfa}
            nfa={pipelineResult.nfa}
            activeStateId={activeStateId}
            activeTransition={activeTransition}
            showSubsets={showSubsets}
            viewType={viewType}
          />
        </div>

        {/* 3. Live String Simulation with Glowing Steps */}
        {pipelineResult.isValid && currentDfa && (
          <SimulationPanel
            dfa={currentDfa}
            onActiveStateChange={setActiveStateId}
            onActiveTransitionChange={setActiveTransition}
            currentTestString={testString}
            onTestStringChange={setTestString}
          />
        )}

        {/* 4. Generated Test Suite */}
        {pipelineResult.isValid && currentDfa && (
          <StringTester
            dfa={currentDfa}
            onSelectStringForSimulation={handleSelectStringForSimulation}
            selectedString={testString}
          />
        )}

        {/* 5. Transition Table & 5-Tuple Definition */}
        {pipelineResult.isValid && currentDfa && (
          <TransitionTableView
            dfa={currentDfa}
            activeStateId={activeStateId}
          />
        )}

        {/* 6. Step-by-Step Formal Conversion Pipeline */}
        {pipelineResult.isValid && (
          <StepByStepPipeline
            regex={regexInput}
            ast={pipelineResult.ast}
            nfa={pipelineResult.nfa}
            unminimizedDfa={pipelineResult.unminimizedDfa}
            minimizedDfa={pipelineResult.minimizedDfa}
          />
        )}
      </main>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        dfa={currentDfa}
        regex={regexInput}
      />
    </div>
  );
}
