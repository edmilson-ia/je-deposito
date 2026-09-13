# J.E Alimentos e Destilados — Catálogo Digital

Catálogo digital + pedidos via WhatsApp/Pix para o depósito/distribuidora "J.E Alimentos e
Destilados". Aplicativo **mobile-first** (uso principal é pelo celular do cliente e do dono do
negócio, não desktop).

## Stack

- **Frontend**: React 18 + TypeScript + Vite + React Router v6 + Tailwind CSS
- **Backend**: Express (Node.js), rodando no mesmo processo que serve o build do frontend em produção
- **Banco**: Supabase (Postgres), com RLS habilitado — chave `service_role` usada só no servidor
- **Catálogo**: sincronizado de uma planilha Google Sheets (CSV público via `gviz/tq`), script
  `scripts/sync-catalogo.ts`
- **Pix**: payload EMV "copia e cola" gerado localmente (`server/pix.ts`) — não usa gateway/PSP,
  só uma chave Pix por telefone. Confirmação de pagamento é manual (admin confere no WhatsApp e
  clica "confirmar" no painel).
- **WhatsApp**: por enquanto via links `wa.me` (sem API formal ainda). Front-end usa Avisa API /
  n8n como integração futura (variáveis já previstas no `.env.example`, ainda não usadas em produção).

## Fluxo de pedido (importante)

1. Cliente navega o catálogo **sem se identificar** (nome/telefone só é pedido no fechamento do
   pedido, tela única, decisão explícita do dono do negócio — não identificar na entrada do site).
2. Ao fechar o pedido: nome + telefone (WhatsApp) numa única tela, gravado em `clientes`
   (telefone é a chave de identificação — cliente recorrente não precisa recadastrar).
3. Pedido é criado (`pedidos` + `itens_pedido`), Pix copia-e-cola é gerado, e o cliente é
   redirecionado para o WhatsApp do depósito (`wa.me`) com um resumo do pedido + código Pix na
   mensagem — **não existe tela de pagamento dentro do app**.
4. Pagamento é confirmado manualmente pelo dono no painel admin (`/admin/pedidos`), o que dá
   baixa no estoque (`baixar_estoque` no Postgres) e opcionalmente aciona um webhook n8n.

## Painéis administrativos (dois, totalmente separados)

- **`/admin`** — painel principal. Login só com senha (`ADMIN_PASSWORD`), recuperação por
  e-mail via Resend. Tela inicial (`/admin`) com dois atalhos: **Pedidos** (confirmar
  pagamento) e **Clientes** (cadastro + histórico). Sessão via cookie assinado
  `je_admin_session`.
- **`/precos`** — painel simplificado, só para editar preço de produto rapidamente pelo
  celular. Login fixo (usuário = telefone, senha fixa — ambos em `PRECOS_USUARIO`/
  `PRECOS_SENHA`), sem hashing (credenciais fixas por decisão do dono). Sessão separada via
  cookie `je_precos_session`. Botão "Esqueci a senha" manda pro WhatsApp do próprio número
  cadastrado. O catálogo público (`/catalogo`) faz polling a cada 30s para refletir mudanças de
  preço sem precisar recarregar a página.

Os dois painéis são independentes: sessões, cookies e middlewares de autenticação não se
misturam.

## Categorias

Ordem fixa definida em `server/categorias.ts` (`ORDEM_CATEGORIAS`) e espelhada em
`src/data/categorias.ts` (frontend não importa código do servidor):
`Destilados, Doces e Salgadinhos, Cesta Básica, Kits, Descartáveis, Outros`.

`inferirCategoria(nomeProduto)` tem guards explícitos para casos que o regex genérico erraria
(ex: "Bananinha"/"Morango do Amor" são bebidas destiladas, não doces; "Licor 43 Chocolate" é
destilado mesmo contendo "chocolate" no nome).

## Fotos de produto

Produtos sem imagem na planilha: colocar o arquivo em `public/produtos/`, nome do arquivo igual
ao nome do produto no Supabase (ver `public/produtos/LEIA-ME.md`). O script de sync detecta e
usa automaticamente. Imagens do Google Drive usam formato
`drive.google.com/thumbnail?id=X&sz=w1000` (o formato `uc?export=view` é bloqueado pelo Chrome —
ORB).

