import { initKociemba, solveKociemba } from './kociemba.core.js';

initKociemba();

self.onmessage = ({ data: { id, stateText } }) => {
  try {
    self.postMessage({ id, solution: solveKociemba(stateText) });
  } catch (error) {
    self.postMessage({ id, error: error.message });
  }
};
