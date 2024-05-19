const path = require('path');

module.exports = {
  entry: './src/shading-and-textures.ts',
  mode: 'development',
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts'],
  },
  output: {
    filename: 'shading-and-textures.js',
    path: path.resolve(__dirname, 'dist'),
  },
};
