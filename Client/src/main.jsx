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

const normalizedConfiguredBaseUrl = import.meta.env.VITE_API_BASE_URL
  ? String(import.meta.env.VITE_API_BASE_URL).trim().replace(/\/+$/, "")
  : "";

if (normalizedConfiguredBaseUrl) {
  axios.defaults.baseURL = normalizedConfiguredBaseUrl;
} else if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
  axios.defaults.baseURL = "http://localhost:3000";
} else {
  // In production, default to same-origin API to avoid environment mismatch.
  axios.defaults.baseURL = "";
}

// Always send cookies!
axios.defaults.withCredentials = true;



createRoot(document.getElementById('root')).render(
  <Provider store={store} >
    <App />
  </Provider>
)
