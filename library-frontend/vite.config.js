import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base path for Docker deployment (nginx serves SPA at /app/)
  // In dev mode, Vite ignores this since it serves from root
  base: '/app/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
