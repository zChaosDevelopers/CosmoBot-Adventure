import { TEMA } from "../tema.js";
import { desenharLuz } from "../desenho.js";
import { gerarRodadas } from "../gerarRodadas.js";
import { falar } from "../../lib/fala.js";
import { somAcerto, pling } from "../../lib/sfx.js";
import FaseBase from "./FaseBase.js";

// Etapa 1 — "Ligar o Painel": conte as LUZES acesas do painel e escolha o número.
// Rodadas SEMPRE aleatórias (3 a 12). Ao acertar, as luzes voam para o robô.
export default class ContagemScene extends FaseBase {
  constructor() {
    super("ContagemScene");
  }

  create() {
    this.iniciarFase();
    this.mostrarInstrucoes(() => {
      const cfg = this.fase.gerar;
      this.rodadas = gerarRodadas(cfg.rodadas, cfg.min, cfg.max);
      this.montarRodada();
      falar(this.fase.enunciado);
    });
  }

  // A "conta" desta fase é a própria contagem: o que se procura é o total.
  textoOperacao() {
    return this.rodadas?.[this.rodadaAtual] ? "Total = ?" : null;
  }

  montarRodada() {
    if (this.grupo) this.grupo.destroy(true);
    this.grupo = this.add.container(0, 0);
    this.bloqueado = false;
    this.erros = 0;

    const centro = this.desenharCabecalho();
    const rodada = this.rodadas[this.rodadaAtual];

    // Painel de fundo — a grade se ADAPTA ao espaço livre entre o cabeçalho e as
    // respostas: poucas luzes ficam folgadas, muitas (até 12+) ganham mais colunas
    // e linhas mais juntas, mas nunca passam por baixo dos botões.
    const total = rodada.quantidade;
    const livre = this.alturaLivre(rodada.opcoes.length);
    const larguraMax = this.scale.width - 90; // mesma folga lateral do restante da tela
    let passoX = 76;
    // Colunas: o mínimo que mantém a grade baixa o bastante para o espaço livre.
    let cols = Math.min(5, total);
    const maxCols = Math.max(3, Math.floor((larguraMax - 40) / 60));
    while (Math.ceil(total / cols) * 56 + 26 > livre && cols < Math.min(maxCols, total)) cols++;
    passoX = Math.min(76, (larguraMax - 40) / cols);
    const linhas = Math.ceil(total / cols);
    const passoY = Math.min(72, Math.max(46, (livre - 26) / linhas));
    const raio = Math.min(22, Math.floor(passoY * 0.34));
    const largura = cols * passoX + 40;
    const altura = linhas * passoY + 26;
    // Centraliza a grade na folga vertical disponível (um pouco mais perto do topo).
    const topoPainel = this.baseY + Math.max(2, (livre - altura) * 0.35);
    const painel = this.add.graphics();
    painel.fillStyle(0x0f172a, 0.55);
    painel.lineStyle(3, 0x475569, 0.9);
    painel.fillRoundedRect(centro - largura / 2, topoPainel, largura, altura, 16);
    painel.strokeRoundedRect(centro - largura / 2, topoPainel, largura, altura, 16);
    painel.caixaAbs = { x0: centro - largura / 2, y0: topoPainel, x1: centro + largura / 2, y1: topoPainel + altura };
    this.grupo.add(painel);

    // Luzes acesas (a contar).
    this.itens = [];
    const passo = passoX;
    const inicioX = centro - ((cols - 1) * passo) / 2;
    for (let i = 0; i < total; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = inicioX + col * passo;
      const y = topoPainel + 13 + passoY / 2 + row * passoY;
      const cor = TEMA.coresCristal[i % TEMA.coresCristal.length];
      const luz = desenharLuz(this, x, y, cor, true, raio);
      this.grupo.add(luz);
      this.itemInterativo(luz);
      this.itens.push(luz);
    }

    this.criarBotoesResposta(centro, rodada.opcoes, (num) => this.responder(num));

    // Aparece só depois que os balões estouram.
    this.criarBotaoDica(() => this.darDica());
  }

  responder(escolha) {
    const rodada = this.rodadas[this.rodadaAtual];
    if (escolha === rodada.quantidade) this.acertou();
    else this.tentarDeNovo();
  }

  acertou() {
    this.bloqueado = true;
    this.botoes.forEach((b) => b.disableInteractive());
    somAcerto();
    this.revelarOperacao(this.rodadas[this.rodadaAtual].quantidade);
    // Feedback do PORQUÊ: o número contado salta bem grande (reforça "eram N").
    const total = this.rodadas[this.rodadaAtual].quantidade;
    const num = this.add
      .text(this.scale.width / 2, this.scale.height * 0.42, `${total}`, {
        fontFamily: TEMA.fonte,
        fontSize: this.fs("64px"),
        color: "#ffe000",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setScale(0);
    num.setStroke("#0b1120", 6);
    this.grupo.add(num);
    this.tweens.add({ targets: num, scale: 1.15, duration: 300, ease: "Back.easeOut" });
    this.tweens.add({ targets: num, y: num.y - 30, alpha: 0, delay: 500, duration: 500, onComplete: () => num.destroy() });
    this.time.delayedCall(700, () => this.animarColeta(this.itens, () => this.aposAcerto()));
  }

  aposAcerto() {
    this.rodadaAtual++;
    if (this.rodadaAtual >= this.rodadas.length) {
      this.time.delayedCall(400, () => this.concluirEtapa(this.fase.tarefaOk));
    } else {
      this.time.delayedCall(400, () => this.montarRodada());
    }
  }

  // Errou: as luzes incham; no 3º erro estouram e vem outra conta (mais fácil).
  tentarDeNovo() {
    this.registrarErro(this.itens, () => this.gerarUmaRodada(true));
  }

  // "facil" (após estourar) reduz a quantidade máxima — adapta para quem erra.
  gerarUmaRodada(facil) {
    const c = this.fase.gerar;
    const max = facil ? Math.max(c.min, Math.round(c.max * 0.6)) : c.max;
    return gerarRodadas(1, c.min, max)[0];
  }

  // Dica VISUAL que ENSINA o método sem entregar a resposta: pulsa uma luz por
  // vez (mostra "conte um a um") e no fim aponta para os botões — NÃO mostra o
  // número final; a criança conta junto e escolhe.
  darDica() {
    if (this.bloqueado || this.pausado) return;
    falar("Conte comigo, uma de cada vez!");
    this.itens.forEach((c, i) => {
      this.agendarDica(i * 340, () => {
        pling(i);
        this.pulsar(c, 1.4, 220);
      });
    });
  }
}
