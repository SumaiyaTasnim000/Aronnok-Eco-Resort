// frontend/src/App.jsx
import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Navbar from "./components/Navbar";
import Rooms from "./pages/Rooms";
import Expenses from "./pages/Expenses";
import Bookings from "./pages/Bookings";
import Salary from "./pages/Salary";
import Restaurant from "./pages/Restaurant";
import CalendarView from "./pages/CalendarView";

function App() {
  const [role, setRole] = useState(localStorage.getItem("role") || null);

  const handleLogin = (userRole) => {
    setRole(userRole);
    localStorage.setItem("role", userRole);
  };

  const handleLogout = () => {
    localStorage.removeItem("role");
    localStorage.removeItem("token");
    setRole(null);
  };

  return (
    <Router>
      {/* ✅ Navbar always rendered when logged in */}
      {role && <Navbar role={role} onLogout={handleLogout} />}

      <Routes>
        {/* ✅ Public route (visible when logged out) */}
        <Route path="/login" element={<Login onLogin={handleLogin} />} />

        {/* ✅ Protected routes (only render when role exists) */}
        {role ? (
          <>
            <Route path="/" element={<Dashboard role={role} />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/expenses" element={<Expenses role={role} />} />
            <Route path="/bookings" element={<Bookings role={role} />} />
            <Route path="/salary" element={<Salary role={role} />} />
            <Route path="/restaurant" element={<Restaurant role={role} />} />
            <Route path="/calendar" element={<CalendarView />} />
          </>
        ) : (
          // if user tries any other route while logged out, show Login
          <Route path="*" element={<Login onLogin={handleLogin} />} />
        )}
      </Routes>
    </Router>
  );
}

export default App;
