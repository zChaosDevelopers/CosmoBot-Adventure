import { lazy, Suspense, useState, useEffect } from "react";
import Menu from "./components/Menu.jsx";
import Avatar from "./components/Avatar.jsx";
import Instrucoes from "./components/Instrucoes.jsx";
import Acessibilidade from "./components/Acessibilidade.jsx";
import Creditos from "./components/Creditos.jsx";
import Ranking from "./components/Ranking.jsx";

// O jogo (Phaser, ~1,6 MB) só é baixado quando a criança clica em "Jogar".
// Assim o menu abre instantâneo — importante no celular/internet lenta.
const JogoCanvas = lazy(() => import("./components/JogoCanvas.jsx"));

// Controla qual tela está aparecendo. A navegação é simples: cada tela
// recebe a função "irPara" para trocar de tela.
export default function App() {
  const [tela, setTela] = useState("menu");

  // Detecta toque (celular/tablet) e marca no <body> para o CSS deixar os
  // alvos mais confortáveis para o dedo. Reavalia se o aparelho girar.
  useEffect(() => {
    const mq = window.matchMedia ? window.matchMedia("(pointer: coarse)") : null;
    const aplicar = () => document.body.classList.toggle("toque", !!mq && mq.matches);
    aplicar();
    mq?.addEventListener?.("change", aplicar);
    return () => mq?.removeEventListener?.("change", aplicar);
  }, []);

  return (
    <main className="app">
      {tela === "menu" && <Menu irPara={setTela} />}
      {tela === "avatar" && <Avatar irPara={setTela} />}
      {tela === "instrucoes" && <Instrucoes irPara={setTela} />}
      {tela === "acessibilidade" && <Acessibilidade irPara={setTela} />}
      {tela === "creditos" && <Creditos irPara={setTela} />}
      {tela === "ranking" && <Ranking irPara={setTela} />}
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
    </main>
  );
}
