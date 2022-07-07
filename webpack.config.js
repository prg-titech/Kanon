const path = require('path');

// const src  = path.resolve(__dirname, 'src/jsx/menubar/')
// const dist = path.resolve(__dirname, 'src/js/')
const src  = path.resolve(__dirname, 'src/jsx/menubar/');
const dist = path.resolve(__dirname, 'src/js/');

module.exports = {
  mode: 'production',
  entry: path.resolve(src, 'menubar.jsx'),

  output: {
    path: dist,
    filename: 'menubar.js'
  },

  module: {
    rules: [
      {
        test: /\.jsx$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader", // Babel を利用する
            options: { // Babel のオプションを指定する
              presets: [
                "@babel/preset-env", // プリセットを指定することで、ES2020 を ES5 に変換
                "@babel/react" // React の JSX を解釈
              ]
            }
          }
        ]  
      }
    ]
  },

  resolve: {
    extensions: ['.js', '.jsx']
  }
}