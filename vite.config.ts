import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      proxy: {
        '/api/google-isochrone': {
          target: 'https://isochrones.googleapis.com',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/google-isochrone/, '/v1/isochrones:generate'),
          secure: true,
        },
      },
    },
  };
});
