import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { Campo, TOTAL_DE_BOMBAS } from "../src/campo-minado.js";

const posicoesDasBombas = (campo) =>
  campo
    .estado()
    .grade.flatMap((linha, y) => linha.map((celula, x) => (celula.bomba ? [x, y] : null)))
    .filter(Boolean);

describe("A primeira revelacao nunca e uma bomba", () => {
  test("cair em cima de uma bomba na primeira jogada nao perde o jogo", () => {
    const campo = new Campo({ bombas: [[9, 7]] });

    campo.revelar(9, 7);

    assert.equal(campo.estado().derrota, false);
  });

  test("a celula clicada deixa de ter bomba", () => {
    const campo = new Campo({ bombas: [[9, 7]] });

    campo.revelar(9, 7);

    assert.equal(campo.estado().grade[7][9].bomba, false);
  });

  test("a bomba e realocada, nao apagada: o total se mantem", () => {
    const campo = new Campo({ semente: 3 });
    const [[x, y]] = posicoesDasBombas(campo);

    campo.revelar(x, y);

    assert.equal(posicoesDasBombas(campo).length, TOTAL_DE_BOMBAS);
  });

  test("a realocacao recalcula a contagem das vizinhas", () => {
    const campo = new Campo({ bombas: [[9, 7]] });

    campo.revelar(9, 7);

    const estado = campo.estado();
    assert.deepEqual(posicoesDasBombas(campo), [[0, 0]], "foi para a primeira celula livre");
    assert.equal(estado.grade[1][1].vizinhas, 1, "a vizinha do novo lugar passou a contar 1");
    assert.equal(estado.grade[7][9].vizinhas, 0, "a celula clicada ficou limpa");
  });

  test("nenhuma das 40 bombas da semente 1 perde se for a primeira jogada", () => {
    for (const [x, y] of posicoesDasBombas(new Campo({ semente: 1 }))) {
      const campo = new Campo({ semente: 1 });

      campo.revelar(x, y);

      assert.equal(campo.estado().derrota, false, `perdeu na primeira jogada em (${x}, ${y})`);
    }
  });

  test("a primeira jogada numa celula livre nao mexe nas bombas", () => {
    const campo = new Campo({ semente: 3 });
    const antes = posicoesDasBombas(campo);
    const livre = campo.estado().grade.flatMap((linha, y) =>
      linha.map((celula, x) => (celula.bomba ? null : [x, y])),
    ).filter(Boolean)[0];

    campo.revelar(...livre);

    assert.deepEqual(posicoesDasBombas(campo), antes);
  });

  test("a protecao vale so para a primeira jogada: a segunda pode perder", () => {
    const campo = new Campo({ bombas: [[0, 0], [9, 8]] });

    campo.revelar(9, 7);
    campo.revelar(9, 8);

    assert.equal(campo.estado().derrota, true);
  });
});
