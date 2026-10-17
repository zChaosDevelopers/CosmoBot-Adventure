import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { JogadorProvider } from "./context/JogadorContext.jsx";
import "./index.css";

// Ponto de entrada do React: monta o App dentro da <div id="root">.
// O JogadorProvider guarda avatar, apelido e as opções de acessibilidade.
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <JogadorProvider>
      <App />
    </JogadorProvider>
  </React.StrictMode>
);
