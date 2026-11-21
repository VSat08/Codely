import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './theme.css';
import './App.css';

// Apply saved theme immediately on startup
try {
  const isRoom = window.location.pathname.length > 1 && window.location.pathname !== '/';
  const homeSaved = localStorage.getItem('codely-home-theme');
  const savedTheme = isRoom
    ? (localStorage.getItem('codely-editor-theme') || 'vs-dark')
    : (homeSaved === 'light' ? 'vs' : 'vs-dark');
  document.documentElement.setAttribute('data-theme', savedTheme);
  if (!isRoom) {
    document.documentElement.setAttribute('data-home-mode', homeSaved || 'dark');
  }
} catch (e) {}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
