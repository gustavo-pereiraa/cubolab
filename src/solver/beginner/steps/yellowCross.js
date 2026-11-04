import { ALGORITHMS } from '../algorithms.js';
import { SIDES, assertStep, leftOf, oppositeOf, rightOf } from '../simulator.js';

const YELLOW = 'U';
const MAX_APPLICATIONS = 3;

/** Escolhe a face da frente: o L fica atrás e à esquerda, e a linha fica na horizontal. */
function chooseFront(isYellow) {
  const line = SIDES.find((side) => isYellow(leftOf(side)) && isYellow(rightOf(side)));
  if (line) return line;
  return SIDES.find((side) => isYellow(oppositeOf(side)) && isYellow(leftOf(side))) ?? 'F';
}

export function solveYellowCross(sim) {
  const isYellow = (side) => sim.colorAt('U', side) === YELLOW;

  for (let i = 0; i < MAX_APPLICATIONS && !SIDES.every(isYellow); i += 1) {
    sim.run(ALGORITHMS.yellowCross, chooseFront(isYellow));
  }
  assertStep(SIDES.every(isYellow), 'cruz amarela incompleta');
}
