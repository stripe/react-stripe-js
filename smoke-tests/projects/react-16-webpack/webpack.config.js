const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.tsx',
  output: {path: path.resolve(__dirname, 'dist'), filename: 'bundle.js'},
  module: {
    rules: [{
      test: /\.[jt]sx?$/,
      exclude: /node_modules/,
      use: {loader: 'babel-loader'},
    }],
  },
  resolve: {extensions: ['.tsx', '.ts', '.js']},
  plugins: [new HtmlWebpackPlugin({template: './public/index.html'})],
};
