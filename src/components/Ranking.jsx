import { useEffect, useState } from "react";
import { listarRanking } from "../lib/ranking.js";
import { listarRankingGlobal, rankingGlobalAtivo } from "../lib/rankingGlobal.js";
import RoboSVG from "./RoboSVG.jsx";

// Ranking geral dos exploradores por pontuação.
// Pontos vêm das estrelas + do brilho das badges (ver src/game/badges.js).
//
// Se o Supabase estiver configurado, mostra o ranking GLOBAL (todo mundo que
// joga, em qualquer aparelho). Se não estiver — ou se a internet falhar —
// cai sozinho no ranking LOCAL (localStorage), como era antes.
const MEDALHAS = ["🥇", "🥈", "🥉"];

const comPontos = (lista) => (lista || []).filter((j) => (j.pontos || 0) > 0);

export default function Ranking({ irPara }) {
  // Já nasce com o ranking LOCAL: a tela aparece preenchida na hora, sem
  // piscar o "ninguém pontuou ainda" enquanto o global não chega.
  const [jogadores, setJogadores] = useState(() => comPontos(listarRanking()));
  const [carregando, setCarregando] = useState(rankingGlobalAtivo());
  const [global, setGlobal] = useState(false);

  useEffect(() => {
    let vivo = true;
    if (!rankingGlobalAtivo()) return undefined;

    listarRankingGlobal().then((lista) => {
      if (!vivo) return;
      if (lista) {
        setJogadores(comPontos(lista));
        setGlobal(true);
      }
      setCarregando(false);
    });

    return () => {
      vivo = false;
    };
  }, []);

  return (
    <section className="tela tela-ranking" aria-label="Ranking dos exploradores">
      <h2 className="titulo">🏆 Ranking {global ? "Global" : ""}</h2>

      {carregando && jogadores.length === 0 ? (
        <p className="subtitulo">Buscando os exploradores do universo… 🚀</p>
      ) : jogadores.length === 0 ? (
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
