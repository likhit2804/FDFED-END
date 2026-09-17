
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import App from './App.jsx'
import { store } from "./store.js";
import { resolveApiBaseUrl } from "./utils/apiBaseUrl";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-day-picker/style.css";
import "react-toastify/dist/ReactToastify.css";
import './assets/css/global.css';
import './assets/css/shared.css';
import './assets/css/Navbar.css';
import './assets/css/Layout.css';
import './assets/css/role/shell.css';
import './assets/css/Resident/residentUnified.css';
import './assets/css/Profile.css';
import './assets/css/Leave.css';
import './assets/css/Dashboard.css';
axios.defaults.baseURL = resolveApiBaseUrl();
// Always send cookies!
axios.defaults.withCredentials = true;

// Automatically attach Authorization Bearer token from localStorage for resilience against cookie blocking
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle dynamic import failures when new versions are deployed
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  window.location.reload();
});

createRoot(document.getElementById('root')).render(
  <Provider store={store} >
    <App />
  </Provider>
)
