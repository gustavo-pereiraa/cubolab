/** Algoritmos clássicos do método de camadas, escritos para a face da frente. */
export const ALGORITHMS = {
  /** Aresta da cruz em UF com o branco na frente: vai para DF com o branco embaixo. */
  crossFlippedEdge: "U' R' F R",
  /** Tira um canto do lugar errado da primeira camada. */
  liftCorner: "R U R'",
  /** Repetido, leva o canto de URF para DFR na orientação certa. */
  insertCorner: "R U R' U'",
  /** Aresta em UF vai para FR. */
  secondLayerRight: "U R U' R' U' F' U F",
  /** Aresta em UF vai para FL. */
  secondLayerLeft: "U' L' U L U F U' F'",
  /** Avança a cruz amarela: ponto, depois L, depois linha, depois cruz. */
  yellowCross: "F R U R' U' F'",
  /** Sune: gira os cantos do topo. */
  yellowCorners: "R U R' U R U2 R'",
  /** Ciclo de três cantos do topo. */
  topCorners: "R' F R' B2 R F' R' B2 R2",
  /** Ciclo de três arestas do topo. */
  topEdges: "R U' R U R U R U' R' U' R2",
};
