# QA das fases 6, 7 e 8 — Comparação, Sequência e Desafio Final

> Executado em 01/10/2026 (v0.3.2), no navegador, com o jogo **mutado**.
> O relatório de QA anterior (`QA-status.md`) só cobria as 5 primeiras fases;
> este fecha a lacuna das três últimas.

## Como foi testado

O preview congela o `requestAnimationFrame`, então cliques e transições "ao vivo"
não registram. Para ter um resultado **determinístico**, o teste:

- avançou o loop do Phaser à mão, em passos de **16 ms**
  (saltos grandes não funcionam: o Phaser clampa deltas altos para evitar
  travamento, e o tempo da cena simplesmente não anda);
- acionou os botões pelo **caminho real do toque** — o `pointerdown` do retângulo
  invisível que é a área de clique —, não chamando os métodos da cena por dentro;
- leu o estado da cena (`rodada`, `rodadaAtual`, `erros`, `vida`, `registry`)
  para confirmar cada efeito.

## Resultado por fase

| Fase | Caminho de acerto | Caminho de erro | Teclado | Veredito |
|---|---|---|---|---|
| 6 — Comparação | ✅ 4/4 rodadas, conclusão com 3⭐ | ✅ | ✅ | **Passou** |
| 7 — Sequência | ✅ 4/4 rodadas, conclusão com 3⭐ | ✅ | ✅ | **Passou** |
| 8 — Desafio Final | ✅ 6/6 rodadas, guardião derrotado | ✅ | ✅ | **Passou** |

### Fase 6 — Comparação (>, <, =)

Quatro rodadas jogadas até a conclusão. Em todas:

- o sinal correto **bate com os números** (`a > b → ">"`, `a < b → "<"`, `a = b → "="`);
- a quantidade de bolinhas desenhadas **confere** com os números mostrados
  (ex.: `4 < 6` desenhou 4 e 6 bolinhas);
- as opções são sempre `>`, `<`, `=`.
- Conclusão registrou `estrelas[5] = 3` e badge nível 4.

### Fase 7 — Sequência / Padrão

Quatro rodadas até a conclusão. Em todas:

- a sequência mostrada é **regular** (toda diferença entre termos vizinhos é igual ao passo);
- a resposta certa é mesmo `último termo + passo`;
- a resposta certa **está entre as opções** (checado: já apareceu em 1ª, 3ª e 5ª posição);
- 4 caixas e 3 setas "+passo" montadas corretamente.
- Conclusão registrou `estrelas[6] = 3`.

### Fase 8 — Desafio Final (boss)

Seis rodadas até derrotar o guardião. As contas vieram **mistas**, como previsto
(`9+5+9`, `94+174`, `61−53`, `7×3`, `2+4+9`, `42÷6`) e todas com o resultado certo
entre as opções. A barra de vida caiu proporcionalmente (1.00 → 0.83 → 0.67 → 0.50
→ 0.33 → 0.17) e o guardião sumiu ao zerar. Conclusão registrou `estrelas[7] = 3`.

### Nada punitivo (a regra mais importante)

- **Comparação e Sequência:** ao errar 3 vezes, as bolinhas estouram e a pergunta
  é **trocada por uma mais fácil** — a criança segue na mesma rodada, sem perder
  nada. Verificado: `6 ? 4` virou `2 ? 2`; `[12,14,16]` virou `[6,7,8]`.
- **Desafio:** ao errar 3 vezes **a resposta é revelada** e o jogo avança
  (`8 + 2 + 3 = 13` apareceu em amarelo e a rodada passou). Nunca trava.
- Em nenhum caso houve game over. Os erros só contam para a nota (estrelas).

### Teclado e acessibilidade

- As três fases começam com **`focoIndex = -1`**: um Enter avulso (inclusive
  herdado da tela anterior) não responde a conta sozinho. ✅
- Seta → move o foco; Enter responde o botão focado. ✅
- **Enter segurado** (evento com `repeat: true`) é ignorado nas três. ✅
- O anti-spam de 450 ms é **compartilhado entre as cenas** (`registry`), de propósito:
  uma rajada de Enters não atravessa telas. Isso faz com que dois Enters em cenas
  diferentes num intervalo curto só valham uma vez — comportamento correto, mas é
  bom saber ao testar (foi o que me fez suspeitar de um bug inexistente na Sequência).

### Dica

- `mostrarDica` começa **falso** e vira verdadeiro depois dos 3 erros (ou na estreia
  do jogo); só então o botão 💡 aparece. Confirmado nas fases 6 e 7.
- A dica da Comparação conta os dois lados **sem apontar o maior**; a da Sequência
  acende as setas "+passo" **sem dar o número final**. Ambas ensinam o método.
- O Desafio **não tem botão de dica** — por design, quem ajuda ali é a revelação
  após 3 erros.

## Achado corrigido nesta rodada

**`disableInteractive()` nos botões de resposta não tinha efeito.**
Depois que o hitbox virou um retângulo invisível *filho* do container (correção
anterior, commit `fe0c26e`), o `botao.disableInteractive()` que as cenas chamam ao
travar as respostas passou a agir no container — não no retângulo que realmente
escuta o toque. Resultado: depois de responder, os botões continuavam com cursor
de mãozinha e acendendo no hover.

Não era um furo de resposta (o `this.bloqueado` da `FaseBase` já barrava a
segunda resposta), e sim de acabamento. Corrigido em `desenho.js`: o
`disableInteractive()` do container agora repassa para o retângulo. Verificado nas
três fases — depois de acertar, nenhum botão continua clicável.

## Observações (não são bugs, ficam registradas)

- **Fonte externa:** o jogo carrega a Fredoka do Google Fonts. Sem internet (ou no
  painel de teste, que não tem rede externa) ela falha e o texto cai na fonte de
  reserva. Não quebra nada, mas o PWA promete funcionar offline e o visual muda
  nesse caso. Se quiser fechar isso, dá para embutir a fonte em `public/` e
  colocá-la no precache.
- O `DesafioScene` não chama `pararTimerRodada()` ao acertar, diferente das outras
  fases. Não causou efeito observável nos testes (a conclusão registrou tempo e
  nível corretos), mas vale olhar se um dia o cronômetro por rodada mudar.
