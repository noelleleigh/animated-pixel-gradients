const path = require('path')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const common = {
  devtool: 'source-map',
  stats: 'minimal',
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
        test: /\.min\.js$/,
        use: ['source-map-loader'],
        enforce: 'pre'
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
    filename: 'client.bundle.js',
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

// const test = Object.assign({}, common, {
//   entry: {
//     test: './src/sandbox.js'
//   },
//   output: {
//     filename: 'test.bundle.js',
//     path: path.resolve(__dirname, 'build')
//   },
//   plugins: [
//     new CleanWebpackPlugin(['build']),
//     new HtmlWebpackPlugin({
//       template: 'src/sandbox.html',
//       filename: 'test.html'
//     })
//   ]
// })

// module.exports = [ main, test ]
module.exports = main
