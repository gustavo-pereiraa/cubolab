import { formatDelta, formatTime } from '../../stats/format.js';

const byId = (id) => document.getElementById(id);

/** Tempo menor é melhor: descer é uma boa notícia. A seta acompanha a cor, que nunca vem sozinha. */
function renderChange(element, { value, change, required, solveCount }) {
  element.classList.remove('is-better', 'is-worse');

  if (value === null && required) {
    const missing = required - solveCount;
    element.textContent = missing === 1 ? 'Falta 1 resolução' : `Faltam ${missing} resoluções`;
  } else if (change === null) {
    element.textContent = 'Sem dados da semana anterior';
  } else if (change === 0) {
    element.textContent = 'Igual à semana anterior';
  } else {
    element.textContent = `${change < 0 ? '▼' : '▲'} ${formatDelta(change)} desde a semana anterior`;
    element.classList.add(change < 0 ? 'is-better' : 'is-worse');
  }
}

export function renderStatCards(summary) {
  const solveCount = summary.total.value;
  const cards = [
    ['stat-ao5', summary.ao5, 5],
    ['stat-ao12', summary.ao12, 12],
    ['stat-best', summary.best, 1],
  ];

  for (const [id, { value, change }, required] of cards) {
    byId(id).textContent = formatTime(value);
    renderChange(byId(`${id}-change`), { value, change, required, solveCount });
  }

  const { value, thisWeek, lastWeek } = summary.total;
  byId('stat-total').textContent = String(value);
  byId('stat-total-change').textContent = `${thisWeek} nesta semana · ${lastWeek} na anterior`;
}
