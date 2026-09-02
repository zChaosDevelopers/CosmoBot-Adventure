import { falar } from "../lib/fala.js";

// Botão que narra um texto em voz alta (voz do navegador, com a melhor voz
// em português disponível). Ver src/lib/fala.js.
export default function BotaoAudio({ texto, rotulo = "Ouvir" }) {
  return (
    <button type="button" className="botao botao-audio" onClick={() => falar(texto)} aria-label={rotulo}>
      🔊 {rotulo}
    </button>
  );
}
