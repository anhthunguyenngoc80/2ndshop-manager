import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import App from './routes'
import { AuthProvider } from './hooks/useAuth'
import { CartProvider } from './hooks/useCart'
import './index.css'
ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter><AuthProvider><CartProvider><App /><Toaster position="top-center" richColors /></CartProvider></AuthProvider></BrowserRouter>
)
