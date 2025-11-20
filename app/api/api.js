import axios from "axios";

// ⚠️ Replace with your local IP address (check using "ipconfig" on Windows)
export const BASE_URL = "http://10.145.245.212:5000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
