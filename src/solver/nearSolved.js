import { createSolvedState, stateToString } from '../cube/state.js';
import { applyMove } from '../cube/moves.js';
import { ALL_MOVES, invertMove } from '../cube/notation.js';

/**
 * Busca exata para cubos a até 8 movimentos de resolvidos, onde a cubejs desperdiça movimentos
 * (ela resolve um único giro de R com 8 ou mais). Busca bidirecional: uma tabela guarda tudo
 * o que está a até 4 movimentos do resolvido, e a busca anda até 4 movimentos a partir do cubo.
 */
const SEARCH_DEPTH = 4;

let table = null;

/** Mapa de cada estado próximo para { depth, move, next }: o movimento que o aproxima do resolvido. */
function getTable() {
  if (table) return table;
  const solved = createSolvedState();
  table = new Map([[stateToString(solved), { depth: 0 }]]);
  let frontier = [solved];

  for (let depth = 1; depth <= SEARCH_DEPTH; depth += 1) {
    const nextFrontier = [];
    for (const state of frontier) {
      const next = stateToString(state);
      for (const move of ALL_MOVES) {
        const neighbor = applyMove(state, move);
        const key = stateToString(neighbor);
        if (!table.has(key)) {
          table.set(key, { depth, move: invertMove(move), next });
          nextFrontier.push(neighbor);
        }
      }
    }
    frontier = nextFrontier;
  }
  return table;
}

function pathToSolved(key) {
  const moves = [];
  for (let entry = table.get(key); entry.depth > 0; entry = table.get(entry.next)) moves.push(entry.move);
  return moves;
}

/** Devolve a menor lista de movimentos, ou null se o cubo estiver a mais de 8 movimentos. */
export function solveNearSolved(state) {
  getTable();
  let frontier = [{ state, moves: [] }];

  for (let walked = 0; walked <= SEARCH_DEPTH; walked += 1) {
    // Neste nível, a melhor saída é a que chega à tabela mais perto do resolvido.
    let best = null;
    for (const node of frontier) {
      const key = stateToString(node.state);
      const entry = table.get(key);
      if (entry && (!best || entry.depth < best.depth)) best = { depth: entry.depth, key, moves: node.moves };
    }
    if (best) return [...best.moves, ...pathToSolved(best.key)];
    if (walked === SEARCH_DEPTH) break;

    frontier = frontier.flatMap(({ state: current, moves }) =>
      ALL_MOVES.filter((move) => move.face !== moves.at(-1)?.face).map((move) => ({
        state: applyMove(current, move),
        moves: [...moves, move],
      })),
    );
  }
  return null;
}
