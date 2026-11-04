/** Referência de branco D65, a mesma usada pelo sRGB. */
const WHITE_D65 = [0.95047, 1, 1.08883];
const EPSILON = 216 / 24389;
const KAPPA = 24389 / 27;

function srgbToLinear(channel) {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

const labCurve = (value) => (value > EPSILON ? Math.cbrt(value) : (KAPPA * value + 16) / 116);

/**
 * Converte [r, g, b] (0 a 255) para CIE Lab. No Lab, a distância entre dois pontos acompanha
 * a diferença que o olho percebe, e o brilho (L) fica separado da cor em si (a, b).
 */
export function rgbToLab([red, green, blue]) {
  const r = srgbToLinear(red);
  const g = srgbToLinear(green);
  const b = srgbToLinear(blue);

  const x = labCurve((0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / WHITE_D65[0]);
  const y = labCurve((0.2126729 * r + 0.7151522 * g + 0.072175 * b) / WHITE_D65[1]);
  const z = labCurve((0.0193339 * r + 0.119192 * g + 0.9503041 * b) / WHITE_D65[2]);

  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

export function distance(a, b) {
  return Math.hypot(...a.map((value, i) => value - b[i]));
}
