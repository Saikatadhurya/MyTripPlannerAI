
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './services/axiosInterceptor'; // Initialize axios interceptors
import './services/autoLogoutTester'; // Initialize auto logout tester for development

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
