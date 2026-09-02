import Phaser from "phaser";
import { TEMA } from "../tema.js";
import { desenharFundo, criarBotao, criarPersonagem, desenharTiraNave } from "../desenho.js";
import { falar } from "../../lib/fala.js";
import { pling, somVitoria } from "../../lib/sfx.js";

// Base compartilhada por todas as etapas de conserto da nave (painel, comporta,
// baterias, motores, rota). Cada etapa concreta só precisa: chamar iniciarFase(),
// gerar suas rodadas, implementar montarRodada() e usar os helpers daqui.
export default class FaseBase extends Phaser.Scene {
  // Lê os dados do "roteiro" (lista de etapas) e prepara o cenário.
  iniciarFase() {
    this.jogador = this.registry.get("jogador") || {};
    this.onConcluir = this.registry.get("onConcluir");
    this.roteiro = this.registry.get("roteiro") || [];
    this.indiceFase = this.registry.get("indiceFase") || 0;
    this.fase = this.roteiro[this.indiceFase]?.fase || {};
    this.totalFases = this.roteiro.length;

    this.rodadaAtual = 0;
    this.coletados = 0;
    this.bloqueado = false;

    desenharFundo(this);
    this.criarTiraNave();
    this.configurarTeclado();
  }

  // ===== Tira da nave no topo: mostra o robô avançando pelas etapas =====
  criarTiraNave() {
    const etapas = this.roteiro.map((r) => ({ emoji: r.fase.emoji || "🔧", cor: r.fase.cor || "#ffd43b" }));
    this.tira = desenharTiraNave(this, etapas, this.indiceFase, { y: 24 });
    this.alvoNave = this.tira.alvoAtual || { x: this.scale.width / 2, y: 24 };
  }

  // ===== Cabeçalho (etapa + rodada + enunciado). Retorna o X central. =====
  desenharCabecalho() {
    const centro = this.scale.width / 2;

    const etapa = this.add
      .text(
        centro,
        62,
        `Etapa ${this.indiceFase + 1} de ${this.totalFases}  •  ${this.fase.modulo}`,
        { fontFamily: TEMA.fonte, fontSize: "19px", color: "#ffd8a8" }
      )
      .setOrigin(0.5);
    this.grupo.add(etapa);

    const rod = this.add
      .text(centro, 88, `Desafio ${this.rodadaAtual + 1} de ${this.rodadas.length}`, {
        fontFamily: TEMA.fonte,
        fontSize: "15px",
        color: "#94a3b8",
      })
      .setOrigin(0.5);
    this.grupo.add(rod);

    const enunciado = this.add
      .text(centro, 120, this.fase.enunciado, {
        fontFamily: TEMA.fonte,
        fontSize: "22px",
        color: "#ffffff",
        align: "center",
        wordWrap: { width: this.scale.width - 120 },
      })
      .setOrigin(0.5);
    this.grupo.add(enunciado);

    return centro;
  }

  // ===== Item interativo (com "plim" ao passar o mouse) =====
  itemInterativo(cr) {
    if (cr.type === "Container") {
      cr.setSize(56, 56);
      cr.setInteractive(new Phaser.Geom.Rectangle(-28, -28, 56, 56), Phaser.Geom.Rectangle.Contains);
      if (cr.input) cr.input.cursor = "pointer";
    } else if (cr.setInteractive) {
      cr.setInteractive({ useHandCursor: true });
    }
    cr.on("pointerover", () => {
      if (cr._pop) return;
      cr._pop = true;
      const sx = cr.scaleX;
      const sy = cr.scaleY;
      this.tweens.add({
        targets: cr,
        scaleX: sx * 1.15,
        scaleY: sy * 1.15,
        duration: 110,
        yoyo: true,
        onComplete: () => {
          cr.setScale(sx, sy);
          cr._pop = false;
        },
      });
    });
    return cr;
  }

  // ===== Botões de resposta (mouse, toque e teclado) =====
  criarBotoesResposta(centro, opcoes, aoResponder) {
    this.botoes = [];
    this.aoResponder = aoResponder;
    const total = opcoes.length;
    const passo = Math.min(165, (this.scale.width - 60) / total);
    opcoes.forEach((num, idx) => {
      const bx = centro + (idx - (total - 1) / 2) * passo;
      const by = this.scale.height - 78;
      const cor = TEMA.coresBotao[idx % TEMA.coresBotao.length];
      const b = criarBotao(this, bx, by, `${num}`, () => this.escolher(num), { cor });
      b.valor = num;
      b.on("pointerover", () => this.setFoco(idx));
      this.grupo.add(b);
      this.botoes.push(b);
    });
    this.focoIndex = 0;
    this.atualizarFoco();
  }

