import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  optimizeDeps: {
    include: ['react-countup', 'lucide-react', 'date-fns'],
  },
  build: {
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3')) {
            return 'vendor-charts'
          }
          if (id.includes('node_modules/framer-motion') || id.includes('node_modules/gsap') || id.includes('node_modules/lenis')) {
            return 'vendor-motion'
          }
          if (id.includes('node_modules/@supabase')) {
            return 'vendor-supabase'
          }
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router-dom/')) {
            return 'vendor-react'
          }
          if (id.includes('node_modules/date-fns')) {
            return 'vendor-date-fns'
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons'
          }
        },
      },
    },
  },
  server: {
    hmr: {
      overlay: false,
    },
  },
})
