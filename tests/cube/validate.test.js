import { describe, expect, it } from 'vitest';
import { STICKERS, createSolvedState } from '../../src/cube/state.js';
import { applySequence } from '../../src/cube/moves.js';
import { CORNERS, EDGES } from '../../src/cube/pieces.js';
import { generateScramble } from '../../src/cube/scramble.js';
import { validateState } from '../../src/cube/validate.js';

const solved = createSolvedState();

function withSwaps(state, ...pairs) {
  const next = [...state];
  for (const [a, b] of pairs) [next[a], next[b]] = [next[b], next[a]];
  return next;
}

const errorCodes = (state) => validateState(state).errors.map((error) => error.code);

/** Gira um canto no lugar, sem mudar a peça. */
function twistCorner(state, [a, b, c]) {
  const next = [...state];
  [next[a], next[b], next[c]] = [state[c], state[a], state[b]];
  return next;
}

describe('tabela de peças', () => {
  const position = (index) => String(STICKERS[index].position);

  it('cobre os 54 adesivos, menos os 6 centros, sem repetir', () => {
    const indices = [...CORNERS, ...EDGES].flat();
    expect(new Set(indices).size).toBe(48);
  });

  it('agrupa adesivos que estão na mesma peça física', () => {
    for (const indices of [...CORNERS, ...EDGES]) {
      expect(new Set(indices.map(position)).size).toBe(1);
    }
  });
});

describe('validação', () => {
  it('aceita o cubo resolvido', () => {
    expect(validateState(solved)).toEqual({ valid: true, errors: [] });
  });

  it('aceita 200 embaralhamentos aleatórios', () => {
    for (let i = 0; i < 200; i += 1) {
      expect(validateState(applySequence(solved, generateScramble())).errors).toEqual([]);
    }
  });

  it('rejeita um centro fora do lugar', () => {
    expect(errorCodes(withSwaps(solved, [4, 13]))).toEqual(['centers']);
  });

  it('informa as cores com contagem errada', () => {
    const state = [...solved];
    state[0] = 'D';
    const { errors } = validateState(state);
    expect(errors[0].code).toBe('counts');
    expect(errors[0].message).toContain('amarelo tem 8');
    expect(errors[0].message).toContain('branco tem 10');
  });

  it('aponta um canto impossível, com cores de faces opostas', () => {
    // Troca um adesivo amarelo do canto URF por um branco de DFR: o canto fica com amarelo e branco.
    const state = withSwaps(solved, [9, 29]);
    const { errors } = validateState(state);
    expect(errors.map((error) => error.code)).toContain('impossible-piece');
    expect(errors.flatMap((error) => error.stickers)).toEqual(expect.arrayContaining(CORNERS[0]));
  });

  it('aponta uma aresta impossível e menciona suas cores', () => {
    const state = withSwaps(solved, [10, 28]); // a aresta UR fica amarela e branca, faces opostas
    const { errors } = validateState(state);
    expect(errors[0].code).toBe('impossible-piece');
    expect(errors[0].message).toContain('aresta com as cores amarelo e branco');
  });

  it('aponta uma peça repetida, mesmo com a contagem de cores correta', () => {
    const state = [...solved];
    state[EDGES[3][1]] = 'R'; // UB vira uma segunda amarelo e laranja
    state[EDGES[4][1]] = 'B'; // DR vira uma segunda branco e azul
    const { errors } = validateState(state);
    expect(errors.map((error) => error.code)).toEqual(['duplicate-piece', 'duplicate-piece']);
  });

  it('detecta um canto girado', () => {
    expect(errorCodes(twistCorner(solved, CORNERS[0]))).toEqual(['corner-twist']);
  });

  it('detecta uma aresta invertida', () => {
    expect(errorCodes(withSwaps(solved, EDGES[0]))).toEqual(['edge-flip']);
  });

  it('detecta duas arestas trocadas (paridade)', () => {
    const state = withSwaps(solved, [EDGES[0][0], EDGES[1][0]], [EDGES[0][1], EDGES[1][1]]);
    expect(errorCodes(state)).toEqual(['parity']);
  });

  it('detecta dois cantos trocados (paridade)', () => {
    const state = withSwaps(
      solved,
      [CORNERS[0][0], CORNERS[1][0]],
      [CORNERS[0][1], CORNERS[1][1]],
      [CORNERS[0][2], CORNERS[1][2]],
    );
    expect(errorCodes(state)).toEqual(['parity']);
  });

  it('também detecta os mesmos defeitos em um cubo embaralhado', () => {
    const scrambled = applySequence(solved, "R U2 F' L D B2 U' R2 F L' D2 B");
    expect(errorCodes(withSwaps(scrambled, EDGES[4]))).toEqual(['edge-flip']);
    expect(errorCodes(twistCorner(scrambled, CORNERS[5]))).toEqual(['corner-twist']);
  });
});
