import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5176, // Change this to whatever port you want (e.g., 3000)
    strictPort: true,
    watch: {
      // This tells the Vite server: "Do not watch this file for changes"
      ignored: ['**/vite.config.js']
    } // This ensures Vite won't automatically try another port if 3000 is busy
  }
})
