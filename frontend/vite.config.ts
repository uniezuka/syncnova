import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // In dev, the frontend calls relative "/api" paths (see src/api/client.ts).
  // This proxy forwards them to the backend so no CORS setup is needed locally.
  // Point it elsewhere via DEV_API_PROXY_TARGET if the backend runs on a different port.
  const proxyTarget = env.DEV_API_PROXY_TARGET || 'http://localhost:4000'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
