import React from "react";
import { useLocation } from "react-router-dom";

function Navbar({ role, onLogout }) {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={styles.nav}>
      {/* Logo */}
      <div style={styles.logo}>
        <img
          src="/logo.png"
          alt="Resort Logo"
          style={{
            height: "55px", // ✅ larger logo
            marginRight: "10px",
            transition: "all 0.3s ease",
          }}
        />
        <span style={{ fontWeight: "bold", fontSize: "20px" }}>
          Aronnok Eco Resort
        </span>
      </div>

      {/* Links */}
      {role && (
        <>
          <div style={styles.links}>
            <a
              href="/"
              style={{
                ...styles.link,
                ...(isActive("/") ? styles.activeLink : {}),
              }}
            >
              Dashboard
            </a>
            <a
              href="/rooms"
              style={{
                ...styles.link,
                ...(isActive("/rooms") ? styles.activeLink : {}),
              }}
            >
              Rooms
            </a>
            <a
              href="/expenses"
              style={{
                ...styles.link,
                ...(isActive("/expenses") ? styles.activeLink : {}),
              }}
            >
              Expenses
            </a>
            <a
              href="/restaurant"
              style={{
                ...styles.link,
                ...(isActive("/restaurant") ? styles.activeLink : {}),
              }}
            >
              Restaurant
            </a>
            {role === "admin" && (
              <a
                href="/salary"
                style={{
                  ...styles.link,
                  ...(isActive("/salary") ? styles.activeLink : {}),
                }}
              >
                Salary
              </a>
            )}
          </div>

          <button onClick={onLogout} style={styles.logout}>
            Logout
          </button>
        </>
      )}
    </nav>
  );
}

const styles = {
  nav: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: "60px",
    background: "linear-gradient(90deg, #4facfe, #00f2fe)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px",
    color: "white",
    zIndex: 1000,
  },
  logo: {
    display: "flex",
    alignItems: "center",
  },
  links: {
    display: "flex",
    gap: "20px",
  },
  link: {
    color: "white",
    textDecoration: "none",
    fontWeight: "500",
    fontSize: "15px",
    transition: "all 0.3s ease",
  },
  activeLink: {
    fontSize: "17px",
    fontWeight: "600",
    textShadow: "0 0 5px yellow, 0 0 10px yellow, 0 0 15px gold", // ✅ glowing yellow outline
  },
  logout: {
    background: "#ff5f6d",
    border: "none",
    borderRadius: "6px",
    padding: "8px 15px",
    color: "white",
    cursor: "pointer",
    fontWeight: "500",
  },
};

export default Navbar;
