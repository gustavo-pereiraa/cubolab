import { CORNERS } from '../../../cube/pieces.js';
import { STICKERS } from '../../../cube/state.js';
import { ALGORITHMS } from '../algorithms.js';
import { SIDES, assertStep, rightOf, topTurnsBetween } from '../simulator.js';

const WHITE = 'D';
const MAX_INSERTIONS = 6;

/** Devolve as faces da posição onde está o canto branco com as cores `front` e `right`. */
function findCorner(state, front, right) {
  const indices = CORNERS.find((corner) => {
    const colors = corner.map((index) => state[index]);
    return [WHITE, front, right].every((color) => colors.includes(color));
  });
  return indices.map((index) => STICKERS[index].face);
}

/** A lateral que faz o papel de frente para um canto: a outra lateral fica à sua direita. */
const frontOfCorner = (faces) => SIDES.find((side) => faces.includes(side) && faces.includes(rightOf(side)));

function placeCorner(sim, front) {
  const right = rightOf(front);
  const isPlaced = () =>
    sim.colorAt(WHITE, front, right) === WHITE &&
    sim.colorAt(front, WHITE, right) === front &&
    sim.colorAt(right, WHITE, front) === right;
  if (isPlaced()) return;

  let faces = findCorner(sim.getState(), front, right);
  if (faces.includes('D')) {
    sim.run(ALGORITHMS.liftCorner, frontOfCorner(faces));
    faces = findCorner(sim.getState(), front, right);
  }
  sim.turnTop(topTurnsBetween(frontOfCorner(faces), front));

  for (let i = 0; i < MAX_INSERTIONS && !isPlaced(); i += 1) {
    sim.run(ALGORITHMS.insertCorner, front);
  }
  assertStep(isPlaced(), `canto branco de ${front} fora do lugar`);
}

export function solveFirstLayer(sim) {
  for (const side of SIDES) placeCorner(sim, side);
}
