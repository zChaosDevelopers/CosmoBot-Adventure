import Phaser from "phaser";
import { TEMA } from "../tema.js";
import { desenharCaixa } from "../desenho.js";
import { gerarRodadasSubtracao } from "../gerarRodadas.js";
import { falar } from "../../lib/fala.js";
import { somAcerto, somErro, pling } from "../../lib/sfx.js";
import FaseBase from "./FaseBase.js";

// Etapa 3 — "Encher as Baterias": SUBTRAÇÃO como TIRAR (retirar do total).
//
// Antes a criança só CONTAVA as células que sobravam. Agora ela precisa
// **retirar** (descarregar) a quantidade pedida — o gesto de tirar É a
// subtração. Ao arrastar as células para o descarte, ela descobre quantas
// continuam com carga (a − b). Funciona com arraste, toque no descarte e teclado.
export default class SubtracaoScene extends FaseBase {
  constructor() {
    super("SubtracaoScene");
  }

  create() {
    this.iniciarFase();
    const cfg = this.fase.gerar || {};
    this.rodadas = gerarRodadasSubtracao(cfg.rodadas ?? 3, cfg.min ?? 5, cfg.max ?? 10);
    this.configurarTecladoDescarte();
    this.montarRodada();
    falar(this.fase.enunciado);
  }

