import React, { useState, useEffect, useRef } from 'react';
import { DFA, SimulationStep } from '../types';
import { simulateStringOnDFA } from '../engine/stringSimulator';
import confetti from 'canvas-confetti';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, CheckCircle2, XCircle, ArrowRight, Gauge } from 'lucide-react';

interface SimulationPanelProps {
  dfa: DFA | null;
  onActiveStateChange: (stateId: string | null) => void;
  onActiveTransitionChange: (trans: { from: string; to: string; symbol: string } | null) => void;
  currentTestString: string;
  onTestStringChange: (str: string) => void;
}

export const SimulationPanel: React.FC<SimulationPanelProps> = ({
  dfa,
  onActiveStateChange,
  onActiveTransitionChange,
  currentTestString,
  onTestStringChange,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(800); // ms per step
  
  // Compute simulation steps whenever dfa or test string changes
  const simulationResult = React.useMemo(() => {
    if (!dfa) return null;
    return simulateStringOnDFA(dfa, currentTestString);
  }, [dfa, currentTestString]);

  const steps = simulationResult?.steps || [];
  const totalSteps = steps.length;
  const isFinished = currentStepIndex === totalSteps - 1;

  // Sync active state and transition to canvas
  useEffect(() => {
    if (!steps || steps.length === 0) {
      onActiveStateChange(null);
      onActiveTransitionChange(null);
      return;
    }

    const currentStep = steps[currentStepIndex];
    if (currentStep) {
      onActiveStateChange(currentStep.toState);
      if (currentStep.fromState && currentStep.toState && currentStep.char) {
        onActiveTransitionChange({
          from: currentStep.fromState,
          to: currentStep.toState,
          symbol: currentStep.char,
        });
      } else {
        onActiveTransitionChange(null);
      }
    }
  }, [currentStepIndex, steps, onActiveStateChange, onActiveTransitionChange]);

  // Reset step index when test string or dfa changes
  useEffect(() => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }, [currentTestString, dfa]);

  // Playback timer
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPlaying) {
      if (currentStepIndex >= totalSteps - 1) {
        setIsPlaying(false);
        return;
      }

      timerRef.current = setTimeout(() => {
        setCurrentStepIndex(prev => {
          const next = prev + 1;
          if (next >= totalSteps - 1) {
            setIsPlaying(false);
            // Trigger confetti if accepted on completion
            if (simulationResult?.isAccepted) {
              confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.7 },
              });
            }
          }
          return next;
        });
      }, playbackSpeed);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentStepIndex, totalSteps, playbackSpeed, simulationResult]);

  const handleStepForward = () => {
    setIsPlaying(false);
    if (currentStepIndex < totalSteps - 1) {
      const next = currentStepIndex + 1;
      setCurrentStepIndex(next);
      if (next === totalSteps - 1 && simulationResult?.isAccepted) {
        confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
      }
    }
  };

  const handleStepBackward = () => {
    setIsPlaying(false);
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  };

  const handleTogglePlay = () => {
    if (isFinished) {
      setCurrentStepIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  if (!dfa) return null;

  const currentStep = steps[currentStepIndex];

  return (
    <div id="simulation-panel" className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
            Live String Validation & Simulation
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Step through state transitions to visualize string acceptance
          </p>
        </div>

        {/* Input for String */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              id="simulation-string-input"
              type="text"
              value={currentTestString}
              onChange={(e) => onTestStringChange(e.target.value)}
              placeholder="e.g. aab or ε"
              className="bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm font-mono rounded-lg px-3 py-1.5 w-48 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
            {currentTestString === '' && (
              <span className="absolute right-2.5 top-2 text-xs text-slate-500 pointer-events-none font-mono">
                [empty string]
              </span>
            )}
          </div>
          <button
            id="btn-clear-test-string"
            onClick={() => onTestStringChange('')}
            className="text-xs px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
          >
            ε
          </button>
        </div>
      </div>

      {/* String Tape Display */}
      <div className="mt-4 bg-slate-950/80 rounded-lg p-3 border border-slate-800/80">
        <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-2 flex items-center justify-between">
          <span>Character Tape</span>
          <span>
            Step {currentStepIndex} of {Math.max(totalSteps - 1, 0)}
          </span>
        </div>

        {currentTestString.length === 0 ? (
          <div className="flex items-center gap-2 py-1.5 px-3 bg-slate-900 border border-slate-800 rounded-md font-mono text-sm text-slate-300">
            <span className="text-amber-400 font-bold">ε</span>
            <span className="text-xs text-slate-500">(Empty String / Null Transition)</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {currentTestString.split('').map((char, idx) => {
              const isConsumed = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex - 1;
              const isNext = idx === currentStepIndex;

              let charStyle = 'bg-slate-900 border-slate-800 text-slate-400';
              if (isCurrent) {
                charStyle = 'bg-sky-950 border-sky-400 text-sky-200 ring-2 ring-sky-500/40 shadow-lg scale-105';
              } else if (isConsumed) {
                charStyle = 'bg-slate-900/60 border-emerald-900/40 text-emerald-400/80';
              } else if (isNext) {
                charStyle = 'bg-slate-800 border-slate-600 text-slate-200';
              }

              return (
                <div
                  key={idx}
                  className={`min-w-[36px] h-10 flex flex-col items-center justify-center rounded-md border font-mono font-bold text-sm transition-all duration-200 ${charStyle}`}
                >
                  <span>{char}</span>
                  <span className="text-[9px] font-normal text-slate-500 -mt-0.5">{idx}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Playback Controls & Status */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            id="btn-sim-reset"
            onClick={handleReset}
            disabled={currentStepIndex === 0}
            className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200 rounded-lg transition-colors"
            title="Reset Simulation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            id="btn-sim-prev"
            onClick={handleStepBackward}
            disabled={currentStepIndex === 0}
            className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200 rounded-lg transition-colors"
            title="Step Back"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            id="btn-sim-play-pause"
            onClick={handleTogglePlay}
            className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-1.5 transition-all shadow-md ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-sky-600 hover:bg-sky-500 text-white'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" /> Pause
              </>
            ) : isFinished ? (
              <>
                <RotateCcw className="w-4 h-4" /> Replay
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> Run
              </>
            )}
          </button>
          <button
            id="btn-sim-next"
            onClick={handleStepForward}
            disabled={isFinished}
            className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200 rounded-lg transition-colors"
            title="Step Forward"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Speed selector */}
          <div className="flex items-center gap-1 ml-2 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-xs text-slate-400">
            <Gauge className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
              aria-label="Simulation speed"
              className="bg-transparent text-slate-300 font-mono focus:outline-none cursor-pointer"
            >
              <option value={1400} className="bg-slate-900 text-slate-200">0.5x (Slow)</option>
              <option value={800} className="bg-slate-900 text-slate-200">1.0x (Normal)</option>
              <option value={400} className="bg-slate-900 text-slate-200">2.0x (Fast)</option>
            </select>
          </div>
        </div>

        {/* Current State Info */}
        <div className="flex items-center gap-3">
          {currentStep && (
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
              <span className="text-slate-400">State:</span>
              <span className="font-mono font-bold text-sky-400 bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-800/60">
                {currentStep.toState || 'TRAP'}
              </span>
              {currentStep.char && (
                <>
                  <span className="text-slate-500">via</span>
                  <span className="font-mono font-semibold text-amber-300">
                    '{currentStep.char}'
                  </span>
                </>
              )}
            </div>
          )}

          {/* Final Acceptance Verdict Badge */}
          {isFinished && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs border animate-in fade-in zoom-in-95 duration-200 ${
                simulationResult?.isAccepted
                  ? 'bg-emerald-950/90 border-emerald-500/80 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  : 'bg-rose-950/90 border-rose-500/80 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
              }`}
            >
              {simulationResult?.isAccepted ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>ACCEPTED</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <span>REJECTED</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Path Breadcrumbs */}
      {steps.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-xs text-slate-400 font-mono">
          <span className="text-slate-500 text-[11px] mr-1 uppercase font-sans">Path:</span>
          {steps.slice(0, currentStepIndex + 1).map((s, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />}
              <span
                className={`px-1.5 py-0.5 rounded shrink-0 ${
                  idx === currentStepIndex
                    ? 'bg-sky-900/80 text-sky-200 border border-sky-700 font-bold'
                    : 'bg-slate-950 text-slate-400'
                }`}
              >
                {s.toState || '∅'}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};
