import { STICKERS } from './state.js';

/**
 * Índices dos adesivos de cada peça, na numeração padrão de Kociemba.
 * Os cantos são lidos no sentido horário, começando pelo adesivo de U ou D.
 */
export const CORNERS = [
  [8, 9, 20], // URF
  [6, 18, 38], // UFL
  [0, 36, 47], // ULB
  [2, 45, 11], // UBR
  [29, 26, 15], // DFR
  [27, 44, 24], // DLF
  [33, 53, 42], // DBL
  [35, 17, 51], // DRB
];

/** As arestas começam pelo adesivo de U ou D ou, na camada do meio, pelo de F ou B. */
export const EDGES = [
  [5, 10], // UR
  [7, 19], // UF
  [3, 37], // UL
  [1, 46], // UB
  [32, 16], // DR
  [28, 25], // DF
  [30, 43], // DL
  [34, 52], // DB
  [23, 12], // FR
  [21, 41], // FL
  [50, 39], // BL
  [48, 14], // BR
];

const homeColors = (indices) => indices.map((index) => STICKERS[index].face);
const sameColors = (a, b) => a.every((color, i) => color === b[i]);

/** Identifica o canto presente em uma posição: qual é a peça e quanto está girada (0 a 2). */
export function readCorner(state, slot) {
  const colors = CORNERS[slot].map((index) => state[index]);
  const twist = colors.findIndex((color) => color === 'U' || color === 'D');
  if (twist === -1) return null;
  const upright = [colors[twist], colors[(twist + 1) % 3], colors[(twist + 2) % 3]];
  const piece = CORNERS.findIndex((home) => sameColors(upright, homeColors(home)));
  return piece === -1 ? null : { piece, twist };
}

/** Identifica a aresta presente em uma posição: qual é a peça e se está invertida (0 ou 1). */
export function readEdge(state, slot) {
  const colors = EDGES[slot].map((index) => state[index]);
  for (const [piece, home] of EDGES.entries()) {
    const expected = homeColors(home);
    if (sameColors(colors, expected)) return { piece, flip: 0 };
    if (sameColors(colors, [...expected].reverse())) return { piece, flip: 1 };
  }
  return null;
}
