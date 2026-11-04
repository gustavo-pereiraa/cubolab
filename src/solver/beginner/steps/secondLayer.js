import { ALGORITHMS } from '../algorithms.js';
import { SIDES, assertStep, rightOf, topTurnsBetween } from '../simulator.js';

const YELLOW = 'U';
const MAX_INSERTIONS = 12;

const isEdgePlaced = (sim, side) =>
  sim.colorAt(side, rightOf(side)) === side && sim.colorAt(rightOf(side), side) === rightOf(side);

/** Procura no topo uma aresta sem amarelo, que pertence à segunda camada. */
const findTopEdge = (sim) =>
  SIDES.find((side) => sim.colorAt('U', side) !== YELLOW && sim.colorAt(side, 'U') !== YELLOW);

export function solveSecondLayer(sim) {
  for (let i = 0; i < MAX_INSERTIONS; i += 1) {
    const unsolved = SIDES.find((side) => !isEdgePlaced(sim, side));
    if (!unsolved) return;

    const topSide = findTopEdge(sim);
    if (topSide) {
      const front = sim.colorAt(topSide, 'U');
      const target = sim.colorAt('U', topSide);
      sim.turnTop(topTurnsBetween(topSide, front));
      const algorithm = target === rightOf(front) ? ALGORITHMS.secondLayerRight : ALGORITHMS.secondLayerLeft;
      sim.run(algorithm, front);
    } else {
      // Nenhuma no topo: a aresta está presa no lugar errado. Inserir outra ali a libera.
      sim.run(ALGORITHMS.secondLayerRight, unsolved);
    }
  }
  assertStep(SIDES.every((side) => isEdgePlaced(sim, side)), 'segunda camada incompleta');
}
