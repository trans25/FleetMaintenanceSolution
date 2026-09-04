import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// The API gateway (Fleet.Gateway / YARP) is expected to run on http://localhost:5000
// and routes: /auth -> Auth.API, /fleet -> Fleet.API, /workshop -> Workshop.API
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const GATEWAY = env.VITE_GATEWAY_URL || 'http://localhost:5000';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/auth': { target: GATEWAY, changeOrigin: true, secure: false },
        '/fleet': { target: GATEWAY, changeOrigin: true, secure: false },
        '/workshop': { target: GATEWAY, changeOrigin: true, secure: false }
      }
    }
  };
});
