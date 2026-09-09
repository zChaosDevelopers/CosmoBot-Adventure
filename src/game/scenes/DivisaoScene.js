import Phaser from "phaser";
import { TEMA } from "../tema.js";
import { desenharCaixa } from "../desenho.js";
import { gerarRodadasDivisao } from "../gerarRodadas.js";
import { falar } from "../../lib/fala.js";
import { somAcerto, somErro, pling } from "../../lib/sfx.js";
import FaseBase from "./FaseBase.js";

// Etapa 5 — "Traçar a Rota": DIVISÃO como REPARTIÇÃO (partes iguais).
//
// A criança NÃO vê a resposta pronta: ela precisa **arrastar** o combustível para
// os tanques e deixá-los todos IGUAIS. Ao repartir tudo por igual, ela DESCOBRE
// quanto vai em cada tanque — é o conceito de divisão, não uma contagem do que
// já está na tela. Também dá para tocar num tanque (adiciona uma gota) ou usar o
// teclado (← → escolhem o tanque, Enter enche, Backspace tira) — acessível a todos.
export default class DivisaoScene extends FaseBase {
  constructor() {
    super("DivisaoScene");
  }

  create() {
    this.iniciarFase();
    const cfg = this.fase.gerar || {};
    // Quantidades pequenas: arrastar muitas gotas cansaria (aqui até 3 x 4 = 12).
    this.rodadas = gerarRodadasDivisao(cfg.rodadas ?? 3, cfg.maxDivisor ?? 3, cfg.maxQuociente ?? 4);
    this.configurarTecladoTanques();
    this.montarRodada();
    falar(this.fase.enunciado);
  }

