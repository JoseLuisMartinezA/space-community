import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Error overlay for development
window.onerror = function (msg, url, line, col, error) {
  const div = document.createElement('div');
  div.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; z-index: 9999; background: #111; color: #f44; padding: 20px; font-family: monospace; white-space: pre-wrap;';
  div.innerText = `Runtime Error:\n${msg}\nAt: ${url}:${line}:${col}\n\n${error?.stack || ''}`;
  document.body.appendChild(div);
  return false;
};

window.onunhandledrejection = function (event) {
  const div = document.createElement('div');
  div.style.cssText = 'position: fixed; top: 50%; left: 0; width: 100%; z-index: 9999; background: #111; color: #f84; padding: 20px; font-family: monospace; white-space: pre-wrap; border-top: 1px solid #444;';
  div.innerText = `Unhandled Promise Rejection:\n${event.reason}`;
  document.body.appendChild(div);
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
