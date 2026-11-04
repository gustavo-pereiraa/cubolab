import { describe, expect, it } from 'vitest';
import { formatDelta, formatSolve, formatTime } from '../../src/stats/format.js';
import { HOLD_MS, createTimer } from '../../src/stats/timer.js';
import { createSolveStore } from '../../src/stats/storage.js';
import {
  averageOfLast,
  bestTime,
  evolutionSeries,
  finalMs,
  rollingAverage,
  stageBreakdown,
  summarize,
} from '../../src/stats/metrics.js';
import { solvesToCsv } from '../../src/stats/csv.js';
import { generateSampleSolves, isSampleSolve } from '../../src/stats/sampleData.js';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse('2026-11-04T12:00:00.000Z');

const makeSolve = (totalMs, overrides = {}) => ({
  id: String(Math.random()),
  date: new Date(NOW).toISOString(),
  scramble: 'R U',
  totalMs,
  splits: null,
  penalty: null,
  ...overrides,
});
const solvesOf = (...times) => times.map((ms) => (ms === 'DNF' ? makeSolve(10000, { penalty: 'DNF' }) : makeSolve(ms)));

describe('formatação', () => {
  it.each([
    [0, '0.00'],
    [9999, '9.99'],
    [12340, '12.34'],
    [12349, '12.34'], // corta, não arredonda
    [60000, '1:00.00'],
    [62300, '1:02.30'],
    [3599990, '59:59.99'],
    [Infinity, 'DNF'],
    [null, '–'],
  ])('%s vira %s', (ms, text) => {
    expect(formatTime(ms)).toBe(text);
  });

  it('formata variações com sinal e unidade', () => {
    expect(formatDelta(-420)).toBe('−0.42s');
    expect(formatDelta(1500)).toBe('+1.50s');
    expect(formatDelta(-62300)).toBe('−1:02.30');
  });

  it('mostra as penalidades', () => {
    expect(formatSolve(makeSolve(12340))).toBe('12.34');
    expect(formatSolve(makeSolve(12340, { penalty: '+2' }))).toBe('14.34+');
    expect(formatSolve(makeSolve(12340, { penalty: 'DNF' }))).toBe('DNF');
  });
});

describe('cronômetro', () => {
  function setup() {
    let time = 0;
    const timer = createTimer({ now: () => time });
    return { timer, advance: (ms) => (time += ms) };
  }

  it('segue o ciclo: segura, fica pronto, solta, corre e para', () => {
    const { timer, advance } = setup();
    expect(timer.getState()).toBe('idle');
    timer.press();
    expect(timer.getState()).toBe('holding');
    advance(HOLD_MS);
    timer.update();
    expect(timer.getState()).toBe('ready');
    timer.release();
    expect(timer.getState()).toBe('running');
    advance(12340);
    expect(timer.getElapsed()).toBe(12340);
    expect(timer.press()).toEqual({ totalMs: 12340, splits: null });
    expect(timer.getState()).toBe('idle');
  });

  it('não inicia se soltar antes do tempo', () => {
    const { timer, advance } = setup();
    timer.press();
    advance(HOLD_MS - 1);
    timer.release();
    expect(timer.getState()).toBe('idle');
  });

  it('a tecla solta depois de parar não reinicia o cronômetro', () => {
    const { timer, advance } = setup();
    timer.press();
    advance(HOLD_MS);
    timer.release();
    advance(1000);
    timer.press();
    advance(5000);
    timer.release();
    expect(timer.getState()).toBe('idle');
  });

  it('registra os tempos de cada etapa', () => {
    const { timer, advance } = setup();
    timer.press();
    advance(HOLD_MS);
    timer.release({ withStages: true });
    advance(2000);
    timer.mark();
    advance(4000);
    timer.mark();
    advance(5000);
    timer.mark();
    advance(3000);
    expect(timer.press()).toEqual({
      totalMs: 14000,
      splits: { cross: 2000, firstLayer: 4000, secondLayer: 5000, lastLayer: 3000 },
    });
  });

  it('a quarta marca para o cronômetro', () => {
    const { timer, advance } = setup();
    timer.press();
    advance(HOLD_MS);
    timer.release({ withStages: true });
    for (let i = 0; i < 3; i += 1) {
      advance(1000);
      expect(timer.mark()).toBeNull();
    }
    advance(1000);
    expect(timer.mark().splits.lastLayer).toBe(1000);
    expect(timer.getState()).toBe('idle');
  });

  it('descarta parciais incompletas, mas mantém o tempo', () => {
    const { timer, advance } = setup();
    timer.press();
    advance(HOLD_MS);
    timer.release({ withStages: true });
    advance(1000);
    timer.mark();
    advance(1000);
    expect(timer.press()).toEqual({ totalMs: 2000, splits: null });
  });

  it('ignora marcas quando a opção está desligada', () => {
    const { timer, advance } = setup();
    timer.press();
    advance(HOLD_MS);
    timer.release();
    advance(1000);
    expect(timer.mark()).toBeNull();
    expect(timer.getMarkCount()).toBe(0);
  });

  it('cancela sem gerar resultado', () => {
    const { timer, advance } = setup();
    timer.press();
    advance(HOLD_MS);
    timer.release();
    timer.cancel();
    expect(timer.getState()).toBe('idle');
  });
});

