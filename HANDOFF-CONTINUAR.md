# CosmoBot — Handoff para continuar em outro chat

> Cole/aponte este arquivo no início do novo chat. **Atualizado em 01/10/2026 — v0.4.0.**
> Leia primeiro a seção **▶ CONTINUAR AQUI** — é o que está pendente agora.

---

## ▶ CONTINUAR AQUI

### ⚠️ Antes de tudo: há 7 commits NÃO PUBLICADOS

A Sprint 4 inteira está commitada na `main` **local**, mas o usuário pediu para
**não dar push ainda** ("aguarde eu mandar"). Nada disso está na Vercel.
**Pergunte antes de publicar.** Quando ele liberar: `git push` na `main` e a
Vercel rebuilda sozinha.

### 1. Terminar o teste ponta a ponta (estava em andamento)

Eu estava jogando a aventura inteira para validar a Sprint 4 e **parei entrando
na fase 4**. As fases 1, 2 e 3 passaram (painel da conta correto, 3⭐ cada,
volta ao mapa OK). Falta rodar as fases **4 a 8** e chegar no "Decolar".

Como retomar (ver "Testar sem som" para o harness completo):

```js
window.__entrarFase(3);                      // fase 4 (índice 0..7)
window.__jogarAtual('MultiplicacaoScene');   // joga até concluir
```

⚠️ **Não faça as 8 fases numa chamada só** — o `javascript_tool` estoura
("Internal error"). Vá de 1 a 2 fases por chamada.

### 2. Dois pontos que DEPENDEM DO USUÁRIO (ele já foi avisado)

- ☁️ **Supabase (ranking global):** o código está pronto e testado, mas só liga
  quando ele criar o projeto, rodar `supabase/tabela-ranking.sql` no SQL Editor
  e definir `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` no `.env` local **e**
  nas Environment Variables da Vercel. Sem isso o jogo usa o ranking local
  sozinho, sem erro (testado inclusive com credenciais inválidas).
- 🖼️ **WebP (imagens):** consegui **57%** de redução localmente (PNG). Dá para
  chegar a **~88%** (1,7 MB → ~210 KB) convertendo para WebP, mas o Windows
  **não tem encoder WebP** e o receptor local que eu usaria para gravar os
  arquivos convertidos pelo navegador **foi bloqueado pelo sandbox**
  ("Expose Local Services"). Precisa que ele libere essa permissão ou rode a
  conversão por conta própria. Números medidos: badge 147 KB → 19 KB (WebP q0.9)
  contra 74 KB (PNG redimensionado).

### 3. Pendências antigas que continuam abertas

- 🎵 **Música de fundo + ducking:** falta `public/audios/musica-fundo.mp3` (gerar
  por IA). O código do sistema de música ainda NÃO foi feito.
- 🎙️ Narração gravada (opcional; roteiro em `public/audios/ROTEIRO-NARRACAO.md`).
- ✨ Mais polish/juice e tutorial passo-a-passo por tipo de fase (hoje é só uma
  demonstração automática simples na 1ª fase).
- 📐 **Fonte externa:** o jogo carrega a Fredoka do Google Fonts. Offline ela
  falha e o texto cai na fonte de reserva — o PWA promete funcionar offline, então
  dá para embutir a fonte em `public/` e pôr no precache. Não é bug, é acabamento.

---

## O que é
**Aventuras do CosmoBot** — jogo educativo de matemática para crianças de **6 a 10 anos**.
Um robô conserta a nave em **8 fases**, cada uma um desafio de conta. Tudo é **VISUAL**
(pouco texto), nada punitivo.

- **Stack:** React (telas) + **Phaser 3** (jogo) + Vite. PWA. Supabase opcional.
- **Repo:** https://github.com/zChaosDevelopers/CosmoBot-Adventure (branch `main`,
  commit direto, sem PR). **Já está na Vercel.**
- **Pasta:** `C:\Users\...\Área de Trabalho\Projeto Itineraio Game`

## Como rodar (Windows) — o PowerShell bloqueia `npm`, use `node`:
- Build: `node node_modules/vite/bin/vite.js build`
- Dev: `node node_modules/vite/bin/vite.js --port 5199`
- Testes dos geradores: `node scripts/test-geradores.mjs`
- `.claude/launch.json` já roda o Vite via `node`.
- **Não há Python** nesta máquina — para scriptar edições, use `node`.

