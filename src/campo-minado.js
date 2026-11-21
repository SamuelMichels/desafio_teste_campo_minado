/**
 * Campo minado de 18 x 14 com 40 bombas, construido por TDD.
 *
 * As coordenadas sao (x, y): x e a coluna, de 0 a 17, e y e a linha, de 0 a 13.
 * A grade e indexada por grade[y][x].
 */

export const LARGURA = 18;
export const ALTURA = 14;
export const TOTAL_DE_BOMBAS = 40;

/**
 * mulberry32: gerador pseudoaleatorio com semente. O sorteio das bombas precisa
 * ser reproduzivel, senao nenhum caso de teste que dependa do campo sorteado
 * roda igual duas vezes.
 */
function geradorComSemente(semente) {
  let estado = semente >>> 0;
  return function sortear() {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let x = estado;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function todasAsPosicoes() {
  const posicoes = [];
  for (let y = 0; y < ALTURA; y += 1) {
    for (let x = 0; x < LARGURA; x += 1) {
      posicoes.push([x, y]);
    }
  }
  return posicoes;
}

function sortearBombas(semente) {
  const posicoes = todasAsPosicoes();
  const sortear = geradorComSemente(semente);
  for (let i = posicoes.length - 1; i > 0; i -= 1) {
    const j = Math.floor(sortear() * (i + 1));
    [posicoes[i], posicoes[j]] = [posicoes[j], posicoes[i]];
  }
  return posicoes.slice(0, TOTAL_DE_BOMBAS);
}

const DESLOCAMENTOS = [
  [-1, -1], [0, -1], [1, -1],
  [-1, 0], [1, 0],
  [-1, 1], [0, 1], [1, 1],
];

/** As adjacentes de (x, y) que existem no tabuleiro: 3 no canto, 5 na borda, 8 no meio. */
function vizinhancaDe(x, y) {
  return DESLOCAMENTOS
    .map(([dx, dy]) => [x + dx, y + dy])
    .filter(([vx, vy]) => vx >= 0 && vx < LARGURA && vy >= 0 && vy < ALTURA);
}

export class Campo {
  constructor({ semente, bombas } = {}) {
    this.grade = [];
    for (let y = 0; y < ALTURA; y += 1) {
      const linha = [];
      for (let x = 0; x < LARGURA; x += 1) {
        linha.push({ bomba: false, vizinhas: 0, revelada: false, bandeira: false });
      }
      this.grade.push(linha);
    }

    for (const [x, y] of bombas ?? sortearBombas(semente ?? 0)) {
      this.grade[y][x].bomba = true;
    }

    for (let y = 0; y < ALTURA; y += 1) {
      for (let x = 0; x < LARGURA; x += 1) {
        this.grade[y][x].vizinhas = vizinhancaDe(x, y)
          .filter(([vx, vy]) => this.grade[vy][vx].bomba).length;
      }
    }

    this.encerrado = false;
    this.vitoria = false;
    this.derrota = false;
  }

  estado() {
    const celulas = this.grade.flat();
    return {
      largura: LARGURA,
      altura: ALTURA,
      encerrado: this.encerrado,
      vitoria: this.vitoria,
      derrota: this.derrota,
      reveladas: celulas.filter((celula) => celula.revelada).length,
      bandeiras: celulas.filter((celula) => celula.bandeira).length,
      grade: this.grade.map((linha) => linha.map((celula) => ({ ...celula }))),
    };
  }
}
