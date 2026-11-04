import Cube from 'cubejs';
import { beforeAll, describe, expect, it } from 'vitest';
import { createSolvedState, isSolved, stateFromString, stateToString } from '../../src/cube/state.js';
import { applySequence } from '../../src/cube/moves.js';
import { ALL_MOVES, formatMove } from '../../src/cube/notation.js';
import { generateScramble } from '../../src/cube/scramble.js';
import { initKociemba, solveKociemba } from '../../src/solver/kociemba.core.js';

const solved = createSolvedState();

describe('integração com a cubejs', () => {
  beforeAll(() => initKociemba(), 60000);

  it('nosso modelo e a cubejs concordam nos 18 movimentos', () => {
    for (const move of ALL_MOVES) {
      const theirs = new Cube();
      theirs.move(formatMove(move));
      expect(stateToString(applySequence(solved, [move]))).toBe(theirs.asString());
    }
  });

  it('o estado em texto é reconhecido pela cubejs', () => {
    const state = applySequence(solved, "R U2 F' L D B2 U' R2 F L' D2 B");
    expect(stateFromString(Cube.fromString(stateToString(state)).asString())).toEqual(state);
  });

  it('não pede movimentos para um cubo resolvido', () => {
    expect(solveKociemba(stateToString(solved)).trim()).toBe('');
  });

  it('resolve um único giro com o giro inverso', () => {
    expect(solveKociemba(stateToString(applySequence(solved, 'R')))).toBe("R'");
    expect(solveKociemba(stateToString(applySequence(solved, 'U2')))).toBe('U2');
  });

  it('acha a solução exata para cubos a até 8 movimentos', () => {
    const start = performance.now();
    for (let length = 1; length <= 8; length += 1) {
      for (let i = 0; i < 3; i += 1) {
        const scrambled = applySequence(solved, generateScramble(length));
        const solution = solveKociemba(stateToString(scrambled));
        expect(isSolved(applySequence(scrambled, solution))).toBe(true);
        expect(solution.trim().split(/\s+/).length).toBeLessThanOrEqual(length);
      }
    }
    expect(performance.now() - start).toBeLessThan(60000);
  }, 60000);

  it('não encurta demais: uma sequência conhecida de 8 movimentos sem atalhos mantém o tamanho', () => {
    const sequence = "R U F L D B R' U'";
    const solution = solveKociemba(stateToString(applySequence(solved, sequence)));
    expect(solution.trim().split(/\s+/)).toHaveLength(8);
  }, 60000);

  it('resolve 30 embaralhamentos em até 22 movimentos, conferindo no nosso modelo', () => {
    for (let i = 0; i < 30; i += 1) {
      const scrambled = applySequence(solved, generateScramble());
      const solution = solveKociemba(stateToString(scrambled));
      expect(isSolved(applySequence(scrambled, solution))).toBe(true);
      expect(solution.trim().split(/\s+/).length).toBeLessThanOrEqual(22);
    }
  }, 60000);
});
