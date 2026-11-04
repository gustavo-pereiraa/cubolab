import { FACES, STICKERS } from './state.js';
import { FACE_COLORS } from './colors.js';
import { CORNERS, EDGES, readCorner, readEdge } from './pieces.js';

const STICKERS_PER_COLOR = 9;

const colorName = (color) => FACE_COLORS[color].name;

function listNames(names) {
  return names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} e ${names.at(-1)}`;
}

const describePiece = (state, indices) => listNames(indices.map((index) => colorName(state[index])));

function checkCenters(state) {
  const wrong = STICKERS.flatMap((sticker, index) =>
    index % 9 === 4 && state[index] !== sticker.face ? [index] : [],
  );
  if (wrong.length === 0) return [];
  return [
    {
      code: 'centers',
      message: 'Os centros são fixos: segure o cubo com amarelo em cima e verde na frente.',
      stickers: wrong,
    },
  ];
}

function checkCounts(state) {
  const wrong = FACES.map((face) => ({ face, count: state.filter((color) => color === face).length })).filter(
    ({ count }) => count !== STICKERS_PER_COLOR,
  );
  if (wrong.length === 0) return [];
  const details = listNames(wrong.map(({ face, count }) => `${colorName(face)} tem ${count}`));
  return [{ code: 'counts', message: `Cada cor deve aparecer 9 vezes, mas ${details}.`, stickers: [] }];
}

/** Procura peças que não existem em um cubo real ou que aparecem repetidas. */
function checkPieces(state, slots, read, pieceName) {
  const errors = [];
  const firstSlotOfPiece = new Map();

  slots.forEach((indices, slot) => {
    const found = read(state, slot);
    if (!found) {
      errors.push({
        code: 'impossible-piece',
        message: `Não existe ${pieceName} com as cores ${describePiece(state, indices)}. Confira os quadradinhos destacados.`,
        stickers: indices,
      });
    } else if (firstSlotOfPiece.has(found.piece)) {
      errors.push({
        code: 'duplicate-piece',
        message: `O cubo tem só um ${pieceName} com as cores ${describePiece(state, indices)}, mas ele aparece repetido.`,
        stickers: [...slots[firstSlotOfPiece.get(found.piece)], ...indices],
      });
    } else {
      firstSlotOfPiece.set(found.piece, slot);
    }
  });
  return errors;
}

/** Par (true) quando a permutação pode ser feita com um número par de trocas. */
function isEvenPermutation(permutation) {
  let inversions = 0;
  for (let i = 0; i < permutation.length; i += 1) {
    for (let j = i + 1; j < permutation.length; j += 1) {
      if (permutation[i] > permutation[j]) inversions += 1;
    }
  }
  return inversions % 2 === 0;
}

/** Com todas as peças corretas, confere as leis do cubo: orientação de cantos e arestas e paridade. */
function checkSolvability(state) {
  const corners = CORNERS.map((_, slot) => readCorner(state, slot));
  const edges = EDGES.map((_, slot) => readEdge(state, slot));
  const errors = [];

  if (corners.reduce((sum, corner) => sum + corner.twist, 0) % 3 !== 0) {
    errors.push({
      code: 'corner-twist',
      message: 'Há um canto girado no lugar: as cores estão certas, mas em posição impossível de alcançar só girando as faces.',
      stickers: [],
    });
  }
  if (edges.reduce((sum, edge) => sum + edge.flip, 0) % 2 !== 0) {
    errors.push({
      code: 'edge-flip',
      message: 'Há uma aresta invertida: as cores de uma delas estão trocadas entre si, o que não acontece só girando as faces.',
      stickers: [],
    });
  }
  if (isEvenPermutation(corners.map(({ piece }) => piece)) !== isEvenPermutation(edges.map(({ piece }) => piece))) {
    errors.push({
      code: 'parity',
      message: 'Há duas peças trocadas de lugar: essa troca isolada não é possível só girando as faces.',
      stickers: [],
    });
  }
  return errors;
}

/**
 * Valida um estado em etapas, parando na primeira que falhar, pois cada uma depende da anterior.
 * Devolve { valid, errors }, e cada erro traz a mensagem e os índices dos adesivos a destacar.
 */
export function validateState(state) {
  const checks = [
    () => checkCenters(state),
    () => checkCounts(state),
    () => [...checkPieces(state, CORNERS, readCorner, 'canto'), ...checkPieces(state, EDGES, readEdge, 'aresta')],
    () => checkSolvability(state),
  ];
  for (const check of checks) {
    const errors = check();
    if (errors.length > 0) return { valid: false, errors };
  }
  return { valid: true, errors: [] };
}
