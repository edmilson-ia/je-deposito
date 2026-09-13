---
name: deposito-bebidas-app
description: Use esta skill sempre que o usuário pedir para criar, desenvolver, planejar ou melhorar um aplicativo/catálogo digital para depósito de bebidas, distribuidora de bebidas/alimentos, adega ou negócio similar de venda de bebidas. Cobre catálogo de produtos, pedidos via WhatsApp, pagamento Pix, sincronização de estoque (Google Sheets/Supabase), agente de vendas com IA e arquitetura multi-tenant para atender vários clientes desse nicho. Acione também para pedidos como "app de depósito", "catálogo de bebidas", "sistema de pedidos de bebidas", "agente WhatsApp bebidas/distribuidora", mesmo que o usuário não use a palavra "skill".
---

# App para Depósito/Distribuidora de Bebidas

Skill para acelerar a criação de aplicativos de venda para depósitos de bebidas, distribuidoras de alimentos/bebidas e adegas — baseada em projetos reais já entregues (catálogo digital, agente de vendas via WhatsApp). Validada de ponta a ponta no projeto "J.E Alimentos e Destilados" (catálogo + admin + painel de preços + deploy em produção).

## Quando usar

- Cliente novo pedindo catálogo digital ou app de vendas para depósito/distribuidora de bebidas
- Construir ou evoluir um agente de vendas via WhatsApp para esse nicho
- Integrar pedidos com Pix, controle de estoque ou dashboard de gerenciamento
- Adaptar um projeto existente desse tipo para um novo cliente (whitelabel)

## Descoberta rápida (perguntar antes de começar)

Não assuma — pergunte ao usuário (ou ao cliente dele) o que for necessário:

1. **Catálogo**: quantos produtos, quantas categorias, tem fotos prontas ou precisa gerar/tratar imagens?
2. **Canal de pedido**: só WhatsApp, ou também um site/app com carrinho?
3. **Pagamento**: só Pix manual (cliente manda comprovante) ou Pix automático via Mercado Pago/outro gateway? **Pergunte se o cliente já tem conta em algum gateway — muitos depósitos pequenos só têm uma chave Pix (telefone/e-mail/CPF), sem PSP nenhum.**
4. **Estoque**: fonte da verdade é Google Sheets, Supabase, ou outro ERP?
5. **Volume esperado**: 1 cliente (projeto único) ou vários clientes na mesma base (multi-tenant)?
6. **Quem confirma pedidos**: humano (atendente) ou 100% automático?
7. **Quando identificar o cliente** (nome/telefone): na entrada do site ou só no fechamento do pedido? Ver seção "Timing de identificação do cliente" abaixo — isso já gerou retrabalho por ser assumido errado.
8. **Já existe VPS/hospedagem?** Se sim, perguntar se já roda outra coisa nela (n8n, outro app) antes de assumir que as portas 80/443 estão livres — ver "Hospedagem em VPS compartilhada".
9. **Domínio próprio já registrado?** Se ainda não, ver "Link temporário sem domínio" para não travar o projeto esperando o cliente comprar um domínio.

## Stack padrão recomendado

Baseado no que já funcionou em projetos anteriores — não é obrigatório, mas é o ponto de partida:

| Camada | Ferramenta padrão | Alternativa validada (cliente pequeno/sem gateway) |
|---|---|---|
| Frontend catálogo | React + TypeScript (Vite ou TanStack Start) + Tailwind | — |
| Backend/dados | Supabase (Postgres), RLS habilitado, service_role só no servidor | — |
| Automação/orquestração | n8n (self-host via Docker, na própria VPS Hostinger) | Pode ser **omitido** no MVP — confirmação de pagamento manual pelo dono direto num painel admin resolve sem n8n |
| Mensageria WhatsApp | Avisa API (ou Meta Cloud API/Twilio se o cliente já tiver) | Link `wa.me/<numero>?text=<mensagem>` — zero integração, funciona no primeiro dia, dá pra trocar por API depois sem refazer o app |
| Pagamento | Pix via Mercado Pago (cobrança automática) | **Pix "copia e cola" gerado localmente** (payload EMV, sem gateway) quando o cliente só tem uma chave Pix — ver `server/pix.ts` no projeto de referência. Confirmação vira manual (admin confere comprovante no WhatsApp e clica "confirmar" no painel) |
| Planilha de estoque (fallback) | Google Sheets + Apps Script, sincronizado via n8n | Sync via script simples lendo o CSV público (`gviz/tq?tqx=out:csv&sheet=<nome>`) — não precisa OAuth nem Apps Script |
| Deploy do app | VPS Hostinger (Ubuntu + Nginx + Node.js), SSL via Let's Encrypt/Certbot | Se a VPS já tiver **Traefik** rodando (comum quando já existe n8n self-host nela), reusar o Traefik em vez de instalar Nginx — ver seção dedicada abaixo |

