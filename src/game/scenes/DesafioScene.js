import Phaser from "phaser";
import { TEMA } from "../tema.js";
import { gerarRodadasDesafio } from "../gerarRodadas.js";
import { falar } from "../../lib/fala.js";
import { somAcerto, somErro, pling } from "../../lib/sfx.js";
import FaseBase from "./FaseBase.js";

// Etapa 8 — "Desafio Final": BOSS de revisão. Questões MISTAS por opção, com a
// CONTA DESTACADA num box grande no centro. Inclui contas maiores (A + B + C e
// xx + xxx). Um guardião perde vida a cada acerto até ser derrotado. Se a criança
// erra 3x a mesma conta, a resposta é revelada e o jogo segue (nunca trava).
export default class DesafioScene extends FaseBase {
  constructor() {
    super("DesafioScene");
  }

  create() {
    this.iniciarFase();
    const cfg = this.fase.gerar || {};
    this.rodadas = gerarRodadasDesafio(cfg.rodadas ?? 6);
    this.vidaMax = this.rodadas.length;
    this.vida = this.vidaMax;
    this.desenharGuardiao();
    this.montarRodada();
    falar("Desafio final! Resolva as contas para vencer o guardião.");
  }

  // Guardião + barra de vida (ficam fora de this.grupo para não sumirem a cada rodada).
  desenharGuardiao() {
    const { width } = this.scale;
    const bx = width / 2;
    const by = 168;
    this.bossLayer = this.add.container(0, 0);
    this.boss = this.add.container(bx, by);

    const glow = this.add.circle(0, 0, 48, 0x9b5cff, 0.3);
    const corpo = this.add.circle(0, 0, 38, 0x6d28d9);
    corpo.setStrokeStyle(4, 0xb15cff, 1);
    const olhoE = this.add.circle(-13, -6, 7, 0xffffff);
    const olhoD = this.add.circle(13, -6, 7, 0xffffff);
    const pupE = this.add.circle(-13, -6, 3.5, 0x0b1120);
    const pupD = this.add.circle(13, -6, 3.5, 0x0b1120);
    const boca = this.add.graphics();
    boca.lineStyle(4, 0x0b1120, 1);
    boca.beginPath();
    boca.arc(0, 16, 10, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(340));
    boca.strokePath();
    this.boss.add([glow, corpo, olhoE, olhoD, pupE, pupD, boca]);
    this.bossLayer.add(this.boss);
    this.tweens.add({ targets: this.boss, y: by - 10, duration: 1400, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    // Barra de vida do guardião.
    const w = 220;
    const y = by + 62;
    this.bossLayer.add(this.add.rectangle(bx, y, w, 12, 0x1e293b, 0.9));
    this.hpBarra = this.add.rectangle(bx - w / 2, y, w, 12, 0xff3b5c, 1).setOrigin(0, 0.5);
    this.bossLayer.add(this.hpBarra);
    const cor = this.add.text(bx, y - 26, "👾 Guardião", { fontFamily: TEMA.fonte, fontSize: this.fs("15px"), color: "#e2e8f0" }).setOrigin(0.5);
    this.bossLayer.add(cor);
  }

  montarRodada() {
    if (this.grupo) this.grupo.destroy(true);
    this.grupo = this.add.container(0, 0);
    this.bloqueado = false;
    this.erros = 0;

    const centro = this.desenharCabecalho();
    const q = this.rodadas[this.rodadaAtual];
    this.q = q;

    // ===== Conta DESTACADA (box grande no centro) =====
    const bw = Math.min(470, this.scale.width - 70);
    const bh = 98;
    const ey = 322;
    const g = this.add.graphics();
    g.fillStyle(0x0b1120, 0.92);
    g.fillRoundedRect(centro - bw / 2, ey - bh / 2, bw, bh, 18);
    g.lineStyle(5, TEMA.foco, 1);
    g.strokeRoundedRect(centro - bw / 2, ey - bh / 2, bw, bh, 18);
    this.grupo.add(g);

    this.eqBox = this.add.container(centro, ey);
    this.eqTxt = this.add
      .text(0, 0, `${q.icone}  ${q.prompt} = ?`, {
        fontFamily: TEMA.fonte,
        fontSize: this.fs("38px"),
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.eqBox.add(this.eqTxt);
    this.grupo.add(this.eqBox);
    this.tweens.add({ targets: this.eqBox, scale: { from: 0.6, to: 1 }, duration: 300, ease: "Back.easeOut" });

    this.criarBotoesResposta(centro, q.opcoes, (num) => this.responder(num));
  }

  responder(num) {
    if (num === this.q.quantidade) this.acertou();
    else this.errou(num);
  }

  acertou() {
    this.bloqueado = true;
    this.botoes.forEach((b) => b.disableInteractive());
    somAcerto();
    this.eqTxt.setText(`${this.q.icone}  ${this.q.prompt} = ${this.q.quantidade}`).setColor("#2bff88");
    this.tweens.add({ targets: this.eqBox, scale: 1.15, duration: 260, yoyo: true, ease: "Back.easeOut" });
    this.acertarBoss();
    falar(`Isso! ${this.q.prompt} é ${this.q.quantidade}.`);
    this.time.delayedCall(1100, () => this.aposAcerto());
  }

  errou(num) {
    this.erros = (this.erros || 0) + 1;
    this.errosEtapa = (this.errosEtapa || 0) + 1;
    somErro();
    const botao = this.botoes.find((b) => b.valor === num);
    if (botao) {
      this.tweens.add({ targets: botao, x: botao.x + 8, duration: 55, yoyo: true, repeat: 3 });
    }
    this.tweens.add({ targets: this.eqBox, angle: 3, duration: 55, yoyo: true, repeat: 3, onComplete: () => (this.eqBox.angle = 0) });
    // Errou 3x a mesma conta → revela a resposta e segue (nunca trava).
    if (this.erros >= 3) this.revelarEAvancar();
  }

  revelarEAvancar() {
    this.bloqueado = true;
    this.botoes.forEach((b) => b.disableInteractive());
    const certo = this.botoes.find((b) => b.valor === this.q.quantidade);
    if (certo) {
      certo.setFoco(true);
      this.tweens.add({ targets: certo, scale: 1.15, duration: 260, yoyo: true, repeat: 1 });
    }
    this.eqTxt.setText(`${this.q.icone}  ${this.q.prompt} = ${this.q.quantidade}`).setColor("#ffd43b");
    this.acertarBoss();
    falar(`A resposta era ${this.q.quantidade}. Vamos para a próxima!`);
    this.time.delayedCall(1300, () => this.aposAcerto());
  }

  // Guardião leva um golpe: treme, pisca e a barra de vida cai.
  acertarBoss() {
    this.vida = Math.max(0, this.vida - 1);
    this.tweens.add({ targets: this.hpBarra, scaleX: this.vida / this.vidaMax, duration: 300, ease: "Cubic.easeOut" });
    this.cameras.main.flash(140, 180, 90, 255);
    pling(this.vidaMax - this.vida);
    this.tweens.add({ targets: this.boss, x: this.boss.x + Phaser.Math.Between(-8, 8), duration: 45, yoyo: true, repeat: 4 });
    for (let k = 0; k < 6; k++) {
      const p = this.add.circle(this.boss.x, this.boss.y, 5, 0xb15cff, 0.9);
      const ang = Phaser.Math.FloatBetween(0, Math.PI * 2);
      this.tweens.add({ targets: p, x: p.x + Math.cos(ang) * 60, y: p.y + Math.sin(ang) * 60, alpha: 0, duration: 500, onComplete: () => p.destroy() });
    }
    if (this.vida <= 0) {
      this.tweens.add({ targets: this.boss, scale: 0, angle: 220, alpha: 0, duration: 700, delay: 200, ease: "Back.easeIn" });
    }
  }

  aposAcerto() {
    this.rodadaAtual++;
    if (this.rodadaAtual >= this.rodadas.length) {
      this.time.delayedCall(400, () => this.concluirEtapa(this.fase.tarefaOk));
    } else {
      this.time.delayedCall(200, () => this.montarRodada());
    }
  }
}
