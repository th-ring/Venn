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
    worker: {
      format: 'es',
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
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            const normalizedId = id.replace(/\\/g, '/');
            if (
              normalizedId.includes('/node_modules/react/') ||
              normalizedId.includes('/node_modules/react-dom/') ||
              normalizedId.includes('/node_modules/scheduler/')
            ) {
              return 'vendor-react';
            }
            if (
              normalizedId.includes('/node_modules/leaflet/') ||
              normalizedId.includes('/node_modules/leaflet.gridlayer.googlemutant/')
            ) {
              return 'vendor-leaflet';
            }
            if (normalizedId.includes('/node_modules/@turf/')) {
              return 'vendor-turf';
            }
            if (normalizedId.includes('/node_modules/lucide-react/')) {
              return 'vendor-icons';
            }
          },
        },
      },
    },
  };
});
