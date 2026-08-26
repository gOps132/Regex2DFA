import React, { useState } from 'react';
import { DFA } from '../types';
import { Download, Copy, Check, X, FileCode, Image, Code } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dfa: DFA | null;
  regex: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  dfa,
  regex,
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen || !dfa) return null;

  // Generate LaTeX TikZ code
  const generateTikZCode = (): string => {
    let tikz = `% TikZ code for DFA of regex: ${regex}\n`;
    tikz += `\\begin{tikzpicture}[shorten >=1pt, node distance=2.5cm, on grid, auto, initial text=start]\n`;
    tikz += `  \\node[state, initial] (q0) {$q_0$};\n`;
    
    dfa.states.forEach((s, idx) => {
      if (s.id !== dfa.startStateId) {
        const acceptStr = s.isAccept ? ', accepting' : '';
        tikz += `  \\node[state${acceptStr}] (${s.id}) [right of=q${idx - 1}] {$${s.id}$};\n`;
      }
    });

    tikz += `\n  \\path[->]\n`;
    const edgeMap = new Map<string, string[]>();
    dfa.transitions.forEach(t => {
      const key = `${t.from}->${t.to}`;
      if (!edgeMap.has(key)) edgeMap.set(key, []);
      edgeMap.get(key)!.push(t.symbol);
    });

    edgeMap.forEach((symbols, key) => {
      const [from, to] = key.split('->');
      const label = symbols.join(', ');
      if (from === to) {
        tikz += `    (${from}) edge [loop above] node {${label}} ()\n`;
      } else {
        tikz += `    (${from}) edge [bend left=15] node {${label}} (${to})\n`;
      }
    });

    tikz += `  ;\n\\end{tikzpicture}`;
    return tikz;
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleDownloadSVG = () => {
    const svgElem = document.getElementById('fsm-canvas-svg');
    if (!svgElem) return;

    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgElem);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dfa-${regex.replace(/[^a-zA-Z0-9]/g, '_') || 'machine'}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tikzCode = generateTikZCode();
  const jsonCode = JSON.stringify(
    {
      regex,
      alphabet: dfa.alphabet,
      states: dfa.states.map(s => s.id),
      startState: dfa.startStateId,
      acceptStates: dfa.acceptStateIds,
      transitions: dfa.transitions,
    },
    null,
    2
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-slate-200 font-semibold">
            <Download className="w-5 h-5 text-sky-400" />
            <span>Export Automaton Diagram & Data</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleDownloadSVG}
              className="flex items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 font-medium text-sm transition-all"
            >
              <Image className="w-4 h-4 text-sky-400" />
              <span>Download SVG Diagram</span>
            </button>
            <button
              onClick={() => handleCopy(jsonCode, 'json')}
              className="flex items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 font-medium text-sm transition-all"
            >
              {copiedType === 'json' ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <FileCode className="w-4 h-4 text-emerald-400" />
              )}
              <span>{copiedType === 'json' ? 'JSON Copied!' : 'Copy JSON Machine'}</span>
            </button>
          </div>

          {/* LaTeX TikZ */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Code className="w-4 h-4 text-purple-400" />
                LaTeX TikZ Code (for CS Papers / Homework)
              </span>
              <button
                onClick={() => handleCopy(tikzCode, 'tikz')}
                className="text-xs flex items-center gap-1 text-slate-400 hover:text-white bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700"
              >
                {copiedType === 'tikz' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy LaTeX
                  </>
                )}
              </button>
            </div>
            <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 max-h-40 overflow-y-auto">
              {tikzCode}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
