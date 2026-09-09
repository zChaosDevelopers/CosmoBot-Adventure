import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { criarConfig } from "../game/config.js";
import { useJogador } from "../context/JogadorContext.jsx";
import { fases } from "../data/fases/index.js";
import { ASSETS } from "../game/assets.js";
import { salvarProgresso } from "../lib/progresso.js";
import { pararFala } from "../lib/fala.js";

// Verifica (via HEAD) quais imagens realmente existem, sem gerar erros 404.
async function assetsDisponiveis() {
  const base = import.meta.env.BASE_URL;
  const encontrados = [];
  await Promise.all(
    ASSETS.map(async (a) => {
      try {
        const r = await fetch(`${base}${a.arquivo}`, { method: "HEAD" });
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
export default function JogoCanvas({ irPara }) {
  const containerRef = useRef(null);
  const jogoRef = useRef(null);
  // Pré-visualização em "tela de celular" (útil para testar o layout mobile
  // sem sair do computador). Só muda a largura do quadro — o Phaser (Scale.FIT)
  // reescala o jogo sozinho e o ResizeObserver reajusta a área de clique.
  const [mobile, setMobile] = useState(false);
  const { apelido, avatar, narracao, setNarracao, somLigado, setSomLigado } = useJogador();

  // Ao sair da tela do jogo, garante que nenhuma narração continue tocando.
  useEffect(() => () => pararFala(), []);

  useEffect(() => {
    let cancelado = false;

    async function iniciar() {
      // Espera a fonte carregar e descobre quais imagens existem.
      try {
        await document.fonts.load("700 32px Fredoka");
        await document.fonts.ready;
      } catch {
        /* segue com a fonte padrão */
      }
      const assets = await assetsDisponiveis();
      if (cancelado || jogoRef.current) return;

      const onConcluir = ({ faseId, status }) => salvarProgresso({ apelido, faseId, status });

      jogoRef.current = new Phaser.Game(
        criarConfig(containerRef.current, {
          fases,
          jogador: { apelido, avatar },
          onConcluir,
          assets,
        })
      );

      // Confiabilidade do clique: o Phaser guarda em cache a POSIÇÃO do canvas
      // para converter o toque/clique em coordenadas do jogo. Se o layout mudar
      // depois do boot (fontes carregando, a barra de áudio quebrando linha, o
      // teclado do celular abrindo...), esse cache fica desatualizado e alguns
      // cliques "erram" o botão. Recalculamos os limites nesses momentos.
      const jogo = jogoRef.current;
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
  }, [apelido, avatar]);

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
          title="Ligar ou desligar os efeitos sonoros"
        >
          {somLigado ? "🔊" : "🔈"} Som
        </button>
        <button
          type="button"
          className={"botao botao-audio-mini" + (narracao ? " ativo" : "")}
          aria-pressed={narracao}
          onClick={() => {
            if (narracao) pararFala();
            setNarracao(!narracao);
          }}
          title="Ligar ou desligar a narração em voz alta"
        >
          🦻 Narração
        </button>
        <button
          type="button"
          className={"botao botao-audio-mini" + (mobile ? " ativo" : "")}
          aria-pressed={mobile}
          onClick={() => setMobile((m) => !m)}
          title="Pré-visualizar como fica em uma tela de celular"
        >
          {mobile ? "🖥️ Ver no computador" : "📱 Ver no celular"}
        </button>
      </div>

      <div className={"moldura-canvas" + (mobile ? " mobile" : "")}>
        <div
          ref={containerRef}
          className="canvas-jogo"
          role="application"
          aria-label="Área do jogo da estação espacial"
        />
      </div>
      <button className="botao" onClick={() => irPara("menu")}>
        Voltar ao menu
      </button>
    </section>
  );
}
