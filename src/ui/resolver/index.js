import { createSolvedState } from '../../cube/state.js';
import { applySequence } from '../../cube/moves.js';
import { generateScramble } from '../../cube/scramble.js';
import { validateState } from '../../cube/validate.js';
import { preloadKociemba, solveShortest } from '../../solver/kociemba.js';
import { createCubeView } from '../../three/scene.js';
import { h } from '../dom.js';
import { createNetEditor } from './netEditor.js';
import { createPlayer } from './player.js';

const byId = (id) => document.getElementById(id);
const MAX_ERRORS_SHOWN = 3;

/** Sem WebGL, o cubo 3D some, mas a sequência de movimentos continua funcionando. */
function createViewOrFallback(container) {
  try {
    return createCubeView(container, {
      label: 'Cubo mágico em 3D. Arraste para girar a visão.',
    });
  } catch {
    container.append(
      h('p', { className: 'cube-view__fallback' }, 'Não foi possível abrir o cubo 3D neste navegador. Siga os movimentos abaixo.'),
    );
    return { setState() {}, animateMove: () => Promise.resolve() };
  }
}

export function initResolver() {
  const solveButton = byId('solve-button');
  const scrambleButton = byId('scramble-button');
  const feedback = byId('solve-feedback');
  const shortestCount = byId('shortest-count');
  const shortestBar = byId('shortest-bar');
  const solveLabel = solveButton.textContent;
  let requestId = 0;

  const view = createViewOrFallback(byId('cube-view'));
  const player = createPlayer({
    view,
    elements: {
      title: byId('step-title'),
      instruction: byId('step-instruction'),
      chips: byId('move-chips'),
      previous: byId('player-previous'),
      playPause: byId('player-play'),
      next: byId('player-next'),
      speed: byId('player-speed'),
      speedOutput: byId('player-speed-output'),
    },
  });

  function showErrors(errors) {
    const items = errors.slice(0, MAX_ERRORS_SHOWN).map((error) => h('li', {}, error.message));
    const hidden = errors.length - items.length;
    if (hidden > 0) items.push(h('li', {}, `E mais ${hidden} ${hidden === 1 ? 'problema' : 'problemas'}.`));
    feedback.replaceChildren(h('ul', {}, ...items));
    feedback.hidden = false;
  }

  function clearFeedback() {
    feedback.replaceChildren();
    feedback.hidden = true;
  }

  function showShortestCount(count) {
    shortestCount.textContent = count === null ? '–' : String(count);
    shortestBar.style.width = count === null ? '0' : '100%';
  }

  function setBusy(isBusy) {
    solveButton.disabled = isBusy;
    solveButton.setAttribute('aria-busy', String(isBusy));
    solveButton.textContent = isBusy ? 'Calculando…' : solveLabel;
  }

  /** Qualquer mudança nas cores invalida a solução anterior, inclusive uma ainda em cálculo. */
  function resetSolution() {
    requestId += 1;
    setBusy(false);
    clearFeedback();
    player.clear();
    showShortestCount(null);
  }

  const editor = createNetEditor({
    netRoot: byId('net'),
    paletteRoot: byId('palette'),
    onChange(state) {
      resetSolution();
      editor.highlight([]);
      view.setState(state);
    },
  });

  scrambleButton.addEventListener('click', () => {
    resetSolution();
    const state = applySequence(createSolvedState(), generateScramble());
    editor.setState(state);
    view.setState(state);
  });

  solveButton.addEventListener('click', async () => {
    const state = editor.getState();
    const { valid, errors } = validateState(state);
    clearFeedback();
    editor.highlight(errors.flatMap((error) => error.stickers));
    if (!valid) {
      showErrors(errors);
      return;
    }

    requestId += 1;
    const request = requestId;
    setBusy(true);
    try {
      const moves = await solveShortest(state);
      if (request !== requestId) return;
      player.load(state, moves);
      showShortestCount(moves.length);
    } catch {
      if (request !== requestId) return;
      showErrors([{ message: 'Não foi possível calcular a solução. Recarregue a página e tente de novo.' }]);
    } finally {
      if (request === requestId) setBusy(false);
    }
  });

  view.setState(editor.getState());
  preloadKociemba();
}