## Numeração amigável de clientes

`clientes.numero` (inteiro sequencial 1, 2, 3...) existe só para exibição amigável — o `id`
(uuid) continua sendo a chave real usada nos relacionamentos com `pedidos`. Ver
`supabase/migrations/0003_numero_clientes.sql`.

## Variáveis de ambiente

Ver `.env.example` para a lista completa com comentários. **Nunca commitar `.env`** — está no
`.gitignore`. Pendências conhecidas: `AVISA_API_URL`/`AVISA_API_KEY` e
`N8N_CONFIRMACAO_WEBHOOK_URL` ainda em branco (aguardando o dono cadastrar/finalizar).

## Rodando localmente

```
npm install
npm run dev        # frontend (vite) + backend (tsx watch) juntos, portas 5173 (web) e 3001 (api)
npm run sync:catalogo          # dry-run: mostra o que mudaria a partir da planilha
npm run sync:catalogo -- --apply   # aplica de fato (upsert por nome)
npm run lint        # tsc --noEmit
```

Para testar pelo celular na mesma rede Wi-Fi: `vite.config.ts` já tem `server.host: true`;
acessar pelo IP local da máquina (ex: `http://192.168.x.x:5173`).

## Deploy (produção)

Hospedado numa VPS (Hostinger) que **já roda outros serviços** — atenção redobrada antes de
mexer em infraestrutura compartilhada:

- **n8n** self-hosted via Docker Compose em `/docker/n8n/`, atrás de **Traefik** (também
  Docker), que já ocupa as portas 80/443 e emite certificados Let's Encrypt automaticamente.
- Outro app Node (`prime-order-hub`, não relacionado a este projeto) já roda via PM2 na porta
  3000 — não mexer.

Este projeto roda como processo PM2 separado (`jedeposito`) na porta **3001**, em
`/var/www/jedeposito`. Como a porta 80/443 já pertence ao Traefik do n8n, o roteamento HTTPS
deste app foi adicionado ao Traefik existente via **file provider** (não via labels Docker,
porque este app não roda em container):

- `/docker/n8n/docker-compose.yml` — Traefik ganhou `--providers.file.directory=/etc/traefik/dynamic`,
  `--providers.file.watch=true`, `extra_hosts: host.docker.internal:host-gateway` e o volume
  `./dynamic:/etc/traefik/dynamic:ro`.
- `/docker/n8n/dynamic/jedeposito.yml` — router/service apontando para
  `http://host.docker.internal:3001`.

Até o domínio definitivo (`jedeposito.com.br`) ser registrado, o acesso público usa um domínio
temporário via **nip.io** (`2.25.208.127.nip.io`), que resolve para o próprio IP da VPS e permite
emitir certificado Let's Encrypt válido (IP puro não vira link clicável no WhatsApp e não recebe
certificado). Quando o domínio real for registrado, basta trocar a regra `Host()` em
`jedeposito.yml` — não precisa reconstruir nada.

### Atualizando o código em produção

```
# a partir da pasta do projeto local
tar -czf deploy.tar.gz src server scripts public n8n index.html vite.config.ts tsconfig.json \
  postcss.config.js tailwind.config.js package.json package-lock.json
scp deploy.tar.gz root@<ip-da-vps>:/var/www/jedeposito/deploy.tar.gz
ssh root@<ip-da-vps> 'cd /var/www/jedeposito && tar -xzf deploy.tar.gz && rm deploy.tar.gz && npm run build && pm2 restart jedeposito'
```

`.env` na VPS é mantido manualmente (não sobrescrito pelo deploy) — se uma variável nova for
adicionada, precisa ser copiada pra lá também.

## Avisos importantes (decisões do dono do negócio)

- **Não alterar preços/produtos automaticamente** sem confirmação — qualquer mudança em massa no
  catálogo (via sync da planilha) deve ser revisada antes de aplicar (`--apply`).
- App é **para celular**, não para desktop — qualquer mudança de UI deve ser testada em viewport
  mobile antes de considerar concluída.
- Identificação do cliente (nome + telefone) acontece **só no fechamento do pedido**, nunca na
  entrada do site — decisão revertida explicitamente após testar o oposto.
