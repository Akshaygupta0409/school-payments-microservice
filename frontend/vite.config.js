import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default defineConfig({
  publicDir: false,
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer,
      ],
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:4574',
        changeOrigin: true,
        secure: false
      }
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      // Enable JSX syntax in .js and .jsx files
      loader: { 
        '.js': 'jsx',
        '.jsx': 'jsx'
      }
    }
  }
})
