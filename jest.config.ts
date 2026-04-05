/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type { Config } from 'jest';

const config: Config = {
  // Usa ts-jest para transformar .ts em JS antes de rodar os testes (suporta tipos, etc.).
  preset: 'ts-jest',
  // Ambiente simulado: "node" para APIs/backend (sem DOM do browser).
  testEnvironment: 'node',
  // Pastas raiz onde o Jest procura suites; aqui só o código-fonte em src/.
  roots: ['<rootDir>/src'],
  // Padrão de arquivos que contam como teste (ex.: foo.test.ts em qualquer subpasta).
  testMatch: ['**/*.test.ts'],
  // Para no primeiro suite que falhar (útil com muitos testes em CI ou debug).
  bail: true,
  // Limpa mocks (jest.fn, etc.) antes de cada teste para evitar vazamento de estado.
  clearMocks: true,
  // Engine de cobertura: "v8" usa o mesmo motor de cobertura do Node/V8.
  coverageProvider: 'v8',
};

export default config;
