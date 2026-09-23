import { gerarRodadasMultiplicacao } from "../gerarRodadas.js";
import FaseDistribuir from "./FaseDistribuir.js";

// Etapa 4 — "Ligar os Motores": MULTIPLICAÇÃO como GRUPOS IGUAIS.
// A criança enche cada motor com a MESMA quantidade e, ao montar os grupos
// iguais, descobre o total (N grupos de X = N × X). Toda a mecânica mora em
// FaseDistribuir; aqui só ficam as diferenças da multiplicação.
export default class MultiplicacaoScene extends FaseDistribuir {
  constructor() {
    super("MultiplicacaoScene");
  }

  gerarRodadasIniciais() {
    const c = this.fase.gerar || {};
    return gerarRodadasMultiplicacao(c.rodadas ?? 3, c.maxGrupos ?? 3, c.maxPorGrupo ?? 5);
  }

  // "facil" (após estourar) usa números menores — adapta para quem erra.
  gerarUmaRodada(facil) {
    const c = this.fase.gerar || {};
    return gerarRodadasMultiplicacao(1, facil ? 2 : c.maxGrupos ?? 3, facil ? 3 : c.maxPorGrupo ?? 5)[0];
  }

  configRodada(r) {
    return {
      total: r.quantidade, // grupos × porGrupo
      nZonas: r.grupos,
      alvoPorZona: r.porGrupo, // quantos em cada motor
      rotuloZona: "Motor",
      corZona: "#ff922b",
      info: `🔩 ${r.porGrupo} em cada motor  •  ${r.quantidade} células disponíveis`,
    };
  }

  textoSucesso() {
    const r = this.rodada;
    return `${r.grupos} × ${r.porGrupo} = ${r.quantidade} 🎉`;
  }

  narracaoSucesso() {
    const r = this.rodada;
    return `Muito bem! ${r.grupos} motores com ${r.porGrupo} células dá ${r.quantidade} ao todo.`;
  }
}
