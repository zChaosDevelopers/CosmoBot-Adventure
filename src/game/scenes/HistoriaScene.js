import Phaser from "phaser";
import { TEMA } from "../tema.js";
import { desenharFundo, criarBotao, criarPersonagem } from "../desenho.js";
import { falar } from "../../lib/fala.js";
import { pling } from "../../lib/sfx.js";

// Abertura da aventura: conta a historinha do CosmoBot antes do primeiro
// planeta. Mostrada uma vez, quando o jogo começa (BootScene → HistoriaScene).
const HISTORIA = [
  "O CosmoBot é um robô explorador que adora viajar pelo espaço.",
  "Uma chuva de meteoros deixou a nave dele sem energia!",
  "Para voltar para casa, ele precisa consertar a nave em 5 etapas.",
  "Cada etapa tem um desafio de matemática. Vamos ajudar o CosmoBot?",
];

export default class HistoriaScene extends Phaser.Scene {
  constructor() {
    super("HistoriaScene");
  }

  create() {
    const { width, height } = this.scale;
    this.jogador = this.registry.get("jogador") || {};
    const avatar = this.jogador.avatar || "#51cf66";
    const apelido = this.jogador.apelido || "Explorador";

    desenharFundo(this);

    // CosmoBot flutuando lá em cima.
    const robo = criarPersonagem(this, width / 2, 150, avatar, 120);
    this.tweens.add({
      targets: robo,
      y: robo.y - 16,
      duration: 1300,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.add
      .text(width / 2, 258, "Aventuras do CosmoBot", {
        fontFamily: TEMA.fonte,
        fontSize: "34px",
        color: "#ffd8a8",
      })
      .setOrigin(0.5);

    // Painel da história.
    const painel = this.add.graphics();
    painel.fillStyle(0x0b1120, 0.55);
    painel.lineStyle(2, TEMA.foco, 0.4);
    painel.fillRoundedRect(width / 2 - 320, 300, 640, 168, 18);
    painel.strokeRoundedRect(width / 2 - 320, 300, 640, 168, 18);

    const texto = this.add
      .text(width / 2, 384, HISTORIA.join("\n\n"), {
        fontFamily: TEMA.fonte,
        fontSize: "20px",
        color: "#ffffff",
        align: "center",
        lineSpacing: 6,
        wordWrap: { width: 600 },
      })
      .setOrigin(0.5);
    texto.setAlpha(0);
    this.tweens.add({ targets: texto, alpha: 1, duration: 700 });

    // Botão de começar.
    const botao = criarBotao(
      this,
      width / 2,
      height - 66,
      "Começar aventura ▶",
      () => this.comecar(),
      { largura: 340, altura: 66, fontSize: "26px" }
    );
    botao.setFoco(true);

    const irComecar = () => this.comecar();
    this.input.keyboard.on("keydown-ENTER", irComecar);
    this.input.keyboard.on("keydown-SPACE", irComecar);

    pling(0);
    falar(`Olá, ${apelido}! ${HISTORIA.join(" ")}`);
  }

  comecar() {
    this.registry.set("indiceFase", 0);
    this.scene.start("EstacaoScene");
  }
}
