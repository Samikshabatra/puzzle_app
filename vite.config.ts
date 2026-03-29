import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/sync':        { target: 'http://localhost:4000', changeOrigin: true },
      '/leaderboard': { target: 'http://localhost:4000', changeOrigin: true },
      '/user':        { target: 'http://localhost:4000', changeOrigin: true },
      '/health':      { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
  define: { 'process.env': {} },
});
