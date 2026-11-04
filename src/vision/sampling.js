/** Parte de cada célula da grade que é lida, para evitar as bordas pretas entre os adesivos. */
const CELL_SAMPLE_RATIO = 0.4;

/** Parte do menor lado do vídeo ocupada pela grade guia. Precisa combinar com o CSS da grade. */
export const GUIDE_RATIO = 0.7;

/** Quadrado da grade guia, centralizado no vídeo. */
export function guideRect(videoWidth, videoHeight) {
  const size = Math.min(videoWidth, videoHeight) * GUIDE_RATIO;
  return { x: (videoWidth - size) / 2, y: (videoHeight - size) / 2, size };
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

/**
 * Lê as 9 cores de uma imagem que contém só a grade (um objeto como ImageData).
 * Usa a mediana de cada canal, que ignora reflexos e pequenos defeitos, ao contrário da média.
 * Devolve 9 valores [r, g, b], linha por linha.
 */
export function sampleGrid({ data, width, height }) {
  const cellWidth = width / 3;
  const cellHeight = height / 3;
  const cells = [];

  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      const margin = (1 - CELL_SAMPLE_RATIO) / 2;
      const startX = Math.floor((col + margin) * cellWidth);
      const endX = Math.ceil((col + 1 - margin) * cellWidth);
      const startY = Math.floor((row + margin) * cellHeight);
      const endY = Math.ceil((row + 1 - margin) * cellHeight);
      const channels = [[], [], []];

      for (let y = startY; y < endY; y += 1) {
        for (let x = startX; x < endX; x += 1) {
          const offset = (y * width + x) * 4;
          channels.forEach((channel, i) => channel.push(data[offset + i]));
        }
      }
      cells.push(channels.map(median));
    }
  }
  return cells;
}
