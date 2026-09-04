import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  /* GitHub Pages serves a project site from /<repo>/, so the workflow sets
     VITE_BASE. Locally and on any host that serves from the root it stays "/". */
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: { port: 4174 },
});
