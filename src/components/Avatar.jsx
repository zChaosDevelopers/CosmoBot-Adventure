import { useRef, useState } from "react";
import { useJogador } from "../context/JogadorContext.jsx";
import { TEMA } from "../game/tema.js";
import { nomeDisponivel, registrarJogador } from "../lib/ranking.js";
import { validarNome } from "../lib/filtroNomes.js";
import RoboSVG from "./RoboSVG.jsx";

// Tela para escolher a COR do robô e digitar um apelido de brincadeira.
export default function Avatar({ irPara }) {
  const { apelido, setApelido, avatar, setAvatar } = useJogador();
  const [nome, setNome] = useState(apelido);
  const [erro, setErro] = useState("");
  const botaoComecar = useRef(null);

  function comecar() {
    const limpo = nome.trim() || "Explorador";
    const nomeOk = validarNome(limpo);
    if (!nomeOk.ok) {
      setErro(nomeOk.motivo);
      return;
    }
    // Regra de nome único: bloqueia se JÁ existe alguém com o mesmo nome E o
    // mesmo robô. Basta trocar a COR do robô (ou o nome) para liberar.
    if (!nomeDisponivel(limpo, avatar)) {
      setErro("Já existe um explorador com esse nome e esse robô! Escolha outra cor de robô ou mude o nome. 🤖");
      return;
    }
    registrarJogador(limpo, avatar);
    setApelido(limpo);
    // Tira o foco do <input> do DOM antes de abrir o jogo — senão o campo de
    // texto continua "segurando" o teclado e as setas/Enter não chegam no jogo.
    if (typeof document !== "undefined") document.activeElement?.blur?.();
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

      <div
        className="grade-avatares"
        role="radiogroup"
        aria-label="Cores de robô"
        onKeyDown={(e) => {
          // Setas navegam entre as cores do robô (acessibilidade por teclado).
          const cores = TEMA.coresRobo;
          let i = cores.indexOf(avatar);
          if (i < 0) i = 0;
          let ni = null;
          if (e.key === "ArrowRight" || e.key === "ArrowDown") ni = (i + 1) % cores.length;
          else if (e.key === "ArrowLeft" || e.key === "ArrowUp") ni = (i - 1 + cores.length) % cores.length;
          if (ni != null) {
            e.preventDefault();
            escolherAvatar(cores[ni]);
            e.currentTarget.querySelectorAll("button")[ni]?.focus();
          }
        }}
      >
        {TEMA.coresRobo.map((cor, i) => (
          <button
            key={cor}
            type="button"
            // Um grupo de opções é UMA parada do Tab (a cor escolhida); as setas andam entre as cores.
            tabIndex={(TEMA.coresRobo.includes(avatar) ? avatar === cor : i === 0) ? 0 : -1}
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
          onKeyDown={(e) => {
            // 1º Enter no apelido só move o foco para "Começar"; o 2º Enter (agora
            // com o foco no botão) inicia o jogo.
            if (e.key === "Enter") {
              e.preventDefault();
              botaoComecar.current?.focus();
            }
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
        <button ref={botaoComecar} className="botao botao-primario" onClick={comecar}>
          Começar
        </button>
      </div>
    </section>
  );
}
