import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('[main.tsx] Root element not found!');
  throw new Error('Root element not found');
}

try {
  const root = ReactDOM.createRoot(rootElement);
  
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error('[main.tsx] Error rendering app:', error);
  rootElement.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif;">
      <h1>Error Loading App</h1>
      <p>${error instanceof Error ? error.message : String(error)}</p>
      <p>Check the browser console for more details.</p>
    </div>
  `;
}

