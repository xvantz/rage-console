import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    cli: 'src/cli.ts',
  },
  format: ['cjs', 'esm'],
  dts: {
    entry: {
      index: 'src/index.ts'
    }
  },
  sourcemap: true,
  clean: true,
  splitting: false,
  target: 'node18',
  shims: false,
});