import { useState } from "react";
import Menu from "./components/Menu.jsx";
import Avatar from "./components/Avatar.jsx";
import Instrucoes from "./components/Instrucoes.jsx";
import Acessibilidade from "./components/Acessibilidade.jsx";
import JogoCanvas from "./components/JogoCanvas.jsx";

// Controla qual tela está aparecendo. A navegação é simples: cada tela
// recebe a função "irPara" para trocar de tela.
export default function App() {
  const [tela, setTela] = useState("menu");

  return (
    <main className="app">
      {tela === "menu" && <Menu irPara={setTela} />}
      {tela === "avatar" && <Avatar irPara={setTela} />}
      {tela === "instrucoes" && <Instrucoes irPara={setTela} />}
      {tela === "acessibilidade" && <Acessibilidade irPara={setTela} />}
      {tela === "jogo" && <JogoCanvas irPara={setTela} />}
    </main>
  );
}
