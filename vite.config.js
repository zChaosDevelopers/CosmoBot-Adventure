import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Configuração do Vite (ferramenta que roda e empacota o projeto).
// base: "./" garante que o jogo funcione dentro do iframe do Cruzeiro HUB.
export default defineConfig({
  base: "./",
  plugins: [react()],
});
