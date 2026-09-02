import Phaser from "phaser";
import { TEMA } from "./tema.js";

// Clareia/escurece uma cor (fator > 1 clareia, < 1 escurece).
function ajustar(cor, fator) {
  const c = Phaser.Display.Color.IntegerToColor(cor);
  const r = Phaser.Math.Clamp(Math.round(c.red * fator), 0, 255);
  const g = Phaser.Math.Clamp(Math.round(c.green * fator), 0, 255);
  const b = Phaser.Math.Clamp(Math.round(c.blue * fator), 0, 255);
  return Phaser.Display.Color.GetColor(r, g, b);
}

// Converte "#ff6b6b" (ou número) para número de cor do Phaser.
function corParaNumero(cor) {
  if (typeof cor === "number") return cor;
  if (typeof cor === "string") {
    const hex = cor.replace("#", "");
    if (/^[0-9a-f]{6}$/i.test(hex)) return parseInt(hex, 16);
  }
  return 0x51cf66; // verde padrão
}

// Fundo: usa a imagem "fundo" se existir; senão, desenha um espaço COLORIDO
// (gradiente, nebulosas rosa/ciano/roxo e estrelas). Planetas do Kenney entram
// como enfeite se disponíveis.
export function desenharFundo(scene) {
  const { width, height } = scene.scale;

  if (scene.textures.exists("fundo")) {
    scene.add.image(width / 2, height / 2, "fundo").setDisplaySize(width, height);
    return;
  }

  const g = scene.add.graphics();
  g.fillGradientStyle(TEMA.fundoTopo, TEMA.fundoDir, TEMA.fundoEsq, TEMA.fundoBaixo, 1);
  g.fillRect(0, 0, width, height);

  g.fillStyle(0xf783ac, 0.14);
  g.fillCircle(width * 0.22, height * 0.28, 180);
  g.fillStyle(0x22d3ee, 0.12);
  g.fillCircle(width * 0.8, height * 0.24, 200);
  g.fillStyle(0xcc5de8, 0.1);
  g.fillCircle(width * 0.6, height * 0.78, 220);

  const coresEstrela = [0xffffff, 0xffd43b, 0x99e9f2, 0xffa8a8];
  for (let i = 0; i < 80; i++) {
    const s = scene.add.circle(
      Phaser.Math.Between(0, width),
      Phaser.Math.Between(0, height),
      Phaser.Math.Between(1, 2),
      coresEstrela[i % coresEstrela.length],
      Phaser.Math.FloatBetween(0.4, 0.95)
    );
    scene.tweens.add({
      targets: s,
      alpha: 0.15,
      duration: Phaser.Math.Between(900, 2200),
      yoyo: true,
      repeat: -1,
    });
  }

  if (scene.textures.exists("planeta")) {
    const p = scene.add.image(width - 90, 100, "planeta").setScale(1.1).setAlpha(0.9);
    scene.tweens.add({ targets: p, y: p.y + 12, duration: 3500, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }
  if (scene.textures.exists("lua")) {
    const l = scene.add.image(80, height - 90, "lua").setScale(0.7).setAlpha(0.85);
    scene.tweens.add({ targets: l, y: l.y - 10, duration: 4200, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }
}

// Cristal: usa a imagem "cristal" se existir; senão, desenha um cristal
// facetado e brilhante na cor indicada. Retorna um objeto animável.
export function desenharCristal(scene, x, y, escala = 1, cor = TEMA.coresCristal[0]) {
  if (scene.textures.exists("cristal")) {
    const img = scene.add.image(x, y, "cristal");
    const alvo = 60 * escala;
    if (img.width) img.setScale(alvo / img.width);
    scene.tweens.add({ targets: img, y: y - 8, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    return img;
  }

  const claro = ajustar(cor, 1.5);
  const escuro = ajustar(cor, 0.7);
  const c = scene.add.container(x, y);

  const glow = scene.add.ellipse(0, 0, 58, 82, cor, 0.3);
  scene.tweens.add({ targets: glow, scaleX: 1.25, scaleY: 1.25, alpha: 0.12, duration: 1000, yoyo: true, repeat: -1 });
  c.add(glow);

  const P = (px, py) => new Phaser.Geom.Point(px, py);
  const g = scene.add.graphics();
  g.fillStyle(cor, 1);
  g.fillPoints([P(0, -30), P(17, -8), P(12, 24), P(0, 32), P(-12, 24), P(-17, -8)], true);
  g.fillStyle(claro, 1);
  g.fillPoints([P(0, -30), P(0, 32), P(-12, 24), P(-17, -8)], true);
  g.fillStyle(escuro, 1);
  g.fillPoints([P(0, -30), P(17, -8), P(12, 24), P(0, 32)], true);
  g.fillStyle(0xffffff, 0.75);
  g.fillPoints([P(0, -30), P(7, -15), P(-7, -15)], true);
  c.add(g);

  c.setScale(escala);
  scene.tweens.add({ targets: c, y: y - 8, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  return c;
}

// Robô fofo desenhado (personagem), na cor escolhida pelo jogador.
export function desenharRobo(scene, x, y, cor, altura = 110) {
  const corNum = corParaNumero(cor);
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();

  // Antena
  g.lineStyle(5, 0x94a3b8, 1);
  g.lineBetween(0, -52, 0, -66);
  g.fillStyle(TEMA.foco, 1);
  g.fillCircle(0, -70, 7);

  // Orelhas
  g.fillStyle(ajustar(corNum, 0.8), 1);
  g.fillRoundedRect(-54, -22, 12, 30, 6);
  g.fillRoundedRect(42, -22, 12, 30, 6);

  // Corpo/cabeça
  g.fillStyle(corNum, 1);
  g.fillRoundedRect(-45, -52, 90, 100, 24);

  // Tela do rosto
  g.fillStyle(0x1e293b, 1);
  g.fillRoundedRect(-34, -40, 68, 46, 14);

  // Olhos
  g.fillStyle(0xffffff, 1);
  g.fillCircle(-13, -17, 8);
  g.fillCircle(13, -17, 8);
  g.fillStyle(0x0b1120, 1);
  g.fillCircle(-11, -15, 4);
  g.fillCircle(15, -15, 4);

  // Sorriso
  g.lineStyle(4, TEMA.foco, 1);
  g.beginPath();
  g.arc(0, -6, 11, Phaser.Math.DegToRad(25), Phaser.Math.DegToRad(155));
  g.strokePath();

  // Painel da barriga
  g.fillStyle(ajustar(corNum, 1.3), 1);
  g.fillRoundedRect(-26, 14, 52, 26, 10);
  g.fillStyle(TEMA.foco, 0.9);
  g.fillCircle(-12, 27, 4);
  g.fillCircle(0, 27, 4);
  g.fillCircle(12, 27, 4);

  c.add(g);
  c.setScale(altura / 120);
  return c;
}

// Personagem: usa a imagem "robo" se existir; senão, desenha o robô fofo.
export function criarPersonagem(scene, x, y, cor, altura = 110) {
  if (scene.textures.exists("robo")) {
    const img = scene.add.image(x, y, "robo");
    if (img.height) img.setScale(altura / img.height);
    return img;
  }
  return desenharRobo(scene, x, y, cor, altura);
}

// Botão grande, colorido e RESPONSIVO. opts: { cor, largura, altura, fontSize }.
// Retorna um container com setFoco(true/false).
//
// IMPORTANTE (confiabilidade do clique): o container EXTERNO "c" é o objeto
// interativo e NUNCA é escalado — assim a área de clique fica sempre estável.
// O efeito de "apertar" acontece num container interno "visual", que pode
// encolher sem afetar o hit-test. Isso evita cliques que "falham".
export function criarBotao(scene, x, y, rotulo, aoClicar, opts = {}) {
  const L = opts.largura || 130;
  const A = opts.altura || 110;
  const tamFonte = opts.fontSize || "50px";
  const cor = opts.cor ?? TEMA.coresBotao[0];
  const corClara = ajustar(cor, 1.3);

  const c = scene.add.container(x, y);
  const visual = scene.add.container(0, 0);
  const g = scene.add.graphics();

  const desenhar = (destaque) => {
    g.clear();
    g.fillStyle(destaque ? corClara : cor, 1);
    g.fillRoundedRect(-L / 2, -A / 2, L, A, 26);
    g.lineStyle(7, destaque ? TEMA.foco : ajustar(cor, 0.7), 1);
    g.strokeRoundedRect(-L / 2, -A / 2, L, A, 26);
  };
  desenhar(false);
  visual.add(g);

  const t = scene.add
    .text(0, 0, rotulo, { fontFamily: TEMA.fonte, fontSize: tamFonte, color: "#ffffff" })
    .setOrigin(0.5);
  t.setShadow(0, 3, "rgba(0,0,0,0.35)", 4);
  visual.add(t);
  c.add(visual);

  // Área de clique generosa (um pouco maior que o botão) e SEMPRE fixa.
  c.setSize(L, A);
  const margem = 8;
  c.setInteractive(
    new Phaser.Geom.Rectangle(-L / 2 - margem, -A / 2 - margem, L + margem * 2, A + margem * 2),
    Phaser.Geom.Rectangle.Contains
  );
  if (c.input) c.input.cursor = "pointer";

  const apertar = () => {
    scene.tweens.killTweensOf(visual);
    visual.setScale(1);
    scene.tweens.add({ targets: visual, scaleX: 0.9, scaleY: 0.9, duration: 80, yoyo: true });
  };

  c.on("pointerover", () => desenhar(true));
  c.on("pointerout", () => desenhar(false));
  // Feedback no toque; ação no soltar (pointerup) — comportamento clássico de
  // clique, mais tolerante a pequenos movimentos do dedo/mouse.
  c.on("pointerdown", () => apertar());
  c.on("pointerup", () => aoClicar());

  c.setFoco = (f) => desenhar(f);
  c.apertar = apertar;
  return c;
}

// ===== Robozinho "mini" (ícone) para a tira de progresso da nave =====
export function desenharRoboMini(scene, x, y, cor = "#ffd43b", tamanho = 28) {
  const corNum = corParaNumero(cor);
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  g.fillStyle(0xffd43b, 1);
  g.fillCircle(0, -18, 3); // antena
  g.lineStyle(2, 0x94a3b8, 1);
  g.lineBetween(0, -15, 0, -11);
  g.fillStyle(corNum, 1);
  g.fillRoundedRect(-12, -11, 24, 24, 7); // corpo
  g.fillStyle(0x1e293b, 1);
  g.fillRoundedRect(-8, -7, 16, 11, 4); // visor
  g.fillStyle(0xffffff, 1);
  g.fillCircle(-3, -1, 2.2);
  g.fillCircle(3, -1, 2.2);
  c.add(g);
  c.setScale(tamanho / 28);
  return c;
}

// ===== Tira de progresso da nave (mostra o robô avançando pelas etapas) =====
// etapas: [{emoji, cor}], idx = etapa atual. O robozinho fica sobre a etapa atual;
// as concluídas ficam acesas com "✓". Retorna o container (fica no topo da cena).
export function desenharTiraNave(scene, etapas, idx, opts = {}) {
  const larguraTela = scene.scale.width;
  const y = opts.y ?? 22;
  const total = etapas.length;
  const espaco = Math.min(opts.espaco || 108, (larguraTela - 120) / total);
  const inicio = larguraTela / 2 - ((total - 1) * espaco) / 2;
  const cont = scene.add.container(0, 0);
  cont.alvoAtual = { x: inicio + Math.min(idx, total - 1) * espaco, y };

  for (let i = 0; i < total; i++) {
    const x = inicio + i * espaco;
    const e = etapas[i];
    const cor = corParaNumero(e.cor);
    const feito = i < idx;
    const atual = i === idx;

    if (i > 0) {
      const linha = scene.add.graphics();
      linha.lineStyle(4, i <= idx ? TEMA.foco : 0x334155, i <= idx ? 0.85 : 0.4);
      linha.lineBetween(inicio + (i - 1) * espaco + 20, y, x - 20, y);
      cont.add(linha);
    }

    const anel = scene.add.circle(x, y, 18, feito || atual ? cor : 0x1e293b, 1);
    anel.setStrokeStyle(3, atual ? TEMA.foco : 0x0b1120, 1);
    cont.add(anel);

    if (atual) {
      // O robozinho fica SOBRE a estação atual (marca onde o CosmoBot está).
      const robo = desenharRoboMini(scene, x, y, "#0b1120", 26);
      cont.add(robo);
      scene.tweens.add({ targets: anel, scale: 1.18, duration: 700, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    } else {
      const ic = scene.add
        .text(x, y, feito ? "✓" : e.emoji, {
          fontFamily: TEMA.fonte,
          fontSize: feito ? "18px" : "17px",
          color: feito ? "#0b1120" : "#ffffff",
        })
        .setOrigin(0.5);
      cont.add(ic);
    }
  }
  return cont;
}

// ===== Caixa/compartimento (usado em soma, divisão) =====
// Desenha uma "caixa" arredondada translúcida na cor dada. Retorna nada — é só
// cenário. Use antes de posicionar os itens dentro dela.
export function desenharCaixa(scene, x, y, w, h, cor, rotulo) {
  const cn = corParaNumero(cor);
  const g = scene.add.graphics();
  g.fillStyle(cn, 0.12);
  g.lineStyle(3, cn, 0.7);
  g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 12);
  g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 12);
  const c = scene.add.container(0, 0);
  c.add(g);
  if (rotulo) {
    const t = scene.add
      .text(x, y - h / 2 - 14, rotulo, { fontFamily: TEMA.fonte, fontSize: "16px", color: "#e2e8f0" })
      .setOrigin(0.5);
    c.add(t);
  }
  return c;
}

// ===== Luz de painel (círculo) — acesa ou apagada =====
export function desenharLuz(scene, x, y, cor, acesa = true, raio = 20) {
  const cn = corParaNumero(cor);
  const c = scene.add.container(x, y);
  if (acesa) {
    const glow = scene.add.circle(0, 0, raio * 1.5, cn, 0.22);
    scene.tweens.add({ targets: glow, scale: 1.2, alpha: 0.1, duration: 1000, yoyo: true, repeat: -1 });
    c.add(glow);
  }
  const base = scene.add.circle(0, 0, raio, acesa ? cn : 0x243044, 1);
  base.setStrokeStyle(3, acesa ? ajustar(cn, 1.4) : 0x334155, 1);
  c.add(base);
  if (acesa) {
    const brilho = scene.add.circle(-raio * 0.3, -raio * 0.3, raio * 0.32, 0xffffff, 0.8);
    c.add(brilho);
  }
  c.acesa = acesa;
  return c;
}

// ===== Célula de bateria (retângulo vertical) — carregada ou vazia =====
export function desenharCelula(scene, x, y, cor, cheia = true, w = 34, h = 46) {
  const cn = corParaNumero(cor);
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  g.fillStyle(0x0f172a, 1);
  g.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
  g.lineStyle(3, cheia ? ajustar(cn, 1.3) : 0x475569, 1);
  g.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);
  if (cheia) {
    g.fillStyle(cn, 1);
    g.fillRoundedRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 4);
    g.fillStyle(0xffffff, 0.35);
    g.fillRoundedRect(-w / 2 + 4, -h / 2 + 4, w - 8, (h - 8) * 0.35, 4);
  }
  c.add(g);
  c.cheia = cheia;
  return c;
}
