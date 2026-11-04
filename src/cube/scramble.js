import { FACES } from './state.js';

export const DEFAULT_SCRAMBLE_LENGTH = 25;

const AXIS = { U: 'UD', D: 'UD', R: 'RL', L: 'RL', F: 'FB', B: 'FB' };

function randomItem(items, random) {
  return items[Math.floor(random() * items.length)];
}

/**
 * Gera um embaralhamento sem movimentos redundantes: nunca repete a face anterior
 * nem volta a uma face já usada no mesmo eixo sem antes trocar de eixo (como em "R L R").
 */
export function generateScramble(length = DEFAULT_SCRAMBLE_LENGTH, random = Math.random) {
  const moves = [];
  let usedOnAxis = [];

  while (moves.length < length) {
    const face = randomItem(FACES.filter((candidate) => !usedOnAxis.includes(candidate)), random);
    const previous = moves.at(-1);
    usedOnAxis = previous && AXIS[previous.face] === AXIS[face] ? [...usedOnAxis, face] : [face];
    moves.push({ face, turns: randomItem([1, 2, 3], random) });
  }
  return moves;
}
