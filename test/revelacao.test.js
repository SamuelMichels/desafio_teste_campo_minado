import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { Campo, ALTURA } from "../src/campo-minado.js";

/**
 * Cenario com uma parede de bombas na coluna 5, de cima a baixo. A regiao vazia
 * a esquerda da parede (colunas 0 a 4) fica isolada do resto do tabuleiro, o que
 * permite medir exatamente onde a cascata para.
 */
const paredeNaColuna5 = () => {
  const bombas = [];
  for (let y = 0; y < ALTURA; y += 1) {
    bombas.push([5, y]);
  }
  return new Campo({ bombas });
};

describe("Revelacao de uma celula", () => {
  test("revelar uma celula numerada revela apenas ela", () => {
    const campo = paredeNaColuna5();

    campo.revelar(4, 0);

    const estado = campo.estado();
    assert.equal(estado.reveladas, 1);
    assert.equal(estado.grade[0][4].revelada, true);
  });

  test("revelar uma celula vazia revela a regiao inteira em cascata", () => {
    const campo = paredeNaColuna5();

    campo.revelar(0, 0);

    assert.equal(campo.estado().reveladas, 70);
  });

  test("a cascata para nas celulas numeradas e nao atravessa a parede", () => {
    const campo = paredeNaColuna5();

    campo.revelar(0, 0);

    const estado = campo.estado();
    assert.equal(estado.grade[7][4].revelada, true, "a coluna 4 e numerada e entra");
    assert.equal(estado.grade[7][6].revelada, false, "a coluna 6 esta do outro lado");
  });

  test("a cascata nunca revela uma bomba", () => {
    const campo = paredeNaColuna5();

    campo.revelar(0, 0);

    const bombasReveladas = campo
      .estado()
      .grade.flat()
      .filter((celula) => celula.bomba && celula.revelada);
    assert.equal(bombasReveladas.length, 0);
  });

  test("revelar uma celula ja revelada nao altera nada", () => {
    const campo = paredeNaColuna5();
    campo.revelar(0, 0);
    const antes = campo.estado();

    campo.revelar(0, 0);

    assert.deepEqual(campo.estado(), antes);
  });
});

describe("Revelacoes recusadas", () => {
  test("coordenada fora do tabuleiro e recusada", () => {
    const campo = paredeNaColuna5();

    assert.throws(() => campo.revelar(-1, 0), /fora do tabuleiro/);
    assert.throws(() => campo.revelar(0, -1), /fora do tabuleiro/);
    assert.throws(() => campo.revelar(18, 0), /fora do tabuleiro/);
    assert.throws(() => campo.revelar(0, 14), /fora do tabuleiro/);
  });

  test("uma revelacao recusada nao altera nada no estado", () => {
    const campo = paredeNaColuna5();
    campo.revelar(0, 0);
    const antes = campo.estado();

    assert.throws(() => campo.revelar(18, 14));

    assert.deepEqual(campo.estado(), antes);
  });
});
