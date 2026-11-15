import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import { devvit } from '@devvit/start/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwind(),
    devvit({
      client: {
        build: {
          rolldownOptions: {
            onwarn(warning, defaultHandler) {
              if (
                warning.code === 'MODULE_LEVEL_DIRECTIVE' &&
                warning.message.includes('use client')
              ) {
                return;
              }
              defaultHandler(warning);
            },
          },
        },
      },
    }),
  ],
});
