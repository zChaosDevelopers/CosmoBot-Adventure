import Phaser from "phaser";
import { TEMA } from "../tema.js";
import { desenharCaixa } from "../desenho.js";
import { gerarRodadasMultiplicacao } from "../gerarRodadas.js";
import { falar } from "../../lib/fala.js";
import { somAcerto, somErro, pling } from "../../lib/sfx.js";
import FaseBase from "./FaseBase.js";

// Etapa 4 — "Ligar os Motores": MULTIPLICAÇÃO como GRUPOS IGUAIS.
//
// A criança NÃO conta células prontas na tela: ela precisa **encher** cada motor
// com a MESMA quantidade de células e, ao montar os grupos iguais, DESCOBRE o
// total (N grupos de X = N × X). É o conceito de multiplicação como adição de
// grupos iguais. Funciona com arraste, com toque no motor e com o teclado.
export default class MultiplicacaoScene extends FaseBase {
  constructor() {
    super("MultiplicacaoScene");
  }

  create() {
    this.iniciarFase();
    const cfg = this.fase.gerar || {};
    // Pequeno para caber o arraste (até 3 motores de 4 = 12 células).
    this.rodadas = gerarRodadasMultiplicacao(cfg.rodadas ?? 3, cfg.maxGrupos ?? 3, cfg.maxPorGrupo ?? 4);
    this.configurarTecladoZonas();
    this.montarRodada();
    falar(this.fase.enunciado);
  }

