// Confirmação por teclado (Enter / Espaço) — UM único ponto de entrada por cena.
//
// O problema que isto resolve: cada tela/pop-up/botão registrava o PRÓPRIO
// listener de Enter. Quando duas coisas existiam ao mesmo tempo (pop-up aberto +
// resposta em foco, "Continuar" + pausa, um pop-up fechado com o mouse mas com o
// listener ainda pendurado…) um único Enter disparava VÁRIAS ações — fechava o
// pop-up E respondia a conta, recomeçava a fase, pulava a tela de conclusão etc.
// E chamar .off("keydown-ENTER") sem a função apagava o listener dos outros.
//
// Como funciona agora:
//   • Cada cena liga UM listener (iniciarConfirmacao) para Enter e Espaço.
//   • Quem precisa do Enter coloca uma CAMADA numa pilha (empilharConfirmacao);
//     só a camada do TOPO recebe o Enter. Pop-up aberto → só o pop-up responde.
//     Fechou (por tecla OU mouse) → a camada sai e a de baixo volta a valer.
//   • A camada BASE (definirConfirmacaoBase) é a ação normal da tela (responder a
//     opção em foco, juntar a próxima peça, "Começar aventura"…).
//   • Anti-spam: ignora tecla segurada (auto-repeat), Enter "herdado" da tela
//     anterior (logo depois da cena abrir) e rajadas rápidas (intervalo mínimo
//     compartilhado entre as cenas, guardado no registry).
//   • Navegação por setas NÃO passa por aqui — só o que confirma/avança.

const INTERVALO_MS = 450; // intervalo mínimo entre duas confirmações (qualquer cena)
const INTERVALO_PECAS_MS = 220; // fases de arrastar: Enter junta uma peça por vez, então pode ser mais ágil
const CARENCIA_MS = 350; // logo que a cena abre, ignora Enter (pode ser o da tela anterior)
const TECLAS = ["keydown-ENTER", "keydown-SPACE"];

// ===== Anti-spam (usado também por quem ainda trata tecla fora das camadas) =====
// true (e "consome" a ação) só se já deu para agir de novo.
export function podeAgir(scene, evento) {
  if (evento && evento.repeat) return false;
  const r = scene.registry;
  const agora = Date.now();
  const ultima = r.get("ultimaAcaoTeclado") || 0;
  if (agora - ultima < INTERVALO_MS) return false;
  r.set("ultimaAcaoTeclado", agora);
  return true;
}

// ===== Camadas =====

// true quando o foco está num controle HTML de verdade (botão da barra "Som / Tela
// cheia / Menu", campo, controle de volume…). Aí o Enter/Espaço é DELE — o próprio
// navegador já aciona o controle — e o jogo não deve reagir junto (era o que
// ligava a tela cheia e respondia a conta no mesmo Enter).
function focoEmControleHtml() {
  const el = typeof document !== "undefined" ? document.activeElement : null;
  if (!el || el === document.body || el.tagName === "CANVAS") return false;
  return /^(BUTTON|A|INPUT|SELECT|TEXTAREA|SUMMARY)$/.test(el.tagName) || el.getAttribute?.("role") === "button";
}

function despachar(scene, evento) {
  const pilha = scene._confirmacao;
  if (!pilha) return;
  if (evento && evento.repeat) return; // tecla segurada não vale
  if (focoEmControleHtml()) return; // o controle HTML focado fica com a tecla
  if (Date.now() - scene._confirmacaoDesde < CARENCIA_MS) return; // Enter herdado
  const topo = pilha.camadas[pilha.camadas.length - 1];
  if (!topo || !topo.fn) return;

  const r = scene.registry;
  const agora = Date.now();
  const ultima = r.get("ultimaAcaoTeclado") || 0;
  if (agora - ultima < (topo.intervalo ?? INTERVALO_MS)) return; // rajada rápida

  // A ação pode devolver false = "não havia nada a fazer" (ex.: nenhuma opção em
  // foco). Aí o Enter não gasta o intervalo anti-spam e o próximo vale na hora.
  const resultado = topo.fn(evento);
  if (resultado !== false) r.set("ultimaAcaoTeclado", Date.now());
}

function desligar(scene) {
  if (scene._confirmacaoListener) {
    TECLAS.forEach((t) => scene.input?.keyboard?.off(t, scene._confirmacaoListener));
    scene._confirmacaoListener = null;
  }
  scene._confirmacao = null;
}

// Liga (ou religa do zero) a confirmação da cena. Chamar no create() — o Phaser
// reaproveita a instância da cena, então tudo é recomeçado a cada entrada.
export function iniciarConfirmacao(scene) {
  desligar(scene);
  scene._confirmacao = { camadas: [{ id: "base", fn: null }] };
  scene._confirmacaoDesde = Date.now();
  scene._confirmacaoListener = (e) => despachar(scene, e);
  TECLAS.forEach((t) => scene.input.keyboard.on(t, scene._confirmacaoListener));
  scene.events.once("shutdown", () => desligar(scene));
}

// Ação normal da tela (camada de baixo). Passe null para "nada a confirmar".
// opts.intervalo: tempo mínimo entre duas confirmações (ms); o padrão protege
// ações que mudam de tela. opts.pecas = true usa o intervalo curto das fases de
// arrastar, onde cada Enter só junta/descarta UMA peça (apertar várias vezes é o esperado).
export function definirConfirmacaoBase(scene, fn, opts = {}) {
  if (!scene._confirmacao) iniciarConfirmacao(scene);
  const base = scene._confirmacao.camadas[0];
  base.fn = fn || null;
  base.intervalo = opts.pecas ? INTERVALO_PECAS_MS : opts.intervalo;
}

// Coloca uma camada por cima (pop-up, pausa, "Continuar"…). Devolve a função que
// a remove — chame-a ao fechar, seja por tecla ou por mouse. Pode ser chamada mais
// de uma vez sem problema.
export function empilharConfirmacao(scene, fn) {
  if (!scene._confirmacao) iniciarConfirmacao(scene);
  const pilha = scene._confirmacao;
  const camada = { fn };
  pilha.camadas.push(camada);
  return () => {
    const i = pilha.camadas.indexOf(camada);
    if (i > 0) pilha.camadas.splice(i, 1);
  };
}
