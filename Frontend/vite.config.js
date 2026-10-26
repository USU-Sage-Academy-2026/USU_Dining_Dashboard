import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/static/frontend/',
  build: {
    outDir: '../django_stuff/static/frontend',
    emptyOutDir: true,
    manifest: true,
  },
  server: {
    proxy: {
      '^/$': 'http://localhost:8000',
      '/accounts': 'http://localhost:8000',
      '/admin': 'http://localhost:8000',
      '/dashboard': 'http://localhost:8000',
      '/static': 'http://localhost:8000',
      '/api': 'http://localhost:8000',
    },
  },
})