Se o projeto for pequeno e o cliente não precisar de manutenção contínua, um **single-file React/HTML** com catálogo embutido (imagens em base64) resolve mais rápido.

## Timing de identificação do cliente (decisão de UX validada)

Cuidado: a intuição de "capturar todo visitante" (pedir nome+telefone assim que abre o site) parece boa para marketing, mas na prática **atrapalha a navegação e não é o que o dono do negócio costuma querer**. No projeto de referência isso foi tentado (a pedido do cliente) e depois revertido explicitamente.

**Padrão recomendado por padrão**: pedir nome + telefone numa única tela, **só no fechamento do pedido** (não na entrada do site nem espalhado em duas etapas). Guarde o telefone localmente (localStorage) para clientes recorrentes não precisarem recadastrar.

Só implemente identificação-na-entrada se o cliente pedir isso explicitamente E confirmar que entende o trade-off (fricção a mais antes de ver qualquer produto).

## Fluxo de pedido sem gateway de pagamento (padrão "confirmação manual via WhatsApp")

Quando o cliente não tem Mercado Pago/PSP nenhum, este fluxo já foi validado como suficiente e muito mais simples que orquestrar n8n + webhook de pagamento:

1. Cliente monta o carrinho, sem precisar se identificar antes.
2. No fechamento do pedido: tela única de nome + telefone.
3. Sistema grava `clientes`, cria `pedidos` + `itens_pedido`, gera o Pix copia-e-cola localmente (sem gateway).
4. **Não existe tela de pagamento dentro do app.** O cliente é redirecionado direto pro `wa.me` do depósito, com uma mensagem pré-formatada contendo o resumo do pedido + o código Pix.
5. Pagamento é confirmado por um humano: o dono vê o comprovante no WhatsApp e clica "Confirmar pagamento" no painel admin, o que dá baixa automática no estoque (função `baixar_estoque` no Postgres) e opcionalmente aciona um webhook (n8n → Avisa API) pra avisar o cliente.

Isso evita: gateway de pagamento, webhook de confirmação, e uma tela de Pix dentro do app que na prática não agrega nada quando a confirmação já é manual mesmo.

## Dois painéis administrativos (padrão recomendado, não só um)

Separar em dois painéis independentes, cada um com sua própria sessão/cookie, resolve bem dois públicos diferentes dentro do mesmo negócio:

1. **Painel principal** (`/admin`): login com senha (com recuperação por e-mail), telas de Pedidos (confirmar pagamento) e Clientes (cadastro/histórico). Uma tela inicial com botões grandes e separados por seção é mais fácil de usar no celular do que abas pequenas.
2. **Painel de preços** (`/precos`, ex.): versão simplificada, só para o dono (ou funcionário de confiança) alterar preço de produto rapidamente pelo celular, sem precisar entender o resto do sistema. Pode usar **credenciais fixas** (ex: usuário = telefone do dono, senha fixa combinada) se o cliente pedir simplicidade em vez de segurança robusta — deixar isso explícito como decisão do cliente. Botão "Esqueci a senha" pode simplesmente abrir o WhatsApp do próprio usuário cadastrado pedindo troca manual.
   - O catálogo público deve dar **polling automático** (ex: a cada 30s) pra refletir mudanças de preço sem o cliente precisar recarregar a página.

## Modelo de dados de referência

### Tabelas Supabase (single-tenant)

