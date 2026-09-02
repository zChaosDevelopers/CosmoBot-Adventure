import Phaser from "phaser";
import { TEMA } from "../tema.js";
import { desenharFundo, criarBotao, criarPersonagem, desenharTiraNave } from "../desenho.js";
import { falar } from "../../lib/fala.js";
import { somVitoria, pling } from "../../lib/sfx.js";

// Converte "#rrggbb" para número de cor do Phaser (com verde padrão de reserva).
function corNum(cor) {
  if (typeof cor === "number") return cor;
  const hex = String(cor || "").replace("#", "");
  return /^[0-9a-f]{6}$/i.test(hex) ? parseInt(hex, 16) : 0x51cf66;
}

// HUB da nave: entre uma etapa e outra, apresenta o próximo conserto do CosmoBot
// e mostra o robô avançando pela nave. Ao terminar tudo, a nave decola.
export default class EstacaoScene extends Phaser.Scene {
  constructor() {
    super("EstacaoScene");
  }

  create() {
    const { width, height } = this.scale;
    this.jogador = this.registry.get("jogador") || {};
    const avatar = this.jogador.avatar || "#51cf66";
    const apelido = this.jogador.apelido || "Explorador";
    const roteiro = this.registry.get("roteiro") || [];
    const idx = this.registry.get("indiceFase") || 0;

    desenharFundo(this);

    // Tira de progresso da nave (robô avança a cada etapa concluída).
    const etapas = roteiro.map((r) => ({ emoji: r.fase.emoji || "🔧", cor: r.fase.cor || "#ffd43b" }));
    desenharTiraNave(this, etapas, idx, { y: 40 });

    // Todas as etapas concluídas → a nave decola.
    if (idx >= roteiro.length) {
      this.mostrarFinal(avatar, apelido, roteiro.length);
      return;
    }

    const faseAtual = roteiro[idx].fase;
    const cor = faseAtual.cor || "#ffd43b";

    // CosmoBot flutuando.
    const robo = criarPersonagem(this, width / 2, height / 2 - 108, avatar, 100);
    this.tweens.add({ targets: robo, y: robo.y - 16, duration: 1200, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    this.add
      .text(width / 2, height / 2 - 36, `Etapa ${idx + 1} de ${roteiro.length}`, {
        fontFamily: TEMA.fonte,
        fontSize: "18px",
        color: "#ffd8a8",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 4, `${faseAtual.emoji || "🔧"}  ${faseAtual.modulo}`, {
        fontFamily: TEMA.fonte,
        fontSize: "34px",
        color: cor,
        align: "center",
        wordWrap: { width: width - 100 },
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 52, faseAtual.enunciado, {
        fontFamily: TEMA.fonte,
        fontSize: "18px",
        color: "#e2e8f0",
        align: "center",
        wordWrap: { width: width - 150 },
      })
      .setOrigin(0.5);

    const botao = criarBotao(
      this,
      width / 2,
      height / 2 + 144,
      "Consertar ▶",
      () => this.scene.start(roteiro[idx].cena),
      { largura: 300, altura: 68, fontSize: "26px", cor: corNum(cor) }
    );
    botao.setFoco(true);

    this.input.keyboard.on("keydown-ENTER", () => this.scene.start(roteiro[idx].cena));
    this.input.keyboard.on("keydown-SPACE", () => this.scene.start(roteiro[idx].cena));

    this.add
      .text(width / 2, height - 24, "Toque no botão ou aperte Enter", {
        fontFamily: TEMA.fonte,
        fontSize: "14px",
        color: "#64748b",
      })
      .setOrigin(0.5);

    const saudacao = idx === 0 ? `Vamos lá, ${apelido}! ` : "";
    falar(`${saudacao}Próximo conserto: ${faseAtual.modulo}. ${faseAtual.enunciado}`);
  }

  // ===== Celebração final: a nave decola rumo ao planeta =====
  mostrarFinal(avatar, apelido, totalEtapas) {
    const { width, height } = this.scale;

    const robo = criarPersonagem(this, width / 2, height / 2 - 60, avatar, 128);
    // A nave "decola": o robô sobe devagar.
    this.tweens.add({ targets: robo, y: robo.y - 26, duration: 1600, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    somVitoria();
    this.cameras.main.flash(500, 250, 220, 120);

    // Rastro de propulsão (partículas simples subindo).
    for (let i = 0; i < 10; i++) {
      const p = this.add.circle(width / 2 + Phaser.Math.Between(-30, 30), height / 2 + 40, Phaser.Math.Between(4, 9), TEMA.foco, 0.9);
      this.time.delayedCall(i * 90, () => {
        pling(i);
        this.tweens.add({ targets: p, y: p.y + 120, alpha: 0, duration: 700, ease: "Cubic.easeIn" });
      });
    }

    this.add
      .text(width / 2, height / 2 + 70, "A nave decolou! 🚀", {
        fontFamily: TEMA.fonte,
        fontSize: "40px",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    this.add
      .text(width / 2, height / 2 + 118, `Você ajudou o CosmoBot a consertar a nave em ${totalEtapas} etapas, ${apelido}!`, {
        fontFamily: TEMA.fonte,
        fontSize: "19px",
        color: "#ffd43b",
        align: "center",
        wordWrap: { width: width - 120 },
      })
      .setOrigin(0.5);

    const botao = criarBotao(
      this,
      width / 2,
      height - 60,
      "Jogar de novo ↻",
      () => {
        this.registry.set("indiceFase", 0);
        this.scene.start("EstacaoScene");
      },
      { largura: 280, altura: 60, fontSize: "23px" }
    );
    botao.setFoco(true);
    this.input.keyboard.on("keydown-ENTER", () => {
      this.registry.set("indiceFase", 0);
      this.scene.start("EstacaoScene");
    });

    falar(`Parabéns, ${apelido}! A nave do CosmoBot está pronta e decolou rumo ao planeta. Muito bem!`);
  }
}
