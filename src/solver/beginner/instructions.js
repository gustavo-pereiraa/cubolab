/** As 7 etapas do método iniciante, na ordem em que são resolvidas. */
export const STAGES = [
  {
    id: 'cross',
    title: 'Cruz branca',
    instruction:
      'Forme uma cruz branca na face de baixo. Cada aresta branca deve ficar alinhada com o centro da sua outra cor.',
  },
  {
    id: 'firstLayer',
    title: 'Cantos brancos',
    instruction:
      'Encaixe os quatro cantos brancos embaixo, um por vez. Com o canto acima do seu lugar, repita R U R′ U′ (as letras mudam conforme a face) até ele entrar certo.',
  },
  {
    id: 'secondLayer',
    title: 'Segunda camada',
    instruction:
      'Leve cada aresta sem amarelo até o centro da sua cor e insira na camada do meio, para a direita ou para a esquerda.',
  },
  {
    id: 'yellowCross',
    title: 'Cruz amarela',
    instruction:
      'Forme uma cruz amarela no topo: F R U R′ U′ F′ (as letras mudam conforme a face) transforma o ponto em L, o L em linha e a linha em cruz.',
  },
  {
    id: 'yellowFace',
    title: 'Face amarela',
    instruction: 'Vire os cantos até o topo ficar todo amarelo, com R U R′ U R U2 R′ (as letras mudam conforme a face).',
  },
  {
    id: 'topCorners',
    title: 'Cantos do topo',
    instruction: 'Coloque os cantos amarelos no lugar certo, trocando três deles de uma vez, sem bagunçar o resto do cubo.',
  },
  {
    id: 'topEdges',
    title: 'Meios do topo',
    instruction: 'Última etapa: troque as arestas restantes do topo, três de cada vez, até o cubo ficar resolvido.',
  },
];
