const path = require('path');
const webpack = require('webpack');

const nodeConfig = /** @type WebpackConfig */ {
    context: path.dirname(__dirname),
    mode: 'none', // this leaves the source code as close as possible to the original (when packaging we set this to 'production')
    target: 'node', // extensions run in a webworker context
    entry: {
        'extension': './src/extension.ts',
    },
    resolve: {
        mainFields: ['module', 'main'], // look for `browser` entry point in imported node modules
        extensions: ['.ts', '.js'], // support ts-files and js-files
        alias: {
            // provides alternate implementation for node module and source files
        },
        fallback: {
            // Webpack 5 no longer polyfills Node.js core modules automatically.
            // see https://webpack.js.org/configuration/resolve/#resolvefallback
            // for the list of Node.js core module polyfills.
            'assert': require.resolve('assert')
        },
        alias: {
            "@wasmbindings": path.join(__dirname, "../node_modules/@wasmer/wasi/lib/bindings/node")
        }
    },
    module: {
        rules: [{
            test: /\.ts$/,
            exclude: /node_modules/,
            use: [{
                loader: 'ts-loader'
            }]
        }]
    },
    plugins: [
    ],
    externals: {
        'vscode': 'commonjs vscode', // ignored because it doesn't exist
    },
    performance: {
        hints: false
    },
    output: {
        filename: '[name]-node.js',
        path: path.join(__dirname, '../out/node/'),
        libraryTarget: 'commonjs'
    },
    devtool: 'nosources-source-map' // create a source map that points to the original source file
};

const webConfig = /** @type WebpackConfig */ {
    context: path.dirname(__dirname),
    mode: 'none', // this leaves the source code as close as possible to the original (when packaging we set this to 'production')
    target: 'webworker', // extensions run in a webworker context
    entry: {
        'extension': './src/extension.ts',
    },
    resolve: {
        mainFields: ['browser', 'module', 'main'], // look for `browser` entry point in imported node modules
        extensions: ['.ts', '.js'], // support ts-files and js-files
        alias: {
            // provides alternate implementation for node module and source files
        },
        fallback: {
            // Webpack 5 no longer polyfills Node.js core modules automatically.
            // see https://webpack.js.org/configuration/resolve/#resolvefallback
            // for the list of Node.js core module polyfills.
            'assert': require.resolve('assert')
        },
        alias: {
            "@wasmbindings": path.join(__dirname, "../node_modules/@wasmer/wasi/lib/bindings/browser")
        }
    },
    module: {
        rules: [{
            test: /\.ts$/,
            exclude: /node_modules/,
            use: [{
                loader: 'ts-loader'
            }]
        }]
    },
    plugins: [
        new webpack.ProvidePlugin({
            process: 'process/browser', // provide a shim for the global `process` variable
            Buffer: ['buffer', 'Buffer'],
        }),
    ],
    externals: {
        'vscode': 'commonjs vscode', // ignored because it doesn't exist
    },
    performance: {
        hints: false
    },
    output: {
        filename: '[name]-web.js',
        path: path.join(__dirname, '../out/web/'),
        libraryTarget: 'commonjs'
    },
    devtool: 'nosources-source-map' // create a source map that points to the original source file
};

module.exports = [webConfig, nodeConfig];