import Phaser from "phaser";
import { TEMA } from "../tema.js";
import { desenharFundo, criarBotao, criarPersonagem, desenharTiraNave } from "../desenho.js";
import { lerAcessibilidade, px, ICONE_OPERACAO } from "../acessibilidade.js";
import { falar, pararFala } from "../../lib/fala.js";
import { anunciar } from "../../lib/anunciar.js";
import { pling, somVitoria, somErro, somEstouro } from "../../lib/sfx.js";
import { iniciarConfirmacao, definirConfirmacaoBase, empilharConfirmacao } from "../teclado.js";
import { calcularNivel, resumirBadges, chaveBadgeFase, NIVEL_NOME } from "../badges.js";
import { chaveJogador, registrarJogador, atualizarPontuacao } from "../../lib/ranking.js";
import { enviarPontuacaoGlobal } from "../../lib/rankingGlobal.js";
import { mostrarPopupInstrucoes } from "../popupInstrucoes.js";

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
    // O Phaser REUTILIZA a instância da cena a cada scene.start, então toda
    // trava de "já estou saindo/entrando" precisa ser religada aqui — senão ela
    // volta ligada da vez anterior e congela a fase (foi o bug do mapa).
    this._saindo = false;
    this.pausado = false; // item 13: pausa do jogo (religado aqui pelo mesmo motivo)
    this.erros = 0; // erros na pergunta ATUAL (zera a cada pergunta)
    this.errosEtapa = 0; // erros na etapa INTEIRA (para as estrelas)
    this.mostrarDica = false; // vira true depois que os balões estouram
    // Cada vez que os balões estouram (3 respostas erradas na mesma conta) o
    // jogador GANHA 1 uso da dica. Usou → o botão fica cinza até o próximo estouro.
    this.dicasDisponiveis = 0;
    this.botaoDica = null;
    this._dicaEventos = []; // pulsos/sons agendados pela dica em andamento (ver agendarDica)

    // Tutorial de primeira vez: na 1ª fase, se o jogador nunca jogou neste
    // aparelho, mostramos a dica (💡) desde o início e demonstramos a jogada.
    let tutorialVisto = false;
    try {
      tutorialVisto = !!localStorage.getItem("cosmobot.tutorial");
    } catch {
      /* localStorage indisponível: trata como já visto (não força tutorial) */
      tutorialVisto = true;
    }
    this.primeiraVezJogo = this.indiceFase === 0 && !tutorialVisto;
    if (this.primeiraVezJogo) {
      this.mostrarDica = true;
      this.dicasDisponiveis = 1; // tutorial: a 1ª dica já vem liberada
    }

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
    this.criarBotaoVoltar();
    this.criarBotaoPausa();
    this.criarBotaoAjuda();
    iniciarConfirmacao(this); // Enter/Espaço: um único listener, com camadas (ver teclado.js)
    this.configurarTeclado();
  }

  // ===== Item 9: pop-up de instruções antes de liberar o desafio =====
  //
  // Cada cena concreta chama isto logo após iniciarFase(), passando o que
  // normalmente faria em seguida (gerar rodadas, montar a tela, narrar o
  // enunciado) como "aoComecar". O pop-up aparece automaticamente só na
  // PRIMEIRA vez que a criança entra naquela fase (guardado por fase.id no
  // aparelho); o botão de ajuda (❓) permite reabrir a qualquer momento.
  mostrarInstrucoes(aoComecar) {
    this._aoComecarFase = aoComecar;
    const chave = `cosmobot.instrucoes.${this.fase.id || this.fase.modulo || "fase"}`;
    let jaVisto = false;
    try {
      jaVisto = !!localStorage.getItem(chave);
    } catch {
      jaVisto = true; // sem localStorage: não insiste toda vez
    }
    if (jaVisto) {
      this._aoComecarFase = null; // já começou: reabrir a ajuda (❓) não pode recomeçar a fase
      aoComecar();
      return;
    }
    try {
      localStorage.setItem(chave, "1");
    } catch {
      /* sem localStorage: só não persiste, segue normalmente */
    }
    this.abrirPopupInstrucoes();
  }

  abrirPopupInstrucoes() {
    this._instrucoesAbertas = true;
    mostrarPopupInstrucoes(this, {
      titulo: this.fase.modulo,
      icone: this.fase.emoji,
      linhas: this.comoJogarLinhas(),
      aoFechar: () => {
        this._instrucoesAbertas = false;
        // Só a PRIMEIRA vez que o pop-up fecha é que começa a fase. Fechar a ajuda
        // (❓) no meio do jogo não pode regenerar as contas nem recomeçar a rodada.
        const comecar = this._aoComecarFase;
        this._aoComecarFase = null;
        comecar?.();
      },
    });
  }

  // Linhas padrão (ícone + comoJogar da fase, se existir). Cenas específicas
  // podem sobrescrever comoJogarLinhas() para um texto mais preciso.
  comoJogarLinhas() {
    if (Array.isArray(this.fase.comoJogar)) return this.fase.comoJogar;
    if (this.fase.comoJogar) return [this.fase.comoJogar];
    return [this.fase.enunciado];
  }

  // Botão de ajuda (❓): reabre as instruções a qualquer momento, sem mexer no
  // progresso da rodada atual (fica pausado atrás do pop-up).
  criarBotaoAjuda() {
    this.botaoAjuda = criarBotao(this, this.scale.width - 42, 64, "❓", () => this.abrirPopupInstrucoes(), {
      largura: 54,
      altura: 42,
      fontSize: this.fs("20px"),
      cor: 0x334155,
    });
  }

  // ===== Item 13: pausa do jogo =====
  // Botão (⏸️) + tecla P. Usa this.bloqueado (o mesmo "trava" que já protege
  // toda resposta/arraste no jogo) para impedir qualquer ação enquanto pausado,
  // e this.time.paused + tweens.pauseAll() para o relógio e os temporizadores
  // da rodada pararem de verdade (ninguém avança nem perde tempo pausado).
  criarBotaoPausa() {
    this.botaoPausa = criarBotao(this, this.scale.width - 42, 22, "⏸️", () => this.alternarPausa(), {
      largura: 54,
      altura: 38,
      fontSize: this.fs("18px"),
      cor: 0x334155,
    });
  }

  alternarPausa() {
    if (this._instrucoesAbertas) return; // não sobrepõe com o pop-up de instruções
    if (this.pausado) this.retomar();
    else this.pausar();
  }

  pausar() {
    if (this.pausado) return;
    this.pausado = true;
    this._bloqueadoAntesPausa = this.bloqueado;
    this.bloqueado = true;
    this.time.paused = true;
    this.tweens.pauseAll();
    pararFala();
    this.overlayPausa = this.add.container(0, 0).setDepth(1500);
    const { width, height } = this.scale;
    const fundo = this.add.rectangle(0, 0, width, height, 0x000000, 0.72).setOrigin(0).setInteractive();
    this.overlayPausa.add(fundo);
    const titulo = this.add
      .text(width / 2, height / 2 - 60, "⏸️ Pausado", {
        fontFamily: TEMA.fonte,
        fontSize: this.fs("32px"),
        color: "#ffd8a8",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.overlayPausa.add(titulo);
    const botao = criarBotao(this, width / 2, height / 2 + 24, "▶️ Continuar", () => this.retomar(), {
      largura: 260,
      altura: 60,
      fontSize: this.fs("22px"),
      cor: 0x2bff88,
    });
    this.overlayPausa.add(botao);
    botao.setFoco(true);
    // Em pausa, Enter/Espaço só continuam o jogo (nada por baixo reage).
    this._soltarEnterPausa?.();
    this._soltarEnterPausa = empilharConfirmacao(this, () => this.retomar());
    anunciar("Jogo pausado.");
  }

  retomar() {
    if (!this.pausado) return;
    this.pausado = false;
    this.bloqueado = this._bloqueadoAntesPausa || false;
    this.time.paused = false;
    this.tweens.resumeAll();
    this.overlayPausa?.destroy(true);
    this.overlayPausa = null;
    this._soltarEnterPausa?.();
    this._soltarEnterPausa = null;
    anunciar("Jogo retomado.");
  }

  // Saída para o mapa, disponível a QUALQUER momento da fase.
  //
  // Antes só dava para sair de uma fase CONCLUINDO ela: quem entrasse numa fase
  // ficava preso ali e não conseguia voltar para rejogar uma anterior sem
  // recarregar o jogo. Fica no canto superior esquerdo, abaixo do relógio —
  // longe dos botões de resposta (embaixo) e da dica (lateral direita).
  //
  // Sair no meio NÃO perde nada: o progresso só é gravado em concluirEtapa, e as
  // fases já concluídas continuam registradas em estrelasPorEtapa.
  criarBotaoVoltar() {
    this.botaoVoltar = criarBotao(this, 44, 64, "🗺️", () => this.voltarAoMapa(), {
      largura: 54,
      altura: 42,
      fontSize: this.fs("22px"),
      cor: 0x334155,
    });
    // Esc também volta (teclado), sem precisar mirar no botão. off() antes do
    // on() evita acumular listeners se esta fase for reaberta mais de uma vez
    // (o Phaser reaproveita a instância da cena) — o mesmo cuidado já usado em
    // VersusScene.ligarTeclas().
    this.input.keyboard.off("keydown-ESC").on("keydown-ESC", () => this.voltarAoMapa());
  }

  voltarAoMapa() {
    if (this._saindo) return;
    this._saindo = true;
    pararFala();
    this.pararTimerRodada?.();
    this.relogioEvento?.remove();
    this.scene.start("SelecaoFasesScene");
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

    // Toda rodada nova começa limpa: some qualquer efeito de dica que ainda estava
    // agendado e os tweens "órfãos" (de objetos da rodada anterior, já destruídos).
    this.cancelarDica();
    this.limparTweensOrfaos();

    // Linha 1 (âmbar): etapa e módulo.
    const etapa = this.add
      .text(
        centro,
        66, // abaixo das estrelas ⭐ da tira de progresso (que descem até y≈53)
        `Etapa ${this.indiceFase + 1} de ${this.totalFases}  •  ${this.fase.modulo}`,
        { fontFamily: TEMA.fonte, fontSize: this.fs("18px"), color: "#ffd8a8" }
      )
      .setOrigin(0.5);
    this.grupo.add(etapa);

    // Linha 2 (discreta): em qual desafio da etapa a criança está. No contraste
    // alto o cinza vira branco (fica legível no fundo preto).
    const rod = this.add
      .text(centro, 90, `Desafio ${this.rodadaAtual + 1} de ${this.rodadas.length}`, {
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
      .text(centro, 114, `${icone}  ${this.fase.enunciado}`, {
        fontFamily: TEMA.fonte,
        fontSize: this.fs("21px"),
        color: "#ffffff",
        align: "center",
        fontStyle: "bold",
        lineSpacing: 4,
        // Deixa livres as colunas de botões das bordas (esquerda: mapa; direita:
        // pausa, ajuda e dica) para o texto nunca passar por baixo deles.
        wordWrap: { width: Math.max(220, this.scale.width - 180) },
      })
      .setOrigin(0.5, 0);
    this.grupo.add(enunciado);

    // Conteúdo da fase começa 30px abaixo do fim do enunciado.
    this.baseY = Math.round(enunciado.y + enunciado.height + 30);

    // Painel da CONTA (fica logo abaixo do enunciado e empurra o conteúdo).
    this.desenharPainelOperacao();

    // Leitor de tela: anuncia a tarefa da rodada (o <canvas> não é lido sozinho).
    anunciar(`${this.fase.modulo}. ${this.fase.enunciado}`);

    // Na primeiríssima jogada, demonstra a jogada sozinho (visual).
    this.talvezMostrarTutorial();

    return centro;
  }

  // ===== Painel da operação (a CONTA sempre à vista) =====
  //
  // Cada fase diz qual é a sua conta sobrescrevendo textoOperacao() (ex.:
  // "3 + 4 = ?"). O painel fica entre o enunciado e o conteúdo, e continua na
  // tela o tempo todo enquanto a criança responde — assim ela nunca precisa
  // lembrar de cabeça qual é a conta, e fica claro QUAL operação está sendo
  // trabalhada. Quem não tem conta a mostrar devolve null e nada é desenhado.
  textoOperacao() {
    return null;
  }

  desenharPainelOperacao() {
    const texto = this.textoOperacao?.();
    if (!texto) return;

    const centro = this.scale.width / 2;
    const altura = 56;
    const largura = Math.min(440, this.scale.width - 70);
    const y = this.baseY + altura / 2;

    const g = this.add.graphics();
    g.fillStyle(0x0b1120, 0.92);
    g.fillRoundedRect(centro - largura / 2, y - altura / 2, largura, altura, 16);
    g.lineStyle(5, TEMA.foco, 1);
    g.strokeRoundedRect(centro - largura / 2, y - altura / 2, largura, altura, 16);
    g.caixaAbs = { x0: centro - largura / 2, y0: y - altura / 2, x1: centro + largura / 2, y1: y + altura / 2 };
    this.grupo.add(g);

    this.operacaoTxt = this.add
      .text(centro, y, texto, {
        fontFamily: TEMA.fonte,
        fontSize: this.fs("34px"),
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.operacaoTxt.setStroke("#0b1120", 5);
    this.grupo.add(this.operacaoTxt);

    // O conteúdo da fase começa abaixo do painel.
    this.baseY = Math.round(y + altura / 2 + 16);
  }

  // No acerto, o "?" vira o resultado: a criança vê a conta COMPLETA.
  revelarOperacao(valor) {
    if (!this.operacaoTxt || valor == null) return;
    // Troca a primeira "?" pelo resultado — serve tanto para "3 + 4 = ?" quanto
    // para a comparação, onde a incógnita fica no meio ("4 ? 6").
    this.operacaoTxt.setText(this.operacaoTxt.text.replace("?", `${valor}`)).setColor("#2bff88");
    this.tweens.add({
      targets: this.operacaoTxt,
      scale: 1.12,
      duration: 240,
      yoyo: true,
      ease: "Back.easeOut",
    });
  }

  // Demonstração automática na primeira vez (só na 1ª fase, 1ª rodada). Usa a
  // dica visual da própria fase (contar as luzes, encher um exemplo, etc.).
  talvezMostrarTutorial() {
    if (!this.primeiraVezJogo || this._tutorialFeito || this.rodadaAtual !== 0) return;
    this._tutorialFeito = true;
    try {
      localStorage.setItem("cosmobot.tutorial", "1");
    } catch {
      /* sem localStorage: apenas não persiste, o tutorial roda esta vez */
    }
    anunciar("Bem-vindo! Veja como se joga.");
    // Espera a criança ver a tela, depois demonstra (se a fase tiver dica).
    this.time.delayedCall(800, () => {
      if (this.darDica) this.darDica();
    });
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
  // Medidas da fileira de respostas, calculadas pelo tamanho REAL da tela. As
  // fases usam isto ANTES de criar os botões para saber onde o conteúdo deve
  // terminar (`fundo`) — assim nada passa por baixo das respostas. Em telas
  // estreitas os botões encolhem para nunca encostar um no outro.
  medidasRespostas(total) {
    const W = this.scale.width;
    const H = this.scale.height;
    const muitos = total >= 5;
    const Lbase = muitos ? 108 : 130;
    const Abase = muitos ? 96 : 110;
    const passo = Math.min(muitos ? 150 : 165, (W - 24) / total);
    const L = Math.min(Lbase, Math.floor(passo - 10));
    const A = Math.min(Abase, Math.round(L * 0.95));
    const escala = L / Lbase;
    const y = H - A / 2 - 22;
    return {
      L,
      A,
      passo,
      y,
      fonte: Math.round((muitos ? 40 : 50) * Math.max(0.7, escala)),
      topo: y - A / 2, // onde começam os botões
      fundo: y - A / 2 - 16, // limite inferior livre para o conteúdo da fase
    };
  }

  // Quanto de altura sobra para o conteúdo (entre o cabeçalho e as respostas —
  // ou o rodapé, nas fases sem botões de resposta).
  alturaLivre(totalOpcoes) {
    const fundo = totalOpcoes ? this.medidasRespostas(totalOpcoes).fundo : this.scale.height - 44;
    return Math.max(120, fundo - this.baseY);
  }

  // Fator de espaçamento (0.7–1.35): encolhe os intervalos quando falta altura e
  // alarga quando sobra (telas altas), sem mexer no tamanho dos desenhos.
  fatorEspaco(alturaNecessaria, totalOpcoes) {
    const f = this.alturaLivre(totalOpcoes) / alturaNecessaria;
    return Math.max(0.7, Math.min(1.35, f));
  }

  criarBotoesResposta(centro, opcoes, aoResponder) {
    this.botoes = [];
    this.aoResponder = aoResponder;
    const total = opcoes.length;
    const m = this.medidasRespostas(total);
    const { L, A, passo } = m;
    const tamFonte = this.fs(`${m.fonte}px`);
    opcoes.forEach((num, idx) => {
      const bx = centro + (idx - (total - 1) / 2) * passo;
      const by = m.y;
      const cor = TEMA.coresBotao[idx % TEMA.coresBotao.length];
      const b = criarBotao(this, bx, by, `${num}`, () => this.escolher(num), { cor, largura: L, altura: A, fontSize: tamFonte });
      b.valor = num;
      b.on("pointerover", () => this.setFoco(idx));
      this.grupo.add(b);
      this.botoes.push(b);
    });
    // Começa SEM nenhum botão pré-focado: assim um Enter avulso (inclusive o
    // herdado da tela anterior) não responde a conta sozinho. O foco só aparece
    // quando a criança navega com as setas ou passa o mouse por cima.
    this.focoIndex = -1;
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
    // Guarda o MELHOR resultado: rejogar uma fase para treinar nunca pode
    // DIMINUIR o que a criança já tinha conquistado. A tela de conclusão abaixo
    // mostra as estrelas desta jogada; o que fica registrado é o recorde.
    mapa[this.indiceFase] = Math.max(estrelas, mapa[this.indiceFase] ?? 0);
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
    // Mesma regra das estrelas: a badge só melhora, nunca piora ao rejogar.
    const anterior = badges[this.indiceFase];
    if (!anterior || nivel >= anterior.nivel) {
      badges[this.indiceFase] = { nivel, estrelas: mapa[this.indiceFase], tempo: tempoFase };
    }
    this.registry.set("badges", badges);
    // Ranking: guarda o MELHOR resultado do jogador.
    // - LOCAL (localStorage): sempre, funciona offline.
    // - GLOBAL (Supabase): só quando configurado. É "fire-and-forget":
    //   qualquer falha é ignorada e o jogo segue normalmente.
    const resumo = resumirBadges(badges, this.totalFases);
    const chaveRanking = chaveJogador(this.jogador.apelido, this.jogador.avatar);
    const pontuacao = {
      pontos: resumo.pontos,
      estrelas: resumo.estrelas,
      badges: resumo.total,
      perfeito: resumo.perfeito,
    };
    registrarJogador(this.jogador.apelido, this.jogador.avatar);
    atualizarPontuacao(chaveRanking, pontuacao);
    enviarPontuacaoGlobal({
      chave: chaveRanking,
      nome: this.jogador.apelido,
      icone: this.jogador.avatar,
      ...pontuacao,
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

    // Item 12: a próxima ação fica EXPLÍCITA (um botão "Continuar"), em vez de
    // só esperar um tempo fixo passar — a criança decide quando está pronta.
    // O avanço automático continua existindo como rede de segurança (mais
    // longo, para dar tempo de ler), caso ninguém toque em nada.
    let avancou = false;
    const seguir = () => {
      if (avancou) return;
      avancou = true;
      this.avancarFase();
    };
    const botaoContinuar = criarBotao(this, width / 2, height - 54, "Continuar ▶", seguir, {
      largura: 220,
      altura: 54,
      fontSize: this.fs("20px"),
      cor: 0x2bff88,
    });
    botaoContinuar.setFoco(true);
    empilharConfirmacao(this, seguir); // Enter/Espaço = "Continuar" (a camada some com a cena)
    this.time.delayedCall(3600, seguir);
  }

  // Mostra a insígnia conquistada na tela de conclusão, com brilho conforme o
  // nível (mais reluzente quanto mais rápido e sem erros). Usa a arte se existir.
  mostrarBadgeConquista(x, y, idx, nivel) {
    const chave = chaveBadgeFase(this.fase, idx);
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
  //
  // IMPORTANTE (item 4 do relatório — narração/Enter duplicados): o Phaser
  // REUTILIZA a instância da cena a cada scene.start/restart. Chamar .on()
  // sem antes dar .off() faz os listeners se ACUMULAREM a cada nova entrada
  // na fase; depois de jogar a mesma fase algumas vezes, um Enter (ou H)
  // passava a disparar a MESMA ação várias vezes seguidas (inclusive
  // repetindo a narração). off() antes de on() garante um único listener por
  // tecla, sempre — o mesmo padrão já usado em VersusScene.ligarTeclas().
  configurarTeclado() {
    this.input.keyboard.off("keydown-RIGHT").on("keydown-RIGHT", () => this.moverFoco(1));
    this.input.keyboard.off("keydown-LEFT").on("keydown-LEFT", () => this.moverFoco(-1));
    // Enter/Espaço: ação base da fase (responder a opção em foco). Fases de arraste
    // trocam por outra ação em definirConfirmacaoBase().
    definirConfirmacaoBase(this, () => this.ativarFoco());
    // Tecla H = Dica (acessível por teclado; só depois que a dica aparece).
    this.input.keyboard.off("keydown-H").on("keydown-H", () => {
      if (this.pausado) return;
      if (this.mostrarDica && this.darDica) this.usarDica();
    });
    // Tecla P = Pausa (item 13), alternativa ao botão ⏸️.
    this.input.keyboard.off("keydown-P").on("keydown-P", () => this.alternarPausa());
  }

  // Confirma a opção em foco. O anti-spam (tecla segurada, Enter herdado, rajada)
  // já foi feito em teclado.js. Devolve false quando não havia nada a fazer, para o
  // Enter não gastar o intervalo anti-spam à toa.
  ativarFoco() {
    if (this.bloqueado || this.pausado) return false;
    // Nada focado (ou fase sem botões de opção): Enter não responde sozinho.
    if (this.focoIndex < 0 || !this.botoes?.length) return false;
    const alvo = this.botoes[this.focoIndex];
    if (alvo) {
      alvo.apertar?.();
      this.escolher(alvo.valor);
    }
  }

  moverFoco(dir) {
    if (!this.botoes?.length) return;
    // Do estado "sem foco" (-1), a 1ª seta foca a ponta correta.
    if (this.focoIndex < 0) this.focoIndex = dir > 0 ? 0 : this.botoes.length - 1;
    else this.focoIndex = Phaser.Math.Wrap(this.focoIndex + dir, 0, this.botoes.length);
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

  // ===== Erro → as bolinhas incham → no 3º erro ESTOURAM e vem outra conta =====
  // Cada erro deixa as bolinhas maiores. Ao chegar no limite (LIMITE_ERROS=3), elas estouram
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
    this.cancelarDica();
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
    this.dicasDisponiveis += 1; // 3 erros seguidos → ganha 1 uso da dica
    if (typeof gerarNova === "function" && this.rodadas) {
      this.rodadas[this.rodadaAtual] = gerarNova();
    }
    falar("Vamos tentar outra!");
    anunciar("Os balões estouraram. Vamos tentar outra conta mais fácil!");
    this.time.delayedCall(120, () => this.montarRodada());
  }

  // Botão de DICA (aparece só depois que os balões estouraram). É só um ÍCONE
  // de lâmpada (💡) com um brilho pulsante — nada de texto para ler.
  //
  // Vale 1 uso a cada estouro de balões (3 respostas erradas na mesma conta —
  // ver resetarPergunta). Com 0 usos disponíveis o botão aparece CINZA e inerte.
  criarBotaoDica(aoClicar) {
    if (!this.mostrarDica) return null;
    // Fica na COLUNA DA DIREITA, logo abaixo de pausa (⏸️) e ajuda (❓): é uma
    // faixa que o conteúdo da fase nunca ocupa (começa abaixo do cabeçalho),
    // então a lâmpada não cobre nada em nenhum tamanho de tela.
    const x = this.scale.width - 42;
    const y = 124;
    // Brilho pulsante atrás, para a criança perceber que ali tem ajuda.
    const glow = this.add.circle(x, y, 32, 0x00c2ff, 0.4);
    this.grupo.add(glow);
    const pulso = this.tweens.add({
      targets: glow,
      scale: 1.6,
      alpha: 0.08,
      duration: 850,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    const b = criarBotao(
      this,
      x,
      y,
      "💡",
      () => this.usarDica(aoClicar),
      { largura: 60, altura: 58, fontSize: "30px", cor: 0x00c2ff }
    );
    this.grupo.add(b);
    // Guarda para poder deixar o botão cinza depois do uso (clique OU tecla H).
    this.botaoDica = { botao: b, glow, pulso };
    if (this.dicasDisponiveis <= 0) this.desativarBotaoDica(); // sem usos: já nasce cinza
    return b;
  }

  // Gasta 1 uso da dica (botão ou tecla H). Sem usos disponíveis não faz nada.
  // Zerou → o botão fica cinza até o próximo estouro de balões liberar outro.
  usarDica(acao) {
    if (this.dicasDisponiveis <= 0 || this.pausado || this.bloqueado) return;
    this.dicasDisponiveis -= 1;
    if (this.dicasDisponiveis <= 0) this.desativarBotaoDica();
    this.cancelarDica(); // nunca duas demonstrações ao mesmo tempo
    (acao || this.darDica)?.call(this);
  }

  // As dicas animam em sequência (pulsos, sons, mãozinha) com delayedCall. Se a
  // conta trocasse no meio (3 erros, fim do tempo, acerto), esses passos atrasados
  // continuavam rodando em cima da rodada NOVA — pulsando, tocando ou até movendo
  // peças que não eram mais as da dica (era o "acúmulo" de efeitos). Por isso os
  // passos da dica passam por aqui, e cancelarDica() derruba todos de uma vez.
  agendarDica(ms, fn) {
    const ev = this.time.delayedCall(ms, () => {
      this._dicaEventos = (this._dicaEventos || []).filter((e) => e !== ev);
      fn();
    });
    (this._dicaEventos ||= []).push(ev);
    return ev;
  }

  cancelarDica() {
    (this._dicaEventos || []).forEach((e) => e.remove(false));
    this._dicaEventos = [];
  }

  // Remove tweens cujos alvos já foram destruídos (luzes, brilhos e botões da
  // rodada anterior). Sem isso eles ficavam rodando para sempre, acumulando a cada
  // conta nova e pesando o jogo.
  limparTweensOrfaos() {
    this.tweens.getTweens().forEach((tw) => {
      const alvos = tw.targets || [];
      if (alvos.length && alvos.every((a) => a && a.active === false && !a.scene)) tw.remove();
    });
  }

  // O brilho some e o botão fica cinza/inerte.
  desativarBotaoDica() {
    const d = this.botaoDica;
    if (!d || !d.botao?.scene) return; // botão já destruído (rodada trocou)
    d.pulso?.stop();
    d.glow?.setAlpha(0);
    d.botao.desativar?.();
  }

  // Pulso de "destaque" que NUNCA acumula: se já havia um pulso rodando no mesmo
  // objeto, ele é interrompido e o tamanho volta ao original antes de recomeçar.
  // (Sem isso, apertar Dica várias vezes seguidas multiplicava o tamanho —
  // cada pulso partia da escala já aumentada pelo anterior.)
  pulsar(alvo, fator = 1.4, duracao = 200) {
    if (!alvo || !alvo.active) return;
    if (alvo.__escalaBase === undefined) alvo.__escalaBase = alvo.scale || 1;
    alvo.__pulso?.stop();
    alvo.setScale(alvo.__escalaBase);
    alvo.__pulso = this.tweens.add({
      targets: alvo,
      scale: alvo.__escalaBase * fator,
      duration: duracao,
      yoyo: true,
      onComplete: () => alvo.setScale(alvo.__escalaBase),
    });
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
