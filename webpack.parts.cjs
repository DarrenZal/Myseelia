const path = require('path')
const { MiniHtmlWebpackPlugin } = require('mini-html-webpack-plugin')
const { WebpackPluginServe } = require('webpack-plugin-serve')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const WebpackBar = require('webpackbar')
const DotenvPlugin = require('dotenv-webpack')
const { ESBuildPlugin } = require('esbuild-loader')


exports.devServer = () => ({
  watch: true,
  plugins: [
    new WebpackPluginServe({
      port: 3000,
      static: path.resolve(process.cwd(), 'dist'),
      historyFallback: true
    })
  ]
})

exports.page = ({ title }) => ({
  plugins: [new MiniHtmlWebpackPlugin({ publicPath: '/', context: { title } })]
})

exports.generateSourceMaps = ({ type }) => ({ devtool: type })


exports.svelte = mode => {
    const prod = mode === 'production'
  
    return {
      resolve: {
        alias: {
          svelte: path.dirname(require.resolve('svelte/package.json'))
        },
        extensions: ['.mjs', '.js', '.svelte', '.ts'],
        mainFields: ['svelte', 'browser', 'module', 'main']
      },
      module: {
        rules: [
          {
            test: /\.svelte$/,
            use: {
              loader: 'svelte-loader',
              options: {
                compilerOptions: {
                  dev: !prod
                },
                emitCss: prod,
                hotReload: !prod,
                // preprocess: preprocess({
                //   postcss: true
                // })
              }
            }
          },
          {
            test: /node_modules\/svelte\/.*\.mjs$/,
            resolve: {
              fullySpecified: false
            }
          }
        ]
      }
    }
  }

  const MiniCssExtractPlugin = require('mini-css-extract-plugin')

// ...

exports.postcss = () => ({
  loader: 'postcss-loader'
})

exports.extractCSS = ({ options = {}, loaders = [] } = {}) => {
  return {
    module: {
      rules: [
        {
          test: /\.(p?css)$/,
          use: [{ loader: MiniCssExtractPlugin.loader, options }, 'css-loader'].concat(
            loaders
          ),
          sideEffects: true
        }
      ]
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: '[name].css'
      })
    ]
  }
}

exports.cleanDist = () => ({
  plugins: [new CleanWebpackPlugin()]
})

// show a nice progress bar in the terminal
exports.useWebpackBar = () => ({
  plugins: [new WebpackBar()]
})

exports.useDotenv = () => ({
  plugins: [new DotenvPlugin()]
})

exports.esbuild = () => {
  return {
    module: {
      rules: [
        {
          test: /\.js$/,
          loader: 'esbuild-loader',
          options: {
            target: 'es2015'
          }
        },
        {
          test: /\.ts$/,
          loader: 'esbuild-loader',
          options: {
            loader: 'ts',
            target: 'es2015'
          }
        }
      ]
    },
    plugins: [new ESBuildPlugin()]
  }
}

exports.typescript = () => ({
  module: { rules: [{ test: /\.ts$/, use: 'ts-loader', exclude: /node_modules/ }] }
})
