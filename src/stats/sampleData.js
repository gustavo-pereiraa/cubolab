import { formatSequence } from '../cube/notation.js';
import { generateScramble } from '../cube/scramble.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const SAMPLE_ID_PREFIX = 'exemplo-';
const SAMPLE_COUNT = 72;
const SAMPLE_DAYS = 45;
const START_MS = 58000;
const END_MS = 27000;
const NOISE_MS = 7000;

/** Participação típica de cada etapa: a segunda camada é onde iniciantes costumam gastar mais. */
const STAGE_SHARES = { cross: 0.15, firstLayer: 0.27, secondLayer: 0.35 };

export const isSampleSolve = (solve) => solve.id.startsWith(SAMPLE_ID_PREFIX);

function seededRandom(seed) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function buildSplits(totalMs, random) {
  const part = (share) => Math.round(totalMs * share * (0.85 + random() * 0.3));
  const cross = part(STAGE_SHARES.cross);
  const firstLayer = part(STAGE_SHARES.firstLayer);
  const secondLayer = part(STAGE_SHARES.secondLayer);
  return { cross, firstLayer, secondLayer, lastLayer: totalMs - cross - firstLayer - secondLayer };
}

function pickPenalty(index) {
  if (index === 30 || index === 55) return 'DNF';
  return index % 19 === 7 ? '+2' : null;
}

/**
 * Histórico fictício para mostrar a tela de estatísticas a quem ainda não treinou: 45 dias
 * de evolução, com ruído, penalidades e parciais. Os ids marcam os registros como exemplo.
 */
export function generateSampleSolves(now = Date.now()) {
  const random = seededRandom(2026);

  return Array.from({ length: SAMPLE_COUNT }, (_, index) => {
    const progress = index / (SAMPLE_COUNT - 1);
    const totalMs = Math.round(START_MS + (END_MS - START_MS) * progress + (random() - 0.5) * 2 * NOISE_MS);
    return {
      id: `${SAMPLE_ID_PREFIX}${index}`,
      date: new Date(now - (1 - progress) * SAMPLE_DAYS * DAY_MS).toISOString(),
      scramble: formatSequence(generateScramble(25, random)),
      totalMs,
      splits: index % 3 === 2 ? null : buildSplits(totalMs, random),
      penalty: pickPenalty(index),
    };
  });
}
