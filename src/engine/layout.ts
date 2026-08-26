import { DFA, DFAState, NFA } from '../types';

export interface LayoutPoint {
  x: number;
  y: number;
}

/**
 * Computes an automatic layout for DFA states
 * Arranges states using a layered/topological or circular flow starting from the start state
 */
export function computeDFALayout(
  dfa: DFA,
  width: number = 800,
  height: number = 500
): Map<string, LayoutPoint> {
  const positions = new Map<string, LayoutPoint>();
  const states = dfa.states;
  
  if (states.length === 0) return positions;
  
  if (states.length === 1) {
    positions.set(states[0].id, { x: width / 2, y: height / 2 });
    return positions;
  }
  
  if (states.length === 2) {
    positions.set(dfa.startStateId, { x: width * 0.35, y: height / 2 });
    const other = states.find(s => s.id !== dfa.startStateId) || states[1];
    positions.set(other.id, { x: width * 0.65, y: height / 2 });
    return positions;
  }
  
  // BFS distance from start state to create layers
  const layers = new Map<number, string[]>();
  const visited = new Set<string>();
  const distance = new Map<string, number>();
  
  const queue: string[] = [dfa.startStateId];
  visited.add(dfa.startStateId);
  distance.set(dfa.startStateId, 0);
  layers.set(0, [dfa.startStateId]);
  
  while (queue.length > 0) {
    const curr = queue.shift()!;
    const currDist = distance.get(curr)!;
    const trans = dfa.transitionMap[curr] || {};
    
    for (const sym of Object.keys(trans)) {
      const next = trans[sym];
      if (next && !visited.has(next)) {
        visited.add(next);
        distance.set(next, currDist + 1);
        
        if (!layers.has(currDist + 1)) {
          layers.set(currDist + 1, []);
        }
        layers.get(currDist + 1)!.push(next);
        queue.push(next);
      }
    }
  }
  
  // Place any remaining unvisited states in a final layer
  for (const s of states) {
    if (!visited.has(s.id)) {
      const maxLayer = Math.max(...Array.from(layers.keys()), 0) + 1;
      if (!layers.has(maxLayer)) layers.set(maxLayer, []);
      layers.get(maxLayer)!.push(s.id);
    }
  }
  
  const layerKeys = Array.from(layers.keys()).sort((a, b) => a - b);
  const totalLayers = layerKeys.length;
  
  // If states are structured linearly / acyclic, layout horizontally
  if (totalLayers > 1 && totalLayers <= 6 && states.length <= 8) {
    const paddingX = 140;
    const availableWidth = width - paddingX * 2;
    const xStep = totalLayers > 1 ? availableWidth / (totalLayers - 1) : 0;
    
    layerKeys.forEach((layerIdx, col) => {
      const layerStates = layers.get(layerIdx)!;
      const count = layerStates.length;
      const yStep = height / (count + 1);
      
      layerStates.forEach((stateId, row) => {
        positions.set(stateId, {
          x: paddingX + col * xStep,
          y: yStep * (row + 1) + (count % 2 === 0 ? (row % 2 === 0 ? -20 : 20) : 0),
        });
      });
    });
    return positions;
  }
  
  // For larger or highly cyclic machines, use elliptical / circle layout with start node on the left
  const centerX = width / 2;
  const centerY = height / 2;
  const radiusX = Math.min(width * 0.38, 280);
  const radiusY = Math.min(height * 0.35, 180);
  
  const count = states.length;
  // Start state on far left (angle = Math.PI)
  const angleStep = (2 * Math.PI) / count;
  
  // Reorder states so start state is at index 0
  const orderedStates = [
    dfa.startStateId,
    ...states.filter(s => s.id !== dfa.startStateId).map(s => s.id),
  ];
  
  orderedStates.forEach((stateId, index) => {
    const angle = Math.PI + index * angleStep;
    positions.set(stateId, {
      x: centerX + radiusX * Math.cos(angle),
      y: centerY + radiusY * Math.sin(angle),
    });
  });
  
  return positions;
}

/**
 * Computes layout for NFA states
 */
export function computeNFALayout(
  nfa: NFA,
  width: number = 800,
  height: number = 500
): Map<number, LayoutPoint> {
  const positions = new Map<number, LayoutPoint>();
  const states = nfa.states;
  const count = states.length;
  
  if (count === 0) return positions;
  
  const paddingX = 100;
  const availableWidth = width - paddingX * 2;
  const xStep = count > 1 ? availableWidth / (count - 1) : 0;
  
  states.forEach((stateNum, index) => {
    // Alternating slight wave for visibility
    const wave = (index % 2 === 1 ? -1 : 1) * (index % 3 === 0 ? 30 : 0);
    positions.set(stateNum, {
      x: paddingX + index * xStep,
      y: height / 2 + wave,
    });
  });
  
  return positions;
}
