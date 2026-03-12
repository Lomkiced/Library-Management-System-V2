import axios from "axios";
import Swal from "sweetalert2";

// Define globally reusable URLs
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";
export const ASSET_URL = API_BASE_URL.replace(/\/api\/?$/, '');

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("ACCESS_TOKEN");
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle network errors (server offline, no internet, etc.)
    if (!error.response) {
      // Network error - server is unreachable
      console.error("Network Error:", error.message);
      Swal.fire({
        icon: 'error',
        title: 'Connection Error',
        text: 'Unable to connect to the server. Please check if the backend is running.',
        confirmButtonColor: '#dc2626'
      });
      return Promise.reject(error);
    }

    const { response } = error;

    // Handle specific HTTP error codes
    if (response.status === 401) {
      localStorage.removeItem("ACCESS_TOKEN");
      // Optionally redirect to login page
    } else if (response.status === 500) {
      console.error("Server Error:", response.data);
      Swal.fire({
        icon: 'error',
        title: 'Server Error',
        text: 'An internal server error occurred. Please try again later.',
        confirmButtonColor: '#dc2626'
      });
    } else if (response.status === 404) {
      console.error("Not Found:", response.config.url);
    }

    throw error;
  }
);

export default axiosClient;