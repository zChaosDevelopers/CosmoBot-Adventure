import { TEMA } from "../tema.js";
import { desenharLuz } from "../desenho.js";
import { gerarRodadas } from "../gerarRodadas.js";
import { falar } from "../../lib/fala.js";
import { somAcerto, somErro, pling } from "../../lib/sfx.js";
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
    this.animarColeta(this.itens, () => this.aposAcerto());
  }

  aposAcerto() {
    this.rodadaAtual++;
    if (this.rodadaAtual >= this.rodadas.length) {
      this.time.delayedCall(400, () => this.concluirEtapa(this.fase.tarefaOk));
    } else {
      this.time.delayedCall(400, () => this.montarRodada());
    }
  }

  // Sem punição: convida a contar de novo, destacando as luzes.
  tentarDeNovo() {
    somErro();
    falar("Quase! Vamos contar as luzes juntos.");
    this.itens.forEach((c, i) => {
      this.time.delayedCall(i * 240, () => {
        pling(i);
        this.tweens.add({ targets: c, scaleX: c.scaleX * 1.25, scaleY: c.scaleY * 1.25, duration: 160, yoyo: true });
      });
    });
  }
}
