import React from "react";
import "../App.css"; // make sure CSS is imported

function Dashboard({ role }) {
  return (
    <div className="page-container">
      <h1 style={{ fontSize: "32px", marginBottom: "10px" }}>
        Welcome, {role.toUpperCase()}
      </h1>
      <p style={{ fontSize: "18px", marginBottom: "20px" }}>
        {role === "admin"
          ? "You can manage all operations and view statistics."
          : "You can manage bookings and expenses."}
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "15px",
          width: "250px",
        }}
      >
        <button style={styles.button}>🏨 Check Rooms</button>
        <button style={styles.button}>💸 Other Expenses</button>
        <button style={styles.button}>🍴 Restaurant</button>
        {role === "admin" && <button style={styles.button}>👨‍💼 Salary</button>}
      </div>
    </div>
  );
}

const styles = {
  button: {
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    background: "linear-gradient(90deg, #4facfe, #00f2fe)",
    color: "white",
    fontSize: "16px",
    cursor: "pointer",
    fontWeight: "500",
  },
};

export default Dashboard;
