/**
 * Algoritmo húngaro: dada uma matriz de custos n × n, escolhe uma coluna diferente para cada linha
 * com o menor custo total possível, em O(n³). Devolve a coluna escolhida para cada linha.
 */
export function solveAssignment(costs) {
  const n = costs.length;
  // Índices a partir de 1: a linha e a coluna 0 são sentinelas da busca.
  const rowPotential = new Array(n + 1).fill(0);
  const colPotential = new Array(n + 1).fill(0);
  const rowOfCol = new Array(n + 1).fill(0);
  const previousCol = new Array(n + 1).fill(0);

  for (let row = 1; row <= n; row += 1) {
    rowOfCol[0] = row;
    let col = 0;
    const minSlack = new Array(n + 1).fill(Infinity);
    const visited = new Array(n + 1).fill(false);

    do {
      visited[col] = true;
      const currentRow = rowOfCol[col];
      let delta = Infinity;
      let nextCol = 0;

      for (let candidate = 1; candidate <= n; candidate += 1) {
        if (visited[candidate]) continue;
        const slack = costs[currentRow - 1][candidate - 1] - rowPotential[currentRow] - colPotential[candidate];
        if (slack < minSlack[candidate]) {
          minSlack[candidate] = slack;
          previousCol[candidate] = col;
        }
        if (minSlack[candidate] < delta) {
          delta = minSlack[candidate];
          nextCol = candidate;
        }
      }

      for (let candidate = 0; candidate <= n; candidate += 1) {
        if (visited[candidate]) {
          rowPotential[rowOfCol[candidate]] += delta;
          colPotential[candidate] -= delta;
        } else {
          minSlack[candidate] -= delta;
        }
      }
      col = nextCol;
    } while (rowOfCol[col] !== 0);

    while (col !== 0) {
      rowOfCol[col] = rowOfCol[previousCol[col]];
      col = previousCol[col];
    }
  }

  const colOfRow = new Array(n);
  for (let col = 1; col <= n; col += 1) colOfRow[rowOfCol[col] - 1] = col - 1;
  return colOfRow;
}
