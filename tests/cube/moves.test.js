import { describe, expect, it } from 'vitest';
import { FACES, STICKER_COUNT, createSolvedState, isSolved, stateFromString, stateToString } from '../../src/cube/state.js';
import { applyMove, applySequence } from '../../src/cube/moves.js';
import { ALL_MOVES, invertSequence, parseSequence } from '../../src/cube/notation.js';

const solved = createSolvedState();

/** Os 9 adesivos de uma face, em texto, para comparar com o resultado esperado. */
const faceOf = (state, face) => state.slice(FACES.indexOf(face) * 9, FACES.indexOf(face) * 9 + 9).join('');

describe('estado resolvido', () => {
  it('tem 54 adesivos, 9 de cada face, na ordem URFDLB', () => {
    expect(solved).toHaveLength(STICKER_COUNT);
    expect(stateToString(solved)).toBe('UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB');
    expect(isSolved(solved)).toBe(true);
  });

  it('converte de e para texto', () => {
    expect(stateFromString(stateToString(solved))).toEqual(solved);
    expect(() => stateFromString('UUU')).toThrow();
  });
});

describe('movimentos', () => {
  it('não altera o estado recebido', () => {
    const before = [...solved];
    applyMove(solved, { face: 'R', turns: 1 });
    expect(solved).toEqual(before);
  });

  it.each(FACES)('%s muda o cubo e, repetido 4 vezes, volta ao início', (face) => {
    expect(isSolved(applyMove(solved, { face, turns: 1 }))).toBe(false);
    expect(isSolved(applySequence(solved, Array(4).fill({ face, turns: 1 })))).toBe(true);
  });

  it.each(FACES)('giro duplo e anti-horário de %s equivalem a 2 e 3 giros simples', (face) => {
    const quarter = { face, turns: 1 };
    expect(applyMove(solved, { face, turns: 2 })).toEqual(applySequence(solved, [quarter, quarter]));
    expect(applyMove(solved, { face, turns: 3 })).toEqual(applySequence(solved, [quarter, quarter, quarter]));
  });

  // Os resultados esperados seguem a definição padrão: giro horário olhando a face de fora.
  it('U leva a linha de cima de F para L, de L para B, de B para R e de R para F', () => {
    const state = applyMove(solved, { face: 'U', turns: 1 });
    expect(faceOf(state, 'L')).toBe('FFFLLLLLL');
    expect(faceOf(state, 'B')).toBe('LLLBBBBBB');
    expect(faceOf(state, 'R')).toBe('BBBRRRRRR');
    expect(faceOf(state, 'F')).toBe('RRRFFFFFF');
  });

  it('R leva a coluna direita de F para U, de U para B, de B para D e de D para F', () => {
    const state = applyMove(solved, { face: 'R', turns: 1 });
    expect(faceOf(state, 'U')).toBe('UUFUUFUUF');
    expect(faceOf(state, 'B')).toBe('UBBUBBUBB');
    expect(faceOf(state, 'D')).toBe('DDBDDBDDB');
    expect(faceOf(state, 'F')).toBe('FFDFFDFFD');
  });

  it('F leva adesivos de U para R, de R para D, de D para L e de L para U', () => {
    const state = applyMove(solved, { face: 'F', turns: 1 });
    expect(faceOf(state, 'R')).toBe('URRURRURR');
    expect(faceOf(state, 'D')).toBe('RRRDDDDDD');
    expect(faceOf(state, 'L')).toBe('LLDLLDLLD');
    expect(faceOf(state, 'U')).toBe('UUUUUULLL');
  });

  it('gira os adesivos da própria face no sentido horário', () => {
    const marked = [...solved];
    marked[0] = 'X';
    const state = applyMove(marked, { face: 'U', turns: 1 });
    expect(state[2]).toBe('X');
    expect(state[0]).toBe('U');
  });

  it('respeita a ordem conhecida de sequências clássicas', () => {
    expect(isSolved(applySequence(solved, "R U R' U' ".repeat(6)))).toBe(true);
    expect(isSolved(applySequence(solved, "R U R' U' ".repeat(5)))).toBe(false);
    expect(isSolved(applySequence(solved, "R U R' U R U2 R' ".repeat(6)))).toBe(true);
    expect(isSolved(applySequence(solved, 'R U '.repeat(105)))).toBe(true);
    expect(isSolved(applySequence(solved, 'R U '.repeat(35)))).toBe(false);
  });

  it('cada um dos 18 movimentos é desfeito pelo seu inverso', () => {
    for (const move of ALL_MOVES) {
      expect(isSolved(applySequence(solved, [move, ...invertSequence([move])]))).toBe(true);
    }
  });

  it('uma sequência seguida da sua inversa volta ao início', () => {
    const moves = parseSequence("R U2 F' L D B2 U' R2 F L' D2 B");
    expect(isSolved(applySequence(applySequence(solved, moves), invertSequence(moves)))).toBe(true);
  });

  it('mantém 9 adesivos de cada cor', () => {
    const state = applySequence(solved, "R U2 F' L D B2 U' R2 F L' D2 B");
    for (const face of FACES) {
      expect(state.filter((color) => color === face)).toHaveLength(9);
    }
  });
});
