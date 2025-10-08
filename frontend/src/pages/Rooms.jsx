// frontend/src/pages/Rooms.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import PageWrapper from "../components/PageWrapper";
import Swal from "sweetalert2";
import { useLocation } from "react-router-dom";

function Rooms({ role }) {
  const token = localStorage.getItem("token");
  const API_BASE = "http://localhost:5001/api";

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
  // ✅ Detect redirect from Dashboard (rid + date)
  const location = useLocation();
  const redirectedRid = location.state?.rid;
  const redirectedDate = location.state?.startDate;

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
        available: r.available === true, // ✅ directly use backend's "available"
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
  // ✅ Automatically show and open the clicked room card when redirected from Dashboard
  useEffect(() => {
    if (!redirectedRid || !redirectedDate) return;

    // Step 1: set both start and end date first
    setStartDate(redirectedDate);
    setEndDate(redirectedDate);

    // Step 2: Wait until React updates the state, then fetch data
    const timer = setTimeout(async () => {
      try {
        const res = await axios.post(
          `${API_BASE}/rooms/check`,
          { startDate: redirectedDate, endDate: redirectedDate },
          axiosConfig
        );

        const data = (res.data || []).map((r) => ({
          ...r,
          available: r.available === true,
        }));
        setAvailableRooms(data);

        // Step 3: Find that room in the fetched list
        const clickedRoom = data.find((r) => r.rid === redirectedRid);

        if (clickedRoom) {
          // if available → open booking form
          if (clickedRoom.available) {
            setSelectedRoom(clickedRoom);
          } else {
            // if booked → open the booking details
            await fetchBookingDetails(clickedRoom);
          }

          // Step 4: scroll to the card and highlight it
          setTimeout(() => {
            const target = document.getElementById(`room-${redirectedRid}`);
            if (target) {
              target.scrollIntoView({ behavior: "smooth", block: "center" });
              target.style.border = "3px solid #1976d2";
              setTimeout(() => {
                target.style.border = "2px solid #020202ff";
              }, 1500);
            }
          }, 400);
        }
      } catch (err) {
        console.error("Redirect booking load error:", err);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [redirectedRid, redirectedDate]);

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
  // ✅ Delete booking (admin only) with SweetAlert confirmation
  const deleteBooking = async () => {
    if (!viewBooking) return;

    const confirmResult = await Swal.fire({
      title: "Are you sure you want to delete?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirmResult.isConfirmed) return; // user cancelled

    try {
      await axios.patch(
        `${API_BASE}/bookings/${viewBooking._id}/delete`,
        {},
        axiosConfig
      );

      await Swal.fire({
        title: "Deleted!",
        text: "Booking deleted successfully (soft delete).",
        icon: "success",
        timer: 1800,
        showConfirmButton: false,
      });

      setViewBooking(null);
      await checkAvailability();
    } catch (err) {
      console.error(err.response || err.message);
      Swal.fire({
        title: "Error!",
        text: err.response?.data?.message || "Error deleting booking.",
        icon: "error",
        confirmButtonColor: "#d33",
      });
    }
  };

  return (
    <PageWrapper>
      <h2
        style={{
          textAlign: "center",
          color: "#0d47a1",
          fontWeight: 700,
          fontSize: "1.8rem",
          marginBottom: "30px",
        }}
      >
        Room Booking
      </h2>

      {/* Date selection */}
      <form
        onSubmit={checkAvailability}
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "25px", // ⬅ spacing below filters
        }}
      >
        <label style={{ fontWeight: 500 }}>
          Start Date:
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            style={{
              marginLeft: "6px",
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid #bbb",
            }}
          />
        </label>

        <label style={{ fontWeight: 500 }}>
          End Date:
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            style={{
              marginLeft: "6px",
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid #bbb",
            }}
          />
        </label>

        <button
          type="submit"
          style={{
            backgroundColor: "#884892ff",
            color: "#fff",
            padding: "10px 18px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: 600,
          }}
          disabled={loading}
        >
          {loading ? "Checking..." : "Check Availability"}
        </button>
      </form>

      {error && (
        <div
          style={{ color: "crimson", textAlign: "center", marginBottom: 10 }}
        >
          {error}
        </div>
      )}
      {message && (
        <div style={{ color: "green", textAlign: "center", marginBottom: 20 }}>
          {message}
        </div>
      )}

      {/* Room list */}
      <div>
        {availableRooms.map((room) => (
          <div
            id={`room-${room.rid}`} // ✅ added for scroll & highlight
            key={room.rid}
            style={{
              width: 760,
              margin: "12px auto",
              padding: 16,
              border: "2px solid #020202ff",
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
                // ✅ Hide "Book Now" if currently booking this room
                selectedRoom?.rid === room.rid ? null : (
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
                )
              ) : // ✅ Hide "View Details" if this room's details are currently expanded
              viewBooking?.rid === room.rid ? null : (
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
                  {/* Customer Name */}
                  <input
                    placeholder="Customer name"
                    value={formData.cname}
                    onChange={(e) =>
                      setFormData({ ...formData, cname: e.target.value })
                    }
                    required
                    style={{
                      width: "100%",
                      padding: 8,
                      border: "1px solid #ccc",
                      borderRadius: "6px",
                    }}
                  />

                  {/* Contact field with +880 */}
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span
                      style={{
                        background: "#eee",
                        padding: "8px 10px",
                        border: "1px solid #ccc",
                        borderRadius: "6px 0 0 6px",
                        fontWeight: "bold",
                      }}
                    >
                      +880
                    </span>
                    <input
                      type="number"
                      placeholder="1XXXXXXXXX"
                      value={formData.ccontact}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d{0,10}$/.test(value)) {
                          setFormData({ ...formData, ccontact: value });
                        }
                      }}
                      required
                      min="1000000000"
                      max="1999999999"
                      onInvalid={(e) =>
                        e.target.setCustomValidity(
                          "Please enter a valid 10-digit BD phone number after +880"
                        )
                      }
                      onInput={(e) => e.target.setCustomValidity("")}
                      style={{
                        flex: 1,
                        padding: 8,
                        border: "1px solid #ccc",
                        borderRadius: "0 6px 6px 0",
                      }}
                    />
                  </div>

                  {/* Advance */}
                  <input
                    placeholder="Advance"
                    type="number"
                    min="1"
                    step="any"
                    value={formData.advance}
                    onChange={(e) =>
                      setFormData({ ...formData, advance: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: 8,
                      border: "1px solid #ccc",
                      borderRadius: "6px",
                    }}
                    required
                    onInvalid={(e) =>
                      e.target.setCustomValidity(
                        "Advance amount cannot be 0 or negative (-)"
                      )
                    }
                    onInput={(e) => e.target.setCustomValidity("")}
                  />

                  {/* Advance Receiver */}
                  <input
                    placeholder="Advance Receiver"
                    value={formData.advanceReceiver}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        advanceReceiver: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: 8,
                      border: "1px solid #ccc",
                      borderRadius: "6px",
                    }}
                  />

                  {/* Due */}
                  {/* Due */}
                  <input
                    placeholder="Due Amount"
                    type="number"
                    min="0"
                    step="any"
                    value={formData.due}
                    onChange={(e) =>
                      setFormData({ ...formData, due: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: 8,
                      border: "1px solid #ccc",
                      borderRadius: "6px",
                    }}
                    required
                    onInvalid={(e) =>
                      e.target.setCustomValidity(
                        "Due amount cannot be negative (-)"
                      )
                    }
                    onInput={(e) => e.target.setCustomValidity("")}
                  />

                  {/* Due Receiver */}
                  <input
                    placeholder="Due Receiver"
                    value={formData.dueReceiver}
                    onChange={(e) =>
                      setFormData({ ...formData, dueReceiver: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: 8,
                      border: "1px solid #ccc",
                      borderRadius: "6px",
                    }}
                  />

                  {/* Buttons */}
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
              {/* Booking details */}
              {viewBooking && viewBooking.rid === room.rid && (
                <div
                  style={{
                    marginTop: 14,
                    background: "#f9f9ff",
                    border: "1.5px solid #ccc",
                    borderRadius: "10px",
                    padding: "14px 16px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    textAlign: "left",
                    fontSize: "15px",
                  }}
                >
                  <div style={{ marginBottom: "10px" }}>
                    <p>
                      <strong>Customer:</strong> {viewBooking.cname || "—"}
                    </p>
                    <p>
                      <strong>Contact:</strong>{" "}
                      <span style={{ color: "#333" }}>
                        {viewBooking.ccontact || "—"}
                      </span>
                    </p>
                    <p>
                      <strong>Advance:</strong>{" "}
                      <span style={{ color: "#1b5e20", fontWeight: "600" }}>
                        {viewBooking.advance || 0}
                      </span>
                    </p>
                    <p>
                      <strong>Advance Receiver:</strong>{" "}
                      <span style={{ color: "#333" }}>
                        {viewBooking.advanceReceiver || "—"}
                      </span>
                    </p>
                    <p>
                      <strong>Due:</strong>{" "}
                      <span
                        style={{
                          color: viewBooking.due < 0 ? "crimson" : "#0d47a1",
                          fontWeight: "600",
                        }}
                      >
                        {viewBooking.due}
                      </span>
                    </p>
                    <p>
                      <strong>Due Receiver:</strong>{" "}
                      <span style={{ color: "#333" }}>
                        {viewBooking.dueReceiver || "—"}
                      </span>
                    </p>
                  </div>

                  {role === "admin" && (
                    <div
                      style={{ display: "flex", gap: "8px", marginTop: "8px" }}
                    >
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
                          background: "#f57c00",
                          color: "white",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          border: "none",
                          cursor: "pointer",
                          fontWeight: "600",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={deleteBooking}
                        style={{
                          background: "#c62828",
                          color: "white",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          border: "none",
                          cursor: "pointer",
                          fontWeight: "600",
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
    </PageWrapper>
  );
}

export default Rooms;
