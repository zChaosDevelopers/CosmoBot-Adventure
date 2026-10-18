import Phaser from "phaser";
import { TEMA } from "../tema.js";
import { desenharFundo, criarBotao, criarPersonagem, desenharTiraNave } from "../desenho.js";
import { falar } from "../../lib/fala.js";
import { somVitoria, pling } from "../../lib/sfx.js";
import { podeAgir } from "../teclado.js";

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

    // O hub agora é a TELA DE SELEÇÃO DE FASES. A EstacaoScene é usada apenas
    // para a CELEBRAÇÃO FINAL (quando todas as fases foram concluídas). Se por
    // algum motivo chegarmos aqui no meio do jogo, volta para o mapa.
    if (idx < roteiro.length) {
      this.scene.start("SelecaoFasesScene");
      return;
    }

    desenharFundo(this);
    this.animarAmbiente(); // hub com vida: poeira estelar + respiração da câmera

    // Tira de progresso da nave (robô avança a cada etapa concluída), já com as
    // estrelas ganhas em cada etapa aparecendo embaixo de cada estação.
    const etapas = roteiro.map((r) => ({ emoji: r.fase.emoji || "🔧", cor: r.fase.cor || "#ffd43b" }));
    const estrelas = this.registry.get("estrelasPorEtapa") || {};
    desenharTiraNave(this, etapas, idx, { y: 40, estrelas });

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

    const ehToque = typeof document !== "undefined" && document.body.classList.contains("toque");
    this.add
      .text(width / 2, height - 24, ehToque ? "Toque no botão" : "Toque no botão ou aperte Enter", {
        fontFamily: TEMA.fonte,
        fontSize: "14px",
        color: "#64748b",
      })
      .setOrigin(0.5);

    const saudacao = idx === 0 ? `Vamos lá, ${apelido}! ` : "";
    falar(`${saudacao}Próximo conserto: ${faseAtual.modulo}. ${faseAtual.enunciado}`);
  }

  // ===== Ambiente lentamente animado (deixa o hub "vivo") =====
  animarAmbiente() {
    const { width, height } = this.scale;
    // Poeira estelar que cruza a tela BEM devagar.
    for (let i = 0; i < 6; i++) {
      const p = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(70, height - 70),
        Phaser.Math.Between(2, 4),
        0xffffff,
        Phaser.Math.FloatBetween(0.3, 0.6)
      );
      const dir = Phaser.Math.Between(0, 1) ? 1 : -1;
      this.tweens.add({
        targets: p,
        x: p.x + dir * Phaser.Math.Between(90, 170),
        y: p.y - Phaser.Math.Between(20, 60),
        alpha: 0.1,
        duration: Phaser.Math.Between(9000, 16000),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
    // "Respiração" bem lenta da câmera (dá sensação de espaço vivo).
    this.tweens.add({
      targets: this.cameras.main,
      zoom: 1.04,
      duration: 14000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
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
      .text(width / 2, height / 2 + 62, "A nave decolou! 🚀", {
        fontFamily: TEMA.fonte,
        fontSize: "40px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    // Total de estrelas ganhas na aventura (recompensa acumulada).
    const totalEstrelas = this.registry.get("estrelas") || 0;
    const maxEstrelas = totalEtapas * 3;
    const estrelasTxt = this.add
      .text(width / 2, height / 2 + 108, `⭐ ${totalEstrelas} / ${maxEstrelas}`, {
        fontFamily: TEMA.fonte,
        fontSize: "30px",
        color: "#ffe000",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setScale(0);
    this.tweens.add({ targets: estrelasTxt, scale: 1, duration: 500, delay: 300, ease: "Back.easeOut" });

    this.add
      .text(width / 2, height / 2 + 146, `Muito bem, ${apelido}!`, {
        fontFamily: TEMA.fonte,
        fontSize: "19px",
        color: "#ffd43b",
        align: "center",
        wordWrap: { width: width - 120 },
      })
      .setOrigin(0.5);

    const jogarDeNovo = () => {
      this.registry.set("indiceFase", 0);
      this.registry.set("estrelas", 0); // zera as estrelas para a nova aventura
      this.registry.set("estrelasPorEtapa", {});
      this.scene.start("SelecaoFasesScene"); // volta ao mapa para escolher fases
    };
    const botao = criarBotao(this, width / 2, height - 60, "Jogar de novo ↻", jogarDeNovo, {
      largura: 280,
      altura: 60,
      fontSize: "23px",
    });
    botao.setFoco(true);
    this.input.keyboard.on("keydown-ENTER", (e) => {
      if (podeAgir(this, e)) jogarDeNovo();
    });

    falar(`Parabéns, ${apelido}! A nave do CosmoBot está pronta e decolou rumo ao planeta. Muito bem!`);
  }
}
