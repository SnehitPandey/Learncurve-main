import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000, // Match backend CORS configuration
    allowedHosts: [
      '.ngrok-free.dev',
      '.ngrok.io',
      '.ngrok-free.app',
      '.devtunnels.ms',
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/auth': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/rooms': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/users': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/channels': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/boards': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/lists': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/tasks': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/ai': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/content': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/notifications': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/health': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/db-check': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true, // Enable WebSocket proxying
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port: 3000,
  },
})

