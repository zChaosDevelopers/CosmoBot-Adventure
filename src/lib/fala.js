// Narração por voz do navegador (Web Speech API), com escolha da melhor voz
// em português disponível e um tom mais suave/amigável para crianças.
// Para narração REALMENTE natural, o ideal é usar áudios gravados (ver README
// e a recomendação de ferramentas). Isto é o melhor possível sem arquivos.
//
// IMPORTANTE: a narração só acontece se estiver ATIVADA pelo jogador (checkbox
// no menu). Fora isso, o jogo toca apenas os efeitos sonoros normais.

let vozPt = null;

// Estado da narração — começa lendo a preferência salva no navegador para que
// as cenas do Phaser (que não usam o contexto do React) já saibam de início.
let narracaoAtiva =
  typeof localStorage !== "undefined" && localStorage.getItem("narracao") === "true";

function escolherVoz() {
  if (!("speechSynthesis" in window)) return;
  const vozes = window.speechSynthesis.getVoices() || [];
  vozPt =
    // 1ª preferência: vozes "naturais"/online (Edge/Chrome) em pt-BR
    vozes.find((v) => /pt-BR/i.test(v.lang) && /natural|google|francisca|thalita/i.test(v.name)) ||
    // 2ª: qualquer pt-BR
    vozes.find((v) => /pt-BR/i.test(v.lang)) ||
    // 3ª: qualquer português
    vozes.find((v) => /^pt/i.test(v.lang)) ||
    null;
}

if ("speechSynthesis" in window) {
  escolherVoz();
  // As vozes carregam de forma assíncrona no Chrome/Edge.
  window.speechSynthesis.onvoiceschanged = escolherVoz;
}

// Liga/desliga a narração. Ao desligar, interrompe qualquer fala em andamento.
export function setNarracaoAtiva(ativa) {
  narracaoAtiva = !!ativa;
  if (!narracaoAtiva) pararFala();
}

export function narracaoEstaAtiva() {
  return narracaoAtiva;
}

// Interrompe imediatamente qualquer narração em andamento.
export function pararFala() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

export function falar(texto, { pitch = 1.15, rate = 0.9 } = {}) {
  if (!narracaoAtiva) return; // narração desligada → não fala
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel(); // interrompe fala anterior
  const u = new SpeechSynthesisUtterance(texto);
  u.lang = "pt-BR";
  if (vozPt) u.voice = vozPt;
  u.pitch = pitch; // um pouco mais agudo = mais amigável
  u.rate = rate; // um pouco mais devagar = mais claro para crianças
  window.speechSynthesis.speak(u);
}

// A narração (TTS) NÃO é silenciada ao "mutar" a aba do navegador em vários
// navegadores. Então, quando a aba fica oculta, paramos a fala por conta própria.
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pararFala();
  });
}
