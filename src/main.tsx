import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from '@/context/AuthContext';

// 1. Cargamos primero los estilos estructurales obligatorios de Swiper
import 'swiper/css/bundle';

// 2. Cargamos al final Tailwind para que actúe sobre los componentes
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
