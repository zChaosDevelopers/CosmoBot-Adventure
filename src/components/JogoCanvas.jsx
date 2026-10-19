import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { criarConfig } from "../game/config.js";
import { useJogador } from "../context/JogadorContext.jsx";
import { fases } from "../data/fases/index.js";
import { ASSETS } from "../game/assets.js";
import { salvarProgresso } from "../lib/progresso.js";
import { pararFala } from "../lib/fala.js";
import { limparAnuncios } from "../lib/anunciar.js";
import {
  iniciarMusica,
  pararMusica,
  volumeMusica,
  setVolumeMusica,
} from "../lib/musica.js";

// Espera uma promessa, mas desiste depois de "ms" — assim uma rede lenta ou
// bloqueada (ex.: Google Fonts fora do ar) nunca deixa o jogo preso na tela preta.
function comLimite(promessa, ms) {
  return Promise.race([promessa, new Promise((resolver) => setTimeout(resolver, ms))]);
}

// Verifica (via HEAD) quais imagens realmente existem, sem gerar erros 404.
async function assetsDisponiveis() {
  const base = import.meta.env.BASE_URL;
  const encontrados = [];
  await Promise.all(
    ASSETS.map(async (a) => {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 4000);
        const r = await fetch(`${base}${a.arquivo}`, { method: "HEAD", signal: ctrl.signal });
        clearTimeout(timer);
        // O Vite (dev) responde 200 com o index.html para arquivos ausentes
        // (fallback de SPA). Por isso confirmamos que o conteúdo é IMAGEM —
        // assim os assets opcionais que faltam usam o desenho procedural sem
        // poluir o console com erros de carregamento.
        const tipo = r.headers.get("content-type") || "";
        if (r.ok && tipo.startsWith("image/")) encontrados.push(a);
      } catch {
        /* arquivo ausente: desenho procedural */
      }
    })
  );
  return encontrados;
}

