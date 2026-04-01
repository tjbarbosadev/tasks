# Setup detalhado (histórico do projeto)

Documentação usada para montar o ambiente: TypeScript, Express, lint, formatação, Git hooks, Prisma e PostgreSQL.

### Documentação e código (política)

- **Fonte da verdade** para scripts npm (`npm run …`) e dependências: o arquivo **`package.json`** na raiz do repositório (e demais arquivos versionados, como `docker-compose.yml`).
- Este guia **não substitui** o repo: se houver divergência entre texto aqui e o que está no Git, **prevalece o código versionado**.
- Ajustes que dependam de novo script, pacote ou configuração de ferramenta são **mudanças de projeto**; convém tratá-las no código e, se alguém só puder editar Markdown, **perguntar antes** ou abrir PR separado — para não documentar o que o repositório ainda não faz.

## Como usar este documento

| Situação                               | O que fazer                                                                                                                                                                                                                                                              |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Clonou o repositório**               | Leia primeiro **[Checklist: após clonar o repositório](#checklist-após-clonar-o-repositório)** abaixo. Depois use a seção **Banco de dados: Prisma e PostgreSQL** e a **§14 (API)**. Não precisa refazer as seções 1–8 na ordem.                                         |
| **Vai criar um projeto igual do zero** | Siga as seções **1 → 8** na ordem, depois **9 (Docker)**, **10–11**, instale **Prisma** conforme **Banco de dados: Prisma e PostgreSQL**, implemente rotas/controllers (**§14**) e configure **`.gitignore`** (`.env`, `build`, `node_modules`, `src/generated/prisma`). |

As seções **1–8** são um **histórico reproduzível** de `npm init` até hooks Git; em um repo já existente, o que importa é **dependências instaladas** (`npm install`), **`.env`**, **banco**, **`prisma migrate` + `generate`**, **`npm run dev`**.

---

## Checklist: após clonar o repositório

1. **Node LTS** e **Git** instalados.
2. `git clone …` e `cd` para a pasta do projeto.
3. `npm install`
4. Criar **`.env`** na raiz (não commitado — está no `.gitignore`). Exemplo mínimo:

   ```env
   PORT=3001
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tasks
   JWT_SECRET=troque_por_um_segredo_longo
   ```

5. Subir o PostgreSQL (ex.: `docker compose up -d` — ver §9) e garantir que o **database** da `DATABASE_URL` exista (§**Banco de dados**, passo 2).
6. **`src/generated/prisma` não vem no clone** (está no `.gitignore`). Gere o client:

   ```bash
   npm run prisma:generate
   ```

7. Aplicar migrations já versionadas em `prisma/migrations/`:

   ```bash
   npx prisma migrate deploy
   ```

   Em desenvolvimento, em alternativa, `npm run prisma:migrate` executa `migrate dev` (sincroniza e pode criar migrations novas; para nomear: `npm run prisma:migrate -- --name descricao`).

8. Subir a API: `npm run dev` → `http://localhost:3001/health`.

9. Testar CRUD de usuários (§14).

Se algum passo falhar, veja **Erros frequentes** na seção de Prisma no final deste arquivo.

---

## 1) Inicializar projeto Node + TypeScript

```bash
npm init -y
npm i express
npm i -D typescript tsx ts-node @types/node @types/express
npx tsc --init
```

Arquivos principais:

- `package.json`
- `tsconfig.json`
- `src/app.ts`
- `src/server.ts`
- `src/routes/index.ts`

---

## 2) Ajustar TypeScript para CommonJS

Arquivo: `tsconfig.json`

```json
{
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./build",
    "module": "commonjs",
    "target": "esnext",
    "esModuleInterop": true,
    "strict": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["build", "node_modules", "prisma.config.ts"]
}
```

Pontos importantes:

- adicionar `rootDir` para corrigir TS5011
- remover `moduleResolution: "node"` para evitar depreciação no TS6
- `include` / `exclude`: o `tsc` compila só `src/`; `prisma.config.ts` na raiz fica fora do build (evita erro de `rootDir`)

---

## 3) Criar estrutura do app (Express)

Arquivo: `src/app.ts`

```ts
import express from 'express';
import { routes } from './routes';

const app = express();

app.use(express.json());
app.use(routes);

export { app };
```

Arquivo: `src/server.ts`

```ts
import { app } from './app';

const port = 3001;

app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});
```

Arquivo: `src/routes/index.ts` (no projeto atual também monta `/users` e o health check usa `_req` se não precisar do request):

```ts
import { Router } from 'express';
import { usersRoutes } from './usersRoutes';

const routes = Router();

routes.use('/users', usersRoutes);

routes.get('/health', (_req, res) => {
  res.json({ status: 'OK' });
});

export { routes };
```

Versão mínima no início (só health) basta para validar o servidor; depois evolua para `usersRoutes` como acima.

---

## 4) Configurar ESLint (flat config)

```bash
npm i -D eslint @eslint/js typescript-eslint globals
```

Arquivo: `eslint.config.mjs`

```js
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: { globals: globals.node },
  },
  {
    ignores: ['build/**', 'dist/**', 'node_modules/**'],
  },
  tseslint.configs.recommended,
  {
    files: ['**/*.{ts,mts,cts}'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
]);
```

`ignores` em bloco separado aplica globalmente (evita lintar `build/`, `dist/`, `node_modules/`).

Convenção: parâmetros/variáveis não usados com prefixo `_` (ex.: `_req` no Express).

Scripts no `package.json`:

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  }
}
```

---

## 5) Configurar Prettier

```bash
npm i -D prettier
```

Arquivo: `.prettierrc`

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all"
}
```

