import Phaser from "phaser";

// Cena inicial: carrega apenas as imagens que o JogoCanvas confirmou existir
// (lista no registry). Assim não há erros 404 e o boot é síncrono/robusto.
// As imagens que faltarem usam o desenho procedural.
export default class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    const base = import.meta.env.BASE_URL;
    const disponiveis = this.registry.get("assets") || [];
    disponiveis.forEach((a) => this.load.image(a.chave, `${base}${a.arquivo}`));
  }

  create() {
    // Modo 2 jogadores vai direto para a disputa; a aventura começa pela
    // abertura (historinha do CosmoBot) e depois vai ao mapa.
    if (this.registry.get("modo") === "versus") {
      this.scene.start("VersusScene");
      return;
    }
    this.scene.start("HistoriaScene");
  }
}
