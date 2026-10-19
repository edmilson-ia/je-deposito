# J.E Alimentos e Destilados — Catálogo digital e vendas

Em resumo: catálogo digital de bebidas com carrinho, pedidos com Pix e painel admin. Usa React, backend em Express, banco Supabase e automação com n8n, e o catálogo pode ser editado por uma planilha do Google Sheets.

Catálogo digital + carrinho + pedidos com Pix + painel admin, construído seguindo a skill
`deposito-bebidas-app` (veja `.claude/skills/deposito-bebidas-app/SKILL.md`).

**Stack:** React + TypeScript (Vite) + Tailwind, backend Express (Node.js), banco Supabase
(Postgres), automação n8n, WhatsApp via Avisa API, Pix por chave telefone (confirmação manual),
planilha Google Sheets como fonte editável do catálogo.

## 1. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Preencha o `.env` com os valores reais (veja comentários em cada linha). Nunca commite o `.env`
— ele já está no `.gitignore`.

Pendências que só você consegue preencher:

- `SUPABASE_ANON_KEY`: pegue em Supabase Dashboard → Project Settings → API. (O app hoje só
  usa a chave de serviço no backend; a anon key fica reservada para uso futuro no front-end.)
- `AVISA_API_URL` / `AVISA_API_KEY`: credenciais da sua conta na Avisa API (avisaapi.com.br).
- `N8N_CONFIRMACAO_WEBHOOK_URL`: URL do webhook do n8n (veja seção 4).

## 2. Criar as tabelas no Supabase

O projeto Supabase informado (`kyutlscdaegudnbclvfq`) não está conectado à minha ferramenta de
gerenciamento, então a criação do schema é manual (só precisa rodar uma vez):

1. Abra o Supabase Dashboard do projeto → **SQL Editor** → **New query**.
2. Cole o conteúdo de `supabase/migrations/0001_init.sql` e rode.

Isso cria as tabelas `produtos`, `clientes`, `pedidos`, `itens_pedido`, `admin_config`, a função
`baixar_estoque` e a política de leitura pública do catálogo ativo.

## 3. Sincronizar o catálogo da planilha

```bash
npm install
npm run sync:catalogo            # modo dry-run: só mostra o relatório
npm run sync:catalogo -- --apply # aplica de fato no Supabase
```

O script lê a aba **CATALOGO** da planilha (`GOOGLE_SHEETS_ID` no `.env`) via export CSV público
— não precisa de credenciais Google, e por isso também pode ser chamado de dentro de um workflow
n8n via HTTP Request, se preferir sincronizar por lá.

**Antes de aplicar**, o script avisa quais produtos estão sem imagem (`link_imagem` vazio na
planilha) — hoje a planilha tem produtos assim (ex: "BODEGAO FRIS 2L C6", "COPO 200ML COPOSHOW").
A categoria de cada produto é **inferida automaticamente** pelo nome (cerveja, whisky, vodka,
refrigerante, descartáveis etc.) já que a planilha não tem uma coluna de categoria — revise a
categorização depois de aplicar e ajuste direto no Supabase se algo ficar errado.

A planilha real tem bem mais produtos do que os ~99 estimados inicialmente (o script mostra o
total exato no relatório).

## 4. n8n (WhatsApp + Pix)

Dois workflows prontos para importar em `n8n/` (Menu → Import from File):

- `workflow-pedido-whatsapp.json`: recebe mensagem no WhatsApp (webhook), usa IA para extrair os
  itens do pedido, confere no catálogo, identifica o cliente e cria o pedido no site (que já
  gera o Pix), respondendo ao cliente com o Pix Copia e Cola via Avisa API.
- `workflow-confirmacao-pagamento.json`: acionado automaticamente pelo backend quando o admin
  confirma um pagamento no painel (`/admin/pedidos`) — avisa o cliente no WhatsApp que o pedido
  foi confirmado. A baixa de estoque já acontece no backend antes desse aviso.

Depois de importar, configure em cada workflow:

- Variáveis de ambiente do n8n: `APP_BASE_URL` (URL pública do site) e `N8N_WEBHOOK_SECRET`
  (mesmo valor do `.env` do site).
- Credencial `httpHeaderAuth` para a Avisa API (`Authorization: <AVISA_API_KEY>`) e para a OpenAI
  (`Authorization: Bearer <OPENAI_API_KEY>`).
- O node "Extrair telefone e mensagem" tem um comentário lembrando de ajustar os nomes de campo
  conforme o payload real do webhook da Avisa API (a doc completa deles fica no workspace do
  Postman, que eu não tinha acesso para confirmar o formato exato).
- Ative os workflows e cole a URL do webhook de pedido na configuração da Avisa API.

## 5. Rodar localmente

```bash
npm run dev
```

Abre o site em `http://localhost:5173` (a API roda em `http://localhost:3001`, com proxy do Vite).

## 6. Deploy na VPS Hostinger (Nginx + Node.js)

```bash
npm run build     # gera dist/ (front) e dist-server/ (backend compilado)
npm start         # roda o servidor Node (serve a API e os arquivos estáticos)
```

Padrão da skill: manter o processo Node vivo com PM2 (ou systemd), atrás do Nginx como reverse
proxy, com um subdomínio próprio e SSL via Certbot:

```nginx
server {
  server_name jealimentos.seudominio.com;
  location / {
    proxy_pass http://localhost:3001;
    proxy_set_header Host $host;
  }
}
```

```bash
pm2 start dist-server/index.js --name je-alimentos
sudo certbot --nginx -d jealimentos.seudominio.com
```

## 7. Pendências antes de "publicar" para o cliente final

- [ ] **Logo real**: hoje `/src/assets/logo.png` e `/public/logo.png` são um placeholder
      (círculo dourado sobre fundo preto) — troque pelos arquivos reais da marca quando você
      tiver o PNG em mãos (a logo não foi anexada na conversa).
- [ ] Confirmar `SUPABASE_ANON_KEY`, `AVISA_API_URL`/`AVISA_API_KEY`.
- [ ] Rodar a migração SQL e o `sync:catalogo --apply` (passos 2 e 3 acima).
- [ ] Revisar a categorização automática dos produtos.
- [ ] Testar o fluxo completo de pedido (catálogo → carrinho → identificação → Pix) e o painel
      admin (`/admin/login`, `/admin/pedidos`, `/admin/clientes`) com a senha definida em
      `ADMIN_PASSWORD`.
- [ ] Importar e configurar os dois workflows do n8n, testando com uma mensagem real de teste.
- [ ] Decidir se/quando conectar um gateway de pagamento (Mercado Pago, Efí) para confirmação
      automática de Pix — hoje a confirmação é manual pelo painel, conforme decidido no início
      do projeto (chave Pix por telefone, sem PSP).
