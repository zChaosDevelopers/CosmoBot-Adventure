// Ranking GLOBAL (Supabase) — camada opcional por cima do ranking local.
//
// Regra de ouro: NADA aqui pode quebrar o jogo. Se o Supabase não estiver
// configurado (src/lib/supabase.js exporta null quando faltam as variáveis
// VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY), ou se a rede/tabela falhar,
// todas as funções devolvem "não deu" em silêncio e quem chama usa o
// localStorage (src/lib/ranking.js) como antes.
//
// A tabela é criada com supabase/tabela-ranking.sql.

import { supabase } from "./supabase.js";

const TABELA = "ranking";
const COLUNAS = "chave,nome,icone,pontos,estrelas,badges,perfeito,quando";

// Rede de criança não espera: se o servidor demorar demais (celular no 3G,
// wi-fi da escola caindo), desistimos e usamos o ranking local.
const LIMITE_MS = 6000;

function comTempoLimite(promessa, ms = LIMITE_MS) {
  return Promise.race([
    promessa,
    new Promise((resolve) => setTimeout(() => resolve({ demorou: true }), ms)),
  ]);
}

// true quando o jogo está ligado a um projeto Supabase.
export function rankingGlobalAtivo() {
  return !!supabase;
}

// Lê os melhores do mundo. Devolve um array (pode ser vazio) ou null se o
// global não estiver disponível — o null é o sinal para usar o local.
export async function listarRankingGlobal(limite = 50) {
  if (!supabase) return null;
  try {
    const { data, error, demorou } = await comTempoLimite(
      supabase
        .from(TABELA)
        .select(COLUNAS)
        .order("pontos", { ascending: false })
        .order("quando", { ascending: true })
        .limit(limite),
    );
    if (demorou || error) return null;
    return data || [];
  } catch {
    return null;
  }
}

// Grava o MELHOR resultado do jogador (upsert pela chave).
// Chamada "fire-and-forget": nunca lança, nunca trava a fase.
export async function enviarPontuacaoGlobal({
  chave,
  nome,
  icone,
  pontos = 0,
  estrelas = 0,
  badges = 0,
  perfeito = false,
}) {
  if (!supabase || !chave) return false;
  try {
    // Só sobrescreve se o novo resultado for igual ou melhor (mesma regra do
    // ranking local). Assim quem rejoga uma fase mal não perde o recorde.
    const { data: atual, demorou } = await comTempoLimite(
      supabase.from(TABELA).select("pontos").eq("chave", chave).maybeSingle(),
    );
    if (demorou) return false;
    if (atual && (atual.pontos || 0) > pontos) return false;

    const { error } = await supabase.from(TABELA).upsert(
      {
        chave,
        nome: String(nome || "").trim() || "Explorador",
        icone: String(icone || ""),
        pontos,
        estrelas,
        badges,
        perfeito,
        quando: new Date().toISOString(),
      },
      { onConflict: "chave" },
    );
    return !error;
  } catch {
    return false;
  }
}
