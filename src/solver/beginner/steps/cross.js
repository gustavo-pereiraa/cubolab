import { EDGES } from '../../../cube/pieces.js';
import { STICKERS } from '../../../cube/state.js';
import { applyMove } from '../../../cube/moves.js';
import { parseMove } from '../../../cube/notation.js';
import { ALGORITHMS } from '../algorithms.js';
import { SIDES, assertStep, topTurnsBetween } from '../simulator.js';

const WHITE = 'D';

/** Devolve as duas faces da posição onde está a aresta branca com a outra cor `side`. */
function findCrossEdge(state, side) {
  const indices = EDGES.find((pair) => {
    const colors = pair.map((index) => state[index]);
    return colors.includes(WHITE) && colors.includes(side);
  });
  return indices.map((index) => STICKERS[index].face);
}

/** Tira a aresta da camada do meio para o topo, sem desmontar o que já está na cruz. */
function liftFromMiddle(sim, side, faces) {
  const lift = faces
    .flatMap((face) => [face, `${face}'`])
    .find((text) => findCrossEdge(applyMove(sim.getState(), parseMove(text)), side).includes('U'));
  const undo = lift.endsWith("'") ? lift[0] : `${lift}'`;
  sim.run(`${lift} U ${undo}`);
}

function placeEdge(sim, side) {
  const isPlaced = () => sim.colorAt(WHITE, side) === WHITE && sim.colorAt(side, WHITE) === side;
  if (isPlaced()) return;

  let faces = findCrossEdge(sim.getState(), side);
  if (faces.includes('D')) {
    sim.run(`${faces.find((face) => face !== 'D')}2`);
  } else if (!faces.includes('U')) {
    liftFromMiddle(sim, side, faces);
  }

  faces = findCrossEdge(sim.getState(), side);
  sim.turnTop(topTurnsBetween(faces.find((face) => face !== 'U'), side));

  if (sim.colorAt('U', side) === WHITE) sim.run(`${side}2`);
  else sim.run(ALGORITHMS.crossFlippedEdge, side);

  assertStep(isPlaced(), `aresta branca de ${side} fora do lugar`);
}

export function solveCross(sim) {
  for (const side of SIDES) placeEdge(sim, side);
}
