import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Base styles first: component stylesheets are imported through App, and
// whichever sheet lands last wins ties like `.display { margin: 0 }`
// against a component's own margin.
import './styles/global.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
