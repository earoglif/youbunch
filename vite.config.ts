import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { crx } from '@crxjs/vite-plugin'
import { createManifest } from './manifest.config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const googleClientId = env.VITE_GOOGLE_CLIENT_ID

  if (!googleClientId) {
    throw new Error('Missing VITE_GOOGLE_CLIENT_ID in .env')
  }

  const isStoreBuild = mode === 'store'

  return {
    plugins: [
      react(),
      tailwindcss(),
      crx({ manifest: createManifest(googleClientId, !isStoreBuild) }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
      cors: {
        origin: [/chrome-extension:\/\//],
      },
      hmr: {
        host: '127.0.0.1',
        port: 5173,
        protocol: 'ws',
      },
    },
  }
})
