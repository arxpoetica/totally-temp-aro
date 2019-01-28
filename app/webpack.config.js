var path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

module.exports = {
  entry: './public/javascripts/src/components/index.js', 
  output: {
    path: path.resolve(__dirname, 'public/javascripts/lib'),
    filename: 'aro-bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.js|\.jsx$/,
        exclude: [
          '/node_modules/',
          './public/javascripts/src/service-typegen/**'
        ],
        use:{
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/preset-react"]
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
