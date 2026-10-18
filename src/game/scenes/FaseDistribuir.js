import Phaser from "phaser";
import { TEMA } from "../tema.js";
import { desenharCaixa } from "../desenho.js";
import { falar } from "../../lib/fala.js";
import { somAcerto, pling } from "../../lib/sfx.js";
import FaseBase from "./FaseBase.js";

// Base para as fases de DISTRIBUIR itens igualmente em zonas — hoje a Divisão
// (repartir em tanques) e a Multiplicação (encher motores em grupos iguais).
// As duas eram quase idênticas; toda a mecânica (arrastar, tocar, teclado,
// conferir, estourar, dica, recolher) mora aqui. Cada cena filha só define:
//
//   gerarRodadasIniciais()      → array de rodadas ao começar a etapa
//   gerarUmaRodada(facil)       → 1 rodada nova (após estourar; "facil" = menor)
//   configRodada(rodada)        → { total, nZonas, alvoPorZona, rotuloZona, corZona, info }
//   textoSucesso(porZona)       → texto do "X op Y = Z"
//   narracaoSucesso(porZona)    → frase falada no acerto
export default class FaseDistribuir extends FaseBase {
  create() {
    this.iniciarFase();
    this.rodadas = this.gerarRodadasIniciais();
    this.configurarTecladoZonas();
    this.montarRodada();
    falar(this.fase.enunciado);
  }

