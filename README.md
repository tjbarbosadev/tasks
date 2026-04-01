# Tasks API

API REST em **Node.js**, **Express** e **TypeScript**, com **Prisma** (PostgreSQL).

## Requisitos

- Node.js (LTS recomendado)
- Docker (opcional, para PostgreSQL local)

## Início rápido

```bash
npm install
# Configure .env (PORT, DATABASE_URL, JWT_SECRET — ver docs/SETUP.md)
docker compose up -d     # se usar o Postgres do repositório
npm run prisma:migrate   # ou prisma:generate, conforme seu fluxo
npm run dev
```

Servidor padrão: `http://localhost:3001` — health check: `GET /health`.

## Scripts úteis

| Comando                             | Descrição                           |
| ----------------------------------- | ----------------------------------- |
| `npm run dev`                       | Sobe a API com reload (`tsx watch`) |
| `npm run build`                     | Compila TypeScript para `build/`    |
| `npm run lint` / `npm run lint:fix` | ESLint                              |
| `npm run prisma:generate`           | Gera o Prisma Client                |
| `npm run prisma:migrate`            | Migrações em desenvolvimento        |

## Documentação

- **[Setup passo a passo](docs/SETUP.md)** — histórico de configuração (tooling, Prisma, hooks Git, etc.)
