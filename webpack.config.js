require('dotenv').config()
const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const SriPlugin = require('webpack-subresource-integrity')

module.exports = (env, argv) => {
  const config = {
    entry: {
      client: './src/client.js'
    },
    output: {
      // Use argv to detect which mode we're in
      filename: `client.bundle${argv.mode === 'production' ? '.min' : ''}.js`,
      path: path.resolve(__dirname, 'build'),
      crossOriginLoading: 'anonymous'
    },
    plugins: [
      new CleanWebpackPlugin(),
      new HtmlWebpackPlugin({
        template: 'src/client.html',
        filename: 'client.html',
        favicon: 'src/assets/favicon.ico'
      }),
      new SriPlugin({
        hashFuncNames: ['sha256', 'sha384'],
        enabled: true
      })
    ],
    devtool: 'source-map',
    optimization: {
      minimizer: [new TerserPlugin({
        sourceMap: true
      })]
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [
            'style-loader',
            'css-loader'
          ]
        },
        {
          test: /\.worker\.js$/,
          use: {
            loader: 'worker-loader',
            options: { name: '[name].js' }
          }
        },
        {
          test: /\.(eot|svg|ttf|woff|woff2)$/,
          loader: 'file-loader?name=fonts/[name].[ext]'
        }
      ]
    }
  }
  if (argv.mode === 'production') {
  }
  return config
}