## Arquitetura / fluxo
`Boot → Historia → SelecaoFasesScene (mapa) → fase → volta ao mapa`. Ao concluir as 8 →
"Decolar" → `EstacaoScene`. **Novo:** o `BootScene` lê `registry.modo` e vai para
`VersusScene` quando o modo é `"versus"` (modo 2 jogadores).

- Telas React: `src/components/` (Menu, Avatar, Instrucoes, Acessibilidade, Creditos,
  Ranking, **DoisJogadores**, JogoCanvas).
- Cenas Phaser: `src/game/scenes/` (Boot, Historia, SelecaoFases, Estacao, Contagem,
  Soma, Subtracao, Multiplicacao, Divisao, Comparacao, Sequencia, Desafio, **Versus**,
  FaseBase, FaseDistribuir).
- `FaseBase.js` = base comum (cabeçalho, **painel da operação**, botões, timer,
  erros/estouro, dica, tutorial, teclado, **botão voltar ao mapa**, conclusão+badge).
- `gerarRodadas.js` (geradores puros, **todos testados**), `badges.js`,
  `lib/ranking.js` (local), **`lib/rankingGlobal.js` (Supabase)**,
  `game/teclado.js` (`podeAgir` = anti-spam), `game/assets.js`.

## As 8 fases
1 Contagem · 2 Soma · 3 Subtração · 4 Multiplicação · 5 Divisão · 6 Comparação (>,<,=) ·
7 Sequência/Padrão · 8 Desafio Final (boss "Guardião" com barra de vida).
**+ Modo 2 Jogadores** (separado, fora da aventura).

---

## Feito nesta sessão (7 commits, mais novos primeiro)

### Sprint 4
- `31abf6e` **Modo 2 jogadores + escolha da operação** (a "nova funcionalidade"
  da Sprint 4). Os dois veem a MESMA conta e correm para apertar a certa; quem
  acerta primeiro leva o ponto; quem erra fica de fora só daquela rodada; se os
  dois erram, revela a resposta e segue. 5 rodadas, ganha quem fizer mais pontos.
  Teclas: **J1 = A S D**, **J2 = ← ↓ →** (uma tecla por alternativa, para ser
  justo). Na tela de preparação dá para escolher nome, cor e **qual conta vai
  cair** (misturado/soma/subtração/multiplicação/divisão).
  É **isolado**: não toca nas 8 fases, no progresso nem no ranking (verificado).
- `c494a45` **Operação sempre visível** em todas as fases. Antes só o Desafio
  mostrava a conta. Agora a `FaseBase` desenha um painel entre o enunciado e o
  conteúdo; cada fase diz a sua conta sobrescrevendo `textoOperacao()`.
  No acerto, `revelarOperacao()` troca a "?" pelo resultado em verde.
  A Comparação foi compactada junto (painéis 210 → 170 de altura): o painel novo
  empurrava os números para trás dos botões de resposta.
- `b85e24d` **Bugs 1 e 2 — mesma causa raiz.** `escolher()` ligava a trava
  `_entrando` (para a fase não abrir duas vezes), mas **o Phaser REUTILIZA a
  instância da cena** a cada `scene.start` e o `create()` nunca religava a trava.
  Depois da primeira fase o mapa travava e **nenhuma** fase abria — nem a
  próxima (bug 1), nem as concluídas (bug 2), por toque ou teclado.
  Correções: (1) `create()` religa `_entrando = false`; (2) as fases ganharam
  **saída para o mapa** (botão 🗺️ no canto superior esquerdo + tecla **Esc**) —
  antes só dava para sair concluindo a fase; (3) rejogar guarda o **MELHOR**
  resultado (estrelas e badge), em vez de sobrescrever.

### Antes da Sprint 4 (mesma sessão)
- `c8c84d1` **QA das fases 6–8** (`docs/QA-fases-6-8.md`) + corrige
  `disableInteractive()` dos botões: desde que o hitbox virou um retângulo
  **filho**, o disable agia no container e não no retângulo que escuta o toque.
- `23f6bc3` **Imagens 57% menores** (1,7 MB → 751 KB; precache do PWA
  3422 → 2437 KiB). Redimensionadas para ~2x o tamanho de exibição com WIC/WPF
  (escala Fant, alpha preservado — conferido no navegador).
- `8c7e2a9` **CosmoBot controlável no mapa**, sem roubar o clique. Duas garantias:
  `tornarInerte()` (em `desenho.js`) e ele pousa **ao lado** do planeta (dx −80),
  fora da zona de clique (raio 52). Setas movem o foco e ele voa junto.
