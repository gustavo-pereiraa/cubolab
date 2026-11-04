import { FACES, STICKER_COUNT } from '../cube/state.js';
import { distance, rgbToLab } from './color.js';
import { kmeans } from './kmeans.js';
import { solveAssignment } from './assignment.js';

const STICKERS_PER_COLOR = 9;
const CENTER_OFFSET = 4;

/** O brilho varia muito com a luz e a sombra, então pesa menos que a cor em si. */
const LIGHTNESS_WEIGHT = 0.25;

/** Custo que impede um centro de ir para outra cor: os centros definem cada cor do cubo. */
const FORBIDDEN_COST = 1e6;

/** Um adesivo é incerto se a segunda cor mais próxima está quase tão perto quanto a escolhida. */
const UNCERTAIN_RATIO = 0.8;

const centerIndex = (faceIndex) => faceIndex * STICKERS_PER_COLOR + CENTER_OFFSET;

/**
 * Mudar a exposição multiplica L + 16, a e b pelo mesmo fator. Dividir a e b por L + 16 deixa a cor
 * quase imune a isso, o que evita confundir um laranja na sombra com vermelho.
 */
function toFeature(rgb) {
  const [lightness, a, b] = rgbToLab(rgb);
  const scale = 100 / (lightness + 16);
  return [lightness * LIGHTNESS_WEIGHT, a * scale, b * scale];
}

/** Cada face recebe um grupo exclusivo: o que melhor combina com o adesivo do seu centro. */
function matchCentroidsToFaces(features, centroids) {
  const costs = FACES.map((_, faceIndex) =>
    centroids.map((centroid) => distance(features[centerIndex(faceIndex)], centroid)),
  );
  return solveAssignment(costs).map((centroidIndex) => centroids[centroidIndex]);
}

/**
 * O k-means pode formar grupos desiguais, como 11 vermelhos e 7 laranjas. Como o cubo tem
 * exatamente 9 de cada cor, cada grupo vira 9 vagas, e os adesivos são distribuídos entre as
 * vagas com a menor distância total. Devolve o índice da face escolhida para cada adesivo.
 */
function assignBalanced(features, faceCentroids) {
  const costs = features.map((feature, stickerIndex) =>
    Array.from({ length: STICKER_COUNT }, (_, slot) => {
      const faceIndex = Math.floor(slot / STICKERS_PER_COLOR);
      const isOwnCenter = stickerIndex === centerIndex(faceIndex);
      const isOtherCenter = stickerIndex % STICKERS_PER_COLOR === CENTER_OFFSET && !isOwnCenter;
      return isOtherCenter ? FORBIDDEN_COST : distance(feature, faceCentroids[faceIndex]);
    }),
  );
  return solveAssignment(costs).map((slot) => Math.floor(slot / STICKERS_PER_COLOR));
}

function findUncertain(features, faceCentroids, assigned) {
  return features.flatMap((feature, index) => {
    const own = distance(feature, faceCentroids[assigned[index]]);
    const closestOther = Math.min(
      ...faceCentroids.filter((_, k) => k !== assigned[index]).map((centroid) => distance(feature, centroid)),
    );
    return own > closestOther * UNCERTAIN_RATIO ? [index] : [];
  });
}

/**
 * Classifica as 54 cores lidas pela câmera, em conjunto: como os grupos saem das próprias
 * amostras, e não de uma tabela fixa, eles acompanham a iluminação do momento.
 * Recebe os valores [r, g, b] na ordem do estado e devolve { state, uncertain }.
 */
export function classifyStickers(samples) {
  const features = samples.map(toFeature);
  const seeds = FACES.map((_, faceIndex) => features[centerIndex(faceIndex)]);
  const { centroids } = kmeans(features, seeds);
  const faceCentroids = matchCentroidsToFaces(features, centroids);
  const assigned = assignBalanced(features, faceCentroids);

  return {
    state: assigned.map((faceIndex) => FACES[faceIndex]),
    uncertain: findUncertain(features, faceCentroids, assigned),
  };
}
