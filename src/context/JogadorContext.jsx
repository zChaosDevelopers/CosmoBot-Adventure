import { createContext, useContext, useEffect, useState } from "react";
import { setNarracaoAtiva } from "../lib/fala.js";
import { setSomLigado as setSomLigadoSfx } from "../lib/sfx.js";

// Guarda as informações do jogador (avatar, apelido) e as opções de
// acessibilidade, salvando tudo no navegador (localStorage) — sem enviar
// nenhum dado pessoal real para servidores.
const JogadorContext = createContext(null);

export function JogadorProvider({ children }) {
  const [apelido, setApelido] = useState(() => localStorage.getItem("apelido") || "");
  // avatar agora é a COR do robô (ex.: "#51cf66").
  const [avatar, setAvatar] = useState(() => {
    const salvo = localStorage.getItem("avatar");
    return salvo && /^#[0-9a-fA-F]{6}$/.test(salvo) ? salvo : "#51cf66";
  });
  const [contrasteAlto, setContrasteAlto] = useState(
    () => localStorage.getItem("contrasteAlto") === "true"
  );
  const [fonteGrande, setFonteGrande] = useState(
    () => localStorage.getItem("fonteGrande") === "true"
  );
  // Narração por voz (audiodescrição) — DESLIGADA por padrão.
  const [narracao, setNarracaoState] = useState(
    () => localStorage.getItem("narracao") === "true"
  );
  // Efeitos sonoros do jogo — LIGADOS por padrão.
  const [somLigado, setSomLigadoState] = useState(
    () => localStorage.getItem("somLigado") !== "false"
  );

  useEffect(() => localStorage.setItem("apelido", apelido), [apelido]);
  useEffect(() => localStorage.setItem("avatar", avatar), [avatar]);

  // Aplica/remove as classes de acessibilidade no <body>.
  useEffect(() => {
    localStorage.setItem("contrasteAlto", contrasteAlto);
    document.body.classList.toggle("contraste-alto", contrasteAlto);
  }, [contrasteAlto]);

  useEffect(() => {
    localStorage.setItem("fonteGrande", fonteGrande);
    document.body.classList.toggle("fonte-grande", fonteGrande);
  }, [fonteGrande]);

  // Persiste a narração e mantém a lib de fala sincronizada.
  useEffect(() => {
    localStorage.setItem("narracao", narracao);
    setNarracaoAtiva(narracao);
  }, [narracao]);

  // Persiste o som e mantém a lib de efeitos sincronizada.
  useEffect(() => {
    localStorage.setItem("somLigado", somLigado);
    setSomLigadoSfx(somLigado);
  }, [somLigado]);

  // Setters que atualizam o estado do React E a lib na hora (evita "corrida"
  // quando uma tela tenta narrar logo após ligar a narração).
  function setNarracao(v) {
    setNarracaoAtiva(v);
    setNarracaoState(v);
  }
  function setSomLigado(v) {
    setSomLigadoSfx(v);
    setSomLigadoState(v);
  }

  const valor = {
    apelido, setApelido,
    avatar, setAvatar,
    contrasteAlto, setContrasteAlto,
    fonteGrande, setFonteGrande,
    narracao, setNarracao,
    somLigado, setSomLigado,
  };

  return <JogadorContext.Provider value={valor}>{children}</JogadorContext.Provider>;
}

// Atalho para usar o contexto nos componentes: const { apelido } = useJogador();
export function useJogador() {
  const ctx = useContext(JogadorContext);
  if (!ctx) throw new Error("useJogador precisa estar dentro de <JogadorProvider>");
  return ctx;
}
