var path = require('path');
var glob = require('glob');

module.exports = {
  // resolve: {
  //   extensions: [".js"],
  //   alias: {
  //       models: path.resolve(__dirname, "public/javascripts/models")
  //   }
  // },
  entry: './public/javascripts/src/components/index.js',  
  // entry: {a: './public/javascripts/src/components/sidebar/view/boundary-detail.js',
  // b: './public/javascripts/src/components/sidebar/view/equipment-detail-component.js'
  // },
  //entry: glob.sync('./public/javascripts/src/components/**/*.js*'),
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
