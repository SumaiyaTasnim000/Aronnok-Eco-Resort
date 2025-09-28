// frontend/src/App.jsx
import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Navbar from "./components/Navbar";
import Rooms from "./pages/Rooms";
import Expenses from "./pages/Expenses";
import Bookings from "./pages/Bookings";
import Salary from "./pages/Salary"; // ✅ NEW
import Restaurant from "./pages/Restaurant";

function App() {
  const [role, setRole] = useState(localStorage.getItem("role") || null);

  const handleLogin = (userRole) => {
    setRole(userRole);
  };

  const handleLogout = () => {
    localStorage.removeItem("role");
    localStorage.removeItem("token");
    setRole(null);
  };

  if (!role) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <Navbar role={role} onLogout={handleLogout} />
      <div className="page-container">
        <Routes>
          <Route path="/" element={<Dashboard role={role} />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/expenses" element={<Expenses role={role} />} />
          <Route path="/bookings" element={<Bookings role={role} />} />
          <Route path="/salary" element={<Salary role={role} />} />{" "}
          <Route path="/restaurant" element={<Restaurant role={role} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
