import { useEffect } from "react";
import { useJogador } from "../context/JogadorContext.jsx";
import { falar, pararFala } from "../lib/fala.js";

// Equipe do projeto (ordem e cargos conforme informados). O RGM fica discreto,
// abaixo do nome. Cada cargo ganha um ícone para a leitura visual das crianças.
const EQUIPE = [
  { rgm: "42315093", nome: "Elvis Brisol Pinheiro Alves", papel: "Product Owner", icone: "🎯" },
  { rgm: "43554148", nome: "Felipe Lima da Silva", papel: "Scrum Master", icone: "🌀" },
  { rgm: "41964179", nome: "Marcelo Félix da Silva", papel: "Desenvolvedor Backend", icone: "🛠️" },
  { rgm: "41745485", nome: "Bruno Figueiró", papel: "Desenvolvedor Backend", icone: "🛠️" },
  { rgm: "43730701", nome: "Evellyn Balduino do Nascimento", papel: "Desenvolvedor Frontend", icone: "🎨" },
  { rgm: "43677676", nome: "Ryan Lucas Gimenes", papel: "Desenvolvedor Frontend", icone: "🎨" },
  { rgm: "43678904", nome: "Gustavo Alves da Silva", papel: "QA", icone: "🔍" },
  { rgm: "45582688", nome: "Caio Cesar Dias da Silva", papel: "Desenvolvedor Backend", icone: "🛠️" },
];

// Tela de Créditos: mostra a equipe que construiu as Aventuras do CosmoBot.
export default function Creditos({ irPara }) {
  const { narracao } = useJogador();

  useEffect(() => {
    if (narracao) falar("Créditos. Equipe que criou as Aventuras do CosmoBot.");
    return () => pararFala();
  }, [narracao]);

  return (
    <section className="tela tela-creditos" aria-label="Créditos">

      <h2 className="titulo">Créditos</h2>
      <p className="subtitulo">Equipe que ajudou o CosmoBot a decolar 🚀</p>

      <ul className="lista-creditos" aria-label="Integrantes da equipe">
        {EQUIPE.map((p) => (
          <li className="credito-item" key={p.rgm}>
            <span className="credito-icone" aria-hidden="true">{p.icone}</span>
            <span className="credito-texto">
              <span className="credito-nome">{p.nome}</span>
              <span className="credito-papel">{p.papel}</span>
              <span className="credito-rgm">RGM {p.rgm}</span>
            </span>
          </li>
        ))}
      </ul>

      <p className="creditos-rodape">Universidade Cruzeiro do Sul</p>

      <div className="botoes-linha">
        <button className="botao" onClick={() => irPara("menu")}>
          Voltar
        </button>
      </div>
    </section>
  );
}
