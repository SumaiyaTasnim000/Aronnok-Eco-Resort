// frontend/src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import PageWrapper from "../components/PageWrapper";

function Dashboard() {
  const API_BASE = "http://localhost:5001/api";
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [visibleDates, setVisibleDates] = useState([]);

  // Generate initial week range (today ±3 days)
  const generateInitialWeek = () => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 3);
    const end = new Date(today);
    end.setDate(today.getDate() + 3);

    const dates = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }
    setVisibleDates(dates);
  };

  // Fetch all rooms and bookings on mount
  const fetchData = async () => {
    try {
      const axiosAuth = { headers: { Authorization: `Bearer ${token}` } };
      const roomsRes = await axios.get(`${API_BASE}/rooms`);
      const bookingsRes = await axios.get(`${API_BASE}/bookings`, axiosAuth);

      setRooms(roomsRes.data || []);
      setBookings(bookingsRes.data || []);
    } catch (err) {
      console.error("Error loading dashboard:", err);
    }
  };

  // Initialize when page loads
  useEffect(() => {
    generateInitialWeek();
    fetchData();
  }, []);

  // Shift calendar by ±1 week
  const shiftWeek = (direction) => {
    const shift = direction === "next" ? 7 : -7;
    const newDates = visibleDates.map((d) => {
      const nd = new Date(d);
      nd.setDate(d.getDate() + shift);
      return nd;
    });
    setVisibleDates(newDates);
  };

  // Check if a room is booked for a given date
  const isBooked = (rid, date) => {
    return bookings.some((b) => {
      if (b.rid !== rid || b.isDeleted) return false;
      const s = new Date(b.startDate);
      const e = new Date(b.endDate);
      return date >= s && date <= e;
    });
  };

  // Cell click: if booked → show info, else → open Rooms page
  // 🔹 Handle cell click (redirect to Rooms page)
  const handleCellClick = (room, date) => {
    navigate("/rooms", {
      state: {
        rid: room.rid,
        startDate: date.toISOString().slice(0, 10),
      },
    });
  };

  return (
    <PageWrapper>
      <h1
        style={{
          textAlign: "center",
          fontWeight: "700",
          color: "#0d47a1",
          fontSize: "1.8rem",
          marginBottom: "25px",
        }}
      >
        Aronnok Eco Resort Dashboard
      </h1>

      {/* Week navigation */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "8px",
          marginBottom: "15px",
        }}
      >
        <button onClick={() => shiftWeek("prev")} style={navBtn}>
          ← Previous Week
        </button>
        <button onClick={() => shiftWeek("next")} style={navBtn}>
          Next Week →
        </button>
      </div>

      {/* Calendar Table */}
      <div
        style={{
          overflowX: "auto",
          background: "white",
          borderRadius: "10px",
          padding: "10px",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "center",
          }}
        >
          <thead>
            <tr style={{ background: "#1976d2", color: "white" }}>
              <th style={th}>Category</th>
              <th style={th}>Room Name</th>
              {visibleDates.map((d, i) => (
                <th key={i} style={th}>
                  {d.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rooms.map((room, idx) => (
              <tr key={idx}>
                <td style={td}>{room.rcategory}</td>
                <td style={td}>{room.rname}</td>
                {visibleDates.map((date, i) => {
                  const booked = isBooked(room.rid, date);
                  return (
                    <td
                      key={i}
                      onClick={() => handleCellClick(room, date)}
                      style={{
                        ...td,
                        background: booked ? "#e53935" : "#43a047",
                        cursor: "pointer",
                        height: "35px",
                      }}
                      title={booked ? "Booked" : "Available"}
                    ></td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div
        style={{
          marginTop: "15px",
          display: "flex",
          justifyContent: "center",
          gap: "20px",
          color: "#0d47a1",
          fontWeight: "600",
        }}
      >
        <span>
          <span style={legendBox("#e53935")}></span> Booked
        </span>
        <span>
          <span style={legendBox("#43a047")}></span> Available
        </span>
      </div>
    </PageWrapper>
  );
}

const th = {
  padding: "8px",
  border: "1px solid #ccc",
  fontWeight: "600",
};
const td = {
  border: "1px solid #ccc",
  padding: "6px",
};
const navBtn = {
  background: "#64b5f6",
  color: "white",
  border: "none",
  padding: "6px 12px",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "600",
};
const legendBox = (color) => ({
  display: "inline-block",
  width: "16px",
  height: "16px",
  background: color,
  marginRight: "6px",
  borderRadius: "3px",
  border: "1px solid #333",
});

export default Dashboard;
