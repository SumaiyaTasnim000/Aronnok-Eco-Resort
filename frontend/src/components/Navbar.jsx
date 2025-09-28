import React from "react";

function Navbar({ role, onLogout }) {
  return (
    <nav style={styles.nav}>
      {/* Logo */}
      <div style={styles.logo}>
        <img
          src="/logo.png"
          alt="Resort Logo"
          style={{ height: "40px", marginRight: "10px" }}
        />
        <span style={{ fontWeight: "bold", fontSize: "18px" }}>
          Aronnok Eco Resort
        </span>
      </div>

      {/* Show links only if role exists */}
      {role && (
        <>
          <div style={styles.links}>
            <a href="/" style={styles.link}>
              Dashboard
            </a>
            <a href="/rooms" style={styles.link}>
              Rooms
            </a>
            <a href="/expenses" style={styles.link}>
              Expenses
            </a>
            <a href="/restaurant" style={styles.link}>
              Restaurant
            </a>
            {role === "admin" && (
              <a href="/salary" style={styles.link}>
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
