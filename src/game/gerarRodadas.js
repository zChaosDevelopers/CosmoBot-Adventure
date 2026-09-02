import Phaser from "phaser";

// Embaralha uma lista (ordem aleatória).
function embaralhar(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Phaser.Math.Between(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Gera 3 opções: a resposta certa + 2 "quase certas", tudo dentro de [min, max].
// "espalhar" controla a distância máxima dos distratores (padrão 2). Em fases
// com números maiores (multiplicação/divisão) um espalhamento maior deixa as
// alternativas menos "coladas".
function gerarOpcoes(correta, min, max, espalhar = 2) {
  const set = new Set([correta]);
  // Se o intervalo é pequeno demais para 3 valores distintos, alarga um pouco.
  const teto = Math.max(max, min + 2);
  let tentativas = 0;
  while (set.size < 3 && tentativas < 50) {
    tentativas++;
    let d = correta + Phaser.Math.Between(-espalhar, espalhar);
    d = Phaser.Math.Clamp(d, min, teto);
    if (d !== correta || set.size === 0) set.add(d);
  }
  return embaralhar([...set]);
}

// Gera N rodadas com quantidades ALEATÓRIAS entre min e max (padrão 1 a 10).
// Evita repetir a mesma quantidade em rodadas seguidas. Como é chamada toda
// vez que a fase começa, o jogo é SEMPRE diferente a cada partida.
export function gerarRodadas(n = 3, min = 1, max = 10) {
  const rodadas = [];
  let anterior = null;
  for (let i = 0; i < n; i++) {
    let q;
    do {
      q = Phaser.Math.Between(min, max);
    } while (q === anterior);
    anterior = q;
    rodadas.push({ quantidade: q, opcoes: gerarOpcoes(q, min, max) });
  }
  return rodadas;
}

// Gera N rodadas de SOMA (Fase 2): dois grupos "a" e "b" (cada um de min a max)
// e a resposta é a soma. Ex.: min=1, max=5 => somas de 2 a 10. As opções ficam
// dentro do intervalo possível das somas. Evita repetir a mesma soma seguida.
export function gerarRodadasSoma(n = 3, min = 1, max = 5) {
  const somaMin = min * 2;
  const somaMax = max * 2;
  const rodadas = [];
  let anterior = null;
  for (let i = 0; i < n; i++) {
    let a, b, soma;
    do {
      a = Phaser.Math.Between(min, max);
      b = Phaser.Math.Between(min, max);
      soma = a + b;
    } while (soma === anterior);
    anterior = soma;
    rodadas.push({ a, b, quantidade: soma, opcoes: gerarOpcoes(soma, somaMin, somaMax) });
  }
  return rodadas;
}

// Gera N rodadas de SUBTRAÇÃO (Planeta 3 — "Lua Minguante"): mostra um total de
// cristais e alguns "se apagam". A resposta é quantos continuam acesos.
// "a" = total de cristais, "b" = quantos se apagam, "quantidade" = a - b.
// Ex.: min=5, max=12 => totais de 5 a 12, resultado sempre >= 1.
export function gerarRodadasSubtracao(n = 3, min = 5, max = 12) {
  const rodadas = [];
  let anterior = null;
  for (let i = 0; i < n; i++) {
    let a, b, resto;
    do {
      a = Phaser.Math.Between(min, max);
      b = Phaser.Math.Between(1, a - 1); // sobra pelo menos 1 aceso
      resto = a - b;
    } while (resto === anterior);
    anterior = resto;
    rodadas.push({ a, b, quantidade: resto, opcoes: gerarOpcoes(resto, 1, max) });
  }
  return rodadas;
}

// Gera N rodadas de MULTIPLICAÇÃO (Planeta 4 — "Nebulosa dos Grupos"): mostra
// "grupos" grupos IGUAIS com "porGrupo" cristais cada. A resposta é o total.
// Modelo de ARRANJO (fileiras iguais), ótimo para introduzir a multiplicação.
// Ex.: maxGrupos=4, maxPorGrupo=5 => até 4 x 5 = 20 cristais.
export function gerarRodadasMultiplicacao(n = 3, maxGrupos = 4, maxPorGrupo = 5) {
  const produtoMax = maxGrupos * maxPorGrupo;
  const rodadas = [];
  let anterior = null;
  for (let i = 0; i < n; i++) {
    let grupos, porGrupo, produto;
    do {
      grupos = Phaser.Math.Between(2, maxGrupos);
      porGrupo = Phaser.Math.Between(2, maxPorGrupo);
      produto = grupos * porGrupo;
    } while (produto === anterior);
    anterior = produto;
    rodadas.push({
      grupos,
      porGrupo,
      quantidade: produto,
      opcoes: gerarOpcoes(produto, 2, produtoMax, 3),
    });
  }
  return rodadas;
}

// Gera N rodadas de DIVISÃO (Planeta 5 — "Portal Compartilhar"): reparte um
// total de cristais igualmente entre "divisor" robôs. A resposta é quantos
// cristais cada robô recebe (divisão EXATA, sem resto).
// "total" = cristais, "divisor" = robôs, "quantidade" = total / divisor.
// Ex.: maxDivisor=4, maxQuociente=5 => totais de 4 a 20, sempre exatos.
export function gerarRodadasDivisao(n = 3, maxDivisor = 4, maxQuociente = 5) {
  const rodadas = [];
  let anterior = null;
  for (let i = 0; i < n; i++) {
    let divisor, quociente, total;
    do {
      divisor = Phaser.Math.Between(2, maxDivisor);
      quociente = Phaser.Math.Between(2, maxQuociente);
      total = divisor * quociente;
    } while (quociente === anterior);
    anterior = quociente;
    rodadas.push({
      total,
      divisor,
      quantidade: quociente,
      opcoes: gerarOpcoes(quociente, 1, maxQuociente, 2),
    });
  }
  return rodadas;
}
