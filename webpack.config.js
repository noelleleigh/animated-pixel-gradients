require('dotenv').config()
const path = require('path')
const process = require('process')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')

const isDev = process.env.DEVELOPMENT !== undefined

const common = {
  devtool: 'source-map',
  stats: {
    all: false,
    timings: true,
    modules: true,
    maxModules: 0,
    warnings: true,
    errors: true,
    errorDetails: true
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

const main = Object.assign({}, common, {
  entry: {
    client: './src/client.js'
  },
  output: {
    filename: `client.bundle${isDev ? '' : '.min'}.js`,
    path: path.resolve(__dirname, 'build')
  },
  plugins: [
    new CleanWebpackPlugin(['build']),
    new HtmlWebpackPlugin({
      template: 'src/client.html',
      filename: 'client.html',
      favicon: 'src/assets/favicon.ico'
    })
  ]
})

const sandbox = Object.assign({}, common, {
  entry: {
    sandbox: './src/sandbox.js'
  },
  output: {
    filename: 'sandbox.bundle.js',
    path: path.resolve(__dirname, 'build')
  },
  plugins: [
    new CleanWebpackPlugin(['build']),
    new HtmlWebpackPlugin({
      template: 'src/sandbox.html',
      filename: 'sandbox.html'
    })
  ]
})

const configs = [main]
if (isDev) {
  // In development...
  configs.push(sandbox)
} else {
  // In not development...
  configs[0].plugins.push(
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
module.exports = configs
