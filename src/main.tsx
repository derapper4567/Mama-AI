import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import axios from 'axios';

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('access');
  if (token) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
