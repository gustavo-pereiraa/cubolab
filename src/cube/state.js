/**
 * Estado do cubo: 54 adesivos na ordem usada pelo algoritmo de Kociemba.
 *
 *                U0  U1  U2
 *                U3  U4  U5
 *                U6  U7  U8
 *   L36 L37 L38  F18 F19 F20  R9  R10 R11  B45 B46 B47
 *   L39 L40 L41  F21 F22 F23  R12 R13 R14  B48 B49 B50
 *   L42 L43 L44  F24 F25 F26  R15 R16 R17  B51 B52 B53
 *                D27 D28 D29
 *                D30 D31 D32
 *                D33 D34 D35
 *
 * Cada adesivo guarda a letra da face à qual sua cor pertence.
 */

export const FACES = ['U', 'R', 'F', 'D', 'L', 'B'];
export const STICKER_COUNT = 54;
const STICKERS_PER_FACE = 9;

/** Vetor normal de cada face. Eixos: x para a direita, y para cima, z para a frente. */
export const FACE_NORMALS = {
  U: [0, 1, 0],
  R: [1, 0, 0],
  F: [0, 0, 1],
  D: [0, -1, 0],
  L: [-1, 0, 0],
  B: [0, 0, -1],
};

/** Posição 3D da peça de cada adesivo, olhando a face de frente (linha e coluna de 0 a 2). */
const FACE_POSITIONS = {
  U: (row, col) => [col - 1, 1, row - 1],
  R: (row, col) => [1, 1 - row, 1 - col],
  F: (row, col) => [col - 1, 1 - row, 1],
  D: (row, col) => [col - 1, -1, 1 - row],
  L: (row, col) => [-1, 1 - row, col - 1],
  B: (row, col) => [1 - col, 1 - row, -1],
};

/** Posição e normal de cada um dos 54 adesivos, indexados como no estado. */
export const STICKERS = FACES.flatMap((face) =>
  Array.from({ length: STICKERS_PER_FACE }, (_, index) => ({
    face,
    position: FACE_POSITIONS[face](Math.floor(index / 3), index % 3),
    normal: FACE_NORMALS[face],
  })),
);

const stickerKey = (position, normal) => `${position}|${normal}`;
const indexByKey = new Map(STICKERS.map((s, index) => [stickerKey(s.position, s.normal), index]));

/** Índice do adesivo em uma posição 3D, olhando na direção da normal. */
export function stickerIndexAt(position, normal) {
  return indexByKey.get(stickerKey(position, normal));
}

export function createSolvedState() {
  return STICKERS.map((sticker) => sticker.face);
}

export function isSolved(state) {
  return state.every((color, index) => color === STICKERS[index].face);
}

/** Representação em texto de 54 letras, no formato aceito pela biblioteca cubejs. */
export function stateToString(state) {
  return state.join('');
}

export function stateFromString(text) {
  if (text.length !== STICKER_COUNT) {
    throw new Error(`O estado deve ter ${STICKER_COUNT} adesivos, recebeu ${text.length}.`);
  }
  return [...text];
}
