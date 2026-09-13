-- Coluna extra na tabela clientes: guarda um resumo do(s) produto(s) do pedido mais
-- recente desse cliente (pedido do usuário — não é normalizado, é só uma referência
-- rápida visível na tabela de clientes do Supabase/no painel admin).
-- Você já adicionou essa coluna manualmente — este arquivo só documenta/garante que
-- ela exista, é seguro rodar de novo (idempotente).

alter table clientes add column if not exists produto text;
