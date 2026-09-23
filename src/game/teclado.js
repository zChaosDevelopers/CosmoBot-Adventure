// Anti-"spam" de teclado (corrige o gap: apertar Enter repetido atravessava as
// cenas — começar história, entrar na fase, responder — passando fases sozinho).
//
// A ideia: qualquer AÇÃO de teclado que RESPONDE ou AVANÇA (Enter/Espaço) só vale
// se passou um tempo mínimo desde a última — e esse tempo é COMPARTILHADO entre
// as cenas (guardado no registry). Assim um mesmo "rajada" de Enters não dispara
// ações em cadeia quando uma cena começa logo após a outra. A navegação por
// setas (mover o foco) NÃO passa por aqui — só as ações que confirmam.

const INTERVALO_MS = 450;

// Retorna true (e "consome" a ação) só se já deu para agir de novo. Ignora também
// os eventos de auto-repetição do teclado (tecla segurada).
export function podeAgir(scene, evento) {
  if (evento && evento.repeat) return false;
  const r = scene.registry;
  const agora = Date.now();
  const ultima = r.get("ultimaAcaoTeclado") || 0;
  if (agora - ultima < INTERVALO_MS) return false;
  r.set("ultimaAcaoTeclado", agora);
  return true;
}
