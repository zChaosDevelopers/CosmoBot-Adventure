// Etapa 8 — "Desafio Final": BOSS de revisão. Questões MISTAS (soma de 3
// parcelas, somas grandes de 2/3 dígitos, subtração, multiplicação, divisão e
// sequência) respondidas por opção, com a conta DESTACADA na tela. Um guardião
// perde vida a cada acerto até ser derrotado.
export const fase08 = {
  id: "fase-08",
  ano: "4º/5º ano",
  habilidade: "EF04MA03", // Revisão das operações
  modulo: "Desafio Final",
  emoji: "👑",
  cor: "#ffd43b",
  tipoPuzzle: "desafio",
  dificuldade: 8,
  enunciado: "Resolva as contas do guardião!",
  tarefaOk: "Você é um mestre do espaço! 👑",
  // Relatório de melhorias: boss mais curto (6 contas) para não ficar cansativo.
  gerar: { rodadas: 6 },
  comoJogar: [
    "O guardião tem vida: cada conta certa tira um pedaço dela!",
    "Erre até 3 vezes a mesma conta e a resposta aparece sozinha — o jogo sempre segue em frente.",
  ],
};
