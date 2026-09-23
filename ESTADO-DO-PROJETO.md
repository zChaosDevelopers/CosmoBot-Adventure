# Estado do Projeto — Aventuras do CosmoBot (handoff)

> **Para quem for continuar (pessoa ou outra IA):** este documento diz **onde o projeto
> parou**, o que está pronto/testado, o que ficou pendente e como rodar. Leia primeiro a
> seção 2 (onde paramos) e a seção 6 (pendências).

- **Data deste registro:** 11/09/2026
- **Versão:** 0.2.0
- **Stack:** React (telas) + Phaser 3 (jogo) + Supabase (progresso) + Vite (build)
- **Documentação completa:** [`DOCUMENTACAO.md`](DOCUMENTACAO.md) e
  [`docs/Documentacao-Tecnica-CosmoBot.pdf`](docs/Documentacao-Tecnica-CosmoBot.pdf) (versão
  formatada para o grupo/QA).

---

## 1. O que é o projeto

Jogo educativo de **matemática** para crianças de **6 a 10 anos**. O robô CosmoBot conserta
a nave em **5 etapas**, cada uma um desafio de uma operação. Roda no navegador (PC e celular)
e é preparado para abrir dentro do **iframe do Cruzeiro HUB** (por isso `base: "./"` no Vite).

**Princípio pedagógico central (NÃO regredir):** a criança precisa **fazer** a conta, não
apenas contar o que já está na tela. As etapas 2–5 são **manipuláveis** (arrastar/tocar); a
etapa 1 (contagem) é a introdução, pois contar é a habilidade da idade.

---

## 2. Onde o projeto parou (estado atual)

O jogo está **jogável de ponta a ponta** e foi **testado no navegador** nesta última rodada
de trabalho. As 5 etapas foram redesenhadas/ajustadas e verificadas rodando o jogo.

**Fluxo completo funcionando:** Menu → Avatar/Apelido → História → Hub (mapa da nave) →
5 etapas → nave decola (celebração) → jogar de novo.

**Última grande entrega:** transformação das etapas 2–5 em **manipuláveis** (aprender
fazendo) + correções de desempenho e de clique dos botões.

---

## 3. O que está PRONTO e testado ✅

| Etapa | Operação | Mecânica atual (o que a criança faz) | Testado |
|---|---|---|---|
| 1 — Ligar o Painel | Contagem | Conta as luzes e escolhe o número (botões) | ✅ |
| 2 — Abrir a Comporta | Soma | **Junta** as peças das 2 caixas no núcleo → revela `a + b` | ✅ |
| 3 — Encher as Baterias | Subtração | **Retira** (descarrega) a quantidade pedida → revela `a − b` | ✅ |
| 4 — Ligar os Motores | Multiplicação | **Enche** cada motor com grupos iguais → revela `n × x` | ✅ |
| 5 — Traçar a Rota | Divisão | **Reparte** o combustível igual entre os tanques → revela `total ÷ n` | ✅ |

Cada etapa manipulável aceita **3 formas de interagir**: arrastar, tocar na caixa/tanque/
motor/núcleo (mais fácil no celular) e **teclado** (← → escolhem o alvo, Enter coloca,
Backspace tira). O resultado só aparece **depois da ação**, ligando o gesto ao símbolo.

Outros itens prontos: menu, escolha de avatar/apelido, história, hub, acessibilidade
(contraste alto, fonte grande, teclado, narração), efeitos sonoros (Web Audio) e narração
(Web Speech), salvamento no Supabase (opcional, se `.env` estiver configurado).

**Correções recentes já aplicadas e verificadas:**
- Botões de resposta agora disparam no **pressionar** (`pointerdown`) — antes falhavam.
- Desempenho: estrelas do fundo desenhadas num só objeto; `backdrop-filter` removido na tela
  do jogo; config de render do Phaser. O jogo ficou fluido.
- Sobreposição de texto na tela da história corrigida.

**Build:** `npm run build` roda **sem erros** (só o aviso normal de tamanho do Phaser ~1,6 MB).

---

