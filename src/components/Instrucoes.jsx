import { useEffect } from "react";
import { useJogador } from "../context/JogadorContext.jsx";
import { falar, pararFala } from "../lib/fala.js";
import BotaoAudio from "./BotaoAudio.jsx";

const TEXTO =
  "Nas Aventuras do CosmoBot, você ajuda um robozinho a consertar a nave em 5 etapas para voltar para casa: " +
  "ligar o painel, abrir a comporta, encher as baterias, ligar os motores e traçar a rota. " +
  "Cada etapa tem um desafio de matemática (contar, somar, subtrair, multiplicar e dividir) que fica um pouquinho mais difícil. " +
  "Você pode jogar com o mouse, o toque na tela ou o teclado: use as setas para navegar e Enter para escolher. " +
  "Não existe punição: se errar, é só tentar de novo!";

// Tela de instruções, com botão para ouvir a narração.
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
      <p className="texto-instrucoes">{TEXTO}</p>

      {narracao && <BotaoAudio texto={TEXTO} rotulo="Ouvir as instruções" />}

      <div className="botoes-linha">
        <button className="botao" onClick={() => irPara("menu")}>
          Voltar
        </button>
      </div>
    </section>
  );
}
