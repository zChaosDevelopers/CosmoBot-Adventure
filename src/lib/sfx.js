// Efeitos sonoros gerados na hora com a Web Audio API (sem arquivos de áudio).
// Todos os sons passam por um "master gain" (volume geral), assim dá para
// LIGAR/DESLIGAR o som pelo próprio jogo — sem depender de mutar a aba do
// navegador (que, além disso, não silencia a narração por voz).

let ctx;
let master;

// Preferência salva no navegador (o som começa ligado por padrão).
let somLigado =
  typeof localStorage === "undefined" || localStorage.getItem("somLigado") !== "false";

function ac() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = somLigado ? 1 : 0;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

// Liga/desliga todos os efeitos sonoros do jogo.
export function setSomLigado(ligado) {
  somLigado = !!ligado;
  if (master) master.gain.value = somLigado ? 1 : 0;
}

export function somEstaLigado() {
  return somLigado;
}

function bip(freq, dur = 0.12, tipo = "sine", vol = 0.18, quando = 0) {
  if (!somLigado) return; // som desligado → nem cria o oscilador
  const a = ac();
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = tipo;
  o.frequency.value = freq;
  const t = a.currentTime + quando;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master); // passa pelo volume geral
  o.start(t);
  o.stop(t + dur);
}

// "Pling!" — som de sino brilhante quando o cristal entra na barra.
// Sobe de tom a cada cristal (sensação de progresso).
export function pling(i = 0) {
  const base = 900 + i * 80;
  bip(base, 0.16, "sine", 0.2); // nota principal
  bip(base * 2, 0.1, "sine", 0.08, 0.01); // brilho (harmônico)
}

// "Plim" suave — quando o mouse passa por cima de um cristal.
export function plingHover() {
  bip(1180, 0.08, "sine", 0.1);
  bip(1770, 0.05, "sine", 0.04, 0.006);
}

// Clique de botão — curtinho e discreto.
export function somClique() {
  bip(520, 0.05, "square", 0.06);
}

// Acerto — duas notas alegres.
export function somAcerto() {
  bip(523, 0.12, "triangle", 0.18);
  bip(784, 0.16, "triangle", 0.18, 0.1);
}

// Erro — som suave e curto, NUNCA punitivo.
export function somErro() {
  bip(320, 0.16, "sine", 0.12);
}

// Vitória — pequena fanfarra ascendente.
export function somVitoria() {
  [523, 659, 784, 1046, 1318].forEach((f, i) => bip(f, 0.22, "triangle", 0.2, i * 0.14));
}

// Quando a aba fica oculta, pausamos o áudio; ao voltar, retomamos (se ligado).
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend?.();
    else if (somLigado) ctx.resume?.();
  });
}
