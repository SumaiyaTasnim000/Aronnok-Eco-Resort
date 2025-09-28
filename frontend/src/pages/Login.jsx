// frontend/src/pages/Login.jsx
import React, { useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

function Login({ onLogin }) {
  const [uemail, setUemail] = useState("");
  const [upassword, setUpassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // 👈 new state
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5001/api/auth/login", {
        // ✅ port fixed to 5001
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
    <div style={styles.page}>
      {/* Navbar at the top */}
      <Navbar />

      {/* Centered login card */}
      <div style={styles.container}>
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
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              value={upassword}
              onChange={(e) => setUpassword(e.target.value)}
              required
              style={styles.input}
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer",
                color: "#666",
              }}
            >
              {showPassword ? "🙈" : "👁"}
            </span>
          </div>

          <button type="submit" style={styles.button}>
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #74ebd5 0%, #ACB6E5 100%)",
  },
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "calc(100vh - 60px)", // subtract navbar height
    paddingTop: "60px", // make room for navbar
  },
  card: {
    background: "#fff",
    padding: "40px",
    borderRadius: "12px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
    textAlign: "center",
    width: "350px",
  },
  title: {
    marginBottom: "20px",
    fontSize: "24px",
    color: "#333",
  },
  label: {
    display: "block",
    textAlign: "left",
    marginBottom: "6px",
    fontSize: "14px",
    color: "#555",
  },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "15px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "14px",
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
  buttonHover: {
    background: "#00c6ff",
  },
  error: {
    color: "red",
    marginBottom: "15px",
    fontSize: "14px",
  },
};

export default Login;
