const path = require('path')
const dev = process.env.NODE_ENV === 'development'

module.exports = {
  entry: path.resolve(__dirname, './public/javascripts/src/components/index.js'),
  output: {
    path: path.resolve(__dirname, 'public/javascripts/lib'),
    filename: 'aro-bundle.js',
  },
  mode: dev ? 'development' : 'production',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              '@babel/preset-react', {
                plugins: ['@babel/plugin-proposal-class-properties']
              }
            ]
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  }
}
