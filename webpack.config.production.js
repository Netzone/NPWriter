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
        filename: "writer/app.js",
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
        // preLoaders: [
        //     { test: /\.js?$/, loader: 'eslint', exclude: /node_modules/ },
        // ]
    },
    cssLoader: {
        // True enables local scoped css
        modules: false,
        // Which loaders should be applied to @imported resources (How many after the css loader)
        importLoaders: 1,
        sourceMap: true
    },
    // eslint: {
    //     failOnWarning: false,
    //     failOnError: true
    // },
    plugins: [
        function()
        {
            this.plugin("done", function(stats)
            {
                if (stats.compilation.errors && stats.compilation.errors.length && process.argv.indexOf('--watch') == -1)
                {
                    console.log(stats.compilation.errors);
                    process.exit(1); // or throw new Error('webpack build failed.');
                }
                // ...
            });
        },
        new ExtractTextPlugin("writer/styles/app.css"),
        new webpack.ProvidePlugin({
            'fetch': 'imports?this=>global!exports?global.fetch!whatwg-fetch'
        }),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
        }),
        new CopyWebpackPlugin([
            {
                from: 'node_modules/substance/dist',
                to: './writer/substance'
            },
            {
                from: 'node_modules/cropjs/dist',
                to: './cropjs'
            },
            {
                from: 'node_modules/font-awesome',
                to: './writer/font-awesome'
            },
            {
                from: "writer/index.html",
                to: "writer/index.html"
            },
            {
                from: "writer/styles/app.css",
                to: "writer/styles/app.css"
            },
            {
                from: "writer/serviceworker.js",
                to: "writer/serviceworker.js"
            },
            {
                from: 'package.json',
                to: '.'
            },
            {
                from: 'server',
                to: 'server'
            },
            {
                from: 'server.js',
                to: 'server.js'
            },
            {
                from: 'writer/assets',
                to: 'writer/assets'
            }
        ])
    ]
};
