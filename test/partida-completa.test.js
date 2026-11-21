import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { Campo, LARGURA, ALTURA, TOTAL_DE_BOMBAS } from "../src/campo-minado.js";

const LIMITE_DE_JOGADAS = 600;

const vizinhosDe = (x, y) =>
  [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]
    .map(([dx, dy]) => [x + dx, y + dy])
    .filter(([vx, vy]) => vx >= 0 && vx < LARGURA && vy >= 0 && vy < ALTURA);

/**
 * Invariantes que valem em qualquer momento de qualquer partida. Conferir so o
 * resultado final deixaria passar um erro que aparece no meio e se conserta
 * sozinho depois, por isso isto roda a cada jogada.
 */
const conferirInvariantes = (estado, jogada) => {
  const celulas = estado.grade.flat();
  const onde = `jogada ${jogada}`;

  assert.equal(celulas.length, 252, `${onde}: o tabuleiro mudou de tamanho`);
  assert.equal(
    celulas.filter((celula) => celula.bomba).length,
    TOTAL_DE_BOMBAS,
    `${onde}: o total de bombas mudou`,
  );
  assert.equal(estado.reveladas, celulas.filter((c) => c.revelada).length, `${onde}: contador de reveladas`);
  assert.equal(estado.bandeiras, celulas.filter((c) => c.bandeira).length, `${onde}: contador de bandeiras`);
  // Revelada e com bandeira ao mesmo tempo so e legitimo depois da derrota, e
  // so sobre bomba: quem acertou a marcacao continua marcado quando o
  // tabuleiro se abre. Em qualquer outro caso seria a bandeira falhando em
  // proteger a celula.
  assert.ok(
    celulas.every((celula) => !(celula.revelada && celula.bandeira) || (celula.bomba && estado.derrota)),
    `${onde}: celula revelada e com bandeira fora da derrota`,
  );
  assert.ok(!(estado.vitoria && estado.derrota), `${onde}: vitoria e derrota ao mesmo tempo`);

  for (let y = 0; y < ALTURA; y += 1) {
    for (let x = 0; x < LARGURA; x += 1) {
      const esperado = vizinhosDe(x, y).filter(([vx, vy]) => estado.grade[vy][vx].bomba).length;
      assert.equal(estado.grade[y][x].vizinhas, esperado, `${onde}: contagem errada em (${x}, ${y})`);
    }
  }

  if (!estado.derrota) {
    assert.ok(
      celulas.every((celula) => !(celula.bomba && celula.revelada)),
      `${onde}: bomba revelada sem derrota`,
    );
  }
};

/**
 * Jogador deterministico. Le apenas o que um jogador humano veria - celula
 * revelada, bandeira e a contagem das reveladas - e nunca o campo `bomba` das
 * celulas cobertas, senao nao estaria jogando, estaria trapaceando.
 */
const proximaJogada = (estado) => {
  if (estado.reveladas === 0) {
    return { tipo: "revelar", celula: [0, 0] };
  }

  for (let y = 0; y < ALTURA; y += 1) {
    for (let x = 0; x < LARGURA; x += 1) {
      const celula = estado.grade[y][x];
      if (!celula.revelada || celula.vizinhas === 0) {
        continue;
      }
      const vizinhos = vizinhosDe(x, y).map(([vx, vy]) => ({ xy: [vx, vy], ...estado.grade[vy][vx] }));
      const cobertos = vizinhos.filter((v) => !v.revelada && !v.bandeira);
      const marcados = vizinhos.filter((v) => v.bandeira);

      if (cobertos.length === 0) {
        continue;
      }
      if (marcados.length === celula.vizinhas) {
        return { tipo: "revelar", celula: cobertos[0].xy };
      }
      if (marcados.length + cobertos.length === celula.vizinhas) {
        return { tipo: "bandeira", celula: cobertos[0].xy };
      }
    }
  }

  for (let y = 0; y < ALTURA; y += 1) {
    for (let x = 0; x < LARGURA; x += 1) {
      const celula = estado.grade[y][x];
      if (!celula.revelada && !celula.bandeira) {
        return { tipo: "chute", celula: [x, y] };
      }
    }
  }

  throw new Error("nao sobrou jogada possivel e o jogo nao encerrou");
};

