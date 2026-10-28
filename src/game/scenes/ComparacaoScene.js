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
    this.mostrarInstrucoes(() => {
      const cfg = this.fase.gerar || {};
      this.rodadas = gerarRodadasComparacao(cfg.rodadas ?? 4, cfg.max ?? 9);
      this.montarRodada();
      falar(this.fase.enunciado);
    });
  }

  // Aqui a incógnita é o SINAL, não o resultado: "4 ? 6".
  textoOperacao() {
    const r = this.rodadas?.[this.rodadaAtual];
    return r ? `${r.a}  ?  ${r.b}` : null;
  }

  montarRodada() {
    if (this.grupo) this.grupo.destroy(true);
    this.grupo = this.add.container(0, 0);
    this.bloqueado = false;
    this.erros = 0;

    const centro = this.desenharCabecalho();
    const rodada = this.rodadas[this.rodadaAtual];
    this.rodada = rodada;

    // Com o painel da conta no topo, o conteúdo desce ~70px. Os painéis foram
    // compactados na mesma medida para os números de baixo não ficarem
    // escondidos atrás dos botões de resposta.
    // A altura dos painéis se ajusta ao espaço livre (entre o cabeçalho e os
    // botões de sinal) — o número embaixo de cada painel nunca encosta nos botões.
    const livre = this.alturaLivre(rodada.opcoes.length);
    const painelH = Math.max(112, Math.min(170, livre - 56));
    const sobra = Math.max(0, livre - (painelH + 52));
    const cy = this.baseY + painelH / 2 + 4 + sobra * 0.3;
    const desloc = Math.min(150, (this.scale.width - 230) / 2); // painéis lado a lado, sempre dentro da tela
    this.ladoEsq = this.desenharLado(centro - desloc, cy, rodada.a, painelH);
    this.ladoDir = this.desenharLado(centro + desloc, cy, rodada.b, painelH);
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
  desenharLado(cx, cy, n, painelH = 170) {
    const meio = painelH / 2;
    const painel = this.add.graphics();
    painel.fillStyle(0x0f172a, 0.5);
    painel.lineStyle(3, 0x475569, 0.9);
    painel.fillRoundedRect(cx - 95, cy - meio, 190, painelH, 16);
    painel.strokeRoundedRect(cx - 95, cy - meio, 190, painelH, 16);
    painel.caixaAbs = { x0: cx - 95, y0: cy - meio, x1: cx + 95, y1: cy + meio };
    this.grupo.add(painel);

    const dots = [];
    const cols = 3;
    const linhas = Math.ceil(n / cols);
    // Bolinhas menores/mais juntas se o painel é baixo; nunca saem do painel.
    const passo = Math.min(44, Math.max(30, (painelH - 40) / Math.max(1, linhas)));
    const raio = Math.min(17, Math.floor(passo * 0.42));
    const colsUsadas = Math.min(cols, n);
    const startX = cx - ((colsUsadas - 1) * passo) / 2;
    const startY = cy - ((linhas - 1) * passo) / 2;
    for (let i = 0; i < n; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cor = TEMA.coresCristal[i % TEMA.coresCristal.length];
      const d = this.add.circle(startX + col * passo, startY + row * passo, raio, cor);
      d.setStrokeStyle(3, 0xffffff, 0.5);
      this.grupo.add(d);
      dots.push(d);
    }
    const num = this.add
      .text(cx, cy + meio + 26, `${n}`, {
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
    this.revelarOperacao(sinal); // no painel, "4 ? 6" vira "4 < 6"

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

    // A conta completa ("5 > 3") já aparece em verde no painel do topo e o "?"
    // virou o sinal: não há mais texto extra sobre os botões de resposta.
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
  // Dica que ENSINA sem entregar a resposta: conta um lado e depois o outro,
  // para a criança comparar sozinha — NÃO destaca qual é o maior.
  darDica() {
    if (this.bloqueado || this.pausado) return;
    falar("Conte os dois lados e veja qual tem mais!");
    const esq = this.ladoEsq.dots;
    const dir = this.ladoDir.dots;
    esq.forEach((d, i) => {
      this.agendarDica(i * 180, () => {
        pling(i);
        this.pulsar(d, 1.4, 160);
      });
    });
    const off = esq.length * 180 + 350;
    dir.forEach((d, i) => {
      this.agendarDica(off + i * 180, () => {
        pling(i);
        this.pulsar(d, 1.4, 160);
      });
    });
  }
}
