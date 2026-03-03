import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true, // Listen on all addresses
    port: 5173,
    proxy: {
      '/predict': 'http://127.0.0.1:8000',
      '/upload_model': 'http://127.0.0.1:8000',
      '/feedback': 'http://127.0.0.1:8000',
      '/sample-dog': 'http://127.0.0.1:8000',
      '/sample-cat': 'http://127.0.0.1:8000',
      '/model_info': 'http://127.0.0.1:8000',
    }
  }
})
