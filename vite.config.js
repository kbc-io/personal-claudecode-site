import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Every asset in this repo is already WebP, and re-encoding those (or
    // SVGs, which need svgo) only produced larger files and build noise.
    // Scoped to raster sources so a dropped-in PNG/JPEG still gets optimized.
    ViteImageOptimizer({
      test: /\.(jpe?g|png)$/i,
      png: { quality: 60 },
      jpeg: { quality: 60 },
      jpg: { quality: 60 },
    }),
  ],
})