```sql
produtos (id, nome, categoria, preco, unidade, estoque, imagem_url, ativo)
clientes (id, nome, telefone, endereco, produto, numero)
pedidos (id, cliente_id, status, total, forma_pagamento, criado_em)
itens_pedido (id, pedido_id, produto_id, quantidade, preco_unitario)
```

- `clientes.produto`: útil registrar o(s) produto(s) do pedido mais recente do cliente, pra facilitar consulta rápida no admin sem abrir os pedidos.
- `clientes.numero`: coluna sequencial amigável (1, 2, 3...) só para exibição — **não trocar o `id` (uuid) por isso**, pois quebraria os relacionamentos com `pedidos`. Gerar via `row_number() over (order by criado_em asc)` numa migração, com sequence própria para novos registros continuarem incrementando.

### Se for atender vários clientes (multi-tenant)

Adicionar `tenant_id` em todas as tabelas acima + RLS policies por tenant. n8n identifica o tenant pelo número de WhatsApp que recebeu a mensagem. (Ver padrão já usado: tabelas `tenants`, `usuarios`, `agente_config`, `conhecimento`, `conversas`.)

## Fluxo de pedido via WhatsApp com IA (quando o cliente já tem Avisa API/Meta Cloud API configurada)

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
/src/routes/            → páginas públicas (index, catalogo, contato, empresa)
/src/routes/admin/      → painel admin (login, início, clientes, pedidos, recuperação de senha)
/src/routes/precos/     → painel de preços simplificado (login, painel)
/src/components/        → ProductCard, CartSheet, AppHeader, FloatingWhatsApp, etc.
/src/lib/                → cart.tsx, format.ts, adminApi.ts, precosApi.ts
/src/data/               → categorias.ts, types.ts (espelhar constantes do server, front não importa código do backend)
/server/                 → Express: rotas públicas + admin + preços, cada painel com cookie/sessão própria
/scripts/sync-catalogo.ts → sincroniza catálogo a partir de planilha (dry-run por padrão, --apply pra gravar)
/supabase/migrations/    → uma migração por mudança de schema, incremental
```

## Categorias do catálogo — cuidado com regex genérico

Ordenar por categoria numa ordem fixa de negócio (não alfabética) e ter uma função `inferirCategoria(nome)` com guards explícitos **antes** do regex genérico, porque nomes de produto têm falsos positivos previsíveis:

- Um produto com "chocolate" no nome pode ser um licor (destilado), não um doce.
- "Bananinha" e "Morango do Amor" podem ser bebidas destiladas (shots), não doces, dependendo da marca.
- Sempre perguntar ao cliente/dono do negócio quais nomes de produto são ambíguos antes de confiar 100% no regex — ele conhece o catálogo, o regex não.

## Imagens de produto

- **Google Sheets como fonte do catálogo**: ao buscar CSV público (`gviz/tq?tqx=out:csv&sheet=<nome-da-aba>`), o nome da aba precisa bater **exatamente**, acentos incluídos — se não bater, o Google silenciosamente devolve a primeira aba (HTTP 200, sem erro), o que já causou leitura de dados errados sem nenhum aviso. Sempre confirmar o nome exato da aba com o cliente (ou inspecionar o HTML da planilha) antes de assumir que bateu.
- **Google Drive hotlink**: usar `drive.google.com/thumbnail?id=<ID>&sz=w1000`, não `drive.google.com/uc?export=view&id=<ID>` — esse segundo formato é bloqueado pelo Chrome (Opaque Response Blocking / `ERR_BLOCKED_BY_ORB`).
- **Fotos manuais**: se vierem soltas (PNG/JPG/JFIF) fora da planilha, criar uma pasta (`public/produtos/`) com convenção de nome de arquivo = nome exato do produto no banco, e o script de sync detecta e usa automaticamente. **Não inserir automaticamente no catálogo sem o cliente confirmar cada produto** — evita erro de categorização.
- **Arquivos `.jfif` no `public/`**: podem travar o dev server do Vite (`EBUSY: resource busy or locked`). Renomear para `.jpg`/`.png` antes de colocar na pasta pública.

## Hospedagem em VPS compartilhada — checklist antes de mexer

Muitos clientes já têm uma VPS rodando outra coisa (n8n self-hosted é comum). **Antes de instalar qualquer coisa**, inspecionar o que já existe:

```bash
ss -tlnp | grep -E ":80 |:443 |:3000 |:3001 "   # portas já ocupadas
docker ps -a                                      # containers rodando (Traefik? outro app?)
ls -la /etc/nginx/sites-enabled/ 2>/dev/null      # nginx já configurado?
pm2 list                                          # outros apps Node já rodando via PM2?
```

Se aparecer um **Traefik via Docker** já ocupando 80/443 (comum quando n8n foi instalado via docker-compose oficial do n8n, que já vem com Traefik + ACME): **não tentar instalar Nginx** — ele vai falhar (`bind() to 0.0.0.0:80 failed: Address already in use`). Em vez disso, reusar o Traefik existente:

1. Rodar o app novo como processo PM2 separado, numa porta livre (ex: 3001), sem tentar pegar 80/443.
2. No `docker-compose.yml` do Traefik, adicionar o **file provider** (`--providers.file.directory=/etc/traefik/dynamic`, `--providers.file.watch=true`) e `extra_hosts: ["host.docker.internal:host-gateway"]` (pra o container alcançar um processo rodando fora do Docker, no host).
3. Criar um arquivo de config dinâmica (`dynamic/<app>.yml`) com um router (`Host(...)` + `certResolver` da mesma ACME já configurada) e um service apontando pra `http://host.docker.internal:<porta>`.
4. `docker compose up -d` recria só o container do Traefik (não afeta os outros serviços do mesmo compose, ex: n8n).

