import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { DFA, NFA, MachineLayoutEdge } from '../types';
import { computeDFALayout, LayoutPoint } from '../engine/layout';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, Move, Sparkles } from 'lucide-react';

interface FSMCanvasProps {
  dfa: DFA | null;
  nfa?: NFA | null;
  activeStateId: string | null;
  activeTransition: { from: string; to: string; symbol: string } | null;
  showSubsets?: boolean;
  viewType?: 'minimized' | 'unminimized' | 'nfa';
  onSelectState?: (stateId: string) => void;
}

const NODE_RADIUS = 28;
const ACCEPT_INNER_RADIUS = 22;

export const FSMCanvas: React.FC<FSMCanvasProps> = ({
  dfa,
  activeStateId,
  activeTransition,
  showSubsets = false,
  viewType = 'minimized',
  onSelectState,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 480 });
  const [nodePositions, setNodePositions] = useState<Map<string, LayoutPoint>>(new Map());
  
  // Pan and Zoom
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  // Node Dragging
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Resize observer to keep canvas responsive
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setDimensions({
          width: Math.max(clientWidth, 400),
          height: Math.max(clientHeight, 400),
        });
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute default layout when DFA changes or viewType changes
  const resetLayout = useCallback(() => {
    if (!dfa) return;
    const computed = computeDFALayout(dfa, dimensions.width, dimensions.height);
    setNodePositions(computed);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [dfa, dimensions.width, dimensions.height]);

  useEffect(() => {
    resetLayout();
  }, [dfa, resetLayout]);

  // Group transitions to combine multiple symbols between same nodes
  const groupedEdges = useMemo(() => {
    if (!dfa) return [];
    
    const edgeMap = new Map<string, { from: string; to: string; symbols: Set<string> }>();
    
    dfa.transitions.forEach(t => {
      const key = `${t.from}->${t.to}`;
      if (!edgeMap.has(key)) {
        edgeMap.set(key, { from: t.from, to: t.to, symbols: new Set() });
      }
      edgeMap.get(key)!.symbols.add(t.symbol);
    });
    
    const result: MachineLayoutEdge[] = [];
    
    edgeMap.forEach((edge, key) => {
      const isSelfLoop = edge.from === edge.to;
      const reverseKey = `${edge.to}->${edge.from}`;
      const hasReverse = edgeMap.has(reverseKey) && !isSelfLoop;
      
      result.push({
        id: key,
        from: edge.from,
        to: edge.to,
        symbols: Array.from(edge.symbols).sort(),
        isSelfLoop,
        curveOffset: hasReverse ? 38 : 0,
      });
    });
    
    return result;
  }, [dfa]);

  // Fit to screen
  const handleFitToScreen = () => {
    if (nodePositions.size === 0) return;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    
    nodePositions.forEach(p => {
      minX = Math.min(minX, p.x - NODE_RADIUS - 30);
      maxX = Math.max(maxX, p.x + NODE_RADIUS + 30);
      minY = Math.min(minY, p.y - NODE_RADIUS - 30);
      maxY = Math.max(maxY, p.y + NODE_RADIUS + 30);
    });
    
    const contentW = maxX - minX;
    const contentH = maxY - minY;
    if (contentW <= 0 || contentH <= 0) return;
    
    const scaleX = (dimensions.width - 80) / contentW;
    const scaleY = (dimensions.height - 80) / contentH;
    const newZoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.5), 1.6);
    
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;
    
    setZoom(newZoom);
    setPan({
      x: dimensions.width / 2 - midX * newZoom,
      y: dimensions.height / 2 - midY * newZoom,
    });
  };

  // Pan interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).id === 'fsm-canvas-bg') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    } else if (draggingNodeId) {
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;
      
      const mouseCanvasX = (e.clientX - containerRect.left - pan.x) / zoom;
      const mouseCanvasY = (e.clientY - containerRect.top - pan.y) / zoom;
      
      setNodePositions(prev => {
        const next = new Map(prev);
        next.set(draggingNodeId, {
          x: mouseCanvasX - dragOffset.x,
          y: mouseCanvasY - dragOffset.y,
        });
        return next;
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom(prev => Math.min(Math.max(prev * zoomFactor, 0.35), 3));
  };

  const handleNodeMouseDown = (e: React.MouseEvent, stateId: string) => {
    e.stopPropagation();
    const nodePos = nodePositions.get(stateId);
    if (!nodePos || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const mouseCanvasX = (e.clientX - containerRect.left - pan.x) / zoom;
    const mouseCanvasY = (e.clientY - containerRect.top - pan.y) / zoom;
    
    setDraggingNodeId(stateId);
    setDragOffset({
      x: mouseCanvasX - nodePos.x,
      y: mouseCanvasY - nodePos.y,
    });
    
    if (onSelectState) onSelectState(stateId);
  };

  if (!dfa || dfa.states.length === 0) {
    return (
      <div 
        id="fsm-canvas-empty" 
        className="w-full h-full min-h-[380px] flex flex-col items-center justify-center bg-slate-900/60 rounded-xl border border-slate-800 text-slate-400 p-8 text-center"
      >
        <Sparkles className="w-10 h-10 text-indigo-400 mb-3 opacity-60 animate-pulse" />
        <p className="text-base font-medium text-slate-300">Enter a regular expression above</p>
        <p className="text-sm text-slate-500 mt-1 max-w-md">
          The interactive state machine will be generated here automatically with draggable nodes, active step-by-step glowing simulation, and transition highlights.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      id="fsm-canvas-container"
      className="relative w-full h-[520px] bg-slate-950 rounded-xl border border-slate-800/80 overflow-hidden select-none shadow-inner cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Canvas Toolbars */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-2 py-1.5 rounded-lg border border-slate-800 shadow-lg text-xs text-slate-300">
        <button
          id="btn-zoom-in"
          onClick={() => setZoom(z => Math.min(z * 1.2, 2.5))}
          className="p-1.5 hover:bg-slate-800 rounded transition-colors text-slate-300 hover:text-white"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          id="btn-zoom-out"
          onClick={() => setZoom(z => Math.max(z / 1.2, 0.4))}
          className="p-1.5 hover:bg-slate-800 rounded transition-colors text-slate-300 hover:text-white"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />
        <button
          id="btn-fit-screen"
          onClick={handleFitToScreen}
          className="p-1.5 hover:bg-slate-800 rounded transition-colors text-slate-300 hover:text-white flex items-center gap-1"
          title="Fit to Screen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          id="btn-reset-layout"
          onClick={resetLayout}
          className="p-1.5 hover:bg-slate-800 rounded transition-colors text-slate-300 hover:text-white flex items-center gap-1"
          title="Auto Rearrange"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Canvas Legend */}
      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-3 bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-800/80 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
          <span>Start State</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full border-2 border-emerald-400 inline-block" />
          <span>Accept State</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping inline-block" />
          <span>Active State</span>
        </div>
        <div className="hidden sm:flex items-center gap-1 text-slate-500 pl-2 border-l border-slate-800">
          <Move className="w-3 h-3" />
          <span>Drag nodes or canvas to reposition</span>
        </div>
      </div>

      {/* Main SVG Area */}
      <svg
        id="fsm-canvas-svg"
        className="w-full h-full"
        style={{ cursor: isPanning ? 'grabbing' : 'default' }}
      >
        <defs>
          {/* Default Edge Arrow */}
          <marker
            id="arrowhead-default"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
          </marker>
          
          {/* Active Glowing Edge Arrow */}
          <marker
            id="arrowhead-active"
            markerWidth="12"
            markerHeight="8"
            refX="10"
            refY="4"
            orient="auto"
          >
            <polygon points="0 0, 12 4, 0 8" fill="#38bdf8" />
          </marker>

          {/* Start Indicator Arrow */}
          <marker
            id="arrowhead-start"
            markerWidth="9"
            markerHeight="6"
            refX="8"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 9 3, 0 6" fill="#818cf8" />
          </marker>

          {/* Background Grid Pattern */}
          <pattern
            id="canvas-grid"
            width="28"
            height="28"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="14" cy="14" r="0.9" fill="#334155" opacity="0.4" />
          </pattern>

          {/* Glow Filters */}
          <filter id="glow-active-state" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Grid Background */}
        <rect
          id="fsm-canvas-bg"
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="url(#canvas-grid)"
        />

        {/* Transformed Canvas Container */}
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* 1. EDGES & TRANSITIONS */}
          {groupedEdges.map(edge => {
            const fromPos = nodePositions.get(edge.from);
            const toPos = nodePositions.get(edge.to);
            if (!fromPos || !toPos) return null;

            const isEdgeActive = activeTransition &&
              activeTransition.from === edge.from &&
              activeTransition.to === edge.to &&
              edge.symbols.includes(activeTransition.symbol);

            const strokeColor = isEdgeActive ? '#38bdf8' : '#64748b';
            const markerId = isEdgeActive ? 'url(#arrowhead-active)' : 'url(#arrowhead-default)';
            const strokeWidth = isEdgeActive ? 3.2 : 1.8;

            if (edge.isSelfLoop) {
              // Self-loop arc drawn above node
              const cx = fromPos.x;
              const cy = fromPos.y;
              const r = NODE_RADIUS;
              
              // Angle for loop: from 220 deg to 320 deg
              const angle1 = (220 * Math.PI) / 180;
              const angle2 = (320 * Math.PI) / 180;
              
              const startX = cx + r * Math.cos(angle1);
              const startY = cy + r * Math.sin(angle1);
              const endX = cx + r * Math.cos(angle2);
              const endY = cy + r * Math.sin(angle2);
              
              // Control points for high loop
              const cp1X = cx - 35;
              const cp1Y = cy - 65;
              const cp2X = cx + 35;
              const cp2Y = cy - 65;

              const pathD = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
              const labelX = cx;
              const labelY = cy - 62;

              return (
                <g key={edge.id} className="transition-all duration-200">
                  <path
                    d={pathD}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    markerEnd={markerId}
                    className={isEdgeActive ? 'animate-pulse filter drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]' : ''}
                  />
                  {/* Label badge */}
                  <rect
                    x={labelX - (edge.symbols.join(', ').length * 4 + 7)}
                    y={labelY - 10}
                    width={edge.symbols.join(', ').length * 8 + 14}
                    height="18"
                    rx="4"
                    fill={isEdgeActive ? '#0284c7' : '#0f172a'}
                    stroke={isEdgeActive ? '#38bdf8' : '#334155'}
                    strokeWidth="1"
                  />
                  <text
                    x={labelX}
                    y={labelY + 3}
                    textAnchor="middle"
                    fill={isEdgeActive ? '#ffffff' : '#94a3b8'}
                    fontSize="11"
                    fontWeight="600"
                    fontFamily="monospace"
                  >
                    {edge.symbols.join(', ')}
                  </text>
                </g>
              );
            }

            // Normal or Curved Edge between different nodes
            const dx = toPos.x - fromPos.x;
            const dy = toPos.y - fromPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist === 0) return null;

            const unitX = dx / dist;
            const unitY = dy / dist;
            const normX = -unitY;
            const normY = unitX;

            const curveOffset = edge.curveOffset;

            let pathD = '';
            let labelX = 0;
            let labelY = 0;

            if (curveOffset === 0) {
              // Straight line
              const startX = fromPos.x + unitX * NODE_RADIUS;
              const startY = fromPos.y + unitY * NODE_RADIUS;
              const endX = toPos.x - unitX * NODE_RADIUS;
              const endY = toPos.y - unitY * NODE_RADIUS;

              pathD = `M ${startX} ${startY} L ${endX} ${endY}`;
              labelX = (startX + endX) / 2 + normX * 14;
              labelY = (startY + endY) / 2 + normY * 14;
            } else {
              // Curved Bezier
              const midX = (fromPos.x + toPos.x) / 2 + normX * curveOffset;
              const midY = (fromPos.y + toPos.y) / 2 + normY * curveOffset;

              // Compute intersection with target circle
              const toTargetDx = toPos.x - midX;
              const toTargetDy = toPos.y - midY;
              const toTargetDist = Math.sqrt(toTargetDx * toTargetDx + toTargetDy * toTargetDy);
              
              const startX = fromPos.x + (midX - fromPos.x) * (NODE_RADIUS / Math.sqrt((midX - fromPos.x)**2 + (midY - fromPos.y)**2));
              const startY = fromPos.y + (midY - fromPos.y) * (NODE_RADIUS / Math.sqrt((midX - fromPos.x)**2 + (midY - fromPos.y)**2));
              
              const endX = toPos.x - (toTargetDx / toTargetDist) * NODE_RADIUS;
              const endY = toPos.y - (toTargetDy / toTargetDist) * NODE_RADIUS;

              pathD = `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`;
              labelX = midX;
              labelY = midY;
            }

            const labelText = edge.symbols.join(', ');
            const labelWidth = labelText.length * 8 + 12;

            return (
              <g key={edge.id} className="transition-all duration-200">
                <path
                  d={pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  markerEnd={markerId}
                  className={isEdgeActive ? 'animate-pulse filter drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]' : ''}
                />
                {/* Edge Label Badge */}
                <rect
                  x={labelX - labelWidth / 2}
                  y={labelY - 9}
                  width={labelWidth}
                  height="18"
                  rx="4"
                  fill={isEdgeActive ? '#0284c7' : '#0f172a'}
                  stroke={isEdgeActive ? '#38bdf8' : '#334155'}
                  strokeWidth="1"
                />
                <text
                  x={labelX}
                  y={labelY + 4}
                  textAnchor="middle"
                  fill={isEdgeActive ? '#ffffff' : '#cbd5e1'}
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="monospace"
                >
                  {labelText}
                </text>
              </g>
            );
          })}

          {/* 2. STATE NODES */}
          {dfa.states.map(state => {
            const pos = nodePositions.get(state.id);
            if (!pos) return null;

            const isActive = activeStateId === state.id;
            const isStart = state.id === dfa.startStateId;
            const isAccept = dfa.acceptStateIds.includes(state.id);

            // Colors based on Evan Wallace FSM style with modern dark theme palette
            let nodeFill = '#1e293b'; // slate-800
            let nodeStroke = '#475569'; // slate-600
            let textColor = '#f8fafc'; // slate-50

            if (isActive) {
              nodeFill = '#0369a1'; // sky-700
              nodeStroke = '#38bdf8'; // sky-400
              textColor = '#ffffff';
            } else if (isAccept) {
              nodeFill = '#064e3b'; // emerald-900/60
              nodeStroke = '#10b981'; // emerald-500
            } else if (isStart) {
              nodeFill = '#1e1b4b'; // indigo-950
              nodeStroke = '#6366f1'; // indigo-500
            }

            return (
              <g
                key={state.id}
                id={`state-node-${state.id}`}
                transform={`translate(${pos.x}, ${pos.y})`}
                onMouseDown={(e) => handleNodeMouseDown(e, state.id)}
                className="cursor-grab active:cursor-grabbing group"
              >
                {/* Start State Arrow Indicator */}
                {isStart && (
                  <g transform={`translate(-${NODE_RADIUS + 36}, 0)`}>
                    <line
                      x1="0"
                      y1="0"
                      x2="32"
                      y2="0"
                      stroke="#818cf8"
                      strokeWidth="2.5"
                      markerEnd="url(#arrowhead-start)"
                    />
                    <text
                      x="-8"
                      y="4"
                      textAnchor="end"
                      fill="#a5b4fc"
                      fontSize="11"
                      fontWeight="700"
                      fontFamily="system-ui"
                    >
                      start
                    </text>
                  </g>
                )}

                {/* Active Outer Pulsing Aura */}
                {isActive && (
                  <circle
                    r={NODE_RADIUS + 9}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="3"
                    opacity="0.75"
                    className="animate-ping"
                  />
                )}

                {/* Main Outer Circle */}
                <circle
                  r={NODE_RADIUS}
                  fill={nodeFill}
                  stroke={nodeStroke}
                  strokeWidth={isActive ? 3 : 2}
                  filter={isActive ? 'url(#glow-active-state)' : undefined}
                  className="transition-all duration-200"
                />

                {/* Double Ring for Accept State */}
                {isAccept && (
                  <circle
                    r={ACCEPT_INNER_RADIUS}
                    fill="none"
                    stroke={isActive ? '#7dd3fc' : '#34d399'}
                    strokeWidth="1.8"
                  />
                )}

                {/* State Name (e.g. q0) */}
                <text
                  x="0"
                  y={showSubsets && state.nfaSubsetState && state.nfaSubsetState.length > 0 ? -4 : 5}
                  textAnchor="middle"
                  fill={textColor}
                  fontSize="13"
                  fontWeight="700"
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  {state.label || state.id}
                </text>

                {/* Subtitle: NFA Subset representation if enabled (e.g., {0, 1, 3}) */}
                {showSubsets && state.nfaSubsetState && (
                  <text
                    x="0"
                    y="13"
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {`{${state.nfaSubsetState.slice(0, 3).join(',')}${state.nfaSubsetState.length > 3 ? '…' : ''}}`}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
