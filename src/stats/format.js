const MINUS = '−';

/** Formata milissegundos como "12.34" ou "1:02.30", cortando (sem arredondar) os milésimos, como a WCA. */
export function formatTime(ms) {
  if (ms === null || ms === undefined) return '–';
  if (ms === Infinity) return 'DNF';
  const centiseconds = Math.floor(ms / 10);
  const minutes = Math.floor(centiseconds / 6000);
  const seconds = Math.floor(centiseconds / 100) % 60;
  const fraction = String(centiseconds % 100).padStart(2, '0');
  return minutes > 0 ? `${minutes}:${String(seconds).padStart(2, '0')}.${fraction}` : `${seconds}.${fraction}`;
}

/** Formata uma diferença de tempo com sinal: "−0.42s" ou "+1:02.30". */
export function formatDelta(ms) {
  return `${ms < 0 ? MINUS : '+'}${formatTime(Math.abs(ms))}${Math.abs(ms) < 60000 ? 's' : ''}`;
}

/** Tempo de uma resolução como aparece na tabela: "DNF" ou "14.34+" quando houve penalidade de +2. */
export function formatSolve({ totalMs, penalty }) {
  if (penalty === 'DNF') return 'DNF';
  return penalty === '+2' ? `${formatTime(totalMs + 2000)}+` : formatTime(totalMs);
}

export function formatDate(iso) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export function formatShortDate(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}
