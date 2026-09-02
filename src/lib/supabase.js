import { createClient } from "@supabase/supabase-js";

// Lê as variáveis do arquivo .env (não vão para o GitHub).
const url = import.meta.env.VITE_SUPABASE_URL;
const chave = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Se as variáveis não estiverem preenchidas, o cliente fica nulo e o jogo
// continua funcionando normalmente (apenas sem gravar progresso).
export const supabase = url && chave ? createClient(url, chave) : null;
