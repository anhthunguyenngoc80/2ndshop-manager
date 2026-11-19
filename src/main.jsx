import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import App from './routes'
import { AuthProvider } from './hooks/useAuth'
import './index.css'
ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter><AuthProvider><App /><Toaster position="top-center" richColors /></AuthProvider></BrowserRouter>
)
