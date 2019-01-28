var path = require('path');
var glob = require('glob');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

module.exports = [
  // Configuration for the AngularJS app
  {
    entry: './public/javascripts/src/components/index.js', 
    output: {
      path: path.resolve(__dirname, 'public/javascripts/lib'),
      filename: 'angularjs-bundle.js'
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: [
            '/node_modules/',
            './public/javascripts/src/service-typegen/**',
            './public/javascripts/src/react/'
          ],
          use:{
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env"]
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
  },

  // Configuration for the ReactJS app
  {
    entry: './public/javascripts/src/react/index.js',
    output: {
      path: path.resolve(__dirname, 'public/javascripts/lib'),
      filename: 'reactjs-bundle.js'
    },
    module: {
      rules: [
        {
          test: /\.jsx$/,
          exclude: [
            '/node_modules/',
            './public/javascripts/src/service-typegen/**',
            './public/javascripts/src/react/'
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
  }

];
