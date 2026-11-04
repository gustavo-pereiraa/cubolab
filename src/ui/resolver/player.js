import { applyMove } from '../../cube/moves.js';
import { describeMove } from '../../cube/describe.js';
import { displayMove, invertMove } from '../../cube/notation.js';
import { h } from '../dom.js';

const BASE_MOVE_MS = 550;
const BASE_GAP_MS = 130;
const EMPTY_TITLE = 'Nenhuma solução ainda';
const EMPTY_HINT = 'Pinte as cores ou clique em Embaralhar e depois em Resolver meu cubo.';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Calcula onde cada etapa começa e termina na lista completa de movimentos. */
function withRanges(stages) {
  let start = 0;
  return stages.map((stage) => {
    const range = { ...stage, start, end: start + stage.moves.length };
    start = range.end;
    return range;
  });
}

/** Player da solução: controla qual movimento é o atual e mantém o cubo 3D, os chips e os textos em dia. */
export function createPlayer({ view, elements, onProgress }) {
  const { title, instruction, moveDetail, chips, previous, playPause, next, speed, speedOutput } = elements;
  let moves = [];
  let stages = null; // lista de etapas com início e fim, ou null em uma solução sem etapas
  let states = []; // states[i] é o cubo depois de i movimentos
  let index = 0;
  let isPlaying = false;
  let runId = 0;
  let chipItems = [];

  const speedFactor = () => Number(speed.value);

  function scrollCurrentChipIntoView() {
    const current = chipItems[index];
    if (!current) return;
    const top = current.offsetTop;
    if (top < chips.scrollTop || top + current.offsetHeight > chips.scrollTop + chips.clientHeight) {
      chips.scrollTop = top - chips.clientHeight / 2;
    }
  }

  function setText(titleText, instructionText, detailText = '') {
    title.textContent = titleText;
    instruction.textContent = instructionText;
    moveDetail.textContent = detailText;
    moveDetail.hidden = !detailText;
  }

  function renderText() {
    const isFinished = moves.length > 0 && index === moves.length;
    title.classList.toggle('is-done', isFinished || states.length === 1);

    if (states.length === 0) {
      setText(EMPTY_TITLE, EMPTY_HINT);
    } else if (moves.length === 0) {
      setText('Este cubo já está resolvido', 'Clique em Embaralhar ou pinte outras cores para tentar de novo.');
    } else if (isFinished) {
      setText('Cubo resolvido!', `Foram ${moves.length} movimentos. Aperte play para ver de novo.`);
    } else if (stages) {
      const position = stages.findIndex((stage) => index >= stage.start && index < stage.end);
      const stage = stages[position];
      setText(
        `Passo ${position + 1} de ${stages.length} · ${stage.title}`,
        stage.instruction,
        `Movimento ${index + 1} de ${moves.length}: ${describeMove(moves[index])}`,
      );
    } else {
      setText(`Movimento ${index + 1} de ${moves.length}`, describeMove(moves[index]));
    }
  }

  function render() {
    renderText();
    chipItems.forEach((item, i) => {
      item.classList.toggle('is-done', i < index);
      item.classList.toggle('is-current', i === index);
      if (i === index) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
    scrollCurrentChipIntoView();

    previous.disabled = index === 0;
    next.disabled = index >= moves.length;
    playPause.disabled = moves.length === 0;
    playPause.setAttribute('aria-label', isPlaying ? 'Pausar' : 'Reproduzir');
    playPause.classList.toggle('is-playing', isPlaying);
    onProgress(stages, index);
  }

  function advance(direction) {
    const move = direction > 0 ? moves[index] : invertMove(moves[index - 1]);
    index += direction;
    render();
    return view.animateMove(move, states[index], BASE_MOVE_MS / speedFactor());
  }

  function pause() {
    runId += 1;
    isPlaying = false;
  }

  async function play() {
    if (index === moves.length) {
      index = 0;
      view.setState(states[0]);
    }
    runId += 1;
    const run = runId;
    isPlaying = true;
    render();
    while (run === runId && index < moves.length) {
      await advance(1);
      if (run === runId && index < moves.length) await delay(BASE_GAP_MS / speedFactor());
    }
    if (run === runId) {
      isPlaying = false;
      render();
    }
  }

  function manualStep(direction) {
    pause();
    advance(direction);
  }

  previous.addEventListener('click', () => manualStep(-1));
  next.addEventListener('click', () => manualStep(1));
  playPause.addEventListener('click', () => {
    if (isPlaying) {
      pause();
      render();
    } else {
      play();
    }
  });

  speed.addEventListener('input', () => {
    speedOutput.textContent = `${speedFactor().toLocaleString('pt-BR')}×`;
  });

  function renderChips() {
    chipItems = moves.map((move) => h('li', { className: 'chip' }, displayMove(move)));
    const items = stages
      ? stages.flatMap((stage, position) =>
          stage.moves.length === 0
            ? []
            : [
                h('li', { className: 'chips__stage' }, `${position + 1}. ${stage.title}`),
                ...chipItems.slice(stage.start, stage.end),
              ],
        )
      : chipItems;
    chips.replaceChildren(...items);
    chips.scrollTop = 0;
  }

  /** Carrega uma solução: `plan` traz os movimentos e, no método por etapas, a lista `stages`. */
  function load(startState, plan) {
    pause();
    moves = plan.moves;
    stages = plan.stages ? withRanges(plan.stages) : null;
    states = [startState];
    for (const move of moves) states.push(applyMove(states.at(-1), move));
    index = 0;
    renderChips();
    view.setState(startState);
    render();
  }

  function clear() {
    pause();
    moves = [];
    stages = null;
    states = [];
    index = 0;
    chipItems = [];
    chips.replaceChildren();
    render();
  }

  render();

  return { load, clear };
}
