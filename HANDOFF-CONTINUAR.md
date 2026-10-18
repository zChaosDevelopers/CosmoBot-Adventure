# CosmoBot — Handoff para continuar em outro chat

> Cole este arquivo no início do novo chat. Resumo do projeto + o que falta.

## O que é
**Aventuras do CosmoBot** — jogo educativo de **matemática básica** para crianças de
**6 a 10 anos**. Um robô conserta a nave em **8 etapas**, cada uma um desafio de conta.
Tudo deve ser **VISUAL** (a criança lê pouco): ícones, animações, pouca escrita.

- **Stack:** React (telas) + **Phaser 3** (jogo no canvas) + Vite. PWA (instalável/offline).
  Supabase é opcional (progresso). localStorage para preferências, badges e ranking.
- **Pasta autoritativa:** `C:\Users\Ryan.Gimenes\OneDrive - LELLO PRINT BRASIL COMERCIAL EIRELI - EPP\Área de Trabalho\Projeto Itineraio Game (2)\Projeto Itineraio Game`
  (a arte solta — `Foguete.png`, `logo-cruzeiro-do-sul-estrela-512.webp`, a folha de badges
  `Imagem do Codex ...png` — está na pasta pai `...\Projeto Itineraio Game (2)`).

## Como rodar (Windows)
O PowerShell bloqueia `npm` (execution policy). Contornos:
- **Build:** `node node_modules/vite/bin/vite.js build`
- **Dev:** `node node_modules/vite/bin/vite.js --port 5199`
- **Testes dos geradores:** `node scripts/test-geradores.mjs`
- (ou `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` para liberar o npm)

## Arquitetura / fluxo
`BootScene → HistoriaScene → SelecaoFasesScene (mapa/hub) → fase → volta ao mapa`.
Ao concluir as 8 → botão "Decolar" → `EstacaoScene` (celebração final).
- Telas React: `src/components/` (Menu, Avatar, Instrucoes, Acessibilidade, Creditos, **Ranking**, JogoCanvas).
- Cenas Phaser: `src/game/scenes/` (Boot, Historia, **SelecaoFases**, Estacao, Contagem, Soma,
  Subtracao, Multiplicacao, Divisao, **Comparacao**, **Sequencia**, **Desafio**, FaseBase, FaseDistribuir).
- `FaseBase.js` = base comum (cabeçalho, botões, timer, erros/estouro, dica, **conclusão+badge**).
- `FaseDistribuir.js` = base de Divisão+Multiplicação (arrastar em zonas iguais).
- Geradores de conta (JS puro, testável): `src/game/gerarRodadas.js`.
- Regras de badge (nível/pontos): `src/game/badges.js`. Ranking local: `src/lib/ranking.js`.
- Anti-spam de teclado: `src/game/teclado.js`. Assets opcionais: `src/game/assets.js`.

## As 8 fases
1 Contagem · 2 Soma · 3 Subtração · 4 Multiplicação · 5 Divisão · 6 Comparação (>,<,=) ·
7 Sequência/Padrão · 8 Desafio Final (boss misto, com contas maiores A+B+C e xx+xxx).

## JÁ FEITO (v2)
- Tela de **seleção de fases** (mapa) com travar/liberar/concluir; teclado (setas+Enter).
- **3 fases novas** jogáveis (Comparação, Sequência, Desafio Final).
- **Feedback do PORQUÊ visual** (divisão/mult piscam os grupos; comparação destaca o maior;
  sequência mostra setas "+passo").
- **Contas maiores** no boss + conta **destacada** num box.
- **Timer por fase → brilho da badge** (nível 1–4: Bronze/Prata/Ouro/Holográfica).
- **Sistema de badges** (registry + localStorage) + **arte** das 8 badges recortada em
  `public/assets/badge-1..8.png` (+ `badge-suprema.png`).
- **Ranking local** (`Ranking.jsx`, botão 🏆) + **regra de nome único** (nome sem espaços,
  case-insensitive; bloqueia mesmo nome+mesma cor de robô).
- Correção do bug: **spam de Enter pulava fases** (throttle compartilhado entre cenas).
- Fases de arraste têm timer (~12s) que troca a rodada; fases de opção têm 5 alternativas.
- Acessibilidade: contraste alto, fonte grande, narração (OFF por padrão), teclado, aria-live.
- Mobile básico (toque). `npm test` verde, `vite build` sem erros.

## O QUE FALTA
### Dependem de VOCÊ (arte/áudio)
- **Foguete de transição** + **estrela laranja** da Cruzeiro do Sul (o fogo). Arquivos já
  existem: `Foguete.png` e `logo-cruzeiro-do-sul-estrela-512.webp` (converter p/
  `public/assets/foguete.png` e `estrela-cs.png`). Remover o contador de ⭐ atual.
- **Trilha sonora** ~2 min em loop (`public/audios/musica-fundo.mp3`) + **ducking**
  (abaixa a trilha quando toca voz). Gerar por IA (Suno/Udio), royalty-free.
- **Narração** (gravar voz seguindo `public/audios/ROTEIRO-NARRACAO.md`) — opcional.

### Dependem de features já prontas
- **Badge SUPREMA** com histórico perfeito (o flag `perfeito` já é calculado no ranking;
  falta exibir/entregar a `badge-suprema.png`).
- Ranking: definir se sobe pro Supabase (global) — hoje é por aparelho.

### Complexos (decisões suas)
- **Personagem controlável** (vibe Pico Park: mover o CosmoBot pelo mapa com setas/toque).
- **Co-op 2 jogadores** (só no PC).
- **Tutorial interativo** no começo (mãozinha demonstrando).

## Regras/estilo a respeitar SEMPRE
- Público 6–10 anos: **visual, pouco texto**; nada punitivo.
- Narração **desligada** por padrão (só se o usuário ligar).
- Manter **build passando** e **`npm test` verde** a cada parte.
- Arte **original** (não copiar Pokémon nem terceiros).
- **"Fazer aos poucos"**, confirmando cada parte; salvar novos pedidos na memória.

## Gotchas técnicos
- O **preview congela o requestAnimationFrame** → animações por tempo (tweens/timers/confete)
  NÃO aparecem no screenshot; validar por build + lógica + telas React estáticas.
- `.ps1` com acento no caminho falha por encoding → rodar **PowerShell inline** para GDI+.
- Recorte de badges (referência): folha 1536×1024; centros cols=255,595,945,1285; rows=165,462;
  r=140; suprema em 518,608,500×400; máscara circular (elipse) via `Graphics.SetClip`.