const jogarAteOFim = (campo) => {
  const jogadas = [];
  while (!campo.estado().encerrado) {
    if (jogadas.length >= LIMITE_DE_JOGADAS) {
      throw new Error(`o jogo nao terminou em ${LIMITE_DE_JOGADAS} jogadas`);
    }
    const jogada = proximaJogada(campo.estado());
    jogadas.push(`${jogada.tipo} ${jogada.celula.join(",")}`);
    if (jogada.tipo === "bandeira") {
      campo.alternarBandeira(...jogada.celula);
    } else {
      campo.revelar(...jogada.celula);
    }
    conferirInvariantes(campo.estado(), jogadas.length);
  }
  return { estado: campo.estado(), jogadas };
};

describe("Partida completa", () => {
  test("a semente 42 termina com vitoria ou derrota", () => {
    const { estado } = jogarAteOFim(new Campo({ semente: 42 }));

    assert.equal(estado.encerrado, true);
    assert.ok(estado.vitoria || estado.derrota);
  });

  test("dez sementes encerram sem travar e sem violar nenhuma invariante", () => {
    for (let semente = 1; semente <= 10; semente += 1) {
      const { estado } = jogarAteOFim(new Campo({ semente }));

      assert.equal(estado.encerrado, true, `a semente ${semente} nao encerrou`);
    }
  });

  test("na derrota todas as 40 bombas ficam reveladas", () => {
    for (let semente = 1; semente <= 20; semente += 1) {
      const { estado } = jogarAteOFim(new Campo({ semente }));
      if (!estado.derrota) {
        continue;
      }

      const bombasCobertas = estado.grade.flat().filter((c) => c.bomba && !c.revelada);
      assert.equal(bombasCobertas.length, 0, `semente ${semente}`);
    }
  });

  test("na vitoria as 212 celulas seguras estao reveladas e nenhuma bomba foi pisada", () => {
    for (let semente = 1; semente <= 20; semente += 1) {
      const { estado } = jogarAteOFim(new Campo({ semente }));
      if (!estado.vitoria) {
        continue;
      }

      assert.equal(estado.reveladas, 252 - TOTAL_DE_BOMBAS, `semente ${semente}`);
      assert.equal(estado.derrota, false, `semente ${semente}`);
    }
  });

  test("a primeira jogada nunca perde, em nenhuma das 20 sementes", () => {
    for (let semente = 1; semente <= 20; semente += 1) {
      const campo = new Campo({ semente });

      campo.revelar(0, 0);

      assert.equal(campo.estado().derrota, false, `semente ${semente}`);
    }
  });

  test("as 20 sementes exercitam os dois desfechos", () => {
    const desfechos = { vitorias: 0, derrotas: 0 };
    for (let semente = 1; semente <= 20; semente += 1) {
      const { estado } = jogarAteOFim(new Campo({ semente }));
      desfechos[estado.vitoria ? "vitorias" : "derrotas"] += 1;
    }

    // Numeros medidos, nao escolhidos: o sorteio e deterministico. O que importa
    // e que os dois desfechos acontecem, senao os dois testes acima estariam
    // passando no vacuo, sem nunca entrar no ramo que verificam.
    assert.deepEqual(desfechos, { vitorias: 5, derrotas: 15 });
  });

  test("a mesma semente reproduz exatamente a mesma partida", () => {
    const uma = jogarAteOFim(new Campo({ semente: 42 }));
    const outra = jogarAteOFim(new Campo({ semente: 42 }));

    assert.deepEqual(uma.jogadas, outra.jogadas);
    assert.deepEqual(uma.estado, outra.estado);
  });
});
