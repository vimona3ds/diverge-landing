import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Base public path when served in production
  base: './',
  
  // Configure the server
  server: {
    port: 3000,
    open: true
  },
  
  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        // '3dtest': resolve(__dirname, '3dtest.html')
      }
    }
  },
  
  // Resolve aliases
  resolve: {
    alias: {
      'three': resolve(__dirname, 'node_modules/three')
    }
  }
}); 