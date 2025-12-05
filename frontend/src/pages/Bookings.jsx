// frontend/src/pages/Bookings.jsx
import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosSetup";

function Bookings() {
  const role = localStorage.getItem("role"); // ✅ fix: use role from storage

  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [form, setForm] = useState({
    rid: "",
    cname: "",
    ccontact: "",
    startDate: "",
    endDate: "",
    advance: "",
    advanceReceiver: "",
    due: "",
    dueReceiver: "",
  });
  const [showForm, setShowForm] = useState(false);

  // Fetch all bookings
  const fetchBookings = async () => {
    try {
      const res = await axiosInstance.get("/bookings");
      setBookings(res.data);
    } catch (err) {
      console.error(
        "Error fetching bookings:",
        err.response?.data || err.message
      );
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (["advance", "due", "ccontact", "rid"].includes(name)) {
      if (!/^\d*$/.test(value)) return;
    }

    if (["cname", "advanceReceiver", "dueReceiver"].includes(name)) {
      if (!/^[a-zA-Z\s]*$/.test(value)) return;
    }

    setForm({ ...form, [name]: value });
  };

  // Save booking (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        rid: Number(form.rid),
        advance: Number(form.advance) || 0,
        due: Number(form.due) || 0,
      };

      let res;
      if (form._id) {
        if (role !== "admin") {
          alert("Only admins can update bookings ❌");
          return;
        }
        res = await axiosInstance.put(`/bookings/${form._id}`, payload);
      } else {
        // CREATE
        res = await axiosInstance.post("/bookings", payload);
      }

      alert(res.data?.message || "Booking saved successfully ✅");
      setShowForm(false);
      fetchBookings();
    } catch (err) {
      console.error("Booking API error:", err.response || err.message);
      alert(
        err.response?.data?.message ||
          `Error while saving booking ❌: ${err.message}`
      );
    }
  };

  // ✏️ Edit booking
  const handleEdit = (booking) => {
    setForm({
      ...booking,
      startDate: booking.startDate?.slice(0, 10) || "",
      endDate: booking.endDate?.slice(0, 10) || "",
    });

    setShowForm(true);
  };

  // 🗑️ Soft delete booking
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this booking?"))
      return;

    try {
      const res = await axiosInstance.patch(`/bookings/${id}/delete`);
      alert(res.data?.message || "Booking deleted successfully ✅");

      // ✅ Wait for refreshed data
      await fetchBookings();
    } catch (err) {
      console.error("Delete error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Error deleting booking ❌");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        background:
          "linear-gradient(180deg, #a8d8ff 0%, #6fc3ff 40%, #1e88e5 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "100px 20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* soft glowing background circles for modern look */}
      <div
        style={{
          position: "absolute",
          top: "-80px",
          right: "-100px",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.25)",
          filter: "blur(100px)",
        }}
      ></div>
      <div
        style={{
          position: "absolute",
          bottom: "-100px",
          left: "-100px",
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.2)",
          filter: "blur(90px)",
        }}
      ></div>

      {/* main white container */}
      <div
        style={{
          width: "100%",
          maxWidth: "900px",
          background: "#ffffff",
          borderRadius: "22px",
          padding: "45px 50px",
          boxShadow: "0 12px 40px rgba(0, 0, 0, 0.2)",
          position: "relative",
          zIndex: 2,
          color: "#000",
        }}
      >
        <h2 className="text-2xl font-bold mb-4">Bookings</h2>

        {/* Booking list */}
        <table className="w-full border-collapse border border-gray-500 mb-6">
          <thead>
            <tr className="bg-gray-700">
              <th className="border border-gray-500 p-2">Customer</th>
              <th className="border border-gray-500 p-2">Contact</th>
              <th className="border border-gray-500 p-2">Advance</th>
              <th className="border border-gray-500 p-2">Due</th>
              <th className="border border-gray-500 p-2">Start</th>
              <th className="border border-gray-500 p-2">End</th>
              <th className="border border-gray-500 p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b._id} className="text-center">
                <td className="border border-gray-500 p-2">{b.cname}</td>
                <td className="border border-gray-500 p-2">{b.ccontact}</td>
                <td className="border border-gray-500 p-2">{b.advance}</td>
                <td className="border border-gray-500 p-2">{b.due}</td>
                <td className="border border-gray-500 p-2">
                  {b.startDate?.slice(0, 10)}
                </td>
                <td className="border border-gray-500 p-2">
                  {b.endDate?.slice(0, 10)}
                </td>
                <td className="border border-gray-500 p-2 space-x-2">
                  <button
                    className="bg-blue-600 hover:bg-blue-800 px-3 py-1 rounded"
                    onClick={() => setSelectedBooking(b)}
                  >
                    View Details
                  </button>
                  {role === "admin" && (
                    <>
                      <button
                        className="bg-yellow-600 hover:bg-yellow-800 px-3 py-1 rounded"
                        onClick={() => handleEdit(b)}
                      >
                        Edit
                      </button>
                      <button
                        className="bg-red-600 hover:bg-red-800 px-3 py-1 rounded"
                        onClick={() => handleDelete(b._id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Add new booking */}
        {(role === "admin" || role === "manager") && !showForm && (
          <button
            onClick={() => {
              setForm({
                rid: "",
                cname: "",
                ccontact: "",
                startDate: "",
                endDate: "",
                advance: "",
                advanceReceiver: "",
                due: "",
                dueReceiver: "",
              });
              setShowForm(true);
            }}
            className="bg-green-600 hover:bg-green-800 px-4 py-2 rounded"
          >
            + New Booking
          </button>
        )}

        {/* Form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mt-6 bg-white p-6 rounded-lg w-full max-w-lg shadow-md border border-gray-200"
          >
            {[
              { name: "rid", label: "Room ID" },
              { name: "cname", label: "Customer Name" },
              { name: "ccontact", label: "Contact Number" },
              { name: "advance", label: "Advance" },
              { name: "advanceReceiver", label: "Advance Receiver" },
              { name: "due", label: "Due" },
              { name: "dueReceiver", label: "Due Receiver" },
            ].map((field) => (
              <div key={field.name} className="mb-4">
                <label
                  className="block mb-1 text-black
"
                >
                  {field.label}
                </label>
                <input
                  type="text"
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  className="w-full p-2 rounded border border-gray-300 bg-white text-black"
                />
              </div>
            ))}

            {/* Dates */}
            <div className="mb-4">
              <label className="block mb-1 text-white">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
                className="w-full p-2 rounded bg-gray-700 text-white"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 text-white">End Date</label>
              <input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={handleChange}
                className="w-full p-2 rounded bg-gray-700 text-white"
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-800 px-4 py-2 rounded"
              >
                {form._id ? "Update Booking" : "Submit Booking"}
              </button>
              <button
                type="button"
                className="bg-red-600 hover:bg-red-800 px-4 py-2 rounded"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* View details modal */}
        {selectedBooking && (
          <div className="mt-6 bg-white p-6 rounded-lg w-full max-w-lg shadow-md border border-gray-200">
            <h3 className="text-xl font-bold mb-4">Booking Details</h3>
            <p>Customer: {selectedBooking.cname}</p>
            <p>Contact: {selectedBooking.ccontact}</p>
            <p>Advance: {selectedBooking.advance}</p>
            <p>Advance Receiver: {selectedBooking.advanceReceiver}</p>
            <p>Due: {selectedBooking.due}</p>
            <p>Due Receiver: {selectedBooking.dueReceiver}</p>
            <div className="mt-4">
              <button
                onClick={() => setSelectedBooking(null)}
                className="bg-red-600 hover:bg-red-800 px-4 py-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Bookings;