Scripts no `package.json` (no repositório atual):

```json
{
  "scripts": {
    "format": "prettier . --write",
    "format:check": "prettier . --check"
  }
}
```

Arquivo sugerido: `.prettierignore`

```txt
build
dist
node_modules
```

---

## 6) Configurar Conventional Commits + Husky + lint-staged

```bash
npm i -D husky lint-staged @commitlint/cli @commitlint/config-conventional
npx husky init
```

Script no `package.json`:

```json
{
  "scripts": {
    "prepare": "husky"
  }
}
```

Arquivo: `.husky/pre-commit`

```sh
npx lint-staged
```

Arquivo: `.husky/commit-msg`

```sh
npx --no -- commitlint --edit "$1"
```

Arquivo: `commitlint.config.cjs`

```js
module.exports = {
  extends: ['@commitlint/config-conventional'],
};
```

Arquivo: `lint-staged.config.mjs`

```js
export default {
  '*.{ts,js,mjs,cjs}': ['eslint --fix', 'prettier --write'],
  '*.{json,md,yml,yaml}': ['prettier --write'],
};
```

---

## 7) Validar localmente

```bash
npm run lint
npm run build
```

Teste de commit:

```bash
git add .
git commit -m "chore: test hooks setup"   # deve passar
git commit -m "teste commit"              # deve falhar no commitlint
```

---

## 8) Fluxo Git sem commit na main

```bash
git switch -c chore/setup-tooling
git commit -m "chore: configure TypeScript, ESLint, Prettier, Husky and commitlint"
git push -u origin chore/setup-tooling
```

---

## 9) Docker Compose (PostgreSQL Bitnami)

Arquivo na raiz: `docker-compose.yml` — sobe Postgres com usuário, senha e banco inicial:

```yaml
services:
  postgres:
    image: bitnami/postgresql:latest
    ports:
      - '5432:5432'
    environment:
      POSTGRESQL_USERNAME: postgres
      POSTGRESQL_PASSWORD: postgres
      POSTGRESQL_DATABASE: tasks
```

```bash
docker compose up -d
```

Se o volume já existia de antes, o banco `tasks` pode não ter sido criado; nesse caso crie manualmente (via `psql` ou `docker compose exec postgres ...`).

---

## 10) Desenvolvimento e scripts Prisma

