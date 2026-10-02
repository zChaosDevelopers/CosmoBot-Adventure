# CosmoBot — Handoff para continuar em outro chat

> Cole/aponte este arquivo no início do novo chat. **Atualizado em 01/10/2026 — v0.3.1.**
> Leia primeiro a seção **▶ CONTINUAR AQUI** — é o que está pendente agora.

---

## ▶ CONTINUAR AQUI (pedidos em aberto do usuário)

O usuário pediu, nesta ordem, para o próximo chat executar (pode fazer autônomo,
confirmando pouco; **ele não quer ouvir o barulho dos testes** — ver "Testar sem som"):

1. **🏆 Ranking GLOBAL (Supabase)** — "deixe global, faça pra mim o ranking".
   - Hoje o ranking é LOCAL (`src/lib/ranking.js`, localStorage `cosmobot.ranking`),
     exibido em `src/components/Ranking.jsx` (síncrono, `listarRanking()`).
   - O projeto JÁ tem `@supabase/supabase-js` como dependência e um client em
     `src/lib/supabase.js` que fica **null** se faltar env var (não quebra o jogo).
   - **Plano:** criar no Supabase a tabela `ranking` e fazer o ranking ler/gravar nela
     quando configurado, com **fallback para o localStorage** quando `supabase` for null.
     - Gravar (upsert por `chave` = `normalizar(nome)+'|'+icone`) o MELHOR resultado;
       chamar fire-and-forget em `FaseBase.concluirEtapa` (onde hoje chama
       `atualizarPontuacao`). Campos: `chave` (PK), `nome`, `icone`, `pontos`,
       `estrelas`, `badges`, `perfeito`, `quando`.
     - Ler global: `select * order by pontos desc limit 50`. Tornar o `Ranking.jsx`
       assíncrono (useEffect + useState), com loading e fallback local.
   - **Depende do usuário (avisar):** criar/usar um projeto Supabase, rodar o SQL da
     tabela `ranking` (com RLS: permitir `select` e `insert/upsert` anônimo), e definir
     `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` no `.env` local E nas Environment
     Variables da **Vercel**. Entregar o SQL pronto + instruções.

2. **🤖 Personagem controlável no mapa (re-adicionar com segurança)** — "faça".
   - Já foi tentado e **REMOVIDO** porque o CosmoBot em cima do planeta interceptava o
     clique (a fase não selecionava). Ver commit `fe0c26e`.
   - **Refazer SEM bloquear o clique:** garantir que o sprite do CosmoBot e TODOS os
     filhos sejam **não-interativos** (objeto não-interativo no Phaser NÃO consome o
     pointer, independente da profundidade). Conferir `criarPersonagem` em
     `src/game/desenho.js` — se ele cria filhos interativos (hover "plim"), criar uma
     versão simples/estática para o mapa OU dar `disableInteractive()` em tudo.
   - Mecânica: setas movem o CosmoBot entre os planetas liberados (anel de foco segue);
     Enter/toque entra na fase. Mantê-lo acima dos planetas (depth alto) mas inerte ao
     clique. Testar que o toque no planeta continua selecionando.

3. **👥 Co-op 2 jogadores (PC)** — "faça".
   - **PENDENTE DE DESIGN:** co-op não mapeia óbvio num jogo de contas. O chat atual ia
     perguntar o estilo antes de construir (versus/competitivo x cooperativo x turnos).
     No novo chat, **alinhar o estilo com o usuário** antes de implementar (é grande e
     mexe em todas as fases — alto risco). Sugestão: começar simples (ex.: versus na
     fase de opção — quem acerta primeiro) e só expandir depois.

4. **✨ Acabamento** — "melhore com o que está no acabamento":
   - **Otimizar imagens** (carregam pesado no celular): `public/assets/badge-1..8.png`
     (~145 KB cada) e `badge-suprema.png` (~450 KB). Comprimir/reduzir resolução sem
     perder qualidade perceptível.
   - **Nova rodada de QA nas fases 6–8** (Comparação, Sequência, Desafio) — o relatório
     de QA só cobriu as 5 primeiras. Testar e gerar mini-relatório.
   - Mais polish/juice (transições, celebrações) e, se der, tutorial passo-a-passo por
     tipo de fase (hoje é só uma demonstração automática simples na 1ª fase).

