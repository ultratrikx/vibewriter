const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const DotenvWebpackPlugin = require("dotenv-webpack");

module.exports = {
    mode: process.env.NODE_ENV === "production" ? "production" : "development",
    entry: {
        popup: "./src/popup/index.tsx",
        background: "./src/background/index.ts",
        content: "./src/content/index.ts",
        sidebar: "./src/sidebar/index.tsx",
    },
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].js",
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"],
            },
            {
                test: /\.(png|jpe?g|gif)$/i,
                use: [
                    {
                        loader: "file-loader",
                        options: {
                            name: "[name].[ext]",
                            outputPath: "assets",
                        },
                    },
                ],
            },
        ],
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./src/popup/index.html",
            filename: "popup.html",
            chunks: ["popup"],
        }),
        new HtmlWebpackPlugin({
            template: "./src/sidebar/index.html",
            filename: "sidebar.html",
            chunks: ["sidebar"],
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: "./public", to: "." },
                { from: "./src/manifest.json", to: "." },
            ],
        }),
        new DotenvWebpackPlugin(),
    ],
    devtool:
        process.env.NODE_ENV === "production" ? false : "inline-source-map",
};