- `0a3d5b8` **Ranking global (Supabase)** com fallback local, timeout de 6 s.

---

## Regras/estilo a respeitar SEMPRE
- Público 6–10 anos: visual, pouco texto, **nada punitivo** (erro só dá dica gentil após 3
  erros, nunca game over). Narração OFF por padrão. Arte original.
- **A dica ensina o método, nunca entrega a resposta.**
- Manter as 3 formas de interagir (arraste, toque, teclado) e a acessibilidade.
- **Fazer aos poucos, confirmando cada parte;** build + testes verdes a cada etapa.
- Botões agem no `pointerdown` (ver `criarBotao`) — não voltar para `pointerup`.

## Gotchas técnicos
- **⚠️ O Phaser REUTILIZA a instância da cena** a cada `scene.start`. Toda flag de
  estado (`_entrando`, `_saindo`, `_acabou`…) precisa ser **religada no `create()`/
  `iniciarFase()`** — senão volta ligada da vez anterior. Já causou o bug que
  travava o mapa inteiro. **Ao criar qualquer trava nova, religue-a.**
- PowerShell bloqueia `npm` → usar `node`. **Não há Python.**
- O Windows **não tem encoder WebP**; o WIC/WPF só exporta PNG/JPEG/BMP/TIFF.
- webp → png: GDI+ não lê webp; usar WIC do WPF (`Add-Type -AssemblyName PresentationCore`).
- Assets são opcionais (HEAD check em `JogoCanvas.jsx` → `assets.js` → `BootScene`).
- Nome único no ranking: cada (apelido + cor do robô) só existe 1x por aparelho; ao testar,
  varie o nome (ex.: `'QA' + Date.now()`).
- O listener de clique dos botões **não está no container**, e sim num retângulo
  invisível que é o **último filho** dele: `botao.list[botao.list.length - 1]`.

## Testar sem som e de forma determinística
- `localStorage.setItem('somLigado','false')` e recarregar — muta tudo (o usuário
  **não quer ouvir o barulho dos testes**). Só afeta o navegador de teste.
- O preview **congela o requestAnimationFrame** → nada anda sozinho. Avance o loop
  à mão, **em passos de 16 ms** (saltos grandes são clampados pelo Phaser e o tempo
  da cena não anda):

```js
const g = window.__jogo;                       // só em DEV
window.__t = performance.now();
window.__avancar = (ms) => { const n = Math.ceil(ms/16);
  for (let i=0;i<n;i++) { window.__t += 16; g.loop.step(window.__t); } };
window.__tocar = (b) => b.list[b.list.length - 1].emit('pointerdown');  // toque REAL
window.__abrir = (idx, cena) => { g.registry.set('indiceFase', idx);
  g.scene.getScenes(true).forEach(s => g.scene.stop(s.scene.key));
  g.scene.start(cena); window.__avancar(700); return g.scene.getScene(cena); };
```

- Uma rodada leva **~5–6 s de tempo de jogo** para concluir → use `__avancar(6000)`.
- O carregamento de imagem é **assíncrono de verdade**: espere com
  `await new Promise(r => setTimeout(r, 200))` entre os `__avancar`, senão as
  texturas aparecem como 32x32 (placeholder).
- O **anti-spam do Enter é de 450 ms e COMPARTILHADO entre cenas** (registry).
  Ao testar Enter em cenas diferentes, espere 520 ms de tempo REAL entre eles —
  senão parece um bug que não existe.
- A Contagem não guarda `this.rodada`; use `est.rodadas[est.rodadaAtual]`.
- Cliques por coordenada no preview não mapeiam 1:1 no canvas — prefira os
  emitters/`hitTestPointer` do Phaser.

## Testar uma fase específica (DEV, console do navegador)
```js
const g = window.__jogo;
g.registry.set('indiceFase', 7);           // 0..7 (7 = Desafio Final)
g.scene.getScenes(true).forEach(s => g.scene.stop(s.scene.key));
g.scene.start('DesafioScene');
```

## Deploy (Vercel)
- Conectado ao GitHub; cada `git push` na `main` rebuilda e publica sozinha.
- `base: "./"` no `vite.config.js` faz funcionar no iframe do Cruzeiro HUB.
- Para o ranking global: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` em
  Project → Settings → Environment Variables (e no `.env` local). `.env` não vai pro git.
