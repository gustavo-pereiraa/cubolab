import { finalMs } from './metrics.js';

const COLUMNS = [
  ['id', (solve) => solve.id],
  ['data', (solve) => solve.date],
  ['embaralhamento', (solve) => solve.scramble],
  ['tempo_ms', (solve) => solve.totalMs],
  ['penalidade', (solve) => solve.penalty ?? ''],
  ['tempo_final_ms', (solve) => (solve.penalty === 'DNF' ? '' : finalMs(solve))],
  ['cruz_ms', (solve) => solve.splits?.cross ?? ''],
  ['primeira_camada_ms', (solve) => solve.splits?.firstLayer ?? ''],
  ['segunda_camada_ms', (solve) => solve.splits?.secondLayer ?? ''],
  ['ultima_camada_ms', (solve) => solve.splits?.lastLayer ?? ''],
];

function escapeField(value) {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** Gera o CSV (RFC 4180) das resoluções, com tempos em milissegundos, pronto para análise. */
export function solvesToCsv(solves) {
  const header = COLUMNS.map(([name]) => name).join(',');
  const rows = solves.map((solve) => COLUMNS.map(([, read]) => escapeField(read(solve))).join(','));
  return [header, ...rows].join('\r\n') + '\r\n';
}