  montarRodada() {
    if (this.grupo) this.grupo.destroy(true);
    if (this.celulas) this.celulas.forEach((c) => c.destroy());
    this.grupo = this.add.container(0, 0);
    this.celulas = [];
    this.bloqueado = false;

    const centro = this.desenharCabecalho();
    const rodada = this.rodadas[this.rodadaAtual];
    this.rodada = rodada;

    const instr = this.add
      .text(centro, 150, `Descarregue ${rodada.b} células. Quantas ainda têm carga?`, {
        fontFamily: TEMA.fonte,
        fontSize: "17px",
        color: "#ffd8a8",
        align: "center",
        wordWrap: { width: this.scale.width - 120 },
      })
      .setOrigin(0.5);
    this.grupo.add(instr);

    const rot = this.add
      .text(centro, 178, `🔋 Bateria: ${rodada.a} células carregadas`, {
        fontFamily: TEMA.fonte,
        fontSize: "16px",
        color: "#e2e8f0",
      })
      .setOrigin(0.5);
    this.grupo.add(rot);

    // ===== Células carregadas (arrastáveis) =====
    const cols = Math.min(6, rodada.a);
    const passo = 48;
    const topY = 218;
    const inicioX = centro - ((cols - 1) * passo) / 2;
    for (let i = 0; i < rodada.a; i++) {
      const col = i % 6;
      const row = Math.floor(i / 6);
      const x = inicioX + col * passo;
      const y = topY + row * 46;
      const cor = TEMA.coresCristal[i % TEMA.coresCristal.length];
      this.celulas.push(this.criarCelula(x, y, cor));
    }

    // ===== Zona de descarte (uma só) =====
    const binW = Math.min(360, this.scale.width - 140);
    const binH = 96;
    const binY = 384;
    this.grupo.add(desenharCaixa(this, centro, binY, binW, binH, "#ff6b6b", "🗑️ Descarregar aqui"));
    this.bin = { x: centro, y: binY, w: binW, h: binH, itens: [] };

    this.contador = this.add
      .text(centro, binY + binH / 2 + 20, `0 / ${rodada.b}`, {
        fontFamily: TEMA.fonte,
        fontSize: "22px",
        color: "#ffd43b",
      })
      .setOrigin(0.5);
    this.grupo.add(this.contador);

    // Toque na zona: descarrega a próxima célula carregada (acessível).
    const zona = this.add.rectangle(centro, binY, binW, binH, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    zona.on("pointerdown", () => this.descarregarProxima());
    this.grupo.add(zona);

    this.prepararArraste();
    this.aoSoltarItem = (obj, p) => this.soltarCelula(obj, p);

    this.dica = this.add
      .text(centro, this.scale.height - 26, "", { fontFamily: TEMA.fonte, fontSize: "16px", color: "#ffa8a8" })
      .setOrigin(0.5);
    this.grupo.add(this.dica);
  }

  criarCelula(x, y, cor) {
    const c = this.add.circle(x, y, 15, cor);
    c.setStrokeStyle(3, 0xffffff, 0.6);
    c.home = { x, y };
    c.corViva = cor;
    c.descarregada = false;
    c.setInteractive({ draggable: true, useHandCursor: true });
    return c;
  }

  soltarCelula(cel, pointer) {
    if (this.bloqueado) {
      this.voltarParaBateria(cel);
      return;
    }
    const noBin = this.zonaNoPonto([this.bin], pointer.x, pointer.y);
    if (noBin) this.descarregar(cel);
    else this.voltarParaBateria(cel);
  }

  // Descarrega uma célula: apaga (escurece) e leva para o descarte.
  descarregar(cel) {
    if (cel.descarregada) {
      this.reorganizarBin();
      return;
    }
    cel.descarregada = true;
    cel.setFillStyle(0x334155);
    cel.setAlpha(0.55);
    this.bin.itens.push(cel);
    this.reorganizarBin();
    somErro(); // som suave (não punitivo) de descarga
    this.conferir();
  }

  // Recarrega: devolve a célula à posição original na bateria.
  voltarParaBateria(cel) {
    if (cel.descarregada) {
      this.bin.itens = this.bin.itens.filter((c) => c !== cel);
      cel.descarregada = false;
      cel.setFillStyle(cel.corViva);
      cel.setAlpha(1);
      this.reorganizarBin();
    }
    this.tweens.add({ targets: cel, x: cel.home.x, y: cel.home.y, duration: 180, ease: "Back.easeOut" });
    this.atualizarContador();
  }

  reorganizarBin() {
    const cols = Math.min(8, Math.max(1, this.bin.itens.length));
    const passo = 34;
    const inicioX = this.bin.x - ((cols - 1) * passo) / 2;
    this.bin.itens.forEach((c, i) => {
      const col = i % 8;
      const row = Math.floor(i / 8);
      this.tweens.add({
        targets: c,
        x: inicioX + col * passo,
        y: this.bin.y - 12 + row * 26,
        duration: 160,
        ease: "Quad.easeOut",
      });
    });
    this.atualizarContador();
  }

  atualizarContador() {
    if (this.contador) this.contador.setText(`${this.bin.itens.length} / ${this.rodada.b}`);
  }

  descarregarProxima() {
    if (this.bloqueado) return;
    const viva = this.celulas.find((c) => !c.descarregada);
    if (viva) {
      pling(this.bin.itens.length);
      this.descarregar(viva);
    }
  }

  conferir() {
    if (this.bloqueado) return;
    const n = this.bin.itens.length;
    if (n === this.rodada.b) {
      this.sucesso();
    } else if (n > this.rodada.b) {
      this.dica.setText(`Ops! Descarregue só ${this.rodada.b}. Toque nas apagadas para recarregar.`);
    } else {
      this.dica.setText("");
    }
  }

  sucesso() {
    this.bloqueado = true;
    this.celulas.forEach((c) => c.disableInteractive());
    somAcerto();
    const r = this.rodada;
    this.dica.setText("");

    // As que continuam com carga voam para o robô (as descarregadas ficam).
    const carregadas = this.celulas.filter((c) => !c.descarregada);
    carregadas.forEach((c) => {
      const brilho = this.add.circle(c.x, c.y, 6, TEMA.foco, 0.9);
      this.grupo.add(brilho);
      this.tweens.add({ targets: brilho, scale: 4, alpha: 0, duration: 500 });
    });

    const msg = this.add
      .text(this.scale.width / 2, this.scale.height - 30, `${r.a} − ${r.b} = ${r.quantidade}  •  ${r.quantidade} com carga!`, {
        fontFamily: TEMA.fonte,
        fontSize: "20px",
        color: "#ffffff",
        align: "center",
        wordWrap: { width: this.scale.width - 80 },
      })
      .setOrigin(0.5);
    this.grupo.add(msg);

    falar(`Muito bem! ${r.a} menos ${r.b} é igual a ${r.quantidade}. Sobraram ${r.quantidade} com carga.`);
    this.itens = carregadas;
    this.time.delayedCall(1100, () => this.animarColeta(carregadas, () => this.aposAcerto()));
  }

  aposAcerto() {
    this.rodadaAtual++;
    if (this.rodadaAtual >= this.rodadas.length) {
      this.time.delayedCall(300, () => this.concluirEtapa(this.fase.tarefaOk));
    } else {
      this.time.delayedCall(300, () => this.montarRodada());
    }
  }

  // ===== Teclado: Enter descarrega a próxima; Backspace recarrega a última =====
  configurarTecladoDescarte() {
    this.input.keyboard.on("keydown-ENTER", () => this.descarregarProxima());
    this.input.keyboard.on("keydown-SPACE", () => this.descarregarProxima());
    this.input.keyboard.on("keydown-BACKSPACE", () => {
      if (this.bloqueado) return;
      const ultima = this.bin?.itens?.[this.bin.itens.length - 1];
      if (ultima) this.voltarParaBateria(ultima);
    });
  }
}
