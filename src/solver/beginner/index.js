import { simplifyMoves } from '../../cube/notation.js';
import { STAGES } from './instructions.js';
import { createSimulator } from './simulator.js';
import { solveCross } from './steps/cross.js';
import { solveFirstLayer } from './steps/firstLayer.js';
import { solveSecondLayer } from './steps/secondLayer.js';
import { solveYellowCross } from './steps/yellowCross.js';
import { solveYellowFace } from './steps/yellowFace.js';
import { solveTopCorners } from './steps/topCorners.js';
import { solveTopEdges } from './steps/topEdges.js';

const STEP_SOLVERS = {
  cross: solveCross,
  firstLayer: solveFirstLayer,
  secondLayer: solveSecondLayer,
  yellowCross: solveYellowCross,
  yellowFace: solveYellowFace,
  topCorners: solveTopCorners,
  topEdges: solveTopEdges,
};

/**
 * Resolve o cubo pelo método de camadas, simulando cada etapa.
 * Devolve as 7 etapas na ordem, cada uma com título, instrução e seus movimentos.
 */
export function solveBeginner(state) {
  const sim = createSimulator(state);
  return STAGES.map((stage) => {
    STEP_SOLVERS[stage.id](sim);
    return { ...stage, moves: simplifyMoves(sim.takeMoves()) };
  });
}
