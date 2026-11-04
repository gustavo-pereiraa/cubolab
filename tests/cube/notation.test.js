import { describe, expect, it } from 'vitest';
import {
  ALL_MOVES,
  displayMove,
  formatMove,
  formatSequence,
  invertMove,
  invertSequence,
  parseMove,
  parseSequence,
} from '../../src/cube/notation.js';

describe('notação', () => {
  it('interpreta as três formas de movimento', () => {
    expect(parseMove('R')).toEqual({ face: 'R', turns: 1 });
    expect(parseMove('R2')).toEqual({ face: 'R', turns: 2 });
    expect(parseMove("R'")).toEqual({ face: 'R', turns: 3 });
    expect(parseMove('R′')).toEqual({ face: 'R', turns: 3 });
  });

  it.each(['', 'X', 'r', "R2'", 'R3', 'RU'])('rejeita "%s"', (text) => {
    expect(() => parseMove(text)).toThrow('Movimento inválido');
  });

  it('formata para a biblioteca e para a interface', () => {
    expect(formatMove({ face: 'F', turns: 3 })).toBe("F'");
    expect(displayMove({ face: 'F', turns: 3 })).toBe('F′');
    expect(displayMove({ face: 'F', turns: 2 })).toBe('F2');
  });

  it('interpreta e formata sequências, ignorando espaços extras', () => {
    expect(formatSequence(parseSequence("  R U'   F2 "))).toBe("R U' F2");
    expect(parseSequence('')).toEqual([]);
  });

  it('inverte movimentos e sequências', () => {
    expect(invertMove({ face: 'U', turns: 1 })).toEqual({ face: 'U', turns: 3 });
    expect(invertMove({ face: 'U', turns: 2 })).toEqual({ face: 'U', turns: 2 });
    expect(formatSequence(invertSequence(parseSequence("R U' F2")))).toBe("F2 U R'");
  });

  it('lista os 18 movimentos possíveis', () => {
    expect(ALL_MOVES).toHaveLength(18);
  });
});
