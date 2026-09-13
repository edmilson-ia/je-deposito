-- Numeração amigável de clientes (1, 2, 3...) para exibição, mantendo o id (uuid)
-- como chave primária interna usada pelos relacionamentos (pedidos.cliente_id etc.).
alter table clientes add column if not exists numero integer;

with numerados as (
  select id, row_number() over (order by criado_em asc) as rn
  from clientes
)
update clientes c set numero = n.rn
from numerados n
where n.id = c.id and c.numero is null;

create sequence if not exists clientes_numero_seq owned by clientes.numero;
select setval('clientes_numero_seq', greatest((select max(numero) from clientes), 1));

alter table clientes alter column numero set default nextval('clientes_numero_seq');
alter table clientes alter column numero set not null;
alter table clientes add constraint clientes_numero_key unique (numero);
