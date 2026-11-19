import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './theme.css';
import './App.css';

// Apply saved theme immediately on startup
try {
  const savedTheme = localStorage.getItem('codely-editor-theme') || 'vs-dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
} catch (e) {}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
