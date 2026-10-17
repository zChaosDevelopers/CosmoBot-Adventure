-- =====================================================================
-- RANKING GLOBAL do "Aventuras do CosmoBot"
-- Rode este script UMA VEZ no editor SQL do Supabase (menu "SQL Editor").
-- Depois preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env
-- (local) e nas Environment Variables da Vercel.
--
-- Guardamos só um APELIDO fictício + a cor do robô. Nunca dados pessoais.
-- Se a tabela não existir (ou as variáveis estiverem vazias), o jogo cai
-- automaticamente no ranking LOCAL (localStorage) e continua funcionando.
-- =====================================================================

create table if not exists ranking (
  -- identidade do jogador: apelido normalizado + "|" + cor do robô
  chave     text        primary key,
  nome      text        not null,
  icone     text        not null default '',
  pontos    integer     not null default 0,
  estrelas  integer     not null default 0,
  badges    integer     not null default 0,
  perfeito  boolean     not null default false,
  quando    timestamptz not null default now()
);

-- Deixa rápido o "melhores primeiro, empate pelo mais antigo".
create index if not exists ranking_pontos_idx on ranking (pontos desc, quando asc);

-- -------------------------------------------------------------------
-- Travas de sanidade: o jogo tem 8 fases; nada pode passar disso.
-- (Impede que alguém chame a API direto e invente pontuações absurdas.)
-- -------------------------------------------------------------------
alter table ranking drop constraint if exists ranking_limites;
alter table ranking add constraint ranking_limites check (
  pontos   between 0 and 1000 and
  estrelas between 0 and 24   and
  badges   between 0 and 8    and
  length(nome) between 1 and 40 and
  length(chave) between 1 and 80
);

-- -------------------------------------------------------------------
-- RLS: leitura e gravação anônimas (o jogo é público e sem login).
-- -------------------------------------------------------------------
alter table ranking enable row level security;

drop policy if exists "ranking leitura publica"    on ranking;
drop policy if exists "ranking insercao publica"   on ranking;
drop policy if exists "ranking atualizacao publica" on ranking;

create policy "ranking leitura publica"
  on ranking for select using (true);

create policy "ranking insercao publica"
  on ranking for insert with check (true);

create policy "ranking atualizacao publica"
  on ranking for update using (true) with check (true);
