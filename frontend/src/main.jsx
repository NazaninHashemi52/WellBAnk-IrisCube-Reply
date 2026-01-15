import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} catch (error) {
  console.error('Application initialization error:', error);
  document.body.innerHTML = '<div style="color: white; padding: 50px; background: #dc2626; font-size: 18px; font-family: system-ui;">Application failed to initialize. Please refresh the page.</div>';
}
