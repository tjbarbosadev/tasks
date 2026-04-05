# Tasks API

API REST em **Node.js**, **Express 5**, **TypeScript** e **Prisma** (PostgreSQL), com validação **Zod**, autenticação **JWT** e testes de integração com **Jest** e **Supertest**.

## O que o projeto cobre

- **Autenticação:** cadastro implícito via `POST /users` e sessão em `POST /sessions` (token JWT).
- **Papéis:** `admin` e `member` (campo `role` no usuário).
- **Times:** CRUD de equipes e gestão de membros (somente **admin**).
- **Tarefas:** CRUD, status (`pending`, `in_progress`, `completed`), prioridade (`high`, `medium`, `low`), responsável (`assignedTo`) e time (`teamId`); histórico de mudança de status em rota dedicada.
- **Usuários:** listagem e criação públicas; atualização e exclusão restritas a **admin**.
- **Qualidade:** ESLint, Prettier, Husky; suíte de testes para sessões, usuários, times, membros e tarefas.

Stack adicional: **bcrypt** (senha), **Docker** (Postgres local opcional). Deploy sugerido no desafio: **Render** (configure `DATABASE_URL`, `JWT_SECRET` e build/start no painel).

## Autenticação

Rotas marcadas como **JWT** exigem cabeçalho:

```http
Authorization: Bearer <token>
```

O token é retornado por `POST /sessions` após login com `email` e `password`.

---

## Rotas

Base URL local padrão: `http://localhost:3001` (veja `src/server.ts`).

### Geral

| Método | Caminho   | Auth | Descrição    |
| ------ | --------- | ---- | ------------ |
| `GET`  | `/health` | —    | Saúde da API |

### Usuários (`/users`)

| Método   | Caminho      | Auth | Papel     | Descrição                                                                                   |
| -------- | ------------ | ---- | --------- | ------------------------------------------------------------------------------------------- |
| `GET`    | `/users`     | —    | —         | Lista todos os usuários (`{ users }`)                                                       |
| `POST`   | `/users`     | —    | —         | Cria usuário (corpo: `name`, `email`, `password`, `role` opcional); resposta sem `password` |
| `PATCH`  | `/users/:id` | JWT  | **admin** | Atualiza `name`, `email` e/ou `role`                                                        |
| `DELETE` | `/users/:id` | JWT  | **admin** | Remove usuário                                                                              |

### Sessão (`/sessions`)

| Método | Caminho     | Auth | Descrição                                      |
| ------ | ----------- | ---- | ---------------------------------------------- |
| `POST` | `/sessions` | —    | Login: `email`, `password` → `{ token }` (201) |

### Times (`/teams`)

Todas as rotas abaixo exigem **JWT** e papel **admin**.

| Método   | Caminho                            | Descrição                                  |
| -------- | ---------------------------------- | ------------------------------------------ |
| `GET`    | `/teams`                           | Lista times (`{ teams }`)                  |
| `POST`   | `/teams`                           | Cria time (`name`, `description` opcional) |
| `GET`    | `/teams/:id`                       | Detalhe do time                            |
| `PATCH`  | `/teams/:id`                       | Atualiza time                              |
| `DELETE` | `/teams/:id`                       | Remove time (204)                          |
| `GET`    | `/teams/:teamId/members`           | Time com lista de membros (`members`)      |
| `POST`   | `/teams/:teamId/members/:memberId` | Adiciona usuário `memberId` ao time        |
| `DELETE` | `/teams/:teamId/members/:memberId` | Remove membro do time                      |

### Tarefas (`/tasks`)

Todas as rotas exigem **JWT**.

| Método   | Caminho               | Papel     | Descrição                                                                                                                       |
| -------- | --------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/tasks`              | qualquer  | **Admin:** todas as tarefas. **Membro:** só tarefas com `assignedTo` = usuário logado. Query opcional: `?status=`, `?priority=` |
| `GET`    | `/tasks/:id`          | **admin** | Detalhe de uma tarefa (`{ task }`)                                                                                              |
| `POST`   | `/tasks`              | **admin** | Cria tarefa: `title`, `description?`, `status`, `priority`, `assignedTo`, `teamId` → 201 `{ task }`                             |
| `PATCH`  | `/tasks/:id`          | **admin** | Atualiza campos opcionais; se `status` mudar, registra em `tasks_history`                                                       |
| `DELETE` | `/tasks/:id`          | **admin** | Remove tarefa                                                                                                                   |
| `GET`    | `/tasks/task/:taskId` | **admin** | Histórico de alterações de status (`{ taskId, history }`)                                                                       |

> A rota de histórico usa o prefixo `/tasks/task/...` para não colidir com `GET /tasks/:id`.

---

## Modelo de dados (resumo)

Entidades principais no Prisma: **User**, **Team**, **TeamMember**, **Task**, **TaskHistory**. Diagrama ER: [docs/database-diagram.md](docs/database-diagram.md).

---

## Requisitos

- Node.js (LTS recomendado)
- Docker (opcional, para PostgreSQL local)
- Git (para clonar)

## Início rápido

### A) Repositório clonado

A pasta `src/generated/prisma` **não vai no Git** (`.gitignore`). Após `npm install`, gere o client e aplique as migrations.

```bash
git clone <url-do-repositorio> && cd tasks
npm install
```

Crie o `.env` na raiz com `DATABASE_URL`, `JWT_SECRET` e, se quiser, `PORT` (exemplos em [docs/SETUP.md](docs/SETUP.md)).

Suba o Postgres, se usar o `docker-compose` do projeto:

```bash
docker compose up -d
```

Migrations e Prisma Client:

```bash
npx prisma migrate deploy
npm run prisma:generate
```

Em desenvolvimento você pode usar `npm run prisma:migrate` (para **nova** migration nomeada: `npm run prisma:migrate -- --name descricao`).

Suba a API:

```bash
npm run dev
```

- Servidor: `http://localhost:3001`
- Health: `GET /health`

### B) Projeto novo do zero

Siga [docs/SETUP.md](docs/SETUP.md) (tooling, Express, Prisma, etc.).

---

## Scripts úteis

| Comando                                   | Descrição                                         |
| ----------------------------------------- | ------------------------------------------------- |
| `npm run dev`                             | API com reload (`tsx watch` + `--env-file .env`)  |
| `npm run build`                           | Compila TypeScript → `build/`                     |
| `npm start`                               | Sobe a API a partir de `build/server.js`          |
| `npm test`                                | Jest (integração, `supertest`, `--env-file=.env`) |
| `npm run test:dev`                        | Jest em modo watch                                |
| `npm run lint` / `npm run lint:fix`       | ESLint                                            |
| `npm run format` / `npm run format:check` | Prettier                                          |
| `npm run prisma:generate`                 | Gera client em `src/generated/prisma`             |
| `npm run prisma:migrate`                  | `prisma migrate dev` (com `.env` carregado)       |
| `npm run prisma:pull`                     | `prisma db pull`                                  |

## Documentação

- **[docs/SETUP.md](docs/SETUP.md)** — ambiente, Prisma, hooks Git, notas de API.
- **[docs/database-diagram.md](docs/database-diagram.md)** — diagrama ER (Mermaid).

Em dúvida sobre versões de dependências ou scripts, use o **`package.json`** na raiz como referência.