  montarRodada() {
    if (this.grupo) this.grupo.destroy(true);
    if (this.pecas) this.pecas.forEach((g) => g.destroy());
    this.grupo = this.add.container(0, 0);
    this.pecas = [];
    this.zonas = [];
    this.bloqueado = false;
    this.focoZona = 0;
    this.erros = 0;

    const centro = this.desenharCabecalho();
    this.rodada = this.rodadas[this.rodadaAtual];
    const cfg = this.configRodada(this.rodada);
    this.alvoPorZona = cfg.alvoPorZona;

    // Linha de info (a novidade da rodada: quanto tem e em quantas zonas).
    const rot = this.add
      .text(centro, this.baseY, cfg.info, { fontFamily: TEMA.fonte, fontSize: this.fs("16px"), color: "#ffd8a8" })
      .setOrigin(0.5);
    this.grupo.add(rot);

    // ===== Reservatório de peças (arrastáveis) =====
    const rcols = Math.min(8, cfg.total);
    const rpasso = 40;
    const rtopY = this.baseY + 44;
    const rinicioX = centro - ((rcols - 1) * rpasso) / 2;
    for (let i = 0; i < cfg.total; i++) {
      const col = i % rcols;
      const row = Math.floor(i / rcols);
      const cor = TEMA.coresCristal[i % TEMA.coresCristal.length];
      this.pecas.push(this.criarPeca(rinicioX + col * rpasso, rtopY + row * 34, cor));
    }

    // ===== Zonas de destino (tanques / motores) =====
    const n = cfg.nZonas;
    const zW = 92;
    const zH = 150;
    const gap = Math.min(52, (this.scale.width - 80 - n * zW) / Math.max(1, n - 1));
    const totalW = n * zW + (n - 1) * gap;
    const startX = centro - totalW / 2 + zW / 2;
    const zY = this.baseY + 224;

    for (let k = 0; k < n; k++) {
      const zx = startX + k * (zW + gap);
      this.grupo.add(desenharCaixa(this, zx, zY, zW, zH, cfg.corZona, `${cfg.rotuloZona} ${k + 1}`));
      const contador = this.add
        .text(zx, zY + zH / 2 + 20, "0", { fontFamily: TEMA.fonte, fontSize: this.fs("26px"), color: "#ffd43b" })
        .setOrigin(0.5);
      this.grupo.add(contador);
      const foco = this.add.graphics();
      this.grupo.add(foco);

      const zona = { x: zx, y: zY, w: zW, h: zH, itens: [], contador, foco };
      this.zonas.push(zona);

      const zRect = this.add.rectangle(zx, zY, zW, zH, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
      zRect.on("pointerdown", () => this.encherDoReservatorio(zona));
      this.grupo.add(zRect);
    }

    this.prepararArraste();
    this.aoSoltarItem = (obj, p) => this.soltar(obj, p);
    this.desenharFocoZona();

    this.dica = this.add
      .text(centro, this.scale.height - 26, "", { fontFamily: TEMA.fonte, fontSize: this.fs("16px"), color: "#ffa8a8" })
      .setOrigin(0.5);
    this.grupo.add(this.dica);

    this.criarBotaoDica(() => this.darDica());
    this.iniciarTimerRodada(12); // ~12s antes de trocar a conta
  }

  criarPeca(x, y, cor) {
    const c = this.add.circle(x, y, 13, cor);
    c.setStrokeStyle(3, 0xffffff, 0.55);
    c.home = { x, y };
    c.zona = null;
    c.setInteractive({ draggable: true, useHandCursor: true });
    return c;
  }

  soltar(peca, pointer) {
    if (this.bloqueado) {
      this.devolver(peca);
      return;
    }
    const alvo = this.zonaNoPonto(this.zonas, pointer.x, pointer.y);
    if (alvo) this.colocarNaZona(peca, alvo);
    else this.devolver(peca);
  }

  colocarNaZona(peca, zona) {
    if (peca.zona === zona) {
      this.reorganizar(zona);
      this.conferir();
      return;
    }
    if (peca.zona) {
      peca.zona.itens = peca.zona.itens.filter((g) => g !== peca);
      this.reorganizar(peca.zona);
    }
    peca.zona = zona;
    zona.itens.push(peca);
    this.reorganizar(zona);
    pling(Math.min(zona.itens.length, 6));
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

  reorganizar(zona) {
    const baseY = zona.y + zona.h / 2 - 20;
    zona.itens.forEach((g, i) => {
      this.tweens.add({ targets: g, x: zona.x, y: baseY - i * 28, duration: 160, ease: "Quad.easeOut" });
    });
    zona.contador.setText(String(zona.itens.length));
  }

  encherDoReservatorio(zona) {
    if (this.bloqueado) return;
    const livre = this.pecas.find((g) => g.zona === null);
    if (!livre) return;
    this.colocarNaZona(livre, zona);
  }

  // Sucesso quando tudo foi distribuído E todas as zonas ficaram IGUAIS
  // (como o total é fixo, "iguais" já garante a quantidade certa em cada zona).
  conferir() {
    if (this.bloqueado) return;
    const livres = this.pecas.filter((g) => g.zona === null).length;
    if (livres > 0) {
      this.dica.setText("");
      return;
    }
    const contagens = this.zonas.map((z) => z.itens.length);
    const iguais = contagens.every((c) => c === contagens[0]);
    if (iguais) {
      this.sucesso(contagens[0]);
    } else {
      this.bloqueado = true; // trava até recolher (evita erros em cascata)
      const estourou = this.registrarErro(this.pecas, () => this.gerarUmaRodada(true), "🔁");
      if (!estourou) this.time.delayedCall(500, () => this.recolherTudo());
    }
  }

  sucesso(porZona) {
    this.bloqueado = true;
    this.pararTimerRodada();
    this.zonas.forEach((z) => z.foco.clear());
    this.pecas.forEach((g) => g.disableInteractive());
    somAcerto();

    this.dica.setText("");

    // Feedback do PORQUÊ (VISUAL): cada grupo/zona PISCA em sequência, com o seu
    // número saltando em cima — a criança VÊ que todos ficaram IGUAIS (a divisão/
    // multiplicação montada). Só depois a conta completa aparece embaixo.
    const stagger = 300;
    this.zonas.forEach((z, i) => {
      this.time.delayedCall(i * stagger, () => {
        pling(i);
        const brilho = this.add.circle(z.x, z.y, 10, TEMA.foco, 0.6);
        this.grupo.add(brilho);
        this.tweens.add({ targets: brilho, scale: 7, alpha: 0, duration: 520, onComplete: () => brilho.destroy() });
        // As peças daquela zona incham juntas (grupo igual em destaque).
        z.itens.forEach((p) => this.tweens.add({ targets: p, scale: 1.35, duration: 200, yoyo: true, ease: "Sine.easeInOut" }));
        // Número do grupo salta em cima da zona.
        const n = this.add
          .text(z.x, z.y - z.h / 2 - 14, `${porZona}`, {
            fontFamily: TEMA.fonte,
            fontSize: this.fs("34px"),
            color: "#ffe000",
            fontStyle: "bold",
          })
          .setOrigin(0.5)
          .setScale(0);
        n.setStroke("#0b1120", 5);
        this.grupo.add(n);
        this.tweens.add({ targets: n, scale: 1, duration: 240, ease: "Back.easeOut" });
        this.tweens.add({ targets: n, y: n.y - 16, alpha: 0, delay: 500, duration: 500, onComplete: () => n.destroy() });
      });
    });

    // A conta completa "salta" depois da explicação dos grupos.
    const atraso = this.zonas.length * stagger + 200;
    const msg = this.add
      .text(this.scale.width / 2, this.scale.height - 30, this.textoSucesso(porZona), {
        fontFamily: TEMA.fonte,
        fontSize: this.fs("24px"),
        color: "#ffffff",
        fontStyle: "bold",
        align: "center",
        wordWrap: { width: this.scale.width - 80 },
      })
      .setOrigin(0.5)
      .setScale(0);
    msg.setStroke("#0b1120", 5);
    this.grupo.add(msg);
    this.tweens.add({ targets: msg, scale: 1, duration: 420, delay: atraso, ease: "Back.easeOut" });

    falar(this.narracaoSucesso(porZona));
    this.itens = this.pecas;
    this.time.delayedCall(atraso + 900, () => this.animarColeta(this.pecas, () => this.aposAcerto()));
  }

  aposAcerto() {
    this.rodadaAtual++;
    if (this.rodadaAtual >= this.rodadas.length) {
      this.time.delayedCall(300, () => this.concluirEtapa(this.fase.tarefaOk));
    } else {
      this.time.delayedCall(300, () => this.montarRodada());
    }
  }

  // Volta todas as peças ao reservatório (tentar de novo após um erro).
  recolherTudo() {
    this.zonas.forEach((z) => {
      z.itens = [];
      z.contador.setText("0");
    });
    this.pecas.forEach((p) => {
      p.zona = null;
      this.tweens.add({ targets: p, x: p.home.x, y: p.home.y, scale: 1, duration: 260, ease: "Back.easeOut" });
    });
    if (this.dica) this.dica.setText("");
    this.bloqueado = false;
  }

  // Dica: enche a 1ª zona como exemplo (mostra quantos vão em cada).
  darDica() {
    if (this.bloqueado) return;
    const z0 = this.zonas[0];
    falar("Assim, igual em cada!");
    const passo = () => {
      if (z0.itens.length >= this.alvoPorZona || !this.pecas.some((g) => g.zona === null)) {
        const brilho = this.add.circle(z0.x, z0.y, 10, TEMA.foco, 0.5);
        this.grupo.add(brilho);
        this.tweens.add({ targets: brilho, scale: 7, alpha: 0, duration: 600, onComplete: () => brilho.destroy() });
        this.apontar(z0.x, z0.y - z0.h / 2);
        return;
      }
      const livre = this.pecas.find((g) => g.zona === null);
      this.colocarNaZona(livre, z0);
      this.time.delayedCall(220, passo);
    };
    passo();
  }

  // ===== Teclado (← → escolhem a zona; Enter enche; Backspace tira) =====
  configurarTecladoZonas() {
    this.input.keyboard.on("keydown-RIGHT", () => this.moverFocoZona(1));
    this.input.keyboard.on("keydown-LEFT", () => this.moverFocoZona(-1));
    this.input.keyboard.on("keydown-ENTER", () => this.acaoTecladoZona());
    this.input.keyboard.on("keydown-SPACE", () => this.acaoTecladoZona());
    this.input.keyboard.on("keydown-BACKSPACE", () => this.tirarDaZona());
  }

  moverFocoZona(dir) {
    if (this.bloqueado || !this.zonas?.length) return;
    this.focoZona = Phaser.Math.Wrap(this.focoZona + dir, 0, this.zonas.length);
    this.desenharFocoZona();
  }

  acaoTecladoZona() {
    const z = this.zonas?.[this.focoZona];
    if (z) this.encherDoReservatorio(z);
  }

  tirarDaZona() {
    if (this.bloqueado) return;
    const z = this.zonas?.[this.focoZona];
    const ultima = z?.itens?.[z.itens.length - 1];
    if (ultima) this.devolver(ultima);
  }

  desenharFocoZona() {
    if (!this.zonas?.length) return;
    this.zonas.forEach((z, i) => {
      z.foco.clear();
      if (i === this.focoZona && !this.bloqueado) {
        z.foco.lineStyle(4, TEMA.foco, 0.95);
        z.foco.strokeRoundedRect(z.x - z.w / 2 - 4, z.y - z.h / 2 - 4, z.w + 8, z.h + 8, 14);
      }
    });
  }
}
