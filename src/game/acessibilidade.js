// Ponte entre as preferências de acessibilidade do React (classes no <body>)
// e o jogo (Phaser). Assim "Contraste alto" e "Fonte grande" também valem
// DENTRO do jogo, não só nas telas de menu.

export function lerAcessibilidade() {
  const cls = typeof document !== "undefined" && document.body ? document.body.classList : null;
  const contraste = !!cls && cls.contains("contraste-alto");
  const fonteGrande = !!cls && cls.contains("fonte-grande");
  return { contraste, fonteGrande, escala: fonteGrande ? 1.22 : 1 };
}

// Multiplica um tamanho de fonte ("22px") pela escala. px("22px", 1.22) => "27px".
export function px(tamanho, escala = 1) {
  const n = parseFloat(tamanho) || 16;
  return `${Math.round(n * escala)}px`;
}

// Ícone (emoji) que representa a operação de cada etapa — pista visual para
// quem ainda não lê.
export const ICONE_OPERACAO = {
  contagem: "🔢",
  soma: "➕",
  subtracao: "➖",
  multiplicacao: "✖️",
  divisao: "➗",
  comparacao: "⚖️",
  sequencia: "➡️",
  desafio: "🏆",
};
