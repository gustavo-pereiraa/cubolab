import { createTimer } from '../../stats/timer.js';
import { STAGE_LABELS } from '../../stats/metrics.js';
import { formatTime } from '../../stats/format.js';

const STAGE_NAMES = Object.values(STAGE_LABELS);

const IDLE_HINT = 'Segure a barra de espaço e solte para iniciar (ou toque e segure aqui)';
const HINTS = {
  holding: 'Continue segurando…',
  ready: 'Solte para iniciar',
};

/** Controles que respondem à barra de espaço por conta própria e não devem iniciar o cronômetro. */
const INTERACTIVE = 'button, input, select, textarea, a, summary';

/** Liga o cronômetro ao teclado, ao toque e à tela. Avisa cada resolução por onSolved({ totalMs, splits }). */
export function createTimerView({ panel, elements, onSolved }) {
  const { surface, display, hint, status, trackStages, markButton } = elements;
  const timer = createTimer();
  let frame = 0;
  let lastResultMs = 0;

  function runningHint() {
    if (!trackStages.checked) return 'Aperte a barra de espaço para parar';
    const stage = STAGE_NAMES[timer.getMarkCount()];
    return `${stage}: aperte M ao terminar a etapa`;
  }

  function render() {
    const state = timer.getState();
    surface.dataset.state = state;
    hint.textContent = state === 'running' ? runningHint() : (HINTS[state] ?? IDLE_HINT);
    markButton.hidden = !(state === 'running' && trackStages.checked);
    trackStages.disabled = state === 'running';
    display.textContent = formatTime(state === 'running' ? timer.getElapsed() : lastResultMs);
  }

  /** O relógio só é redesenhado enquanto algo está acontecendo. */
  function tick() {
    frame = 0;
    timer.update();
    render();
    if (timer.getState() !== 'idle') frame = requestAnimationFrame(tick);
  }

  function startTicking() {
    if (!frame) frame = requestAnimationFrame(tick);
    render();
  }

  function finish(result) {
    if (!result) return;
    lastResultMs = result.totalMs;
    status.textContent = `Tempo: ${formatTime(result.totalMs)}`;
    render();
    onSolved(result);
  }

  function press() {
    finish(timer.press());
    if (timer.getState() !== 'idle') {
      lastResultMs = 0;
      startTicking();
    }
  }

  function release() {
    const wasReady = timer.getState() === 'ready';
    timer.release({ withStages: trackStages.checked });
    if (wasReady) status.textContent = 'Cronômetro iniciado';
    startTicking();
  }

  function mark() {
    finish(timer.mark());
    render();
  }

  function cancel() {
    if (timer.getState() === 'idle') return;
    timer.cancel();
    lastResultMs = 0;
    status.textContent = 'Resolução cancelada';
    render();
  }

  const isActive = () => !panel.hidden;

  /** Fora de uma resolução, espaço em outro controle (uma caixa de seleção, por exemplo) é dele. */
  function belongsToAnotherControl(target) {
    return timer.getState() === 'idle' && target !== surface && target.closest?.(INTERACTIVE);
  }

  document.addEventListener('keydown', (event) => {
    if (!isActive()) return;
    if (event.code === 'Escape') {
      cancel();
    } else if (event.code === 'KeyM' && timer.getState() === 'running') {
      event.preventDefault();
      if (!event.repeat) mark();
    } else if (event.code === 'Space' && !belongsToAnotherControl(event.target)) {
      event.preventDefault(); // evita rolar a página
      if (!event.repeat) press();
    }
  });

  document.addEventListener('keyup', (event) => {
    if (!isActive() || event.code !== 'Space') return;
    if (belongsToAnotherControl(event.target) && !['holding', 'ready'].includes(timer.getState())) return;
    event.preventDefault();
    release();
  });

  surface.addEventListener('pointerdown', (event) => {
    surface.setPointerCapture(event.pointerId);
    press();
  });
  surface.addEventListener('pointerup', release);
  surface.addEventListener('pointercancel', () => {
    if (timer.getState() !== 'running') cancel();
  });
  surface.addEventListener('contextmenu', (event) => event.preventDefault()); // toque longo no celular

  markButton.addEventListener('click', mark);
  trackStages.addEventListener('change', render);

  // Se a janela perde o foco com a tecla segurada, o keyup nunca chega.
  window.addEventListener('blur', () => {
    if (timer.getState() !== 'running') cancel();
  });

  render();
}
