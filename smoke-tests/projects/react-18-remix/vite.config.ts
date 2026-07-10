import {vitePlugin as remix} from '@remix-run/dev';
import {defineConfig} from 'vite';
import path from 'path';

export default defineConfig({
  plugins: [remix()],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'app'),
    },
  },
});
