import React, { ReactElement } from 'react';
import { createRoot } from 'react-dom/client';
import { Search } from './Search';

function App(): ReactElement {
  return <Search />;
}

const container = document.getElementById('root');
if (!container) {
  throw new Error('Cointainer element is not found');
}
const root = createRoot(container);
root.render(<App />);
