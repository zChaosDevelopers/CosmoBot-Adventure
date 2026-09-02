// Etapa 3 — "Encher as Baterias": SUBTRAÇÃO. A bateria tem várias células
// carregadas e algumas descarregam. Quantas ainda têm carga? Ex.: 10 células,
// 4 descarregam => 6 continuam cheias (total de 5 a 12, resultado >= 1).
export const fase03 = {
  id: "fase-03",
  ano: "2º/3º ano",
  habilidade: "EF02MA06", // Subtração — retirar/comparar
  modulo: "Encher as Baterias",
  emoji: "🔋",
  cor: "#ff922b",
  tipoPuzzle: "subtracao",
  dificuldade: 3,
  enunciado: "Algumas células descarregaram. Quantas ainda têm carga?",
  tarefaOk: "Baterias prontas! 🔋",
  gerar: { rodadas: 3, min: 5, max: 12 },
};
