import { ALGORITHMS } from '../algorithms.js';
import { SIDES, assertStep, oppositeOf } from '../simulator.js';

const MAX_APPLICATIONS = 4;

export function solveTopEdges(sim) {
  const isPlaced = (side) => sim.colorAt(side, 'U') === side;

  for (let i = 0; i < MAX_APPLICATIONS && !SIDES.every(isPlaced); i += 1) {
    // Com a aresta certa atrás, o ciclo troca as outras três; sem nenhuma certa, qualquer lado serve.
    const placed = SIDES.find(isPlaced);
    sim.run(ALGORITHMS.topEdges, placed ? oppositeOf(placed) : 'F');
  }
  assertStep(SIDES.every(isPlaced), 'arestas do topo fora do lugar');
}
