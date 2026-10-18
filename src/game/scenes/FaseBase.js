import Phaser from "phaser";
import { TEMA } from "../tema.js";
import { desenharFundo, criarBotao, criarPersonagem, desenharTiraNave } from "../desenho.js";
import { lerAcessibilidade, px, ICONE_OPERACAO } from "../acessibilidade.js";
import { falar } from "../../lib/fala.js";
import { anunciar } from "../../lib/anunciar.js";
import { pling, somVitoria, somErro, somEstouro } from "../../lib/sfx.js";
import { podeAgir } from "../teclado.js";
import { calcularNivel, resumirBadges, NIVEL_NOME } from "../badges.js";
import { chaveJogador, registrarJogador, atualizarPontuacao } from "../../lib/ranking.js";

// Base compartilhada por todas as etapas de conserto da nave (painel, comporta,
// baterias, motores, rota). Cada etapa concreta só precisa: chamar iniciarFase(),
// gerar suas rodadas, implementar montarRodada() e usar os helpers daqui.
export default class FaseBase extends Phaser.Scene {
  // Lê os dados do "roteiro" (lista de etapas) e prepara o cenário.
  iniciarFase() {
    this.jogador = this.registry.get("jogador") || {};
    this.onConcluir = this.registry.get("onConcluir");
    this.roteiro = this.registry.get("roteiro") || [];
    this.indiceFase = this.registry.get("indiceFase") || 0;
    this.fase = this.roteiro[this.indiceFase]?.fase || {};
    this.totalFases = this.roteiro.length;

    this.rodadaAtual = 0;
    this.coletados = 0;
    this.bloqueado = false;
    this.erros = 0; // erros na pergunta ATUAL (zera a cada pergunta)
    this.errosEtapa = 0; // erros na etapa INTEIRA (para as estrelas)
    this.mostrarDica = false; // vira true depois que os balões estouram

    // Acessibilidade dentro do jogo: contraste alto e fonte grande.
    this.a11y = lerAcessibilidade();
    this.fs = (t) => px(t, this.a11y.escala); // escala tamanhos de fonte

    // Cronômetro da fase (item 13): mede o tempo para calcular o BRILHO da badge
    // (mais rápido + sem erros = badge mais reluzente). Usa relógio real (não
    // depende do loop de animação).
    this.faseInicioMs = Date.now();

    desenharFundo(this);
    this.criarTiraNave();
    this.criarRelogio();
    this.configurarTeclado();
  }

