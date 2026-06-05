import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_API_PROXY_TARGET || env.VITE_API_BASE_URL || 'http://localhost:5000'

  return {
    plugins: [
      react({
        babel: {
          plugins: [['babel-plugin-react-compiler']],
        },
      }),
    ],
    server: {
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          timeout: 15000,
          proxyTimeout: 15000,
        },
        '/track': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          timeout: 15000,
          proxyTimeout: 15000,
        },
        '/template-assets': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          timeout: 15000,
          proxyTimeout: 15000,
        },
      },
    },
  }
})
