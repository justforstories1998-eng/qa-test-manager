import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import App from './App';
// import './App.css';  <-- REMOVED THIS LINE
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

// Create root element
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the application
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastStyle={{
          fontFamily: "'Inter', sans-serif",
          borderRadius: '8px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)'
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);

// Hide loader after initial render
hideLoader();