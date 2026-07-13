// smoke-tests/projects/react-19-vite/vite.config.ts
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {port: 4001, open: false},
});
