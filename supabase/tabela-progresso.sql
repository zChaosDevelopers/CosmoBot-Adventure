-- Tabela para guardar o progresso dos jogadores.
-- Rode este script no editor SQL do Supabase (menu "SQL Editor").
-- Guardamos apenas um apelido fictício, nunca dados pessoais reais.

create table if not exists progresso (
  id bigint generated always as identity primary key,
  apelido text not null,
  fase_id text not null,
  status text not null default 'concluida',
  criado_em timestamptz not null default now()
);
