# desafio_teste_campo_minado

Casos de teste em JavaScript para um campo minado de **18 × 14 com 40 bombas**, construídos por TDD. O desafio pede os casos de teste; o modelo em `src/campo-minado.js` existe para que eles tenham o que testar, e foi escrito depois de cada teste, nunca antes.

## Colaborador

- **Samuel Fuentes Michels** — RA 24011114-2

Trabalho individual: todos os commits deste repositório são meus, e o histórico mostra um commit por ciclo de TDD.

## Como executar

```bash
node --test
```

Node 18 ou superior, **zero dependências** — só o executor de testes nativo (`node:test`) e `node:assert/strict`. Saída esperada:

```
# tests 58
# suites 12
# pass 58
# fail 0
```

---

## 1. Especificação do desafio

O enunciado é curto: *"casos de teste para testar campo minado de tabuleiro 18 x 14 com 40 bombas; casos de teste em Javascript para testar Javascript"*. Tudo o que vem abaixo é a especificação que os testes fixam — cada regra numerada aqui tem casos de teste correspondentes na seção 3.

### 1.1 Tabuleiro

- 18 colunas × 14 linhas = **252 células**, com **40 bombas** e, portanto, **212 células seguras**.
- Coordenadas são `(x, y)`: `x` é a coluna, de 0 a 17; `y` é a linha, de 0 a 13. A grade é indexada por `grade[y][x]`.
- Toda célula tem quatro atributos: `bomba`, `vizinhas`, `revelada` e `bandeira`. No início, nada está revelado e não há nenhuma bandeira.
- O sorteio das 40 bombas é feito a partir de uma **semente**: a mesma semente produz sempre o mesmo campo, sementes diferentes produzem campos diferentes.

### 1.2 Contagem das vizinhas

`vizinhas` é quantas bombas existem nas **8 células adjacentes** — e somente nelas. A vizinhança é recortada pelo tabuleiro:

| Posição | Vizinhos existentes |
|---|---:|
| canto | 3 |
| borda | 5 |
| meio | 8 |

Uma célula com bomba também recebe a contagem das suas vizinhas; ela só nunca é usada, porque pisar nela encerra o jogo.

### 1.3 Revelação e cascata

- Revelar uma célula **numerada** (`vizinhas > 0`) revela apenas ela.
- Revelar uma célula **vazia** (`vizinhas === 0`) propaga a revelação para as 8 adjacentes, e só as que também estão em zero continuam propagando. A cascata, portanto, **para nas numeradas**: elas entram, mas não espalham.
- A cascata **nunca revela uma bomba**. Isso não é um caso especial no código: uma célula em zero, por definição, não tem bomba por perto.
- Revelar uma célula já revelada não é erro e não altera nada.

### 1.4 Bandeira

- `alternarBandeira` marca e desmarca uma célula coberta.
- A bandeira **protege**: a célula marcada não pode ser revelada, e a cascata passa por ela sem descobri-la.
- A bandeira não altera a bomba nem a contagem da célula — é só uma anotação do jogador.

### 1.5 Recusas

Cinco situações são recusadas com exceção, e **nenhuma delas altera o estado**:

| Situação | Mensagem |
|---|---|
| coordenada fora do tabuleiro (`revelar` ou `alternarBandeira`) | `A coordenada (x, y) esta fora do tabuleiro.` |
| revelar célula com bandeira | `A celula (x, y) esta com bandeira: desmarque antes de revelar.` |
| marcar bandeira em célula já revelada | `A celula (x, y) ja esta revelada: nao aceita bandeira.` |
| revelar com o jogo encerrado | `O jogo esta encerrado (derrota).` ou `O jogo esta encerrado (vitoria).` |
| marcar bandeira com o jogo encerrado | idem |

### 1.6 A primeira revelação nunca é uma bomba

Perder na primeira jogada seria sorte, não jogo. Se a primeira célula revelada tiver bomba, a bomba é **movida** para a primeira célula livre na ordem de varredura — não apagada, para o total continuar em 40 — e as contagens de vizinhas são recalculadas. A proteção vale **só para a primeira jogada**: da segunda em diante, pisar numa bomba perde.

### 1.7 Fim de jogo

