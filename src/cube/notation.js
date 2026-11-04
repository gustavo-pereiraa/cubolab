import { FACES } from './state.js';

const MOVE_PATTERN = /^([URFDLB])(2|['′’])?$/;

/** Converte "R", "R'", "R′" ou "R2" em { face, turns }, com turns de 1 a 3 no sentido horário. */
export function parseMove(text) {
  const match = MOVE_PATTERN.exec(text);
  if (!match) throw new Error(`Movimento inválido: "${text}".`);
  const [, face, suffix] = match;
  return { face, turns: suffix === '2' ? 2 : suffix ? 3 : 1 };
}

/** Converte uma sequência em texto, como "R U R' U'", numa lista de movimentos. */
export function parseSequence(text) {
  return text.trim().split(/\s+/).filter(Boolean).map(parseMove);
}

/** Forma ASCII, aceita pela cubejs: "R", "R'" ou "R2". */
export function formatMove({ face, turns }) {
  return face + { 1: '', 2: '2', 3: "'" }[turns];
}

/** Forma para exibir na interface, com o sinal de linha tipográfico: "R′". */
export function displayMove({ face, turns }) {
  return face + { 1: '', 2: '2', 3: '′' }[turns];
}

export function formatSequence(moves) {
  return moves.map(formatMove).join(' ');
}

export function invertMove({ face, turns }) {
  return { face, turns: 4 - turns };
}

export function invertSequence(moves) {
  return moves.map(invertMove).reverse();
}

export const ALL_MOVES = FACES.flatMap((face) => [1, 2, 3].map((turns) => ({ face, turns })));
