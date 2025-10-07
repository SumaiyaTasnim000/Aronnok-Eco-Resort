import React, { useState, useEffect, useRef } from "react";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [errors, setErrors] = useState({});

  const viewRef = useRef(null);
  const formRef = useRef(null);

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
  }, [viewAll]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setErrors({}); // reset old errors

    const spent = Number(form.res_amountSpent);
    const earned = Number(form.res_amountEarned);
    const newErrors = {};

    // Inline validations
    if (!form.res_date) newErrors.res_date = "Please select a valid date.";
    if (!form.res_amountSpent || isNaN(spent) || spent <= 0)
      newErrors.res_amountSpent = "Amount must be greater than 0.";
    if (!form.res_amountEarned || isNaN(earned) || earned <= 0)
      newErrors.res_amountEarned = "Amount must be greater than 0.";

    // If errors exist, show them and stop submission
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

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
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const cancelEdit = () => {
    setForm({ res_date: "", res_amountSpent: "", res_amountEarned: "" });
    setEditingId(null);
    setMessage("");
  };

  // Filter restaurants
  const filteredRestaurants = restaurants.filter((r) => {
    const searchMatch =
      r.res_amountSpent.toString().includes(searchTerm) ||
      r.res_amountEarned.toString().includes(searchTerm) ||
      new Date(r.res_date).toLocaleDateString().includes(searchTerm);

    const date = new Date(r.res_date);
    const fromOK = filterFrom ? date >= new Date(filterFrom) : true;
    const toOK = filterTo ? date <= new Date(filterTo) : true;
    return searchMatch && fromOK && toOK && !r.res_isDeleted;
  });

  // CSV Export
  const exportToCSV = () => {
    if (filteredRestaurants.length === 0) {
      Swal.fire("No data", "There are no records to export.", "info");
      return;
    }

    const rows = filteredRestaurants.map((r, i) => ({
      "#": i + 1,
      Date: new Date(r.res_date).toLocaleDateString(),
      "Amount Spent ": r.res_amountSpent,
      "Amount Earned": r.res_amountEarned,
    }));

    const headers = Object.keys(rows[0] || {}).join(",");
    const csv = [headers, ...rows.map((r) => Object.values(r).join(","))].join(
      "\n"
    );

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const today = new Date().toISOString().split("T")[0];
    a.download = `Restaurant_records_${today}.csv`;
    a.click();
  };

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
          margin: "0 auto 40px",
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
            onClick={() => {
              const next = !viewAll;
              setViewAll(next);
              if (next) {
                setTimeout(() => {
                  viewRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }, 300);
              }
            }}
          >
            {viewAll ? "Hide All" : "View All"}
          </button>
        </div>

        {/* Form */}
        <form
          ref={formRef}
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
            <label>Total Amount Spent (tk)</label>
            <input
              type="number"
              min="1"
              value={form.res_amountSpent}
              onChange={(e) =>
                setForm({ ...form, res_amountSpent: e.target.value })
              }
              style={{
                width: "100%",
                padding: 8,
                marginTop: 4,
                borderColor: errors.res_amountSpent ? "crimson" : "#ccc",
              }}
              required
            />
            {errors.res_amountSpent && (
              <p
                style={{ color: "crimson", fontSize: "13px", marginTop: "4px" }}
              >
                {errors.res_amountSpent}
              </p>
            )}
          </div>

          <div style={{ marginBottom: 12 }}>
            <label>Total Amount Earned (tk)</label>
            <input
              type="number"
              min="1"
              value={form.res_amountEarned}
              onChange={(e) =>
                setForm({ ...form, res_amountEarned: e.target.value })
              }
              style={{
                width: "100%",
                padding: 8,
                marginTop: 4,
                borderColor: errors.res_amountEarned ? "crimson" : "#ccc",
              }}
              required
            />
            {errors.res_amountEarned && (
              <p
                style={{ color: "crimson", fontSize: "13px", marginTop: "4px" }}
              >
                {errors.res_amountEarned}
              </p>
            )}
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
          <>
            <h3
              style={{
                textAlign: "center",
                fontWeight: "700",
                marginBottom: "15px",
              }}
            >
              Recent Entries
            </h3>
            <div
              style={{
                marginBottom: 10,
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
                alignItems: "flex-end",
              }}
            >
              <input
                type="text"
                placeholder="Search by Amount or Date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ flex: 1, padding: 8 }}
              />

              <div style={{ display: "flex", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "0.9rem" }}>Entries From:</label>
                  <input
                    type="date"
                    value={filterFrom || ""}
                    onChange={(e) => setFilterFrom(e.target.value)}
                    style={{ padding: 8, marginLeft: 8 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.9rem" }}>Entries To:</label>
                  <input
                    type="date"
                    value={filterTo || ""}
                    onChange={(e) => setFilterTo(e.target.value)}
                    style={{ padding: 8, marginLeft: 8 }}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* List */}
        {viewAll && (
          <>
            {filteredRestaurants.length === 0 ? (
              <p>No records found.</p>
            ) : (
              <div ref={viewRef}>
                {/* Export Button */}
                <div style={{ textAlign: "right", marginBottom: 20 }}>
                  <button
                    onClick={exportToCSV}
                    style={{
                      background: "#0d47a1",
                      color: "#fff",
                      padding: "10px 24px",
                      borderRadius: 6,
                      border: "none",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    Export CSV
                  </button>
                </div>

                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    border: "1px solid #ddd",
                    marginTop: 20,
                  }}
                >
                  <thead>
                    <tr style={{ background: "#f2f2f2" }}>
                      <th style={{ border: "1px solid #ddd", padding: 8 }}>
                        #
                      </th>
                      <th style={{ border: "1px solid #ddd", padding: 8 }}>
                        Date
                      </th>
                      <th style={{ border: "1px solid #ddd", padding: 8 }}>
                        Amount Spent (৳)
                      </th>
                      <th style={{ border: "1px solid #ddd", padding: 8 }}>
                        Amount Earned (৳)
                      </th>
                      {role === "admin" && (
                        <th style={{ border: "1px solid #ddd", padding: 8 }}>
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRestaurants.map((r, i) => (
                      <tr key={r._id}>
                        <td style={{ border: "1px solid #ddd", padding: 8 }}>
                          {i + 1}
                        </td>
                        <td style={{ border: "1px solid #ddd", padding: 8 }}>
                          {new Date(r.res_date).toLocaleDateString()}
                        </td>
                        <td style={{ border: "1px solid #ddd", padding: 8 }}>
                          {r.res_amountSpent}
                        </td>
                        <td style={{ border: "1px solid #ddd", padding: 8 }}>
                          {r.res_amountEarned}
                        </td>
                        {role === "admin" && (
                          <td style={{ border: "1px solid #ddd", padding: 8 }}>
                            <button
                              onClick={() => handleEdit(r)}
                              style={{
                                background: "#007bff",
                                color: "#fff",
                                padding: "6px 12px",
                                border: "none",
                                borderRadius: 4,
                                marginRight: 8,
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
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </PageWrapper>
  );
}

export default Restaurant;
