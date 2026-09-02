import { TEMA } from "../tema.js";
import { desenharLuz, desenharCaixa } from "../desenho.js";
import { gerarRodadasDivisao } from "../gerarRodadas.js";
import { falar } from "../../lib/fala.js";
import { somAcerto, somErro, pling } from "../../lib/sfx.js";
import FaseBase from "./FaseBase.js";

// Etapa 5 — "Traçar a Rota": DIVISÃO (repartir em partes iguais). O combustível é
// dividido igualmente entre os tanques. A criança descobre quanto vai em cada um.
// Ex.: 12 de combustível para 3 tanques => 4 em cada.
export default class DivisaoScene extends FaseBase {
  constructor() {
    super("DivisaoScene");
  }

  create() {
    this.iniciarFase();
    const cfg = this.fase.gerar || {};
    this.rodadas = gerarRodadasDivisao(cfg.rodadas ?? 3, cfg.maxDivisor ?? 4, cfg.maxQuociente ?? 5);
    this.montarRodada();
    falar(this.fase.enunciado);
  }

  montarRodada() {
    if (this.grupo) this.grupo.destroy(true);
    this.grupo = this.add.container(0, 0);
    this.bloqueado = false;

    const centro = this.desenharCabecalho();
    const rodada = this.rodadas[this.rodadaAtual];

    // Combustível (o total a repartir), grid de até 5 por linha.
    this.itens = [];
    const cols = Math.min(5, rodada.total);
    const passo = 44;
    const inicioX = centro - ((cols - 1) * passo) / 2;
    for (let i = 0; i < rodada.total; i++) {
      const col = i % 5;
      const row = Math.floor(i / 5);
      const x = inicioX + col * passo;
      const y = 158 + row * 38;
      const cor = TEMA.coresCristal[i % TEMA.coresCristal.length];
      const gota = desenharLuz(this, x, y, cor, true, 11);
      this.grupo.add(gota);
      this.itemInterativo(gota);
      this.itens.push(gota);
    }

    // Tanques (caixas) que vão receber o combustível, iguais para todos.
    const espaco = Math.min(150, (this.scale.width - 160) / rodada.divisor);
    const tanquesX = centro - ((rodada.divisor - 1) * espaco) / 2;
    const tanqueY = 358;
    for (let r = 0; r < rodada.divisor; r++) {
      const x = tanquesX + r * espaco;
      this.grupo.add(desenharCaixa(this, x, tanqueY, 70, 58, "#cc5de8", `Tanque ${r + 1}`));
      const q = this.add
        .text(x, tanqueY, "?", { fontFamily: TEMA.fonte, fontSize: "24px", color: "#ffd43b" })
        .setOrigin(0.5);
      this.grupo.add(q);
    }

    const conta = this.add
      .text(centro, 420, `${rodada.total} ÷ ${rodada.divisor} = ?`, {
        fontFamily: TEMA.fonte,
        fontSize: "28px",
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
    falar(`Quase! São ${r.total} de combustível para ${r.divisor} tanques, iguais para cada um.`);
    this.itens.forEach((c, i) => {
      this.time.delayedCall(i * 80, () => {
        pling(i);
        this.tweens.add({ targets: c, scaleX: c.scaleX * 1.35, scaleY: c.scaleY * 1.35, duration: 140, yoyo: true });
      });
    });
  }
}