  // Relógio discreto no canto (conta o tempo da fase). Fica FORA do grupo das
  // rodadas para não sumir a cada desafio.
  criarRelogio() {
    this.relogioTxt = this.add
      .text(46, 22, "⏱ 0s", { fontFamily: TEMA.fonte, fontSize: this.fs("15px"), color: "#94a3b8" })
      .setOrigin(0.5);
    this.relogioEvento = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (!this.relogioTxt) return;
        const s = Math.floor((Date.now() - this.faseInicioMs) / 1000);
        this.relogioTxt.setText(`⏱ ${s}s`);
      },
    });
  }

  // ===== Tira da nave no topo: mostra o robô avançando pelas etapas =====
  criarTiraNave() {
    const etapas = this.roteiro.map((r) => ({ emoji: r.fase.emoji || "🔧", cor: r.fase.cor || "#ffd43b" }));
    const estrelas = this.registry.get("estrelasPorEtapa") || {};
    this.tira = desenharTiraNave(this, etapas, this.indiceFase, { y: 24, estrelas });
    this.alvoNave = this.tira.alvoAtual || { x: this.scale.width / 2, y: 24 };
  }

  // ===== Cabeçalho (etapa + rodada + enunciado). =====
  // Desenha um bloco de topo bem espaçado e define `this.baseY`: a linha a partir
  // da qual cada fase deve começar a desenhar seu conteúdo (com folga garantida,
  // sem "colar" no texto — mesmo quando o enunciado quebra em duas linhas).
  // Retorna o X central por compatibilidade com as cenas.
  desenharCabecalho() {
    const centro = this.scale.width / 2;

    // Linha 1 (âmbar): etapa e módulo.
    const etapa = this.add
      .text(
        centro,
        56,
        `Etapa ${this.indiceFase + 1} de ${this.totalFases}  •  ${this.fase.modulo}`,
        { fontFamily: TEMA.fonte, fontSize: this.fs("18px"), color: "#ffd8a8" }
      )
      .setOrigin(0.5);
    this.grupo.add(etapa);

    // Linha 2 (discreta): em qual desafio da etapa a criança está. No contraste
    // alto o cinza vira branco (fica legível no fundo preto).
    const rod = this.add
      .text(centro, 80, `Desafio ${this.rodadaAtual + 1} de ${this.rodadas.length}`, {
        fontFamily: TEMA.fonte,
        fontSize: this.fs("14px"),
        color: this.a11y.contraste ? "#ffffff" : "#94a3b8",
      })
      .setOrigin(0.5);
    this.grupo.add(rod);

    // Enunciado: a ÚNICA instrução em destaque, com o ÍCONE da operação na
    // frente (pista visual para quem ainda não lê). Origem no topo (0.5, 0)
    // para medir a altura real e ancorar o conteúdo.
    const icone = ICONE_OPERACAO[this.fase.tipoPuzzle] || "";
    const enunciado = this.add
      .text(centro, 108, `${icone}  ${this.fase.enunciado}`, {
        fontFamily: TEMA.fonte,
        fontSize: this.fs("21px"),
        color: "#ffffff",
        align: "center",
        fontStyle: "bold",
        lineSpacing: 4,
        wordWrap: { width: this.scale.width - 140 },
      })
      .setOrigin(0.5, 0);
    this.grupo.add(enunciado);

    // Conteúdo da fase começa 30px abaixo do fim do enunciado.
    this.baseY = Math.round(enunciado.y + enunciado.height + 30);

    // Leitor de tela: anuncia a tarefa da rodada (o <canvas> não é lido sozinho).
    anunciar(`${this.fase.modulo}. ${this.fase.enunciado}`);

    return centro;
  }

  // ===== Item interativo (com "plim" ao passar o mouse) =====
  itemInterativo(cr) {
    if (cr.type === "Container") {
      cr.setSize(56, 56);
      cr.setInteractive(new Phaser.Geom.Rectangle(-28, -28, 56, 56), Phaser.Geom.Rectangle.Contains);
      if (cr.input) cr.input.cursor = "pointer";
    } else if (cr.setInteractive) {
      cr.setInteractive({ useHandCursor: true });
    }
    cr.on("pointerover", () => {
      if (cr._pop) return;
      cr._pop = true;
      const sx = cr.scaleX;
      const sy = cr.scaleY;
      this.tweens.add({
        targets: cr,
        scaleX: sx * 1.15,
        scaleY: sy * 1.15,
        duration: 110,
        yoyo: true,
        onComplete: () => {
          cr.setScale(sx, sy);
          cr._pop = false;
        },
      });
    });
    return cr;
  }

  // ===== Botões de resposta (mouse, toque e teclado) =====
  criarBotoesResposta(centro, opcoes, aoResponder) {
    this.botoes = [];
    this.aoResponder = aoResponder;
    const total = opcoes.length;
    // Com 5 alternativas os botões ficam um pouco menores para caber bem.
    const muitos = total >= 5;
    const L = muitos ? 108 : 130;
    const A = muitos ? 96 : 110;
    const tamFonte = this.fs(muitos ? "40px" : "50px");
    const passo = Math.min(muitos ? 150 : 165, (this.scale.width - 40) / total);
    opcoes.forEach((num, idx) => {
      const bx = centro + (idx - (total - 1) / 2) * passo;
      const by = this.scale.height - 72;
      const cor = TEMA.coresBotao[idx % TEMA.coresBotao.length];
      const b = criarBotao(this, bx, by, `${num}`, () => this.escolher(num), { cor, largura: L, altura: A, fontSize: tamFonte });
      b.valor = num;
      b.on("pointerover", () => this.setFoco(idx));
      this.grupo.add(b);
      this.botoes.push(b);
    });
    this.focoIndex = 0;
    this.atualizarFoco();
  }

  // Uma única porta de entrada para a resposta (mouse/toque/teclado).
  escolher(num) {
    if (this.bloqueado) return;
    this.aoResponder?.(num);
  }

  // ===== Animação: os itens contados "voam" para o robô na tira da nave =====
  animarColeta(itens, aoFim) {
    const alvoX = this.alvoNave.x;
    const alvoY = this.alvoNave.y;
    const lista = itens.filter(Boolean);
    if (!lista.length) {
      aoFim?.();
      return;
    }
    const ultimo = lista.length - 1;
    lista.forEach((item, i) => {
      item.disableInteractive?.();
      this.tweens.killTweensOf(item);
      this.tweens.add({
        targets: item,
        x: alvoX,
        y: alvoY,
        scale: 0.2,
        alpha: 0.4,
        duration: 340,
        delay: i * 70,
        ease: "Cubic.easeIn",
        onComplete: () => {
          item.destroy();
          pling(i);
          if (this.tira) this.tweens.add({ targets: this.tira, scale: 1.04, duration: 70, yoyo: true });
          if (i === ultimo) {
            this.comemorar(alvoX, alvoY); // festa de confete ao acertar
            aoFim?.();
          }
        },
      });
    });
  }

  // Pequena explosão de confete/estrelinhas coloridas — comemora o acerto.
  comemorar(x, y) {
    const cores = TEMA.coresCristal;
    for (let k = 0; k < 12; k++) {
      const c = this.add.circle(x, y, Phaser.Math.Between(3, 6), cores[k % cores.length], 1);
      const ang = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.Between(50, 110);
      this.tweens.add({
        targets: c,
        x: x + Math.cos(ang) * dist,
        y: y + Math.sin(ang) * dist,
        alpha: 0,
        scale: 0.3,
        duration: Phaser.Math.Between(500, 850),
        ease: "Cubic.easeOut",
        onComplete: () => c.destroy(),
      });
    }
  }

  // ===== Timer da rodada (fases de arraste) =====
  // Barra que encolhe; ao zerar (~12s), troca por uma conta nova (mais fácil),
  // sem punir. Verde → amarelo → vermelho conforme o tempo acaba.
  iniciarTimerRodada(segundos = 12) {
    this.pararTimerRodada();
    if (!this.grupo) return;
    const w = this.scale.width - 60;
    const x = this.scale.width / 2;
    const y = this.scale.height - 8;
    this._timerTrilho = this.add.rectangle(x, y, w, 8, 0x1e293b, 0.85).setOrigin(0.5);
    const barra = this.add.rectangle(x - w / 2, y, w, 8, 0x2bff88, 1).setOrigin(0, 0.5);
    this.grupo.add(this._timerTrilho);
    this.grupo.add(barra);
    this._timerBarra = barra;
    this._timerTween = this.tweens.add({
      targets: barra,
      scaleX: 0,
      duration: segundos * 1000,
      ease: "Linear",
      onUpdate: () => {
        if (!barra.active) return;
        const p = barra.scaleX;
        barra.fillColor = p > 0.5 ? 0x2bff88 : p > 0.25 ? 0xffd43b : 0xff3b5c;
      },
      onComplete: () => {
        if (!barra.active || this.bloqueado || typeof this.gerarUmaRodada !== "function") return;
        this.erros = 0;
        this.rodadas[this.rodadaAtual] = this.gerarUmaRodada(true); // nova conta, mais fácil
        falar("Acabou o tempo! Vamos de novo.");
        anunciar("Acabou o tempo. Vamos tentar outra conta.");
        this.time.delayedCall(80, () => this.montarRodada());
      },
    });
  }

  pararTimerRodada() {
    if (this._timerTween) {
      this._timerTween.remove();
      this._timerTween = null;
    }
    if (this._timerBarra) {
      this._timerBarra.destroy();
      this._timerBarra = null;
    }
    if (this._timerTrilho) {
      this._timerTrilho.destroy();
      this._timerTrilho = null;
    }
  }

  temProxima() {
    return this.indiceFase + 1 < this.totalFases;
  }

  // ===== Fim da etapa: comemora e vai para a próxima estação da nave =====
  concluirEtapa(mensagem) {
    this.bloqueado = true;
    this.onConcluir?.({ faseId: this.fase.id, status: "concluida" });

    // Para o cronômetro da fase e mede o tempo total (para o brilho da badge).
    if (this.relogioEvento) { this.relogioEvento.remove(); this.relogioEvento = null; }
    if (this.relogioTxt) { this.relogioTxt.destroy(); this.relogioTxt = null; }
    const tempoFase = Date.now() - this.faseInicioMs;

    const { width, height } = this.scale;
    if (this.grupo) this.grupo.destroy(true);

    this.add.rectangle(0, 0, width, height, 0x000000, 0.68).setOrigin(0);
    somVitoria();
    this.cameras.main.flash(400, 250, 220, 120);

    const robo = criarPersonagem(this, width / 2, height / 2 - 84, this.jogador.avatar, 100);
    this.tweens.add({ targets: robo, y: robo.y - 16, duration: 800, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    // ===== Estrelas da etapa (recompensa) =====
    // 3 estrelas se acertou sem erros; 2 até 2 erros; 1 se precisou de mais.
    const estrelas = this.errosEtapa === 0 ? 3 : this.errosEtapa <= 2 ? 2 : 1;
    // Guarda por etapa (para mostrar na tira da nave) e recalcula o total.
    const mapa = this.registry.get("estrelasPorEtapa") || {};
    mapa[this.indiceFase] = estrelas;
    this.registry.set("estrelasPorEtapa", mapa);
    this.registry.set("estrelas", Object.values(mapa).reduce((a, b) => a + b, 0));
    for (let i = 0; i < 3; i++) {
      const est = this.add
        .text(width / 2 + (i - 1) * 54, height / 2 - 6, i < estrelas ? "⭐" : "☆", {
          fontFamily: TEMA.fonte,
          fontSize: this.fs("44px"),
          color: i < estrelas ? "#ffe000" : "#64748b",
        })
        .setOrigin(0.5)
        .setScale(0);
      this.tweens.add({ targets: est, scale: 1, duration: 420, delay: 220 + i * 160, ease: "Back.easeOut" });
      if (i < estrelas) this.time.delayedCall(220 + i * 160, () => pling(i + 2));
    }

    // ===== BADGE da fase: nível de brilho por RAPIDEZ + ACERTOS (item 13) =====
    const nivel = calcularNivel(this.errosEtapa, tempoFase, this.rodadas?.length || 3);
    const badges = this.registry.get("badges") || {};
    badges[this.indiceFase] = { nivel, estrelas, tempo: tempoFase };
    this.registry.set("badges", badges);
    // Ranking LOCAL (localStorage): guarda o MELHOR resultado do jogador.
    const resumo = resumirBadges(badges, this.totalFases);
    registrarJogador(this.jogador.apelido, this.jogador.avatar);
    atualizarPontuacao(chaveJogador(this.jogador.apelido, this.jogador.avatar), {
      pontos: resumo.pontos,
      estrelas: resumo.estrelas,
      badges: resumo.total,
      perfeito: resumo.perfeito,
    });
    this.mostrarBadgeConquista(width / 2, height / 2 - 150, this.indiceFase, nivel);

    this.add
      .text(width / 2, height / 2 + 54, mensagem || `${this.fase.emoji || "✅"} Etapa concluída!`, {
        fontFamily: TEMA.fonte,
        fontSize: this.fs("32px"),
        color: "#ffffff",
        align: "center",
        wordWrap: { width: width - 100 },
      })
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        height / 2 + 104,
        this.temProxima() ? "O CosmoBot avança na nave..." : "A nave está quase pronta para decolar...",
        { fontFamily: TEMA.fonte, fontSize: this.fs("18px"), color: "#ffd43b", align: "center", wordWrap: { width: width - 100 } }
      )
      .setOrigin(0.5);

    falar(mensagem || "Etapa concluída! Muito bem!");
    anunciar(`${mensagem || "Etapa concluída!"} Você ganhou ${estrelas} de 3 estrelas.`);
    this.time.delayedCall(2200, () => this.avancarFase());
  }

  // Mostra a insígnia conquistada na tela de conclusão, com brilho conforme o
  // nível (mais reluzente quanto mais rápido e sem erros). Usa a arte se existir.
  mostrarBadgeConquista(x, y, idx, nivel) {
    const chave = `badge-${idx + 1}`;
    const glow = this.add.circle(x, y, 62, TEMA.foco, 0.1 + nivel * 0.05);
    this.tweens.add({ targets: glow, scale: 1.5, alpha: 0.04, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    let base = 1;
    let badge;
    if (this.textures.exists(chave)) {
      badge = this.add.image(x, y, chave);
      base = badge.width ? 112 / badge.width : 1;
    } else {
      badge = this.add.text(x, y, this.fase.emoji || "🏅", { fontFamily: TEMA.fonte, fontSize: this.fs("70px") }).setOrigin(0.5);
    }
    badge.setScale(0);
    this.tweens.add({ targets: badge, scale: base, duration: 500, delay: 200, ease: "Back.easeOut" });

    // Nível máximo (holográfica): faíscas girando em volta.
    if (nivel >= 4) {
      for (let k = 0; k < 6; k++) {
        const ang = (k / 6) * Math.PI * 2;
        const s = this.add
          .text(x + Math.cos(ang) * 68, y + Math.sin(ang) * 68, "✨", { fontFamily: TEMA.fonte, fontSize: "20px" })
          .setOrigin(0.5)
          .setScale(0);
        this.tweens.add({ targets: s, scale: 1, duration: 320, delay: 600 + k * 80, yoyo: true, repeat: -1 });
      }
    }

    this.add
      .text(x, y + 66, NIVEL_NOME[nivel] || "", { fontFamily: TEMA.fonte, fontSize: this.fs("14px"), color: "#ffd8a8" })
      .setOrigin(0.5);
  }

  avancarFase() {
    // Volta ao MAPA de fases (a conclusão já foi registrada em estrelasPorEtapa,
    // que libera a próxima). O jogador escolhe a próxima fase por lá.
    this.scene.start("SelecaoFasesScene");
  }

  // ===== Acessibilidade (teclado) =====
  configurarTeclado() {
    this.input.keyboard.on("keydown-RIGHT", () => this.moverFoco(1));
    this.input.keyboard.on("keydown-LEFT", () => this.moverFoco(-1));
    this.input.keyboard.on("keydown-ENTER", (e) => this.ativarFoco(e));
    this.input.keyboard.on("keydown-SPACE", (e) => this.ativarFoco(e));
    // Tecla H = Dica (acessível por teclado; só depois que a dica aparece).
    this.input.keyboard.on("keydown-H", () => {
      if (this.mostrarDica && this.darDica) this.darDica();
    });
  }

  // Confirma a opção em foco. Passa por podeAgir(): ignora auto-repetição e o
  // "spam" de Enter (inclusive o herdado da tela anterior), que fazia o jogo
  // responder/pular fases sozinho.
  ativarFoco(evento) {
    if (this.bloqueado || !podeAgir(this, evento)) return;
    const alvo = this.botoes?.[this.focoIndex];
    if (alvo) {
      alvo.apertar?.();
      this.escolher(alvo.valor);
    }
  }

  moverFoco(dir) {
    if (!this.botoes?.length) return;
    this.focoIndex = Phaser.Math.Wrap(this.focoIndex + dir, 0, this.botoes.length);
    this.atualizarFoco();
  }

  setFoco(idx) {
    this.focoIndex = idx;
    this.atualizarFoco();
  }

  atualizarFoco() {
    this.botoes.forEach((b, i) => b.setFoco(i === this.focoIndex));
  }

  // ===== Suporte a ARRASTAR itens (fases manipulativas) =====
  // Liga os eventos de arraste UMA vez por cena. Cada fase define
  // this.aoSoltarItem(objeto, pointer) para decidir onde o item cai.
  prepararArraste() {
    if (this._arrastePronto) return;
    this._arrastePronto = true;
    this.input.on("dragstart", (p, obj) => {
      obj._escala = obj.scale;
      obj.setScale(obj.scale * 1.2);
      this.children.bringToTop(obj);
    });
    this.input.on("drag", (p, obj, dx, dy) => {
      obj.x = dx;
      obj.y = dy;
    });
    this.input.on("dragend", (p, obj) => {
      obj.setScale(obj._escala ?? 1);
      this.aoSoltarItem?.(obj, p);
    });
  }

  // Retorna a zona (retângulo {x, y (centro), w, h}) que contém o ponto, ou null.
  zonaNoPonto(zonas, px, py) {
    return (
      zonas.find(
        (z) => px >= z.x - z.w / 2 && px <= z.x + z.w / 2 && py >= z.y - z.h / 2 && py <= z.y + z.h / 2
      ) || null
    );
  }

  // ===== Erro → as bolinhas incham → no 5º erro ESTOURAM e vem outra conta =====
  // Cada erro deixa as bolinhas maiores. Ao chegar no limite (5), elas estouram
  // e a pergunta é trocada. Retorna true se estourou (a cena deve parar aí).
  registrarErro(bolinhas, gerarNova, textoBreve) {
    this.erros = (this.erros || 0) + 1;
    this.errosEtapa = (this.errosEtapa || 0) + 1;
    const lista = (bolinhas || []).filter(Boolean);
    if (this.erros >= this.LIMITE_ERROS) {
      this.estourarBaloes(lista, () => this.resetarPergunta(gerarNova));
      return true;
    }
    somErro();
    if (textoBreve && this.dica) this.dica.setText(textoBreve);
    const fator = 1 + this.erros * 0.22; // cada erro, um pouco maior
    lista.forEach((b) => {
      this.tweens.killTweensOf(b);
      this.tweens.add({ targets: b, scale: fator, duration: 180, ease: "Back.easeOut" });
    });
    return false;
  }

  // Estoura as bolinhas com "pop" e estilhaços, depois chama aoFim.
  estourarBaloes(lista, aoFim) {
    this.bloqueado = true;
    somEstouro();
    if (this.dica) this.dica.setText("");
    const alvos = (lista || []).filter(Boolean);
    if (!alvos.length) {
      aoFim?.();
      return;
    }
    const ultimo = alvos.length - 1;
    alvos.forEach((b, i) => {
      b.disableInteractive?.();
      this.tweens.killTweensOf(b);
      this.tweens.add({
        targets: b,
        scale: 2.6,
        duration: 140,
        ease: "Quad.easeOut",
        onComplete: () => {
          const cor = b.fillColor ?? 0xffffff;
          for (let k = 0; k < 4; k++) {
            const frag = this.add.circle(b.x, b.y, 4, cor, 0.9);
            const ang = Phaser.Math.FloatBetween(0, Math.PI * 2);
            this.tweens.add({
              targets: frag,
              x: b.x + Math.cos(ang) * 42,
              y: b.y + Math.sin(ang) * 42,
              alpha: 0,
              scale: 0.2,
              duration: 320,
              onComplete: () => frag.destroy(),
            });
          }
          b.destroy();
          if (i === ultimo) this.time.delayedCall(300, () => aoFim?.());
        },
      });
    });
  }

  // Troca a pergunta (nova conta), zera os erros e liga o botão de dica.
  resetarPergunta(gerarNova) {
    this.erros = 0;
    this.mostrarDica = true;
    if (typeof gerarNova === "function" && this.rodadas) {
      this.rodadas[this.rodadaAtual] = gerarNova();
    }
    falar("Vamos tentar outra!");
    anunciar("Os balões estouraram. Vamos tentar outra conta mais fácil!");
    this.time.delayedCall(120, () => this.montarRodada());
  }

  // Botão de DICA (aparece só depois que os balões estouraram). É só um ÍCONE
  // de lâmpada (💡) com um brilho pulsante — nada de texto para ler.
  criarBotaoDica(aoClicar) {
    if (!this.mostrarDica) return null;
    const x = 70;
    const y = this.scale.height - 46;
    // Brilho pulsante atrás, para a criança perceber que ali tem ajuda.
    const glow = this.add.circle(x, y, 32, 0x00c2ff, 0.4);
    this.grupo.add(glow);
    this.tweens.add({
      targets: glow,
      scale: 1.6,
      alpha: 0.08,
      duration: 850,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    const b = criarBotao(this, x, y, "💡", () => aoClicar?.(), {
      largura: 60,
      altura: 58,
      fontSize: "30px",
      cor: 0x00c2ff,
    });
    this.grupo.add(b);
    return b;
  }

  // Mãozinha que "pula" apontando para um ponto — dica 100% visual.
  apontar(x, y, vezes = 4) {
    const mao = this.add
      .text(x, y - 24, "👇", { fontFamily: TEMA.fonte, fontSize: "38px" })
      .setOrigin(0.5, 1);
    this.grupo?.add(mao);
    this.tweens.add({
      targets: mao,
      y: mao.y + 12,
      duration: 420,
      yoyo: true,
      repeat: vezes,
      ease: "Sine.easeInOut",
      onComplete: () => mao.destroy(),
    });
    return mao;
  }
}

// A conta troca (e a dica aparece) depois de 3 erros na mesma pergunta.
FaseBase.prototype.LIMITE_ERROS = 3;