---

## O que é
**Aventuras do CosmoBot** — jogo educativo de matemática para crianças de **6 a 10 anos**.
Um robô conserta a nave em **8 fases**, cada uma um desafio de conta. Tudo é **VISUAL**
(pouco texto), nada punitivo.

- **Stack:** React (telas) + **Phaser 3** (jogo) + Vite. PWA. Supabase opcional.
- **Repo:** https://github.com/zChaosDevelopers/CosmoBot-Adventure (branch `main`,
  commit direto, sem PR). **Já está na Vercel (online há tempo).**
- **Pasta:** `C:\Users\...\Área de Trabalho\Projeto Itineraio Game`

## Como rodar (Windows) — o PowerShell bloqueia `npm`, use `node`:
- Build: `node node_modules/vite/bin/vite.js build`
- Dev: `node node_modules/vite/bin/vite.js --port 5199`
- Testes dos geradores: `node scripts/test-geradores.mjs`
- `.claude/launch.json` já roda o Vite via `node`.

## Arquitetura / fluxo
`Boot → Historia → SelecaoFasesScene (mapa) → fase → volta ao mapa`. Ao concluir as 8 →
"Decolar" → `EstacaoScene` (celebração: foguete decola com rastro de estrelas laranja).
- Telas React: `src/components/` (Menu, Avatar, Instrucoes, Acessibilidade, Creditos, Ranking, JogoCanvas).
- Cenas Phaser: `src/game/scenes/` (Boot, Historia, SelecaoFases, Estacao, Contagem, Soma,
  Subtracao, Multiplicacao, Divisao, Comparacao, Sequencia, Desafio, FaseBase, FaseDistribuir).
- `FaseBase.js` = base comum (cabeçalho, botões, timer, erros/estouro, dica, tutorial,
  teclado, conclusão+badge). `FaseDistribuir.js` = base de Divisão+Multiplicação.
- `gerarRodadas.js` (geradores puros, testados), `badges.js`, `lib/ranking.js` (local),
  `game/teclado.js` (`podeAgir` = anti-spam), `game/assets.js` (assets opcionais).
- Config das cenas (array `scene:`) e mapa tipoPuzzle→cena: `src/game/config.js`.

## As 8 fases
1 Contagem · 2 Soma · 3 Subtração · 4 Multiplicação · 5 Divisão · 6 Comparação (>,<,=) ·
7 Sequência/Padrão · 8 Desafio Final (boss "Guardião" com barra de vida).

## Feito nas sessões recentes (commits em `main`, mais novos primeiro)
- `b472022` ativarFoco não consome o anti-spam quando não há botão focado (fix de regressão)
- `fe0c26e` **Correções de bugs** (relatados pelo usuário e verificados com o jogo MUTADO):
  - Hitbox dos botões: o botão INTEIRO responde ao clique (antes só o meio). Trocado o
    hitArea do Container por um **retângulo invisível filho** (em `criarBotao`, desenho.js).
  - Enter repetido não passa mais a fase sozinho: Soma/Subtração/Mult/Divisão usam
    `podeAgir()` no Enter/Espaço (ignora tecla segurada + throttle 450ms).
  - Teclado após o campo de apelido: `Avatar.jsx` dá blur no input e `JogoCanvas.jsx` foca
    o canvas ao abrir o jogo.
  - Conta do Desafio maior (46px) e mais pra cima (y 296).
  - **Personagem controlável REMOVIDO** (bloqueava o clique) — a ser refeito (item 2 acima).
- `7b6affe` handoff · `5a2e35d` juice · `f9a01e0` doc QA · `87569f5`/`9c29abd` teclado Avatar
- `c555a78` foguete + badge suprema + **correção crítica**: 4 cenas estavam importadas mas
  fora do array `scene:` do config.js (o jogo quebrava após a história). Corrigido.

