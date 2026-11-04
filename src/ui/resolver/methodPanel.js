import { STAGES } from '../../solver/beginner/instructions.js';
import { h } from '../dom.js';

const STATE_TEXT = { done: 'concluída', current: 'atual', pending: 'pendente' };

const byId = (id) => document.getElementById(id);

/** Coluna direita: seletor de método, lista das 7 etapas e comparação de movimentos. */
export function createMethodPanel({ onMethodChange }) {
  const radios = [...document.querySelectorAll('input[name="method"]')];
  const stagesCard = byId('stages-card');
  const stagesNote = byId('stages-note');
  const summary = byId('compare-summary');
  const rows = {
    beginner: { value: byId('beginner-count'), bar: byId('beginner-bar') },
    shortest: { value: byId('shortest-count'), bar: byId('shortest-bar') },
  };

  const items = STAGES.map((stage, position) => {
    const mark = h('span', { className: 'stage__mark', 'aria-hidden': 'true' }, String(position + 1));
    const state = h('span', { className: 'sr-only' });
    const count = h('span', { className: 'stage__count' });
    const item = h('li', { className: 'stage' }, mark, h('span', { className: 'stage__title' }, stage.title), state, count);
    byId('stage-list').append(item);
    return { item, mark, state, count, position };
  });

  const getMethod = () => radios.find((radio) => radio.checked).value;

  function renderMethod() {
    const method = getMethod();
    const isBeginner = method === 'beginner';
    stagesCard.classList.toggle('is-inactive', !isBeginner);
    stagesNote.hidden = isBeginner;
    for (const [name, { bar }] of Object.entries(rows)) bar.classList.toggle('is-selected', name === method);
  }

  for (const radio of radios) {
    radio.addEventListener('change', () => {
      renderMethod();
      onMethodChange(getMethod());
    });
  }

  renderMethod();

  return {
    getMethod,

    selectMethod(method) {
      radios.find((radio) => radio.value === method).checked = true;
      renderMethod();
    },

    disableMethod(method) {
      radios.find((radio) => radio.value === method).disabled = true;
    },

    /** Atualiza a lista de etapas conforme o avanço; sem etapas carregadas, mantém os contadores. */
    setProgress(stages, index) {
      for (const { item, mark, state, position } of items) {
        const stage = stages?.[position];
        let status = 'pending';
        if (stage) {
          if (stage.end <= index) status = 'done';
          else if (stage.start <= index) status = 'current';
        }
        item.dataset.state = status;
        state.textContent = `, ${STATE_TEXT[status]}`;
        mark.textContent = status === 'done' ? '✓' : String(position + 1);
        if (status === 'current') item.setAttribute('aria-current', 'step');
        else item.removeAttribute('aria-current');
      }
    },

    /** Mostra quantos movimentos cada etapa do método iniciante leva. */
    setStageCounts(stages) {
      for (const { count, position } of items) {
        count.textContent = stages ? String(stages[position].moves.length) : '';
      }
    },

    /** Compara os métodos em barras; um valor null significa que ainda não há solução. */
    setCounts({ beginner, shortest }) {
      const counts = { beginner, shortest };
      const max = Math.max(beginner ?? 0, shortest ?? 0);
      for (const [name, { value, bar }] of Object.entries(rows)) {
        value.textContent = counts[name] === null ? '–' : String(counts[name]);
        bar.style.width = counts[name] && max ? `${(counts[name] / max) * 100}%` : '0';
      }
      const saved = beginner !== null && shortest !== null ? beginner - shortest : 0;
      summary.textContent =
        saved > 0
          ? `A solução mais curta usa ${saved} movimentos a menos, mas o método iniciante é o que dá para memorizar.`
          : 'Movimentos para o embaralhamento atual.';
    },
  };
}
