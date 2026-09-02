import { useEffect } from "react";
import { useJogador } from "../context/JogadorContext.jsx";
import { falar, pararFala } from "../lib/fala.js";
import RoboSVG from "./RoboSVG.jsx";

const TEXTO_MENU =
  "Bem-vindo às Aventuras do CosmoBot! Ajude o robozinho a consertar a nave em 5 etapas, resolvendo desafios de matemática. Escolha uma opção: Jogar, Instruções ou Acessibilidade.";

// Tela inicial do jogo, com os três botões principais.
export default function Menu({ irPara }) {
  const { apelido, avatar, narracao } = useJogador();

  // Se a narração estiver ligada (opção fica em Acessibilidade), o menu se
  // apresenta em voz alta.
  useEffect(() => {
    if (narracao) falar(TEXTO_MENU);
    return () => pararFala();
  }, [narracao]);

  return (
    <section className="tela tela-menu" aria-label="Menu inicial">
      <div className="robo-heroi">
        <RoboSVG cor={avatar} tamanho={110} />
      </div>
      <h1 className="titulo">Aventuras do CosmoBot</h1>
      <p className="subtitulo">Conserte a nave em 5 etapas e volte para casa usando matemática!</p>

      {apelido && (
        <p className="ola">
          <RoboSVG cor={avatar} tamanho={34} /> Olá, {apelido}!
        </p>
      )}

      <nav className="botoes-menu" aria-label="Opções do jogo">
        <button className="botao botao-primario" onClick={() => irPara("avatar")}>
          Jogar
        </button>
        <button className="botao" onClick={() => irPara("instrucoes")}>
          Instruções
        </button>
        <button className="botao" onClick={() => irPara("acessibilidade")}>
          Acessibilidade
        </button>
      </nav>
    </section>
  );
}
