import { useJogador } from "../context/JogadorContext.jsx";

// Tela com as opções de acessibilidade. As escolhas ficam salvas e valem
// para todas as telas do jogo.
export default function Acessibilidade({ irPara }) {
  const {
    contrasteAlto, setContrasteAlto,
    fonteGrande, setFonteGrande,
    narracao, setNarracao,
    somLigado, setSomLigado,
  } = useJogador();

  return (
    <section className="tela" aria-label="Configurações de acessibilidade">
      <h2 className="titulo">Acessibilidade</h2>

      <label className="opcao-switch">
        <input
          type="checkbox"
          checked={contrasteAlto}
          onChange={(e) => setContrasteAlto(e.target.checked)}
        />
        Contraste alto
      </label>

      <label className="opcao-switch">
        <input
          type="checkbox"
          checked={fonteGrande}
          onChange={(e) => setFonteGrande(e.target.checked)}
        />
        Fonte grande
      </label>

      <label className="opcao-switch">
        <input
          type="checkbox"
          checked={narracao}
          onChange={(e) => setNarracao(e.target.checked)}
        />
        <span className="opcao-narracao-texto">
          <span className="icone-narracao" aria-hidden="true">🦻</span>
          Narrar o jogo em voz alta
        </span>
      </label>

      <label className="opcao-switch">
        <input
          type="checkbox"
          checked={somLigado}
          onChange={(e) => setSomLigado(e.target.checked)}
        />
        <span className="opcao-narracao-texto">
          <span className="icone-narracao" aria-hidden="true">🔊</span>
          Efeitos sonoros do jogo
        </span>
      </label>

      <div className="botoes-linha">
        <button className="botao" onClick={() => irPara("menu")}>
          Voltar
        </button>
      </div>
    </section>
  );
}