describe('médias no padrão WCA', () => {
  it('descarta o melhor e o pior tempo', () => {
    expect(averageOfLast(solvesOf(10000, 12000, 14000, 16000, 30000), 5)).toBe(14000);
  });

  it('usa só as últimas resoluções', () => {
    expect(averageOfLast(solvesOf(99000, 99000, 10000, 12000, 14000, 16000, 18000), 5)).toBe(14000);
  });

  it('precisa de resoluções suficientes', () => {
    expect(averageOfLast(solvesOf(1000, 2000, 3000, 4000), 5)).toBeNull();
  });

  it('um DNF conta como o pior tempo', () => {
    expect(averageOfLast(solvesOf(10000, 12000, 14000, 16000, 'DNF'), 5)).toBe(14000);
  });

  it('dois DNF tornam a média DNF', () => {
    expect(averageOfLast(solvesOf(10000, 12000, 14000, 'DNF', 'DNF'), 5)).toBe(Infinity);
  });

  it('o +2 soma antes de descartar', () => {
    const solves = [...solvesOf(10000, 12000, 14000, 16000), makeSolve(9000, { penalty: '+2' })];
    expect(finalMs(solves[4])).toBe(11000);
    expect(averageOfLast(solves, 5)).toBe(Math.round((11000 + 12000 + 14000) / 3));
  });

  it('o ao12 descarta só um melhor e um pior', () => {
    const times = [1000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 90000];
    expect(averageOfLast(solvesOf(...times), 12)).toBe(20000);
  });

  it('calcula a média móvel para cada resolução', () => {
    const rolling = rollingAverage(solvesOf(10000, 12000, 14000, 16000, 18000, 20000), 5);
    expect(rolling).toEqual([null, null, null, null, 14000, 16000]);
  });

  it('o melhor tempo ignora DNF e considera +2', () => {
    expect(bestTime(solvesOf('DNF', 15000))).toBe(15000);
    expect(bestTime([makeSolve(10000, { penalty: '+2' }), makeSolve(11000)])).toBe(11000);
    expect(bestTime(solvesOf('DNF'))).toBeNull();
    expect(bestTime([])).toBeNull();
  });
});

describe('resumo e variação semanal', () => {
  const dated = (ms, daysAgo) => makeSolve(ms, { date: new Date(NOW - daysAgo * DAY).toISOString() });

  it('compara com o valor de uma semana atrás', () => {
    const solves = [
      ...[20000, 20000, 20000, 20000, 20000].map((ms) => dated(ms, 8)),
      ...[15000, 15000, 15000, 15000, 15000].map((ms) => dated(ms, 1)),
    ];
    const summary = summarize(solves, NOW);
    expect(summary.ao5).toEqual({ value: 15000, change: -5000 });
    expect(summary.best).toEqual({ value: 15000, change: -5000 });
    expect(summary.total).toEqual({ value: 10, thisWeek: 5, lastWeek: 5 });
  });

  it('não inventa variação sem dados da semana anterior', () => {
    const solves = [15000, 15000, 15000, 15000, 15000].map((ms) => dated(ms, 1));
    const summary = summarize(solves, NOW);
    expect(summary.ao5.change).toBeNull();
    expect(summary.best.change).toBeNull();
    expect(summary.ao12.value).toBeNull();
    expect(summary.total.lastWeek).toBe(0);
  });

  it('não calcula variação quando a média é DNF', () => {
    const solves = [
      ...[20000, 20000, 20000, 20000, 20000].map((ms) => dated(ms, 8)),
      ...[10000, 10000, 10000].map((ms) => dated(ms, 1)),
      makeSolve(1, { penalty: 'DNF', date: new Date(NOW).toISOString() }),
      makeSolve(1, { penalty: 'DNF', date: new Date(NOW).toISOString() }),
    ];
    expect(summarize(solves, NOW).ao5).toEqual({ value: Infinity, change: null });
  });

  it('lida com a lista vazia', () => {
    expect(summarize([], NOW)).toEqual({
      ao5: { value: null, change: null },
      ao12: { value: null, change: null },
      best: { value: null, change: null },
      total: { value: 0, thisWeek: 0, lastWeek: 0 },
    });
  });
});

