// import React, { ReactElement } from 'react';

/* global document */
import React, { ReactElement } from 'react';
import ReactDOM from 'react-dom';

function App(): ReactElement {
  return <div>Hello world react</div>;
}

ReactDOM.render(<App />, document.getElementById('root'));
