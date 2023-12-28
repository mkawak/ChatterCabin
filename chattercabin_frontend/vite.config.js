import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';


export default defineConfig(({command}) => ({
  base: command === 'build' ? '/static/frontend/' : '/',
  plugins: [react()],
  build: {
    outDir: 'build',
    assetsDir: 'static',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8000',
      '/ws': {
        target: 'ws://127.0.0.1:8000',
        ws: true,
      },
      '/static': 'http://127.0.0.1:8000',
    },
  },
}));
