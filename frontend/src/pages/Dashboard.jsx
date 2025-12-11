// frontend/src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import axiosInstance from "../utils/axiosSetup";
import { useNavigate } from "react-router-dom";
import PageWrapper from "../components/PageWrapper";

console.log("✅ Dashboard rendering now");

function Dashboard() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [visibleDates, setVisibleDates] = useState([]);

  // 🔐 Redirect to login if no token
  useEffect(() => {
    if (!token) navigate("/");
  }, [token, navigate]);

  // ✅ Auto-set current week's Monday → Sunday on first load
  useEffect(() => {
    const today = new Date();
    const day = today.getDay(); // 0 = Sunday
    const diffToMonday = day === 0 ? -6 : 1 - day;

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() + diffToMonday);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    setStartDate(startOfWeek.toISOString().slice(0, 10));
    setEndDate(endOfWeek.toISOString().slice(0, 10));
  }, []);

  // -------------------- Fetch data --------------------
  const fetchData = async () => {
    if (!startDate || !endDate) return;

    try {
      const roomRes = await axiosInstance.post("/rooms/check", {
        startDate,
        endDate,
      });

      const bookingRes = await axiosInstance.get("/bookings");

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
    const dates = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }
    setVisibleDates(dates);
  };

  // ✅ Fetch automatically once startDate + endDate are ready
  useEffect(() => {
    if (startDate && endDate) {
      fetchData();
    }
  }, [startDate, endDate]); // eslint-disable-line react-hooks/exhaustive-deps

  // -------------------- Check if room is booked (per day) --------------------
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
    if (!startDate || !endDate) return;
    const shift = direction === "next" ? 7 : -7;

    const newStart = new Date(startDate);
    newStart.setDate(newStart.getDate() + shift);

    const newEnd = new Date(endDate);
    newEnd.setDate(newEnd.getDate() + shift);

    setStartDate(newStart.toISOString().slice(0, 10));
    setEndDate(newEnd.toISOString().slice(0, 10));
  };

  // -------------------- Cell Click --------------------
  const handleCellClick = (room, date) => {
    const clickedDate = date.toISOString().slice(0, 10);

    // find if this cell's date has a booking
    const booking = bookings.find(
      (b) =>
        b.rid === room.rid &&
        new Date(b.startDate) <= date &&
        new Date(b.endDate) >= date &&
        !b.isDeleted
    );

    if (booking) {
      // 🔴 BOOKED → redirect WITH booking info
      navigate("/rooms", {
        state: {
          booking,
          rid: room.rid,
          startDate: booking.startDate.slice(0, 10),
          endDate: booking.endDate.slice(0, 10),
        },
      });
    } else {
      // 🟢 AVAILABLE → redirect for new booking
      navigate("/rooms", {
        state: {
          rid: room.rid,
          startDate: clickedDate,
        },
      });
    }
  };

  return (
    <PageWrapper>
      <div
        style={{
          width: "100%",
          maxWidth: "95vw",
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

        {/* 🌿 Date Selector + Week Navigation */}
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
              value={startDate}
              onChange={(e) => {
                const selected = new Date(e.target.value);
                const day = selected.getDay();
                const diffToMonday = day === 0 ? -6 : 1 - day;
                const startOfWeek = new Date(selected);
                startOfWeek.setDate(selected.getDate() + diffToMonday);
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                setStartDate(startOfWeek.toISOString().slice(0, 10));
                setEndDate(endOfWeek.toISOString().slice(0, 10));
              }}
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
              flexWrap: "wrap",
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

        {/* 🌿 Calendar Table */}
        <div
          style={{
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            background: "white",
            borderRadius: "10px",
            padding: "10px",
          }}
        >
          <table
            style={{
              width: "100%",
              minWidth: "600px",
              borderCollapse: "collapse",
              textAlign: "center",
            }}
          >
            <thead>
              <tr
                style={{
                  background:
                    "linear-gradient(90deg, #bbdefb 0%, #64b5f6 100%)",
                  color: "#0d47a1",
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
              {Object.entries(
                rooms.reduce((acc, room) => {
                  if (!acc[room.rcategory]) acc[room.rcategory] = [];
                  acc[room.rcategory].push(room);
                  return acc;
                }, {})
              ).map(([category, categoryRooms]) => (
                <React.Fragment key={category}>
                  {categoryRooms.map((room, idx) => (
                    <tr key={room.rid}>
                      {idx === 0 && (
                        <td
                          rowSpan={categoryRooms.length}
                          style={{
                            background: "#e3f2fd",
                            fontWeight: "bold",
                            textAlign: "center",
                            verticalAlign: "middle",
                            border: "1px solid #ccc",
                          }}
                        >
                          {category}
                        </td>
                      )}

                      <td style={td}>{room.rname}</td>

                      {visibleDates.map((date, i) => {
                        const booked = isBooked(room.rid, date);
                        const baseColor = booked ? "#f28b82" : "#a8d5ba";
                        const hoverColor = booked ? "#e57373" : "#8cc7a6";

                        return (
                          <td
                            key={i}
                            onClick={() => handleCellClick(room, date)}
                            onMouseEnter={(e) => {
                              e.target.dataset.originalColor = baseColor;
                              e.target.style.backgroundColor = hoverColor;
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor =
                                e.target.dataset.originalColor;
                            }}
                            style={{
                              border: "1px solid #ccc",
                              background: baseColor,
                              cursor: "pointer",
                              height: "35px",
                              transition: "background-color 0.2s ease",
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

        {/* Legend */}
        <div
          style={{
            marginTop: "15px",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "20px",
            color: "#0d47a1",
            fontWeight: "600",
          }}
        >
          <span>
            <span style={legendBox("#f28b82")}></span> Booked
          </span>
          <span>
            <span style={legendBox("#a8d5ba")}></span> Available
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
