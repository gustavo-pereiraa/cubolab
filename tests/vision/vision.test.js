import { describe, expect, it } from 'vitest';
import { createSolvedState, STICKERS } from '../../src/cube/state.js';
import { applySequence } from '../../src/cube/moves.js';
import { generateScramble } from '../../src/cube/scramble.js';
import { FACE_COLORS } from '../../src/cube/colors.js';
import { distance, rgbToLab } from '../../src/vision/color.js';
import { kmeans } from '../../src/vision/kmeans.js';
import { solveAssignment } from '../../src/vision/assignment.js';
import { GUIDE_RATIO, guideRect, sampleGrid } from '../../src/vision/sampling.js';
import { classifyStickers } from '../../src/vision/classify.js';
import { GLARE, LIGHTING, seededRandom, simulateReading } from './lighting.js';

const solved = createSolvedState();

/** Abordagem de limites fixos, para comparação: cada adesivo vai para a cor mais próxima da paleta. */
const hexToRgb = (hex) => [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));
const PALETTE = Object.entries(FACE_COLORS).map(([face, { hex }]) => ({ face, lab: rgbToLab(hexToRgb(hex)) }));

function classifyByFixedPalette(samples) {
  return samples.map((rgb) => {
    const lab = rgbToLab(rgb);
    return PALETTE.reduce((best, entry) => (distance(lab, entry.lab) < distance(lab, best.lab) ? entry : best)).face;
  });
}

function accuracy(lighting, classify, cubes = 40) {
  const random = seededRandom(99);
  let correct = 0;
  for (let i = 0; i < cubes; i += 1) {
    const state = applySequence(solved, generateScramble(25, random));
    const result = classify(simulateReading(state, lighting, random));
    correct += result.filter((color, index) => color === state[index]).length;
  }
  return correct / (cubes * STICKERS.length);
}

describe('conversão para Lab', () => {
  it('converte cores de referência', () => {
    const rounded = (rgb) => rgbToLab(rgb).map((value) => Math.round(value) + 0); // + 0 elimina o -0
    expect(rounded([255, 255, 255])).toEqual([100, 0, 0]);
    expect(rounded([0, 0, 0])).toEqual([0, 0, 0]);
    expect(rounded([255, 0, 0])).toEqual([53, 80, 67]);
  });
});

describe('k-means', () => {
  it('separa grupos evidentes e converge', () => {
    const points = [[0, 0], [1, 0], [0, 1], [10, 10], [11, 10], [10, 11]];
    const { labels, centroids, iterations } = kmeans(points, [[0, 0], [10, 10]]);
    expect(labels).toEqual([0, 0, 0, 1, 1, 1]);
    expect(centroids[0][0]).toBeCloseTo(1 / 3);
    expect(centroids[1][1]).toBeCloseTo(31 / 3);
    expect(iterations).toBeLessThan(5);
  });

  it('corrige centroides iniciais ruins', () => {
    const points = [[0], [1], [2], [100], [101], [102]];
    expect(kmeans(points, [[0], [1]]).labels).toEqual([0, 0, 0, 1, 1, 1]);
  });

  it('mantém o centroide de um grupo que ficou vazio', () => {
    const { centroids } = kmeans([[0], [1]], [[0], [500]]);
    expect(centroids[1]).toEqual([500]);
  });
});

describe('algoritmo húngaro', () => {
  it('acha a melhor combinação, e não a mais gulosa', () => {
    // A escolha gulosa pega o 1 da primeira linha e obriga a usar o 100.
    expect(solveAssignment([[1, 2], [1, 100]])).toEqual([1, 0]);
  });

  it('confere com a busca exaustiva em matrizes aleatórias', () => {
    const random = seededRandom(5);
    const permutations = (items) =>
      items.length < 2 ? [items] : items.flatMap((item, i) => permutations(items.filter((_, j) => j !== i)).map((rest) => [item, ...rest]));

    for (let test = 0; test < 50; test += 1) {
      const costs = Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => Math.floor(random() * 100)));
      const total = (assignment) => assignment.reduce((sum, col, row) => sum + costs[row][col], 0);
      const best = Math.min(...permutations([0, 1, 2, 3, 4]).map(total));
      const result = solveAssignment(costs);
      expect(new Set(result).size).toBe(5);
      expect(total(result)).toBe(best);
    }
  });
});