describe('série do gráfico', () => {
  const dated = (ms, daysAgo, overrides) => makeSolve(ms, { date: new Date(NOW - daysAgo * DAY).toISOString(), ...overrides });

  it('filtra por período, mas calcula a média com o histórico completo', () => {
    const solves = [40, 30, 20, 10].map((days, i) => dated(10000 + i * 2000, days));
    solves.push(dated(18000, 1));
    const series = evolutionSeries(solves, 7, NOW);
    expect(series).toHaveLength(1);
    expect(series[0].ms).toBe(18000);
    expect(series[0].averageMs).toBe(14000);
    expect(evolutionSeries(solves, 30, NOW)).toHaveLength(4);
    expect(evolutionSeries(solves, 29, NOW)).toHaveLength(3);
    expect(evolutionSeries(solves, null, NOW)).toHaveLength(5);
  });

  it('um DNF fica sem ponto, e a média DNF fica sem linha', () => {
    const solves = [dated(10000, 1), dated(12000, 1, { penalty: 'DNF' })];
    expect(evolutionSeries(solves, null, NOW)[1]).toMatchObject({ ms: null, isDnf: true, averageMs: null });
  });
});

describe('tempo por etapa', () => {
  const splits = (cross, firstLayer, secondLayer, lastLayer) => ({ cross, firstLayer, secondLayer, lastLayer });

  it('calcula as médias, a mais lenta e a dica', () => {
    const solves = [
      makeSolve(10000, { splits: splits(1000, 2000, 5000, 2000) }),
      makeSolve(14000, { splits: splits(3000, 2000, 7000, 2000) }),
    ];
    const result = stageBreakdown(solves);
    expect(result.slowestId).toBe('secondLayer');
    expect(result.solveCount).toBe(2);
    expect(result.stages.map((stage) => stage.averageMs)).toEqual([2000, 2000, 6000, 2000]);
    expect(result.tip).toBe('A segunda camada leva 50% do seu tempo.');
    expect(result.stages.reduce((sum, stage) => sum + stage.share, 0)).toBeCloseTo(1);
  });

  it('ignora resoluções sem parciais e com DNF', () => {
    const solves = [
      makeSolve(10000),
      makeSolve(9000, { penalty: 'DNF', splits: splits(9000, 0, 0, 0) }),
      makeSolve(10000, { splits: splits(4000, 2000, 2000, 2000) }),
    ];
    const result = stageBreakdown(solves);
    expect(result.solveCount).toBe(1);
    expect(result.slowestId).toBe('cross');
  });

  it('devolve null sem dados', () => {
    expect(stageBreakdown(solvesOf(1000))).toBeNull();
  });
});

