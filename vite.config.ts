import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './' // relative asset paths — works at any GitHub Pages project URL without config
})
