// Regras das BADGES (insígnias) — JavaScript puro (sem Phaser), testável.
//
// Cada fase dá uma badge com um NÍVEL DE BRILHO (1 a 4) que depende de acertar
// RÁPIDO e SEM ERROS (item 13 do roadmap):
//   4 = holográfica  → sem erros E dentro do tempo-alvo (rápido)
//   3 = ouro         → sem erros
//   2 = prata        → até 2 erros
//   1 = bronze       → mais erros
// O tempo-alvo é ~7s por desafio (rodada) da fase.

export function calcularNivel(erros, tempoMs, rodadas) {
  const metaRapida = Math.max(1, rodadas) * 7000;
  if (erros === 0 && tempoMs <= metaRapida) return 4;
  if (erros === 0) return 3;
  if (erros <= 2) return 2;
  return 1;
}

// Nome/rótulo do nível (para leitura/aria; nada obrigatório na tela).
export const NIVEL_NOME = { 1: "Bronze", 2: "Prata", 3: "Ouro", 4: "Holográfica" };

// Pontos de uma fase = estrelas (0..3) e o nível do brilho da badge (1..4).
export function pontosDaFase(estrelas, nivel) {
  return (estrelas || 0) * 100 + (nivel || 0) * 50;
}

// Resume um conjunto de badges { idx: {nivel, estrelas, tempo} } em totais para
// o ranking. "perfeito" = todas as fases feitas com o brilho máximo (nível 4).
export function resumirBadges(badges, totalFases) {
  const vals = Object.values(badges || {});
  let pontos = 0;
  let estrelas = 0;
  let todasMax = vals.length > 0;
  for (const b of vals) {
    pontos += pontosDaFase(b.estrelas, b.nivel);
    estrelas += b.estrelas || 0;
    if (b.nivel !== 4) todasMax = false;
  }
  const perfeito = todasMax && totalFases > 0 && vals.length === totalFases;
  return { pontos, estrelas, perfeito, total: vals.length };
}
