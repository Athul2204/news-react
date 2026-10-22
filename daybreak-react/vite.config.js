import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/* In development the React app (5173) talks to the API (8000) through this proxy, so the
   browser sees one origin. For production either serve `dist/` from the API itself
   (backend/server.py does this automatically) or set VITE_API_URL at build time. */
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://127.0.0.1:8000' } },
});
