import { supabase } from "./supabase.js";

// Salva o progresso de uma fase. Na Sprint 01, se o Supabase ainda não
// estiver configurado, apenas registra no console (não trava o jogo).
export async function salvarProgresso({ apelido, faseId, status = "concluida" }) {
  if (!supabase) {
    console.log(`[progresso] ${apelido} — ${faseId}: ${status} (Supabase não configurado)`);
    return;
  }
  const { error } = await supabase
    .from("progresso")
    .insert({ apelido, fase_id: faseId, status });
  if (error) console.error("Erro ao salvar progresso:", error.message);
}

// Lê as fases já concluídas por um apelido.
export async function carregarProgresso(apelido) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("progresso")
    .select("fase_id, status")
    .eq("apelido", apelido);
  if (error) {
    console.error("Erro ao carregar progresso:", error.message);
    return [];
  }
  return data;
}