| Desfecho | Quando | O que acontece |
|---|---|---|
| **Derrota** | revelar uma bomba (da segunda jogada em diante) | todas as 40 bombas ficam reveladas, não só a pisada; as células seguras que estavam cobertas continuam cobertas |
| **Vitória** | as 212 células seguras reveladas | o jogo encerra; **não** é exigido marcar bandeira nas bombas, e as bombas ficam cobertas |

Faltando uma única célula segura, o jogo continua em andamento. Depois de encerrado, nenhuma revelação e nenhuma bandeira são aceitas.

---

## 2. O modelo testado

`src/campo-minado.js` (212 linhas, sem dependências) expõe:

```js
export const LARGURA = 18;
export const ALTURA = 14;
export const TOTAL_DE_BOMBAS = 40;

new Campo({ semente })             // campo sorteado, reproduzível
new Campo({ bombas: [[x, y]] })    // cenário montado à mão
campo.revelar(x, y)
campo.alternarBandeira(x, y)
campo.estado()                     // cópia do estado visível
```

Duas decisões existem **por causa dos testes**, e são o que torna o campo minado testável:

1. **Sorteio com semente** (mulberry32 + Fisher-Yates). Um `Math.random()` interno faria com que nenhum caso que dependa do campo sorteado rodasse igual duas vezes: um teste que falha hoje passaria amanhã. Com semente, o campo é um dado de entrada.
2. **Cenário injetado** (`bombas`). Verificar "a cascata para na coluna 4" num campo de 40 bombas sorteadas é adivinhação. Passando as bombas, o cenário é construído para isolar exatamente a regra em exame.

`estado()` devolve uma **cópia profunda** da grade: um teste que mexe no retorno não contamina o campo nem os testes seguintes — e existe um caso que prova isso.

---

## 3. Como funcionam os casos de teste

**58 casos em 12 suítes, 7 arquivos**, mapeados nas regras da seção 1:

| Arquivo | Casos | Regras que fixa |
|---|---:|---|
| [test/tabuleiro.test.js](test/tabuleiro.test.js) | 10 | 1.1 — dimensões, 252 células, 40 bombas, estado inicial, reprodutibilidade, cópia do estado |
| [test/vizinhas.test.js](test/vizinhas.test.js) | 7 | 1.2 — contagem com recorte de borda e canto, só as 8 adjacentes |
| [test/revelacao.test.js](test/revelacao.test.js) | 7 | 1.3 — revelação, cascata, onde ela para, recusas de coordenada |
| [test/bandeira.test.js](test/bandeira.test.js) | 9 | 1.4 e 1.5 — marcar, desmarcar, proteção contra revelação e cascata |
| [test/fim-de-jogo.test.js](test/fim-de-jogo.test.js) | 11 | 1.7 — derrota, vitória, jogo encerrado |
| [test/primeira-jogada.test.js](test/primeira-jogada.test.js) | 7 | 1.6 — proteção da primeira revelação e realocação da bomba |
| [test/partida-completa.test.js](test/partida-completa.test.js) | 7 | integração — invariantes conferidas jogada a jogada |
| **Total** | **58** | |

### 3.1 Três formas de examinar o mesmo campo

**(a) Caso unitário com cenário montado.** Uma parede de bombas na coluna 5, de cima a baixo, isola as colunas 0 a 4 — 70 células vazias — do resto do tabuleiro. Isso transforma "a cascata para no lugar certo" numa igualdade exata, e não numa impressão:

```js
  test("revelar uma celula vazia revela a regiao inteira em cascata", () => {
    const campo = paredeNaColuna5();

    campo.revelar(0, 0);

    assert.equal(campo.estado().reveladas, 70);
  });
```

O caso seguinte confere as duas bordas da mesma cascata: `grade[7][4]` (coluna 4, numerada) entra, `grade[7][6]` (do outro lado da parede) não.

**(b) Varredura sobre todas as posições de uma semente.** Alguns casos não examinam uma célula escolhida, e sim todas: `nenhuma das 40 bombas da semente 1 perde se for a primeira jogada` constrói 40 campos e revela, em cada um, uma bomba diferente como primeira jogada. Um `if` errado na proteção da primeira revelação passaria num exemplo só; não passa em 40.

