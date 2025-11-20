import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Gemini servisinde process.env kullanımı hatasını önlemek için
    'process.env': process.env
  }
});