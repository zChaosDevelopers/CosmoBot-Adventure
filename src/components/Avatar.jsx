import { useState } from "react";
import { useJogador } from "../context/JogadorContext.jsx";
import { TEMA } from "../game/tema.js";
import { nomeDisponivel, registrarJogador } from "../lib/ranking.js";
import RoboSVG from "./RoboSVG.jsx";

// Tela para escolher a COR do robô e digitar um apelido de brincadeira.
export default function Avatar({ irPara }) {
  const { apelido, setApelido, avatar, setAvatar } = useJogador();
  const [nome, setNome] = useState(apelido);
  const [erro, setErro] = useState("");

  function comecar() {
    const limpo = nome.trim() || "Explorador";
    // Regra de nome único: bloqueia se JÁ existe alguém com o mesmo nome E o
    // mesmo robô. Basta trocar a COR do robô (ou o nome) para liberar.
    if (!nomeDisponivel(limpo, avatar)) {
      setErro("Já existe um explorador com esse nome e esse robô! Escolha outra cor de robô ou mude o nome. 🤖");
      return;
    }
    registrarJogador(limpo, avatar);
    setApelido(limpo);
    irPara("jogo");
  }

  // Trocar a cor do robô limpa o aviso (a nova combinação pode estar livre).
  function escolherAvatar(cor) {
    setAvatar(cor);
    setErro("");
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
            onClick={() => escolherAvatar(cor)}
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
          onChange={(e) => {
            setNome(e.target.value);
            setErro("");
          }}
          placeholder="Ex.: Estrelinha"
        />
      </label>

      {erro && (
        <p className="aviso-nome" role="alert">
          {erro}
        </p>
      )}

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
