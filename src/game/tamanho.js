// Tamanho LÓGICO do jogo (o "papel" onde as cenas desenham), escolhido a partir
// do formato da janela — o Phaser (Scale.FIT) depois só amplia/reduz esse papel
// para caber na tela, sem distorcer.
//
// Antes o papel era sempre 800x600 (4:3): em telas largas ou em pé sobravam
// faixas vazias e o conteúdo ficava pequeno. Agora:
//   • tela larga (ex.: 16:9)  → altura 600, largura maior (mais espaço lateral);
//   • tela quadradinha        → papel mais estreito (a largura acompanha);
//   • tela em pé (celular)    → largura 560, altura maior.
// As cenas lêem scale.width/height, então se reorganizam sozinhas.
//
// Limites: largura 560–1200, altura 600–1100. O 800x600 original continua sendo
// exatamente o resultado para uma janela 4:3.
export const LARGURA_MIN = 560;
export const LARGURA_MAX = 1200;
export const ALTURA_BASE = 600;
export const ALTURA_MAX = 1100;

export function tamanhoLogico(larguraCss, alturaCss) {
  const l = Math.max(1, larguraCss || 800);
  const a = Math.max(1, alturaCss || 600);
  const proporcao = l / a;

  // Largura que a altura-base "pede" para preencher o formato da janela.
  const larguraIdeal = Math.round(ALTURA_BASE * proporcao);
  if (larguraIdeal >= LARGURA_MIN) {
    return { width: Math.min(LARGURA_MAX, larguraIdeal), height: ALTURA_BASE };
  }
  // Tela mais "em pé" do que a largura mínima permite: fixa a largura e cresce a altura.
  return {
    width: LARGURA_MIN,
    height: Math.min(ALTURA_MAX, Math.round(LARGURA_MIN / proporcao)),
  };
}

// true quando vale a pena recriar o layout (o formato mudou de verdade).
export function mudouDeFormato(atual, novo) {
  const pa = atual.width / atual.height;
  const pn = novo.width / novo.height;
  return Math.abs(pn - pa) / pa > 0.08;
}
