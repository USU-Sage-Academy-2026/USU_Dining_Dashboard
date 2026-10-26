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
      '/api': 'http://127.0.0.1:8000',
    },
  },
})
