import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Base path for Docker deployment (nginx serves SPA at /app/)
  // Use '/' in dev mode to fix the "Failed to load url /src/main.jsx" error
  base: command === 'serve' ? '/' : '/app/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
}))
