import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const isGhPages = process.env.GITHUB_PAGES === 'true';

export default defineConfig({
  plugins: [react()],
  base: isGhPages ? '/disciplinev2/' : '/',
});
