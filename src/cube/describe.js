import { FACE_COLORS, FACE_NAMES } from './colors.js';

const TURN_TEXT = {
  1: 'no sentido horário',
  2: 'duas vezes (meia volta)',
  3: 'no sentido anti-horário',
};

/** Instrução em português para um movimento, como "Gire a face de cima (centro amarelo) no sentido horário." */
export function describeMove({ face, turns }) {
  return `Gire a face ${FACE_NAMES[face]} (centro ${FACE_COLORS[face].name}) ${TURN_TEXT[turns]}.`;
}