## 4. Como está organizado (arquivos que importam)

```
src/
├── components/JogoCanvas.jsx     → monta o Phaser dentro do React
├── game/
│   ├── config.js                 → cenas + roteiro + configuração de desempenho
│   ├── desenho.js                → robô, luzes, caixas, BOTÕES + helpers de desenho
│   ├── gerarRodadas.js           → geração aleatória de cada operação
│   └── scenes/
│       ├── FaseBase.js           → base comum + HELPERS DE ARRASTE (prepararArraste, zonaNoPonto)
│       ├── ContagemScene.js      → etapa 1 (contagem + botões)
│       ├── SomaScene.js          → etapa 2 (juntar) — MANIPULÁVEL
│       ├── SubtracaoScene.js     → etapa 3 (retirar) — MANIPULÁVEL
│       ├── MultiplicacaoScene.js → etapa 4 (grupos iguais) — MANIPULÁVEL
│       └── DivisaoScene.js       → etapa 5 (repartir) — MANIPULÁVEL
└── data/fases/fase01..05.js      → dados de cada etapa (dificuldade, textos, quantidades)
```

As 4 cenas manipuláveis seguem o **mesmo padrão**: um “reservatório” de peças arrastáveis +
uma ou mais “zonas” (caixa/tanque/motor/núcleo); ao soltar/tocar, a peça vai para a zona;
`conferir()` decide sucesso; `sucesso()` revela a conta e chama `animarColeta`. Bom ponto de
partida para entender uma, entender todas.

---

## 5. Como rodar (importante no Windows)

