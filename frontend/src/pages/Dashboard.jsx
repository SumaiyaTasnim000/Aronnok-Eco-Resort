// frontend/src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import axiosInstance from "../utils/axiosSetup";
import { useNavigate } from "react-router-dom";
import PageWrapper from "../components/PageWrapper";

function Dashboard() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  useEffect(() => {
    if (!token) navigate("/");
  }, [token, navigate]);

  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [visibleDates, setVisibleDates] = useState([]);

  // ✅ Generate a full week (Monday–Sunday) from any selected date
  const generateWeekFromDate = (selectedDate) => {
    const selected = new Date(selectedDate);
    const day = selected.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const startOfWeek = new Date(selected);
    startOfWeek.setDate(selected.getDate() + diffToMonday);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const newDates = [];
    for (
      let d = new Date(startOfWeek);
      d <= endOfWeek;
      d.setDate(d.getDate() + 1)
    ) {
      newDates.push(new Date(d));
    }
    setVisibleDates(newDates);
  };

  // Fetch all rooms and bookings on mount
  const fetchData = async () => {
    try {
      const roomsRes = await axiosInstance.get("/rooms");
      const bookingsRes = await axiosInstance.get("/bookings");

      setRooms(roomsRes.data || []);
      setBookings(bookingsRes.data || []);
    } catch (err) {
      console.error("Error loading dashboard:", err);
    }
  };
  // ✅ Generate default week range (today ±3 days)
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
    if (isBooked(room.rid, date)) {
      const booking = bookings.find(
        (b) =>
          b.rid === room.rid &&
          new Date(b.startDate) <= date &&
          new Date(b.endDate) >= date
      );

      if (booking) {
        navigate("/rooms", {
          state: {
            booking,
            rid: room.rid,
            startDate: date.toISOString().slice(0, 10),
          },
        });
      }
      return;
    }

    // If not booked, open Rooms page to book it
    navigate("/rooms", {
      state: {
        rid: room.rid,
        startDate: date.toISOString().slice(0, 10),
      },
    });
  };

  return (
    <PageWrapper>
      <div
        style={{
          width: "100%",
          maxWidth: "95vw", // ✅ keep within viewport width
          overflowX: "auto",
          padding: "0 2vw",
          boxSizing: "border-box",
          margin: "0 auto",
        }}
      >
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

        {/* 🌿 Date Filter + Week Navigation Row */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "20px",
            marginBottom: "25px",
            flexWrap: "wrap",
          }}
        >
          <label style={{ fontWeight: 600, color: "#0d47a1" }}>
            Go to:{" "}
            <input
              type="date"
              onChange={(e) => generateWeekFromDate(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "2px solid #1976d2",
                background: "#e3f2fd",
                color: "#0d47a1",
                fontWeight: 600,
                fontSize: "15px",
                cursor: "pointer",
                outline: "none",
                transition: "all 0.2s ease",
              }}
              onFocus={(e) => (e.target.style.background = "#bbdefb")}
              onBlur={(e) => (e.target.style.background = "#e3f2fd")}
            />
          </label>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap", // ✅ allows stacking on smaller screens
              justifyContent: "center",
            }}
          >
            <button
              onClick={() => shiftWeek("prev")}
              style={{
                background: "#1976d2",
                color: "white",
                padding: "8px 14px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                fontWeight: "600",
                transition: "background 0.2s ease",
              }}
              onMouseEnter={(e) => (e.target.style.background = "#1565c0")}
              onMouseLeave={(e) => (e.target.style.background = "#1976d2")}
            >
              ← Previous Week
            </button>
            <button
              onClick={() => shiftWeek("next")}
              style={{
                background: "#1976d2",
                color: "white",
                padding: "8px 14px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                fontWeight: "600",
                transition: "background 0.2s ease",
              }}
              onMouseEnter={(e) => (e.target.style.background = "#1565c0")}
              onMouseLeave={(e) => (e.target.style.background = "#1976d2")}
            >
              Next Week →
            </button>
          </div>
        </div>

        {/* Calendar Table */}
        <div
          style={{
            overflowX: "auto",
            WebkitOverflowScrolling: "touch", // ✅ smooth scroll on iOS
            background: "white",
            borderRadius: "10px",
            padding: "10px",
          }}
        >
          <table
            style={{
              width: "100%",
              minWidth: "600px", // ✅ prevents text squishing on small screens
              borderCollapse: "collapse",
              textAlign: "center",
            }}
          >
            <thead>
              <tr
                style={{
                  background:
                    "linear-gradient(90deg, #bbdefb 0%, #64b5f6 100%)", // ✅ light → bright blue
                  color: "#0d47a1", // ✅ dark blue text
                  fontWeight: "700",
                }}
              >
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
                          background: booked ? "#ad5d56" : "#5c9e76",
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
            flexWrap: "wrap", // ✅ wraps neatly on phones
            justifyContent: "center",
            gap: "20px",
            color: "#0d47a1",
            fontWeight: "600",
          }}
        >
          <span>
            <span style={legendBox("#ad5d56")}></span> Booked
          </span>
          <span>
            <span style={legendBox("#5c9e76")}></span> Available
          </span>
        </div>
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
