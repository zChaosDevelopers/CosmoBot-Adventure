# Roteiro de narração — Aventuras do CosmoBot

Falas prontas para gerar em uma voz de IA (ElevenLabs, Edge TTS, Google TTS…).
Gere cada linha, salve o **MP3** com o **nome exato** da tabela **nesta pasta**
(`public/audios/`). Depois é só avisar que eu ligo os áudios no jogo.

## Como gravar (dicas de voz)

- **Voz:** feminina, jovem, simpática, em **português do Brasil**.
- **Tom:** animado e acolhedor, como quem conta uma historinha para criança pequena.
- **Ritmo:** um pouco mais devagar que o normal, bem articulado.
- No ElevenLabs: *Stability* ~40–50%, *Similarity* ~75%, *Style* ~30% (ajuste a gosto).
- Fale com **energia positiva**; nas dicas e erros, tom **gentil** (nunca de bronca).

> **Importante:** as falas NÃO têm nome de criança nem números (eles mudam a cada
> partida). O elogio é sempre genérico ("Isso! Muito bem!"). Os números continuam
> aparecendo na tela — e, para quem ligar a narração do navegador, ela lê os números.

---

## 1. Boas-vindas e história

| Arquivo | Texto (fale exatamente assim) |
|---|---|
| `boas-vindas.mp3` | Bem-vindo às Aventuras do CosmoBot! Vamos brincar de matemática? |
| `historia-1.mp3` | O CosmoBot é um robô que adora viajar pelo espaço. |
| `historia-2.mp3` | Uma chuva de meteoros deixou a nave dele sem energia! |
| `historia-3.mp3` | Para voltar para casa, ele precisa consertar a nave. |
| `historia-4.mp3` | Cada etapa tem um desafio. Vamos ajudar o CosmoBot? |

## 2. Chegando em cada etapa (o mapa da nave)

| Arquivo | Texto |
|---|---|
| `etapa-contagem.mp3` | Primeiro conserto: ligar o painel. Vamos contar as luzes! |
| `etapa-soma.mp3` | Agora vamos abrir a comporta juntando as peças. |
| `etapa-subtracao.mp3` | Hora de encher as baterias. Algumas vão descarregar. |
| `etapa-multiplicacao.mp3` | Vamos ligar os motores enchendo cada um por igual. |
| `etapa-divisao.mp3` | Último conserto: repartir o combustível entre os tanques. |

## 3. O que fazer em cada fase (a tarefa)

| Arquivo | Texto |
|---|---|
| `tarefa-contagem.mp3` | Conte as luzes acesas e escolha o número. |
| `tarefa-soma.mp3` | Arraste as peças das duas caixas para o núcleo. |
| `tarefa-subtracao.mp3` | Descarregue as células que o robô pediu. |
| `tarefa-multiplicacao.mp3` | Coloque a mesma quantidade em cada motor. |
| `tarefa-divisao.mp3` | Reparta o combustível igualzinho em cada tanque. |

## 4. Durante o jogo (reações)

| Arquivo | Texto |
|---|---|
| `acerto.mp3` | Isso! Muito bem! |
| `erro.mp3` | Quase! Vamos tentar de novo. |
| `dica.mp3` | Olha só: faça assim, igual em cada um. |
| `estourou.mp3` | Ops! Os balões estouraram. Vamos tentar outra! |

## 5. Fim de etapa e final

| Arquivo | Texto |
|---|---|
| `etapa-ok.mp3` | Etapa concluída! Você é demais! |
| `final.mp3` | A nave decolou! Você conseguiu! Parabéns! |

---

## Resumo dos arquivos (22 no total)

```
boas-vindas.mp3
historia-1.mp3  historia-2.mp3  historia-3.mp3  historia-4.mp3
etapa-contagem.mp3  etapa-soma.mp3  etapa-subtracao.mp3  etapa-multiplicacao.mp3  etapa-divisao.mp3
tarefa-contagem.mp3  tarefa-soma.mp3  tarefa-subtracao.mp3  tarefa-multiplicacao.mp3  tarefa-divisao.mp3
acerto.mp3  erro.mp3  dica.mp3  estourou.mp3
etapa-ok.mp3  final.mp3
```

Quando os MP3 estiverem aqui, o programador liga cada um no momento certo
(a narração continua sendo **opcional**, ligada na tela de Acessibilidade).
