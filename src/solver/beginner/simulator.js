import { FACE_NORMALS, stickerIndexAt } from '../../cube/state.js';
import { applyMove } from '../../cube/moves.js';
import { parseSequence } from '../../cube/notation.js';

export const SIDES = ['F', 'R', 'B', 'L'];

const sideAt = (side, offset) => SIDES[(SIDES.indexOf(side) + offset) % 4];

/** Vizinhos de uma face lateral, olhando para ela com o amarelo em cima. */
export const rightOf = (side) => sideAt(side, 1);
export const oppositeOf = (side) => sideAt(side, 2);
export const leftOf = (side) => sideAt(side, 3);

/**
 * Os algoritmos clássicos são escritos para a face da frente. Em vez de pedir uma rotação do cubo,
 * trocamos as letras para que `front` faça o papel de F: com front = R, "F R" vira "R B".
 */
function inFrame(move, front) {
  const offset = SIDES.indexOf(front);
  const position = SIDES.indexOf(move.face);
  return position === -1 ? move : { ...move, face: sideAt(move.face, offset) };
}

/** Cubo simulado: guarda o estado atual e os movimentos aplicados na etapa em andamento. */
export function createSimulator(initialState) {
  let state = initialState;
  let moves = [];

  return {
    /** Aplica uma sequência em texto, com `front` fazendo o papel da face da frente. */
    run(sequence, front = 'F') {
      for (const move of parseSequence(sequence)) {
        const actual = inFrame(move, front);
        state = applyMove(state, actual);
        moves.push(actual);
      }
    },

    /** Gira a camada de cima `turns` vezes no sentido horário. */
    turnTop(turns) {
      if (turns % 4 !== 0) this.run(`U${{ 1: '', 2: '2', 3: "'" }[turns % 4]}`);
    },

    /** Cor do adesivo na face `face`, da peça que também toca as faces `others`. */
    colorAt(face, ...others) {
      const position = [0, 0, 0];
      for (const name of [face, ...others]) {
        FACE_NORMALS[name].forEach((value, axis) => {
          position[axis] += value;
        });
      }
      return state[stickerIndexAt(position, FACE_NORMALS[face])];
    },

    /** Devolve os movimentos da etapa e começa a contar a próxima. */
    takeMoves() {
      const taken = moves;
      moves = [];
      return taken;
    },

    getState: () => state,
  };
}

/** Giros de U para levar uma peça da lateral `from` até a lateral `to`. */
export function topTurnsBetween(from, to) {
  const order = ['F', 'L', 'B', 'R']; // ordem em que um giro horário de U leva as peças
  return (order.indexOf(to) - order.indexOf(from) + 4) % 4;
}

/** Interrompe a solução se uma etapa terminar sem cumprir seu objetivo. */
export function assertStep(condition, message) {
  if (!condition) throw new Error(`Método iniciante: ${message}`);
}
