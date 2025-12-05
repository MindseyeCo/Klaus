import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/klaus/',
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})