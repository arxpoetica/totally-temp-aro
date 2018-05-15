var path = require('path');
var glob = require('glob');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

module.exports = {
  entry: './public/javascripts/src/components/index.js', 
  output: {
    filename:'./public/javascripts/bundle.js'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: [
          '/node_modules/',
          './public/javascripts/src/service-typegen/**'
        ],
        use:{
          loader: "babel-loader",
          options: {
            presets: ['es2015']
          }
        }
      }
    ]
  },
  devtool: 'source-map',
  plugins: [
    new UglifyJsPlugin({
      sourceMap: true
    })
  ]
};
