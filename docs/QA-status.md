# Análise do Relatório de QA — respostas às pendências

> Refere-se ao **"Relatório de teste de qualidade de software — Aventura CosmoBot"**,
> versão 0.2.0, executado por Gustavo Alves da Silva em 22/09/2026 (Debian/CLI).
> Este documento mapeia cada achado (NOK / Não Realizado) do relatório ao seu
> **status atual** no código (v0.3.0). Atualizado em 28/09/2026.

O relatório fechou com **78,95% aprovados, 16,67% NOK, 5,26% não realizados**. Os
NOK eram 3 itens (etapas 6, 13 e 15) e 1 não realizado (etapa 14). Abaixo, o que
cada um era e como está agora.

| Etapa | Achado do QA (v0.2.0) | Status (v0.3.0) | O que foi feito |
|---|---|---|---|
| 6 | **Teclado:** após clicar no campo de Apelido, não dava para acionar "Começar" pelo teclado (← → Enter). | ✅ **Corrigido** | `Avatar.jsx`: Enter no campo de apelido já inicia o jogo; setas (←→↑↓) navegam entre as cores do robô, movendo seleção e foco. |
| 13 | **Hitbox (mouse):** ao passar a seta por cima, às vezes não reconhecia; e dava para acionar uma ação com a seta sobre **outra** ação. | ✅ **Corrigido / mitigado** | A causa principal do "clicar em cima de outra ação" era o **botão de dica sobreposto ao 1º botão de resposta** — o botão de dica foi movido para a lateral direita (meia-altura), sem sobreposição. A área clicável dos botões (`criarBotao`) já é generosa (maior que o visual) e o `JogoCanvas` recalcula os limites de clique em resize/scroll/carregamento de fonte. |
| 15 | **Sobreposição:** "ícone de ajuda no canto inferior esquerdo em sobreposição com o ícone de resposta"; e "ao pressionar Enter a contagem ocorre de forma automática". | ✅ **Corrigido** | (1) Botão de dica reposicionado para a lateral direita (fim da sobreposição). (2) Os botões de resposta agora começam **sem foco** (`focoIndex = -1`); assim um Enter avulso (inclusive herdado da tela anterior) **não responde a conta sozinho** — o foco só aparece ao usar as setas ou o mouse. |
| 14 | **iframe do Cruzeiro HUB:** não realizado (não testado no ambiente do HUB). | ⏳ **Pendente (precisa de deploy)** | O projeto usa `base: "./"` no Vite justamente para funcionar dentro de iframe. A verificação real depende de subir na Vercel (top-level) e embutir o link `...vercel.app` no `<iframe>` do HUB. Recomendado testar após o deploy. |

## Extras entregues junto (não estavam no QA v0.2.0)

- **A dica não entrega mais a resposta** (pedido do cliente): na Contagem, conta
  uma luz por vez **sem mostrar o número**; na Comparação, conta os dois lados
  **sem destacar o maior**. Ensinam o método; a criança conclui.
- **Tutorial de primeira vez:** na estreia (1ª fase, uma vez por aparelho) o jogo
  demonstra a jogada sozinho, de forma visual.
- **Correção crítica** (fora do QA, encontrada depois): 4 cenas (mapa de fases,
  Comparação, Sequência, Desafio) estavam importadas mas fora do array `scene:`
  do `config.js` — o jogo quebrava após a história. Corrigido.

## Observações

- O relatório é da **v0.2.0 (5 fases)**; o jogo hoje é **v0.3.0 (8 fases)**. Vale
  uma nova rodada de QA cobrindo as fases novas (Comparação, Sequência, Desafio) e
  o fluxo do mapa de seleção.
- Sugestão para o próximo QA: testar também no **iframe do HUB** (etapa 14) e em
  **tablet/celular real** (o público-alvo).
