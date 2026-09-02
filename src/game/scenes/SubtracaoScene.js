import { TEMA } from "../tema.js";
import { gerarRodadasSubtracao } from "../gerarRodadas.js";
import { falar } from "../../lib/fala.js";
import { somAcerto, somErro, pling } from "../../lib/sfx.js";
import FaseBase from "./FaseBase.js";

// Etapa 3 — "Encher as Baterias": todas as células acendem e ALGUMAS descarregam.
// A criança escolhe quantas continuam com carga. Só as carregadas voam ao robô.
export default class SubtracaoScene extends FaseBase {
  constructor() {
    super("SubtracaoScene");
  }

  create() {
    this.iniciarFase();
    const cfg = this.fase.gerar || {};
    this.rodadas = gerarRodadasSubtracao(cfg.rodadas ?? 3, cfg.min ?? 5, cfg.max ?? 12);
    this.montarRodada();
    falar(this.fase.enunciado);
  }

  // Cria uma célula de bateria (casca + carga) como container animável.
  criarCelula(x, y, cor) {
    const w = 34;
    const h = 46;
    const c = this.add.container(x, y);
    const casca = this.add.graphics();
    casca.fillStyle(0x0f172a, 1);
    casca.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
    casca.lineStyle(3, 0x64748b, 1);
    casca.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);
    c.add(casca);
    const carga = this.add.rectangle(0, 2, w - 10, h - 12, cor).setOrigin(0.5);
    c.add(carga);
    c.carga = carga;
    return c;
  }

  montarRodada() {
    if (this.grupo) this.grupo.destroy(true);
    this.grupo = this.add.container(0, 0);
    this.bloqueado = true; // trava curtinha enquanto as células descarregam

    const centro = this.desenharCabecalho();
    const rodada = this.rodadas[this.rodadaAtual];

    // Desenha as "a" células, em fileiras de até 6.
    const todas = [];
    const cols = Math.min(6, rodada.a);
    const passo = 48;
    const inicioX = centro - ((cols - 1) * passo) / 2;
    for (let i = 0; i < rodada.a; i++) {
      const col = i % 6;
      const row = Math.floor(i / 6);
      const x = inicioX + col * passo;
      const y = 190 + row * 66;
      const cor = TEMA.coresCristal[i % TEMA.coresCristal.length];
      const cel = this.criarCelula(x, y, cor);
      this.grupo.add(cel);
      todas.push(cel);
    }

    // As primeiras (a - b) ficam carregadas; as últimas b descarregam.
    this.itens = todas.slice(0, rodada.quantidade);
    const descarregar = todas.slice(rodada.quantidade);

    const conta = this.add
      .text(centro, 356, `${rodada.a} − ${rodada.b} = ?`, {
        fontFamily: TEMA.fonte,
        fontSize: "30px",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    this.grupo.add(conta);

    this.criarBotoesResposta(centro, rodada.opcoes, (num) => this.responder(num));

    // Descarga rápida (janela curta) e depois libera as respostas.
    this.time.delayedCall(450, () => {
      descarregar.forEach((cel, i) => {
        this.time.delayedCall(i * 55, () => {
          somErro();
          this.tweens.add({ targets: cel.carga, alpha: 0.12, scaleY: 0.25, duration: 240, ease: "Cubic.easeIn" });
        });
      });
      const espera = descarregar.length * 55 + 160;
      this.time.delayedCall(espera, () => {
        this.itens.forEach((c) => this.itemInterativo(c));
        this.bloqueado = false;
        falar(`${rodada.a} menos ${rodada.b}. Quantas células ainda têm carga?`);
      });
    });
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

  tentarDeNovo() {
    const r = this.rodadas[this.rodadaAtual];
    somErro();
    falar(`Quase! Conte só as células com carga: ${r.a} menos ${r.b}.`);
    this.itens.forEach((c, i) => {
      this.time.delayedCall(i * 200, () => {
        pling(i);
        this.tweens.add({ targets: c, scaleX: c.scaleX * 1.2, scaleY: c.scaleY * 1.2, duration: 160, yoyo: true });
      });
    });
  }
}