describe('armazenamento', () => {
  function fakeStorage(initial) {
    const data = new Map(initial ? [['cubolab.solves.v1', initial]] : []);
    return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
  }

  it('grava e relê no modelo combinado', () => {
    const storage = fakeStorage();
    const solve = createSolveStore(storage).add({ scramble: 'R U', totalMs: 12340, splits: null });
    expect(Object.keys(solve).sort()).toEqual(['date', 'id', 'penalty', 'scramble', 'splits', 'totalMs']);
    expect(solve.penalty).toBeNull();
    expect(createSolveStore(storage).getAll()).toEqual([solve]);
  });

  it('altera a penalidade e remove', () => {
    const storage = fakeStorage();
    const store = createSolveStore(storage);
    const { id } = store.add({ scramble: 'R', totalMs: 1000, splits: null });
    store.setPenalty(id, '+2');
    expect(createSolveStore(storage).getAll()[0].penalty).toBe('+2');
    store.remove(id);
    expect(createSolveStore(storage).getAll()).toEqual([]);
  });

  it('mantém a ordem por data', () => {
    const store = createSolveStore(fakeStorage());
    store.add({ scramble: 'R', totalMs: 2, splits: null, date: '2026-11-04T10:00:00.000Z' });
    store.add({ scramble: 'U', totalMs: 1, splits: null, date: '2026-11-01T10:00:00.000Z' });
    expect(store.getAll().map((solve) => solve.totalMs)).toEqual([1, 2]);
  });

  it.each(['{quebrado', '"texto"', 'null', '{"a":1}'])('sobrevive a dados inválidos: %s', (raw) => {
    expect(createSolveStore(fakeStorage(raw)).getAll()).toEqual([]);
  });

  it('descarta só os registros inválidos', () => {
    const good = makeSolve(1000);
    const bad = [{ ...makeSolve(1), date: 'ontem' }, { ...makeSolve(1), totalMs: 'x' }, { ...makeSolve(1), penalty: 'y' }, { ...makeSolve(1), splits: { cross: 1 } }, null];
    const store = createSolveStore(fakeStorage(JSON.stringify([good, ...bad])));
    expect(store.getAll()).toEqual([good]);
  });

  it('continua funcionando quando o navegador bloqueia a gravação', () => {
    const blocked = { getItem: () => { throw new Error('bloqueado'); }, setItem: () => { throw new Error('cheio'); } };
    const store = createSolveStore(blocked);
    store.add({ scramble: 'R', totalMs: 1000, splits: null });
    expect(store.getAll()).toHaveLength(1);
    expect(store.isPersistent()).toBe(false);
  });
});

describe('dados de exemplo', () => {
  function memoryStorage() {
    const data = new Map();
    return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
  }

  it('passam pela validação do armazenamento e ficam em ordem', () => {
    const storage = memoryStorage();
    const samples = generateSampleSolves(NOW);
    createSolveStore(storage).addAll(samples);
    expect(createSolveStore(storage).getAll()).toEqual(samples);
  });

  it('nunca ficam no futuro e têm parciais que somam o tempo total', () => {
    for (const solve of generateSampleSolves(NOW)) {
      expect(Date.parse(solve.date)).toBeLessThanOrEqual(NOW);
      if (solve.splits) {
        expect(Object.values(solve.splits).reduce((sum, part) => sum + part, 0)).toBe(solve.totalMs);
        expect(solve.splits.lastLayer).toBeGreaterThan(0);
      }
    }
  });

  it('mostram evolução, com todos os cards preenchidos', () => {
    const summary = summarize(generateSampleSolves(NOW), NOW);
    expect(Number.isFinite(summary.ao5.value)).toBe(true);
    expect(Number.isFinite(summary.ao12.value)).toBe(true);
    expect(summary.ao5.change).toBeLessThan(0);
    expect(stageBreakdown(generateSampleSolves(NOW)).slowestId).toBe('secondLayer');
  });

  it('podem ser removidos sem apagar as resoluções reais', () => {
    const store = createSolveStore(memoryStorage());
    store.addAll(generateSampleSolves(NOW));
    const real = store.add({ scramble: 'R', totalMs: 1000, splits: null });
    store.removeWhere(isSampleSolve);
    expect(store.getAll()).toEqual([real]);
  });
});

describe('CSV', () => {
  it('traz cabeçalho, parciais e tempo final', () => {
    const csv = solvesToCsv([
      makeSolve(12000, { id: 'a', date: '2026-11-04T12:00:00.000Z', scramble: "R U'", penalty: '+2', splits: { cross: 1, firstLayer: 2, secondLayer: 3, lastLayer: 4 } }),
      makeSolve(9000, { id: 'b', date: '2026-11-04T13:00:00.000Z', scramble: 'F', penalty: 'DNF' }),
    ]);
    expect(csv.split('\r\n')).toEqual([
      'id,data,embaralhamento,tempo_ms,penalidade,tempo_final_ms,cruz_ms,primeira_camada_ms,segunda_camada_ms,ultima_camada_ms',
      "a,2026-11-04T12:00:00.000Z,R U',12000,+2,14000,1,2,3,4",
      'b,2026-11-04T13:00:00.000Z,F,9000,DNF,,,,,',
      '',
    ]);
  });

  it('escapa vírgulas, aspas e quebras de linha', () => {
    const csv = solvesToCsv([makeSolve(1, { id: 'x,"y"\nz', date: '2026-11-04T12:00:00.000Z' })]);
    expect(csv).toContain('"x,""y""\nz"');
  });

  it('com lista vazia, gera só o cabeçalho', () => {
    expect(solvesToCsv([]).trim().split('\r\n')).toHaveLength(1);
  });
});
