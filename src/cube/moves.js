import { FACES, FACE_NORMALS, STICKERS } from './state.js';
import { parseSequence } from './notation.js';

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** Gira um vetor 90° no sentido horário, olhando o eixo de fora (fórmula de Rodrigues com θ = -90°). */
function rotateClockwise(vector, axis) {
  const along = dot(vector, axis);
  return cross(vector, axis).map((value, i) => value + axis[i] * along);
}

const stickerKey = (position, normal) => `${position}|${normal}`;
const indexByKey = new Map(STICKERS.map((s, index) => [stickerKey(s.position, s.normal), index]));

/**
 * Permutação de um quarto de volta horário, derivada da geometria do cubo:
 * targets[i] é o índice para onde o adesivo i vai.
 */
function buildQuarterTurn(face) {
  const axis = FACE_NORMALS[face];
  return STICKERS.map((sticker, index) => {
    if (dot(sticker.position, axis) !== 1) return index;
    return indexByKey.get(stickerKey(rotateClockwise(sticker.position, axis), rotateClockwise(sticker.normal, axis)));
  });
}

const QUARTER_TURNS = Object.fromEntries(FACES.map((face) => [face, buildQuarterTurn(face)]));

/** Aplica um movimento { face, turns } e devolve um novo estado. */
export function applyMove(state, { face, turns }) {
  const targets = QUARTER_TURNS[face];
  let current = state;
  for (let turn = 0; turn < turns; turn += 1) {
    const next = new Array(current.length);
    for (let i = 0; i < current.length; i += 1) next[targets[i]] = current[i];
    current = next;
  }
  return current;
}

/** Aplica uma lista de movimentos ou uma sequência em texto, como "R U R' U'". */
export function applySequence(state, sequence) {
  const moves = typeof sequence === 'string' ? parseSequence(sequence) : sequence;
  return moves.reduce(applyMove, state);
}
