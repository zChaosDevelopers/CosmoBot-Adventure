# Aventuras do CosmoBot 🤖🚀

Jogo educativo de **matemática** para crianças de **7 a 10 anos**.
O CosmoBot é um robozinho explorador cuja nave perdeu energia numa chuva de
meteoros. Para voltar para casa, ele viaja por **5 planetas**, e em cada um há
um desafio de matemática (com dificuldade crescente) para recarregar os cristais.

**Os 5 planetas (dificuldade progressiva):**

1. 🪐 **Planeta Cristal** — Contagem (conte os cristais)
2. ✨ **Estrela Dupla** — Soma (junte dois grupos)
3. 🌙 **Lua Minguante** — Subtração (alguns cristais se apagam)
4. 🌌 **Nebulosa dos Grupos** — Multiplicação (grupos iguais / arranjo)
5. 🛸 **Portal Compartilhar** — Divisão (reparta em partes iguais)

Feito com **React** (telas) + **Phaser** (jogo) + **Supabase** (progresso).

---

## Como rodar o projeto

Você precisa ter o **Node.js** instalado (versão 18 ou maior).

1. Instalar as dependências (só na primeira vez):
   ```bash
   npm install
   ```
2. Rodar em modo de desenvolvimento:
   ```bash
   npm run dev
   ```
   Abra o endereço que aparecer no terminal (algo como `http://localhost:5173`).

3. Gerar a versão final (para publicar):
   ```bash
   npm run build
   ```

---

## Banco de dados (Supabase) — opcional na Sprint 01

1. Crie um projeto gratuito em https://supabase.com
2. No menu **SQL Editor**, rode o arquivo [`supabase/tabela-progresso.sql`](supabase/tabela-progresso.sql).
3. Copie `.env.example` para `.env` e preencha as duas variáveis com os dados do seu projeto.

Sem isso o jogo funciona normalmente — apenas não grava o progresso ainda.

---

## Estrutura das pastas

```
.
├── index.html                → página que carrega o jogo
├── package.json              → dependências e comandos
├── vite.config.js            → configuração do Vite
├── .env.example              → modelo das chaves do Supabase
├── public/
│   ├── audios/               → narrações (Sprint 02+)
│   └── assets/               → imagens do jogo (Sprint 02+)
├── supabase/
│   └── tabela-progresso.sql  → script para criar a tabela
└── src/
    ├── main.jsx              → ponto de entrada do React
    ├── App.jsx               → controla qual tela aparece
    ├── index.css             → estilos + acessibilidade
    ├── context/
    │   └── JogadorContext.jsx→ guarda avatar, apelido e acessibilidade
    ├── components/           → telas em React
    │   ├── Menu.jsx
    │   ├── Avatar.jsx
    │   ├── Instrucoes.jsx
    │   ├── Acessibilidade.jsx
    │   ├── JogoCanvas.jsx    → monta o Phaser dentro do React
    │   └── BotaoAudio.jsx    → narração por voz do navegador
    ├── game/                 → parte do Phaser (o jogo)
    │   ├── config.js         → registra as cenas e o roteiro das fases
    │   ├── tema.js           → cores e fonte
    │   ├── desenho.js        → cristais, robô e botões (desenho procedural)
    │   ├── gerarRodadas.js   → gera rodadas aleatórias de cada operação
    │   └── scenes/
    │       ├── BootScene.js         → carrega imagens opcionais
    │       ├── HistoriaScene.js     → abertura (historinha do CosmoBot)
    │       ├── EstacaoScene.js      → hub / mapa dos planetas + festa final
    │       ├── FaseBase.js          → base compartilhada das fases
    │       ├── ContagemScene.js     → Planeta 1 (contagem)
    │       ├── SomaScene.js         → Planeta 2 (soma)
    │       ├── SubtracaoScene.js    → Planeta 3 (subtração)
    │       ├── MultiplicacaoScene.js→ Planeta 4 (multiplicação)
    │       └── DivisaoScene.js      → Planeta 5 (divisão)
    ├── data/
    │   └── fases/            → fases guardadas como dados (JSON)
    │       ├── fase01.js … fase05.js
    │       └── index.js
    └── lib/                  → integração com o Supabase
        ├── supabase.js
        └── progresso.js
```

---

## O que está pronto

- Abertura com a historinha do CosmoBot
- Menu inicial (Jogar, Instruções, Acessibilidade)
- Escolha do CosmoBot (cor) + apelido fictício
- Instruções com áudio (voz do navegador)
- Acessibilidade: teclado, contraste alto, fonte grande e narração
- **5 fases jogáveis** com dificuldade crescente: contagem → soma → subtração →
  multiplicação → divisão (todas acessíveis e **sem punição**)
- Rodadas **sempre aleatórias** (o jogo nunca fica repetitivo)
- Mapa de planetas mostrando o progresso da aventura
- Salvamento de progresso ao concluir cada fase (via Supabase, se configurado)
- Responsivo (celular e computador) e pronto para o iframe do Cruzeiro HUB