  montarRodada() {
    // Limpa cenário anterior (estático) e as gotas (dinâmicas, fora do grupo).
    if (this.grupo) this.grupo.destroy(true);
    if (this.gotas) this.gotas.forEach((g) => g.destroy());
    this.grupo = this.add.container(0, 0);
    this.gotas = [];
    this.tanques = [];
    this.bloqueado = false;
    this.focoTanque = 0;

    const centro = this.desenharCabecalho();
    const rodada = this.rodadas[this.rodadaAtual];
    this.rodada = rodada;

    // Linha-guia única (o enunciado já pede a ação): quantidade de combustível
    // e em quantos tanques repartir — a informação NOVA desta rodada.
    const rot = this.add
      .text(
        centro,
        this.baseY,
        `⛽ Combustível: ${rodada.total}  •  ${rodada.divisor} tanques iguais`,
        { fontFamily: TEMA.fonte, fontSize: "16px", color: "#ffd8a8" }
      )
      .setOrigin(0.5);
    this.grupo.add(rot);

    // ===== Reservatório: as gotas de combustível (arrastáveis) =====
    const rcols = Math.min(8, rodada.total);
    const rpasso = 40;
    const rtopY = this.baseY + 44;
    const rinicioX = centro - ((rcols - 1) * rpasso) / 2;
    for (let i = 0; i < rodada.total; i++) {
      const col = i % rcols;
      const row = Math.floor(i / rcols);
      const hx = rinicioX + col * rpasso;
      const hy = rtopY + row * 34;
      const cor = TEMA.coresCristal[i % TEMA.coresCristal.length];
      this.gotas.push(this.criarGota(hx, hy, cor));
    }

    // ===== Tanques (zonas de destino) =====
    const div = rodada.divisor;
    const tankW = 92;
    const tankH = 150;
    const gap = Math.min(52, (this.scale.width - 80 - div * tankW) / Math.max(1, div - 1));
    const totalW = div * tankW + (div - 1) * gap;
    const startX = centro - totalW / 2 + tankW / 2;
    const tankY = this.baseY + 224;

    for (let k = 0; k < div; k++) {
      const tx = startX + k * (tankW + gap);
      this.grupo.add(desenharCaixa(this, tx, tankY, tankW, tankH, "#cc5de8", `Tanque ${k + 1}`));

      // Contador do tanque (começa em 0 — a criança acompanha o equilíbrio).
      const contador = this.add
        .text(tx, tankY + tankH / 2 + 20, "0", {
          fontFamily: TEMA.fonte,
          fontSize: "26px",
          color: "#ffd43b",
        })
        .setOrigin(0.5);
      this.grupo.add(contador);

      // Realce de foco (para teclado) — invisível por padrão.
      const foco = this.add.graphics();
      this.grupo.add(foco);

      const tanque = { x: tx, y: tankY, w: tankW, h: tankH, itens: [], contador, foco };
      this.tanques.push(tanque);

      // Toque/clique no tanque: puxa uma gota do reservatório (acessível e fácil).
      const zona = this.add
        .rectangle(tx, tankY, tankW, tankH, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      zona.on("pointerdown", () => this.encherDoReservatorio(tanque));
      this.grupo.add(zona);
    }

    this.prepararArraste();
    this.aoSoltarItem = (obj, p) => this.soltarGota(obj, p);
    this.desenharFocoTanque();

    // Mensagem de ajuda (aparece só quando o reservatório esvazia desigual).
    this.dica = this.add
      .text(centro, this.scale.height - 26, "", {
        fontFamily: TEMA.fonte,
        fontSize: "16px",
        color: "#ffa8a8",
      })
      .setOrigin(0.5);
    this.grupo.add(this.dica);
  }

  // Cria uma gota de combustível arrastável (círculo leve, sem animação infinita).
  criarGota(x, y, cor) {
    const c = this.add.circle(x, y, 13, cor);
    c.setStrokeStyle(3, 0xffffff, 0.55);
    c.home = { x, y };
    c.zona = null; // null = está no reservatório
    c.setInteractive({ draggable: true, useHandCursor: true });
    return c;
  }

  // Decide para onde a gota vai quando é solta.
  soltarGota(gota, pointer) {
    if (this.bloqueado) {
      this.devolver(gota);
      return;
    }
    const alvo = this.zonaNoPonto(this.tanques, pointer.x, pointer.y);
    if (alvo) this.colocarNoTanque(gota, alvo);
    else this.devolver(gota);
  }

  // Coloca a gota num tanque (tirando-a de onde estava) e reorganiza as pilhas.
  colocarNoTanque(gota, tanque) {
    if (gota.zona === tanque) {
      this.reorganizar(tanque);
      this.conferir();
      return;
    }
    if (gota.zona) {
      gota.zona.itens = gota.zona.itens.filter((g) => g !== gota);
      this.reorganizar(gota.zona);
    }
    gota.zona = tanque;
    tanque.itens.push(gota);
    this.reorganizar(tanque);
    pling(Math.min(tanque.itens.length, 6));
    this.conferir();
  }

  // Devolve a gota ao reservatório (posição de origem).
  devolver(gota) {
    if (gota.zona) {
      gota.zona.itens = gota.zona.itens.filter((g) => g !== gota);
      this.reorganizar(gota.zona);
      gota.zona = null;
    }
    this.tweens.add({ targets: gota, x: gota.home.x, y: gota.home.y, duration: 180, ease: "Back.easeOut" });
    this.conferir();
  }

  // Empilha as gotas dentro de um tanque, de baixo para cima, e atualiza o número.
  reorganizar(tanque) {
    const baseY = tanque.y + tanque.h / 2 - 20;
    tanque.itens.forEach((g, i) => {
      const gx = tanque.x;
      const gy = baseY - i * 28;
      this.tweens.add({ targets: g, x: gx, y: gy, duration: 160, ease: "Quad.easeOut" });
    });
    tanque.contador.setText(String(tanque.itens.length));
  }

  // Toque/teclado: puxa a próxima gota livre do reservatório para o tanque.
  encherDoReservatorio(tanque) {
    if (this.bloqueado) return;
    const livre = this.gotas.find((g) => g.zona === null);
    if (!livre) return;
    this.colocarNoTanque(livre, tanque);
  }

  // Verifica se a repartição está correta: tudo repartido E todos os tanques iguais.
  conferir() {
    if (this.bloqueado) return;
    const livres = this.gotas.filter((g) => g.zona === null).length;
    if (livres > 0) {
      this.dica.setText("");
      return;
    }
    const contagens = this.tanques.map((t) => t.itens.length);
    const iguais = contagens.every((c) => c === contagens[0]);
    if (iguais) {
      this.sucesso(contagens[0]);
    } else {
      this.dica.setText("Quase! Os tanques precisam ficar todos iguais.");
      somErro();
    }
  }

  sucesso(porTanque) {
    this.bloqueado = true;
    this.tanques.forEach((t) => t.foco.clear());
    this.gotas.forEach((g) => g.disableInteractive());
    somAcerto();
    const r = this.rodada;

    // Realça os tanques (todos iguais!) e revela a conta ligando ação e símbolo.
    this.tanques.forEach((t) => {
      const brilho = this.add.circle(t.x, t.y, 8, TEMA.foco, 0.9);
      this.grupo.add(brilho);
      this.tweens.add({ targets: brilho, scale: 6, alpha: 0, duration: 600 });
    });

    this.dica.setText("");
    const msg = this.add
      .text(this.scale.width / 2, this.scale.height - 30, `${r.total} ÷ ${r.divisor} = ${porTanque}  •  ${porTanque} em cada tanque!`, {
        fontFamily: TEMA.fonte,
        fontSize: "20px",
        color: "#ffffff",
        align: "center",
        wordWrap: { width: this.scale.width - 80 },
      })
      .setOrigin(0.5);
    this.grupo.add(msg);

    falar(`Muito bem! ${r.total} repartido em ${r.divisor} tanques dá ${porTanque} em cada um.`);
    this.itens = this.gotas;
    this.time.delayedCall(1100, () => this.animarColeta(this.gotas, () => this.aposAcerto()));
  }

  aposAcerto() {
    this.rodadaAtual++;
    if (this.rodadaAtual >= this.rodadas.length) {
      this.time.delayedCall(300, () => this.concluirEtapa(this.fase.tarefaOk));
    } else {
      this.time.delayedCall(300, () => this.montarRodada());
    }
  }

  // ===== Teclado: escolher tanque (← →), encher (Enter) e tirar (Backspace) =====
  configurarTecladoTanques() {
    this.input.keyboard.on("keydown-RIGHT", () => this.moverFocoTanque(1));
    this.input.keyboard.on("keydown-LEFT", () => this.moverFocoTanque(-1));
    this.input.keyboard.on("keydown-ENTER", () => this.acaoTecladoTanque());
    this.input.keyboard.on("keydown-SPACE", () => this.acaoTecladoTanque());
    this.input.keyboard.on("keydown-BACKSPACE", () => this.tirarDoTanque());
  }

  moverFocoTanque(dir) {
    if (this.bloqueado || !this.tanques?.length) return;
    this.focoTanque = Phaser.Math.Wrap(this.focoTanque + dir, 0, this.tanques.length);
    this.desenharFocoTanque();
  }

  acaoTecladoTanque() {
    const t = this.tanques?.[this.focoTanque];
    if (t) this.encherDoReservatorio(t);
  }

  tirarDoTanque() {
    if (this.bloqueado) return;
    const t = this.tanques?.[this.focoTanque];
    const ultima = t?.itens?.[t.itens.length - 1];
    if (ultima) this.devolver(ultima);
  }

  desenharFocoTanque() {
    if (!this.tanques?.length) return;
    this.tanques.forEach((t, i) => {
      t.foco.clear();
      if (i === this.focoTanque && !this.bloqueado) {
        t.foco.lineStyle(4, TEMA.foco, 0.95);
        t.foco.strokeRoundedRect(t.x - t.w / 2 - 4, t.y - t.h / 2 - 4, t.w + 8, t.h + 8, 14);
      }
    });
  }
}
