import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import PageWrapper from "../components/PageWrapper"; // ✅ import wrapper

function Restaurant({ role }) {
  const API_BASE = "http://localhost:5001/api";
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    res_date: "",
    res_amountSpent: "",
    res_amountEarned: "",
  });
  const [message, setMessage] = useState("");
  const [messageColor, setMessageColor] = useState("");
  const [restaurants, setRestaurants] = useState([]);
  const [viewAll, setViewAll] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState(null); // selected year

  const fetchRestaurants = async () => {
    try {
      const res = await axios.get(`${API_BASE}/restaurants`, {
        headers: { Authorization: token },
      });
      let data = res.data;

      // Role-based visibility
      if (role === "manager") {
        const userId = JSON.parse(atob(token.split(".")[1])).uid;
        data = data.filter((r) => r.res_createdByUid === userId);
      }

      // Apply filter
      const today = new Date();
      if (filter === "today") {
        data = data.filter(
          (r) => new Date(r.res_date).toDateString() === today.toDateString()
        );
      } else if (filter === "month") {
        data = data.filter(
          (r) =>
            new Date(r.res_date).getMonth() === today.getMonth() &&
            new Date(r.res_date).getFullYear() === today.getFullYear()
        );
      } else if (filter === "year" && yearFilter) {
        data = data.filter(
          (r) => new Date(r.res_date).getFullYear() === parseInt(yearFilter)
        );
      }

      setRestaurants(data);
    } catch (err) {
      console.error(
        "fetchRestaurants error:",
        err.response?.data || err.message
      );
    }
  };

  useEffect(() => {
    if (viewAll) fetchRestaurants();
    else setRestaurants([]);
  }, [viewAll, filter, yearFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      if (editingId) {
        await axios.put(`${API_BASE}/restaurants/${editingId}`, form, {
          headers: { Authorization: token },
        });
        setMessage("Restaurant entry updated successfully");
        setMessageColor("green");
      } else {
        const res = await axios.post(`${API_BASE}/restaurants`, form, {
          headers: { Authorization: token },
        });
        setMessage(res.data.message || "Restaurant entry saved successfully");
        setMessageColor("green");
      }
      setForm({ res_date: "", res_amountSpent: "", res_amountEarned: "" });
      setEditingId(null);
      if (viewAll) fetchRestaurants();
    } catch (err) {
      setMessage("Error saving restaurant entry");
      setMessageColor("crimson");
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure you want to delete?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        const res = await axios.delete(`${API_BASE}/restaurants/${id}`, {
          headers: { Authorization: token },
        });
        setMessage(res.data.message);
        setMessageColor("green");
        if (viewAll) fetchRestaurants();
        Swal.fire("Deleted!", "The entry has been deleted.", "success");
      } catch (err) {
        setMessage("Error deleting restaurant entry");
        setMessageColor("crimson");
        Swal.fire("Error!", "Failed to delete entry.", "error");
      }
    }
  };

  const handleEdit = (r) => {
    setForm({
      res_date: r.res_date.split("T")[0],
      res_amountSpent: r.res_amountSpent,
      res_amountEarned: r.res_amountEarned,
    });
    setEditingId(r._id);
    setMessage("");
  };

  const cancelEdit = () => {
    setForm({ res_date: "", res_amountSpent: "", res_amountEarned: "" });
    setEditingId(null);
    setMessage("");
  };

  const availableYears = [
    ...new Set(restaurants.map((r) => new Date(r.res_date).getFullYear())),
  ].sort((a, b) => b - a);

  return (
    <PageWrapper>
      <div
        style={{
          width: "100%",
          maxWidth: "850px",
          background: "#ffffff",
          borderRadius: "22px",
          padding: "45px 50px",
          boxShadow: "0 15px 45px rgba(0, 0, 0, 0.15)",
          margin: "80px auto",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            color: "#0d47a1",
            fontWeight: 700,
            fontSize: "1.8rem",
            marginBottom: "30px",
          }}
        >
          Restaurant Management
        </h2>

        {/* View All toggle */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <button
            style={{
              background: "#000",
              color: "#fff",
              padding: "10px 20px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
            onClick={() => setViewAll(!viewAll)}
          >
            {viewAll ? "Hide All" : "View All"}
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            background: "#fefefe",
            padding: 24,
            borderRadius: 8,
            border: "1px solid #ddd",
            marginBottom: 30,
          }}
        >
          <div style={{ marginBottom: 12 }}>
            <label>Date</label>
            <input
              type="date"
              value={form.res_date}
              onChange={(e) => setForm({ ...form, res_date: e.target.value })}
              style={{ width: "100%", padding: 8, marginTop: 4 }}
              required
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Amount Spent (tk)</label>
            <input
              type="number"
              value={form.res_amountSpent}
              onChange={(e) =>
                setForm({ ...form, res_amountSpent: e.target.value })
              }
              style={{ width: "100%", padding: 8, marginTop: 4 }}
              required
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Amount Earned (tk)</label>
            <input
              type="number"
              value={form.res_amountEarned}
              onChange={(e) =>
                setForm({ ...form, res_amountEarned: e.target.value })
              }
              style={{ width: "100%", padding: 8, marginTop: 4 }}
              required
            />
          </div>
          <div style={{ textAlign: "center", marginTop: 12 }}>
            <button
              type="submit"
              style={{
                background: editingId ? "#007bff" : "green",
                color: "#fff",
                padding: "10px 20px",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              {editingId ? "Update Entry" : "Submit"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                style={{
                  background: "#d32f2f",
                  color: "#fff",
                  padding: "10px 20px",
                  marginLeft: 10,
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            )}
          </div>
          {message && (
            <p
              style={{
                color: messageColor,
                marginTop: 12,
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              {message}
            </p>
          )}
        </form>

        {/* Filter dropdown */}
        {viewAll && (
          <div
            style={{
              marginBottom: 20,
              display: "flex",
              justifyContent: "center",
              gap: "10px",
              alignItems: "center",
            }}
          >
            <label>Filter:</label>
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setYearFilter(null);
              }}
            >
              <option value="all">All</option>
              <option value="today">Today</option>
              <option value="month">This Month</option>
              <option value="year">Year</option>
            </select>

            {filter === "year" && (
              <select
                value={yearFilter || ""}
                onChange={(e) => setYearFilter(e.target.value)}
              >
                <option value="">Select Year</option>
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* List */}
        {viewAll && (
          <>
            <h3 style={{ marginBottom: 16 }}>Recent Entries</h3>
            {restaurants.length === 0 ? (
              <p>No entries found.</p>
            ) : (
              restaurants.map((r) => (
                <div
                  key={r._id}
                  style={{
                    background: "#fafafa",
                    border: "1px solid #ddd",
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 12,
                  }}
                >
                  <p>
                    <strong>Date:</strong>{" "}
                    {new Date(r.res_date).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Amount Spent:</strong> {r.res_amountSpent} ৳
                  </p>
                  <p>
                    <strong>Amount Earned:</strong> {r.res_amountEarned} ৳
                  </p>
                  <div style={{ marginTop: 8 }}>
                    {role === "admin" && (
                      <>
                        <button
                          onClick={() => handleEdit(r)}
                          style={{
                            background: "#007bff",
                            color: "#fff",
                            padding: "6px 12px",
                            marginRight: 8,
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(r._id)}
                          style={{
                            background: "#dc3545",
                            color: "#fff",
                            padding: "6px 12px",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                          }}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </PageWrapper>
  );
}

export default Restaurant;