Isso dá HTTPS de graça (Let's Encrypt) pro app novo sem tocar em nada que já estava em produção.

## Link temporário sem domínio próprio ainda

Se o cliente ainda não registrou um domínio, **não publique o link só com IP puro** (`http://1.2.3.4:3001`):
- WhatsApp e a maioria dos apps não reconhecem IP puro como link clicável.
- Navegadores mobile (inclusive o navegador interno do WhatsApp) tendem a forçar HTTPS ao abrir um link, e IP puro só em HTTP puro gera `ERR_SSL_PROTOCOL_ERROR`.

Solução rápida e gratuita: usar **nip.io** (`http://<IP-com-pontos>.nip.io`, ex: `1.2.3.4.nip.io`) — é um domínio de verdade (wildcard DNS que resolve pro IP embutido no nome), então:
- Vira link clicável normalmente.
- Permite emitir certificado Let's Encrypt válido (a validação HTTP-01/TLS-ALPN funciona porque é um domínio real).

Quando o cliente registrar o domínio definitivo, é só trocar a regra `Host()` no Traefik (ou o `server_name` no Nginx) — não precisa reconstruir nada.

## Segurança e Git — checklist antes do primeiro push

- `.env` **nunca** vai para o Git — conferir que está no `.gitignore` desde o primeiro commit, não depois.
- Antes de rodar `git add -A` pela primeira vez num projeto de cliente, **procurar por arquivos soltos de anotação** (`.txt`, `.md` fora da estrutura padrão) que o cliente pode ter deixado na pasta com senhas/chaves em texto puro — já aconteceu. Adicionar ao `.gitignore` explicitamente, nunca confiar só na varredura visual.
- Configurações locais de ferramentas (`.claude/settings.local.json`, `.claude/scheduled_tasks.lock`) não são parte do app — excluir do repositório.
- Repositório de cliente com dados de negócio (mesmo sem senha) deve ser **privado** por padrão, a menos que o cliente peça público.
- Documentar no `CLAUDE.md` do projeto (não na skill genérica) qualquer decisão específica daquele cliente: infraestrutura real (VPS, domínio), nomes de variáveis de ambiente (nunca os valores), e decisões de UX que já foram testadas e revertidas — evita repetir o mesmo erro numa sessão futura.

## Checklist de MVP → produção

**Fase 1 — crítico**
- Lazy loading de imagens (essencial acima de ~100 produtos)
- Paginação ou virtualization na listagem
- Validação de formulários com Zod
- Error handling com toasts (feedback visual de erro/sucesso)
- Testar em viewport mobile antes de considerar qualquer tela "pronta" — a maioria desses projetos é usada quase 100% pelo celular, não desktop

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
