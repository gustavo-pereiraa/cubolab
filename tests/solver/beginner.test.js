import { describe, expect, it } from 'vitest';
import { STICKERS, createSolvedState, isSolved } from '../../src/cube/state.js';
import { applySequence } from '../../src/cube/moves.js';
import { CORNERS, EDGES } from '../../src/cube/pieces.js';
import { generateScramble } from '../../src/cube/scramble.js';
import { simplifyMoves, formatSequence, parseSequence } from '../../src/cube/notation.js';
import { STAGES } from '../../src/solver/beginner/instructions.js';
import { solveBeginner } from '../../src/solver/beginner/index.js';

const solved = createSolvedState();

function seededRandom(seed) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

const isPieceHome = (state, indices) => indices.every((index) => state[index] === STICKERS[index].face);
const pieces = (list, ...slots) => slots.map((slot) => list[slot]);

/** O que precisa estar pronto ao fim de cada etapa. */
const STAGE_GOALS = {
  cross: (s) => pieces(EDGES, 4, 5, 6, 7).every((p) => isPieceHome(s, p)),
  firstLayer: (s) => pieces(CORNERS, 4, 5, 6, 7).every((p) => isPieceHome(s, p)),
  secondLayer: (s) => pieces(EDGES, 8, 9, 10, 11).every((p) => isPieceHome(s, p)),
  yellowCross: (s) => [1, 3, 5, 7].every((index) => s[index] === 'U'),
  yellowFace: (s) => [0, 2, 6, 8].every((index) => s[index] === 'U'),
  topCorners: (s) => CORNERS.slice(0, 4).every((p) => isPieceHome(s, p)),
  topEdges: isSolved,
};

function checkSolution(scrambled) {
  let state = scrambled;
  const done = [];
  for (const stage of solveBeginner(scrambled)) {
    state = applySequence(state, stage.moves);
    done.push(stage.id);
    // Cada etapa cumpre o próprio objetivo e não desfaz nenhuma das anteriores.
    for (const id of done) expect(STAGE_GOALS[id](state), `etapa ${id} ao fim de ${stage.id}`).toBe(true);
  }
  expect(isSolved(state)).toBe(true);
}

describe('método iniciante', () => {
  it('não faz nada em um cubo resolvido', () => {
    const stages = solveBeginner(solved);
    expect(stages.map((stage) => stage.id)).toEqual(STAGES.map((stage) => stage.id));
    expect(stages.every((stage) => stage.moves.length === 0)).toBe(true);
  });

  it('entrega as 7 etapas com título e instrução', () => {
    const stages = solveBeginner(applySequence(solved, "R U2 F' L D B2"));
    expect(stages).toHaveLength(7);
    for (const stage of stages) {
      expect(stage.title).toBeTruthy();
      expect(stage.instruction).toBeTruthy();
    }
  });

  it('resolve 1000 embaralhamentos, cumprindo o objetivo de cada etapa', () => {
    const random = seededRandom(2026);
    for (let i = 0; i < 1000; i += 1) {
      checkSolution(applySequence(solved, generateScramble(25, random)));
    }
  });

  it('resolve cubos pouco embaralhados', () => {
    const random = seededRandom(7);
    for (let length = 1; length <= 6; length += 1) {
      for (let i = 0; i < 100; i += 1) checkSolution(applySequence(solved, generateScramble(length, random)));
    }
  });

  it('resolve todos os casos de última camada formados por algoritmos conhecidos', () => {
    const lastLayerCases = [
      "R U R' U R U2 R'",
      "F R U R' U' F'",
      "R' F R' B2 R F' R' B2 R2",
      "R U' R U R U R U' R' U' R2",
      "R U' R U R U R U' R' U' R2 U2 R U' R U R U R U' R' U' R2",
      "F R U R' U' F' U2 F R U R' U' F'",
      "R' F R' B2 R F' R' B2 R2 U R' F R' B2 R F' R' B2 R2",
    ];
    for (const sequence of lastLayerCases) {
      for (const top of ['', 'U', 'U2', "U'"]) checkSolution(applySequence(solved, `${sequence} ${top}`));
    }
  });

  it('não usa rotações nem repete giros da mesma face', () => {
    const scrambled = applySequence(solved, generateScramble(25, seededRandom(11)));
    for (const { moves } of solveBeginner(scrambled)) {
      expect(simplifyMoves(moves)).toEqual(moves);
      for (const { face } of moves) expect('URFDLB').toContain(face);
    }
  });
});

describe('simplificação de movimentos', () => {
  it.each([
    ['R R', 'R2'],
    ["R R'", ''],
    ['R2 R', "R'"],
    ["U R R' U'", ''],
    ['R U', 'R U'],
  ])('%s vira "%s"', (input, expected) => {
    expect(formatSequence(simplifyMoves(parseSequence(input)))).toBe(expected);
  });
});
