import { fase01 } from "./fase01.js";
import { fase02 } from "./fase02.js";
import { fase03 } from "./fase03.js";
import { fase04 } from "./fase04.js";
import { fase05 } from "./fase05.js";

// Os 5 planetas da aventura do CosmoBot, na ordem de jogo (dificuldade
// crescente): Contagem → Soma → Subtração → Multiplicação → Divisão.
// Para criar novas fases, basta importar e adicionar aqui.
export const fases = [fase01, fase02, fase03, fase04, fase05];
