import { sveltekit } from '@sveltejs/kit/vite'
import { resolve } from 'path'
// Removed nodePolyfills import

/** @type {import('vite').UserConfig} */
const config = {
  plugins: [
    sveltekit(),
  ],
  resolve: {
    alias: {
      // Mirror aliases from svelte.config.js
      $components: resolve('./src/components'),
      $lib: resolve('./src/lib'),
      $routes: resolve('./src/routes'),
      $src: resolve('./src'),
      $static: resolve('./static')
    }
  },
  // Removed define section (likely not needed without polyfills)
  // Removed optimizeDeps section
}

export default config
