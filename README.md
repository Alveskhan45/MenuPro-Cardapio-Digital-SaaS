# MenuPro — Cardápio Digital

SaaS de cardápio digital: o restaurante monta o cardápio num painel e compartilha
um link público para o cliente pedir.

- **Site (GitHub Pages):** https://alveskhan45.github.io/Pro-Cardapio-Digital-SaaS/
- **Origin original:** https://replit.com/@AlvesKhan/MenuPro-Cardapio-Digital-SaaS

## Modo demo (padrão no GitHub Pages)

O GitHub Pages só serve arquivo estático — não roda Express, não tem Postgres e
não valida sessão do Clerk. Sem essas peças o app não tinha como funcionar lá:
o `ClerkProvider` explodia no boot e a página ficava branca.

Por isso existe o **modo demo**: quando não há `VITE_CLERK_PUBLISHABLE_KEY`, o
Vite troca o `@clerk/react` por um stub e intercepta `window.fetch` para
responder os endpoints `/api/*` com dados de exemplo em memória.

No demo dá para navegar pelo painel inteiro — produtos, categorias, pedidos,
clientes, estatísticas, aparência, QR Code — e o cardápio público em
`/menu/casa-do-burguer`. Criar produto ou mudar status de pedido funciona; só
não persiste (recarregar volta ao estado inicial).

Arquivos do modo demo:

| Arquivo | Papel |
| --- | --- |
| `artifacts/menupro/src/demo/clerk-stub.tsx` | `ClerkProvider`, `useAuth`, `useUser`, `SignIn`… |
| `artifacts/menupro/src/demo/clerk-internals-stub.ts` | `publishableKeyFromHost`, tema `shadcn` |
| `artifacts/menupro/src/demo/api-mock.ts` | fixtures + interceptador de `fetch` |

O mock é ligado por alias no `vite.config.ts`, então o app em si não tem nenhum
`if (demo)` espalhado. Definir a chave do Clerk desliga o demo e usa o auth real.

## Rodar com Clerk e Postgres de verdade

1. Crie um app em [dashboard.clerk.com](https://dashboard.clerk.com) e copie
   `Publishable key` e `Secret key`.
2. Suba um Postgres (Neon, Supabase ou local) e pegue a `DATABASE_URL`.
3. Copie `.env.example` para `.env` em `artifacts/menupro` e em `artifacts/api-server`.
4. `pnpm install`
5. `pnpm --filter @workspace/db run push` — cria o schema
6. `pnpm --filter @workspace/scripts run seed` — dados de exemplo (opcional)
7. `pnpm --filter @workspace/api-server run dev` — API em `:5000`
8. `pnpm --filter @workspace/menupro run dev` — front

O `vite.config.ts` exige `PORT` e `BASE_PATH`:

```bash
PORT=3002 BASE_PATH=/ npm --filter @workspace/menupro run dev
```

## Windows: atenção aos binários nativos

O `pnpm-workspace.yaml` tem um bloco `overrides` que zera os pacotes binários de
**todas as plataformas exceto `linux-x64-gnu`** (a plataforma em que o lockfile
foi gerado, no Replit). Resultado: no Windows faltam os binários e o Vite morre
com `Cannot find module @rollup/rollup-win32-x64-msvc`.

No CI (ubuntu) funciona normalmente. Para rodar local no Windows, instale os
quatro pacotes à mão antes do `pnpm run dev`:

```bash
npm i --no-save @rollup/rollup-win32-x64-msvc@4.63.1 \
  @tailwindcss/oxide-win32-x64-msvc@4.3.3 \
  @esbuild/win32-x64@0.28.2 \
  lightningcss-win32-x64-msvc@1.30.2
```

Depois copie as pastas de `node_modules/` para a raiz do workspace.

## Estrutura

```
artifacts/
  menupro/         # front React + Vite (o que vai para o Pages)
  api-server/      # API Express + Clerk + SSE
  mockup-sandbox/  # rascunho de UI
lib/
  api-spec/        # contrato OpenAPI (gera o client e os schemas Zod)
  api-client-react/# hooks react-query gerados por Orval
  api-zod/         # schemas Zod gerados
  db/              # schema Drizzle + cliente Postgres
scripts/           # seed e utilidades
```

Regenerar o client depois de mexer no `openapi.yaml`:

```bash
pnpm --filter @workspace/api-spec run codegen
```

## Stack

pnpm workspaces, Node 24, TypeScript 5.9, React 19, Vite 7, Tailwind 4,
Express 5, PostgreSQL + Drizzle ORM, Zod, Clerk, Orval, esbuild.

## Deploy

`.github/workflows/pages.yml` builda o `menupro` e publica em `dist/public` no
GitHub Pages a cada push em `main` que toque o front. Como o Pages é estático,
`VITE_API_URL` (secret do repo) aponta para a API hospedada em outro lugar —
Render, Railway, VPS. Sem ele o site sobe em modo demo.

## Licença

MIT
