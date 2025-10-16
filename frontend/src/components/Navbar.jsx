import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

function Navbar({ role, onLogout }) {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  // ✅ Detect screen resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <nav style={styles.nav}>
      {/* Logo */}
      <div style={styles.logo}>
        <img
          src="/logo.png"
          alt="Resort Logo"
          style={{
            height: "55px",
            marginRight: "10px",
            transition: "all 0.3s ease",
          }}
        />
        <span style={{ fontWeight: "bold", fontSize: "20px" }}>
          Aronnok Eco Resort
        </span>
      </div>

      {/* ✅ Hamburger icon for small screens */}
      {role && isMobile && (
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            background: "none",
            border: "none",
            color: "white",
            fontSize: "26px",
            cursor: "pointer",
          }}
        >
          {menuOpen ? "✖" : "☰"}
        </button>
      )}

      {/* ✅ Links */}
      {role && (
        <div
          style={{
            ...styles.links,
            ...(isMobile
              ? {
                  display: menuOpen ? "flex" : "none",
                  flexDirection: "column",
                  position: "absolute",
                  top: "60px",
                  left: 0,
                  right: 0,
                  background: "linear-gradient(180deg, #4facfe, #00f2fe)",
                  padding: "20px 0",
                  gap: "15px",
                  textAlign: "center",
                }
              : {}),
          }}
        >
          <a
            href="/"
            style={{
              ...styles.link,
              ...(isActive("/") ? styles.activeLink : {}),
            }}
            onClick={() => setMenuOpen(false)}
          >
            Dashboard
          </a>
          <a
            href="/rooms"
            style={{
              ...styles.link,
              ...(isActive("/rooms") ? styles.activeLink : {}),
            }}
            onClick={() => setMenuOpen(false)}
          >
            Rooms
          </a>
          <a
            href="/expenses"
            style={{
              ...styles.link,
              ...(isActive("/expenses") ? styles.activeLink : {}),
            }}
            onClick={() => setMenuOpen(false)}
          >
            Expenses
          </a>
          <a
            href="/restaurant"
            style={{
              ...styles.link,
              ...(isActive("/restaurant") ? styles.activeLink : {}),
            }}
            onClick={() => setMenuOpen(false)}
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
              onClick={() => setMenuOpen(false)}
            >
              Salary
            </a>
          )}
          <button
            onClick={() => {
              setMenuOpen(false);
              onLogout();
            }}
            style={styles.logout}
          >
            Logout
          </button>
        </div>
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
    height: "65px",
    background: "linear-gradient(90deg, #4facfe, #00f2fe)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 22px",
    color: "white",
    zIndex: 1000,
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  },
  logo: {
    display: "flex",
    alignItems: "center",
  },
  links: {
    display: "flex",
    alignItems: "center", // ✅ centers text vertically
    gap: "22px",
    marginTop: "2px", // ✅ slight downward adjust for optical centering
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
    textShadow: "0 0 5px yellow, 0 0 10px yellow, 0 0 15px gold",
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
