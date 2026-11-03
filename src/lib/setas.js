// Navegação por SETAS entre botões irmãos (menu, cores, operações…), para quem
// joga só com o teclado: ↓/→ vão para o próximo, ↑/← para o anterior (dando a
// volta no fim da lista). Use como onKeyDown do elemento que contém os botões.
// O foco só move entre botões; quem escolhe é o Enter/Espaço do próprio botão.
export function setasEntreBotoes(e, seletor = "button") {
  const proximo = e.key === "ArrowDown" || e.key === "ArrowRight";
  const anterior = e.key === "ArrowUp" || e.key === "ArrowLeft";
  if (!proximo && !anterior) return;
  const botoes = [...e.currentTarget.querySelectorAll(seletor)].filter((b) => !b.disabled);
  const i = botoes.indexOf(document.activeElement);
  if (i < 0) return;
  e.preventDefault();
  botoes[(i + (proximo ? 1 : -1) + botoes.length) % botoes.length].focus();
}
