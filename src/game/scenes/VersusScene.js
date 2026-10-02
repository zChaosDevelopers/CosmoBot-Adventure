import Phaser from "phaser";
import { TEMA } from "../tema.js";
import { desenharFundo, desenharRobo, tornarInerte } from "../desenho.js";
import { gerarRodadasVersus } from "../gerarRodadas.js";
import { somAcerto, somErro, pling, somVitoria } from "../../lib/sfx.js";
import { anunciar } from "../../lib/anunciar.js";

// MODO 2 JOGADORES (versus) — disputa rápida no mesmo teclado.
//
// Os dois veem a MESMA conta e correm para apertar a resposta certa. Quem
// acertar primeiro leva o ponto; quem erra fica de fora só daquela rodada
// (nunca do jogo). São 5 rodadas e ganha quem fizer mais pontos.
//
// Teclas (uma por alternativa, para a disputa ser justa — os dois respondem
// com um toque só, ninguém precisa "navegar" até a resposta):
//   Jogador 1 (esquerda):  A  S  D
//   Jogador 2 (direita):   ←  ↓  →
//
// É um modo SEPARADO: não mexe nas 8 fases da aventura, não altera progresso
// nem ranking.
const TECLAS_J1 = ["A", "S", "D"];
const TECLAS_J2 = ["←", "↓", "→"];
const CODIGOS_J1 = ["keydown-A", "keydown-S", "keydown-D"];
const CODIGOS_J2 = ["keydown-LEFT", "keydown-DOWN", "keydown-RIGHT"];

const COR_J1 = 0x4cc9f0;
const COR_J2 = 0xff922b;

export default class VersusScene extends Phaser.Scene {
  constructor() {
    super("VersusScene");
  }

  create() {
    const cfg = this.registry.get("versus") || {};
    this.jogadores = [
      { nome: cfg.nome1 || "Jogador 1", cor: cfg.cor1 || "#4cc9f0", corNum: COR_J1, pontos: 0 },
      { nome: cfg.nome2 || "Jogador 2", cor: cfg.cor2 || "#ff922b", corNum: COR_J2, pontos: 0 },
    ];
    this.totalRodadas = cfg.rodadas || 5;
    this.rodadas = gerarRodadasVersus(this.totalRodadas, cfg.operacao || "misto");
    this.rodadaAtual = 0;
    // O Phaser reaproveita a instância da cena: toda trava precisa ser religada
    // aqui, senão volta ligada da partida anterior.
    this._acabou = false;

    desenharFundo(this);
    this.desenharTopo();
    this.desenharPlacar();
    this.montarRodada();

    // Esc sai do modo (volta para o menu do React).
    this.input.keyboard.on("keydown-ESC", () => this.sair());
    anunciar("Modo dois jogadores. Jogador 1 usa A, S e D. Jogador 2 usa as setas.");
  }

  sair() {
    const onSair = this.registry.get("onSairVersus");
    if (typeof onSair === "function") onSair();
  }

