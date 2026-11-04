import { defineConfig } from 'vitest/config';

/**
 * A cubejs foi escrita em CoffeeScript e cada arquivo termina em `.call(this)`, contando com o
 * `this` do CommonJS. Empacotado, esse `this` fica undefined e a biblioteca quebra no navegador.
 */
const cubejsThisFix = () => ({
  name: 'cubejs-this-fix',
  transform(code, id) {
    if (!/[\\/]cubejs[\\/]lib[\\/]/.test(id)) return null;
    return { code: code.replace(/\.call\(this\);?\s*$/, '.call(globalThis);'), map: null };
  },
});

export default defineConfig({
  // Nome do repositório: a demo é servida em gustavo-pereiraa.github.io/cubolab/
  base: '/cubolab/',
  worker: {
    format: 'es',
    plugins: () => [cubejsThisFix()],
  },
  optimizeDeps: {
    rolldownOptions: { plugins: [cubejsThisFix()] },
  },
  build: {
    chunkSizeWarningLimit: 700, // o Three.js sozinho passa do limite padrão
  },
  test: {
    include: ['tests/**/*.test.js'],
  },
});
