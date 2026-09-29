# CosmoBot — Handoff para continuar em outro chat

> Cole este arquivo (ou aponte para ele) no início do novo chat. Ele resume o
> projeto, o estado atual e o que falta. **Atualizado em 29/09/2026 — v0.3.0.**

## O que é
**Aventuras do CosmoBot** — jogo educativo de **matemática básica** para crianças de
**6 a 10 anos**. Um robô conserta a nave em **8 fases**, cada uma um desafio de conta.
Tudo é **VISUAL** (a criança lê pouco): ícones, animações, pouca escrita, nada punitivo.

- **Stack:** React (telas) + **Phaser 3** (jogo no canvas) + Vite. PWA (instalável/offline).
  Supabase é opcional (progresso). localStorage para preferências, badges, ranking e tutorial.
- **Repositório:** https://github.com/zChaosDevelopers/CosmoBot-Adventure (branch `main`).
  O time commita **direto na `main`** (sem PR).
- **Pasta do projeto (Windows):**
  `C:\Users\...\Área de Trabalho\Projeto Itineraio Game`

## Como rodar (Windows) — IMPORTANTE
O PowerShell bloqueia `npm` (execution policy). Rode via `node` direto:
- **Build:** `node node_modules/vite/bin/vite.js build`
- **Dev:** `node node_modules/vite/bin/vite.js --port 5199`
- **Testes dos geradores:** `node scripts/test-geradores.mjs`
- (Alternativa: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` libera o npm.)
- O `.claude/launch.json` já está configurado para rodar o Vite via `node`.

## Arquitetura / fluxo
`BootScene → HistoriaScene → SelecaoFasesScene (mapa/hub) → fase → volta ao mapa`.
Ao concluir as 8 → botão "Decolar" → `EstacaoScene` (celebração final, a nave decola).
- **Telas React:** `src/components/` (Menu, Avatar, Instrucoes, Acessibilidade, Creditos, Ranking, JogoCanvas).
- **Cenas Phaser:** `src/game/scenes/` (Boot, Historia, **SelecaoFases**, Estacao, Contagem, Soma,
  Subtracao, Multiplicacao, Divisao, **Comparacao**, **Sequencia**, **Desafio**, FaseBase, FaseDistribuir).
- `FaseBase.js` = base comum (cabeçalho, botões, timer, erros/estouro, dica, **tutorial**, conclusão+badge).
- `FaseDistribuir.js` = base de Divisão+Multiplicação (arrastar em zonas iguais).
- Geradores de conta (JS puro, testável): `src/game/gerarRodadas.js`.
- Badges (nível/pontos): `src/game/badges.js`. Ranking local: `src/lib/ranking.js`.
- Anti-spam de teclado: `src/game/teclado.js` (`podeAgir`). Assets opcionais: `src/game/assets.js`.
- Config das cenas (array `scene:`) e mapa tipoPuzzle→cena: `src/game/config.js`.

## As 8 fases
1 Contagem · 2 Soma · 3 Subtração · 4 Multiplicação · 5 Divisão · 6 Comparação (>,<,=) ·
7 Sequência/Padrão · 8 Desafio Final (boss "Guardião" com barra de vida, contas maiores).

## JÁ FEITO e testado (v0.3.0)
- 8 fases jogáveis + **mapa de seleção** (travar/liberar/concluir) + teclado.
- **Sistema de badges** (Bronze/Prata/Ouro/Holográfica por rapidez+acertos) com arte em
  `public/assets/badge-1..8.png`.
- **Badge Suprema** (`badge-suprema.png`): entregue na celebração final com histórico
  perfeito (todas as fases nível 4). Ver `EstacaoScene.revelarSuprema`.
- **Ranking local** (`Ranking.jsx`) com regra de nome único (nome sem espaços + cor do robô).
- **Foguete + estrela laranja (Cruzeiro do Sul)** na decolagem: foguete grande e animado
  (decola de baixo, flutua, balança, inclina) com rastro de estrelas laranja como "fogo".
  Arte em `public/assets/foguete.png` e `estrela-cs.png`.
- **Personagem controlável no mapa (vibe Pico Park):** o CosmoBot fica no planeta em foco e
  VOA para o próximo com as **setas**; ao escolher (toque ou Enter) ele voa e entra na fase.
  Rastro de estrelinhas ao voar + faísca ao pousar. Foguete decorativo cruza o fundo.
- **Tutorial de primeira vez:** na estreia (1ª fase, 1x por aparelho via localStorage
  `cosmobot.tutorial`) o jogo demonstra a jogada sozinho (visual).
- **Dica (💡):** fica na **lateral direita** (não sobrepõe respostas) e **NÃO entrega a
  resposta** (Contagem conta uma luz por vez sem mostrar o número; Comparação conta os dois
  lados sem apontar o maior). Aparece após 3 erros (ou desde o início na 1ª fase/tutorial).
- **Teclado:** botões de resposta começam **sem foco** (Enter não responde sozinho); na tela
  de Avatar, Enter começa o jogo e as setas navegam as cores do robô.
- Acessibilidade: contraste alto, fonte grande, narração (OFF por padrão), teclado (H = dica),
  aria-live (`src/lib/anunciar.js`). PWA (vite-plugin-pwa).
- **Build e `npm test` (geradores) verdes.**

## Feito NESTA sessão (commits em `main`, mais recentes primeiro)
- `5a2e35d` Juice: rastro de estrelinhas ao voar + faísca ao pousar (mapa)
- `5c96f8f` Mapa: CosmoBot controlável (Pico Park) + foguete decorativo
- `f9a01e0` Documenta análise do relatório de QA (`docs/QA-status.md`)
- `87569f5` Avatar: setas navegam as cores (a11y teclado)
- `9c29abd` Avatar: Enter no apelido começa o jogo
- `6f0f167` Dica reposicionada + não entrega resposta; Enter não responde sozinho; limpezas
- `d6deef3` Tutorial de primeira vez
- `0cd0576` Atualiza ESTADO-DO-PROJETO para v3
- `0d6e793` Foguete maior e em movimento na decolagem
- `c555a78` Foguete + badge suprema; **correção crítica** do registro de cenas (v2 completa)

> **Correção crítica desta sessão:** `SelecaoFasesScene`, `ComparacaoScene`,
> `SequenciaScene` e `DesafioScene` estavam importadas mas **fora do array `scene:`** do
> `config.js` — o jogo quebrava após a história e as fases 6–8 não abriam. Corrigido.

## O QUE FALTA (precisa de você: arquivos ou decisão)
- 🎵 **Trilha sonora + ducking:** falta o arquivo `public/audios/musica-fundo.mp3` (gerar por
  IA — Suno/Udio, royalty-free). O código do sistema de música/ducking ainda **não** foi feito
  (o usuário pediu para deixar o som para depois). Roteiro de narração em
  `public/audios/ROTEIRO-NARRACAO.md`.
- 🎙️ **Narração gravada** (opcional): gravar voz seguindo o roteiro; hoje usa voz do navegador.
- ☁️ **Ranking global (Supabase):** hoje é por aparelho; subir para global depende de decisão +
  `.env` com credenciais.
- 👥 **Co-op 2 jogadores** (só PC) e tutorial guiado passo-a-passo por fase: ideias em aberto
  (precisam de definição de design).
- 🖼️ **iframe do Cruzeiro HUB:** validar o jogo embutido no HUB só é possível após deploy na
  Vercel (top-level). Ver `docs/QA-status.md` (etapa 14, pendente).

## Relatório de QA
O relatório de QA (v0.2.0) foi analisado e os NOK acionáveis (etapas 6, 13, 15) foram
corrigidos; só a etapa 14 (iframe) ficou pendente de deploy. Mapa completo em
[`docs/QA-status.md`](docs/QA-status.md). Vale uma nova rodada de QA cobrindo as fases
novas (6–8) e o mapa.

## Deploy (Vercel)
- Conectar o repo do GitHub na Vercel → detecta Vite (build `npm run build`, saída `dist`).
- A cada `git push` na `main`, a Vercel rebuilda e publica sozinha (deploy contínuo).
- `base: "./"` no `vite.config.js` faz funcionar dentro do iframe do HUB.
- PWA só instala de verdade no domínio top-level (`...vercel.app`); no iframe roda como jogo.
- `.env` (Supabase) NÃO vai pro git; configurar em Project → Settings → Environment Variables.

## Regras/estilo a respeitar SEMPRE
- Público 6–10 anos: **visual, pouco texto**; nada punitivo (erro nunca tira ponto nem dá
  game over — só dica gentil após 3 erros).
- Narração **desligada** por padrão. Arte **original** (não copiar terceiros).
- **A dica ensina o método, nunca entrega a resposta.**
- Manter as 3 formas de interagir (arraste, toque, teclado) e a acessibilidade.
- **Fazer aos poucos, confirmando cada parte;** manter **build + `npm test` verdes** a cada etapa.
- Botões agem no `pointerdown` (ver `criarBotao` em `desenho.js`) — não voltar para `pointerup`.

## Gotchas técnicos (importante ao testar)
- O **preview congela o requestAnimationFrame** → animações por tempo (tweens, `delayedCall`,
  `time.addEvent`, confete, flash de câmera) e **transições de cena via `scene.start`** NÃO
  aparecem no screenshot do preview (a transição fica "presa no init"). Validar por
  build + lógica + `window.__jogo` (só em DEV) forçando estados; no navegador real roda normal.
- **PowerShell bloqueia `npm`** → usar `node` direto (ver "Como rodar").
- **Converter webp → png:** GDI+ não decodifica webp; usar o decoder WIC do WPF
  (`Add-Type -AssemblyName PresentationCore` + `BitmapDecoder`/`PngBitmapEncoder`).
- **Assets são opcionais:** só carregam se existirem (HEAD check em `JogoCanvas.jsx` →
  `assets.js` → `BootScene`). Para arte nova: pôr em `public/assets/`, registrar em
  `assets.js`, usar `this.textures.exists(chave)` com fallback procedural.
- **Nome único:** ao testar, cada (apelido + cor do robô) só pode existir uma vez por aparelho
  (localStorage `cosmobot.ranking`); use nomes/cores diferentes ou limpe o localStorage.

## Dica para testar uma fase específica (DEV, no console do navegador)
```js
const g = window.__jogo;
g.registry.set('indiceFase', 5);            // 0..7 (5 = Comparação)
g.scene.getScenes(true).forEach(s => g.scene.stop(s.scene.key));
g.scene.start('ComparacaoScene');           // Contagem/Soma/Subtracao/Multiplicacao/Divisao/Comparacao/Sequencia/Desafio
```
