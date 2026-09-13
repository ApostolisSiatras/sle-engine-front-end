import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const baseUrl = env.LOCAL_LLM_BASE_URL || 'http://127.0.0.1:1234';
  const apiPath = env.LOCAL_LLM_API_PATH || '/v1/chat/completions';
  const endpoint = new URL(apiPath, baseUrl);

  return {
    plugins: [react()],
    define: { __LOCAL_LLM_MODEL__: JSON.stringify(env.LOCAL_LLM_MODEL || '') },
    build: { rollupOptions: { input: 'react.html' } },
    server: {
      open: '/react.html',
      proxy: {
        '/api/llm/chat': {
          target: endpoint.origin,
          changeOrigin: true,
          rewrite: () => endpoint.pathname + endpoint.search,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (env.LOCAL_LLM_API_KEY) {
                proxyReq.setHeader('Authorization', `Bearer ${env.LOCAL_LLM_API_KEY}`);
              }
            });
          }
        }
      }
    }
  };
});
