-- Schema inicial — J.E Alimentos e Destilados
-- Rode este script uma vez no SQL Editor do seu projeto Supabase
-- (Dashboard > SQL Editor > New query > colar e rodar).

create extension if not exists "pgcrypto";

create table if not exists produtos (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  descricao text,
  categoria text,
  preco numeric(10, 2) not null,
  unidade text,
  estoque integer not null default 0,
  imagem_url text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text not null unique,
  endereco text,
  criado_em timestamptz not null default now()
);

create table if not exists pedidos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id),
  status text not null default 'aguardando_pagamento'
    check (status in ('aguardando_pagamento', 'pago', 'cancelado', 'entregue')),
  total numeric(10, 2) not null,
  forma_pagamento text not null default 'pix',
  pix_copia_cola text,
  origem text not null default 'catalogo_web' check (origem in ('catalogo_web', 'whatsapp')),
  criado_em timestamptz not null default now(),
  confirmado_em timestamptz
);

create table if not exists itens_pedido (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references pedidos(id) on delete cascade,
  produto_id uuid not null references produtos(id),
  quantidade integer not null check (quantidade > 0),
  preco_unitario numeric(10, 2) not null
);

-- Configuração/senha do painel admin (linha única, id sempre = 1)
create table if not exists admin_config (
  id integer primary key default 1 check (id = 1),
  senha_hash text not null,
  codigo_recuperacao_hash text,
  codigo_recuperacao_expira timestamptz,
  atualizado_em timestamptz not null default now()
);

-- Baixa de estoque atômica (usada ao confirmar pagamento de um pedido)
create or replace function baixar_estoque(p_produto_id uuid, p_quantidade integer)
returns void
language sql
as $$
  update produtos
    set estoque = greatest(estoque - p_quantidade, 0), atualizado_em = now()
    where id = p_produto_id;
$$;

create index if not exists idx_produtos_categoria on produtos (categoria);
create index if not exists idx_pedidos_cliente on pedidos (cliente_id);
create index if not exists idx_itens_pedido_pedido on itens_pedido (pedido_id);

-- RLS: toda a escrita/leitura sensível passa pelo backend (service role, que sempre
-- ignora RLS). Deixamos apenas leitura pública do catálogo ativo liberada, para o caso
-- de o front-end vir a consultar o Supabase diretamente com a chave anônima no futuro.
alter table produtos enable row level security;
alter table clientes enable row level security;
alter table pedidos enable row level security;
alter table itens_pedido enable row level security;
alter table admin_config enable row level security;

drop policy if exists "Catálogo ativo é público" on produtos;
create policy "Catálogo ativo é público" on produtos
  for select using (ativo = true);
