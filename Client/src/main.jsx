
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import App from './App.jsx'
import { store } from "./store.js";
import { resolveApiBaseUrl } from "./utils/apiBaseUrl";
axios.defaults.baseURL = resolveApiBaseUrl();
// Always send cookies!
axios.defaults.withCredentials = true;
createRoot(document.getElementById('root')).render(
  <Provider store={store} >
    <App />
  </Provider>
)
