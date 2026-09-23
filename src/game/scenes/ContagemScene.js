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
    const cfg = this.fase.gerar;
    this.rodadas = gerarRodadas(cfg.rodadas, cfg.min, cfg.max);
    this.montarRodada();
    falar(this.fase.enunciado);
  }

  montarRodada() {
    if (this.grupo) this.grupo.destroy(true);
    this.grupo = this.add.container(0, 0);
    this.bloqueado = false;
    this.erros = 0;

    const centro = this.desenharCabecalho();
    const rodada = this.rodadas[this.rodadaAtual];

    // Painel de fundo.
    const cols = Math.min(5, rodada.quantidade);
    const linhas = Math.ceil(rodada.quantidade / 5);
    const passo = 76;
    const largura = cols * passo + 40;
    const altura = linhas * 72 + 30;
    const topo = this.baseY + 62;
    const painel = this.add.graphics();
    painel.fillStyle(0x0f172a, 0.55);
    painel.lineStyle(3, 0x475569, 0.9);
    painel.fillRoundedRect(centro - largura / 2, topo - 40, largura, altura, 16);
    painel.strokeRoundedRect(centro - largura / 2, topo - 40, largura, altura, 16);
    this.grupo.add(painel);

    // Luzes acesas (a contar).
    this.itens = [];
    const inicioX = centro - ((cols - 1) * passo) / 2;
    for (let i = 0; i < rodada.quantidade; i++) {
      const col = i % 5;
      const row = Math.floor(i / 5);
      const x = inicioX + col * passo;
      const y = topo + row * 72;
      const cor = TEMA.coresCristal[i % TEMA.coresCristal.length];
      const luz = desenharLuz(this, x, y, cor, true, 22);
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

  // Dica VISUAL: conta as luzes uma a uma, mostrando o número saltar sobre
  // cada uma (ensina a contar sem precisar ler nada).
  darDica() {
    falar("Conte comigo!");
    this.itens.forEach((c, i) => {
      this.time.delayedCall(i * 320, () => {
        pling(i);
        this.tweens.add({ targets: c, scale: (c.scale || 1) * 1.4, duration: 200, yoyo: true });
        const num = this.add
          .text(c.x, c.y - 36, String(i + 1), {
            fontFamily: TEMA.fonte,
            fontSize: "30px",
            color: "#ffe000",
            fontStyle: "bold",
          })
          .setOrigin(0.5);
        num.setStroke("#0b1120", 4);
        this.grupo.add(num);
        this.tweens.add({ targets: num, y: num.y - 12, alpha: 0, duration: 800, delay: 260, onComplete: () => num.destroy() });
      });
    });
  }
}
