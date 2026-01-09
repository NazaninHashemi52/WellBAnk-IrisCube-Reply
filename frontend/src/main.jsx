import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

console.log('🚀 main.jsx loading...');
console.log('🚀 Root element:', document.getElementById('root'));

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('❌ CRITICAL: Root element not found!');
    document.body.innerHTML = '<div style="color: white; padding: 50px; background: red; font-size: 24px;">ERROR: Root element not found!</div>';
  } else {
    console.log('✅ Root element found, creating React root...');
    const root = createRoot(rootElement);
    console.log('✅ React root created, rendering App...');
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    console.log('✅ App rendered!');
  }
} catch (error) {
  console.error('❌ CRITICAL ERROR in main.jsx:', error);
  document.body.innerHTML = `<div style="color: white; padding: 50px; background: red; font-size: 24px;">ERROR: ${error.message}<br><pre>${error.stack}</pre></div>`;
}
