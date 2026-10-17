# Pasta de áudios

Coloque aqui os arquivos de narração do jogo (ex.: `fase1-intro.mp3`).

Na Sprint 01 o áudio das telas usa a voz do próprio navegador (não precisa de
arquivos). Estes arquivos serão usados nas fases a partir da Sprint 02.

Responsável: equipe de Áudio / Conteúdo.

## Música de fundo (item 6 do relatório de QA)

O sistema de música de fundo já está pronto no código
(`src/lib/musica.js` + controles em `JogoCanvas.jsx`: tocar/pausar, volume
independente dos efeitos sonoros, e "ducking" automático — a música abaixa
sozinha enquanto a narração fala). Só falta o ARQUIVO:

1. Salve a trilha como **`musica-fundo.mp3`** exatamente nesta pasta
   (`public/audios/musica-fundo.mp3`).
2. Ela toca em loop, BEM baixinho por padrão (o jogador pode ajustar o volume
   ou desligar a qualquer momento na barra de áudio acima do jogo).
3. Se o arquivo não existir, o jogo não quebra — só fica sem música de fundo.

> Sobre a música indicada pela equipe (gerada no Udio): o link enviado é um
> player do site deles, que exige login e não oferece um arquivo baixável por
> fora da conta de quem a gerou. Baixe o MP3 pela própria conta do Udio (botão
> de download/exportar da faixa) e salve aqui com o nome acima — assim que o
> arquivo existir, a música toca automaticamente sem precisar mexer em mais
> nada no código.
