import Phaser from "phaser";
import BootScene from "./scenes/BootScene.js";
import HistoriaScene from "./scenes/HistoriaScene.js";
import EstacaoScene from "./scenes/EstacaoScene.js";
import ContagemScene from "./scenes/ContagemScene.js";
import SomaScene from "./scenes/SomaScene.js";
import SubtracaoScene from "./scenes/SubtracaoScene.js";
import MultiplicacaoScene from "./scenes/MultiplicacaoScene.js";
import DivisaoScene from "./scenes/DivisaoScene.js";

// Qual cena (puzzle) atende cada tipo de fase.
const CENA_POR_TIPO = {
  contagem: "ContagemScene",
  soma: "SomaScene",
  subtracao: "SubtracaoScene",
  multiplicacao: "MultiplicacaoScene",
  divisao: "DivisaoScene",
};

// Monta a configuração do Phaser. "Scale.FIT" faz o jogo se ajustar à tela
// (funciona no celular e dentro do iframe do Cruzeiro HUB).
//
// O "roteiro" é a lista de fases na ordem de jogo, cada uma ligada à sua cena.
// A EstacaoScene funciona como HUB (mapa da galáxia): apresenta cada planeta e,
// ao final, a celebração da nave totalmente recarregada.
export function criarConfig(parent, dados) {
  const fases = dados.fases || (dados.fase ? [dados.fase] : []);
  const roteiro = fases.map((f) => ({
    fase: f,
    cena: CENA_POR_TIPO[f.tipoPuzzle] || "ContagemScene",
  }));

  return {
    type: Phaser.AUTO,
    parent,
    width: 800,
    height: 600,
    backgroundColor: "#0b1120",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    // BootScene (carrega imagens) → HistoriaScene (abertura) → EstacaoScene
    // (hub/mapa) → fases (puzzles de matemática).
    scene: [
      BootScene,
      HistoriaScene,
      EstacaoScene,
      ContagemScene,
      SomaScene,
      SubtracaoScene,
      MultiplicacaoScene,
      DivisaoScene,
    ],
    callbacks: {
      preBoot: (game) => {
        game.registry.set("roteiro", roteiro);
        game.registry.set("indiceFase", 0);
        game.registry.set("jogador", dados.jogador);
        game.registry.set("onConcluir", dados.onConcluir);
        game.registry.set("assets", dados.assets || []);
      },
    },
  };
}
