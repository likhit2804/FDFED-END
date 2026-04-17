import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Urbanease',
        short_name: 'Urbanease',
        description: 'Comprehensive Digital Society Management Platform',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Precaches all HTML, JS, CSS, and media assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        // Increase maximum file size rule to 5MB to handle bulky static assets
        maximumFileSizeToCacheInBytes: 5000000
      }
    })
  ],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
      "/admin/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
      "/login": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
      "/logout": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
      "/leaves": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
      "/interest": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
      // Role-based route prefixes — proxy API fetch calls to Express,
      // but let browser navigation (Accept: text/html) through to Vite/React.
      "/resident": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
        bypass: (req) => {
          if (req.headers.accept?.includes("text/html")) return req.url;
        },
      },
      "/security": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
        bypass: (req) => {
          if (req.headers.accept?.includes("text/html")) return req.url;
        },
      },
      "/worker": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
        bypass: (req) => {
          if (req.headers.accept?.includes("text/html")) return req.url;
        },
      },
      "/manager": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
        bypass: (req) => {
          if (req.headers.accept?.includes("text/html")) return req.url;
        },
      },
      "/resident-register": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
        bypass: (req) => {
          if (req.headers.accept?.includes("text/html")) return req.url;
        },
      },
    },

  },

});
