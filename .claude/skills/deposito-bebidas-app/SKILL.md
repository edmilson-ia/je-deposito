---
name: deposito-bebidas-app
description: Use esta skill sempre que o usuário pedir para criar, desenvolver, planejar ou melhorar um aplicativo/catálogo digital para depósito de bebidas, distribuidora de bebidas/alimentos, adega ou negócio similar de venda de bebidas. Cobre catálogo de produtos, pedidos via WhatsApp, pagamento Pix, sincronização de estoque (Google Sheets/Supabase), agente de vendas com IA e arquitetura multi-tenant para atender vários clientes desse nicho. Acione também para pedidos como "app de depósito", "catálogo de bebidas", "sistema de pedidos de bebidas", "agente WhatsApp bebidas/distribuidora", mesmo que o usuário não use a palavra "skill".
---

# App para Depósito/Distribuidora de Bebidas

Skill para acelerar a criação de aplicativos de venda para depósitos de bebidas, distribuidoras de alimentos/bebidas e adegas — baseada em projetos reais já entregues (catálogo digital, agente de vendas via WhatsApp).

## Quando usar

- Cliente novo pedindo catálogo digital ou app de vendas para depósito/distribuidora de bebidas
- Construir ou evoluir um agente de vendas via WhatsApp para esse nicho
- Integrar pedidos com Pix, controle de estoque ou dashboard de gerenciamento
- Adaptar um projeto existente desse tipo para um novo cliente (whitelabel)

## Descoberta rápida (perguntar antes de começar)

Não assuma — pergunte ao usuário (ou ao cliente dele) o que for necessário:

1. **Catálogo**: quantos produtos, quantas categorias, tem fotos prontas ou precisa gerar/tratar imagens?
2. **Canal de pedido**: só WhatsApp, ou também um site/app com carrinho?
3. **Pagamento**: só Pix manual (cliente manda comprovante) ou Pix automático via Mercado Pago/outro gateway?
4. **Estoque**: fonte da verdade é Google Sheets, Supabase, ou outro ERP?
5. **Volume esperado**: 1 cliente (projeto único) ou vários clientes na mesma base (multi-tenant)?
6. **Quem confirma pedidos**: humano (atendente) ou 100% automático?

## Stack padrão recomendado

Baseado no que já funcionou em projetos anteriores — não é obrigatório, mas é o ponto de partida:

| Camada | Ferramenta padrão |
|---|---|
| Frontend catálogo | React + TypeScript (TanStack Start ou Vite) + Tailwind + shadcn/ui |
| Backend/dados | Supabase (Postgres) |
| Automação/orquestração | n8n (self-host via Docker, na própria VPS Hostinger) |
| Mensageria WhatsApp | Avisa API (ou Meta Cloud API/Twilio se o cliente já tiver) |
| Pagamento | Pix via Mercado Pago |
| Planilha de estoque (fallback) | Google Sheets + Apps Script, sincronizado via n8n |
| Deploy do app | VPS Hostinger (Ubuntu + Nginx + Node.js), com SSL via Let's Encrypt/Certbot |

Se o projeto for pequeno e o cliente não precisar de manutenção contínua, um **single-file React/HTML** com catálogo embutido (imagens em base64) resolve mais rápido.

### Convenção para hospedar na VPS Hostinger

Como a VPS hospeda múltiplos projetos de agentes/automações, seguir o mesmo padrão dos outros:

- Cada app roda numa porta própria (Node.js) por trás do Nginx como reverse proxy
- Um subdomínio por cliente/projeto (ex: `cliente.seudominio.com`), com certificado SSL via Certbot
- n8n roda como um serviço único na VPS (Docker) e atende todos os clientes — diferenciar tenant pelo número de WhatsApp ou pelo webhook de origem, não subir uma instância de n8n por cliente
- n8n fica ocioso e só é acionado via **webhook** quando o cliente manda mensagem no WhatsApp — não roda polling nem processos contínuos, é 100% orientado a evento

## Modelo de dados de referência

### Tabelas Supabase (single-tenant)

```sql
produtos (id, nome, categoria, preco, unidade, estoque, imagem_url, ativo)
clientes (id, nome, telefone, endereco)
pedidos (id, cliente_id, status, total, forma_pagamento, criado_em)
itens_pedido (id, pedido_id, produto_id, quantidade, preco_unitario)
```

### Se for atender vários clientes (multi-tenant)

Adicionar `tenant_id` em todas as tabelas acima + RLS policies por tenant. n8n identifica o tenant pelo número de WhatsApp que recebeu a mensagem. (Ver padrão já usado: tabelas `tenants`, `usuarios`, `agente_config`, `conhecimento`, `conversas`.)

## Fluxo de pedido via WhatsApp (padrão validado)

O workflow do n8n é acionado por **webhook** assim que chega mensagem no WhatsApp — não fica rodando/consultando nada em background.

1. Cliente manda mensagem no WhatsApp com os itens desejados → dispara o webhook do n8n
2. IA extrai os itens em JSON estruturado (nome, quantidade) — usar few-shot com exemplos de mensagens reais de clientes
3. Sistema confere estoque disponível (Google Sheets ou Supabase) e monta o resumo do pedido
4. Gera cobrança Pix (ou pede confirmação manual, dependendo do fluxo escolhido na descoberta)
5. Node de espera (Wait) até webhook de confirmação de pagamento
6. Dá baixa no estoque
7. Confirma pedido pro cliente e (se aplicável) aciona fluxo de recuperação de carrinho/lead se o pedido ficar parado

Para o fallback manual: staff confirma pagamento direto numa tabela `pedidos` no Supabase, e o n8n dispara a mensagem de confirmação via API do WhatsApp.

## Estrutura de arquivos (apps de catálogo em React)

```
/src/routes/          → páginas (index, catalogo, contato, empresa, cadastro)
/src/components/      → ProductCard, CartSheet, AppHeader, etc.
/src/lib/             → cart.tsx, utils.ts
/src/data/catalog.ts  → dados dos produtos (ou fetch do Supabase)
```

## Checklist de MVP → produção

**Fase 1 — crítico**
- Lazy loading de imagens (essencial acima de ~100 produtos)
- Paginação ou virtualization na listagem
- Validação de formulários com Zod
- Error handling com toasts (feedback visual de erro/sucesso)

**Fase 2 — importante**
- Dark mode
- Sistema de favoritos
- Meta tags dinâmicas (SEO/compartilhamento)
- Animações de feedback (adicionar ao carrinho, etc.)

**Fase 3 — nice-to-have**
- Histórico de pedidos
- Compartilhamento de catálogo/produto
- Filtros avançados (categoria, faixa de preço, marca)
- Analytics de navegação

## Boas práticas específicas

- **Imagens de produto**: se vierem soltas (PNG/JFIF), preparar os dados (nome, categoria, base64 se for single-file) mas **não inserir automaticamente no catálogo** sem o cliente confirmar cada produto — evita erro de categorização.
- **Controle do cliente**: por padrão, não implementar mudanças de catálogo/preço automaticamente — perguntar antes de cada alteração, a menos que o usuário diga explicitamente para automatizar.
- **Exportação**: manter o catálogo exportável em JSON, caso precise migrar para outra ferramenta no futuro.
- **Nomenclatura de erros de API de pagamento**: erro 403 no Mercado Pago geralmente é status de qualidade da conta/integração — verificar isso antes de assumir bug de código.
