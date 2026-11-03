import Phaser from "phaser";
import { TEMA } from "../tema.js";
import { desenharFundo, desenharRobo, tornarInerte, criarBotao } from "../desenho.js";
import { gerarRodadasVersus } from "../gerarRodadas.js";
import { somAcerto, somErro, pling, somVitoria } from "../../lib/sfx.js";
import { anunciar } from "../../lib/anunciar.js";
import { mostrarPopupInstrucoes } from "../popupInstrucoes.js";
import { iniciarConfirmacao, definirConfirmacaoBase } from "../teclado.js";

// MODO 2 JOGADORES (versus) — disputa rápida no mesmo teclado.
//
// Os dois veem a MESMA conta e correm para apertar a resposta certa. Quem
// acertar primeiro leva o ponto; quem erra fica de fora só daquela rodada
// (nunca do jogo). Não há número fixo de rodadas: continua até alguém chegar a
// 5 pontos — esse jogador vence.
//
// Teclas (uma por alternativa, para a disputa ser justa — os dois respondem
// com um toque só, ninguém precisa "navegar" até a resposta):
//   Jogador 1 (esquerda):  A  S  D
//   Jogador 2 (direita):   ←  ↓  →
//
// No CELULAR/TABLET não há teclado: a tela é DIVIDIDA em cima/embaixo — cada
// jogador ganha os seus próprios 3 botões de resposta (Jogador 1 embaixo,
// Jogador 2 em cima, de cabeça para baixo, como numa mesa) e a conta fica no
// meio. Os dois podem tocar ao mesmo tempo (multitoque).
//
// É um modo SEPARADO: não mexe nas 8 fases da aventura, não altera progresso
// nem ranking.

