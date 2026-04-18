import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import App from './App.jsx'
import { store } from './store.js'
import './assets/css/shared.css'
import './assets/css/global.css'
import './assets/css/Resident/residentUnified.css'


createRoot(document.getElementById('root')).render(
  <Provider store={store} >
    <App />
  </Provider>
)
