import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react(), tailwindcss()],
    base: '/',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@constants': path.resolve(__dirname, './src/constants')
      }
    },
    build: {
      outDir: 'dist'
    },
    server: {
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      host: true,
      allowedHosts: [
        'stairs.astroraag.com',
        'localhost',
        '.astroraag.com' // Allow all subdomains
      ]
    }
  }
})