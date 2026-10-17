# Documentação — Aventuras do CosmoBot 🤖🚀

> Jogo educativo de **matemática** para crianças de **6 a 10 anos**.
> Documento técnico e pedagógico: **o que é, por que existe, como foi feito e por que foi feito dessa forma.**

- **Versão do projeto:** 0.2.0
- **Última atualização deste documento:** 06/09/2026
- **Stack:** React (telas) + Phaser 3 (jogo) + Supabase (progresso) + Vite (build)

---

## 1. O intuito (por que o jogo existe)

O CosmoBot é um robô explorador cuja nave perdeu energia numa chuva de meteoros. Para
voltar para casa, ele precisa **consertar a nave em 5 etapas**, e cada etapa é um
desafio de matemática com dificuldade crescente.

O objetivo é transformar as quatro operações básicas (mais contagem) em algo **concreto e
visual**: a criança não vê apenas "3 + 4", ela vê **peças dentro de caixas** que se juntam,
**luzes** que se apagam, **fileiras** de células e **combustível** sendo repartido. A
matemática aparece como consequência de uma história, não como uma prova.

**Princípios que guiaram todo o projeto:**

1. **Sem punição.** Errar nunca tira pontos nem "game over". Ao errar, o jogo convida a
   contar de novo e destaca os itens. O objetivo é aprender, não competir.
2. **Sempre concreto.** Todo número tem uma representação visual clicável na tela.
3. **Acessível de verdade.** Funciona só com teclado, tem contraste alto, fonte grande e
   narração em voz alta.
4. **Sem dados reais da criança.** Só um apelido de brincadeira. Nada de nome real, e‑mail
   ou idade.
5. **Nunca repetitivo.** As rodadas são geradas aleatoriamente a cada partida.

---

## 2. Público e contexto de uso

- **Faixa etária:** 6 a 10 anos.
- **Onde roda:** navegador (computador e celular), inclusive **dentro de um `iframe`** do
  "Cruzeiro HUB" — por isso o `vite.config.js` usa `base: "./"` (caminhos relativos, para
  o jogo funcionar em qualquer subpasta/host).
- **Origem:** projeto de sprint (ver `Escopo-Sprint-01.md`) com papéis de Programação,
  Game Design/Pedagógico, Áudio, UX/Acessibilidade e Arte.

---

## 3. Arquitetura e as decisões técnicas (o "como" e o "porquê")

### 3.1 Por que React **e** Phaser juntos?

O jogo tem dois mundos diferentes:

| Camada | Ferramenta | Por quê |
|---|---|---|
| **Telas de interface** (menu, escolha de avatar, instruções, acessibilidade) | **React** | São telas de formulário/navegação. HTML + CSS dão acessibilidade "de graça" (foco, leitores de tela, teclado) e são fáceis de estilizar. |
| **O jogo em si** (as 5 fases, animações, cristais, robô) | **Phaser 3** | É um motor de jogos 2D. Cuida de canvas, animações (tweens), input de toque/mouse e escala para caber na tela. |
| **Progresso** | **Supabase** | Banco de dados pronto e gratuito, sem precisar manter servidor próprio. |
| **Build/dev** | **Vite** | Rápido no desenvolvimento e gera um pacote otimizado para publicar. |

O React controla **qual tela aparece** ([`src/App.jsx`](src/App.jsx)) e, quando o jogador
clica em "Jogar", monta o Phaser dentro de um `<div>` através do componente
[`JogoCanvas.jsx`](src/components/JogoCanvas.jsx). Ou seja: **React por fora, Phaser por dentro.**

### 3.2 Desenho procedural (por que quase não há imagens)

O robô, os cristais, as luzes, as caixas e os botões são **desenhados por código** em
[`src/game/desenho.js`](src/game/desenho.js), não carregados como imagens.

**Por quê:**
- Não depende de artista para o jogo funcionar (a arte pode chegar depois).
- Arquivos minúsculos → carrega rápido, ideal para celular e para o `iframe`.
- Cores dinâmicas: o robô assume a cor que a criança escolheu.

