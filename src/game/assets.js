// Lista de imagens OPCIONAIS do jogo. Coloque os arquivos em "public/assets/"
// com exatamente estes nomes. Se algum não existir, o jogo desenha uma versão
// procedural no lugar (não quebra nada).
export const ASSETS = [
  { chave: "cristal", arquivo: "assets/cristal.png" }, // cristal de energia
  { chave: "robo", arquivo: "assets/robo.png" }, // o Professor Robô
  { chave: "fundo", arquivo: "assets/fundo.png" }, // fundo da estação (opcional)
  { chave: "planeta", arquivo: "assets/planeta.png" }, // planeta decorativo (Kenney)
  { chave: "lua", arquivo: "assets/lua.png" }, // lua decorativa (Kenney)
  // Foguete de celebração + estrela laranja (Cruzeiro do Sul) usada como fogo/
  // propulsão. Se faltarem, a decolagem usa o desenho procedural (não quebra).
  { chave: "foguete", arquivo: "assets/foguete.png" },
  { chave: "estrela-cs", arquivo: "assets/estrela-cs.png" },
  // Badges das fases (opcionais): quando você gerar os PNGs (ver GUIA-IMAGENS.md)
  // e salvá-los aqui, a tela de seleção troca o medalhão desenhado pela arte.
  { chave: "badge-1", arquivo: "assets/badge-1.png" },
  { chave: "badge-2", arquivo: "assets/badge-2.png" },
  { chave: "badge-3", arquivo: "assets/badge-3.png" },
  { chave: "badge-4", arquivo: "assets/badge-4.png" },
  { chave: "badge-5", arquivo: "assets/badge-5.png" },
  { chave: "badge-6", arquivo: "assets/badge-6.png" },
  { chave: "badge-7", arquivo: "assets/badge-7.png" },
  { chave: "badge-8", arquivo: "assets/badge-8.png" },
  // Badge SUPREMA: entregue só quando a aventura inteira é perfeita (todas as
  // fases com brilho máximo). Aparece na celebração final.
  { chave: "badge-suprema", arquivo: "assets/badge-suprema.png" },
];
