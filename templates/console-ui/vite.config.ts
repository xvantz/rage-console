import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from 'path'

export default defineConfig({
  base: './',
  plugins: [svelte()],
  css: {
    modules: {
      localsConvention: 'camelCase'
    }
  },
  resolve: {
    alias: {
      '@types': path.resolve("../../src/types.ts"),
    }
  },
  build: {
    cssCodeSplit: true,
    assetsInlineLimit: 0,
    outDir: path.resolve('../../ui-static'),
    rollupOptions: {
      onwarn(warning) {
        console.warn(`Warning: ${warning.message}`);
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        entryFileNames: `[name].js`,
        chunkFileNames: `[name].js`,
        assetFileNames: `[name].[ext]`,
      },
      treeshake: true,
    },
    assetsDir: 'static',
    emptyOutDir: true,
  },
})
