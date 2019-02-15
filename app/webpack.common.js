var path = require('path')

module.exports = {
  entry: path.resolve(__dirname, './public/javascripts/src/components/index.js'),
  output: {
    path: path.resolve(__dirname, 'public/javascripts/lib'),
    filename: 'aro-bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      }
    ]
  }
}
