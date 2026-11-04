import { distance } from './color.js';

const DEFAULT_MAX_ITERATIONS = 50;

function nearestIndex(point, centroids) {
  let best = 0;
  let bestDistance = Infinity;
  centroids.forEach((centroid, index) => {
    const current = distance(point, centroid);
    if (current < bestDistance) {
      best = index;
      bestDistance = current;
    }
  });
  return best;
}

function mean(points) {
  const totals = points[0].map(() => 0);
  for (const point of points) point.forEach((value, i) => (totals[i] += value));
  return totals.map((total) => total / points.length);
}

/**
 * K-means de Lloyd a partir de centroides iniciais: alterna entre ligar cada ponto ao centroide
 * mais próximo e mover cada centroide para a média dos seus pontos, até nada mudar.
 * Um grupo que fique vazio mantém seu centroide anterior.
 */
export function kmeans(points, initialCentroids, maxIterations = DEFAULT_MAX_ITERATIONS) {
  let centroids = initialCentroids;
  let labels = [];
  let iterations = 0;

  for (; iterations < maxIterations; iterations += 1) {
    const nextLabels = points.map((point) => nearestIndex(point, centroids));
    if (nextLabels.every((label, i) => label === labels[i])) break;
    labels = nextLabels;
    centroids = centroids.map((centroid, k) => {
      const members = points.filter((_, i) => labels[i] === k);
      return members.length > 0 ? mean(members) : centroid;
    });
  }
  return { centroids, labels, iterations };
}
