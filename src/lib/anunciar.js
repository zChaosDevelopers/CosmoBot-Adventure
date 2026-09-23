// Leitura para leitores de tela: o jogo (Phaser, um <canvas>) não é lido por
// leitores de tela. Então mantemos uma região escondida no HTML com aria-live;
// quando o jogo "anuncia" algo (acertou, nova conta, etapa concluída), o texto
// aparece nessa região e o leitor de tela lê em voz alta — sem atrapalhar quem
// não usa leitor de tela (fica invisível na tela).

function regiao() {
  if (typeof document === "undefined") return null;
  let el = document.getElementById("anuncios-jogo");
  if (!el) {
    el = document.createElement("div");
    el.id = "anuncios-jogo";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    el.setAttribute("aria-atomic", "true");
    Object.assign(el.style, {
      position: "absolute",
      width: "1px",
      height: "1px",
      overflow: "hidden",
      clip: "rect(0 0 0 0)",
      clipPath: "inset(50%)",
      whiteSpace: "nowrap",
      border: "0",
      padding: "0",
      margin: "-1px",
    });
    document.body.appendChild(el);
  }
  return el;
}

export function anunciar(texto) {
  const r = regiao();
  if (!r || !texto) return;
  // Limpa e reescreve para o leitor reler mesmo que o texto se repita.
  r.textContent = "";
  setTimeout(() => {
    r.textContent = texto;
  }, 50);
}

export function limparAnuncios() {
  if (typeof document === "undefined") return;
  const r = document.getElementById("anuncios-jogo");
  if (r) r.remove();
}
