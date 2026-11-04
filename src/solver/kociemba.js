import { stateToString } from '../cube/state.js';
import { parseSequence } from '../cube/notation.js';

const pending = new Map();
let worker = null;
let nextId = 0;

function getWorker() {
  if (worker) return worker;
  worker = new Worker(new URL('./kociemba.worker.js', import.meta.url), { type: 'module' });

  worker.onmessage = ({ data: { id, solution, error } }) => {
    const { resolve, reject } = pending.get(id);
    pending.delete(id);
    if (error) reject(new Error(error));
    else resolve(parseSequence(solution));
  };

  worker.onerror = (event) => {
    for (const { reject } of pending.values()) reject(new Error(event.message));
    pending.clear();
    worker = null;
  };

  return worker;
}

/** Começa a montar as tabelas em segundo plano, para a primeira solução sair sem espera. */
export function preloadKociemba() {
  getWorker();
}

/** Devolve uma promessa com a lista de movimentos da solução mais curta encontrada. */
export function solveShortest(state) {
  return new Promise((resolve, reject) => {
    const id = nextId;
    nextId += 1;
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ id, stateText: stateToString(state) });
  });
}
