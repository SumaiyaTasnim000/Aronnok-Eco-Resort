import axios from "axios";
import Swal from "sweetalert2";

export const API_BASE =
  "https://aronnok-eco-resort-bd4043c4eb8b.herokuapp.com/api";

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE,
});

// ✅ Interceptor to ALWAYS attach fresh token
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// 🔄 Interceptor to handle expired tokens
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Swal.fire({
        icon: "warning",
        title: "Session Expired",
        text: "Please log in again to continue.",
        timer: 3000,
        showConfirmButton: false,
      }).then(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        window.location.href = "/"; // redirect to login page
      });
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