// true em aparelho de toque (celular/tablet). Em notebook com tela de toque a tela
// larga mantém o modo teclado. "?toque=1" na URL força o modo toque (para testar).
function detectarToque() {
  try {
    if (new URLSearchParams(window.location.search).get("toque") === "1") return true;
    const grosso = window.matchMedia?.("(pointer: coarse)")?.matches || window.matchMedia?.("(any-pointer: coarse)")?.matches;
    const temToque = (navigator.maxTouchPoints || 0) > 0;
    const aparelhoMovel = /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(navigator.userAgent || "");
    const ladoMenor = Math.min(window.innerWidth, window.innerHeight);
    // celular/tablet: ponteiro grosso, UA móvel, ou toque numa tela pequena/média.
    // Janela estreita também (alguém testando no PC redimensionando a janela).
    return !!grosso || aparelhoMovel || (temToque && ladoMenor < 1100) || window.innerWidth < 700;
  } catch {
    return false;
  }
}

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
    // Não há número fixo de rodadas: as contas vão sendo sorteadas até alguém
    // chegar na meta de pontos (por padrão 5). Só um jogador pontua por rodada,
    // então nunca há empate.
    this.meta = cfg.pontos || 5;
    this.operacao = cfg.operacao || "misto";
    this.rodadas = gerarRodadasVersus(1, this.operacao);
    this.rodadaAtual = 0;
    // O Phaser reaproveita a instância da cena: toda trava precisa ser religada
    // aqui, senão volta ligada da partida anterior.
    this._acabou = false;
    this.modoToque = detectarToque();
    // O Phaser só acompanha 2 ponteiros (mouse + 1 dedo) por padrão; com dois
    // jogadores tocando juntos precisamos de pelo menos 2 dedos além do mouse.
    // A quantidade fica no gerenciador (não zera no restart): só completa o que falta.
    if (this.modoToque) {
      const falta = 3 - this.input.manager.pointersTotal;
      if (falta > 0) this.input.addPointer(falta);
    }

    this.geo = this.modoToque ? this.calcularGeometriaToque() : null;
    iniciarConfirmacao(this); // Enter/Espaço: um listener só, com camadas (ver teclado.js)
    desenharFundo(this, { planeta: false });
    this.desenharTopo();
    this.desenharPlacar();

    // Esc sai do modo (volta para o menu do React). off() antes do on() evita
    // acumular listeners se a cena for reaberta (mesmo cuidado do item 4).
    this.input.keyboard.off("keydown-ESC").on("keydown-ESC", () => this.sair());

    // Item 9: pop-up de instruções antes de liberar a disputa.
    const toque = this.modoToque;
    mostrarPopupInstrucoes(this, {
      titulo: "2 Jogadores",
      icone: "👥",
      linhas: [
        "Os dois veem a mesma conta e correm para tocar na resposta certa.",
        toque
          ? "Cada jogador usa os seus botões: Jogador 1 embaixo, Jogador 2 em cima."
          : "Jogador 1 usa A, S, D. Jogador 2 usa as setas ← ↓ →.",
        `Quem acertar primeiro leva o ponto. Vence quem chegar a ${this.meta} pontos!`,
      ],
      aoFechar: () => {
        this.montarRodada();
        anunciar(
          toque
            ? "Modo dois jogadores. Jogador 1 toca nos botões de baixo. Jogador 2 toca nos botões de cima."
            : "Modo dois jogadores. Jogador 1 usa A, S e D. Jogador 2 usa as setas."
        );
      },
    });
  }

  // Medidas da tela dividida (celular/tablet): painel do J2 em cima, conta no
  // meio, painel do J1 embaixo. Cada painel: cabeçalho (robô, nome, bolinhas) +
  // 3 botões lado a lado.
  calcularGeometriaToque() {
    const { width: W, height: H } = this.scale;
    const margem = 10;
    const painelH = Math.max(150, Math.min(340, Math.floor((H - 190 - 2 * margem) / 2)));
    return { W, H, margem, painelW: W - 2 * margem, painelH, cabecalhoH: 46, folga: 8, cy: H / 2 };
  }

  // Centro Y do painel de cada jogador (J1 embaixo, J2 em cima).
  yPainel(j) {
    const { H, margem, painelH } = this.geo;
    return j === 1 ? margem + painelH / 2 : H - margem - painelH / 2;
  }

  sair() {
    const onSair = this.registry.get("onSairVersus");
    if (typeof onSair === "function") onSair();
  }

  desenharTopo() {
    const { width, height } = this.scale;
    if (this.modoToque) {
      // Sem teclado não há Esc: botão de sair na faixa do meio, junto da rodada.
      const y = this.geo.cy - 73;
      this.rodadaTxt = this.add
        .text(width / 2, y, "", { fontFamily: TEMA.fonte, fontSize: "15px", color: "#94a3b8", align: "center", wordWrap: { width: width - 200 } })
        .setOrigin(0.5);
      criarBotao(this, 54, y, "✖ Sair", () => this.sair(), { largura: 88, altura: 38, fontSize: "16px", cor: 0x334155 });
      return;
    }
    this.add
      .text(width / 2, 30, "👥 2 Jogadores", {
        fontFamily: TEMA.fonte,
        fontSize: "26px",
        color: "#ffd8a8",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.rodadaTxt = this.add
      .text(width / 2, 58, "", { fontFamily: TEMA.fonte, fontSize: "16px", color: "#94a3b8", align: "center", wordWrap: { width: width - 200 } })
      .setOrigin(0.5);
    this.add
      .text(width / 2, height - 22, "Esc para sair  •  quem apertar primeiro na resposta certa leva o ponto", {
        fontFamily: TEMA.fonte,
        fontSize: "13px",
        color: "#64748b",
        align: "center",
        wordWrap: { width: width - 30 },
      })
      .setOrigin(0.5);
  }

  // Robô, nome e as 5 bolinhas de ponto de cada jogador, um em cada canto.
  desenharPlacar() {
    if (this.modoToque) {
      this.desenharPlacarToque();
      return;
    }
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
      if (!this.modoToque) {
        this.add
          .text(x, 208, teclas.join("  "), { fontFamily: TEMA.fonte, fontSize: "15px", color: "#94a3b8" })
          .setOrigin(0.5);
      }

      // Bolinhas de ponto.
      const bolas = [];
      const passo = 22;
      const inicio = x - ((this.meta - 1) * passo) / 2;
      for (let k = 0; k < this.meta; k++) {
        const b = this.add.circle(inicio + k * passo, 238, 8, 0x1e293b, 1);
        b.setStrokeStyle(2, jog.corNum, 0.8);
        bolas.push(b);
      }
      this.placar.push({ robo, bolas });
    });
  }

  // Tela dividida: o cabeçalho de cada painel (robô, nome, bolinhas). O painel do
  // J2 é girado 180° para quem joga de frente ler de cabeça para cima.
  desenharPlacarToque() {
    const { W, painelW, painelH, cabecalhoH } = this.geo;
    this.placar = [];
    this.paineis = [];
    this.jogadores.forEach((jog, j) => {
      const p = this.add.container(W / 2, this.yPainel(j));
      if (j === 1) p.setAngle(180);
      const fundo = this.add.graphics();
      fundo.fillStyle(jog.corNum, 0.1);
      fundo.fillRoundedRect(-painelW / 2, -painelH / 2, painelW, painelH, 22);
      fundo.lineStyle(3, jog.corNum, 0.55);
      fundo.strokeRoundedRect(-painelW / 2, -painelH / 2, painelW, painelH, 22);
      p.add(fundo);

      const hy = -painelH / 2 + cabecalhoH / 2 + 4;
      const robo = desenharRobo(this, -painelW / 2 + 34, hy + 3, jog.cor, 34);
      tornarInerte(robo);
      p.add(robo);
      p.add(
        this.add
          .text(-painelW / 2 + 64, hy, jog.nome, { fontFamily: TEMA.fonte, fontSize: "17px", color: "#ffffff", fontStyle: "bold" })
          .setOrigin(0, 0.5)
      );
      const bolas = [];
      const passo = 22;
      const ultimo = painelW / 2 - 26;
      for (let k = 0; k < this.meta; k++) {
        const b = this.add.circle(ultimo - (this.meta - 1 - k) * passo, hy, 8, 0x1e293b, 1);
        b.setStrokeStyle(2, jog.corNum, 0.8);
        p.add(b);
        bolas.push(b);
      }
      this.placar.push({ robo, bolas });
      this.paineis.push(p);
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
    const toque = this.modoToque;
    const q = this.rodadas[this.rodadaAtual];
    this.q = q;
    this.rodadaTxt.setText(
      toque
        ? `Rodada ${this.rodadaAtual + 1}  •  meta: ${this.meta} pontos`
        : `Rodada ${this.rodadaAtual + 1}  •  vence quem fizer ${this.meta} pontos primeiro`
    );

    // ===== A conta, grande no centro =====
    const bw = toque ? Math.min(420, width - 60) : Math.max(240, Math.min(420, width - 280));
    const bh = toque ? 84 : 104;
    const ey = toque ? this.geo.cy - 2 : 150;
    this.yMsg = ey + (toque ? 62 : 86); // onde aparecem "marcou!" / "essa era a resposta"
    const g = this.add.graphics();
    g.fillStyle(0x0b1120, 0.92);
    g.fillRoundedRect(centro - bw / 2, ey - bh / 2, bw, bh, 18);
    g.lineStyle(6, TEMA.foco, 1);
    g.strokeRoundedRect(centro - bw / 2, ey - bh / 2, bw, bh, 18);
    this.grupo.add(g);

    this.contaTxt = this.add
      .text(centro, ey, `${q.prompt} = ?`, {
        fontFamily: TEMA.fonte,
        fontSize: toque ? "36px" : "40px",
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
    if (this.modoToque) {
      this.desenharOpcoesToque(opcoes);
      return;
    }
    // Em telas altas os cartões descem junto (sobra mais espaço entre a conta e
    // eles); em telas estreitas encolhem para nunca encostarem uns nos outros.
    const { width: W, height: H } = this.scale;
    const passo = Math.min(180, (W - 40) / 3);
    const L = Math.min(150, Math.floor(passo - 14));
    const A = 170;
    const y = 400 + Math.max(0, H - 600) * 0.55;
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

  // TELA DIVIDIDA (celular/tablet): um painel em cima (J2, de cabeça para baixo) e
  // outro embaixo (J1), cada um com os 3 botões de resposta lado a lado. Os dois
  // painéis mostram os mesmos números, na mesma ordem — a disputa continua justa —
  // e tocam ao mesmo tempo. Cada cartão lógico (this.cartoes[i]) guarda os dois
  // botões dessa opção.
  desenharOpcoesToque(opcoes) {
    const { W, painelW, painelH, cabecalhoH, folga } = this.geo;
    const A = painelH - cabecalhoH - folga * 2;
    const L = Math.min(260, Math.floor((painelW - 40) / 3));
    const gap = 12;
    this.cartoes = opcoes.map((valor) => ({ valor, L, A, toque: [] }));

    this.jogadores.forEach((jog, j) => {
      const pc = this.add.container(W / 2, this.yPainel(j));
      if (j === 1) pc.setAngle(180);
      this.grupo.add(pc);
      const y = -painelH / 2 + cabecalhoH + folga + A / 2;

      opcoes.forEach((valor, i) => {
        const c = this.add.container((i - 1) * (L + gap), y);
        const g = this.add.graphics();
        c.add(g);
        const num = this.add
          .text(0, 0, `${valor}`, { fontFamily: TEMA.fonte, fontSize: `${Math.min(52, Math.round(A * 0.5))}px`, color: "#ffffff", fontStyle: "bold" })
          .setOrigin(0.5);
        c.add(num);
        c.setSize(L, A);
        c.setInteractive({ useHandCursor: true });
        c.on("pointerdown", () => {
          this.tweens.add({ targets: c, scale: 0.94, duration: 70, yoyo: true });
          this.responder(j, i);
        });
        pc.add(c);
        const botao = { c, g, num, L, A, corBorda: jog.corNum };
        this.cartoes[i].toque[j] = botao;
        this.pintarBotaoToque(botao, jog.corNum);
      });
    });
  }

  pintarBotaoToque(b, cor, preenchimento = 0x1e293b) {
    b.g.clear();
    b.g.fillStyle(preenchimento, 1);
    b.g.fillRoundedRect(-b.L / 2, -b.A / 2, b.L, b.A, 18);
    b.g.lineStyle(5, cor, 1);
    b.g.strokeRoundedRect(-b.L / 2, -b.A / 2, b.L, b.A, 18);
  }

  pintarCartao(i, cor, preenchimento = 0x1e293b) {
    const k = this.cartoes[i];
    if (!k) return;
    if (k.toque) {
      // Tela dividida: repinta o botão dos dois jogadores. O acerto/resposta
      // aparece nos dois; a cor de cada botão volta ao normal na próxima rodada.
      k.toque.forEach((b) => this.pintarBotaoToque(b, cor, preenchimento));
      return;
    }
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
    this.contaTxt.setText(`${this.q.prompt} = ${this.q.quantidade}`).setColor("#2bff88");
    this.tweens.add({ targets: this.contaTxt, scale: 1.12, duration: 240, yoyo: true });

    // O robô do vencedor da rodada comemora.
    const robo = this.placar[jogador]?.robo;
    if (robo) this.tweens.add({ targets: robo, y: robo.y - (this.modoToque ? 6 : 18), duration: 180, yoyo: true, repeat: 1 });

    const msg = this.add
      .text(this.scale.width / 2, this.yMsg, `${jog.nome} marcou! 🎉`, {
        fontFamily: TEMA.fonte,
        fontSize: this.modoToque ? "20px" : "24px", // no celular não pode passar por cima das bolinhas do placar
        color: "#2bff88",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setScale(0);
    this.grupo.add(msg);
    this.tweens.add({ targets: msg, scale: 1, duration: 300, ease: "Back.easeOut" });
    anunciar(`${jog.nome} marcou. ${this.q.prompt} é ${this.q.quantidade}.`);

    // Item 1: tempo de exibição maior para dar para ler com calma, com a
    // opção de os jogadores confirmarem com Enter para seguir mais cedo.
    this.aguardarProximaRodada(2600);
  }

  errou(jogador, indice) {
    somErro();
    this.foraDaRodada[jogador] = true;
    const jog = this.jogadores[jogador];

    // O cartão errado treme; o jogador fica de fora só desta rodada.
    const k = this.cartoes[indice];
    const alvoTremer = k?.toque ? k.toque[jogador]?.c : k?.c; // na tela dividida treme só o botão de quem errou
    if (alvoTremer) this.tweens.add({ targets: alvoTremer, x: alvoTremer.x + 8, duration: 50, yoyo: true, repeat: 3 });
    const robo = this.placar[jogador]?.robo;
    if (robo) robo.setAlpha(0.45);

    // Os dois erraram: ninguém pontua, mostra a resposta e segue (não trava).
    if (this.foraDaRodada[0] && this.foraDaRodada[1]) {
      this.respondido = true;
      this.contaTxt.setText(`${this.q.prompt} = ${this.q.quantidade}`).setColor("#ffd43b");
      const certo = this.cartoes.findIndex((c) => c.valor === this.q.quantidade);
      if (certo >= 0) this.pintarCartao(certo, 0xffd43b);
      const msg = this.add
        .text(this.scale.width / 2, this.yMsg, "Essa era a resposta! Próxima… 🙂", {
          fontFamily: TEMA.fonte,
          fontSize: "20px",
          color: "#ffd43b",
        })
        .setOrigin(0.5);
      this.grupo.add(msg);
      this.aguardarProximaRodada(2800);
    } else {
      pling(0);
      anunciar(`${jog.nome} errou e espera a próxima rodada.`);
    }
  }

  // Espera "ms" antes da próxima rodada, mas deixa Enter encurtar a espera —
  // item 1 do relatório ("permitir que a próxima etapa seja iniciada... mediante
  // confirmação dos jogadores"). once() garante que só dispara uma vez.
  aguardarProximaRodada(ms) {
    let avancou = false;
    const seguir = () => {
      if (avancou) return;
      avancou = true;
      timer.remove();
      definirConfirmacaoBase(this, null); // este Enter já foi usado
      this.proximaRodada();
    };
    const timer = this.time.delayedCall(ms, seguir);
    definirConfirmacaoBase(this, seguir);
  }

  proximaRodada() {
    this.placar.forEach((p) => p.robo.setAlpha(1));
    // Alguém chegou na meta (5 pontos): acabou. Senão sorteia mais uma conta
    // (diferente da anterior) e a disputa continua, sem limite de rodadas.
    if (this.jogadores.some((j) => j.pontos >= this.meta)) {
      this.fim();
      return;
    }
    this.rodadaAtual++;
    let nova;
    let tentativas = 0;
    do {
      nova = gerarRodadasVersus(1, this.operacao)[0];
      tentativas++;
    } while (nova.prompt === this.q?.prompt && tentativas < 20);
    this.rodadas.push(nova);
    this.montarRodada();
  }

  fim() {
    this._acabou = true;
    if (this.grupo) this.grupo.destroy(true);
    const { width, height } = this.scale;
    // Esconde o placar da partida (robôs e bolinhas) para não aparecer por baixo
    // do resultado final, e escurece o resto da tela.
    this.placar.forEach((p) => {
      p.robo.setVisible(false);
      p.bolas.forEach((b) => b.setVisible(false));
    });
    this.paineis?.forEach((p) => p.setVisible(false));
    this.add.rectangle(0, 0, width, height, 0x000000, 0.9).setOrigin(0); // criado antes dos textos do resultado: ficam por cima
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

    if (this.modoToque) {
      criarBotao(this, width / 2 - 110, 480, "↻ De novo", () => this.scene.restart(), { largura: 190, altura: 56, fontSize: "20px", cor: 0x2bff88 });
      criarBotao(this, width / 2 + 110, 480, "Sair", () => this.sair(), { largura: 190, altura: 56, fontSize: "20px", cor: 0x334155 });
    } else {
      this.add
        .text(width / 2, 470, "Enter para jogar de novo  •  Esc para sair", {
          fontFamily: TEMA.fonte,
          fontSize: "18px",
          color: "#ffd8a8",
        })
        .setOrigin(0.5);
    }

    anunciar(empate ? "Empate!" : `${vencedor.nome} venceu por ${vencedor.pontos} pontos.`);
    definirConfirmacaoBase(this, () => this.scene.restart());
  }
}
