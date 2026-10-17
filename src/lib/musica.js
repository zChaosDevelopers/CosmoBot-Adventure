// Música de fundo (item 6 do relatório de QA): toca em loop, BEM baixinho, e
// fica independente dos efeitos sonoros (sfx.js) e da narração (fala.js).
//
// Usa um <audio> comum (não Web Audio) porque é um ARQUIVO (loop longo), ao
// contrário dos efeitos de sfx.js que são sintetizados na hora. O arquivo fica
// em "public/audios/musica-fundo.mp3" — se ele não existir, a música
// simplesmente não toca (não quebra o jogo; ver público/audios/LEIA-ME.md).
//
// "Ducking": quando a narração (Web Speech) está falando, a música abaixa
// sozinha para não atrapalhar a compreensão (pedido do relatório: "evitar que
// a música prejudique a compreensão das instruções").

let audio = null;
let volumeBase = Number(typeof localStorage !== "undefined" && localStorage.getItem("musicaVolume")) || 0.18;
let ligada =
  typeof localStorage === "undefined" || localStorage.getItem("musicaLigada") !== "false";
let abaixada = false; // true enquanto a narração está falando (ducking)
let tentouTocar = false;

function elemento() {
  if (audio) return audio;
  if (typeof Audio === "undefined") return null;
  // Mesmo padrão de caminho relativo usado em game/assets.js — funciona tanto
  // na Vercel (raiz) quanto dentro do iframe do Cruzeiro HUB (base: "./").
  const base = import.meta.env.BASE_URL;
  audio = new Audio(`${base}audios/musica-fundo.mp3`);
  audio.loop = true;
  audio.preload = "auto";
  aplicarVolume();
  return audio;
}

function aplicarVolume() {
  if (!audio) return;
  const alvo = ligada ? (abaixada ? volumeBase * 0.35 : volumeBase) : 0;
  audio.volume = Math.max(0, Math.min(1, alvo));
}

// Chame numa resposta a um gesto do usuário (clique/toque/tecla) — os
// navegadores bloqueiam áudio com som antes de qualquer interação.
export function iniciarMusica() {
  const el = elemento();
  if (!el || !ligada) return;
  tentouTocar = true;
  el.play().catch(() => {
    /* ainda sem gesto do usuário, ou arquivo ausente: tenta de novo depois */
  });
}

export function pararMusica() {
  audio?.pause();
}

export function setMusicaLigada(valor) {
  ligada = !!valor;
  try {
    localStorage.setItem("musicaLigada", ligada);
  } catch {
    /* localStorage indisponível */
  }
  aplicarVolume();
  if (ligada && tentouTocar) iniciarMusica();
}

export function musicaEstaLigada() {
  return ligada;
}

// volume: 0 a 1 (o controle da tela usa 0 a 100 e divide por 100).
export function setVolumeMusica(volume) {
  volumeBase = Math.max(0, Math.min(1, volume));
  try {
    localStorage.setItem("musicaVolume", volumeBase);
  } catch {
    /* localStorage indisponível */
  }
  aplicarVolume();
}

export function volumeMusica() {
  return volumeBase;
}

// Usado por lib/fala.js: abaixa a música enquanto a narração fala, e volta ao
// volume normal quando ela termina.
export function duckMusica(ativo) {
  abaixada = !!ativo;
  aplicarVolume();
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (!audio) return;
    if (document.hidden) audio.pause();
    else if (ligada) iniciarMusica();
  });
}