  montarRodada() {
    if (this.grupo) this.grupo.destroy(true);
    if (this.pecas) this.pecas.forEach((g) => g.destroy());
    this.grupo = this.add.container(0, 0);
    this.pecas = [];
    this.motores = [];
    this.bloqueado = false;
    this.focoZona = 0;

    const centro = this.desenharCabecalho();
    const rodada = this.rodadas[this.rodadaAtual];
    this.rodada = rodada;
    const total = rodada.quantidade; // grupos × porGrupo

    // Linha-guia única (sem repetir a pergunta do enunciado): diz a quantidade
    // por motor E o total disponível, que é a informação NOVA desta rodada.
    const rot = this.add
      .text(centro, this.baseY, `🔩 ${rodada.porGrupo} em cada motor  •  ${total} células disponíveis`, {
        fontFamily: TEMA.fonte,
        fontSize: "16px",
        color: "#ffd8a8",
      })
      .setOrigin(0.5);
    this.grupo.add(rot);

    // ===== Reservatório de células (arrastáveis) =====
    const rcols = Math.min(8, total);
    const rpasso = 40;
    const rtopY = this.baseY + 44;
    const rinicioX = centro - ((rcols - 1) * rpasso) / 2;
    for (let i = 0; i < total; i++) {
      const col = i % rcols;
      const row = Math.floor(i / rcols);
      const hx = rinicioX + col * rpasso;
      const hy = rtopY + row * 34;
      const cor = TEMA.coresCristal[i % TEMA.coresCristal.length];
      this.pecas.push(this.criarPeca(hx, hy, cor));
    }

    // ===== Motores (grupos a preencher) =====
    const n = rodada.grupos;
    const mW = 92;
    const mH = 150;
    const gap = Math.min(52, (this.scale.width - 80 - n * mW) / Math.max(1, n - 1));
    const totalW = n * mW + (n - 1) * gap;
    const startX = centro - totalW / 2 + mW / 2;
    const mY = this.baseY + 224;

    for (let k = 0; k < n; k++) {
      const mx = startX + k * (mW + gap);
      this.grupo.add(desenharCaixa(this, mx, mY, mW, mH, "#ff922b", `Motor ${k + 1}`));

      const contador = this.add
        .text(mx, mY + mH / 2 + 20, "0", { fontFamily: TEMA.fonte, fontSize: "26px", color: "#ffd43b" })
        .setOrigin(0.5);
      this.grupo.add(contador);

      const foco = this.add.graphics();
      this.grupo.add(foco);

      const motor = { x: mx, y: mY, w: mW, h: mH, itens: [], contador, foco };
      this.motores.push(motor);

      const zona = this.add
        .rectangle(mx, mY, mW, mH, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      zona.on("pointerdown", () => this.encherDoReservatorio(motor));
      this.grupo.add(zona);
    }

    this.prepararArraste();
    this.aoSoltarItem = (obj, p) => this.soltarPeca(obj, p);
    this.desenharFocoZona();

    this.dica = this.add
      .text(centro, this.scale.height - 26, "", { fontFamily: TEMA.fonte, fontSize: "16px", color: "#ffa8a8" })
      .setOrigin(0.5);
    this.grupo.add(this.dica);
  }

  criarPeca(x, y, cor) {
    const c = this.add.circle(x, y, 13, cor);
    c.setStrokeStyle(3, 0xffffff, 0.55);
    c.home = { x, y };
    c.zona = null;
    c.setInteractive({ draggable: true, useHandCursor: true });
    return c;
  }

  soltarPeca(peca, pointer) {
    if (this.bloqueado) {
      this.devolver(peca);
      return;
    }
    const alvo = this.zonaNoPonto(this.motores, pointer.x, pointer.y);
    if (alvo) this.colocarNoMotor(peca, alvo);
    else this.devolver(peca);
  }

  colocarNoMotor(peca, motor) {
    if (peca.zona === motor) {
      this.reorganizar(motor);
      this.conferir();
      return;
    }
    if (peca.zona) {
      peca.zona.itens = peca.zona.itens.filter((g) => g !== peca);
      this.reorganizar(peca.zona);
    }
    peca.zona = motor;
    motor.itens.push(peca);
    this.reorganizar(motor);
    pling(Math.min(motor.itens.length, 6));
    this.conferir();
  }

  devolver(peca) {
    if (peca.zona) {
      peca.zona.itens = peca.zona.itens.filter((g) => g !== peca);
      this.reorganizar(peca.zona);
      peca.zona = null;
    }
    this.tweens.add({ targets: peca, x: peca.home.x, y: peca.home.y, duration: 180, ease: "Back.easeOut" });
    this.conferir();
  }

  reorganizar(motor) {
    const baseY = motor.y + motor.h / 2 - 20;
    motor.itens.forEach((g, i) => {
      this.tweens.add({ targets: g, x: motor.x, y: baseY - i * 28, duration: 160, ease: "Quad.easeOut" });
    });
    motor.contador.setText(String(motor.itens.length));
  }

  encherDoReservatorio(motor) {
    if (this.bloqueado) return;
    const livre = this.pecas.find((g) => g.zona === null);
    if (!livre) return;
    this.colocarNoMotor(livre, motor);
  }

  conferir() {
    if (this.bloqueado) return;
    const livres = this.pecas.filter((g) => g.zona === null).length;
    if (livres > 0) {
      this.dica.setText("");
      return;
    }
    const contagens = this.motores.map((m) => m.itens.length);
    const alvo = this.rodada.porGrupo;
    const todosCertos = contagens.every((c) => c === alvo);
    if (todosCertos) {
      this.sucesso();
    } else {
      this.dica.setText(`Cada motor precisa de ${alvo} células iguais!`);
      somErro();
    }
  }

  sucesso() {
    this.bloqueado = true;
    this.motores.forEach((m) => m.foco.clear());
    this.pecas.forEach((g) => g.disableInteractive());
    somAcerto();
    const r = this.rodada;

    this.motores.forEach((m) => {
      const brilho = this.add.circle(m.x, m.y, 8, TEMA.foco, 0.9);
      this.grupo.add(brilho);
      this.tweens.add({ targets: brilho, scale: 6, alpha: 0, duration: 600 });
    });

    this.dica.setText("");
    const msg = this.add
      .text(this.scale.width / 2, this.scale.height - 30, `${r.grupos} × ${r.porGrupo} = ${r.quantidade} células!`, {
        fontFamily: TEMA.fonte,
        fontSize: "20px",
        color: "#ffffff",
        align: "center",
        wordWrap: { width: this.scale.width - 80 },
      })
      .setOrigin(0.5);
    this.grupo.add(msg);

    falar(`Muito bem! ${r.grupos} motores com ${r.porGrupo} células dá ${r.quantidade} ao todo.`);
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

  // ===== Teclado =====
  configurarTecladoZonas() {
    this.input.keyboard.on("keydown-RIGHT", () => this.moverFocoZona(1));
    this.input.keyboard.on("keydown-LEFT", () => this.moverFocoZona(-1));
    this.input.keyboard.on("keydown-ENTER", () => this.acaoTecladoZona());
    this.input.keyboard.on("keydown-SPACE", () => this.acaoTecladoZona());
    this.input.keyboard.on("keydown-BACKSPACE", () => this.tirarDaZona());
  }

  moverFocoZona(dir) {
    if (this.bloqueado || !this.motores?.length) return;
    this.focoZona = Phaser.Math.Wrap(this.focoZona + dir, 0, this.motores.length);
    this.desenharFocoZona();
  }

  acaoTecladoZona() {
    const m = this.motores?.[this.focoZona];
    if (m) this.encherDoReservatorio(m);
  }

  tirarDaZona() {
    if (this.bloqueado) return;
    const m = this.motores?.[this.focoZona];
    const ultima = m?.itens?.[m.itens.length - 1];
    if (ultima) this.devolver(ultima);
  }

  desenharFocoZona() {
    if (!this.motores?.length) return;
    this.motores.forEach((m, i) => {
      m.foco.clear();
      if (i === this.focoZona && !this.bloqueado) {
        m.foco.lineStyle(4, TEMA.foco, 0.95);
        m.foco.strokeRoundedRect(m.x - m.w / 2 - 4, m.y - m.h / 2 - 4, m.w + 8, m.h + 8, 14);
      }
    });
  }
}
