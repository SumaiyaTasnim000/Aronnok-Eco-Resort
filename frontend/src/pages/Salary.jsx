import React, { useState, useEffect } from "react";
import axios from "axios";

function Salary({ role }) {
  const API_BASE = "http://localhost:5001/api";
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    sname: "",
    smonthly: "",
    spaidMonth: "",
    spaidDays: "",
    spaidSalary: "",
  });
  const [message, setMessage] = useState("");
  const [messageColor, setMessageColor] = useState("");
  const [salaries, setSalaries] = useState([]);

  const [viewAll, setViewAll] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // 🔍 search & filter states
  const [searchName, setSearchName] = useState("");
  const [filterMonth, setFilterMonth] = useState("");

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const fetchSalaries = async () => {
    try {
      const res = await axios.get(`${API_BASE}/salaries`, {
        headers: { Authorization: token },
      });
      setSalaries(res.data);
    } catch (err) {
      console.error("fetchSalaries error:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    if (viewAll) fetchSalaries();
    else setSalaries([]);
  }, [viewAll]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      if (editingId) {
        await axios.put(`${API_BASE}/salaries/${editingId}`, form, {
          headers: { Authorization: token },
        });
        setMessage("Salary updated successfully");
        setMessageColor("green");
      } else {
        const res = await axios.post(`${API_BASE}/salaries`, form, {
          headers: { Authorization: token },
        });
        setMessage(res.data.message || "Salary saved successfully");
        setMessageColor("green");
      }

      setForm({
        sname: "",
        smonthly: "",
        spaidMonth: "",
        spaidDays: "",
        spaidSalary: "",
      });
      setEditingId(null);
      if (viewAll) fetchSalaries();
    } catch (err) {
      setMessage("Error saving salary");
      setMessageColor("crimson");
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await axios.delete(`${API_BASE}/salaries/${id}`, {
        headers: { Authorization: token },
      });
      setMessage(res.data.message);
      setMessageColor("green");
      if (viewAll) fetchSalaries();
    } catch (err) {
      setMessage("Error deleting salary");
      setMessageColor("crimson");
    }
  };

  const handleEdit = (s) => {
    setForm({
      sname: s.sname,
      smonthly: s.smonthly,
      spaidMonth: s.spaidMonth,
      spaidDays: s.spaidDays,
      spaidSalary: s.spaidSalary,
    });
    setEditingId(s._id);
    setMessage("");
  };

  const cancelEdit = () => {
    setForm({
      sname: "",
      smonthly: "",
      spaidMonth: "",
      spaidDays: "",
      spaidSalary: "",
    });
    setEditingId(null);
    setMessage("");
  };

  // 🔍 Filtered salaries (client-side)
  const filteredSalaries = salaries.filter((s) => {
    const matchName = s.sname.toLowerCase().includes(searchName.toLowerCase());
    const matchMonth = filterMonth
      ? s.spaidMonth.toLowerCase() === filterMonth.toLowerCase()
      : true;
    return matchName && matchMonth;
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8f9fa",
        padding: "40px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1000px",
          background: "#fff",
          padding: "30px",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: 20 }}>
          Salary Management
        </h2>

        {role === "admin" && (
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
        )}

        {/* Salary Form */}
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
            <label>Staff Name</label>
            <input
              type="text"
              value={form.sname}
              onChange={(e) =>
                /^[a-zA-Z\s]*$/.test(e.target.value) &&
                setForm({ ...form, sname: e.target.value })
              }
              style={{ width: "100%", padding: 8, marginTop: 4 }}
              required
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Monthly Salary</label>
            <input
              type="number"
              value={form.smonthly}
              onChange={(e) => setForm({ ...form, smonthly: e.target.value })}
              style={{ width: "100%", padding: 8, marginTop: 4 }}
              required
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Paid For (Month)</label>
            <select
              value={form.spaidMonth}
              onChange={(e) => setForm({ ...form, spaidMonth: e.target.value })}
              style={{ width: "100%", padding: 8, marginTop: 4 }}
              required
            >
              <option value="">Select Month</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Paid For (Days)</label>
            <input
              type="number"
              value={form.spaidDays}
              onChange={(e) => setForm({ ...form, spaidDays: e.target.value })}
              style={{ width: "100%", padding: 8, marginTop: 4 }}
              required
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Paid Salary (৳)</label>
            <input
              type="number"
              value={form.spaidSalary}
              onChange={(e) =>
                setForm({ ...form, spaidSalary: e.target.value })
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
              {editingId ? "Update Salary" : "Submit"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                style={{
                  background: "gray",
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

        {/* Show List */}
        {viewAll && (
          <>
            <h3 style={{ marginBottom: 16 }}>Salary Records</h3>

            {/* 🔍 Search + Filter UI */}
            <div style={{ marginBottom: 20 }}>
              <input
                type="text"
                placeholder="Search by name..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                style={{ padding: 8, marginRight: 12 }}
              />
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                style={{ padding: 8 }}
              >
                <option value="">All Months</option>
                {months.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {filteredSalaries.length === 0 ? (
              <p>No matching salary records found.</p>
            ) : (
              filteredSalaries.map((s) => (
                <div
                  key={s._id}
                  style={{
                    background: "#fafafa",
                    border: "1px solid #ddd",
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 12,
                  }}
                >
                  <p>
                    <strong>Staff:</strong> {s.sname}
                  </p>
                  <p>
                    <strong>Monthly Salary:</strong> {s.smonthly} ৳
                  </p>
                  <p>
                    <strong>Paid For:</strong> {s.spaidMonth} ({s.spaidDays}{" "}
                    days)
                  </p>
                  <p>
                    <strong>Paid Salary:</strong> {s.spaidSalary} ৳
                  </p>
                  <div style={{ marginTop: 8 }}>
                    <button
                      onClick={() => handleEdit(s)}
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
                      onClick={() => handleDelete(s._id)}
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
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Salary;
