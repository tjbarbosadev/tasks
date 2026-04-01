# Tasks API

API REST em **Node.js**, **Express** e **TypeScript**, com **Prisma** (PostgreSQL).

## Requisitos

- Node.js (LTS recomendado)
- Docker (opcional, para PostgreSQL local)
- Conta no Git e Git (para clonar)

## Início rápido

Há dois cenários; use o que for o seu caso.

### A) Você clonou este repositório

A pasta `src/generated/prisma` **não vai no Git** (está no `.gitignore`). Depois do `npm install` é obrigatório gerar o client e aplicar as migrations no banco.

```bash
git clone <url-do-repositorio> && cd tasks
npm install
```

Crie o `.env` na raiz com pelo menos `DATABASE_URL`, `PORT` e `JWT_SECRET` (exemplos em [docs/SETUP.md](docs/SETUP.md)).

Suba o Postgres (se usar o `docker-compose` do projeto) e garanta que o database da URL exista:

```bash
docker compose up -d
```

Aplique migrations versionadas e gere o Prisma Client:

```bash
npx prisma migrate deploy
npm run prisma:generate
```

Ou, em desenvolvimento, você pode usar `npm run prisma:migrate` (equivale a `migrate dev`; para **nova** migration nomeada use `npm run prisma:migrate -- --name descricao`).

Suba a API:

```bash
npm run dev
```

Servidor: `http://localhost:3001` — health: `GET /health`.

### B) Projeto novo do zero (sem clonar)

Siga o passo a passo em **[docs/SETUP.md](docs/SETUP.md)** (seções 1 em diante e, no final, **Banco de dados: Prisma e PostgreSQL**). Esse fluxo é o histórico de como o ambiente foi montado; a ordem lá importa (Node/TS → Express → lint → Prisma → API).

---

**Usuários:** CRUD em `/users` (`GET`, `POST`, `PATCH /:id`, `DELETE /:id`). Detalhes na seção **14** de [docs/SETUP.md](docs/SETUP.md).

## Scripts úteis

| Comando                                   | Descrição                                        |
| ----------------------------------------- | ------------------------------------------------ |
| `npm run dev`                             | API com reload (`tsx watch` + `--env-file .env`) |
| `npm run build`                           | Compila TypeScript → `build/`                    |
| `npm run lint` / `npm run lint:fix`       | ESLint                                           |
| `npm run format` / `npm run format:check` | Prettier                                         |
| `npm run prisma:generate`                 | Gera client em `src/generated/prisma`            |
| `npm run prisma:migrate`                  | `prisma migrate dev` (com `.env` carregado)      |
| `npm run prisma:pull`                     | `prisma db pull`                                 |

## Documentação

- **[docs/SETUP.md](docs/SETUP.md)** — clone vs greenfield, tooling, Prisma (models, migrate, generate), hooks Git, API CRUD de usuários.
- **[docs/database-diagram.md](docs/database-diagram.md)** — diagrama ER (Mermaid; renderiza no GitHub/GitLab).
- Scripts e dependências citados nos docs devem bater com o **`package.json`**; em dúvida, use o arquivo na raiz como referência.
