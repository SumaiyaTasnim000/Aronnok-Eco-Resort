// frontend/src/pages/Rooms.jsx
import React, { useState } from "react";
import axios from "axios";

function Rooms({ role }) {
  const token = localStorage.getItem("token");
  const API_BASE = "http://localhost:5001/api";

  // ==== NEW: fallback role detection (if prop `role` is not provided) ====
  // This will try in order: prop role -> token payload urole/role -> localStorage "role"
  try {
    if (!role) {
      let rawToken = token || "";
      if (rawToken.startsWith("Bearer ")) rawToken = rawToken.slice(7).trim();
      if (rawToken) {
        const parts = rawToken.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          role =
            payload.urole ||
            payload.role ||
            localStorage.getItem("role") ||
            role;
        } else {
          role = localStorage.getItem("role") || role;
        }
      } else {
        role = localStorage.getItem("role") || role;
      }
    }
  } catch (err) {
    // fallback quietly if token decode fails
    role = localStorage.getItem("role") || role;
    console.error("Role detection error:", err);
  }
  // =====================================================================

  const [availableRooms, setAvailableRooms] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [viewBooking, setViewBooking] = useState(null);
  const [formData, setFormData] = useState({
    cname: "",
    ccontact: "",
    advance: "",
    advanceReceiver: "",
    due: "",
    dueReceiver: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!token) {
    alert("You are not logged in! Please log in to continue.");
    return null;
  }

  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // ✅ Check room availability
  const checkAvailability = async (e) => {
    if (e) e.preventDefault();
    setMessage("");
    setError("");
    setAvailableRooms([]);
    setSelectedRoom(null);
    setViewBooking(null);

    if (!startDate || !endDate) {
      setError("Please select both start date and end date.");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        `${API_BASE}/rooms/check`,
        { startDate, endDate },
        axiosConfig
      );

      const data = (res.data || []).map((r) => ({
        ...r,
        available: typeof r.available === "boolean" ? r.available : !r.isBooked,
      }));

      setAvailableRooms(data);

      const availCount = data.filter((r) => r.available).length;
      setMessage(
        availCount === 0
          ? "No rooms available for the chosen dates."
          : `${availCount} rooms available.`
      );
    } catch (err) {
      console.error(err.response || err.message);
      setError("Error checking availability.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Start booking a room
  const handleBookNow = (room) => {
    setSelectedRoom(room);
    setViewBooking(null);
    setFormData({
      cname: "",
      ccontact: "",
      advance: "",
      advanceReceiver: "",
      due: "",
      dueReceiver: "",
    });
  };

  // ✅ Submit booking (create/update)
  const submitBooking = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      setLoading(true);
      let res;

      if (viewBooking && role === "admin") {
        // Update booking
        res = await axios.put(
          `${API_BASE}/bookings/${viewBooking._id}`,
          { ...formData, rid: selectedRoom?.rid || viewBooking.rid },
          axiosConfig
        );
      } else {
        // Create new booking -> use rooms/book/:rid route
        res = await axios.post(
          `${API_BASE}/rooms/book/${selectedRoom.rid}`,
          { ...formData, startDate, endDate },
          axiosConfig
        );
      }

      setMessage(res.data.message || "Booking saved successfully ✅");
      await checkAvailability();
      setSelectedRoom(null);
      setViewBooking(null);
    } catch (err) {
      console.error(err.response || err.message);
      setError(
        err.response?.data?.message ||
          "Error while saving booking (check token)."
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ View booking details
  const fetchBookingDetails = async (room) => {
    setError("");
    setMessage("");
    setSelectedRoom(null);
    try {
      const res = await axios.get(`${API_BASE}/bookings`, axiosConfig);
      const booking = res.data.find((b) => b.rid === room.rid && !b.isDeleted);
      if (!booking) {
        setError("No booking found for this room.");
        return;
      }
      setViewBooking(booking);
    } catch (err) {
      console.error(err.response || err.message);
      setError(
        err.response?.data?.message ||
          "Server error while fetching booking details."
      );
    }
  };

  // ✅ Delete booking (admin only)
  const deleteBooking = async () => {
    if (!viewBooking) return;
    try {
      await axios.patch(
        `${API_BASE}/bookings/${viewBooking._id}/delete`,
        {},
        axiosConfig
      );
      setMessage("Booking deleted successfully (soft delete).");
      setViewBooking(null);
      await checkAvailability();
    } catch (err) {
      console.error(err.response || err.message);
      setError(
        err.response?.data?.message || "Error deleting booking (check token)."
      );
    }
  };

  return (
    <div style={{ padding: 20, textAlign: "center", color: "#236472ff" }}>
      <h2>Room Booking</h2>

      {/* Date selection */}
      <form onSubmit={checkAvailability} style={{ marginBottom: 20 }}>
        <label>
          Start Date:
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </label>
        <label style={{ marginLeft: 16 }}>
          End Date:
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </label>
        <button type="submit" style={{ marginLeft: 16 }} disabled={loading}>
          {loading ? "Checking..." : "Check Availability"}
        </button>
      </form>

      {error && <div style={{ color: "crimson" }}>{error}</div>}
      {message && <div style={{ color: "green" }}>{message}</div>}

      {/* Room list */}
      <div>
        {availableRooms.map((room) => (
          <div
            key={room.rid}
            style={{
              width: 760,
              margin: "12px auto",
              padding: 16,
              border: "1px solid #ddd",
              borderRadius: 8,
              background: "#fff",
              textAlign: "left",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h3>{room.rname}</h3>
              <div>Category: {room.rcategory}</div>
              <div>Price: {room.rprice}</div>
              <div>
                Availability:{" "}
                {room.available ? (
                  <span style={{ color: "green" }}>Available</span>
                ) : (
                  <span style={{ color: "red" }}>Not Available</span>
                )}
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              {room.available ? (
                <button
                  onClick={() => handleBookNow(room)}
                  style={{
                    background: "green",
                    color: "white",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Book Now
                </button>
              ) : (
                <button
                  onClick={() => fetchBookingDetails(room)}
                  style={{
                    background: "blue",
                    color: "white",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  View Details
                </button>
              )}

              {/* Booking form */}
              {selectedRoom?.rid === room.rid && (
                <form
                  onSubmit={submitBooking}
                  style={{
                    marginTop: 12,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <input
                    placeholder="Customer name"
                    value={formData.cname}
                    onChange={(e) =>
                      setFormData({ ...formData, cname: e.target.value })
                    }
                    required
                  />
                  <input
                    placeholder="Contact"
                    type="number"
                    value={formData.ccontact}
                    onChange={(e) =>
                      setFormData({ ...formData, ccontact: e.target.value })
                    }
                    required
                  />
                  <input
                    placeholder="Advance"
                    type="number"
                    value={formData.advance}
                    onChange={(e) =>
                      setFormData({ ...formData, advance: e.target.value })
                    }
                  />
                  <input
                    placeholder="Advance Receiver"
                    value={formData.advanceReceiver}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        advanceReceiver: e.target.value,
                      })
                    }
                  />
                  <input
                    placeholder="Due"
                    type="number"
                    value={formData.due}
                    onChange={(e) =>
                      setFormData({ ...formData, due: e.target.value })
                    }
                  />
                  <input
                    placeholder="Due Receiver"
                    value={formData.dueReceiver}
                    onChange={(e) =>
                      setFormData({ ...formData, dueReceiver: e.target.value })
                    }
                  />
                  <div>
                    <button
                      type="submit"
                      style={{
                        background: "green",
                        color: "white",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: "none",
                        cursor: "pointer",
                        marginRight: 8,
                      }}
                    >
                      {viewBooking ? "Update" : "Submit Booking"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRoom(null)}
                      style={{
                        background: "red",
                        color: "white",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Booking details */}
              {viewBooking && viewBooking.rid === room.rid && (
                <div style={{ marginTop: 12, textAlign: "left" }}>
                  <p>Customer: {viewBooking.cname}</p>
                  <p>Contact: {viewBooking.ccontact}</p>
                  <p>Advance: {viewBooking.advance}</p>
                  <p>Advance Receiver: {viewBooking.advanceReceiver}</p>
                  <p>Due: {viewBooking.due}</p>
                  <p>Due Receiver: {viewBooking.dueReceiver}</p>

                  {role === "admin" && (
                    <div>
                      <button
                        onClick={() => {
                          setFormData({
                            cname: viewBooking.cname,
                            ccontact: viewBooking.ccontact,
                            advance: viewBooking.advance,
                            advanceReceiver: viewBooking.advanceReceiver,
                            due: viewBooking.due,
                            dueReceiver: viewBooking.dueReceiver,
                          });
                          setSelectedRoom(room);
                        }}
                        style={{
                          background: "orange",
                          color: "white",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          border: "none",
                          cursor: "pointer",
                          marginRight: 8,
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={deleteBooking}
                        style={{
                          background: "red",
                          color: "white",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Rooms;
