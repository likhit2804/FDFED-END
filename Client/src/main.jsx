import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import App from './App.jsx'
import { store } from './store.js'
import './assets/css/shared.css'
import './assets/css/global.css'
import './assets/css/Resident/residentUnified.css'
import axios from 'axios'

if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
  axios.defaults.baseURL = "http://localhost:3000";
} else {
  axios.defaults.baseURL = "https://urbanease-backend-6gff.onrender.com";
}

// Always send cookies!
axios.defaults.withCredentials = true;



createRoot(document.getElementById('root')).render(
  <Provider store={store} >
    <App />
  </Provider>
)