**(c) Partida completa com invariantes.** [test/partida-completa.test.js](test/partida-completa.test.js) não verifica quem ganhou. Ele joga partidas inteiras com um solucionador determinístico e, **a cada jogada**, confere o que tem de ser verdade em qualquer momento de qualquer partida:

- o tabuleiro continua com 252 células e **40 bombas** (a realocação move, não cria nem apaga);
- `reveladas` e `bandeiras` batem com a varredura da grade;
- `vizinhas` de **todas as 252 células** continua igual à contagem das bombas adjacentes;
- nunca há vitória e derrota ao mesmo tempo;
- **nenhuma bomba aparece revelada enquanto o jogo não foi perdido**:

```js
  if (!estado.derrota) {
    assert.ok(
      celulas.every((celula) => !(celula.bomba && celula.revelada)),
      `${onde}: bomba revelada sem derrota`,
    );
  }
```

Conferir só o resultado final deixaria passar um erro que aparece no meio da partida e se conserta sozinho depois. A mensagem de cada asserção carrega o número da jogada, então a falha já diz onde olhar.

O solucionador lê **apenas o que um jogador veria** — `revelada`, `bandeira` e a contagem das células já reveladas — e nunca o campo `bomba` das células cobertas; se lesse, não estaria jogando, estaria trapaceando. Ele aplica as duas deduções clássicas do campo minado:

```js
      if (marcados.length === celula.vizinhas) {
        return { tipo: "revelar", celula: cobertos[0].xy };
      }
      if (marcados.length + cobertos.length === celula.vizinhas) {
        return { tipo: "bandeira", celula: cobertos[0].xy };
      }
```

Sem dedução disponível, ele chuta a primeira célula coberta — e aí pode perder, como um jogador. Sobre as 20 sementes, isso dá **5 vitórias e 15 derrotas**, medido e fixado num caso de teste: se um dos dois desfechos deixasse de acontecer, os dois casos que verificam derrota e vitória passariam no vácuo, sem nunca entrar no ramo que examinam.

### 3.2 O que o RED mostrou, ciclo por ciclo

Cada ciclo é um commit, e a suíte foi executada **antes** de cada implementação. Os números abaixo são de execução real, reproduzíveis rodando os testes de um commit contra o `src/` do commit anterior:

| Ciclo | Commit | Casos na suíte | Falharam | Observação |
|---|---|---:|---:|---|
| 1 — tabuleiro 18 × 14 | `36295df` | 1 | 1 | nada existia: o próprio `import` falha |
| 2 — contagem das vizinhas | `dba308b` | 17 | 7 | os 7 casos novos falharam |
| 3 — revelação e cascata | `af43add` | 24 | 7 | os 7 casos novos falharam |
| 4 — bandeira | `3ff7cfc` | 33 | 9 | os 9 casos novos falharam |
| 5 — derrota e vitória | `7d4d716` | 43 | 8 | **2 dos 10 casos novos já passavam** |
| 6 — primeira jogada protegida | `80dcb0f` | 50 | 4 | **3 dos 7 casos novos já passavam** |
| 7 — partida completa | `f8ffc51` | 58 | 3 | nenhum código de produção novo; ver 3.3 |

**Os cinco casos que passaram no vácuo.** Passar no RED não é sinal de teste bom, é um alerta: o comportamento ainda não existia, e a asserção coincidiu com o que o código já fazia.

| Caso | Por que passou sem a implementação |
|---|---|
| `a bomba continua coberta depois da vitoria` | nada revelava bomba ainda, então "continua coberta" era o estado trivial |
| `faltando uma celula segura o jogo continua em andamento` | o jogo nunca encerrava, então "continua em andamento" era sempre verdade |
| `a bomba e realocada, nao apagada: o total se mantem` | sem realocação nenhuma, o total obviamente se mantinha |
| `a primeira jogada numa celula livre nao mexe nas bombas` | sem realocação, nada mexia nas bombas em nenhuma jogada |
| `a protecao vale so para a primeira jogada: a segunda pode perder` | sem proteção, qualquer jogada perdia — inclusive a segunda |

Os cinco continuam na suíte, porque agora o que eles medem não é mais trivial: o primeiro e o terceiro **matam mutantes** (M8 e M7 na tabela abaixo), e os outros dois delimitam o alcance da regra. Mas nenhum deles, isolado, prova nada — o que prova é o conjunto, e é por isso que a próxima medida existe.

