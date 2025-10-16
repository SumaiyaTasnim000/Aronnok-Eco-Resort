import axios from "axios";
import Swal from "sweetalert2";

const API_BASE = "http://localhost:5001/api";

const axiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
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
