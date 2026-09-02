import { TEMA } from "../tema.js";
import { desenharLuz, desenharCaixa } from "../desenho.js";
import { gerarRodadasMultiplicacao } from "../gerarRodadas.js";
import { falar } from "../../lib/fala.js";
import { somAcerto, somErro, pling } from "../../lib/sfx.js";
import FaseBase from "./FaseBase.js";

// Etapa 4 — "Ligar os Motores": MULTIPLICAÇÃO pelo modelo de ARRANJO. Os motores
// têm FILEIRAS IGUAIS de células. A criança descobre o total. Ex.: 3 x 4 = 12.
export default class MultiplicacaoScene extends FaseBase {
  constructor() {
    super("MultiplicacaoScene");
  }

  create() {
    this.iniciarFase();
    const cfg = this.fase.gerar || {};
    this.rodadas = gerarRodadasMultiplicacao(cfg.rodadas ?? 3, cfg.maxGrupos ?? 4, cfg.maxPorGrupo ?? 5);
    this.montarRodada();
    falar(this.fase.enunciado);
  }

  montarRodada() {
    if (this.grupo) this.grupo.destroy(true);
    this.grupo = this.add.container(0, 0);
    this.bloqueado = false;

    const centro = this.desenharCabecalho();
    const rodada = this.rodadas[this.rodadaAtual];

    this.itens = [];
    const passo = 44;
    const alturaFileira = 56;
    const centroY = 244;
    const startY = centroY - ((rodada.grupos - 1) * alturaFileira) / 2;

    for (let g = 0; g < rodada.grupos; g++) {
      const fy = startY + g * alturaFileira;
      const cor = TEMA.coresCristal[g % TEMA.coresCristal.length];
      const largura = rodada.porGrupo * passo + 22;
      this.grupo.add(desenharCaixa(this, centro, fy, largura, 48, cor));

      const inicioX = centro - ((rodada.porGrupo - 1) * passo) / 2;
      for (let i = 0; i < rodada.porGrupo; i++) {
        const cel = desenharLuz(this, inicioX + i * passo, fy, cor, true, 13);
        this.grupo.add(cel);
        this.itemInterativo(cel);
        this.itens.push(cel);
      }
    }

    const conta = this.add
      .text(centro, 402, `${rodada.grupos} × ${rodada.porGrupo} = ?`, {
        fontFamily: TEMA.fonte,
        fontSize: "30px",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    this.grupo.add(conta);

    this.criarBotoesResposta(centro, rodada.opcoes, (num) => this.responder(num));
  }

  responder(escolha) {
    const rodada = this.rodadas[this.rodadaAtual];
    if (escolha === rodada.quantidade) this.acertou();
    else this.tentarDeNovo();
  }

  acertou() {
    this.bloqueado = true;
    this.botoes.forEach((b) => b.disableInteractive());
    somAcerto();
    this.animarColeta(this.itens, () => this.aposAcerto());
  }

  aposAcerto() {
    this.rodadaAtual++;
    if (this.rodadaAtual >= this.rodadas.length) {
      this.time.delayedCall(400, () => this.concluirEtapa(this.fase.tarefaOk));
    } else {
      this.time.delayedCall(400, () => this.montarRodada());
    }
  }

  tentarDeNovo() {
    const r = this.rodadas[this.rodadaAtual];
    somErro();
    falar(`Quase! São ${r.grupos} fileiras de ${r.porGrupo}. Conte todas as células.`);
    this.itens.forEach((c, i) => {
      this.time.delayedCall(i * 110, () => {
        pling(i);
        this.tweens.add({ targets: c, scaleX: c.scaleX * 1.3, scaleY: c.scaleY * 1.3, duration: 150, yoyo: true });
      });
    });
  }
}
