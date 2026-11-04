import { ALGORITHMS } from '../algorithms.js';
import { SIDES, assertStep, leftOf, oppositeOf, rightOf, topTurnsBetween } from '../simulator.js';

const MAX_APPLICATIONS = 4;

/** Um lado com os dois cantos da mesma cor ("faróis") indica cantos já certos entre si. */
const hasHeadlights = (sim, side) => sim.colorAt(side, 'U', leftOf(side)) === sim.colorAt(side, 'U', rightOf(side));

export function solveTopCorners(sim) {
  const allMatched = () => SIDES.every((side) => hasHeadlights(sim, side));

  for (let i = 0; i < MAX_APPLICATIONS && !allMatched(); i += 1) {
    // Com os faróis atrás, o ciclo troca os outros três cantos; sem faróis, qualquer lado serve.
    const headlights = SIDES.find((side) => hasHeadlights(sim, side));
    sim.run(ALGORITHMS.topCorners, headlights ? oppositeOf(headlights) : 'F');
  }
  assertStep(allMatched(), 'cantos do topo fora do lugar');

  // Com os cantos certos entre si, um giro do topo os alinha aos centros.
  sim.turnTop(topTurnsBetween('F', sim.colorAt('F', 'U', 'R')));
  assertStep(sim.colorAt('F', 'U', 'R') === 'F', 'cantos do topo desalinhados');
}
