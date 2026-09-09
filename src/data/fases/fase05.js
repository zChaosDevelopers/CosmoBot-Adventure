// Etapa 5 — "Traçar a Rota": DIVISÃO (repartir em partes iguais). O combustível
// é dividido igualmente entre os tanques da nave. Quanto vai em cada tanque?
// Ex.: 12 de combustível para 3 tanques => 4 em cada. Divisão sempre EXATA.
export const fase05 = {
  id: "fase-05",
  ano: "3º/4º ano",
  habilidade: "EF03MA08", // Divisão — repartir em partes iguais
  modulo: "Traçar a Rota",
  emoji: "🧭",
  cor: "#cc5de8",
  tipoPuzzle: "divisao",
  dificuldade: 5,
  enunciado: "Arraste o combustível e reparta igualmente entre os tanques!",
  tarefaOk: "Rota traçada! 🧭",
  gerar: { rodadas: 3, maxDivisor: 3, maxQuociente: 4 },
};
