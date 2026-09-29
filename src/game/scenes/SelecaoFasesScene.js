import Phaser from "phaser";
import { TEMA } from "../tema.js";
import { desenharFundo, criarBotao, criarPersonagem } from "../desenho.js";
import { falar } from "../../lib/fala.js";
import { pling } from "../../lib/sfx.js";
import { podeAgir } from "../teclado.js";

// Converte "#rrggbb" para número de cor do Phaser.
function corNum(cor) {
  if (typeof cor === "number") return cor;
  const hex = String(cor || "").replace("#", "");
  return /^[0-9a-f]{6}$/i.test(hex) ? parseInt(hex, 16) : 0xffd43b;
}

// TELA DE SELEÇÃO DE FASES (mapa da aventura). Mostra as 8 fases em medalhões
// com a cor/emoji de cada uma. A fase concluída ganha anel colorido + ✓ + as
// estrelas; a próxima liberada pulsa; as travadas aparecem com 🔒 (liberam ao
// concluir a anterior). Ao concluir as 8, aparece "Decolar 🚀".
export default class SelecaoFasesScene extends Phaser.Scene {
  constructor() {
    super("SelecaoFasesScene");
  }

  create() {
    const { width } = this.scale;
    this.roteiro = this.registry.get("roteiro") || [];
    this.jogador = this.registry.get("jogador") || {};
    this.estrelas = this.registry.get("estrelasPorEtapa") || {};
    this.badges = this.registry.get("badges") || {}; // { idx: {nivel, estrelas} }

    desenharFundo(this);

    this.add
      .text(width / 2, 54, "🗺️  Escolha a fase", {
        fontFamily: TEMA.fonte,
        fontSize: "34px",
        color: "#ffd8a8",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Total de estrelas já conquistadas (recompensa visível no topo).
    const totalEst = Object.values(this.estrelas).reduce((a, b) => a + b, 0);
    this.add
      .text(width / 2, 90, `⭐ ${totalEst}`, { fontFamily: TEMA.fonte, fontSize: "22px", color: "#ffe000" })
      .setOrigin(0.5);

    // Grade 4 x 2.
    const colX = [140, 313, 486, 659];
    const rowY = [215, 380];
    this.nos = [];
    this.roteiro.forEach((item, i) => {
      const x = colX[i % 4];
      const y = rowY[Math.floor(i / 4)];
      this.desenharNo(item.fase, i, x, y);
    });

    // Anel de foco do teclado (setas movem entre as fases liberadas).
    this.focoRing = this.add.graphics();

    // Concluiu tudo? Mostra o botão de decolar (celebração final).
    const tudoFeito = this.roteiro.length > 0 && this.roteiro.every((_, i) => this.estrelas[i] != null);
    if (tudoFeito) {
      const b = criarBotao(this, width / 2, 545, "Decolar 🚀", () => this.decolar(), {
        largura: 300,
        altura: 62,
        fontSize: "26px",
        cor: 0x2bff88,
      });
      b.setFoco(true);
      this.input.keyboard.on("keydown-ENTER", (e) => {
        if (podeAgir(this, e)) this.decolar();
      });
      falar("Você concluiu todas as fases! Toque em decolar!");
    } else {
      const proxima = this.roteiro.findIndex((_, i) => this.estrelas[i] == null);
      this.add
        .text(width / 2, 545, "Toque numa fase — ou mova o CosmoBot com as setas ⬅️➡️", {
          fontFamily: TEMA.fonte,
          fontSize: "16px",
          color: "#94a3b8",
        })
        .setOrigin(0.5);
      const nome = this.roteiro[proxima]?.fase?.modulo;
      if (nome) falar(`Escolha uma fase. A próxima é ${nome}.`);
    }

    this.configurarTecladoMapa(tudoFeito);

    // Personagem controlável (vibe Pico Park): o CosmoBot fica em cima do planeta
    // em foco e "voa" para o próximo quando a criança usa as setas. Foguete
    // decorativo cruza o fundo devagar (só enfeite).
    this.criarCosmoNoMapa();
    this.criarFogueteDecorativo();
  }

  // Cria o CosmoBot controlável, pousado no planeta em foco.
  criarCosmoNoMapa() {
    if (!this.nos.length) return;
    const n = this.nos[this.focoSel] || this.nos[0];
    this.cosmo = criarPersonagem(this, n.x, n.y, this.jogador.avatar || "#2bff88", 46);
    this.cosmo.setDepth(50);
    // Respiração (idle) — só escala, para não brigar com o movimento em X/Y.
    this.cosmoIdle = this.tweens.add({
      targets: this.cosmo,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  // Move o CosmoBot até um planeta (voa suave); chama aoChegar ao pousar.
  moverCosmoPara(x, y, aoChegar) {
    if (!this.cosmo) {
      aoChegar?.();
      return;
    }
    if (this.cosmoMoveTween) this.cosmoMoveTween.remove();
    // Rastro de estrelinhas atrás do CosmoBot enquanto voa (juice).
    for (let k = 0; k < 4; k++) {
      this.time.delayedCall(k * 55, () => {
        if (!this.cosmo) return;
        const t = this.add
          .text(this.cosmo.x, this.cosmo.y + 6, "✨", { fontFamily: TEMA.fonte, fontSize: "16px" })
          .setOrigin(0.5)
          .setDepth(49)
          .setAlpha(0.9);
        this.tweens.add({ targets: t, alpha: 0, scale: 0.4, duration: 400, onComplete: () => t.destroy() });
      });
    }
    this.cosmoMoveTween = this.tweens.add({
      targets: this.cosmo,
      x,
      y,
      duration: 300,
      ease: "Cubic.easeInOut",
      onComplete: () => {
        this.cosmoMoveTween = null;
        this.poofNoPlaneta(x, y); // faísca ao pousar
        aoChegar?.();
      },
    });
  }

  // Pequena faísca de pouso quando o CosmoBot chega num planeta (juice).
  poofNoPlaneta(x, y) {
    for (let k = 0; k < 7; k++) {
      const ang = (k / 7) * Math.PI * 2;
      const p = this.add.circle(x, y, 4, 0xffe066, 1).setDepth(48);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(ang) * 40,
        y: y + Math.sin(ang) * 40,
        alpha: 0,
        scale: 0.2,
        duration: 420,
        ease: "Cubic.easeOut",
        onComplete: () => p.destroy(),
      });
    }
  }

  // Foguete decorativo cruzando o fundo, na faixa livre acima dos planetas.
  criarFogueteDecorativo() {
    if (!this.textures.exists("foguete")) return;
    const { width } = this.scale;
    const f = this.add.image(-60, 140, "foguete").setDisplaySize(52, 52).setAlpha(0.45).setDepth(2);
    const voar = () => {
      if (!f.active) return;
      // Faixa livre ENTRE o cabeçalho e a 1ª fileira de planetas (que começa em
      // ~y169) — assim o enfeite nunca sobrepõe os planetas.
      f.setPosition(-60, Phaser.Math.Between(108, 138));
      f.setAngle(Phaser.Math.Between(-8, 8));
      this.cosmoFogueteTween = this.tweens.add({
        targets: f,
        x: width + 60,
        duration: Phaser.Math.Between(9000, 14000),
        ease: "Linear",
        onComplete: voar,
      });
    };
    voar();
  }

  // Setas movem o foco entre as fases liberadas; Enter joga a fase em foco (fora
  // do estado "tudo feito", onde o Enter já dispara o decolar). Passa por
  // podeAgir() para não sofrer com o "spam" de Enter herdado da tela anterior.
  configurarTecladoMapa(tudoFeito) {
    if (!this.nos.length) return;
    // Começa o foco na primeira fase liberada ainda não concluída.
    this.focoSel = Math.max(0, this.nos.findIndex((n) => this.estrelas[n.i] == null));
    if (this.focoSel < 0) this.focoSel = 0;
    this.desenharFocoRing();

    const mover = (d) => {
      this.focoSel = Phaser.Math.Wrap(this.focoSel + d, 0, this.nos.length);
      this.desenharFocoRing();
      const n = this.nos[this.focoSel];
      if (n) this.moverCosmoPara(n.x, n.y); // o CosmoBot voa para o planeta
      pling(0);
    };
    this.input.keyboard.on("keydown-RIGHT", () => mover(1));
    this.input.keyboard.on("keydown-DOWN", () => mover(1));
    this.input.keyboard.on("keydown-LEFT", () => mover(-1));
    this.input.keyboard.on("keydown-UP", () => mover(-1));
    if (!tudoFeito) {
      this.input.keyboard.on("keydown-ENTER", (e) => {
        if (!podeAgir(this, e)) return;
        const n = this.nos[this.focoSel];
        if (n) this.escolher(n.i, n.fase);
      });
    }
  }

  desenharFocoRing() {
    const n = this.nos[this.focoSel];
    if (!n || !this.focoRing) return;
    this.focoRing.clear();
    this.focoRing.lineStyle(4, TEMA.foco, 1);
    this.focoRing.strokeCircle(n.x, n.y, 56);
  }

  desenharNo(fase, i, x, y) {
    const cor = corNum(fase.cor);
    const concluida = this.estrelas[i] != null;
    // Liberada = a primeira ou logo após uma concluída.
    const liberada = i === 0 || this.estrelas[i - 1] != null;
    const R = 46;

    // Anel/medalhão. Se existir a arte da badge (badge-1..8), usa a imagem —
    // com BRILHO conforme o nível conquistado (item 13).
    const chaveBadge = `badge-${i + 1}`;
    if (concluida && this.textures.exists(chaveBadge)) {
      const nivel = this.badges[i]?.nivel || 1;
      // Halo dourado por trás (mais forte e pulsante quanto maior o nível).
      const glow = this.add.circle(x, y, R + 6, 0xffe000, 0.05 + nivel * 0.06);
      this.tweens.add({ targets: glow, scale: 1.18, alpha: Math.max(0.03, 0.02 + nivel * 0.03), duration: 1100, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      const img = this.add.image(x, y, chaveBadge);
      if (img.width) img.setScale((R * 2) / img.width);
      // Nível máximo (holográfica): uma faísca no canto.
      if (nivel >= 4) {
        const s = this.add.text(x + R - 6, y - R + 4, "✨", { fontFamily: TEMA.fonte, fontSize: "22px" }).setOrigin(0.5);
        this.tweens.add({ targets: s, scale: 1.3, duration: 700, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      }
    } else {
      const anel = this.add.circle(x, y, R, concluida ? cor : liberada ? 0x1e293b : 0x131b2e, 1);
      anel.setStrokeStyle(5, concluida ? 0xffffff : liberada ? cor : 0x334155, 1);
      const emoji = this.add
        .text(x, y - 4, fase.emoji || "🔧", { fontFamily: TEMA.fonte, fontSize: "40px" })
        .setOrigin(0.5)
        .setAlpha(liberada || concluida ? 1 : 0.35);
      if (concluida) {
        // Selo de concluído.
        this.add.text(x + R - 8, y - R + 10, "✓", { fontFamily: TEMA.fonte, fontSize: "26px", color: "#0b1120", fontStyle: "bold" }).setOrigin(0.5);
      }
      // A liberada (ainda não concluída) pulsa para chamar atenção.
      if (liberada && !concluida) {
        this.tweens.add({ targets: anel, scale: 1.1, duration: 750, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
        emoji && this.tweens.add({ targets: emoji, scale: 1.1, duration: 750, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      }
    }

    // Número da fase.
    this.add
      .text(x, y - R - 14, `${i + 1}`, { fontFamily: TEMA.fonte, fontSize: "18px", color: "#ffd8a8", fontStyle: "bold" })
      .setOrigin(0.5);

    // Estrelas conquistadas (embaixo).
    if (concluida) {
      const n = this.estrelas[i];
      this.add
        .text(x, y + R + 16, "⭐".repeat(n) + "☆".repeat(3 - n), { fontFamily: TEMA.fonte, fontSize: "16px", color: "#ffe000" })
        .setOrigin(0.5);
    } else if (!liberada) {
      // Cadeado nas travadas.
      this.add.text(x, y + 2, "🔒", { fontFamily: TEMA.fonte, fontSize: "28px" }).setOrigin(0.5);
    }

    // Área clicável (só nas liberadas).
    if (liberada) {
      const zona = this.add.circle(x, y, R + 6, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
      zona.on("pointerdown", () => this.escolher(i, fase));
      this.nos.push({ i, x, y, fase });
    }
  }

  escolher(i, fase) {
    if (this._entrando) return; // evita entrada dupla (toque + Enter)
    this._entrando = true;
    pling(0);
    const n = this.nos.find((nn) => nn.i === i);
    const entrar = () => {
      this.cameras.main.flash(160, 120, 90, 200);
      this.registry.set("indiceFase", i);
      const cena = this.roteiro[i]?.cena || "ContagemScene";
      this.time.delayedCall(140, () => this.scene.start(cena));
    };
    // Se o CosmoBot ainda não está no planeta escolhido, voa até lá e então entra.
    const jaLa = this.cosmo && n && Math.abs(this.cosmo.x - n.x) < 6 && Math.abs(this.cosmo.y - n.y) < 6;
    if (n && !jaLa) {
      if (n) {
        this.focoSel = this.nos.indexOf(n);
        this.desenharFocoRing();
      }
      this.moverCosmoPara(n.x, n.y, entrar);
    } else {
      entrar();
    }
  }

  decolar() {
    // Vai para a celebração final (nave decola) — reutiliza a EstacaoScene.
    this.registry.set("indiceFase", this.roteiro.length);
    this.scene.start("EstacaoScene");
  }
}
