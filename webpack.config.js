const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const TerserPlugin = require("terser-webpack-plugin");
const WebpackBar = require('webpackbar');
const archiver = require('archiver'); // 压缩工具

const source = path.resolve(__dirname, 'src');

// 压缩文件
const zipDist = () => {
  console.log('build成功 开始压缩');
  const output = fs.createWriteStream('dist.zip');
  const archive = archiver('zip');
  archive.pipe(output);
  archive.directory('lib/');
  archive.finalize();
}

module.exports = (env) => {
  const isProduction = env.production;
  return {
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? false : 'cheap-module-source-map',
    entry: {
      popup: './src/js/popup.js',
      panel: './src/js/panel.js',
      devtool: './src/js/devtool.js',
      background: './src/js/background.js',
      contentScripts: './src/js/contentScripts.js',
      injectScripts: './src/js/injectScripts.js',
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'js/[name].js',
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          include: source,
          exclude: '/node_modules/',
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', '@babel/preset-react'],
            },
          },
        },
        {
          test: /\.(css|less)$/,
          use: [
            {
              loader: 'style-loader'
            },
            {
              loader: 'css-loader'
            },
            {
              loader: 'less-loader',
            }
          ]
        },
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: 'devtool.html',
        template: 'src/devtool.html',
        chunks: ['devtool'],
        inject: 'body',
      }),
      new HtmlWebpackPlugin({
        filename: 'popup.html',
        template: 'src/popup.html',
        chunks: ['popup']
      }),
      new HtmlWebpackPlugin({
        filename: 'panel.html',
        template: 'src/panel.html',
        chunks: ['panel']
      }),
      new HtmlWebpackPlugin({
        filename: 'background.html',
        template: 'src/background.html',
        chunks: ['background'],
        inject: 'body',
      }),
      new CopyPlugin({
        patterns: [
          { from: 'public' },
        ],
      }),
      new CleanWebpackPlugin(),
      new WebpackBar(),
      {
        apply: (compiler) => {
          compiler.hooks.afterEmit.tap('afterCompile', (compilation) => {
            if(isProduction) {
              zipDist();
            }
          });
        }
      }
    ],
    optimization: {
      minimize: isProduction ? true : false,
      minimizer: [
        new TerserPlugin({
          extractComments: false,
        }),
      ],
    },
    performance: {
      hints: false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
  }
};