O jogo é **preparado para receber imagens reais** quando existirem: o
[`JogoCanvas.jsx`](src/components/JogoCanvas.jsx) verifica por `HEAD` quais imagens estão
presentes em `public/assets/` (sem gerar erros 404) e, se encontrar `fundo`, `cristal`,
`robo`, `planeta` ou `lua`, usa a imagem; senão, usa o desenho procedural. **Degradação
graciosa** — nunca quebra por falta de asset.

### 3.3 Fluxo de cenas do Phaser

Registrado em [`src/game/config.js`](src/game/config.js):

```
BootScene → HistoriaScene → EstacaoScene (HUB) → Fase → EstacaoScene → Fase → ... → Final
```

- **BootScene** — carrega só as imagens que realmente existem.
- **HistoriaScene** — a abertura (a historinha do CosmoBot).
- **EstacaoScene** — o "hub" (mapa da nave). Entre uma fase e outra, apresenta o próximo
  conserto e mostra o robô avançando. No fim, a nave decola (celebração).
- **Fases** — as 5 cenas de matemática, todas herdando de
  [`FaseBase.js`](src/game/scenes/FaseBase.js).

O "roteiro" (ordem das fases) é montado a partir dos **dados** em
[`src/data/fases/`](src/data/fases/) e guardado no `registry` do Phaser, junto com o
jogador e a função de salvar progresso.

### 3.4 Fases como **dados**, não como código

Cada fase é um arquivo de dados (`fase01.js` … `fase05.js`) com título, emoji, cor,
enunciado, mensagem de sucesso e parâmetros de geração (mín., máx., nº de rodadas). A
**mecânica** fica na cena; o **conteúdo** fica nos dados.

**Por quê:** dá para ajustar dificuldade, textos e cores **sem mexer na lógica do jogo** —
inclusive por alguém do time pedagógico.

---

## 4. As 5 etapas (mecânica e modelo pedagógico)

**Princípio central: a criança FAZ a conta, não conta o resultado pronto.** Só a contagem
(etapa 1) se resolve olhando a tela — é justamente a habilidade daquela idade. Nas etapas
2 a 5 a criança **manipula** os objetos (arrasta / toca), e é a AÇÃO que ensina a operação.
Não dá para "passar só contando o que está na tela".

| # | Etapa (nave) | Operação | O que a criança FAZ | Cena |
|---|---|---|---|---|
| 1 | Ligar o Painel | **Contagem** | Conta as luzes acesas e escolhe o número | [`ContagemScene.js`](src/game/scenes/ContagemScene.js) |
| 2 | Abrir a Comporta | **Soma** | **Junta** as peças das duas caixas no núcleo → descobre o total | [`SomaScene.js`](src/game/scenes/SomaScene.js) |
| 3 | Encher as Baterias | **Subtração** | **Retira** (descarrega) a quantidade pedida → descobre quantas sobram | [`SubtracaoScene.js`](src/game/scenes/SubtracaoScene.js) |
| 4 | Ligar os Motores | **Multiplicação** | **Enche** cada motor com grupos iguais → descobre o total | [`MultiplicacaoScene.js`](src/game/scenes/MultiplicacaoScene.js) |
| 5 | Traçar a Rota | **Divisão** | **Reparte** o combustível igualmente entre os tanques → descobre quanto vai em cada | [`DivisaoScene.js`](src/game/scenes/DivisaoScene.js) |

**Decisões pedagógicas importantes:**

- **Manipular em vez de contar.** A soma é o gesto de **juntar** dois grupos; a subtração é
  **tirar**; a multiplicação é **montar grupos iguais**; a divisão é **repartir por igual**.
  A resposta aparece como consequência da ação — e só então o jogo mostra o símbolo
  (ex.: "12 ÷ 3 = 4"), ligando o que a criança fez ao que se escreve.
