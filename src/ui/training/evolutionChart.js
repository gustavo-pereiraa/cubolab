import {
  CategoryScale,
  Chart,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { evolutionSeries } from '../../stats/metrics.js';
import { formatDate, formatShortDate, formatTime } from '../../stats/format.js';

Chart.register(CategoryScale, LinearScale, LineController, LineElement, PointElement, Legend, Tooltip);

/** A partir deste número de resoluções, pontos menores evitam um borrão no gráfico. */
const DENSE_POINT_COUNT = 150;

const token = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

function chartOptions(series) {
  const textMuted = token('--text-muted');
  const textSecondary = token('--text-secondary');
  const grid = token('--border');
  const mono = { family: token('--font-mono'), size: 11 };
  const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: prefersReducedMotion ? false : { duration: 250 },
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: {
        grid: { display: false },
        border: { color: grid },
        ticks: { color: textMuted, font: mono, maxRotation: 0, autoSkipPadding: 24 },
      },
      y: {
        grace: '5%',
        grid: { color: grid },
        border: { display: false },
        ticks: { color: textMuted, font: mono, maxTicksLimit: 6, callback: (value) => formatTime(value) },
      },
    },
    plugins: {
      legend: {
        align: 'start',
        labels: { color: textSecondary, usePointStyle: true, boxHeight: 7, font: { family: token('--font-ui'), size: 12 } },
      },
      tooltip: {
        backgroundColor: token('--header'),
        borderColor: token('--button-secondary-border'),
        borderWidth: 1,
        titleColor: token('--text'),
        bodyColor: textSecondary,
        bodyFont: mono,
        padding: 10,
        callbacks: {
          title: ([item]) => {
            const point = series.current[item.dataIndex];
            return `${formatDate(point.date)}${point.isDnf ? ' · DNF' : ''}`;
          },
          label: (item) => `${item.dataset.label}: ${formatTime(item.parsed.y)}`,
        },
      },
    },
  };
}

/** Gráfico de evolução: cada resolução como ponto e a média móvel de 5 como linha. */
export function createEvolutionChart({ canvas, box, emptyNote, rangeGroup }) {
  const series = { current: [] };
  const rangeButtons = [...rangeGroup.querySelectorAll('button')];
  let solves = [];
  let days = null;
  let chart = null;

  function ensureChart() {
    if (chart) return chart;
    chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Média móvel de 5',
            data: [],
            borderColor: token('--accent'),
            backgroundColor: token('--accent'),
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointStyle: 'line',
            tension: 0,
            spanGaps: false,
            order: 1,
          },
          {
            label: 'Resolução',
            data: [],
            showLine: false,
            borderColor: token('--surface'),
            backgroundColor: token('--chart-point'),
            pointBorderWidth: 1,
            pointHoverRadius: 6,
            pointHitRadius: 10,
            order: 2,
          },
        ],
      },
      options: chartOptions(series),
    });
    return chart;
  }

  function describe(points) {
    const times = points.map((point) => point.ms).filter((ms) => ms !== null);
    const best = times.length > 0 ? formatTime(Math.min(...times)) : 'nenhum';
    const lastAverage = points.findLast((point) => point.averageMs !== null);
    const average = lastAverage ? `, e a média móvel mais recente é ${formatTime(lastAverage.averageMs)}` : '';
    canvas.setAttribute(
      'aria-label',
      `Gráfico de evolução com ${points.length} resoluções. O melhor tempo do período é ${best}${average}. Os dados também estão na tabela de resoluções.`,
    );
  }

  function render() {
    const points = evolutionSeries(solves, days);
    series.current = points;
    const hasData = points.length > 0;
    box.hidden = !hasData;
    emptyNote.hidden = hasData;
    describe(points);
    if (!hasData) return;

    const instance = ensureChart();
    instance.data.labels = points.map((point) => formatShortDate(point.date));
    instance.data.datasets[0].data = points.map((point) => point.averageMs);
    instance.data.datasets[1].data = points.map((point) => point.ms);
    instance.data.datasets[1].pointRadius = points.length > DENSE_POINT_COUNT ? 2 : 4;
    instance.update();
  }

  for (const button of rangeButtons) {
    button.addEventListener('click', () => {
      days = button.dataset.days ? Number(button.dataset.days) : null;
      for (const other of rangeButtons) other.setAttribute('aria-pressed', String(other === button));
      render();
    });
  }

  canvas.setAttribute('role', 'img');

  return {
    update(nextSolves) {
      solves = nextSolves;
      render();
    },
  };
}
