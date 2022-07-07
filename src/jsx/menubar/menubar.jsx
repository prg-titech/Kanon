import React from 'react';
import ReactDOM from 'react-dom';

import HeaderMenu from './Header.jsx';

function App() {
  return (
    <div className="App">
      <HeaderMenu />
    </div>
  );
};

ReactDOM.render(
  <App />,
  document.querySelector("#app")
);