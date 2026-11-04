import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Nome do repositório: a demo é servida em gustavo-pereiraa.github.io/cubolab/
  base: '/cubolab/',
  test: {
    include: ['tests/**/*.test.js'],
  },
});
