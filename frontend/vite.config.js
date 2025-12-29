import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { readFileSync } from 'fs'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  // Get the API key from .env.production if it exists, otherwise from .env
  let apiKey = env.VITE_GOOGLE_MAPS_API_KEY || ''
  
  // Try to read from .env.production directly if not found
  if (!apiKey && mode === 'production') {
    try {
      const envProd = readFileSync('.env.production', 'utf-8')
      const match = envProd.match(/^VITE_GOOGLE_MAPS_API_KEY=(.+)$/m)
      if (match) {
        apiKey = match[1].trim().replace(/^["']|["']$/g, '')
      }
    } catch (e) {
      // File doesn't exist, that's okay
    }
  }
  
  return {
    plugins: [react(), tailwindcss()],
    base: '/',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@constants': path.resolve(__dirname, './src/constants')
      }
    },
    // Explicitly define environment variables for build
    define: {
      'import.meta.env.VITE_GOOGLE_MAPS_API_KEY': JSON.stringify(apiKey),
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