  // Uma única porta de entrada para a resposta (mouse/toque/teclado).
  escolher(num) {
    if (this.bloqueado) return;
    this.aoResponder?.(num);
  }

  // ===== Animação: os itens contados "voam" para o robô na tira da nave =====
  animarColeta(itens, aoFim) {
    const alvoX = this.alvoNave.x;
    const alvoY = this.alvoNave.y;
    const lista = itens.filter(Boolean);
    if (!lista.length) {
      aoFim?.();
      return;
    }
    const ultimo = lista.length - 1;
    lista.forEach((item, i) => {
      item.disableInteractive?.();
      this.tweens.killTweensOf(item);
      this.tweens.add({
        targets: item,
        x: alvoX,
        y: alvoY,
        scale: 0.2,
        alpha: 0.4,
        duration: 340,
        delay: i * 70,
        ease: "Cubic.easeIn",
        onComplete: () => {
          item.destroy();
          pling(i);
          if (this.tira) this.tweens.add({ targets: this.tira, scale: 1.04, duration: 70, yoyo: true });
          if (i === ultimo) aoFim?.();
        },
      });
    });
  }

  temProxima() {
    return this.indiceFase + 1 < this.totalFases;
  }

  // ===== Fim da etapa: comemora e vai para a próxima estação da nave =====
  concluirEtapa(mensagem) {
    this.bloqueado = true;
    this.onConcluir?.({ faseId: this.fase.id, status: "concluida" });

    const { width, height } = this.scale;
    if (this.grupo) this.grupo.destroy(true);

    this.add.rectangle(0, 0, width, height, 0x000000, 0.68).setOrigin(0);
    somVitoria();
    this.cameras.main.flash(400, 250, 220, 120);

    const robo = criarPersonagem(this, width / 2, height / 2 - 66, this.jogador.avatar, 108);
    this.tweens.add({ targets: robo, y: robo.y - 16, duration: 800, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    this.add
      .text(width / 2, height / 2 + 44, mensagem || `${this.fase.emoji || "✅"} Etapa concluída!`, {
        fontFamily: TEMA.fonte,
        fontSize: "34px",
        color: "#ffffff",
        align: "center",
        wordWrap: { width: width - 100 },
      })
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        height / 2 + 96,
        this.temProxima() ? "O CosmoBot avança na nave..." : "A nave está quase pronta para decolar...",
        { fontFamily: TEMA.fonte, fontSize: "19px", color: "#ffd43b", align: "center", wordWrap: { width: width - 100 } }
      )
      .setOrigin(0.5);

    falar(mensagem || "Etapa concluída! Muito bem!");
    this.time.delayedCall(2000, () => this.avancarFase());
  }

  avancarFase() {
    this.registry.set("indiceFase", this.indiceFase + 1);
    this.scene.start("EstacaoScene");
  }

  // ===== Acessibilidade (teclado) =====
  configurarTeclado() {
    this.input.keyboard.on("keydown-RIGHT", () => this.moverFoco(1));
    this.input.keyboard.on("keydown-LEFT", () => this.moverFoco(-1));
    this.input.keyboard.on("keydown-ENTER", () => this.ativarFoco());
    this.input.keyboard.on("keydown-SPACE", () => this.ativarFoco());
  }

  ativarFoco() {
    const alvo = this.botoes?.[this.focoIndex];
    if (alvo && !this.bloqueado) {
      alvo.apertar?.();
      this.escolher(alvo.valor);
    }
  }

  moverFoco(dir) {
    if (!this.botoes?.length) return;
    this.focoIndex = Phaser.Math.Wrap(this.focoIndex + dir, 0, this.botoes.length);
    this.atualizarFoco();
  }

  setFoco(idx) {
    this.focoIndex = idx;
    this.atualizarFoco();
  }

  atualizarFoco() {
    this.botoes.forEach((b, i) => b.setFoco(i === this.focoIndex));
  }
}
