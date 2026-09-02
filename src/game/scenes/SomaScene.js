import { TEMA } from "../tema.js";
import { desenharLuz, desenharCaixa } from "../desenho.js";
import { gerarRodadasSoma } from "../gerarRodadas.js";
import { falar } from "../../lib/fala.js";
import { somAcerto, somErro, pling } from "../../lib/sfx.js";
import FaseBase from "./FaseBase.js";

// Etapa 2 — "Abrir a Comporta": some as peças de DUAS caixas para achar o código.
// Ex.: 4 peças + 3 peças = 7. Rodadas aleatórias (cada caixa de 2 a 9).
export default class SomaScene extends FaseBase {
  constructor() {
    super("SomaScene");
  }

  create() {
    this.iniciarFase();
    const cfg = this.fase.gerar || {};
    this.rodadas = gerarRodadasSoma(cfg.rodadas ?? 3, cfg.min ?? 2, cfg.max ?? 9);
    this.montarRodada();
    falar(this.fase.enunciado);
  }

  // Desenha uma caixa com "qtd" peças em fileira, centrada em X.
  desenharCaixaComPecas(centro, y, qtd, cor) {
    const passo = 32;
    const largura = Math.max(120, qtd * passo + 26);
    this.grupo.add(desenharCaixa(this, centro, y, largura, 52, cor));
    const inicioX = centro - ((qtd - 1) * passo) / 2;
    for (let i = 0; i < qtd; i++) {
      const chip = desenharLuz(this, inicioX + i * passo, y, cor, true, 12);
      this.grupo.add(chip);
      this.itemInterativo(chip);
      this.itens.push(chip);
    }
  }

  montarRodada() {
    if (this.grupo) this.grupo.destroy(true);
    this.grupo = this.add.container(0, 0);
    this.bloqueado = false;

    const centro = this.desenharCabecalho();
    const rodada = this.rodadas[this.rodadaAtual];

    this.itens = [];
    this.desenharCaixaComPecas(centro, 182, rodada.a, "#22d3ee");

    const mais = this.add
      .text(centro, 230, "+", { fontFamily: TEMA.fonte, fontSize: "32px", color: "#ffd43b" })
      .setOrigin(0.5);
    this.grupo.add(mais);

    this.desenharCaixaComPecas(centro, 278, rodada.b, "#51cf66");

    const conta = this.add
      .text(centro, 346, `${rodada.a} + ${rodada.b} = ?`, {
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
    falar(`Quase! Some: ${r.a} mais ${r.b}. Conte todas as peças.`);
    this.itens.forEach((c, i) => {
      this.time.delayedCall(i * 140, () => {
        pling(i);
        this.tweens.add({ targets: c, scaleX: c.scaleX * 1.25, scaleY: c.scaleY * 1.25, duration: 150, yoyo: true });
      });
    });
  }
}
