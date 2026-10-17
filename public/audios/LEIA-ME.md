# Pasta de áudios

Coloque aqui os arquivos de narração do jogo (ex.: `fase1-intro.mp3`).

Na Sprint 01 o áudio das telas usa a voz do próprio navegador (não precisa de
arquivos). Estes arquivos serão usados nas fases a partir da Sprint 02.

Responsável: equipe de Áudio / Conteúdo.

## Música de fundo (item 6 do relatório de QA)

O sistema de música de fundo está pronto no código (`src/lib/musica.js` +
controles em `JogoCanvas.jsx`: tocar/pausar, volume independente dos efeitos
sonoros, e "ducking" automático — a música abaixa sozinha enquanto a narração
fala) e já toca o arquivo `musica-fundo.mp3` desta pasta, em loop e BEM
baixinho por padrão (o jogador ajusta o volume ou desliga na barra de áudio
acima do jogo).

**Faixa atual (provisória):** "Space Flight" de wipics, licença **CC0**
(domínio público — uso livre, sem necessidade de crédito):
<https://opengameart.org/content/space-flight>. Ela entrou só para o sistema
já funcionar de ponta a ponta enquanto a faixa gerada no Udio não chega.

**Para trocar pela música do Udio** (a conta que gerou precisa de assinatura
paga para exportar o MP3 — a conta grátis não libera o download):
1. Pela conta do Udio com o download liberado, baixe a faixa como MP3.
2. Substitua o arquivo `public/audios/musica-fundo.mp3` por ele (mesmo nome).
3. Pronto — nenhum código precisa mudar.

Se o arquivo for removido/faltar, o jogo não quebra — só fica sem música.
