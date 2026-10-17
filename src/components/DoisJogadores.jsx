import { useState } from "react";
import RoboSVG from "./RoboSVG.jsx";

// Tela de preparação do MODO 2 JOGADORES.
//
// Pouca digitação de propósito (o público tem 6 a 10 anos): já vem tudo
// preenchido e dá para começar só apertando "Começar". O que realmente importa
// aqui é escolher A OPERAÇÃO que vai cair na disputa.
const CORES = ["#4cc9f0", "#ff922b", "#51cf66", "#f72585", "#ffd43b", "#b197fc"];

const OPERACOES = [
  { id: "misto", rotulo: "Misturado", icone: "🎲" },
  { id: "soma", rotulo: "Soma", icone: "➕" },
  { id: "subtracao", rotulo: "Subtração", icone: "➖" },
  { id: "multiplicacao", rotulo: "Multiplicação", icone: "✖️" },
  { id: "divisao", rotulo: "Divisão", icone: "➗" },
];

export default function DoisJogadores({ irPara, aoComecar }) {
  const [nome1, setNome1] = useState("Jogador 1");
  const [nome2, setNome2] = useState("Jogador 2");
  const [cor1, setCor1] = useState("#4cc9f0");
  const [cor2, setCor2] = useState("#ff922b");
  const [operacao, setOperacao] = useState("misto");

  const comecar = () =>
    aoComecar({
      nome1: nome1.trim() || "Jogador 1",
      nome2: nome2.trim() || "Jogador 2",
      cor1,
      cor2,
      operacao,
      rodadas: 5,
    });

  const cartao = (n, nome, setNome, cor, setCor, teclas) => (
    <div className="cartao-jogador">
      <RoboSVG cor={cor} tamanho={64} />
      <label className="rotulo-mini" htmlFor={`nome-j${n}`}>
        Jogador {n}
      </label>
      <input
        id={`nome-j${n}`}
        className="campo-versus"
        value={nome}
        maxLength={14}
        onChange={(e) => setNome(e.target.value)}
      />
      <div className="cores-jogador" role="group" aria-label={`Cor do jogador ${n}`}>
        {CORES.map((c) => (
          <button
            key={c}
            type="button"
            className={"bolinha-cor" + (c === cor ? " ativa" : "")}
            style={{ background: c }}
            aria-label={`Cor ${c}`}
            aria-pressed={c === cor}
            onClick={() => setCor(c)}
          />
        ))}
      </div>
      <p className="teclas-jogador">
        Teclas: <strong>{teclas}</strong>
      </p>
    </div>
  );

  return (
    <section className="tela tela-versus" aria-label="Modo dois jogadores">
      <h2 className="titulo">👥 2 Jogadores</h2>
      <p className="subtitulo">
        Os dois veem a mesma conta. Quem apertar primeiro na resposta certa leva o ponto!
      </p>

      <div className="jogadores-versus">
        {cartao(1, nome1, setNome1, cor1, setCor1, "A S D")}
        <span className="versus-x" aria-hidden="true">
          ×
        </span>
        {cartao(2, nome2, setNome2, cor2, setCor2, "← ↓ →")}
      </div>

      <fieldset className="escolha-operacao">
        <legend>Qual conta vai cair?</legend>
        <div className="opcoes-operacao">
          {OPERACOES.map((o) => (
            <button
              key={o.id}
              type="button"
              className={"botao botao-operacao" + (o.id === operacao ? " ativo" : "")}
              aria-pressed={o.id === operacao}
              onClick={() => setOperacao(o.id)}
            >
              <span aria-hidden="true">{o.icone}</span> {o.rotulo}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="botoes-menu">
        <button className="botao botao-primario" onClick={comecar}>
          Começar
        </button>
        <button className="botao" onClick={() => irPara("menu")}>
          Voltar
        </button>
      </div>
    </section>
  );
}