**Dois cenários de teste precisaram ser corrigidos — e o código de produção estava certo nas duas vezes.** As duas correções estão no histórico e são a parte mais útil do processo:

1. Depois do ciclo 5, `nao se marca bandeira em celula ja revelada` passou a falhar com `/encerrado/` em vez de `/revelada/`. Motivo: o cenário tinha uma bomba só, então revelar uma célula cascateava sobre todas as seguras e **ganhava o jogo** antes da asserção. O cenário virou `bombas: [[0, 0], [9, 8]]`, com a bomba vizinha deixando a célula numerada, sem cascata.
2. Depois do ciclo 6, os cinco casos de derrota quebraram: todos pisavam numa bomba **na primeira jogada**, que a proteção nova realoca. O cenário passou a gastar a primeira revelação em (1,1), célula numerada que não espalha cascata.

Nas duas vezes a regra nova invalidou um cenário antigo sem que a implementação estivesse errada. É o sinal de que os cenários eram frágeis, e não de que as regras conflitam.

**Teste de mutação: 12 defeitos plantados, 12 mortos.** Contar casos verdes não mede nada; o que mede é se o teste falha quando o código está errado. Cada mutante é uma alteração mínima em `src/campo-minado.js`, com a suíte rodando em seguida:

| # | Defeito plantado | Casos que falharam |
|---|---|---:|
| M1 | um vizinho diagonal a menos na contagem | 16 |
| M2 | `vx < LARGURA` → `vx <= LARGURA` (off-by-one na borda) | 58 |
| M3 | a cascata não para nas células numeradas | 22 |
| M4 | a cascata ignora a bandeira | 1 |
| M5 | `revelar` ignora a bandeira | 2 |
| M6 | primeira jogada sem proteção | 5 |
| M7 | a realocação apaga a bomba em vez de mover | 5 |
| M8 | a vitória exige revelar também as bombas | 7 |
| M9 | sorteia 39 bombas em vez de 40 | 8 |
| M10 | bandeira aceita em célula já revelada | 1 |
| M11 | a derrota não põe as bombas à mostra | 4 |
| M12 | a realocação não recalcula as contagens | 4 |

Nenhum mutante sobreviveu. Os de **uma única falha** (M4, M10) são os mais informativos: existe exatamente um caso guardando cada uma dessas regras, e a suíte não teria detectado o defeito se ele não existisse.

### 3.3 O que o teste de integração revelou

O ciclo 7 não acrescentou nenhuma linha de produção, mas falhou — e a falha foi útil:

```
jogada 8: existe celula revelada e com bandeira ao mesmo tempo
```

O solucionador marca bandeiras e, nessa partida, perdeu depois. Na derrota o tabuleiro se abre e **todas as bombas ficam reveladas, inclusive as que já estavam marcadas** — então `revelada` e `bandeira` coexistem. Nenhum caso unitário havia dito nada sobre isso: a regra existia no código sem estar escrita em teste nenhum.

A invariante estava grosseira, não o código. Ela foi reescrita para dizer a regra verdadeira, que é mais forte do que a original:

```js
  assert.ok(
    celulas.every((celula) => !(celula.revelada && celula.bandeira) || (celula.bomba && estado.derrota)),
    `${onde}: celula revelada e com bandeira fora da derrota`,
  );
```

Revelada e com bandeira ao mesmo tempo é legítimo **só depois da derrota, e só sobre bomba**; em qualquer outra situação seria a bandeira falhando em proteger a célula. E a regra ganhou o caso unitário que nunca tinha tido, `a bandeira correta continua marcada sobre a bomba revelada`: quem acertou a marcação continua marcado quando o tabuleiro se abre.

---

## Resultado final

```
# tests 58
# suites 12
# pass 58
# fail 0
```

| Medida | Valor |
|---|---|
| Casos de teste | 58, em 12 suítes e 7 arquivos |
| Linhas de teste / de produção | 733 / 212 |
| Dependências | nenhuma |
| Ciclos de TDD (um commit cada) | 7 |
| Casos que passaram no RED (vácuo) | 5, todos documentados em 3.2 |
| Mutantes mortos | 12 / 12 |
| Regras descobertas pelo teste de integração | 1 (bandeira correta na derrota) |
