import { useEffect } from "react";
import { useJogador } from "../context/JogadorContext.jsx";
import { falar, pararFala } from "../lib/fala.js";
import BotaoAudio from "./BotaoAudio.jsx";

// Curto e VISUAL — o público é criança que ainda lê pouco. Cada passo é um
// ícone + uma frase bem curta.
const PASSOS = [
  { icone: "🚀", texto: "Conserte a nave do CosmoBot!" },
  { icone: "🔢", texto: "Cada etapa é um desafio de matemática." },
  { icone: "👆", texto: "Arraste, toque ou use as setas." },
  { icone: "💚", texto: "Errou? É só tentar de novo." },
];
const TEXTO = PASSOS.map((p) => p.texto).join(" ");

export default function Instrucoes({ irPara }) {
  const { narracao } = useJogador();

  // Se a narração estiver ligada, lê as instruções automaticamente.
  useEffect(() => {
    if (narracao) falar(TEXTO);
    return () => pararFala();
  }, [narracao]);

  return (
    <section className="tela" aria-label="Instruções">
      <h2 className="titulo">Como jogar</h2>

      <ul className="passos-instrucoes">
        {PASSOS.map((p) => (
          <li key={p.texto}>
            <span className="passo-icone" aria-hidden="true">{p.icone}</span>
            <span>{p.texto}</span>
          </li>
        ))}
      </ul>

      {narracao && <BotaoAudio texto={TEXTO} rotulo="Ouvir" />}

      <div className="botoes-linha">
        <button className="botao" onClick={() => irPara("menu")}>
          Voltar
        </button>
      </div>
    </section>
  );
}
