const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;
const PLUS_TWO_MS = 2000;

export const STAGE_LABELS = {
  cross: 'Cruz',
  firstLayer: '1ª camada',
  secondLayer: '2ª camada',
  lastLayer: 'Última camada',
};

/** Texto da etapa dentro de uma frase, como "a segunda camada leva 34%". */
const STAGE_IN_SENTENCE = {
  cross: 'A cruz',
  firstLayer: 'A primeira camada',
  secondLayer: 'A segunda camada',
  lastLayer: 'A última camada',
};

/** Tempo que vale para as métricas: +2 soma dois segundos, e DNF conta como infinito. */
export function finalMs({ totalMs, penalty }) {
  if (penalty === 'DNF') return Infinity;
  return penalty === '+2' ? totalMs + PLUS_TWO_MS : totalMs;
}

/**
 * Média no padrão WCA: descarta o melhor e o pior tempo e tira a média dos demais.
 * Um DNF conta como o pior tempo; com dois ou mais, a média é DNF (Infinity).
 */
function trimmedMean(solves) {
  const times = solves.map(finalMs).sort((a, b) => a - b);
  const counted = times.slice(1, -1);
  if (counted.includes(Infinity)) return Infinity;
  return Math.round(counted.reduce((sum, time) => sum + time, 0) / counted.length);
}

/** Média das últimas `size` resoluções, ou null se ainda não houver resoluções suficientes. */
export function averageOfLast(solves, size) {
  return solves.length < size ? null : trimmedMean(solves.slice(-size));
}

/** Para cada resolução, a média das `size` resoluções que terminam nela (null nas primeiras). */
export function rollingAverage(solves, size) {
  return solves.map((_, index) => (index + 1 < size ? null : trimmedMean(solves.slice(index + 1 - size, index + 1))));
}

export function bestTime(solves) {
  const finite = solves.map(finalMs).filter(Number.isFinite);
  return finite.length > 0 ? Math.min(...finite) : null;
}

/** Diferença entre o valor atual e o de uma semana atrás, se os dois forem tempos válidos. */
function changeSinceLastWeek(current, previous) {
  return Number.isFinite(current) && Number.isFinite(previous) ? current - previous : null;
}

/**
 * Os números dos cards. A variação compara o valor de hoje com o que ele era há 7 dias;
 * no total, compara as resoluções dos últimos 7 dias com as dos 7 dias anteriores.
 */
export function summarize(solves, now = Date.now()) {
  const timeOf = (solve) => Date.parse(solve.date);
  const untilLastWeek = solves.filter((solve) => timeOf(solve) <= now - WEEK_MS);
  const thisWeek = solves.filter((solve) => timeOf(solve) > now - WEEK_MS).length;
  const lastWeek = solves.filter((solve) => timeOf(solve) > now - 2 * WEEK_MS && timeOf(solve) <= now - WEEK_MS).length;

  const metric = (compute) => {
    const value = compute(solves);
    return { value, change: changeSinceLastWeek(value, compute(untilLastWeek)) };
  };

  return {
    ao5: metric((list) => averageOfLast(list, 5)),
    ao12: metric((list) => averageOfLast(list, 12)),
    best: metric(bestTime),
    total: { value: solves.length, thisWeek, lastWeek },
  };
}

/**
 * Série do gráfico: a média móvel é calculada sobre todo o histórico, para o início do
 * período já vir com o valor certo, e depois corta-se pelo período. `days` null significa tudo.
 */
export function evolutionSeries(solves, days, now = Date.now()) {
  const averages = rollingAverage(solves, 5);
  const points = solves.map((solve, index) => {
    const time = finalMs(solve);
    const average = averages[index];
    return {
      date: solve.date,
      ms: Number.isFinite(time) ? time : null,
      isDnf: time === Infinity,
      averageMs: Number.isFinite(average) ? average : null,
    };
  });
  return days === null ? points : points.filter(({ date }) => Date.parse(date) >= now - days * DAY_MS);
}

/**
 * Tempo médio por etapa, considerando resoluções com parciais e sem DNF.
 * Devolve null se ainda não houver dados, ou as etapas, a mais lenta e a dica pronta.
 */
export function stageBreakdown(solves) {
  const usable = solves.filter((solve) => solve.splits && solve.penalty !== 'DNF');
  if (usable.length === 0) return null;

  const stages = Object.keys(STAGE_LABELS).map((id) => ({
    id,
    label: STAGE_LABELS[id],
    averageMs: usable.reduce((sum, solve) => sum + solve.splits[id], 0) / usable.length,
  }));
  const total = stages.reduce((sum, stage) => sum + stage.averageMs, 0);
  const slowest = stages.reduce((worst, stage) => (stage.averageMs > worst.averageMs ? stage : worst));
  const withShare = stages.map((stage) => ({ ...stage, share: total > 0 ? stage.averageMs / total : 0 }));
  const slowestShare = Math.round((total > 0 ? slowest.averageMs / total : 0) * 100);

  return {
    stages: withShare,
    slowestId: slowest.id,
    solveCount: usable.length,
    tip: `${STAGE_IN_SENTENCE[slowest.id]} leva ${slowestShare}% do seu tempo.`,
  };
}
