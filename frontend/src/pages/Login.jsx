// frontend/src/pages/Login.jsx
import React, { useState } from "react";
import axios from "../utils/axiosSetup";
import Navbar from "../components/Navbar";
import PageWrapper from "../components/PageWrapper";

function Login({ onLogin }) {
  const [uemail, setUemail] = useState("");
  const [upassword, setUpassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5001/api/auth/login", {
        uemail,
        upassword,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);

      onLogin(res.data.role);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <PageWrapper>
      <Navbar />

      {/* ✅ Center the login form */}
      <div style={styles.centerBox}>
        <form onSubmit={handleSubmit} style={styles.card}>
          <h2 style={styles.title}>🔐 Login</h2>
          {error && <p style={styles.error}>{error}</p>}

          <label style={styles.label}>Email</label>
          <input
            type="email"
            value={uemail}
            onChange={(e) => setUemail(e.target.value)}
            required
            style={styles.input}
          />

          <label style={styles.label}>Password</label>
          <div style={styles.passwordWrapper}>
            <input
              type={showPassword ? "text" : "password"}
              value={upassword}
              onChange={(e) => setUpassword(e.target.value)}
              required
              style={{
                ...styles.input,
                paddingRight: 50,
                backgroundColor: "#fffefeff",
              }}
            />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setShowPassword((s) => !s);
              }}
              aria-label={showPassword ? "Hide password" : "Show password"}
              style={styles.toggleButton}
            >
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="22"
                  height="22"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    fill="#111010ff"
                    d="M17.94 17.94A10.94 10.94 0 0 0 21 12c-1.9-4.28-6.15-7.5-9-7.5-1.23 0-2.43.4-3.45 1.08l1.45 1.45A3.99 3.99 0 0 1 12 7.5c2.21 0 4 1.79 4 4 0 .9-.31 1.73-.82 2.38l1.76 1.76zM2.1 2.1L.69 3.51l3.1 3.1A10.94 10.94 0 0 0 3 12c1.9 4.28 6.15 7.5 9 7.5 1.23 0 2.43-.4 3.45-1.08l3.05 3.05 1.41-1.41L2.1 2.1zM8.53 10.06l1.47 1.47A1.5 1.5 0 0 0 12 11.5c.83 0 1.5.67 1.5 1.5 0 .32-.1.62-.26.86l1.37 1.37A3.5 3.5 0 0 1 12 13.5a3.5 3.5 0 0 1-3.47-3.44z"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="22"
                  height="22"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    fill="#131212ff"
                    d="M12 5c-5 0-9 4-10 7 1 3 5 7 10 7s9-4 10-7c-1-3-5-7-10-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"
                  />
                  <circle cx="12" cy="12" r="2.5" fill="#fff" />
                </svg>
              )}
            </button>
          </div>

          <button type="submit" style={styles.button}>
            Login
          </button>
        </form>
      </div>
    </PageWrapper>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #74ebd5 0%, #ACB6E5 100%)",
  },

  centerBox: {
    width: "100%",
    height: "70vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px", // ✅ adds breathing room on mobile
    boxSizing: "border-box",
  },

  card: {
    background: "#fff",
    padding: "40px",
    borderRadius: "12px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
    textAlign: "center",
    width: "350px",
    maxWidth: "90vw", // ✅ auto shrink on phones
    transition: "all 0.3s ease",
  },

  title: {
    marginBottom: "20px",
    fontSize: "24px",
    color: "#0e0e0eff",
  },

  label: {
    display: "block",
    textAlign: "left",
    marginBottom: "6px",
    fontSize: "14px",
    color: "#0e0e0eff",
  },

  input: {
    width: "100%",
    padding: "10px 12px",
    marginBottom: "15px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "14px",
    boxSizing: "border-box",
    height: "40px",
  },

  passwordWrapper: {
    position: "relative",
    width: "100%",
  },

  toggleButton: {
    position: "absolute",
    top: "50%",
    right: "10px",
    transform: "translateY(-50%)",
    height: "24px",
    width: "28px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },

  button: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    background: "#4facfe",
    color: "white",
    fontSize: "16px",
    cursor: "pointer",
    transition: "0.3s",
  },

  error: {
    color: "red",
    marginBottom: "15px",
    fontSize: "14px",
  },
};

export default Login;
