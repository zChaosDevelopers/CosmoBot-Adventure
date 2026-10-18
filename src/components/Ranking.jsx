import { listarRanking } from "../lib/ranking.js";
import RoboSVG from "./RoboSVG.jsx";

// Ranking geral LOCAL (por aparelho): mostra os exploradores por pontuação.
// Pontos vêm das estrelas + do brilho das badges (ver src/game/badges.js).
const MEDALHAS = ["🥇", "🥈", "🥉"];

export default function Ranking({ irPara }) {
  const jogadores = listarRanking().filter((j) => (j.pontos || 0) > 0);

  return (
    <section className="tela tela-ranking" aria-label="Ranking dos exploradores">
      <h2 className="titulo">🏆 Ranking</h2>

      {jogadores.length === 0 ? (
        <p className="subtitulo">
          Ninguém pontuou ainda! Jogue uma fase para aparecer aqui. 🚀
        </p>
      ) : (
        <ol className="lista-ranking" aria-label="Classificação">
          {jogadores.map((j, i) => (
            <li key={j.chave} className={"item-ranking" + (i < 3 ? " top" : "")}>
              <span className="posicao" aria-hidden="true">
                {MEDALHAS[i] || i + 1}
              </span>
              <span className="icone-ranking">
                <RoboSVG cor={j.icone} tamanho={40} />
              </span>
              <span className="nome-ranking">
                {j.nome} {j.perfeito && <span title="Aventura perfeita!">👑</span>}
              </span>
              <span className="pontos-ranking">
                <strong>{j.pontos}</strong>
                <small>⭐{j.estrelas} · 🏅{j.badges}</small>
              </span>
            </li>
          ))}
        </ol>
      )}

      <button className="botao" onClick={() => irPara("menu")}>
        Voltar ao menu
      </button>
    </section>
  );
}
