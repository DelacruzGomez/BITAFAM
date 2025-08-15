import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from '@/context/AuthContext';

// src/main.tsx
import React from 'react' //new
import ReactDOM from 'react-dom/client'//new

ReactDOM.createRoot(document.getElementById('root')!).render(
//createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
)
