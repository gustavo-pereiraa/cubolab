/**
 * Esquema de cores do CuboLab, segurando o cubo com amarelo em cima e verde na frente.
 * O branco fica embaixo para o método iniciante terminar com o amarelo no topo, sem rotações.
 */
export const FACE_COLORS = {
  U: { name: 'amarelo', hex: '#FFD43B' },
  R: { name: 'laranja', hex: '#F76B15' },
  F: { name: 'verde', hex: '#30A46C' },
  D: { name: 'branco', hex: '#F4F6F8' },
  L: { name: 'vermelho', hex: '#E5484D' },
  B: { name: 'azul', hex: '#3B82F6' },
};

export const FACE_NAMES = {
  U: 'de cima',
  R: 'da direita',
  F: 'da frente',
  D: 'de baixo',
  L: 'da esquerda',
  B: 'de trás',
};
