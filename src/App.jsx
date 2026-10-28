import { lazy, Suspense, useState, useEffect } from "react";
import Menu from "./components/Menu.jsx";
import Avatar from "./components/Avatar.jsx";
import Instrucoes from "./components/Instrucoes.jsx";
import Acessibilidade from "./components/Acessibilidade.jsx";
import Creditos from "./components/Creditos.jsx";
import Ranking from "./components/Ranking.jsx";
import DoisJogadores from "./components/DoisJogadores.jsx";

// O jogo (Phaser, ~1,6 MB) só é baixado quando a criança clica em "Jogar".
// Assim o menu abre instantâneo — importante no celular/internet lenta.
const JogoCanvas = lazy(() => import("./components/JogoCanvas.jsx"));

// Controla qual tela está aparecendo. A navegação é simples: cada tela
// recebe a função "irPara" para trocar de tela.
export default function App() {
  const [tela, setTela] = useState("menu");
  // Configuração da partida de 2 jogadores (nomes, cores e a operação escolhida).
  const [versus, setVersus] = useState(null);

  // Detecta toque (celular/tablet) e marca no <body> para o CSS deixar os
  // alvos mais confortáveis para o dedo. Reavalia se o aparelho girar.
  useEffect(() => {
    const mq = window.matchMedia ? window.matchMedia("(pointer: coarse)") : null;
    const aplicar = () => document.body.classList.toggle("toque", !!mq && mq.matches);
    aplicar();
    mq?.addEventListener?.("change", aplicar);
    return () => mq?.removeEventListener?.("change", aplicar);
  }, []);

  // Opção escolhida com o MOUSE/toque não pode ser reativada pelo teclado: o
  // botão clicado mantém o foco, então um Enter/Espaço depois (ex.: Enter para
  // "Começar aventura" dentro do jogo) o acionaria de novo — era o que ligava e
  // desligava a tela cheia sem parar. Solta o foco após o clique do mouse.
  // (Clique vindo do TECLADO tem detail 0 e não é afetado: navegar com Tab +
  // Enter continua funcionando. Campos de texto mantêm o foco para digitar.)
  useEffect(() => {
    const SELETOR = 'button, [role="button"], input[type="checkbox"], input[type="radio"], input[type="range"], select, summary';
    const soltarFoco = (e) => {
      if (e.detail === 0) return; // veio do teclado
      setTimeout(() => {
        const ativo = document.activeElement;
        if (ativo && ativo !== document.body && ativo.matches?.(SELETOR)) ativo.blur();
      }, 0);
    };
    document.addEventListener("click", soltarFoco, true);
    return () => document.removeEventListener("click", soltarFoco, true);
  }, []);

  return (
    <main className="app">
      {tela === "menu" && <Menu irPara={setTela} />}
      {tela === "avatar" && <Avatar irPara={setTela} />}
      {tela === "instrucoes" && <Instrucoes irPara={setTela} />}
      {tela === "acessibilidade" && <Acessibilidade irPara={setTela} />}
      {tela === "creditos" && <Creditos irPara={setTela} />}
      {tela === "ranking" && <Ranking irPara={setTela} />}
      {tela === "doisJogadores" && (
        <DoisJogadores
          irPara={setTela}
          aoComecar={(cfg) => {
            setVersus(cfg);
            setTela("versus");
          }}
        />
      )}
      {tela === "jogo" && (
        <Suspense
          fallback={
            <section className="tela" aria-label="Carregando o jogo">
              <div className="robo-heroi" aria-hidden="true">🚀</div>
              <p className="subtitulo">Preparando a nave...</p>
            </section>
          }
        >
          <JogoCanvas irPara={setTela} />
        </Suspense>
      )}
      {tela === "versus" && (
        <Suspense
          fallback={
            <section className="tela" aria-label="Carregando o jogo">
              <div className="robo-heroi" aria-hidden="true">👥</div>
              <p className="subtitulo">Preparando a disputa...</p>
            </section>
          }
        >
          <JogoCanvas irPara={setTela} modo="versus" versus={versus} />
        </Suspense>
      )}
    </main>
  );
}
