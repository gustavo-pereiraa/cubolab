import Cube from 'cubejs';
import { stateFromString } from '../cube/state.js';
import { formatSequence } from '../cube/notation.js';
import { solveNearSolved } from './nearSolved.js';

let isReady = false;

/** Monta as tabelas do algoritmo. Leva alguns segundos, por isso roda em um Web Worker no navegador. */
export function initKociemba() {
  if (isReady) return;
  Cube.initSolver();
  isReady = true;
}

/** Recebe o estado em texto (54 letras) e devolve a solução em texto, como "R U2 F'". */
export function solveKociemba(stateText) {
  const exact = solveNearSolved(stateFromString(stateText));
  if (exact) return formatSequence(exact);
  initKociemba();
  return Cube.fromString(stateText).solve();
}
