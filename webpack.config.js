const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
var autoprefixer = require('autoprefixer');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var distPath = path.resolve(__dirname, 'dist');


module.exports = {
    entry: [
        './writer/app.js'
    ],
    output: {
        filename: "app.js",
        path: distPath,
        publicPath: '/'
    },
    externals: ['substance'],
    postcss: [
        autoprefixer({
            browsers: ['last 2 versions']
        })
    ],
    devtool: 'source-map',
    module: {
        loaders: [
            {
                test: /\.(png|woff|woff2|eot|ttf|svg)$/,
                loader: 'url-loader?limit=100000'
            },
            {
                test: /\.scss$/,
                loader: ExtractTextPlugin.extract('style', 'css!sass' )
            },
            {
                test: /\.(js|jsx|es6)$/,
                exclude: /(node_modules)/,
                loaders: [
                    'babel?presets[]=es2015-node6,presets[]=stage-3'
                ]
            }
        ]
    },
    cssLoader: {
        // True enables local scoped css
        modules: false,
        // Which loaders should be applied to @imported resources (How many after the css loader)
        importLoaders: 1,
        sourceMap: true
    },
    plugins: [
        new ExtractTextPlugin("styles/app.css"),
        new webpack.ProvidePlugin({
            'fetch': 'imports?this=>global!exports?global.fetch!whatwg-fetch'
        }),
        new CopyWebpackPlugin([
            {
                from: 'node_modules/substance/dist',
                to: './substance'
            },
            {
                from: 'node_modules/cropjs/dist',
                to: './cropjs'
            },
            {
                from: 'node_modules/font-awesome',
                to: './font-awesome'
            },
            {
                from: "writer/index.html",
                to: "index.html"
            },
            {
                from: "writer/serviceworker.js",
                to: "serviceworker.js"
            },
            {
                from: "writer/styles/app.css",
                to: "styles/app.css"
            },
            {
                from: 'writer/assets',
                to: 'assets'
            }
        ])
    ]
};
