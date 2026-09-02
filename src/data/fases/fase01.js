// Cada etapa é guardada como DADO (na Sprint 01 fica aqui no código; na Engine
// virá do Supabase com a MESMA estrutura). "gerar" cria rodadas ALEATÓRIAS a
// cada partida, então o jogo nunca fica repetitivo.
//
// Etapa 1 — "Ligar o Painel": CONTAGEM. O robô conta as luzes acesas do painel
// de comando para ligá-lo (quantidades de 3 a 12). Aquecimento da aventura.
export const fase01 = {
  id: "fase-01",
  ano: "1º/2º ano",
  habilidade: "EF01MA01", // Contagem de rotina / quantidades
  modulo: "Ligar o Painel",
  emoji: "🎛️",
  cor: "#22d3ee",
  tipoPuzzle: "contagem",
  dificuldade: 1,
  enunciado: "Conte as luzes acesas do painel e escolha o número certo!",
  tarefaOk: "Painel ligado! 💡",
  gerar: { rodadas: 3, min: 3, max: 12 },
};
