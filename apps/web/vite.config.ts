import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/salud': process.env.API_PROXY ?? 'http://localhost:3000',
      '/sesion': process.env.API_PROXY ?? 'http://localhost:3000',
      '/pacientes': process.env.API_PROXY ?? 'http://localhost:3000',
      '/catalogos': process.env.API_PROXY ?? 'http://localhost:3000',
      '/docs': process.env.API_PROXY ?? 'http://localhost:3000',
      '/docs-json': process.env.API_PROXY ?? 'http://localhost:3000',
    },
  },
});
