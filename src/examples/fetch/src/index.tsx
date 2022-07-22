import React, { ReactElement } from 'react';
import { createRoot } from 'react-dom/client';
import { Basic } from './Pages/Basic';
// import { Hooks } from './Pages/Hooks';
import { Handle } from './Pages/Handle';

function App(): ReactElement {
  // return <Basic />;
  // return <Hooks />;
  return <Handle />;
}

const container = document.getElementById('root');
if (!container) {
  throw new Error('Cointainer element is not found');
}
const root = createRoot(container);
root.render(<App />);
