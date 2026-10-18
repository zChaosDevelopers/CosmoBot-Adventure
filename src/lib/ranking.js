// Banco de dados LOCAL (localStorage) do RANKING geral (item 23 do roadmap).
// Guarda por jogador: nome + ícone (a cor do robô) + melhor pontuação/estrelas/
// badges. É por APARELHO (um ranking global de verdade exigiria servidor).
//
// Regra de NOME ÚNICO (definida no projeto):
// - normalizar(nome) remove ESPAÇOS (pontos "." contam; espaços não) e ignora
//   maiúsculas/minúsculas.
// - A chave de identidade é (nomeNormalizado + ícone). Bloqueia começar se já
//   existir o MESMO nome normalizado COM o MESMO ícone; permite se o ícone for
//   diferente, ou se o nome normalizado for diferente (ex.: por causa de um ".").

const CHAVE = "cosmobot.ranking";

export function normalizar(nome) {
  return String(nome || "").toLowerCase().replace(/\s+/g, "");
}

export function chaveJogador(nome, icone) {
  return normalizar(nome) + "|" + String(icone || "");
}

function ler() {
  try {
    const v = JSON.parse(localStorage.getItem(CHAVE));
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function salvar(lista) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(lista));
  } catch {
    /* localStorage indisponível (aba privada etc.) — ignora */
  }
}

// Ranking ordenado: mais pontos primeiro; empate pelo mais antigo.
export function listarRanking() {
  return ler()
    .slice()
    .sort((a, b) => (b.pontos || 0) - (a.pontos || 0) || (a.quando || 0) - (b.quando || 0));
}

// true se o par (nome normalizado + ícone) ainda NÃO existe.
export function nomeDisponivel(nome, icone) {
  const chave = chaveJogador(nome, icone);
  return !ler().some((j) => j.chave === chave);
}

// Cria o jogador (se ainda não existir). Idempotente. Retorna a chave.
export function registrarJogador(nome, icone) {
  const chave = chaveJogador(nome, icone);
  const lista = ler();
  if (!lista.some((j) => j.chave === chave)) {
    lista.push({
      chave,
      nome: String(nome || "").trim() || "Explorador",
      icone: String(icone || ""),
      pontos: 0,
      estrelas: 0,
      badges: 0,
      perfeito: false,
      quando: Date.now(),
    });
    salvar(lista);
  }
  return chave;
}

// Atualiza a pontuação do jogador guardando sempre o MELHOR resultado.
export function atualizarPontuacao(chave, { pontos = 0, estrelas = 0, badges = 0, perfeito = false }) {
  const lista = ler();
  const j = lista.find((x) => x.chave === chave);
  if (!j) return;
  if (pontos >= (j.pontos || 0)) {
    j.pontos = pontos;
    j.estrelas = estrelas;
    j.badges = badges;
    j.perfeito = perfeito;
    j.quando = Date.now();
    salvar(lista);
  }
}
