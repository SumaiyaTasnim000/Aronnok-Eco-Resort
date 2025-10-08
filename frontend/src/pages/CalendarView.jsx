import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function CalendarView() {
  const API_BASE = "http://localhost:5001/api";
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [visibleDates, setVisibleDates] = useState([]);

  // -------------------- Fetch data --------------------
  const fetchData = async () => {
    if (!startDate || !endDate) return;

    try {
      const axiosAuth = { headers: { Authorization: `Bearer ${token}` } };
      const roomRes = await axios.post(
        `${API_BASE}/rooms/check`,
        { startDate, endDate },
        axiosAuth
      );
      const bookingRes = await axios.get(`${API_BASE}/bookings`, axiosAuth);

      setRooms(roomRes.data || []);
      setBookings(bookingRes.data || []);
      generateVisibleDates(startDate, endDate);
    } catch (err) {
      console.error("Error loading calendar data:", err);
    }
  };

  // -------------------- Generate Date Range --------------------
  const generateVisibleDates = (from, to) => {
    const start = new Date(from);
    const end = new Date(to);

    // Add ±3 days window
    const minDate = new Date(start);
    minDate.setDate(start.getDate() - 3);
    const maxDate = new Date(end);
    maxDate.setDate(end.getDate() + 3);

    const dates = [];
    for (let d = new Date(minDate); d <= maxDate; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }
    setVisibleDates(dates);
  };

  // -------------------- Check if room is booked --------------------
  const isBooked = (rid, date) => {
    return bookings.some((b) => {
      if (b.rid !== rid || b.isDeleted) return false;
      const s = new Date(b.startDate);
      const e = new Date(b.endDate);
      return date >= s && date <= e;
    });
  };

  // -------------------- Week Navigation --------------------
  const shiftWeek = (direction) => {
    if (visibleDates.length === 0) return;
    const shift = direction === "next" ? 7 : -7;
    const newDates = visibleDates.map((d) => {
      const newD = new Date(d);
      newD.setDate(d.getDate() + shift);
      return newD;
    });
    setVisibleDates(newDates);
  };

  // -------------------- Cell Click --------------------
  const handleCellClick = (room, date) => {
    if (isBooked(room.rid, date)) {
      const booking = bookings.find(
        (b) =>
          b.rid === room.rid &&
          new Date(b.startDate) <= date &&
          new Date(b.endDate) >= date
      );
      if (booking)
        alert(
          `Room ${room.rname} is booked by ${
            booking.cname
          }\n(${booking.startDate.slice(0, 10)} → ${booking.endDate.slice(
            0,
            10
          )})`
        );
    } else {
      navigate("/rooms", {
        state: { rid: room.rid, startDate: date.toISOString().slice(0, 10) },
      });
    }
  };

  return (
    <div
      style={{
        padding: "40px",
        background: "#f0f8ff",
        minHeight: "100vh",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          fontSize: "1.8rem",
          color: "#0d47a1",
          fontWeight: "700",
          marginBottom: "20px",
        }}
      >
        Room Availability Calendar
      </h2>

      {/* Date Filter */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        <label>
          From:{" "}
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label>
          To:{" "}
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>
        <button
          onClick={fetchData}
          style={{
            background: "#1565c0",
            color: "#fff",
            padding: "6px 14px",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
          }}
        >
          Filter
        </button>
      </div>

      {/* Week Navigation */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "10px",
          gap: "10px",
        }}
      >
        <button
          onClick={() => shiftWeek("prev")}
          style={{
            background: "#999",
            color: "white",
            padding: "5px 10px",
            borderRadius: "6px",
          }}
        >
          ← Prev Week
        </button>
        <button
          onClick={() => shiftWeek("next")}
          style={{
            background: "#999",
            color: "white",
            padding: "5px 10px",
            borderRadius: "6px",
          }}
        >
          Next Week →
        </button>
      </div>

      {/* Calendar Table */}
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
            background: "white",
          }}
        >
          <thead>
            <tr style={{ background: "#1976d2", color: "white" }}>
              <th style={{ padding: "8px", border: "1px solid #ccc" }}>
                Room Category
              </th>
              <th style={{ padding: "8px", border: "1px solid #ccc" }}>Room</th>
              {visibleDates.map((d, i) => (
                <th
                  key={i}
                  style={{ padding: "6px", border: "1px solid #ccc" }}
                >
                  {d.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* ✅ Group rooms by category */}
            {Object.entries(
              rooms.reduce((acc, room) => {
                if (!acc[room.rcategory]) acc[room.rcategory] = [];
                acc[room.rcategory].push(room);
                return acc;
              }, {})
            ).map(([category, categoryRooms]) => (
              <React.Fragment key={category}>
                {categoryRooms.map((room, index) => (
                  <tr key={room.rid}>
                    {/* Show category only once per group */}
                    {index === 0 && (
                      <td
                        rowSpan={categoryRooms.length}
                        style={{
                          fontWeight: "bold",
                          background: "#e3f2fd",
                          textAlign: "center",
                          verticalAlign: "middle",
                          border: "1px solid #ccc",
                        }}
                      >
                        {category}
                      </td>
                    )}

                    <td
                      style={{
                        border: "1px solid #ccc",
                        padding: "6px",
                        fontWeight: 500,
                      }}
                    >
                      {room.rname}
                    </td>

                    {visibleDates.map((date, i) => {
                      const booked = isBooked(room.rid, date);
                      return (
                        <td
                          key={i}
                          onClick={() => handleCellClick(room, date)}
                          style={{
                            border: "1px solid #ccc",
                            width: "40px",
                            height: "35px",
                            background: booked ? "#e53935" : "#43a047",
                            cursor: "pointer",
                          }}
                          title={booked ? "Booked" : "Available"}
                        ></td>
                      );
                    })}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CalendarView;
