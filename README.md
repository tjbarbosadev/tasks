# Tasks API

## Setup completo (ordem ideal)

### 1) Inicializar projeto Node + TypeScript

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

### 2) Ajustar TypeScript para CommonJS

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
  }
}
```

Pontos importantes:

- adicionar `rootDir` para corrigir TS5011
- remover `moduleResolution: "node"` para evitar depreciao no TS6

### 3) Criar estrutura do app (Express)

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
import { app } from './app.js';

const port = 3001;

app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});
```

Arquivo: `src/routes/index.ts`

```ts
import { Router } from 'express';

const routes = Router();

routes.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

export { routes };
```

### 4) Configurar ESLint (flat config)

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
    ignores: ['build/**', 'dist/**', 'node_modules/**'],
  },
  tseslint.configs.recommended,
]);
```

Scripts no `package.json`:

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  }
}
```

### 5) Configurar Prettier

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

Scripts sugeridos no `package.json`:

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

### 6) Configurar Conventional Commits + Husky + lint-staged

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

### 7) Validar localmente

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

### 8) Fluxo Git sem commit na main

```bash
git switch -c chore/setup-tooling
git commit -m "chore: configure TypeScript, ESLint, Prettier, Husky and commitlint"
git push -u origin chore/setup-tooling
```

## Resumo dos arquivos de configuracao

- `package.json`
- `tsconfig.json`
- `eslint.config.mjs`
- `.prettierrc`
- `.prettierignore`
- `lint-staged.config.mjs`
- `commitlint.config.cjs`
- `.husky/pre-commit`
- `.husky/commit-msg`
- `src/app.ts`
- `src/server.ts`
- `src/routes/index.ts`
