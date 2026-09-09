import Phaser from "phaser";
import { TEMA } from "../tema.js";
import { desenharCaixa } from "../desenho.js";
import { gerarRodadasSoma } from "../gerarRodadas.js";
import { falar } from "../../lib/fala.js";
import { somAcerto, somErro, pling } from "../../lib/sfx.js";
import FaseBase from "./FaseBase.js";

// Etapa 2 — "Abrir a Comporta": SOMA como JUNTAR (reunir dois grupos).
//
// Em vez de contar peças já prontas na tela, a criança **junta** as peças das
// duas caixas dentro do núcleo. O gesto de reunir os dois grupos É a soma: ao
// terminar, ela descobre o total (a + b). Arraste, toque no núcleo e teclado.
export default class SomaScene extends FaseBase {
  constructor() {
    super("SomaScene");
  }

  create() {
    this.iniciarFase();
    const cfg = this.fase.gerar || {};
    this.rodadas = gerarRodadasSoma(cfg.rodadas ?? 3, cfg.min ?? 2, cfg.max ?? 9);
    this.configurarTecladoNucleo();
    this.montarRodada();
    falar(this.fase.enunciado);
  }

  montarRodada() {
    if (this.grupo) this.grupo.destroy(true);
    if (this.pecas) this.pecas.forEach((g) => g.destroy());
    this.grupo = this.add.container(0, 0);
    this.pecas = [];
    this.bloqueado = false;

    const centro = this.desenharCabecalho();
    const rodada = this.rodadas[this.rodadaAtual];
    this.rodada = rodada;
    const total = rodada.quantidade; // a + b

    const instr = this.add
      .text(centro, 150, "Junte as peças das duas caixas no núcleo. Quanto dá ao todo?", {
        fontFamily: TEMA.fonte,
        fontSize: "17px",
        color: "#ffd8a8",
        align: "center",
        wordWrap: { width: this.scale.width - 120 },
      })
      .setOrigin(0.5);
    this.grupo.add(instr);

    // ===== Duas caixas de peças (grupos a juntar) =====
    const boxAx = centro - 175;
    const boxBx = centro + 175;
    const boxY = 226;
    this.grupo.add(desenharCaixa(this, boxAx, boxY, 150, 96, "#22d3ee", `Caixa A: ${rodada.a}`));
    this.grupo.add(desenharCaixa(this, boxBx, boxY, 150, 96, "#51cf66", `Caixa B: ${rodada.b}`));

    this.criarPecasNaCaixa(boxAx, boxY, rodada.a, 0x22d3ee);
    this.criarPecasNaCaixa(boxBx, boxY, rodada.b, 0x51cf66);

    // Sinais + e = ? para ligar a ação ao símbolo.
    const maisSinal = this.add
      .text(centro, boxY, "+", { fontFamily: TEMA.fonte, fontSize: "34px", color: "#ffd43b" })
      .setOrigin(0.5);
    this.grupo.add(maisSinal);

    // ===== Núcleo (zona única onde as peças se juntam) =====
    const nucW = 220;
    const nucH = 118;
    const nucY = 396;
    this.grupo.add(desenharCaixa(this, centro, nucY, nucW, nucH, "#ffd43b", "⚡ Núcleo de energia"));
    this.nucleo = { x: centro, y: nucY, w: nucW, h: nucH, itens: [] };

    this.contador = this.add
      .text(centro, nucY + nucH / 2 + 22, "0", { fontFamily: TEMA.fonte, fontSize: "26px", color: "#ffd43b" })
      .setOrigin(0.5);
    this.grupo.add(this.contador);

    const zona = this.add.rectangle(centro, nucY, nucW, nucH, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    zona.on("pointerdown", () => this.juntarProxima());
    this.grupo.add(zona);

    this.prepararArraste();
    this.aoSoltarItem = (obj, p) => this.soltarPeca(obj, p);

    this.dica = this.add
      .text(centro, this.scale.height - 26, "", { fontFamily: TEMA.fonte, fontSize: "16px", color: "#ffa8a8" })
      .setOrigin(0.5);
    this.grupo.add(this.dica);
  }

  criarPecasNaCaixa(cx, cy, qtd, cor) {
    const cols = Math.min(3, qtd);
    const passo = 30;
    const inicioX = cx - ((cols - 1) * passo) / 2;
    const linhas = Math.ceil(qtd / 3);
    const inicioY = cy - ((linhas - 1) * 28) / 2;
    for (let i = 0; i < qtd; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = inicioX + col * passo;
      const y = inicioY + row * 28;
      this.pecas.push(this.criarPeca(x, y, cor));
    }
  }

  criarPeca(x, y, cor) {
    const c = this.add.circle(x, y, 12, cor);
    c.setStrokeStyle(3, 0xffffff, 0.55);
    c.home = { x, y };
    c.juntada = false;
    c.setInteractive({ draggable: true, useHandCursor: true });
    return c;
  }

  soltarPeca(peca, pointer) {
    if (this.bloqueado) {
      this.devolver(peca);
      return;
    }
    const noNucleo = this.zonaNoPonto([this.nucleo], pointer.x, pointer.y);
    if (noNucleo) this.juntar(peca);
    else this.devolver(peca);
  }

  juntar(peca) {
    if (peca.juntada) {
      this.reorganizar();
      return;
    }
    peca.juntada = true;
    this.nucleo.itens.push(peca);
    this.reorganizar();
    pling(Math.min(this.nucleo.itens.length, 8));
    this.conferir();
  }

  devolver(peca) {
    if (peca.juntada) {
      this.nucleo.itens = this.nucleo.itens.filter((c) => c !== peca);
      peca.juntada = false;
      this.reorganizar();
    }
    this.tweens.add({ targets: peca, x: peca.home.x, y: peca.home.y, duration: 180, ease: "Back.easeOut" });
    this.atualizarContador();
  }

  reorganizar() {
    const cols = 6;
    const passo = 30;
    const n = this.nucleo.itens.length;
    const usarCols = Math.min(cols, Math.max(1, n));
    const inicioX = this.nucleo.x - ((usarCols - 1) * passo) / 2;
    this.nucleo.itens.forEach((c, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      this.tweens.add({
        targets: c,
        x: inicioX + col * passo,
        y: this.nucleo.y - 16 + row * 26,
        duration: 160,
        ease: "Quad.easeOut",
      });
    });
    this.atualizarContador();
  }

  atualizarContador() {
    if (this.contador) this.contador.setText(String(this.nucleo.itens.length));
  }

  juntarProxima() {
    if (this.bloqueado) return;
    const livre = this.pecas.find((c) => !c.juntada);
    if (livre) this.juntar(livre);
  }

  conferir() {
    if (this.bloqueado) return;
    if (this.nucleo.itens.length === this.rodada.quantidade) {
      this.sucesso();
    } else {
      this.dica.setText("");
    }
  }

  sucesso() {
    this.bloqueado = true;
    this.pecas.forEach((c) => c.disableInteractive());
    somAcerto();
    const r = this.rodada;
    this.dica.setText("");

    const brilho = this.add.circle(this.nucleo.x, this.nucleo.y, 10, TEMA.foco, 0.9);
    this.grupo.add(brilho);
    this.tweens.add({ targets: brilho, scale: 8, alpha: 0, duration: 650 });

    const msg = this.add
      .text(this.scale.width / 2, this.scale.height - 30, `${r.a} + ${r.b} = ${r.quantidade}!`, {
        fontFamily: TEMA.fonte,
        fontSize: "22px",
        color: "#ffffff",
        align: "center",
        wordWrap: { width: this.scale.width - 80 },
      })
      .setOrigin(0.5);
    this.grupo.add(msg);

    falar(`Muito bem! ${r.a} mais ${r.b} é igual a ${r.quantidade}.`);
    this.itens = this.pecas;
    this.time.delayedCall(1100, () => this.animarColeta(this.pecas, () => this.aposAcerto()));
  }

  aposAcerto() {
    this.rodadaAtual++;
    if (this.rodadaAtual >= this.rodadas.length) {
      this.time.delayedCall(300, () => this.concluirEtapa(this.fase.tarefaOk));
    } else {
      this.time.delayedCall(300, () => this.montarRodada());
    }
  }

  // ===== Teclado: Enter junta a próxima; Backspace devolve a última =====
  configurarTecladoNucleo() {
    this.input.keyboard.on("keydown-ENTER", () => this.juntarProxima());
    this.input.keyboard.on("keydown-SPACE", () => this.juntarProxima());
    this.input.keyboard.on("keydown-BACKSPACE", () => {
      if (this.bloqueado) return;
      const ultima = this.nucleo?.itens?.[this.nucleo.itens.length - 1];
      if (ultima) this.devolver(ultima);
    });
  }
}
