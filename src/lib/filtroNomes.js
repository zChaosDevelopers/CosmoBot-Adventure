// Filtro de nomes impróprios (apelidos, nomes do modo 2 jogadores e ranking).
//
// Público de 6 a 10 anos: nada de palavrão, ofensa ou termo adulto aparecendo
// na tela, no ranking ou numa narração. O filtro é tolerante a disfarces comuns
// ("p u t a", "pvta", "put4", "puuuta", "p.u.t.a", "PUTA123") mas evita bloquear
// nomes normais: palavras CURTAS só valem se forem o nome inteiro (ou uma palavra
// do nome), e só as longas valem como prefixo/pedaço — por isso "Computador",
// "Cuca" ou "Alexandre" passam.
//
// Para bloquear mais termos, é só acrescentar na lista abaixo (minúsculo, sem
// acento). Tamanho do termo decide como compara:
//   ≤ 4 letras → a palavra tem que ser IGUAL ao termo;
//   ≥ 5 letras → vale se a palavra COMEÇA com o termo (plural, diminutivo…);
//   ≥ 7 letras → vale em qualquer pedaço do nome (ex.: "xcaralhox").

const TERMOS = [
  // palavrões e xingamentos (pt-BR)
  "puta", "puto", "putaria", "putinha", "caralho", "porra", "merda", "bosta", "cu", "cuzao",
  "buceta", "bct", "xoxota", "xereca", "ppk", "pqp", "vsf", "fdp", "tnc", "foder", "foda",
  "fodase", "fuder", "cacete", "arrombado", "arrombada", "desgraca", "desgracado", "vagabundo",
  "vagabunda", "vadia", "vadio", "piranha", "prostituta", "otario", "otaria", "idiota",
  "imbecil", "babaca", "retardado", "retardada", "tarado", "tarada", "corno", "corna",
  "cretino", "cretina", "escroto", "escrota", "nojento", "nojenta", "lixo",
  // sexo / corpo
  "sexo", "sexy", "porno", "pornografia", "penis", "piroca", "pirocudo", "rola",
  "pica", "punheta", "siririca", "gozar", "gozada", "tesao", "transar", "anal", "nude", "nudes",
  // ofensas preconceituosas
  "viado", "viada", "bicha", "boiola", "sapatao", "crioulo", "crioula", "macaco", "macaca",
  "nazista", "hitler", "racista",
  // violência / drogas
  "estupro", "estuprador", "suicidio", "maconha", "cocaina", "crack",
  // inglês
  "fuck", "fucker", "fucking", "shit", "bitch", "dick", "cock", "pussy", "cunt", "whore",
  "slut", "asshole", "bastard", "nigger", "nigga", "fag", "faggot", "porn", "rape", "sex",
];

// Termos ambíguos que também são palavras comuns/nomes: só valem como palavra
// INTEIRA (nunca como começo de palavra), para não barrar "Pintor", "Rolando",
// "Picanha" etc.
const SOMENTE_INTEIRA = new Set(["rola", "pica", "lixo", "crack", "anal", "macaco", "macaca", "corno", "corna", "foda"]);

const LEET = { 0: "o", 1: "i", 3: "e", 4: "a", 5: "s", 7: "t", "@": "a", $: "s", "!": "i", "|": "i", "€": "e" };

function semAcento(s) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// Junta letras repetidas ("puuuuta" → "puta") — mas deixa "rr"/"ss" de nomes reais
// intactos quando comparamos por igualdade com o original também.
function colapsar(s) {
  return s.replace(/(.)\1+/g, "$1");
}

// Variantes de uma palavra para comparar (com leet traduzido, sem dígitos, sem repetição).
function variantes(palavra) {
  const comLeet = palavra.replace(/[0-9@$!|€]/g, (c) => LEET[c] || "");
  const semDigitos = palavra.replace(/[0-9@$!|€]/g, "");
  const base = [palavra, comLeet, semDigitos];
  const todas = new Set();
  base.forEach((v) => {
    const limpa = v.replace(/[^a-z]/g, "");
    if (limpa) {
      todas.add(limpa);
      todas.add(colapsar(limpa));
    }
  });
  return [...todas];
}

function bate(v, termo) {
  if (v === termo) return true;
  if (SOMENTE_INTEIRA.has(termo)) return false;
  if (termo.length >= 7 && v.includes(termo)) return true;
  if (termo.length >= 5 && v.startsWith(termo)) return true;
  return false;
}

// true se o texto contém algum termo impróprio.
export function nomeImproprio(texto) {
  const original = semAcento(String(texto || "").toLowerCase());
  if (!original.trim()) return false;

  // 1) Palavra por palavra (separadas por espaço, ponto, traço, sublinhado…).
  const palavras = original.split(/[\s._\-+*,;:/\\]+/).filter(Boolean);
  for (const p of palavras) {
    for (const v of variantes(p)) {
      if (TERMOS.some((t) => bate(v, t))) return true;
    }
  }

  // 2) Tudo junto, sem separadores ("p u t a", "p.u.t.a", "c a r a l h o").
  const junto = original.replace(/[\s._\-+*,;:/\\]+/g, "");
  if (junto !== palavras[0]) {
    for (const v of variantes(junto)) {
      // Texto emendado só pega o nome INTEIRO igual ao termo ou termos longos
      // (evita falsos positivos juntando palavras normais).
      if (TERMOS.some((t) => v === t || (t.length >= 7 && v.includes(t)))) return true;
    }
  }
  return false;
}

// Resultado pronto para a tela: { ok, motivo }.
export function validarNome(texto) {
  if (nomeImproprio(texto)) {
    return { ok: false, motivo: "Esse apelido não pode ser usado. Escolha outro nome bem legal! 🌟" };
  }
  return { ok: true, motivo: "" };
}

// Para exibir nomes que já estavam salvos (ranking local/global): se for
// impróprio, mostra um nome neutro no lugar.
export function nomeSeguro(texto, padrao = "Explorador") {
  return nomeImproprio(texto) ? padrao : texto;
}
