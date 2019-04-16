const path = require("path");

module.exports = {
  entry: "./src/ts/app.ts",
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "src/dist")
  },
  resolve: {
    extensions: [".js", ".ts"]
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: "ts-loader",
        include: __dirname
      }
    ]
  }
};
