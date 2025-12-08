import axios from "axios";
import Swal from "sweetalert2";

export const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://aronnok-eco-resort-bd4043c4eb8b.herokuapp.com/api";

const axiosInstance = axios.create({
  baseURL: API_BASE,
});

// ⛔ Remove headers: { Authorization: `Bearer ....` }
// 👉 Interceptor handles this automatically.

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle expired token
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
        window.location.href = "/";
      });
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
