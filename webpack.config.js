require('dotenv').config()
const path = require('path')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')

// Use argv to detect which mode we're in
module.exports = (env, argv) => {
  const config = {
    entry: {
      client: './src/client.js'
    },
    output: {
      filename: `client.bundle${argv.mode === 'production' ? '.min' : ''}.js`,
      path: path.resolve(__dirname, 'build')
    },
    plugins: [
      new CleanWebpackPlugin(['build']),
      new HtmlWebpackPlugin({
        template: 'src/client.html',
        filename: 'client.html',
        favicon: 'src/assets/favicon.ico'
      })
    ],
    devtool: 'source-map',
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
            options: {name: '[name].js'}
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
    config.plugins.push(
      new UglifyJSPlugin({
        sourceMap: true,
        parallel: true,
        uglifyOptions: {
          compress: {
            inline: 1
          }
        }
      })
    )
  }
  return config
}
