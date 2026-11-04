import { stageBreakdown } from '../../stats/metrics.js';
import { formatTime } from '../../stats/format.js';
import { h } from '../dom.js';

const EMPTY_TEXT = 'Ative “Marcar etapas” no cronômetro para descobrir qual etapa leva mais tempo.';

/** Barras horizontais do tempo médio por etapa, com a mais lenta em laranja e identificada por texto. */
export function renderStageBars(root, solves) {
  const breakdown = stageBreakdown(solves);
  if (!breakdown) {
    root.replaceChildren(h('p', { className: 'empty-note' }, EMPTY_TEXT));
    return;
  }

  const longest = Math.max(...breakdown.stages.map((stage) => stage.averageMs));
  const rows = breakdown.stages.map((stage) => {
    const isSlowest = stage.id === breakdown.slowestId;
    const bar = h('div', { className: `stage-bar__fill${isSlowest ? ' is-slowest' : ''}` });
    bar.style.width = `${longest > 0 ? (stage.averageMs / longest) * 100 : 0}%`;

    return h(
      'li',
      { className: 'stage-bar' },
      h(
        'span',
        { className: 'stage-bar__label' },
        stage.label,
        ...(isSlowest ? [h('span', { className: 'stage-bar__tag' }, ' · mais lenta')] : []),
      ),
      h('span', { className: 'stage-bar__value' }, `${formatTime(stage.averageMs)}s · ${Math.round(stage.share * 100)}%`),
      h('div', { className: 'stage-bar__track' }, bar),
    );
  });

  const count = breakdown.solveCount;
  root.replaceChildren(
    h('p', { className: 'stage-tip' }, breakdown.tip),
    h('ul', { className: 'stage-bars' }, ...rows),
    h('p', { className: 'card__placeholder' }, `Média de ${count} ${count === 1 ? 'resolução' : 'resoluções'} com etapas marcadas.`),
  );
}
