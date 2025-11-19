import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
// Note: Multi-page build to support browser extension side panel without altering the SPA.
// Revert: Remove rollupOptions.input to go back to single-page build.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        // Extension side panel entry (kept separate so SPA remains unchanged)
        sidepanel: resolve(__dirname, 'sidepanel.html'),
      },
    },
  },
})

