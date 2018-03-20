var path = require('path');
var glob = require('glob');

module.exports = {
  entry: './public/javascripts/src/components/index.js',  
  output: {
    filename:'./public/javascripts/bundle.js'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use:{
          loader: "babel-loader",
          options: {
            presets: ['es2015']
          }
        }
      }
    ]
  }
};
