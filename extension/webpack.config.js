var webpack = require("webpack"),
  path = require("path"),
  fileSystem = require("fs"),
  env = require("./utils/env"),
  CleanWebpackPlugin = require("clean-webpack-plugin").CleanWebpackPlugin,
  CopyWebpackPlugin = require("copy-webpack-plugin"),
  HtmlWebpackPlugin = require("html-webpack-plugin"),
  WriteFilePlugin = require("write-file-webpack-plugin"),
  ReloadPlugin = require("./ReloadPlugin");

// load the secrets
var alias = {
  "sodium-native": path.resolve(__dirname, "src/js/sodium_shim.js"),
};

var secretsPath = path.join(__dirname, "secrets." + env.NODE_ENV + ".js");

var fileExtensions = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "eot",
  "otf",
  "svg",
  "ttf",
  "woff",
  "woff2",
];

if (fileSystem.existsSync(secretsPath)) {
  alias["secrets"] = secretsPath;
}

var options = {
  context: path.resolve(__dirname, "src"),
  mode: process.env.NODE_ENV || "development",
  entry: {
    popup: "./js/popup.js",
    options: "./js/options.js",
    background: "./js/background.js",
    content: "./js/content.js",
  },
  output: {
    path: path.join(__dirname, "build"),
    filename: "[name].bundle.js",
  },
  node: { stream: true, crypto: "empty", Buffer: false, buffer: false },
  module: {
    rules: [
      {
        test: /\.css$/,
        loader: "style-loader!css-loader",
        exclude: /node_modules/,
      },
      {
        test: new RegExp(".(" + fileExtensions.join("|") + ")$"),
        loader: "file-loader?name=[name].[ext]",
        exclude: /node_modules/,
      },
      {
        test: /\.html$/,
        loader: "html-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.(js|jsx)$/,
        loader: "babel-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    alias: alias,
    extensions: fileExtensions
      .map((extension) => "." + extension)
      .concat([".jsx", ".js", ".css"]),
  },
  plugins: [
    new ReloadPlugin({
      contentScripts: ["content"],
      backgroundScript: "background",
    }),
    // clean the build folder
    new CleanWebpackPlugin(),
    // expose and write the allowed env vars on the compiled bundle
    new webpack.EnvironmentPlugin({ NODE_ENV: "development" }),
    new CopyWebpackPlugin([
      {
        from: "./manifest.json",
        transform: function (content, path) {
          // generates the manifest file using the package.json informations
          return Buffer.from(
            JSON.stringify({
              description: process.env.npm_package_description,
              version: process.env.npm_package_version,
              ...JSON.parse(content.toString()),
            })
          );
        },
      },
    ]),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "src", "popup.html"),
      filename: "popup.html",
      chunks: ["popup"],
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "src", "options.html"),
      filename: "options.html",
      chunks: ["options"],
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "src", "background.html"),
      filename: "background.html",
      chunks: ["background"],
    }),
    new WriteFilePlugin(),
    new webpack.NormalModuleReplacementPlugin(
      /hyperlog[\\\/]lib[\\\/]messages.js$/,
      path.resolve(__dirname, "src/js/hyperlog_hack.js")
    ),
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
    }),
  ],
};

if (env.NODE_ENV === "development") {
  options.devtool = "inline-cheap-module-source-map";
}

module.exports = options;