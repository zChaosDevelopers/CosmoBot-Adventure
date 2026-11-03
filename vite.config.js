import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

// Número de versão mostrado nos Créditos: vem do package.json (campo "version")
// e do commit que gerou o build (Vercel informa VERCEL_GIT_COMMIT_SHA; local usa o git).
const pacote = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));
function commitCurto() {
  const daVercel = process.env.VERCEL_GIT_COMMIT_SHA;
  if (daVercel) return daVercel.slice(0, 7);
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "";
  }
}

// Configuração do Vite (ferramenta que roda e empacota o projeto).
// base: "./" garante que o jogo funcione dentro do iframe do Cruzeiro HUB.
export default defineConfig({
  base: "./",
  define: {
    __APP_VERSAO__: JSON.stringify(pacote.version),
    __APP_COMMIT__: JSON.stringify(commitCurto()),
    __APP_DATA__: JSON.stringify(new Date().toISOString().slice(0, 10)),
  },
  plugins: [
    react(),
    // PWA: o jogo pode ser INSTALADO e funciona OFFLINE (bom para tablets de
    // sala de aula). O service worker guarda os arquivos no cache do aparelho.
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["assets/logo-cruzeiro.png", "assets/lua.png", "assets/planeta.png"],
      manifest: {
        name: "Aventuras do CosmoBot",
        short_name: "CosmoBot",
        description: "Jogo educativo de matemática para crianças de 6 a 10 anos.",
        lang: "pt-BR",
        theme_color: "#140a33",
        background_color: "#0b1120",
        display: "standalone",
        orientation: "any",
        icons: [
          { src: "assets/logo-cruzeiro.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "assets/logo-cruzeiro.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "assets/logo-cruzeiro.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // O Phaser é grande; aumenta o limite para o jogo caber no cache offline.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,png,svg,woff2,woff,ttf,mp3}"],
      },
    }),
  ],
});
