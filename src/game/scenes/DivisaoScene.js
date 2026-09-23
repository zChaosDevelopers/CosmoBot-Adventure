import { gerarRodadasDivisao } from "../gerarRodadas.js";
import FaseDistribuir from "./FaseDistribuir.js";

// Etapa 5 — "Traçar a Rota": DIVISÃO como REPARTIÇÃO (partes iguais).
// A criança arrasta o combustível para os tanques e deixa TODOS iguais; ao
// repartir tudo por igual, descobre quanto vai em cada tanque. Toda a mecânica
// mora em FaseDistribuir; aqui só ficam as diferenças da divisão.
export default class DivisaoScene extends FaseDistribuir {
  constructor() {
    super("DivisaoScene");
  }

  gerarRodadasIniciais() {
    const c = this.fase.gerar || {};
    return gerarRodadasDivisao(c.rodadas ?? 3, c.maxDivisor ?? 3, c.maxQuociente ?? 5);
  }

  // "facil" (após estourar) usa números menores — adapta para quem erra.
  gerarUmaRodada(facil) {
    const c = this.fase.gerar || {};
    return gerarRodadasDivisao(1, facil ? 2 : c.maxDivisor ?? 3, facil ? 3 : c.maxQuociente ?? 5)[0];
  }

  configRodada(r) {
    return {
      total: r.total,
      nZonas: r.divisor,
      alvoPorZona: r.quantidade, // quociente = quanto vai em cada tanque
      rotuloZona: "Tanque",
      corZona: "#cc5de8",
      info: `⛽ Combustível: ${r.total}  •  ${r.divisor} tanques iguais`,
    };
  }

  textoSucesso(porZona) {
    const r = this.rodada;
    return `${r.total} ÷ ${r.divisor} = ${porZona} 🎉`;
  }

  narracaoSucesso(porZona) {
    const r = this.rodada;
    return `Muito bem! ${r.total} repartido em ${r.divisor} tanques dá ${porZona} em cada um.`;
  }
}