describe('amostragem da grade', () => {
  function makeImage(size, colorAt) {
    const data = new Uint8ClampedArray(size * size * 4);
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const [r, g, b] = colorAt(x, y);
        data.set([r, g, b, 255], (y * size + x) * 4);
      }
    }
    return { data, width: size, height: size };
  }

  it('lê as 9 células linha por linha', () => {
    const image = makeImage(90, (x, y) => [Math.floor(y / 30) * 10, Math.floor(x / 30) * 10, 0]);
    expect(sampleGrid(image)).toEqual([
      [0, 0, 0], [0, 10, 0], [0, 20, 0],
      [10, 0, 0], [10, 10, 0], [10, 20, 0],
      [20, 0, 0], [20, 10, 0], [20, 20, 0],
    ]);
  });

  it('ignora as bordas pretas entre os adesivos', () => {
    const image = makeImage(90, (x, y) => (x % 30 < 8 || x % 30 > 22 || y % 30 < 8 || y % 30 > 22 ? [0, 0, 0] : [200, 100, 50]));
    for (const cell of sampleGrid(image)) expect(cell).toEqual([200, 100, 50]);
  });

  it('ignora um reflexo pequeno dentro do adesivo', () => {
    const image = makeImage(90, (x, y) => (x % 30 === 15 && y % 30 === 15 ? [255, 255, 255] : [30, 60, 90]));
    for (const cell of sampleGrid(image)) expect(cell).toEqual([30, 60, 90]);
  });

  it('centraliza a grade em vídeos horizontais e verticais', () => {
    expect(guideRect(1280, 720)).toEqual({ x: 640 - 360 * GUIDE_RATIO, y: 360 - 360 * GUIDE_RATIO, size: 720 * GUIDE_RATIO });
    expect(guideRect(720, 1280).size).toBe(720 * GUIDE_RATIO);
  });
});

describe('classificação das cores', () => {
  it.each(Object.entries(LIGHTING))('acerta todos os adesivos com %s', (_, lighting) => {
    expect(accuracy(lighting, (samples) => classifyStickers(samples).state)).toBe(1);
  });

  it('mantém a maior parte dos acertos quando reflexos cobrem adesivos inteiros', () => {
    expect(accuracy(GLARE, (samples) => classifyStickers(samples).state)).toBeGreaterThan(0.85);
  });

  it('sempre entrega 9 adesivos de cada cor, mesmo com leituras muito ruins', () => {
    const random = seededRandom(3);
    for (let i = 0; i < 20; i += 1) {
      const noisy = Array.from({ length: 54 }, () => [random() * 255, random() * 255, random() * 255]);
      const { state } = classifyStickers(noisy);
      for (const face of ['U', 'R', 'F', 'D', 'L', 'B']) {
        expect(state.filter((color) => color === face)).toHaveLength(9);
      }
    }
  });

  it('mantém cada centro na sua própria cor', () => {
    const random = seededRandom(8);
    const state = applySequence(solved, generateScramble(25, random));
    const { state: result } = classifyStickers(simulateReading(state, LIGHTING['pouca luz'], random));
    ['U', 'R', 'F', 'D', 'L', 'B'].forEach((face, faceIndex) => expect(result[faceIndex * 9 + 4]).toBe(face));
  });

  it('marca como incerto um adesivo entre duas cores', () => {
    const random = seededRandom(13);
    const state = applySequence(solved, generateScramble(25, random));
    const samples = simulateReading(state, LIGHTING.neutra, random);
    const stickerIndex = state.findIndex((color, index) => color === 'L' && index % 9 !== 4);
    samples[stickerIndex] = [208, 62, 32]; // no meio do caminho entre vermelho e laranja
    expect(classifyStickers(samples).uncertain).toContain(stickerIndex);
  });

  it('não marca nada como incerto em uma leitura limpa', () => {
    const random = seededRandom(21);
    const state = applySequence(solved, generateScramble(25, random));
    expect(classifyStickers(simulateReading(state, LIGHTING.neutra, random)).uncertain).toEqual([]);
  });

  it('supera a paleta fixa com luz quente', () => {
    const lighting = LIGHTING['luz quente (lâmpada amarela)'];
    const clustered = accuracy(lighting, (samples) => classifyStickers(samples).state);
    expect(clustered).toBeGreaterThan(accuracy(lighting, classifyByFixedPalette));
  });
});
