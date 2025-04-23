import preprocess from 'svelte-preprocess'
import adapter from '@sveltejs/adapter-auto' // Use adapter-auto

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: preprocess({
    postcss: true,
  }),
  kit: {
    adapter: adapter(), // Use adapter-auto with default options
    alias: {
      // Define aliases based on tsconfig.json paths
      '$components': 'src/components',
      '$lib': 'src/lib',
      '$routes': 'src/routes',
      '$src': 'src',
      '$static': 'static'
    }
    // Removed paths configuration as base path is not needed for hash routing on root deployment
  },
}

export default config
