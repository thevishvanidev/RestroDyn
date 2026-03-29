import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        menu: resolve(__dirname, 'menu.html'),
        admin: resolve(__dirname, 'admin.html'),
        kitchen: resolve(__dirname, 'kitchen.html'),
        register: resolve(__dirname, 'register.html'),
        superAdmin: resolve(__dirname, 'super-admin.html'),
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
