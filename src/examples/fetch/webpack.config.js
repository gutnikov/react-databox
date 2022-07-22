/* eslint-disable */
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = function() {
  const src = path.join(__dirname, 'src');
  const useDataSource = path.join(__dirname, '../../useDataSource');
  const dist = path.join(__dirname, 'build');

  const bundleName = `[name].[chunkhash:6].js`;
  const plugins = [
    new HtmlWebpackPlugin({
      template: 'index.html',
    }),
    new webpack.DefinePlugin({
      'API': '"http://localhost:4141"',
      'process.env': '{}',
      'process.platform': '"browser"',
      'process.stdout': 'null',
      global: {},
    }),
  ];
  return {
    mode: 'development',
    context: src,
    entry: {
      main: ['./index'],
    },
    module: {
      parser: {
        javascript: {
          exportsPresence: false,
        },
      },
      rules: [
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /(\.jsx?|\.tsx?)$/,
          include: [src, useDataSource],
          use: [
            {
              loader: 'esbuild-loader',
              options: {
                loader: 'tsx',
                target: 'es2015',
              },
            },
          ],
        },
      ],
    },
    output: {
      filename: bundleName,
      chunkFilename: bundleName,
      publicPath: '/',
      crossOriginLoading: 'use-credentials',
      globalObject: '(typeof self !== "undefined" ? self : this)',
      path: dist,
    },
    resolve: {
      modules: ['node_modules'],
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      alias: {
        useDataSource,
      },
      fallback: {
        path: require.resolve('path-browserify'),
        tty: require.resolve('tty-browserify'),
        url: require.resolve('url'),
        buffer: require.resolve('buffer'),
        http: false,
        fs: false,
        os: false,
      },
    },
    plugins,
    resolveLoader: {
      extensions: ['.js', '.ts'],
    },
    devServer: {
      compress: false,
      host: '0.0.0.0',
      port: 4242,
      historyApiFallback: true,
    },
    node: false,
  };
};