  desenharTopo() {
    const { width } = this.scale;
    this.add
      .text(width / 2, 30, "👥 2 Jogadores", {
        fontFamily: TEMA.fonte,
        fontSize: "26px",
        color: "#ffd8a8",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.rodadaTxt = this.add
      .text(width / 2, 58, "", { fontFamily: TEMA.fonte, fontSize: "16px", color: "#94a3b8" })
      .setOrigin(0.5);
    this.add
      .text(width / 2, 578, "Esc para sair  •  quem apertar primeiro na resposta certa leva o ponto", {
        fontFamily: TEMA.fonte,
        fontSize: "13px",
        color: "#64748b",
      })
      .setOrigin(0.5);
  }

  // Robô, nome e as 5 bolinhas de ponto de cada jogador, um em cada canto.
  desenharPlacar() {
    const { width } = this.scale;
    this.placar = [];
    [
      { j: 0, x: 96, teclas: TECLAS_J1 },
      { j: 1, x: width - 96, teclas: TECLAS_J2 },
    ].forEach(({ j, x, teclas }) => {
      const jog = this.jogadores[j];
      const robo = desenharRobo(this, x, 136, jog.cor, 72);
      tornarInerte(robo);
      this.add
        .text(x, 186, jog.nome, {
          fontFamily: TEMA.fonte,
          fontSize: "17px",
          color: "#ffffff",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      this.add
        .text(x, 208, teclas.join("  "), { fontFamily: TEMA.fonte, fontSize: "15px", color: "#94a3b8" })
        .setOrigin(0.5);

      // Bolinhas de ponto.
      const bolas = [];
      const passo = 22;
      const inicio = x - ((this.totalRodadas - 1) * passo) / 2;
      for (let k = 0; k < this.totalRodadas; k++) {
        const b = this.add.circle(inicio + k * passo, 238, 8, 0x1e293b, 1);
        b.setStrokeStyle(2, jog.corNum, 0.8);
        bolas.push(b);
      }
      this.placar.push({ robo, bolas });
    });
  }

  atualizarPlacar() {
    this.placar.forEach((p, j) => {
      p.bolas.forEach((b, k) => {
        const ganho = k < this.jogadores[j].pontos;
        b.setFillStyle(ganho ? this.jogadores[j].corNum : 0x1e293b, 1);
      });
    });
  }

  montarRodada() {
    if (this.grupo) this.grupo.destroy(true);
    this.grupo = this.add.container(0, 0);
    this.respondido = false;
    this.foraDaRodada = [false, false]; // quem já errou nesta rodada

    const { width } = this.scale;
    const centro = width / 2;
    const q = this.rodadas[this.rodadaAtual];
    this.q = q;
    this.rodadaTxt.setText(`Rodada ${this.rodadaAtual + 1} de ${this.totalRodadas}`);

    // ===== A conta, grande no centro =====
    const bw = Math.min(420, width - 260);
    const bh = 104;
    const ey = 150;
    const g = this.add.graphics();
    g.fillStyle(0x0b1120, 0.92);
    g.fillRoundedRect(centro - bw / 2, ey - bh / 2, bw, bh, 18);
    g.lineStyle(6, TEMA.foco, 1);
    g.strokeRoundedRect(centro - bw / 2, ey - bh / 2, bw, bh, 18);
    this.grupo.add(g);

    this.contaTxt = this.add
      .text(centro, ey, `${q.icone}  ${q.prompt} = ?`, {
        fontFamily: TEMA.fonte,
        fontSize: "40px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.grupo.add(this.contaTxt);
    this.tweens.add({ targets: this.contaTxt, scale: { from: 0.7, to: 1 }, duration: 260, ease: "Back.easeOut" });

    this.desenharOpcoes(centro, q.opcoes);
    this.ligarTeclas();
  }

  // Três cartões: a tecla do J1 em cima, o número no meio, a tecla do J2 embaixo.
  desenharOpcoes(centro, opcoes) {
    const y = 400;
    const L = 150;
    const A = 170;
    const passo = 180;
    this.cartoes = [];

    opcoes.forEach((valor, i) => {
      const x = centro + (i - 1) * passo;
      const c = this.add.container(x, y);

      const g = this.add.graphics();
      g.fillStyle(0x1e293b, 1);
      g.fillRoundedRect(-L / 2, -A / 2, L, A, 20);
      g.lineStyle(4, 0x475569, 1);
      g.strokeRoundedRect(-L / 2, -A / 2, L, A, 20);
      c.add(g);

      const t1 = this.add
        .text(0, -A / 2 + 26, TECLAS_J1[i], {
          fontFamily: TEMA.fonte,
          fontSize: "24px",
          color: "#4cc9f0",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      const num = this.add
        .text(0, 0, `${valor}`, {
          fontFamily: TEMA.fonte,
          fontSize: "52px",
          color: "#ffffff",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      const t2 = this.add
        .text(0, A / 2 - 26, TECLAS_J2[i], {
          fontFamily: TEMA.fonte,
          fontSize: "24px",
          color: "#ff922b",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      c.add([t1, num, t2]);
      this.grupo.add(c);
      this.cartoes.push({ c, g, num, valor, L, A });
    });
  }

  pintarCartao(i, cor, preenchimento = 0x1e293b) {
    const k = this.cartoes[i];
    if (!k) return;
    k.g.clear();
    k.g.fillStyle(preenchimento, 1);
    k.g.fillRoundedRect(-k.L / 2, -k.A / 2, k.L, k.A, 20);
    k.g.lineStyle(5, cor, 1);
    k.g.strokeRoundedRect(-k.L / 2, -k.A / 2, k.L, k.A, 20);
  }

  ligarTeclas() {
    // Religa a cada rodada; o Phaser acumula listeners se não limparmos.
    [...CODIGOS_J1, ...CODIGOS_J2].forEach((codigo) => this.input.keyboard.off(codigo));
    CODIGOS_J1.forEach((codigo, i) =>
      this.input.keyboard.on(codigo, (e) => this.responder(0, i, e))
    );
    CODIGOS_J2.forEach((codigo, i) =>
      this.input.keyboard.on(codigo, (e) => this.responder(1, i, e))
    );
  }

  responder(jogador, indice, evento) {
    if (evento?.repeat) return; // tecla segurada não vale
    if (this.respondido || this._acabou) return;
    if (this.foraDaRodada[jogador]) return; // já errou nesta rodada

    const escolhido = this.cartoes[indice];
    if (!escolhido) return;

    if (escolhido.valor === this.q.quantidade) {
      this.pontoPara(jogador, indice);
    } else {
      this.errou(jogador, indice);
    }
  }

  pontoPara(jogador, indice) {
    this.respondido = true;
    somAcerto();
    const jog = this.jogadores[jogador];
    jog.pontos++;
    this.atualizarPlacar();

    this.pintarCartao(indice, jog.corNum, 0x14532d);
    this.contaTxt.setText(`${this.q.icone}  ${this.q.prompt} = ${this.q.quantidade}`).setColor("#2bff88");
    this.tweens.add({ targets: this.contaTxt, scale: 1.12, duration: 240, yoyo: true });

    // O robô do vencedor da rodada comemora.
    const robo = this.placar[jogador]?.robo;
    if (robo) this.tweens.add({ targets: robo, y: robo.y - 18, duration: 180, yoyo: true, repeat: 1 });

    const msg = this.add
      .text(this.scale.width / 2, 268, `${jog.nome} marcou! 🎉`, {
        fontFamily: TEMA.fonte,
        fontSize: "24px",
        color: "#2bff88",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setScale(0);
    this.grupo.add(msg);
    this.tweens.add({ targets: msg, scale: 1, duration: 300, ease: "Back.easeOut" });
    anunciar(`${jog.nome} marcou. ${this.q.prompt} é ${this.q.quantidade}.`);

    this.time.delayedCall(1400, () => this.proximaRodada());
  }

  errou(jogador, indice) {
    somErro();
    this.foraDaRodada[jogador] = true;
    const jog = this.jogadores[jogador];

    // O cartão errado treme; o jogador fica de fora só desta rodada.
    const k = this.cartoes[indice];
    if (k) this.tweens.add({ targets: k.c, x: k.c.x + 8, duration: 50, yoyo: true, repeat: 3 });
    const robo = this.placar[jogador]?.robo;
    if (robo) robo.setAlpha(0.45);

    // Os dois erraram: ninguém pontua, mostra a resposta e segue (não trava).
    if (this.foraDaRodada[0] && this.foraDaRodada[1]) {
      this.respondido = true;
      this.contaTxt.setText(`${this.q.icone}  ${this.q.prompt} = ${this.q.quantidade}`).setColor("#ffd43b");
      const certo = this.cartoes.findIndex((c) => c.valor === this.q.quantidade);
      if (certo >= 0) this.pintarCartao(certo, 0xffd43b);
      const msg = this.add
        .text(this.scale.width / 2, 268, "Essa era a resposta! Próxima… 🙂", {
          fontFamily: TEMA.fonte,
          fontSize: "20px",
          color: "#ffd43b",
        })
        .setOrigin(0.5);
      this.grupo.add(msg);
      this.time.delayedCall(1600, () => this.proximaRodada());
    } else {
      pling(0);
      anunciar(`${jog.nome} errou e espera a próxima rodada.`);
    }
  }

  proximaRodada() {
    this.rodadaAtual++;
    this.placar.forEach((p) => p.robo.setAlpha(1));
    if (this.rodadaAtual >= this.rodadas.length) this.fim();
    else this.montarRodada();
  }

  fim() {
    this._acabou = true;
    if (this.grupo) this.grupo.destroy(true);
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x000000, 0.72).setOrigin(0);
    somVitoria();

    const [a, b] = this.jogadores;
    const empate = a.pontos === b.pontos;
    const vencedor = a.pontos > b.pontos ? a : b;

    this.add
      .text(width / 2, 180, empate ? "🤝 Empate!" : `🏆 ${vencedor.nome} venceu!`, {
        fontFamily: TEMA.fonte,
        fontSize: "40px",
        color: "#ffe066",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Placar em colunas (nome em cima, pontos embaixo), cada um do seu lado.
    // Numa linha só, "Jogador 1 2 × 2 Jogador 2" se lê como "Jogador 12".
    [
      { jog: a, x: width / 2 - 150 },
      { jog: b, x: width / 2 + 150 },
    ].forEach(({ jog, x }) => {
      this.add
        .text(x, 236, jog.nome, { fontFamily: TEMA.fonte, fontSize: "20px", color: "#e2e8f0" })
        .setOrigin(0.5);
      this.add
        .text(x, 274, `${jog.pontos}`, {
          fontFamily: TEMA.fonte,
          fontSize: "44px",
          color: jog.cor,
          fontStyle: "bold",
        })
        .setOrigin(0.5);
    });
    this.add
      .text(width / 2, 268, "×", { fontFamily: TEMA.fonte, fontSize: "28px", color: "#94a3b8" })
      .setOrigin(0.5);

    if (!empate) {
      const robo = desenharRobo(this, width / 2, 378, vencedor.cor, 104);
      tornarInerte(robo);
      this.tweens.add({ targets: robo, y: 362, duration: 700, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      for (let k = 0; k < 10; k++) {
        const s = this.add
          .text(width / 2 + Phaser.Math.Between(-150, 150), 378 + Phaser.Math.Between(-70, 70), "✨", {
            fontFamily: TEMA.fonte,
            fontSize: "22px",
          })
          .setOrigin(0.5)
          .setScale(0);
        this.tweens.add({ targets: s, scale: 1, duration: 300, delay: k * 90, yoyo: true, repeat: -1 });
      }
    }

    this.add
      .text(width / 2, 470, "Enter para jogar de novo  •  Esc para sair", {
        fontFamily: TEMA.fonte,
        fontSize: "18px",
        color: "#ffd8a8",
      })
      .setOrigin(0.5);

    anunciar(empate ? "Empate!" : `${vencedor.nome} venceu por ${vencedor.pontos} pontos.`);
    this.input.keyboard.once("keydown-ENTER", () => this.scene.restart());
  }
}
