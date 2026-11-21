import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { Campo, LARGURA, ALTURA, TOTAL_DE_BOMBAS } from "../src/campo-minado.js";

const bombasDe = (estado) =>
  estado.grade
    .flatMap((linha, y) => linha.map((celula, x) => (celula.bomba ? `${x},${y}` : null)))
    .filter(Boolean)
    .sort();

describe("Tabuleiro 18 x 14", () => {
  test("tem 18 colunas e 14 linhas", () => {
    const estado = new Campo({ semente: 1 }).estado();

    assert.equal(LARGURA, 18);
    assert.equal(ALTURA, 14);
    assert.equal(estado.grade.length, 14);
    assert.equal(estado.grade[0].length, 18);
  });

  test("tem 252 celulas", () => {
    const estado = new Campo({ semente: 1 }).estado();

    assert.equal(estado.grade.flat().length, 252);
  });

  test("comeca com exatamente 40 bombas", () => {
    const estado = new Campo({ semente: 1 }).estado();

    assert.equal(TOTAL_DE_BOMBAS, 40);
    assert.equal(bombasDe(estado).length, 40);
  });

  test("comeca sem nenhuma celula revelada", () => {
    const estado = new Campo({ semente: 1 }).estado();

    assert.equal(estado.reveladas, 0);
    assert.ok(estado.grade.flat().every((celula) => celula.revelada === false));
  });

  test("comeca sem nenhuma bandeira", () => {
    const estado = new Campo({ semente: 1 }).estado();

    assert.equal(estado.bandeiras, 0);
    assert.ok(estado.grade.flat().every((celula) => celula.bandeira === false));
  });

  test("comeca em andamento, sem vitoria nem derrota", () => {
    const estado = new Campo({ semente: 1 }).estado();

    assert.equal(estado.encerrado, false);
    assert.equal(estado.vitoria, false);
    assert.equal(estado.derrota, false);
  });
});

describe("Sorteio reproduzivel", () => {
  test("a mesma semente gera o mesmo campo", () => {
    const um = new Campo({ semente: 7 }).estado();
    const outro = new Campo({ semente: 7 }).estado();

    assert.deepEqual(bombasDe(um), bombasDe(outro));
  });

  test("sementes diferentes geram campos diferentes", () => {
    const um = new Campo({ semente: 7 }).estado();
    const outro = new Campo({ semente: 8 }).estado();

    assert.notDeepEqual(bombasDe(um), bombasDe(outro));
  });

  test("um cenario com bombas informadas e respeitado", () => {
    const campo = new Campo({ bombas: [[0, 0], [5, 3], [17, 13]] });

    assert.deepEqual(bombasDe(campo.estado()), ["0,0", "17,13", "5,3"].sort());
  });

  test("estado() devolve uma copia: mexer nela nao altera o campo", () => {
    const campo = new Campo({ bombas: [[0, 0]] });
    const estado = campo.estado();

    estado.grade[0][0].revelada = true;
    estado.grade[5][5].bomba = true;

    assert.equal(campo.estado().grade[0][0].revelada, false);
    assert.equal(campo.estado().grade[5][5].bomba, false);
  });
});
