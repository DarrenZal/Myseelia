const path = require('path')
const { merge } = require('webpack-merge')
const parts = require('./webpack.parts.cjs')
const { mode, analyze } = require('webpack-nano/argv')

const common = merge([
  { output: { path: path.resolve(process.cwd(), 'dist') } },
  parts.page({ title: 'Sh*t Kanye says' }),
  parts.svelte(mode),
  parts.extractCSS({ loaders: [parts.postcss()] }),
  parts.cleanDist(),
  parts.useWebpackBar(),
  parts.useDotenv()
])

const development = merge([
  { entry: ['./src/routes/+page.svelte', 'webpack-plugin-serve/client'] },
  { target: 'web' },
  parts.generateSourceMaps({ type: 'eval-source-map' }),
  parts.esbuild(),
  parts.devServer()
])

const production = merge(
  [
    { entry: ['./src/routes/+page.svelte'] },
    parts.typescript(),
    analyze && parts.analyze()
  ].filter(Boolean)
)

const getConfig = mode => {
  switch (mode) {
    case 'production':
      return merge(common, production, { mode })
    case 'development':
      return merge(common, development, { mode })
    default:
      throw new Error(`Unknown mode, ${mode}`)
  }
}

module.exports = getConfig(mode)