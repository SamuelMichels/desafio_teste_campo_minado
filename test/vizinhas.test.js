import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { Campo } from "../src/campo-minado.js";

const vizinhasEm = (campo, x, y) => campo.estado().grade[y][x].vizinhas;

describe("Contagem de bombas vizinhas", () => {
  test("celula longe de qualquer bomba conta 0", () => {
    const campo = new Campo({ bombas: [[0, 0]] });

    assert.equal(vizinhasEm(campo, 9, 7), 0);
  });

  test("celula no meio cercada pelas 8 vizinhas conta 8", () => {
    const campo = new Campo({
      bombas: [[8, 6], [9, 6], [10, 6], [8, 7], [10, 7], [8, 8], [9, 8], [10, 8]],
    });

    assert.equal(vizinhasEm(campo, 9, 7), 8);
  });

  test("o canto superior esquerdo tem apenas 3 vizinhos e conta no maximo 3", () => {
    const campo = new Campo({ bombas: [[1, 0], [0, 1], [1, 1]] });

    assert.equal(vizinhasEm(campo, 0, 0), 3);
  });

  test("o canto inferior direito nao conta vizinho fora do tabuleiro", () => {
    const campo = new Campo({ bombas: [[16, 13], [17, 12], [16, 12]] });

    assert.equal(vizinhasEm(campo, 17, 13), 3);
  });

  test("a borda conta 5 vizinhos quando todos sao bomba", () => {
    const campo = new Campo({
      bombas: [[0, 6], [1, 6], [1, 7], [0, 8], [1, 8]],
    });

    assert.equal(vizinhasEm(campo, 0, 7), 5);
  });

  test("a celula com bomba tambem recebe a contagem das suas vizinhas", () => {
    const campo = new Campo({ bombas: [[5, 5], [5, 6], [6, 6]] });

    assert.equal(vizinhasEm(campo, 5, 5), 2);
  });

  test("a contagem considera so as 8 adjacentes, nao a mesma linha inteira", () => {
    const campo = new Campo({ bombas: [[0, 7], [17, 7]] });

    assert.equal(vizinhasEm(campo, 9, 7), 0);
  });
});
