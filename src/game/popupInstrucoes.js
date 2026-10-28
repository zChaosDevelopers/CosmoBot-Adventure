import { TEMA } from "./tema.js";
import { criarBotao } from "./desenho.js";
import { falar } from "../lib/fala.js";
import { anunciar } from "../lib/anunciar.js";
import { empilharConfirmacao } from "./teclado.js";

// Pop-up de instruções (item 9 do relatório de QA): mostrado ANTES de liberar
// o desafio, explicando de forma curta como jogar. Compartilhado entre as
// fases manipuláveis/de opção (FaseBase) e o modo 2 jogadores (VersusScene),
// que não compartilham uma classe base.
//
// opts: { titulo, icone, linhas: string[], corBotao, aoFechar }
// Retorna o container (para quem quiser destruir cedo, se precisar).
export function mostrarPopupInstrucoes(scene, opts = {}) {
  const { width, height } = scene.scale;
  const fs = scene.fs || ((t) => t);
  const linhas = opts.linhas && opts.linhas.length ? opts.linhas : ["Toque, arraste ou use as setas para jogar."];
  const texto = linhas.join("\n\n");

  const camada = scene.add.container(0, 0).setDepth(2000);

  const fundo = scene.add.rectangle(0, 0, width, height, 0x000000, 0.74).setOrigin(0).setInteractive();
  camada.add(fundo);

  const painelW = Math.min(560, width - 48);
  const cx = width / 2;
  const cy = height / 2;

  // Os textos são criados primeiro para MEDIR a altura real e só então desenhar o
  // painel: ele cresce (ou o texto diminui) conforme a largura da tela, e o botão
  // nunca fica por cima das frases.
  const titulo = scene.add
    .text(cx, 0, `${opts.icone || "🚀"}  ${opts.titulo || "Como jogar"}`, {
      fontFamily: TEMA.fonte,
      fontSize: fs("24px"),
      color: "#ffd8a8",
      fontStyle: "bold",
      align: "center",
      wordWrap: { width: painelW - 60 },
    })
    .setOrigin(0.5);
  const corpo = scene.add
    .text(cx, 0, texto, {
      fontFamily: TEMA.fonte,
      fontSize: fs("19px"),
      color: "#ffffff",
      align: "center",
      lineSpacing: 8,
      wordWrap: { width: painelW - 70 },
    })
    .setOrigin(0.5);
  const BOTAO_H = 56;
  const altNecessaria = () => 24 + titulo.height + 18 + corpo.height + 24 + BOTAO_H + 26;
  const maxH = height - 32;
  // Texto grande demais para a tela: reduz a letra até caber.
  let tam = 19;
  while (altNecessaria() > maxH && tam > 13) {
    tam -= 1;
    corpo.setFontSize(`${tam}px`);
    corpo.setLineSpacing(Math.max(2, tam - 11));
  }
  const painelH = Math.min(maxH, Math.max(280, altNecessaria()));
  const topo = cy - painelH / 2;
  titulo.setY(topo + 24 + titulo.height / 2);
  corpo.setY(topo + 24 + titulo.height + 18 + corpo.height / 2);
  const botaoY = topo + painelH - 26 - BOTAO_H / 2;

  const g = scene.add.graphics();
  g.fillStyle(0x0b1120, 0.98);
  g.fillRoundedRect(cx - painelW / 2, topo, painelW, painelH, 22);
  g.lineStyle(5, TEMA.foco, 1);
  g.strokeRoundedRect(cx - painelW / 2, topo, painelW, painelH, 22);
  camada.add(g);
  camada.add(titulo); // o painel entra antes: os textos ficam por cima dele
  camada.add(corpo);

  // Fecha UMA vez só (por tecla ou por mouse) e tira a camada de Enter da pilha.
  // Sem isso, fechar com o mouse deixava um "Enter fantasma" pendurado que, no
  // próximo Enter do jogo, chamava aoFechar() de novo e recomeçava a fase.
  let fechado = false;
  let soltarEnter = null;
  const fechar = () => {
    if (fechado) return;
    fechado = true;
    soltarEnter?.();
    camada.destroy(true);
    opts.aoFechar?.();
  };

  const botao = criarBotao(scene, cx, botaoY, "Entendi, jogar ▶", fechar, {
    largura: Math.min(270, painelW - 40),
    altura: BOTAO_H,
    fontSize: fs("21px"),
    cor: opts.corBotao ?? 0x2bff88,
  });
  camada.add(botao);
  botao.setFoco(true);

  // Enter/Espaço também fecham (sem exigir mira no botão). Enquanto o pop-up está
  // aberto, só ele recebe o Enter: nada por baixo reage junto.
  soltarEnter = empilharConfirmacao(scene, fechar);

  falar(texto);
  anunciar(`${opts.titulo || "Instruções"}. ${texto}`);

  return camada;
}
