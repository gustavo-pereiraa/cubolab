import { ALGORITHMS } from '../algorithms.js';
import { SIDES, assertStep, leftOf, rightOf } from '../simulator.js';

const YELLOW = 'U';
const MAX_APPLICATIONS = 8;

/**
 * Regra clássica, olhando o canto da frente à esquerda:
 * com 1 canto amarelo em cima, ele fica nessa posição; com 0, o amarelo desse canto
 * aponta para a esquerda; com 2, o amarelo desse canto aponta para a frente.
 */
function chooseFront(sim, yellowOnTop) {
  const frontLeftHasYellow = {
    0: (side) => sim.colorAt(leftOf(side), 'U', side) === YELLOW,
    1: (side) => sim.colorAt('U', side, leftOf(side)) === YELLOW,
    2: (side) => sim.colorAt(side, 'U', leftOf(side)) === YELLOW,
  }[yellowOnTop];
  return SIDES.find(frontLeftHasYellow) ?? 'F';
}

export function solveYellowFace(sim) {
  const yellowCorners = () => SIDES.filter((side) => sim.colorAt('U', side, rightOf(side)) === YELLOW).length;

  for (let i = 0; i < MAX_APPLICATIONS && yellowCorners() < 4; i += 1) {
    sim.run(ALGORITHMS.yellowCorners, chooseFront(sim, yellowCorners()));
  }
  assertStep(yellowCorners() === 4, 'face amarela incompleta');
}
