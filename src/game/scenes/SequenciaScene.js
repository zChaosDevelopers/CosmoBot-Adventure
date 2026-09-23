import { TEMA } from "../tema.js";
import { gerarRodadasSequencia } from "../gerarRodadas.js";
import { falar } from "../../lib/fala.js";
import { somAcerto, pling } from "../../lib/sfx.js";
import FaseBase from "./FaseBase.js";

// Etapa 7 — "Traçar o Padrão": SEQUÊNCIA / PADRÃO.
// Mostra 3 caixas com os números da sequência e uma 4ª caixa "?"; a criança
// escolhe o número que vem depois. No acerto, a caixa "?" revela o número e as
// SETAS "+passo" aparecem entre as caixas — feedback VISUAL do padrão.
export default class SequenciaScene extends FaseBase {
  constructor() {
    super("SequenciaScene");
  }

  create() {
    this.iniciarFase();
    const cfg = this.fase.gerar || {};
    this.rodadas = gerarRodadasSequencia(cfg.rodadas ?? 4, cfg.max ?? 20);
    this.montarRodada();
    falar(this.fase.enunciado);
  }

  montarRodada() {
    if (this.grupo) this.grupo.destroy(true);
    this.grupo = this.add.container(0, 0);
    this.bloqueado = false;
    this.erros = 0;

    const centro = this.desenharCabecalho();
    const rodada = this.rodadas[this.rodadaAtual];
    this.rodada = rodada;

    const valores = [...rodada.termos, "?"];
    const n = valores.length;
    const boxW = 92;
    const gap = 22;
    const totalW = n * boxW + (n - 1) * gap;
    const startX = centro - totalW / 2 + boxW / 2;
    const cy = this.baseY + 96;

    this.caixas = [];
    this.setas = [];
    for (let i = 0; i < n; i++) {
      const x = startX + i * (boxW + gap);
      const ehInterrogacao = valores[i] === "?";
      this.caixas.push(this.desenharCaixaNum(x, cy, boxW, valores[i], ehInterrogacao));
      if (i > 0) {
        // Seta "+passo" entre as caixas (começa escondida; aparece no acerto).
        const sx = startX + (i - 1) * (boxW + gap) + boxW / 2 + gap / 2;
        const seta = this.add
          .text(sx, cy - boxW / 2 - 16, `+${rodada.passo}`, {
            fontFamily: TEMA.fonte,
            fontSize: this.fs("20px"),
            color: "#2bff88",
            fontStyle: "bold",
          })
          .setOrigin(0.5)
          .setAlpha(0);
        seta.setStroke("#0b1120", 4);
        this.grupo.add(seta);
        this.setas.push(seta);
      }
    }
    this.itens = this.caixas;

    this.criarBotoesResposta(centro, rodada.opcoes, (num) => this.responder(num));
    this.criarBotaoDica(() => this.darDica());
  }

  desenharCaixaNum(x, y, w, valor, ehInterrogacao) {
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    g.fillStyle(ehInterrogacao ? 0x1e293b : 0x0f172a, ehInterrogacao ? 1 : 0.6);
    g.lineStyle(4, ehInterrogacao ? TEMA.foco : 0x475569, ehInterrogacao ? 1 : 0.9);
    g.fillRoundedRect(-w / 2, -w / 2, w, w, 14);
    g.strokeRoundedRect(-w / 2, -w / 2, w, w, 14);
    c.add(g);
    const t = this.add
      .text(0, 0, `${valor}`, {
        fontFamily: TEMA.fonte,
        fontSize: this.fs("40px"),
        color: ehInterrogacao ? "#ffe000" : "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    c.add(t);
    c.rotulo = t;
    this.grupo.add(c);
    return c;
  }

  responder(num) {
    if (num === this.rodada.quantidade) this.acertou();
    else this.tentarDeNovo();
  }

  acertou() {
    this.bloqueado = true;
    this.botoes.forEach((b) => b.disableInteractive());
    this.pararTimerRodada?.();
    somAcerto();

    // A caixa "?" revela o número.
    const ultima = this.caixas[this.caixas.length - 1];
    ultima.rotulo.setText(`${this.rodada.quantidade}`).setColor("#2bff88");
    this.tweens.add({ targets: ultima, scale: 1.3, duration: 320, yoyo: true, ease: "Back.easeOut" });

    // Porquê VISUAL: as setas "+passo" acendem uma a uma, mostrando o padrão.
    this.setas.forEach((s, i) => {
      this.time.delayedCall(i * 260, () => {
        pling(i);
        s.setAlpha(1);
        this.tweens.add({ targets: s, y: s.y - 8, duration: 220, yoyo: true, ease: "Sine.easeInOut" });
        const a = this.caixas[i];
        const b = this.caixas[i + 1];
        [a, b].forEach((cx) => this.tweens.add({ targets: cx, scale: 1.12, duration: 180, yoyo: true }));
      });
    });

    falar(`Boa! O padrão é somar ${this.rodada.passo}. Depois vem ${this.rodada.quantidade}.`);
    this.time.delayedCall(1300, () => this.animarColeta(this.itens, () => this.aposAcerto()));
  }

  aposAcerto() {
    this.rodadaAtual++;
    if (this.rodadaAtual >= this.rodadas.length) {
      this.time.delayedCall(300, () => this.concluirEtapa(this.fase.tarefaOk));
    } else {
      this.time.delayedCall(300, () => this.montarRodada());
    }
  }

  tentarDeNovo() {
    this.registrarErro(this.itens, () => this.gerarUmaRodada(true));
  }

  gerarUmaRodada(facil) {
    const c = this.fase.gerar || {};
    return gerarRodadasSequencia(1, facil ? 12 : c.max ?? 20)[0];
  }

  // Dica VISUAL: pisca as caixas em ordem mostrando o "+passo" crescer.
  darDica() {
    falar("Veja quanto aumenta de uma para outra!");
    this.setas.forEach((s, i) => {
      this.time.delayedCall(i * 300, () => {
        pling(i);
        s.setAlpha(1);
        this.tweens.add({ targets: s, scale: 1.3, duration: 200, yoyo: true });
      });
    });
  }
}
