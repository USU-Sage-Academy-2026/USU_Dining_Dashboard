import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Only use '/static/frontend/' when running 'npm run build' for Django
  base: command === 'build' ? '/static/frontend/' : '/',
  build: {
    outDir: '../django_stuff/static/frontend',
    emptyOutDir: true,
    manifest: true,
  },
  server: {
    proxy: {
      '/accounts': 'http://localhost:8000',
      '/admin': 'http://localhost:8000',
      '^/static/(?!frontend)': 'http://localhost:8000',
      '/api': 'http://localhost:8000',
    },
  },
}))