- **Três formas de interagir (acessível).** Toda etapa manipulável aceita **arrastar** (a
  pedido), **tocar** na caixa/tanque/núcleo (mais fácil no celular) e **teclado**
  (← → escolhem o alvo, Enter coloca, Backspace tira) — implementado sobre os helpers de
  arraste da [`FaseBase.js`](src/game/scenes/FaseBase.js).
- **Divisão e multiplicação sempre exatas / com grupos iguais.** O foco é a ideia de
  "partes iguais" e "grupos iguais", base da multiplicação e da divisão.
- **Quantidades pequenas de propósito.** Nas etapas de arraste os números são menores
  (ex.: até 3 × 4 = 12) para o manuseio ser agradável, sem perder o conceito.
- **Sem punição.** Repartir errado só mostra "deixe os tanques iguais" e deixa a criança
  ajustar — nunca há perda nem "game over".

### 4.1 Rodadas sempre aleatórias

[`src/game/gerarRodadas.js`](src/game/gerarRodadas.js) gera as rodadas na hora, a cada
início de fase, evitando repetir a mesma resposta em sequência.

**Por quê:** o jogo **nunca fica igual**, então a criança pode repetir a fase quantas vezes
quiser sem decorar as respostas — ela exercita a operação, não a memória da tela.

---

## 5. Acessibilidade (uma prioridade, não um extra)

Configurável na tela **Acessibilidade** e no `JogadorContext`:

- **Teclado:** ⬅️ ➡️ movem o foco entre os botões; **Enter/Espaço** confirmam. Implementado
  na base das fases ([`FaseBase.js`](src/game/scenes/FaseBase.js) → `configurarTeclado`).
- **Contraste alto:** paleta preta/amarela em [`index.css`](src/index.css) (`body.contraste-alto`).
- **Fonte grande:** aumenta a base tipográfica.
- **Narração:** lê enunciados e feedbacks em voz alta ([`src/lib/fala.js`](src/lib/fala.js)).
- **Respeita "menos movimento":** `@media (prefers-reduced-motion)` desliga animações
  decorativas para quem tem essa preferência no sistema.

---

## 6. Áudio: dois sistemas separados

1. **Efeitos sonoros** ([`src/lib/sfx.js`](src/lib/sfx.js)) — gerados na hora com a **Web
   Audio API**, sem arquivos. "Pling" de acerto, som suave de erro (nunca punitivo),
   fanfarra de vitória. Tudo passa por um "volume geral" que o botão **Som** liga/desliga.
   - *Por quê sem arquivos:* zero downloads, controle total do volume dentro do jogo, e não
     depende de a criança "mutar a aba".
2. **Narração** ([`src/lib/fala.js`](src/lib/fala.js)) — voz do navegador (**Web Speech
   API**), escolhendo a melhor voz em português disponível.
   - *Limitação conhecida:* a qualidade depende do navegador/sistema. Para narração
     realmente natural, o ideal futuro é usar **áudios gravados** em `public/audios/`.

---

## 7. Progresso e privacidade (Supabase)

- Ao concluir cada etapa, o jogo chama `salvarProgresso` ([`src/lib/progresso.js`](src/lib/progresso.js)),
  que grava no Supabase **se** as chaves estiverem configuradas (`.env`).
- **Sem `.env`, o jogo funciona igual** — apenas não grava. Isso mantém o desenvolvimento
  simples e evita travar quem só quer jogar/testar.
- **Privacidade:** grava-se apenas o **apelido fictício** e o status da fase. Nenhum dado
  real da criança é solicitado ou armazenado.

Para ativar: criar projeto no Supabase, rodar `supabase/tabela-progresso.sql`, copiar
`.env.example` → `.env` e preencher as duas variáveis.

---

## 8. Estrutura de pastas (resumo)

