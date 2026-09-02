import { useState } from "react";
import { useJogador } from "../context/JogadorContext.jsx";
import { TEMA } from "../game/tema.js";
import RoboSVG from "./RoboSVG.jsx";

// Tela para escolher a COR do robô e digitar um apelido de brincadeira.
export default function Avatar({ irPara }) {
  const { apelido, setApelido, avatar, setAvatar } = useJogador();
  const [nome, setNome] = useState(apelido);

  function comecar() {
    setApelido(nome.trim() || "Explorador");
    irPara("jogo");
  }

  return (
    <section className="tela" aria-label="Escolha do robô e apelido">
      <h2 className="titulo">Escolha o seu CosmoBot!</h2>

      <div className="grade-avatares" role="radiogroup" aria-label="Cores de robô">
        {TEMA.coresRobo.map((cor) => (
          <button
            key={cor}
            type="button"
            className={"avatar-opcao" + (avatar === cor ? " selecionado" : "")}
            role="radio"
            aria-checked={avatar === cor}
            aria-label={"Robô cor " + cor}
            onClick={() => setAvatar(cor)}
          >
            <RoboSVG cor={cor} tamanho={56} />
          </button>
        ))}
      </div>

      <label className="campo">
        Apelido (de brincadeira):
        <input
          type="text"
          value={nome}
          maxLength={16}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex.: Estrelinha"
        />
      </label>

      <div className="botoes-linha">
        <button className="botao" onClick={() => irPara("menu")}>
          Voltar
        </button>
        <button className="botao botao-primario" onClick={comecar}>
          Começar
        </button>
      </div>
    </section>
  );
}
