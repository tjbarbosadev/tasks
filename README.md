# Tasks API

API REST em **Node.js**, **Express 5**, **TypeScript** e **Prisma** (PostgreSQL), com validação **Zod**, autenticação **JWT** e testes de integração com **Jest** e **Supertest**.

## Deploy (produção)

| Ambiente   | URL base                                                           | Health check                                                              |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| **Render** | [https://tasks-j6ie.onrender.com](https://tasks-j6ie.onrender.com) | [GET /health](https://tasks-j6ie.onrender.com/health) → `{"status":"OK"}` |

A API pública responde nessa URL após o Web Service no Render estar **Live**. O primeiro acesso após inatividade pode levar alguns segundos (cold start do plano gratuito).

### Render — referência de configuração

1. **PostgreSQL** no Render com database (ex.: `tasks`).
2. **Web Service** (Node) ligado ao repositório GitHub, com variáveis de ambiente:
   - **`DATABASE_URL`** — _Internal Database URL_ do Postgres (mesma região que o serviço).
   - **`JWT_SECRET`** — segredo forte (só no painel do Render, nunca no Git).
   - **`NODE_ENV`** — `production` (recomendado).
   - **`PORT`** — definido automaticamente pelo Render; a aplicação usa `process.env.PORT` em `src/server.ts`.

3. **Build Command** (exemplo):

   ```bash
   npm install && npx prisma generate && npm run build
   ```

4. **Start Command** (exemplo — aplica migrations e sobe o servidor):

   ```bash
   npx prisma migrate deploy && npm start
   ```

Se `npx prisma` falhar no start (CLI ausente após prune de dependências), coloque o pacote **`prisma`** em `dependencies` no `package.json` ou ajuste o comando conforme a documentação do Render.

---

## O que o projeto cobre

- **Autenticação:** `POST /users` (cadastro) e `POST /sessions` (login com JWT).
- **Papéis:** `admin` e `member` (`role` no usuário).
- **Times:** CRUD e membros (rotas sob `/teams`, **admin**).
- **Tarefas:** CRUD, `status` / `priority`, `assignedTo`, `teamId`; histórico de status em `GET /tasks/task/:taskId` (**admin**); listagem em `GET /tasks` (admin vê tudo, membro vê tarefas atribuídas a si); filtros opcionais `?status=` e `?priority=`.
- **Usuários:** `GET`/`POST` `/users` sem JWT; `PATCH`/`DELETE` `/users/:id` (**admin**).
- **Qualidade:** ESLint, Prettier, Husky; testes de integração com Supertest.
- **Docker:** `Dockerfile` e `docker-compose.yml` para Postgres + API local (opcional).

---

## Autenticação

Rotas marcadas como **JWT** exigem:

```http
Authorization: Bearer <token>
```

O token vem de `POST /sessions` com `email` e `password`.

---

## Endpoints (documentação)

Use a base **`http://localhost:3001`** no desenvolvimento ou **`https://tasks-j6ie.onrender.com`** em produção (sem barra no final).

### Geral

| Método | Caminho   | Auth | Descrição    |
| ------ | --------- | ---- | ------------ |
| `GET`  | `/health` | —    | Saúde da API |

### Usuários (`/users`)

| Método   | Caminho      | Auth | Papel     | Descrição                                                                            |
| -------- | ------------ | ---- | --------- | ------------------------------------------------------------------------------------ |
| `GET`    | `/users`     | —    | —         | Lista usuários (`{ users }`)                                                         |
| `POST`   | `/users`     | —    | —         | Cria usuário (`name`, `email`, `password`, `role` opcional); resposta sem `password` |
| `PATCH`  | `/users/:id` | JWT  | **admin** | Atualiza `name`, `email` e/ou `role`                                                 |
| `DELETE` | `/users/:id` | JWT  | **admin** | Remove usuário                                                                       |

### Sessão (`/sessions`)

| Método | Caminho     | Auth | Descrição                                      |
| ------ | ----------- | ---- | ---------------------------------------------- |
| `POST` | `/sessions` | —    | Login: `email`, `password` → `{ token }` (201) |

### Times (`/teams`)

Todas exigem **JWT** e papel **admin**.

| Método   | Caminho                            | Descrição                                  |
| -------- | ---------------------------------- | ------------------------------------------ |
| `GET`    | `/teams`                           | Lista times (`{ teams }`)                  |
| `POST`   | `/teams`                           | Cria time (`name`, `description` opcional) |
| `GET`    | `/teams/:id`                       | Detalhe do time                            |
| `PATCH`  | `/teams/:id`                       | Atualiza time                              |
| `DELETE` | `/teams/:id`                       | Remove time (204)                          |
| `GET`    | `/teams/:teamId/members`           | Time com membros (`members`)               |
| `POST`   | `/teams/:teamId/members/:memberId` | Adiciona membro                            |
| `DELETE` | `/teams/:teamId/members/:memberId` | Remove membro                              |

### Tarefas (`/tasks`)

Todas exigem **JWT**. Criar, editar, excluir, ver detalhe e histórico estão restritos a **admin**; **membro** usa principalmente `GET /tasks` (suas tarefas).

| Método   | Caminho               | Papel     | Descrição                                                                                     |
| -------- | --------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `GET`    | `/tasks`              | qualquer  | Admin: todas; membro: `assignedTo` = si. Queries: `?status=`, `?priority=`                    |
| `GET`    | `/tasks/:id`          | **admin** | Detalhe `{ task }`                                                                            |
| `POST`   | `/tasks`              | **admin** | Cria (`title`, `description?`, `status`, `priority`, `assignedTo`, `teamId`) → 201 `{ task }` |
| `PATCH`  | `/tasks/:id`          | **admin** | Atualiza; mudança de `status` grava em `tasks_history`                                        |
| `DELETE` | `/tasks/:id`          | **admin** | Remove tarefa                                                                                 |
| `GET`    | `/tasks/task/:taskId` | **admin** | Histórico `{ taskId, history }`                                                               |

> O prefixo `/tasks/task/...` evita conflito com `GET /tasks/:id`.

---

## Modelo de dados (resumo)

**User**, **Team**, **TeamMember**, **Task**, **TaskHistory** (Prisma). Diagrama: [docs/database-diagram.md](docs/database-diagram.md).

---

## Como rodar localmente

### Requisitos

- Node.js (LTS)
- Docker (opcional, Postgres via `docker-compose`)
- Git

### Passos

Repositório: `https://github.com/tjbarbosadev/tasks`

```bash
git clone https://github.com/tjbarbosadev/tasks.git && cd tasks
npm install
```

Crie `.env` na raiz com pelo menos `DATABASE_URL` e `JWT_SECRET` (exemplos em [docs/SETUP.md](docs/SETUP.md)).

Postgres local (opcional):

```bash
docker compose up -d
```

Banco e Prisma Client:

```bash
npx prisma migrate deploy
npm run prisma:generate
```

Desenvolvimento (hot reload):

```bash
npm run dev
```

- API: `http://localhost:3001` (ou `PORT` no `.env`)
- Health: `GET http://localhost:3001/health`

Build de produção local:

```bash
npm run build
npx prisma migrate deploy
npm start
```

### Projeto novo do zero (greenfield)

O passo a passo histórico completo está em [docs/SETUP.md](docs/SETUP.md).

---

## Testes automatizados

Os testes são de **integração** (Express + Supertest + banco real via Prisma). É necessário **`.env`** válido (`DATABASE_URL`, `JWT_SECRET`) e migrations aplicadas.

```bash
npm test
```

Modo watch:

```bash
npm run test:dev
```

Suites em `src/tests/*.test.ts`: sessões, usuários, times, membros de time, tarefas.

---

## Scripts úteis

| Comando                                   | Descrição                                        |
| ----------------------------------------- | ------------------------------------------------ |
| `npm run dev`                             | API com reload (`tsx` + `--env-file .env`)       |
| `npm run build`                           | Compila TypeScript → `build/`                    |
| `npm start`                               | `node build/server.js` (após `build`)            |
| `npm test` / `npm run test:dev`           | Jest + Supertest                                 |
| `npm run lint` / `npm run lint:fix`       | ESLint                                           |
| `npm run format` / `npm run format:check` | Prettier                                         |
| `npm run prisma:generate`                 | Gera client em `src/generated/prisma`            |
| `npm run prisma:migrate`                  | `prisma migrate dev` (carrega `.env` via script) |
| `npm run prisma:pull`                     | `prisma db pull`                                 |

> `src/generated/prisma` está no `.gitignore`; após clone use `npm run prisma:generate` (ou o fluxo com `migrate` acima).

---

## Checklist (entrega / desafio)

- [x] Node + TypeScript + Express
- [x] ESLint e Prettier
- [x] Variáveis de ambiente (local: `.env` + scripts; produção: painel Render)
- [x] PostgreSQL + Prisma (models, migrations, relacionamentos)
- [x] Docker (`Dockerfile`, `docker-compose`)
- [x] Estrutura controllers / routes / middlewares
- [x] JWT, cadastro/login, proteção de rotas, admin vs member (conforme rotas documentadas)
- [x] CRUD times e membros; CRUD tarefas; filtros; histórico de status; Zod
- [x] Jest + Supertest nos fluxos principais
- [x] Deploy Render + URL pública + health OK
- [x] README com setup local, endpoints, deploy, testes

---

## Documentação extra

- **[docs/SETUP.md](docs/SETUP.md)** — histórico de setup, Prisma, Git hooks, erros frequentes.
- **[docs/database-diagram.md](docs/database-diagram.md)** — diagrama ER (Mermaid).

Referência de versões e scripts: **`package.json`** na raiz.
