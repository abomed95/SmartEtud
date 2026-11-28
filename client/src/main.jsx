import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3500,
            style: {
              background: 'rgba(30,30,32,0.92)', color: '#F5F5F7', backdropFilter: 'blur(20px)',
              borderRadius: '9999px', fontSize: '14px', padding: '10px 16px', boxShadow: '0 8px 32px rgba(0,0,0,.25)'
            },
            success: { iconTheme: { primary: '#34C759', secondary: '#fff' } },
            error: { iconTheme: { primary: '#FF3B30', secondary: '#fff' } }
          }}
        />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
