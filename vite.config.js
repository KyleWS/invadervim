import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true
  },
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser']
        }
      }
    }
  }
});
