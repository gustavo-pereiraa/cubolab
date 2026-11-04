import { describe, expect, it } from 'vitest';
import { DEFAULT_SCRAMBLE_LENGTH, generateScramble } from '../../src/cube/scramble.js';
import { createSolvedState, isSolved } from '../../src/cube/state.js';
import { applySequence } from '../../src/cube/moves.js';
import { invertSequence } from '../../src/cube/notation.js';

const AXIS = { U: 0, D: 0, R: 1, L: 1, F: 2, B: 2 };

/** Gerador pseudoaleatório com semente, para os testes serem reproduzíveis. */
function seededRandom(seed) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

describe('embaralhamento', () => {
  it('tem o tamanho pedido', () => {
    expect(generateScramble()).toHaveLength(DEFAULT_SCRAMBLE_LENGTH);
    expect(generateScramble(10)).toHaveLength(10);
  });

  it('é reproduzível com a mesma semente e muda com outra', () => {
    expect(generateScramble(25, seededRandom(1))).toEqual(generateScramble(25, seededRandom(1)));
    expect(generateScramble(25, seededRandom(1))).not.toEqual(generateScramble(25, seededRandom(2)));
  });

  it('nunca tem movimentos redundantes em 500 embaralhamentos', () => {
    for (let seed = 1; seed <= 500; seed += 1) {
      const moves = generateScramble(25, seededRandom(seed));
      moves.forEach((move, i) => {
        if (i === 0) return;
        expect(move.face).not.toBe(moves[i - 1].face);
        // Num trecho do mesmo eixo cabem no máximo duas faces, como em "R L", mas não "R L R".
        if (i >= 2 && AXIS[move.face] === AXIS[moves[i - 1].face]) {
          expect(AXIS[moves[i - 2].face]).not.toBe(AXIS[move.face]);
        }
      });
    }
  });

  it('usa todas as faces e todos os tipos de giro', () => {
    const moves = Array.from({ length: 50 }, (_, seed) => generateScramble(25, seededRandom(seed + 1))).flat();
    expect(new Set(moves.map((move) => move.face)).size).toBe(6);
    expect(new Set(moves.map((move) => move.turns)).size).toBe(3);
  });

  it('bagunça o cubo e pode ser desfeito', () => {
    const moves = generateScramble(25, seededRandom(42));
    const scrambled = applySequence(createSolvedState(), moves);
    expect(isSolved(scrambled)).toBe(false);
    expect(isSolved(applySequence(scrambled, invertSequence(moves)))).toBe(true);
  });
});
