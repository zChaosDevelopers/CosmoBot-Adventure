import { TEMA } from "../tema.js";
import { gerarRodadasComparacao } from "../gerarRodadas.js";
import { falar } from "../../lib/fala.js";
import { somAcerto, pling } from "../../lib/sfx.js";
import FaseBase from "./FaseBase.js";

// Etapa 6 — "Alinhar os Sensores": COMPARAÇÃO (>, <, =).
// Mostra dois painéis com quantidades de cristais e a criança toca no SINAL
// certo. No acerto, o lado MAIOR pulsa (ou os dois, se iguais) e a conta salta —
// feedback VISUAL do porquê. Reaproveita quase tudo de FaseBase (os "botões de
// resposta" viram os sinais >, <, =).
export default class ComparacaoScene extends FaseBase {
  constructor() {
    super("ComparacaoScene");
  }

  create() {
    this.iniciarFase();
    const cfg = this.fase.gerar || {};
    this.rodadas = gerarRodadasComparacao(cfg.rodadas ?? 4, cfg.max ?? 9);
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
    this.rodada = rodada;

    const cy = this.baseY + 140;
    this.ladoEsq = this.desenharLado(centro - 150, cy, rodada.a);
    this.ladoDir = this.desenharLado(centro + 150, cy, rodada.b);
    this.itens = [...this.ladoEsq.dots, ...this.ladoDir.dots];

    // Caixa do sinal (no meio): um "?" que vira o sinal escolhido no acerto.
    this.sinalBox = this.add
      .text(centro, cy, "?", {
        fontFamily: TEMA.fonte,
        fontSize: this.fs("56px"),
        color: "#ffe000",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.sinalBox.setStroke("#0b1120", 6);
    this.grupo.add(this.sinalBox);

    // Botões = os três sinais. Reaproveita toda a mecânica (toque/teclado/foco).
    this.criarBotoesResposta(centro, rodada.opcoes, (sinal) => this.responder(sinal));

    this.criarBotaoDica(() => this.darDica());
  }

  // Desenha um painel com N bolinhas + o número embaixo. Retorna {dots, x, y}.
  desenharLado(cx, cy, n) {
    const painel = this.add.graphics();
    painel.fillStyle(0x0f172a, 0.5);
    painel.lineStyle(3, 0x475569, 0.9);
    painel.fillRoundedRect(cx - 95, cy - 105, 190, 210, 16);
    painel.strokeRoundedRect(cx - 95, cy - 105, 190, 210, 16);
    this.grupo.add(painel);

    const dots = [];
    const cols = 3;
    const passo = 44;
    const linhas = Math.ceil(n / cols);
    const colsUsadas = Math.min(cols, n);
    const startX = cx - ((colsUsadas - 1) * passo) / 2;
    const startY = cy - 20 - ((linhas - 1) * passo) / 2;
    for (let i = 0; i < n; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cor = TEMA.coresCristal[i % TEMA.coresCristal.length];
      const d = this.add.circle(startX + col * passo, startY + row * passo, 17, cor);
      d.setStrokeStyle(3, 0xffffff, 0.5);
      this.grupo.add(d);
      dots.push(d);
    }
    const num = this.add
      .text(cx, cy + 122, `${n}`, {
        fontFamily: TEMA.fonte,
        fontSize: this.fs("40px"),
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    num.setStroke("#0b1120", 5);
    this.grupo.add(num);
    return { dots, x: cx, y: cy };
  }

  responder(sinal) {
    if (sinal === this.rodada.correta) this.acertou(sinal);
    else this.tentarDeNovo();
  }

  acertou(sinal) {
    this.bloqueado = true;
    this.botoes.forEach((b) => b.disableInteractive());
    this.pararTimerRodada?.();
    somAcerto();

    // O "?" vira o sinal certo e salta (a criança vê a conta montada).
    this.sinalBox.setText(sinal).setColor("#2bff88");
    this.tweens.add({ targets: this.sinalBox, scale: 1.5, duration: 300, yoyo: true, ease: "Back.easeOut" });

    // Porquê VISUAL: o lado MAIOR pulsa (os dois, se iguais).
    const r = this.rodada;
    let destaque = [];
    if (r.a > r.b) destaque = this.ladoEsq.dots;
    else if (r.a < r.b) destaque = this.ladoDir.dots;
    else destaque = this.itens;
    destaque.forEach((d, i) => {
      this.time.delayedCall(i * 60, () => {
        pling(i);
        this.tweens.add({ targets: d, scale: 1.5, duration: 200, yoyo: true, ease: "Sine.easeInOut" });
      });
    });

    // A conta completa salta embaixo (ex.: "5 > 3").
    const msg = this.add
      .text(this.scale.width / 2, this.scale.height - 118, `${r.a} ${sinal} ${r.b} 🎉`, {
        fontFamily: TEMA.fonte,
        fontSize: this.fs("30px"),
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setScale(0);
    msg.setStroke("#0b1120", 5);
    this.grupo.add(msg);
    this.tweens.add({ targets: msg, scale: 1, duration: 420, delay: 200, ease: "Back.easeOut" });

    falar(this.narracao(sinal));
    this.time.delayedCall(1200, () => this.animarColeta(this.itens, () => this.aposAcerto()));
  }

  narracao(sinal) {
    const r = this.rodada;
    if (sinal === ">") return `Isso! ${r.a} é maior que ${r.b}.`;
    if (sinal === "<") return `Isso! ${r.a} é menor que ${r.b}.`;
    return `Isso! ${r.a} é igual a ${r.b}.`;
  }

  aposAcerto() {
    this.rodadaAtual++;
    if (this.rodadaAtual >= this.rodadas.length) {
      this.time.delayedCall(300, () => this.concluirEtapa(this.fase.tarefaOk));
    } else {
      this.time.delayedCall(300, () => this.montarRodada());
    }
  }

  tentarDeNovo() {
    this.registrarErro(this.itens, () => this.gerarUmaRodada(true));
  }

  gerarUmaRodada(facil) {
    const c = this.fase.gerar || {};
    return gerarRodadasComparacao(1, facil ? Math.min(5, c.max ?? 9) : c.max ?? 9)[0];
  }

  // Dica VISUAL: conta as bolinhas do lado maior, uma a uma.
  darDica() {
    const r = this.rodada;
    const lado = r.a >= r.b ? this.ladoEsq.dots : this.ladoDir.dots;
    falar("Veja qual lado tem mais!");
    lado.forEach((d, i) => {
      this.time.delayedCall(i * 200, () => {
        pling(i);
        this.tweens.add({ targets: d, scale: 1.4, duration: 180, yoyo: true });
      });
    });
  }
}
