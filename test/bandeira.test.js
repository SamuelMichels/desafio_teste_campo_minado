import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { Campo } from "../src/campo-minado.js";

const campoComUmaBomba = () => new Campo({ bombas: [[0, 0]] });

describe("Marcar e desmarcar bandeira", () => {
  test("alternar marca a celula coberta", () => {
    const campo = campoComUmaBomba();

    campo.alternarBandeira(9, 7);

    const estado = campo.estado();
    assert.equal(estado.grade[7][9].bandeira, true);
    assert.equal(estado.bandeiras, 1);
  });

  test("alternar de novo desmarca a celula", () => {
    const campo = campoComUmaBomba();

    campo.alternarBandeira(9, 7);
    campo.alternarBandeira(9, 7);

    const estado = campo.estado();
    assert.equal(estado.grade[7][9].bandeira, false);
    assert.equal(estado.bandeiras, 0);
  });

  test("o contador acompanha varias bandeiras", () => {
    const campo = campoComUmaBomba();

    campo.alternarBandeira(1, 1);
    campo.alternarBandeira(2, 2);
    campo.alternarBandeira(3, 3);
    campo.alternarBandeira(2, 2);

    assert.equal(campo.estado().bandeiras, 2);
  });

  test("a bandeira nao altera a bomba nem a contagem da celula", () => {
    const campo = campoComUmaBomba();

    campo.alternarBandeira(0, 0);
    campo.alternarBandeira(1, 1);

    const estado = campo.estado();
    assert.equal(estado.grade[0][0].bomba, true);
    assert.equal(estado.grade[1][1].vizinhas, 1);
  });
});

describe("A bandeira protege a celula", () => {
  test("celula com bandeira nao pode ser revelada", () => {
    const campo = campoComUmaBomba();
    campo.alternarBandeira(9, 7);

    assert.throws(() => campo.revelar(9, 7), /bandeira/);
  });

  test("a celula protegida continua coberta depois da recusa", () => {
    const campo = campoComUmaBomba();
    campo.alternarBandeira(9, 7);
    const antes = campo.estado();

    assert.throws(() => campo.revelar(9, 7));

    assert.deepEqual(campo.estado(), antes);
  });

  test("a cascata nao revela uma celula com bandeira", () => {
    const campo = campoComUmaBomba();
    campo.alternarBandeira(9, 7);

    campo.revelar(17, 13);

    const estado = campo.estado();
    assert.equal(estado.grade[7][9].revelada, false);
    assert.ok(estado.reveladas > 200, "o resto do tabuleiro foi revelado em cascata");
  });
});

describe("Bandeiras recusadas", () => {
  test("nao se marca bandeira em celula ja revelada", () => {
    const campo = campoComUmaBomba();
    campo.revelar(9, 7);

    assert.throws(() => campo.alternarBandeira(9, 7), /revelada/);
  });

  test("coordenada fora do tabuleiro e recusada", () => {
    const campo = campoComUmaBomba();

    assert.throws(() => campo.alternarBandeira(18, 0), /fora do tabuleiro/);
    assert.throws(() => campo.alternarBandeira(0, -1), /fora do tabuleiro/);
  });
});
