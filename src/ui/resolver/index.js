import { createSolvedState } from '../../cube/state.js';
import { applySequence } from '../../cube/moves.js';
import { generateScramble } from '../../cube/scramble.js';
import { validateState } from '../../cube/validate.js';
import { solveBeginner } from '../../solver/beginner/index.js';
import { preloadKociemba, solveShortest } from '../../solver/kociemba.js';
import { createCubeView } from '../../three/scene.js';
import { h } from '../dom.js';
import { createMethodPanel } from './methodPanel.js';
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
  const solveLabel = solveButton.textContent;
  let requestId = 0;
  let solution = null; // { state, stages, shortest } do cubo atual

  const panel = createMethodPanel({
    onMethodChange() {
      if (solution) loadSelectedSolution();
    },
  });

  const view = createViewOrFallback(byId('cube-view'));
  const player = createPlayer({
    view,
    elements: {
      title: byId('step-title'),
      instruction: byId('step-instruction'),
      moveDetail: byId('step-move'),
      chips: byId('move-chips'),
      previous: byId('player-previous'),
      playPause: byId('player-play'),
      next: byId('player-next'),
      speed: byId('player-speed'),
      speedOutput: byId('player-speed-output'),
    },
    onProgress: (stages, index) => panel.setProgress(stages, index),
  });

  function loadSelectedSolution() {
    const { state, stages, shortest } = solution;
    if (panel.getMethod() === 'beginner') {
      player.load(state, { moves: stages.flatMap((stage) => stage.moves), stages });
    } else {
      player.load(state, { moves: shortest, stages: null });
    }
  }

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

  function setBusy(isBusy) {
    solveButton.disabled = isBusy;
    solveButton.setAttribute('aria-busy', String(isBusy));
    solveButton.textContent = isBusy ? 'Calculando…' : solveLabel;
  }

  /** Qualquer mudança nas cores invalida a solução anterior, inclusive uma ainda em cálculo. */
  function resetSolution() {
    requestId += 1;
    solution = null;
    setBusy(false);
    clearFeedback();
    player.clear();
    panel.setStageCounts(null);
    panel.setCounts({ beginner: null, shortest: null });
  }

  /** Se a solução mais curta falhar, o método iniciante continua disponível. */
  function handleShortestFailure() {
    panel.disableMethod('shortest');
    panel.selectMethod('beginner');
    showErrors([{ message: 'Não foi possível calcular a solução mais curta. Recarregue a página para tentar de novo.' }]);
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
    const stages = solveBeginner(state);

    let shortest = null;
    try {
      shortest = await solveShortest(state);
    } catch {
      if (request === requestId) handleShortestFailure();
    }
    if (request !== requestId) return;

    solution = { state, stages, shortest };
    panel.setStageCounts(stages);
    panel.setCounts({
      beginner: stages.reduce((total, stage) => total + stage.moves.length, 0),
      shortest: shortest?.length ?? null,
    });
    loadSelectedSolution();
    setBusy(false);
  });

  view.setState(editor.getState());
  preloadKociemba();
}
