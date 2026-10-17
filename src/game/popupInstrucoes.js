import { TEMA } from "./tema.js";
import { criarBotao } from "./desenho.js";
import { falar } from "../lib/fala.js";
import { anunciar } from "../lib/anunciar.js";

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
  const painelH = Math.min(380, height - 48);
  const cx = width / 2;
  const cy = height / 2;

  const g = scene.add.graphics();
  g.fillStyle(0x0b1120, 0.98);
  g.fillRoundedRect(cx - painelW / 2, cy - painelH / 2, painelW, painelH, 22);
  g.lineStyle(5, TEMA.foco, 1);
  g.strokeRoundedRect(cx - painelW / 2, cy - painelH / 2, painelW, painelH, 22);
  camada.add(g);

  const titulo = scene.add
    .text(cx, cy - painelH / 2 + 38, `${opts.icone || "🚀"}  ${opts.titulo || "Como jogar"}`, {
      fontFamily: TEMA.fonte,
      fontSize: fs("24px"),
      color: "#ffd8a8",
      fontStyle: "bold",
      align: "center",
      wordWrap: { width: painelW - 60 },
    })
    .setOrigin(0.5);
  camada.add(titulo);

  const corpo = scene.add
    .text(cx, cy - 6, texto, {
      fontFamily: TEMA.fonte,
      fontSize: fs("19px"),
      color: "#ffffff",
      align: "center",
      lineSpacing: 8,
      wordWrap: { width: painelW - 70 },
    })
    .setOrigin(0.5);
  camada.add(corpo);

  const fechar = () => {
    camada.destroy(true);
    opts.aoFechar?.();
  };

  const botao = criarBotao(scene, cx, cy + painelH / 2 - 46, "Entendi, jogar ▶", fechar, {
    largura: 270,
    altura: 56,
    fontSize: fs("21px"),
    cor: opts.corBotao ?? 0x2bff88,
  });
  camada.add(botao);
  botao.setFoco(true);

  // Enter/Espaço também fecham (sem exigir mira no botão).
  const teclaFechar = (e) => {
    e?.stopPropagation?.();
    fechar();
  };
  scene.input.keyboard.off("keydown-ENTER", teclaFechar);
  scene.input.keyboard.off("keydown-SPACE", teclaFechar);
  scene.input.keyboard.once("keydown-ENTER", teclaFechar);
  scene.input.keyboard.once("keydown-SPACE", teclaFechar);

  falar(texto);
  anunciar(`${opts.titulo || "Instruções"}. ${texto}`);

  return camada;
}