```
src/
├── main.jsx                 → ponto de entrada do React
├── App.jsx                  → controla qual tela aparece
├── index.css                → estilos + acessibilidade
├── context/JogadorContext   → avatar, apelido e preferências
├── components/              → telas em React (Menu, Avatar, Instruções...)
│   └── JogoCanvas.jsx       → monta o Phaser dentro do React
├── game/
│   ├── config.js            → cenas + roteiro das fases + desempenho
│   ├── tema.js              → cores e fonte
│   ├── desenho.js           → robô, cristais, luzes, caixas e BOTÕES
│   ├── gerarRodadas.js      → geração aleatória de cada operação
│   └── scenes/              → BootScene, HistoriaScene, EstacaoScene, FaseBase + 5 fases
├── data/fases/              → as 5 fases guardadas como dados
└── lib/                     → supabase, progresso, sfx (efeitos) e fala (narração)
```

---

## 9. Como rodar e publicar

> **Atenção (Windows/PowerShell):** se `npm run dev` der o erro
> *"a execução de scripts foi desabilitada neste sistema"*, é a política de segurança do
> PowerShell, não o projeto. Rode uma vez:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
> ```
> (ou use `npm.cmd run dev`, ou o Prompt de Comando `cmd`).

```bash
npm install      # só na primeira vez
npm run dev      # desenvolvimento (abre em http://localhost:5173)
npm run build    # gera a versão final na pasta dist/
npm run preview  # testa a versão final localmente
```

---

## 10. Melhorias recentes (06/09/2026)

Correções de **desempenho** e de **usabilidade** feitas após testes:

### 10.1 Botões que "não apertavam direito" ✅
- **Problema:** os botões de resposta às vezes não reagiam ao clique/toque (o efeito de
  passar o mouse funcionava, mas o clique falhava), principalmente depois de o layout mudar
  (fonte carregando, redimensionar a janela, teclado do celular abrindo).
- **Causa:** a ação era disparada ao **soltar** o toque (`pointerup`), que se perde quando o
  cache de posição do canvas fica desatualizado ou o dedo escorrega 1 px.
- **Correção** (em `criarBotao`, [`desenho.js`](src/game/desenho.js)): a ação passou a
  disparar ao **pressionar** (`pointerdown`), com uma trava anti‑duplo‑toque. Resposta
  imediata e nenhum clique se perde.

### 10.2 Jogo lento / travando ✅
- **Estrelas do fundo:** eram **80 círculos**, cada um com uma animação infinita, recriados
  **em toda cena**. Viraram **60 estrelas desenhadas num único objeto** com **uma só**
  animação de brilho. (`desenharFundo` em [`desenho.js`](src/game/desenho.js).)
- **Desfoque de fundo (CSS):** o `backdrop-filter: blur` sobre um fundo animado é caro e
  disputava a GPU com o jogo. Foi **reduzido** nas telas e **removido na tela do jogo**
  (o canvas cobre o cartão mesmo). ([`index.css`](src/index.css).)
- **Configuração do Phaser:** adicionados `powerPreference: high-performance`,
  `roundPixels`, limite de FPS e `disableContextMenu`. ([`config.js`](src/game/config.js).)

### 10.3 "Caixas mal formatadas com as letras" ✅
- Na tela da **história**, o título "Aventuras do CosmoBot" encostava/sobrepunha o texto da
  historinha. O painel foi reposicionado **abaixo do título**, com o texto **centralizado
  dentro da caixa**. ([`HistoriaScene.js`](src/game/scenes/HistoriaScene.js).)
- Os enunciados das fases ganharam mais margem para não encostar nas bordas.
  ([`FaseBase.js`](src/game/scenes/FaseBase.js).)

---

## 11. Limitações conhecidas e próximos passos

- **Narração** depende da voz do navegador → qualidade variável. *Próximo passo:* áudios
  gravados em `public/audios/`.
- **Tamanho do pacote JS** (~1,6 MB) por causa do Phaser. Aceitável, mas dá para reduzir
  com _code‑splitting_ se necessário.
- **Arte provisória** (desenho procedural). O jogo já aceita imagens reais quando chegarem.
- **Sem painel do professor** e **sem aba de geografia** (fora do escopo atual).
```