### Estado verificado (tudo com o jogo MUTADO, de forma determinística)
Teclado no jogo OK; seleção de fase OK (sem cosmo); Enter-spam bloqueado; hitbox cheia;
conta do Desafio maior. Fases 6–8 abrem e funcionam. Build + `test-geradores` verdes.

## Pendências que dependem do usuário (arquivo/decisão)
- 🎵 **Música de fundo + ducking:** falta o `public/audios/musica-fundo.mp3` (gerar por IA).
  O código do sistema de música ainda NÃO foi feito (o usuário pediu pra deixar pra depois).
- 🎙️ Narração gravada (opcional; roteiro em `public/audios/ROTEIRO-NARRACAO.md`).
- ☁️ Supabase para o **ranking global** (ver item 1 — precisa do projeto + env vars).

## Testar sem som (o usuário não quer ouvir o jogo)
- No navegador de teste: `localStorage.setItem('somLigado','false')` e recarregar — muta
  TODOS os efeitos (o `master gain` vira 0 em `sfx.js`). Só afeta o navegador de teste; o
  jogo continua com som ligado por padrão para os usuários.
- O **preview congela o requestAnimationFrame** → cliques/teclas AO VIVO e transições
  (`scene.start` via delayedCall) NÃO registram no preview. Verifique de forma
  DETERMINÍSTICA: `window.__jogo` (só em DEV), disparando os eventos do Phaser
  (ex.: `hit.emit('pointerdown')`, `est.input.keyboard.emit('keydown-ENTER',{repeat:false})`)
  e lendo o estado (`est.bloqueado`, `est.nucleo.itens.length`, `registry`). No navegador
  real / Vercel tudo roda normal.

## Deploy (Vercel) — já online
- Conectado ao GitHub; cada `git push` na `main` rebuilda e publica sozinho.
- `base: "./"` no `vite.config.js` faz funcionar no iframe do Cruzeiro HUB.
- Para o ranking global: adicionar `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` em
  Project → Settings → Environment Variables (e no `.env` local). `.env` não vai pro git.

## Regras/estilo a respeitar SEMPRE
- Público 6–10 anos: visual, pouco texto, **nada punitivo** (erro só dá dica gentil após 3
  erros, nunca game over). Narração OFF por padrão. Arte original.
- **A dica ensina o método, nunca entrega a resposta** (Contagem conta junto sem mostrar o
  número; Comparação conta os dois lados sem apontar o maior).
- Manter as 3 formas de interagir (arraste, toque, teclado) e a acessibilidade.
- **Fazer aos poucos, confirmando cada parte;** build + `npm test` verdes a cada etapa.
- Botões agem no `pointerdown` (ver `criarBotao`) — não voltar para `pointerup`.

## Gotchas técnicos
- PowerShell bloqueia `npm` → usar `node` (ver "Como rodar").
- webp → png: GDI+ não lê webp; usar WIC do WPF (`Add-Type -AssemblyName PresentationCore`
  + `BitmapDecoder`/`PngBitmapEncoder`).
- Assets são opcionais (HEAD check em `JogoCanvas.jsx` → `assets.js` → `BootScene`): pôr em
  `public/assets/`, registrar em `assets.js`, usar `textures.exists(chave)` com fallback.
- Nome único no ranking: cada (apelido + cor do robô) só existe 1x por aparelho; ao testar,
  varie nome/cor ou limpe o localStorage `cosmobot.ranking`.
- Cliques via ferramenta no preview usam o frame do screenshot (800x600), que NÃO mapeia
  1:1 no canvas real (escala/letterbox) — por isso prefira os emitters do Phaser p/ testar.

## Testar uma fase específica (DEV, console do navegador)
```js
const g = window.__jogo;
g.registry.set('indiceFase', 7);           // 0..7 (7 = Desafio Final)
g.scene.getScenes(true).forEach(s => g.scene.stop(s.scene.key));
g.scene.start('DesafioScene');
```
