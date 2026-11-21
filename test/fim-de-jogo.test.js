import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { Campo, ALTURA } from "../src/campo-minado.js";

/**
 * Tres bombas conhecidas, com a primeira revelacao do jogo ja gasta em (1,1).
 * A protecao da primeira jogada (ver primeira-jogada.test.js) realocaria a bomba
 * se a derrota fosse testada de saida; (1,1) e numerada, entao nao espalha cascata.
 */
const tresBombas = () => {
  const campo = new Campo({ bombas: [[0, 0], [5, 5], [17, 13]] });
  campo.revelar(1, 1);
  return campo;
};

const paredeNaColuna5 = () => {
  const bombas = [];
  for (let y = 0; y < ALTURA; y += 1) {
    bombas.push([5, y]);
  }
  return new Campo({ bombas });
};

describe("Derrota", () => {
  test("revelar uma bomba perde o jogo", () => {
    const campo = tresBombas();

    campo.revelar(0, 0);

    const estado = campo.estado();
    assert.equal(estado.derrota, true);
    assert.equal(estado.encerrado, true);
    assert.equal(estado.vitoria, false);
  });

  test("a derrota revela todas as bombas, nao so a pisada", () => {
    const campo = tresBombas();

    campo.revelar(0, 0);

    const estado = campo.estado();
    assert.equal(estado.grade[5][5].revelada, true);
    assert.equal(estado.grade[13][17].revelada, true);
  });

  test("a derrota nao revela as celulas seguras que estavam cobertas", () => {
    const campo = tresBombas();

    campo.revelar(0, 0);

    const estado = campo.estado();
    assert.equal(estado.reveladas, 4, "as tres bombas e a (1,1) da primeira jogada");
    assert.equal(estado.grade[7][9].revelada, false);
  });

  test("depois da derrota nao se revela mais nenhuma celula", () => {
    const campo = tresBombas();
    campo.revelar(0, 0);

    assert.throws(() => campo.revelar(9, 7), /encerrado/);
  });

  test("depois da derrota nao se marca mais bandeira", () => {
    const campo = tresBombas();
    campo.revelar(0, 0);

    assert.throws(() => campo.alternarBandeira(9, 7), /encerrado/);
  });
});

describe("Vitoria", () => {
  test("revelar todas as celulas seguras ganha o jogo", () => {
    const campo = new Campo({ bombas: [[0, 0]] });

    campo.revelar(17, 13);

    const estado = campo.estado();
    assert.equal(estado.reveladas, 251, "as 252 celulas menos a bomba");
    assert.equal(estado.vitoria, true);
    assert.equal(estado.encerrado, true);
    assert.equal(estado.derrota, false);
  });

  test("a vitoria nao exige bandeira nas bombas", () => {
    const campo = new Campo({ bombas: [[0, 0]] });

    campo.revelar(17, 13);

    const estado = campo.estado();
    assert.equal(estado.bandeiras, 0);
    assert.equal(estado.vitoria, true);
  });

  test("a bomba continua coberta depois da vitoria", () => {
    const campo = new Campo({ bombas: [[0, 0]] });

    campo.revelar(17, 13);

    assert.equal(campo.estado().grade[0][0].revelada, false);
  });

  test("depois da vitoria nao se revela mais nenhuma celula", () => {
    const campo = new Campo({ bombas: [[0, 0]] });
    campo.revelar(17, 13);

    assert.throws(() => campo.revelar(0, 0), /encerrado/);
  });

  test("faltando uma celula segura o jogo continua em andamento", () => {
    const campo = paredeNaColuna5();

    campo.revelar(0, 0);

    const estado = campo.estado();
    assert.equal(estado.reveladas, 70);
    assert.equal(estado.encerrado, false);
    assert.equal(estado.vitoria, false);
  });
});