// Componente que "hospeda" o Phaser dentro do React. O React cuida das
// telas (menu, avatar...) e o Phaser cuida da parte do jogo (o canvas).
// modo: "aventura" (as 8 fases) ou "versus" (disputa de 2 jogadores).
export default function JogoCanvas({ irPara, modo = "aventura", versus = null }) {
  const containerRef = useRef(null);
  const jogoRef = useRef(null);
  // Pré-visualização em "tela de celular" (útil para testar o layout mobile
  // sem sair do computador). Só muda a largura do quadro — o Phaser (Scale.FIT)
  // reescala o jogo sozinho e o ResizeObserver reajusta a área de clique.
  const [mobile, setMobile] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  // Tela cheia de verdade (API do navegador). O jogo já ocupa a janela inteira;
  // este botão esconde também a barra do navegador.
  const podeTelaCheia = typeof document !== "undefined" && !!document.documentElement.requestFullscreen;
  const [telaCheia, setTelaCheia] = useState(false);
  // "Som" liga/desliga efeitos e música de fundo juntos (ver JogadorContext).
  // A narração fica só em Acessibilidade, no Menu.
  const { apelido, avatar, somLigado, setSomLigado } = useJogador();
  // Volume da música de fundo, BEM baixinho por padrão (src/lib/musica.js).
  const [volume, setVolume] = useState(() => Math.round(volumeMusica() * 100));

  // Ao sair da tela do jogo, para a narração, a música e remove a região de anúncios.
  useEffect(() => () => {
    pararFala();
    pararMusica();
    limparAnuncios();
  }, []);

  // Navegadores bloqueiam áudio com som antes de um gesto do usuário — o
  // primeiro toque/tecla dentro da área do jogo já conta como esse gesto.
  useEffect(() => {
    const iniciar = () => iniciarMusica();
    const area = containerRef.current;
    area?.addEventListener("pointerdown", iniciar, { once: true });
    area?.addEventListener("keydown", iniciar, { once: true });
    iniciarMusica(); // funciona de primeira se o navegador já permitir (ex.: já houve um clique antes, como o de "Jogar")
    return () => {
      area?.removeEventListener("pointerdown", iniciar);
      area?.removeEventListener("keydown", iniciar);
    };
  }, []);

  useEffect(() => {
    const aoMudar = () => {
      setTelaCheia(!!document.fullscreenElement);
      // O tamanho disponível mudou: reajusta a escala do jogo.
      [60, 300].forEach((ms) => setTimeout(() => jogoRef.current?.scale?.refresh(), ms));
    };
    document.addEventListener("fullscreenchange", aoMudar);
    return () => {
      document.removeEventListener("fullscreenchange", aoMudar);
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
  }, []);

  function alternarTelaCheia() {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    else document.documentElement.requestFullscreen?.().catch(() => {});
  }

  function mudarVolume(e) {
    const v = Number(e.target.value);
    setVolume(v);
    setVolumeMusica(v / 100);
  }

  useEffect(() => {
    let cancelado = false;

    async function iniciar() {
      // Espera a fonte carregar e descobre quais imagens existem.
      try {
        await comLimite(document.fonts.load("700 32px Fredoka"), 2500);
        await comLimite(document.fonts.ready, 1000);
      } catch {
        /* segue com a fonte padrão */
      }
      const assets = await assetsDisponiveis();
      if (cancelado || jogoRef.current) return;

      const onConcluir = ({ faseId, status }) => salvarProgresso({ apelido, faseId, status });

      try {
        jogoRef.current = new Phaser.Game(
          criarConfig(containerRef.current, {
            fases,
            jogador: { apelido, avatar },
            onConcluir,
            assets,
            modo,
            versus,
            onSairVersus: () => irPara("menu"),
          })
        );
      } catch (e) {
        console.error("Falha ao iniciar o jogo:", e);
        setErro(true);
        return;
      }
      setCarregando(false);

      // Confiabilidade do clique: o Phaser guarda em cache a POSIÇÃO do canvas
      // para converter o toque/clique em coordenadas do jogo. Se o layout mudar
      // depois do boot (fontes carregando, a barra de áudio quebrando linha, o
      // teclado do celular abrindo...), esse cache fica desatualizado e alguns
      // cliques "erram" o botão. Recalculamos os limites nesses momentos.
      const jogo = jogoRef.current;
      // Dá foco ao canvas para o teclado funcionar logo de cara (a tela de
      // apelido tinha um <input> com foco; sem isso, as teclas podem "não pegar").
      try {
        jogo.canvas?.setAttribute("tabindex", "0");
        jogo.canvas?.focus?.({ preventScroll: true });
      } catch {
        /* ignora */
      }
      const atualizarLimites = () => jogo?.scale?.refresh();
      [120, 400, 900].forEach((ms) => setTimeout(atualizarLimites, ms));
      window.addEventListener("resize", atualizarLimites);
      window.addEventListener("scroll", atualizarLimites, { passive: true });
      const ro = "ResizeObserver" in window ? new ResizeObserver(atualizarLimites) : null;
      if (ro && containerRef.current) ro.observe(containerRef.current);
      document.fonts?.ready?.then(atualizarLimites);
      limpar = () => {
        window.removeEventListener("resize", atualizarLimites);
        window.removeEventListener("scroll", atualizarLimites);
        ro?.disconnect();
      };

      if (import.meta.env.DEV) window.__jogo = jogoRef.current;
    }

    let limpar = null;
    iniciar();

    return () => {
      cancelado = true;
      limpar?.();
      jogoRef.current?.destroy(true);
      jogoRef.current = null;
    };
  }, [apelido, avatar, modo, versus]);

  // Ao trocar entre celular/computador, o tamanho do canvas muda: reajusta a
  // escala e o cache de posição do Phaser para os cliques continuarem certeiros.
  useEffect(() => {
    const jogo = jogoRef.current;
    if (!jogo) return;
    [60, 260, 520].forEach((ms) => setTimeout(() => jogo?.scale?.refresh(), ms));
  }, [mobile]);

  return (
    <section className="tela tela-jogo" aria-label="Jogo">
      <div className="barra-audio" role="group" aria-label="Controles de áudio">
        <button
          type="button"
          className={"botao botao-audio-mini" + (somLigado ? " ativo" : "")}
          aria-pressed={somLigado}
          onClick={() => setSomLigado(!somLigado)}
          title="Ligar ou desligar o som (efeitos e música)"
        >
          {somLigado ? "🔊" : "🔈"} Som
        </button>
        {somLigado && (
          <label className="controle-volume" title="Volume da música de fundo">
            <span aria-hidden="true">🔉</span>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={mudarVolume}
              aria-label="Volume da música de fundo"
            />
          </label>
        )}
        {podeTelaCheia && (
          <button
            type="button"
            className={"botao botao-audio-mini" + (telaCheia ? " ativo" : "")}
            aria-pressed={telaCheia}
            onClick={alternarTelaCheia}
            title="Entrar ou sair da tela cheia"
          >
            {telaCheia ? "🗗 Sair da tela cheia" : "⛶ Tela cheia"}
          </button>
        )}
        {/* Ferramenta só de desenvolvimento — não aparece para o usuário final. */}
        {import.meta.env.DEV && (
          <button
            type="button"
            className={"botao botao-audio-mini" + (mobile ? " ativo" : "")}
            aria-pressed={mobile}
            onClick={() => setMobile((m) => !m)}
            title="Pré-visualizar como fica em uma tela de celular"
          >
            {mobile ? "🖥️ Ver no computador" : "📱 Ver no celular"}
          </button>
        )}
        <button
          type="button"
          className="botao botao-audio-mini botao-voltar"
          onClick={() => irPara("menu")}
        >
          ← Menu
        </button>
      </div>

      <div className={"moldura-canvas" + (mobile ? " mobile" : "")}>
        <div
          ref={containerRef}
          className="canvas-jogo"
          role="application"
          aria-label="Área do jogo da estação espacial"
        />
        {carregando && !erro && (
          <p className="jogo-aviso" role="status">🚀 Preparando a nave...</p>
        )}
        {erro && (
          <p className="jogo-aviso" role="alert">
            Não foi possível iniciar o jogo neste aparelho. Recarregue a página (Ctrl+F5).
          </p>
        )}
      </div>
    </section>
  );
}
