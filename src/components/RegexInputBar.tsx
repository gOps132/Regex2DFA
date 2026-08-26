import React from 'react';
import { Sparkles, AlertCircle, CheckCircle2, Bookmark, HelpCircle } from 'lucide-react';

interface RegexInputBarProps {
  regexInput: string;
  onRegexChange: (val: string) => void;
  isValid: boolean;
  errorMessage?: string;
  onSelectPreset: (preset: string) => void;
}

const PRESETS = [
  {
    name: "Contains substring 'aa'",
    regex: "(a+b)*aa(a+b)*",
    desc: "Strings over {a,b} having 'aa' as a substring",
  },
  {
    name: "Union with null set star (Ø*)",
    regex: "(a+b+Ø*)",
    desc: "String is 'a', 'b', or empty string 'e' (since Ø* = e)",
  },
  {
    name: "Binary ending with '01'",
    regex: "(0+1)*01",
    desc: "Strings over {0,1} that terminate with '01'",
  },
  {
    name: "Contains substring '001'",
    regex: "(0+1)*001(0+1)*",
    desc: "Strings containing pattern 001 anywhere",
  },
  {
    name: "Even number of 0s",
    regex: "(1*01*0)*1*",
    desc: "Binary strings with an even count of '0' characters",
  },
  {
    name: "Starts and ends with 'a'",
    regex: "a(a+b)*a+a",
    desc: "Strings over {a,b} with matching start and end",
  },
  {
    name: "Alternating bits",
    regex: "(01)*(0+e)+(10)*(1+e)",
    desc: "Binary strings with no consecutive equal characters",
  },
];

export const RegexInputBar: React.FC<RegexInputBarProps> = ({
  regexInput,
  onRegexChange,
  isValid,
  errorMessage,
  onSelectPreset,
}) => {
  const insertSymbol = (sym: string) => {
    onRegexChange(regexInput + sym);
  };

  return (
    <div id="regex-input-bar-container" className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
        <div>
          <label htmlFor="regex-main-input" className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400" />
            Formal Regular Expression
          </label>
          <p className="text-xs text-slate-400 mt-0.5">
            Supports Union (<code className="text-sky-300 font-mono">+</code> or <code className="text-sky-300 font-mono">|</code>), Concatenation, Kleene Star (<code className="text-sky-300 font-mono">*</code>), Null Set (<code className="text-sky-300 font-mono">Ø</code>, <code className="text-sky-300 font-mono">∅</code>), and Empty String (<code className="text-sky-300 font-mono">e</code>, <code className="text-sky-300 font-mono">ε</code>).
          </p>
        </div>

        {/* Presets dropdown */}
        <div className="flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            id="preset-select-dropdown"
            onChange={(e) => {
              if (e.target.value) onSelectPreset(e.target.value);
            }}
            defaultValue=""
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-sky-500 cursor-pointer font-sans"
          >
            <option value="" disabled>
              Load Classic Regex Preset...
            </option>
            {PRESETS.map((p, idx) => (
              <option key={idx} value={p.regex}>
                {p.name} — {p.regex}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Input & Symbol Keypad */}
      <div className="relative">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <input
              id="regex-main-input"
              type="text"
              value={regexInput}
              onChange={(e) => onRegexChange(e.target.value)}
              placeholder="e.g. (a + b)*aa(a + b)* or (a + b + Ø*)"
              className={`w-full bg-slate-950 border text-slate-100 placeholder-slate-500 text-base sm:text-lg font-mono rounded-xl px-4 py-3 pl-4 pr-10 focus:outline-none transition-all ${
                isValid
                  ? 'border-slate-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                  : 'border-rose-500/80 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
              }`}
            />
            {/* Status indicator icon inside input */}
            <div className="absolute right-3 top-3.5">
              {isValid ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400" />
              )}
            </div>
          </div>

          {/* Quick Insertion Keypad */}
          <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800 self-start sm:self-auto overflow-x-auto">
            <span className="text-[10px] text-slate-500 font-semibold px-1 uppercase tracking-wider hidden sm:inline">
              Insert:
            </span>
            <button
              type="button"
              onClick={() => insertSymbol('+')}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-sky-400 rounded-lg text-xs font-mono font-bold border border-slate-800 transition-colors"
              title="Union (+)"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => insertSymbol('*')}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-purple-400 rounded-lg text-xs font-mono font-bold border border-slate-800 transition-colors"
              title="Kleene Star (*)"
            >
              *
            </button>
            <button
              type="button"
              onClick={() => insertSymbol('(')}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-mono font-bold border border-slate-800 transition-colors"
              title="Left Paren"
            >
              (
            </button>
            <button
              type="button"
              onClick={() => insertSymbol(')')}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-mono font-bold border border-slate-800 transition-colors"
              title="Right Paren"
            >
              )
            </button>
            <button
              type="button"
              onClick={() => insertSymbol('Ø')}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-rose-400 rounded-lg text-xs font-mono font-bold border border-slate-800 transition-colors"
              title="Empty Set (Ø)"
            >
              Ø
            </button>
            <button
              type="button"
              onClick={() => insertSymbol('ε')}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-lg text-xs font-mono font-bold border border-slate-800 transition-colors"
              title="Empty String (ε)"
            >
              ε
            </button>
          </div>
        </div>

        {/* Error message */}
        {!isValid && errorMessage && (
          <div className="mt-2 flex items-center gap-2 text-xs text-rose-400 bg-rose-950/40 border border-rose-900/60 rounded-lg p-2.5 animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Syntax Error: {errorMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
