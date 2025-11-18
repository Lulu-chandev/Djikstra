import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Djikstra/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
