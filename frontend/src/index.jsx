import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import 'react-toastify/dist/ReactToastify.css';

// Hide the loading screen once React mounts
const hideLoader = () => {
  const loader = document.getElementById('app-loader');
  if (loader) {
    loader.style.opacity = '0';
    loader.style.transition = 'opacity 0.3s ease';
    setTimeout(() => {
      loader.style.display = 'none';
    }, 300);
  }
};

const root = ReactDOM.createRoot(document.getElementById('root'));

// Removed StrictMode to prevent the react-toastify 'toggle' undefined error
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

hideLoader();