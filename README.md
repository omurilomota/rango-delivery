# Rango

Delivery, clube de refeições e painel do restaurante.

> **Demonstração pública.** Telefones, WhatsApp, e-mail, endereço, CNPJ, redes sociais e dados de clientes são fictícios. Nenhum pedido, mensagem ou formulário é enviado a um canal real.

[**Ver demonstração**](https://rango-delivery.vercel.app) · Next.js 16 (App Router) · React 19 · TypeScript · PostgreSQL + Drizzle ORM · Tailwind CSS 4

## O que tem

- Cardápio e pedidos com retirada ou entrega
- Clube de refeições e planos recorrentes
- Conta do cliente com histórico
- Acompanhamento de pedido em tempo real
- Painel administrativo de produtos e pedidos
- Página de proposta comercial

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- PostgreSQL + Drizzle ORM
- Tailwind CSS 4

## Rodando localmente

```bash
npm ci
cp .env.example .env.local
# edite .env.local com a sua connection string
npm run dev
```

Acesse `http://localhost:3000`.

## Variáveis de ambiente

| Variável | Obrigatória | Para que serve |
| --- | --- | --- |
| `DATABASE_URL` | Sim | Connection string PostgreSQL/Neon |

## Banco de dados

PostgreSQL no Neon (banco `rango`). O schema fica em `src/db/schema.ts` e é aplicado com `npx drizzle-kit push`. Em produção, use uma connection string Neon com `sslmode=require`.

## Rotas

| Rota | Descrição |
| --- | --- |
| `/` | Cardápio e pedidos |
| `/conta` | Conta do cliente |
| `/pedidos/[id]` | Acompanhamento |
| `/admin` | Painel do restaurante |
| `/proposta` | Proposta comercial |

## Testes e qualidade

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Deploy

O deploy é feito na Vercel. Configure as variáveis acima no painel do projeto, conecte o repositório e use `npm run build`.

## Estrutura

| Caminho | Responsabilidade |
| --- | --- |
| `src/app/` | Rotas e API |
| `src/components/` | Storefront, conta e painel |
| `src/db/` | Schema Drizzle |
| `src/lib/` | Seed, dados da loja e regras |

## Licença

MIT — veja [LICENSE](LICENSE).
