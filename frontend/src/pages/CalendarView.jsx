//E:\Aronnok Eco Resort\frontend\src\pages\CalendarView.jsx
import React, { useEffect, useState } from "react";
import axiosInstance from "../utils/axiosSetup";
import { useNavigate } from "react-router-dom";
import PageWrapper from "../components/PageWrapper";
console.log("✅ CalendarView rendering now");

function CalendarView() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  useEffect(() => {
    if (!token) navigate("/");
  }, [token, navigate]);

  const [rooms, setRooms] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [visibleDates, setVisibleDates] = useState([]);
  // ✅ Auto-set 7-day window (today ± 3 days) when page opens
  // ✅ Auto-set current week's Monday → Sunday when page opens
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
      const roomRes = await axiosInstance.post(`/rooms/check`, {
        startDate,
        endDate,
      });

      setRooms(roomRes.data || []);
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
  }, [startDate, endDate]);

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
    navigate("/rooms", {
      state: {
        rid: room.rid,
        startDate: date.toISOString().slice(0, 10),
      },
    });
  };

  return (
    <PageWrapper>
      <div style={{ width: "100%", overflowX: "auto", paddingTop: "10px" }}>
        {/* 🌿 Header */}
        <h2
          style={{
            textAlign: "center",
            fontSize: "1.8rem",
            color: "#0d47a1",
            fontWeight: 700,
            marginBottom: "25px",
          }}
        >
          Aronnok Eco Resort Dashboard
        </h2>

        {/* 🌿 Date Selector */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "10px",
            marginBottom: "20px",
          }}
        >
          <label style={{ fontWeight: 600 }}>
            Select Week Starting From:{" "}
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
                padding: "6px 10px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                background: "#fff",
                cursor: "pointer",
              }}
            />
          </label>
        </div>

        {/* 🌿 Week Navigation */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: "15px",
            gap: "10px",
          }}
        >
          <button
            onClick={() => shiftWeek("prev")}
            style={{
              background: "#64b5f6",
              color: "white",
              padding: "6px 12px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
            }}
          >
            ← Previous Week
          </button>
          <button
            onClick={() => shiftWeek("next")}
            style={{
              background: "#64b5f6",
              color: "white",
              padding: "6px 12px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Next Week →
          </button>
        </div>

        {/* 🌿 Calendar Table */}
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
                  Category
                </th>
                <th style={{ padding: "8px", border: "1px solid #ccc" }}>
                  Room Name
                </th>
                {visibleDates.map((d, i) => (
                  <th
                    key={i}
                    style={{
                      padding: "6px",
                      border: "1px solid #ccc",
                      textAlign: "center",
                    }}
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

                      <td
                        style={{
                          border: "1px solid #ccc",
                          padding: "6px",
                          textAlign: "center",
                        }}
                      >
                        {room.rname}
                      </td>

                      {visibleDates.map((date, i) => {
                        return (
                          <td
                            key={i}
                            onClick={() => handleCellClick(room, date)}
                            style={{
                              border: "1px solid #ccc",
                              background: room.available
                                ? "#5c9e76"
                                : "#ad5d56",
                              cursor: "pointer",
                              height: "35px",
                            }}
                            title={room.available ? "Available" : "Booked"}
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
    </PageWrapper>
  );
}

export default CalendarView;