- **`npm run dev`**: `tsx watch --env-file .env src/server.ts` — carrega `.env` e reinicia ao mudar arquivos sob o grafo de imports (rode a partir da **raiz** do projeto).
- **Scripts Prisma** no `package.json` carregam variáveis no shell POSIX (compatível com `npm run`, que usa `sh`):

```bash
set -a; . ./.env; set +a; npx prisma <comando>
```

Use **`.`** em vez de `source` para não falhar com `sh: source: not found`.

Comandos como `migrate`, `generate` e `db pull` devem ser executados na **raiz** (onde estão `prisma/schema.prisma` e `prisma.config.ts`).

---

## 11) Validação de entrada e hash de senha

Instalação (além de Express/Prisma), alinhada ao `package.json` atual:

```bash
npm i zod bcrypt
npm i -D @types/bcrypt
```

- **Zod** (`zod`): validação de body/query em controllers (ex.: criação/atualização de usuário).
- **bcrypt** (`bcrypt`, `@types/bcrypt`): hash da senha antes de persistir no banco.

---

## 12) Prisma — visão rápida

O passo a passo completo (models, `migrate`, `generate`, erros e scripts) está na seção **[Banco de dados: Prisma e PostgreSQL](#banco-de-dados-prisma-e-postgresql)** no final deste documento.

Resumo:

- **`prisma/schema.prisma`**: `generator` com `output` em `src/generated/prisma`; models e enums do domínio.
- **`prisma.config.ts`**: aponta schema, pasta de migrations e `DATABASE_URL`.
- **`src/database/prisma.ts`**: `PrismaClient` com **`@prisma/adapter-pg`** e **`pg`**.

---

## 13) Documentação no repositório

- **`README.md`**: visão geral, requisitos, início rápido e links.
- **`docs/SETUP.md`**: este arquivo — histórico e passo a passo detalhado.

---

## 14) API REST — CRUD de usuários

Rotas registradas em `src/routes/usersRoutes.ts` e montadas em `src/routes/index.ts` sob o prefixo **`/users`**.

| Método   | Rota         | Controller | Descrição                                      |
| -------- | ------------ | ---------- | ---------------------------------------------- |
| `GET`    | `/users`     | `index`    | Lista usuários (`findMany`).                   |
| `POST`   | `/users`     | `create`   | Cria usuário (senha com bcrypt).               |
| `PATCH`  | `/users/:id` | `update`   | Atualização parcial (`name`, `email`, `role`). |
| `DELETE` | `/users/:id` | `delete`   | Remove usuário por `id`.                       |

### `POST /users` — corpo (JSON)

Campos validados com Zod:

- `name` — string (obrigatório)
- `email` — e-mail válido (obrigatório)
- `password` — string, mínimo 6 caracteres (obrigatório)
- `role` — opcional: `"admin"` \| `"member"` (padrão `member`)

Respostas típicas:

- `201` — usuário criado; **senha omitida** no JSON de resposta.
- `400` — `{ "message": "User already exists" }` se o e-mail já existir.

### `PATCH /users/:id` — corpo (JSON)

Todos opcionais (pelo menos um deve ser enviado na prática):

- `name` — string
- `email` — e-mail válido
- `role` — `"admin"` \| `"member"`

Campos omitidos mantêm o valor atual no banco. Respostas: `200` com `data` sem senha, ou `404` se o `id` não existir.

### `DELETE /users/:id`

- `200` — `{ "message": "User deleted successfully" }`
- `404` — usuário não encontrado.

### `GET /users`

Retorno atual inclui o payload `{ message, data }`, sendo `data` o resultado do Prisma. **Observação:** `findMany()` sem `select` pode expor o campo `password` hash no JSON; em produção prefira `select` omitindo `password` ou um DTO explícito.

### Exemplos com `curl` (base `http://localhost:3001`)

```bash
# Listar
curl -sS http://localhost:3001/users

# Criar
curl -sS -X POST http://localhost:3001/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada","email":"ada@example.com","password":"secret12","role":"member"}'

# Atualizar (parcial)
curl -sS -X PATCH http://localhost:3001/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada Lovelace"}'

# Remover
curl -sS -X DELETE http://localhost:3001/users/1
```

---

## Resumo dos arquivos de configuração

- `package.json`
- `tsconfig.json`
- `eslint.config.mjs`
- `.prettierrc`
- `.prettierignore`
- `lint-staged.config.mjs`
- `commitlint.config.cjs`
- `.husky/pre-commit`
- `.husky/commit-msg`
- `docker-compose.yml`
- `prisma/schema.prisma`
- `prisma.config.ts`
- `src/app.ts`
- `src/server.ts`
- `src/routes/index.ts`
- `src/routes/usersRoutes.ts`
- `src/controllers/UsersController.ts`
- `src/database/prisma.ts`
- `docs/SETUP.md`

---

## Banco de dados: Prisma e PostgreSQL

Referência única para **models**, **migrate**, **generate**, **db pull**, scripts npm e erros comuns. Todos os comandos `prisma` assumem execução na **raiz do projeto** (onde estão `prisma/schema.prisma` e `prisma.config.ts`).

### Client gerado e Git

O diretório `src/generated/prisma/` está no **`.gitignore`**. Cada desenvolvedor (e o CI) precisa rodar **`npm run prisma:generate`** após `npm install`. Sem isso, imports como `../generated/prisma/client` quebram.

### Dois fluxos possíveis

| Fluxo                                | Quando usar                                                   | Comandos principais          |
| ------------------------------------ | ------------------------------------------------------------- | ---------------------------- |
| **Schema-first** (padrão deste repo) | Você define/edita models no `schema.prisma` e aplica no banco | `migrate dev`, `generate`    |
| **Introspect** (banco já existe)     | Tabelas criadas fora do Prisma; quer espelhar no schema       | `db pull`, depois `generate` |

---

### 1) Variáveis de ambiente

Crie um `.env` na raiz (exemplo):

```env
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tasks
JWT_SECRET=seu_jwt_secret
```

A `DATABASE_URL` deve apontar para um **database PostgreSQL que exista** (servidor pode estar no Docker — ver §9).

---

### 2) Garantir o database e o servidor PostgreSQL

- Suba o Postgres (ex.: `docker compose up -d`).
- Se o database `tasks` ainda não existir, crie:

```bash
psql -h localhost -U postgres -d postgres -c "CREATE DATABASE tasks;"
```

Ou via container: `docker compose exec postgres psql -U postgres -d postgres -c "CREATE DATABASE tasks;"`

---

### 3) Dependências npm

```bash
npm i @prisma/client @prisma/adapter-pg pg
npm i -D prisma dotenv
```

O app em runtime usa `@prisma/client` + adapter; o CLI é o pacote `prisma`.

---

### 4) Inicializar Prisma (projeto novo)

Se ainda não existir a pasta `prisma/`:

```bash
npx prisma init
```

Isso cria `prisma/schema.prisma` e costuma sugerir `.env`. Neste repositório o datasource também pode ser centralizado em `prisma.config.ts`.

---

### 5) Arquivos principais

| Arquivo                 | Função                                                                       |
| ----------------------- | ---------------------------------------------------------------------------- |
| `prisma/schema.prisma`  | `generator`, `datasource`, **models**, **enums**, relações, `@@map` / `@map` |
| `prisma.config.ts`      | Caminho do schema, pasta de migrations, `url` do datasource (`DATABASE_URL`) |
| `prisma/migrations/`    | Histórico SQL versionado (criado pelo `migrate dev`)                         |
| `src/generated/prisma/` | Client gerado (não editar à mão) — definido no `generator`                   |

Exemplo de `generator` e `datasource` mínimos no schema (o projeto usa output customizado):

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}
```

A URL do banco pode ficar só no `prisma.config.ts` (como aqui) ou também como `url = env("DATABASE_URL")` no `schema.prisma`, conforme a versão e o guia do Prisma que você seguir.

Exemplo de `prisma.config.ts`:

```ts
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
```

---

### 6) Models e domínio (este repositório)

No `schema.prisma` estão definidos, entre outros:

- **`User`**, **`Team`**, **`TeamMember`** (relação N:N usuário ↔ time)
- **`Task`**, **`TaskHistory`** (histórico de mudanças de status)
- **Enums:** `UserRole`, `TaskStatus`, `TaskPriority`

Relações usam `@relation`, FKs e `onDelete` onde aplicável; nomes de coluna SQL usam `@map` / `@@map` (snake_case).

Depois de alterar models:

1. Valide o schema:

```bash
npx prisma validate
```

2. Crie e aplique a migration em desenvolvimento:

```bash
npx prisma migrate dev --name descricao_da_mudanca
```

Isso gera SQL em `prisma/migrations`, aplica no banco e, nas versões atuais do Prisma, costuma **regenerar o client** automaticamente. Se precisar forçar:

```bash
npx prisma generate
```

---

### 7) `prisma generate` — quando rodar

- Sempre que o **client** precisar refletir o schema (novos models/campos).
- Após **`migrate dev`** se o seu fluxo não regenerar sozinho.
- Após **`db pull`** (introspect), para tipos e queries baterem com o banco.

```bash
npx prisma generate
```

Imports no código (conforme `output` do generator):

```ts
import { PrismaClient } from '../generated/prisma/client';
```

---

### 8) `prisma migrate dev` — desenvolvimento

Cria uma nova migration a partir das mudanças no `schema.prisma` e aplica no database da `DATABASE_URL`:

```bash
npx prisma migrate dev --name add_user_table
```

Use nomes descritivos. Para o estado inicial do schema:

```bash
npx prisma migrate dev --name init
```

**Não** use `migrate dev` em produção da mesma forma — o fluxo de deploy costuma ser `migrate deploy` com migrations já versionadas.

---

### 9) `prisma db pull` — introspecção

Atualiza o `schema.prisma` a partir do banco **existente** (tabelas já criadas):

```bash
npx prisma db pull
```

Depois: `generate`. Útil quando o banco foi criado manualmente ou por outra ferramenta.

---

### 10) Outros comandos úteis

```bash
npx prisma studio          # UI para inspecionar dados (desenvolvimento)
npx prisma migrate status  # estado das migrations
```

`migrate reset` apaga dados e reaplica migrations — **só em ambiente de desenvolvimento**.

---

### 11) Scripts no `package.json` (carregar `.env` no `sh`)

Na raiz, os scripts usam:

```bash
set -a; . ./.env; set +a; npx prisma <comando>
```

Exemplos já configurados: `prisma:migrate`, `prisma:generate`, `prisma:pull`.

- **`npm run prisma:migrate`** chama `prisma migrate dev` **sem** `--name` fixo. Para criar uma migration nomeada em uma linha:

  ```bash
  npm run prisma:migrate -- --name descricao_da_mudanca
  ```

- Para **só aplicar** migrations já commitadas (ex.: após clone, CI): use `npx prisma migrate deploy` (não exige nome de migration nova).

---

### 12) Erros frequentes

| Código / mensagem      | Causa provável                             | O que fazer                                                 |
| ---------------------- | ------------------------------------------ | ----------------------------------------------------------- |
| **P1003**              | Database da URL não existe                 | Criar o `CREATE DATABASE ...`                               |
| **P4001** (introspect) | Banco sem tabelas                          | Criar tabelas ou usar `migrate dev` em vez de `db pull`     |
| Schema não encontrado  | Comando rodado fora da raiz ou path errado | `cd` para a raiz do repo ou `--schema prisma/schema.prisma` |

---

### 13) Uso no código da API

`src/database/prisma.ts` instancia `PrismaClient` com o adapter PostgreSQL. Após mudanças no schema + `generate`, os tipos e o client passam a incluir os novos models.

---

**Checklist rápido (schema-first):** Postgres no ar → `.env` com `DATABASE_URL` → editar `schema.prisma` → `prisma validate` → `migrate dev` → (se necessário) `generate` → subir API com `npm run dev`.
