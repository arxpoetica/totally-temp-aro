import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
const dev = process.env.NODE_ENV === 'development'

// https://stackoverflow.com/a/62892482/209803
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default {
  entry: resolve(__dirname, './public/javascripts/src/components/index.js'),
  output: {
    path: resolve(__dirname, 'public/javascripts/lib'),
    filename: 'aro-bundle.js',
  },
  mode: dev ? 'development' : 'production',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          presets: [
            '@babel/preset-env',
            '@babel/preset-react',
            { plugins: ['@babel/plugin-proposal-class-properties'] }
          ],
        },
        resolve: {
          fullySpecified: false,
          extensions: ['', '.js', '.jsx'],
        },
      },
      // {
      //   test: /\.jsx?$/,
      //   exclude: /node_modules/,
      //   loader: 'esbuild-loader',
      //   options: {
      //     loader: 'jsx',  // Remove this if you're not using JSX
      //     target: 'es2015'  // Syntax to compile to (see options below for possible values)
      //   },
      //   resolve: {
      //     fullySpecified: false,
      //     extensions: ['', '.js', '.jsx'],
      //   },
      // },
      {
        test: /\.css$/i,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: { url: false },
          },
        ],
      },
    ],
  },
}
