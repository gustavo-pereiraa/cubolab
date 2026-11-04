import { displayMove, formatSequence } from '../../cube/notation.js';
import { generateScramble } from '../../cube/scramble.js';
import { solvesToCsv } from '../../stats/csv.js';
import { formatSolve } from '../../stats/format.js';
import { summarize } from '../../stats/metrics.js';
import { generateSampleSolves, isSampleSolve } from '../../stats/sampleData.js';
import { createSolveStore } from '../../stats/storage.js';
import { createEvolutionChart } from './evolutionChart.js';
import { renderSolvesTable } from './solvesTable.js';
import { renderStageBars } from './stageBars.js';
import { renderStatCards } from './statCards.js';
import { createTimerView } from './timerView.js';

const byId = (id) => document.getElementById(id);

function downloadCsv(solves) {
  const url = URL.createObjectURL(new Blob([solvesToCsv(solves)], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `cubolab-resolucoes-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function initTraining() {
  const panel = byId('panel-treino');
  const store = createSolveStore();
  const evolution = createEvolutionChart({
    canvas: byId('evolution-chart'),
    box: byId('evolution-box'),
    emptyNote: byId('evolution-empty'),
    rangeGroup: byId('evolution-range'),
  });
  const exportButton = byId('export-csv');
  const lastSolve = byId('last-solve');
  const plusTwo = byId('penalty-plus2');
  const dnf = byId('penalty-dnf');
  let scramble = [];
  let lastSolveId = null;

  function newScramble() {
    scramble = generateScramble();
    byId('timer-scramble').textContent = scramble.map(displayMove).join(' ');
  }

  function renderLastSolve() {
    const solve = store.getAll().find(({ id }) => id === lastSolveId);
    lastSolve.hidden = !solve;
    if (!solve) return;
    byId('last-solve-time').textContent = formatSolve(solve);
    plusTwo.setAttribute('aria-pressed', String(solve.penalty === '+2'));
    dnf.setAttribute('aria-pressed', String(solve.penalty === 'DNF'));
  }

  function render() {
    const solves = store.getAll();
    renderStatCards(summarize(solves));
    evolution.update(solves);
    renderStageBars(byId('stage-bars'), solves);
    renderSolvesTable(
      { body: byId('solves-body'), emptyNote: byId('solves-empty'), countNote: byId('solves-count'), exportButton },
      solves,
      (id) => {
        store.remove(id);
        render();
      },
    );
    renderLastSolve();
    renderSampleBanner();
    byId('storage-warning').hidden = store.isPersistent();
  }

  /** Sem histórico, oferece dados de exemplo; com exemplos carregados, deixa claro que são fictícios. */
  function renderSampleBanner() {
    const solves = store.getAll();
    const hasSamples = solves.some(isSampleSolve);
    byId('sample-banner').hidden = solves.length > 0 && !hasSamples;
    byId('sample-text').textContent = hasSamples
      ? 'Você está vendo dados de exemplo, que não são resoluções reais.'
      : 'Ainda não há resoluções. Quer ver como as estatísticas ficam com um histórico?';
    byId('sample-load').hidden = hasSamples;
    byId('sample-remove').hidden = !hasSamples;
  }

  function togglePenalty(penalty) {
    const solve = store.getAll().find(({ id }) => id === lastSolveId);
    store.setPenalty(lastSolveId, solve.penalty === penalty ? null : penalty);
    render();
  }

  createTimerView({
    panel,
    elements: {
      surface: byId('timer-surface'),
      display: byId('timer-display'),
      hint: byId('timer-hint'),
      status: byId('timer-status'),
      trackStages: byId('track-stages'),
      markButton: byId('mark-stage'),
    },
    onSolved({ totalMs, splits }) {
      lastSolveId = store.add({ scramble: formatSequence(scramble), totalMs, splits }).id;
      newScramble();
      render();
    },
  });

  byId('new-scramble').addEventListener('click', newScramble);
  plusTwo.addEventListener('click', () => togglePenalty('+2'));
  dnf.addEventListener('click', () => togglePenalty('DNF'));
  exportButton.addEventListener('click', () => downloadCsv(store.getAll()));
  byId('sample-load').addEventListener('click', () => {
    store.addAll(generateSampleSolves());
    render();
  });
  byId('sample-remove').addEventListener('click', () => {
    store.removeWhere(isSampleSolve);
    render();
  });

  // Depois de um clique, o foco sai do botão para a barra de espaço voltar a controlar o cronômetro.
  document.addEventListener('click', (event) => {
    if (event.detail > 0 && !panel.hidden) event.target.closest?.('button, input[type="checkbox"]')?.blur();
  });

  newScramble();
  render();
}
