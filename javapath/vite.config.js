import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
    plugins: [tailwindcss(), react()],
    server: {
        port: 5173,
        strictPort: false
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: { vendor: ['react', 'react-dom', 'lucide-react'] }
            }
        }
    }
});