> Se `npm run dev` der o erro **“a execução de scripts foi desabilitada neste sistema”**, é a
> política do PowerShell (não o projeto). Rode uma vez:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
> ```
> Alternativas: `npm.cmd run dev` ou usar o Prompt de Comando (`cmd`).

```bash
npm install      # só na primeira vez
npm run dev      # desenvolvimento (http://localhost:5173)
npm run build    # versão final na pasta dist/
npm run preview  # testa a versão final
```

**Dica para testar uma etapa específica sem jogar tudo:** em modo dev, o jogo expõe
`window.__jogo`. No console do navegador:
```js
const g = window.__jogo;
g.registry.set('indiceFase', 4);          // 0..4 (0=contagem ... 4=divisão)
g.scene.getScenes(true).forEach(s => g.scene.stop(s.scene.key));
g.scene.start('DivisaoScene');            // ou Soma/Subtracao/Multiplicacao/ContagemScene
```

---

## 6. Pendências e decisões em aberto ⏳

1. **Tamanho das peças no arraste (decisão pendente com o cliente).** No teste, o gesto de
   arrastar funciona, mas as peças são pequenas (~26 px) e exigem mira. Para 6 anos no
   celular, o **toque na zona** é o caminho fácil (já existe). *Pergunta em aberto:* aumentar
   um pouco as peças para facilitar o arraste no toque? Ainda não decidido.
2. **Narração:** usa a voz do navegador (qualidade variável). *Próximo passo sugerido:*
   áudios gravados em `public/audios/`.
3. **Arte:** o jogo usa desenho procedural (provisório). Já aceita imagens reais em
   `public/assets/` (`fundo`, `cristal`, `robo`, `planeta`, `lua`) quando existirem.
4. **Supabase:** salvamento pronto no código, mas depende de `.env` configurado para gravar
   de fato. Sem `.env`, o jogo funciona normal (só não grava).
5. **Fora do escopo atual:** painel do professor e aba de geografia.
6. **Tamanho do bundle** (~1,6 MB por causa do Phaser): aceitável; dá para reduzir com
   code-splitting se necessário.

---

## 7. Se você (próxima IA/dev) for mexer, cuidado com

- **Não regredir o princípio manipulável:** não voltar as etapas 2–5 para “só contar e
  escolher o número”. O objetivo é ensinar a operação pela ação.
- **Acessibilidade:** manter as 3 formas de interagir (arraste, toque, teclado) e o suporte a
  contraste alto / fonte grande / narração / `prefers-reduced-motion`.
- **Sem punição:** erro nunca tira pontos nem dá “game over” — só uma dica gentil.
- **Sem dados reais da criança:** apenas apelido fictício.
- **Confiabilidade do clique:** botões agem no `pointerdown` (ver `criarBotao` em
  `desenho.js`) — foi uma correção importante, não voltar para `pointerup`.
- Depois de mexer numa cena, **rodar `npm run build`** (pega erros de import/sintaxe) e testar
  a etapa no navegador.

---

## 8. Histórico resumido do que foi feito nesta fase

1. Diagnóstico e correção do erro de PowerShell (não era do projeto).
2. Correção dos **botões** (não apertavam direito) e de **desempenho** (travando).
3. Correção da **sobreposição de texto** na tela da história.
4. Documentação técnica completa (Markdown + Word + PDF) para o grupo/QA.
5. **Redesenho das etapas 2–5 como manipuláveis** (juntar, retirar, agrupar, repartir) +
   faixa etária ampliada para **6–10 anos** + quantidades menores no arraste.
6. Testes das 5 etapas rodando o jogo; build sem erros.

### Evoluções de 11/09/2026
7. **Contas de 2 dígitos** garantidas nos últimos níveis (multiplicação e divisão;
   subtração até 12). Ver `gerarRodadas.js` (garante ao menos 1 conta ≥ 10 por rodada) e
   os `gerar` em `data/fases/fase03-05.js`.
8. **Mecânica de erro "balões incham → estouram"**: a cada erro as bolinhas crescem; no
   **5º erro (limite)** elas estouram (pop) e **vem outra conta**. Código compartilhado em
   `FaseBase.js` (`registrarErro`, `estourarBaloes`, `resetarPergunta`, `LIMITE_ERROS = 5`);
   aplicado em Contagem, Soma? (soma não erra), Subtração, Multiplicação e Divisão.
9. **Botão de Dica** (💡) aparece **depois que os balões estouram** (`mostrarDica`):
   Contagem conta junto; Multiplicação/Divisão enchem o 1º motor/tanque como exemplo;
   Subtração destaca as células a tirar. Ver `criarBotaoDica` em `FaseBase.js` e `darDica`
   em cada cena.
10. **Cores mais vivas** (`tema.js`) e **menos texto** (enunciados curtos — o público é
    criança de 6 a 10 anos).

> Observação de teste: o preview automático (pane) **congela o requestAnimationFrame**, então
> animações por tempo (estouro, dica) não aparecem lá — a LÓGICA foi verificada (erros 1→5,
> estouro no 5, nova conta, botão de dica surge). No navegador real as animações rodam normais.
> A performance em runtime é leve (bolinhas são círculos estáticos, sem tween infinito; fundo
> com 60 estrelas num só objeto; sem backdrop-filter na tela do jogo; botões respondem no
> `pointerdown`). Vale um teste rápido de FPS no aparelho-alvo (celular).

### Evoluções (mais recentes) — hub, acessibilidade e saúde do código
21. **Estrelas no mapa da nave:** as ⭐ ganhas em cada etapa aparecem embaixo de cada
    estação da tira de progresso (não só no final). Guardadas em `registry "estrelasPorEtapa"`.
22. **Dica pelo teclado:** tecla **H** aciona a dica (quando disponível). Ver `configurarTeclado`
    em `FaseBase.js`.
23. **Leitor de tela (aria-live):** `src/lib/anunciar.js` cria uma região escondida que anuncia
    a tarefa da rodada, o estouro e a conclusão da etapa (o `<canvas>` do Phaser não é lido
    sozinho). Limpa ao sair do jogo (`JogoCanvas.jsx`).
24. **Geradores de conta puros + TESTE:** `gerarRodadas.js` não depende mais do Phaser (RNG
    local). Novo teste `scripts/test-geradores.mjs` roda com **`npm test`** e verifica que
    soma/subtração/multiplicação/divisão nunca geram valor errado (divisão exata, 2 dígitos
    garantidos, sempre 3 opções). O teste pegou e corrigiu 2 coisas: o formato do objeto de
    divisão (quociente fica em `quantidade`) e `gerarOpcoes` que raramente dava < 3 opções.
25. **Refatoração (#11 parcial):** Divisão e Multiplicação (quase idênticas) agora herdam de
    `FaseDistribuir.js` — toda a mecânica de distribuir em zonas mora lá; cada cena só define
    seus rótulos/geradores/texto. Soma e Subtração continuam separadas (mecânica diferente:
    juntar num núcleo / retirar para o descarte) — unificá-las traria mais risco que ganho.
26. **PWA (instalável + offline):** `vite-plugin-pwa` no `vite.config.js` gera service worker +
    manifest; o app inteiro é pré-cacheado (bom para tablets de sala). Ícone = a estrela.

> **Deploy:** vai para a **Vercel** (top-level) e depois é embutido no Cruzeiro HUB via iframe.
> Só na Vercel (top-level) o PWA instala de fato; dentro do iframe ele roda normal como jogo.

### Evoluções de 16/09/2026 (tarde) — acessibilidade, recompensa e performance
13. **Limite de erro = 3** (era 5): 3 erros → balões estouram → conta nova.
14. **Dica bem mais VISUAL** (criança ainda aprende a ler): o botão virou só um ícone
    💡 com brilho pulsante; as demonstrações usam mãozinha 👇, números saltando (contagem),
    ✕ nas células a tirar (subtração) e preenchem um tanque/motor de exemplo (div/mult).
    Avisos de erro viraram emoji (🔁). Narração **continua desligada por padrão** (só liga
    se o usuário quiser).
15. **Acessibilidade DENTRO do jogo** (`acessibilidade.js`): "Contraste alto" → fundo preto
    sólido; "Fonte grande" → textos-chave aumentam. Ícone da operação (➕➖✖️➗🔢) na frente
    do enunciado como pista visual.
16. **Recompensa por etapa: estrelas** ⭐ (0 erros = 3; até 2 = 2; mais = 1), somadas e
    mostradas no final (`registry "estrelas"`). Zeram ao recomeçar.
17. **Dificuldade adaptativa (leve):** depois de estourar, a conta nova vem MAIS FÁCIL
    (números menores) — ajuda quem erra. Ver `gerarUmaRodada(facil)` em cada cena.
18. **Carregamento rápido (code-splitting):** o Phaser virou chunk separado via `React.lazy`
    no [App.jsx]. Menu = ~156 KB (abre instantâneo); jogo (~1,5 MB) só baixa ao clicar Jogar.
19. **Botão "Ver no celular"** agora só aparece em modo dev (`import.meta.env.DEV`).
20. **Limpeza:** removidos imports não usados (`somErro`) das cenas.

> **Pendente (recomendado como passo isolado): item #11 — refatorar as 4 cenas manipuláveis
> numa base comum.** É melhoria SÓ interna (sem mudança visível) e mexe nas 4 cenas ao mesmo
> tempo, então tem risco de regressão. Como o preview congela o RAF (não dá para testar
> animações ao vivo), o certo é fazer isso sozinho, com teste real no navegador depois — não
> junto de 8 outras mudanças. Combinado de fazer a seguir.

### Evoluções de 16/09/2026
11. **Aba de Créditos** no menu (`Creditos.jsx` + rota em `App.jsx`), com os 8 integrantes
    (nome, cargo com ícone e RGM). A lista rola por dentro para o botão Voltar não sumir.
12. **Selo da Universidade Cruzeiro do Sul** no canto do painel (`LogoCruzeiro.jsx` + CSS
    `.logo-cruzeiro`), aparece em todas as telas. A logo usada é uma **estrela galáctica**
    (arquivo em `public/assets/logo-cruzeiro.png`, fundo transparente). Como é uma estrela,
    NÃO há recorte circular — só um halo de nebulosa + brilho ao redor. Para trocar a imagem,
    basta substituir esse arquivo. Obs.: o PNG está em ~1,4 MB; dá para otimizar para ~256px
    se quiser aliviar o carregamento no celular.
