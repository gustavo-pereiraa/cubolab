import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { FACE_NORMALS, STICKERS } from '../../src/cube/state.js';
import { applyMove } from '../../src/cube/moves.js';
import { ALL_MOVES, formatMove } from '../../src/cube/notation.js';
import { angleOf } from '../../src/three/animator.js';

const toRounded = (vector) => vector.toArray().map((value) => Math.round(value) + 0);

describe('animação do cubo 3D', () => {
  it.each(ALL_MOVES.map((move) => [formatMove(move), move]))('o giro de %s leva cada adesivo aonde o modelo diz', (_, move) => {
    const axis = new Vector3(...FACE_NORMALS[move.face]);
    const angle = angleOf(move.turns);
    const moved = applyMove(STICKERS.map((_, index) => index), move);

    moved.forEach((source, target) => {
      if (source === target) return;
      const { position, normal } = STICKERS[source];
      expect(toRounded(new Vector3(...position).applyAxisAngle(axis, angle))).toEqual(STICKERS[target].position);
      expect(toRounded(new Vector3(...normal).applyAxisAngle(axis, angle))).toEqual(STICKERS[target].normal);
    });
  });
});
