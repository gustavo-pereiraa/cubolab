/** Cores típicas de adesivos fotografados, diferentes da paleta da interface de propósito. */
export const STICKER_RGB = {
  U: [235, 205, 55], // amarelo
  R: [230, 95, 25], // laranja
  F: [25, 145, 80], // verde
  D: [225, 228, 230], // branco
  L: [185, 30, 40], // vermelho
  B: [25, 70, 175], // azul
};

export function seededRandom(seed) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

/** Cenários de iluminação: `gain` multiplica os canais, e `exposure` varia a cada face. */
export const LIGHTING = {
  neutra: { gain: [1, 1, 1], noise: 4 },
  'pouca luz': { gain: [0.35, 0.35, 0.35], noise: 3 },
  'luz quente (lâmpada amarela)': { gain: [1.05, 0.85, 0.55], noise: 5 },
  'luz fria (fluorescente)': { gain: [0.75, 0.9, 1.15], noise: 5 },
  'exposição diferente em cada face': { gain: [1, 1, 1], noise: 4, exposure: [0.55, 1.1] },
  'luz quente e fraca, com exposição variável': { gain: [0.7, 0.55, 0.35], noise: 4, exposure: [0.7, 1.1] },
};

/** Reflexo cobrindo o adesivo inteiro: a cor real se perde, então nenhum método acerta tudo. */
export const GLARE = { gain: [1, 1, 1], noise: 4, glare: 0.06 };

const clamp = (value) => Math.max(0, Math.min(255, Math.round(value)));

/** Simula o que a câmera leria de um estado do cubo sob uma iluminação. */
export function simulateReading(state, { gain, noise, exposure, glare = 0 }, random) {
  const exposures = Array.from({ length: 6 }, () => (exposure ? exposure[0] + random() * (exposure[1] - exposure[0]) : 1));

  return state.map((color, index) => {
    if (random() < glare) return [245, 245, 240];
    const faceExposure = exposures[Math.floor(index / 9)];
    return STICKER_RGB[color].map((value, channel) =>
      clamp(value * gain[channel] * faceExposure + (random() - 0.5) * 2 * noise),
    );
  });
}
