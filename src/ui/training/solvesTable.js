import { formatDate, formatSolve, formatTime } from '../../stats/format.js';
import { h } from '../dom.js';

const MAX_ROWS = 20;

function formatSplits(splits) {
  if (!splits) return '–';
  return [splits.cross, splits.firstLayer, splits.secondLayer, splits.lastLayer].map(formatTime).join(' · ');
}

const TRASH_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6l1 2h4v2H4V5h4zM6 9h12l-1 12H7zm4 2v8h1.5v-8zm2.5 0v8H14v-8z" /></svg>';

/** Tabela das últimas resoluções, da mais recente para a mais antiga. */
export function renderSolvesTable({ body, emptyNote, countNote, exportButton }, solves, onDelete) {
  const recent = solves.slice(-MAX_ROWS).reverse();

  body.replaceChildren(
    ...recent.map((solve) => {
      const label = `Excluir a resolução de ${formatSolve(solve)} feita em ${formatDate(solve.date)}`;
      const remove = h('button', { type: 'button', className: 'btn btn--secondary btn--icon', title: 'Excluir', 'aria-label': label });
      remove.innerHTML = TRASH_ICON;
      remove.addEventListener('click', () => {
        if (confirm(`${label}?`)) onDelete(solve.id);
      });

      return h(
        'tr',
        {},
        h('td', { className: 'mono solves-table__time' }, formatSolve(solve)),
        h('td', { className: 'mono' }, formatSplits(solve.splits)),
        h('td', {}, formatDate(solve.date)),
        h('td', { className: 'solves-table__action' }, remove),
      );
    }),
  );

  body.closest('.table-scroll').hidden = solves.length === 0;
  emptyNote.hidden = solves.length > 0;
  exportButton.disabled = solves.length === 0;
  countNote.hidden = solves.length <= MAX_ROWS;
  countNote.textContent = `Mostrando as ${MAX_ROWS} mais recentes de ${solves.length}. O CSV traz todas.`;
}
