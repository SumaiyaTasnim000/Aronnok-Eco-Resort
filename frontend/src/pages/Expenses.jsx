import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import PageWrapper from "../components/PageWrapper";
import Swal from "sweetalert2";

function Expenses({ role }) {
  const API_BASE = "http://localhost:5001/api";
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({ edate: "", ename: "", eamount: "" });
  const [message, setMessage] = useState("");
  const [messageColor, setMessageColor] = useState("");
  const [expenses, setExpenses] = useState([]);

  const [viewAll, setViewAll] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const viewRef = useRef(null);
  const formRef = useRef(null);
  // Fetch all expenses
  const fetchExpenses = async () => {
    try {
      const res = await axios.get(`${API_BASE}/expenses`, {
        headers: { Authorization: token },
      });
      // ✅ both admin and manager see all entries
      setExpenses(res.data.filter((e) => !e.eisDeleted));
    } catch (err) {
      console.error("fetchExpenses error:", err.response?.data || err.message);
    }
  };

  // Load data when viewAll toggled
  useEffect(() => {
    if (viewAll) fetchExpenses();
    else setExpenses([]);
  }, [viewAll]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    // ✅ Inline validation: amount must be positive and non-zero
    if (!form.eamount || Number(form.eamount) <= 0) {
      setMessage("Amount must be greater than 0");
      setMessageColor("crimson");
      return; // stop submission
    }

    try {
      if (editingId) {
        await axios.put(`${API_BASE}/expenses/${editingId}`, form, {
          headers: { Authorization: token },
        });
        setMessage("Expense updated successfully");
        setMessageColor("green");
      } else {
        const res = await axios.post(`${API_BASE}/expenses`, form, {
          headers: { Authorization: token },
        });
        setMessage(res.data.message || "Expense saved successfully");
        setMessageColor("green");
      }

      setForm({ edate: "", ename: "", eamount: "" });
      setEditingId(null);
      if (viewAll) fetchExpenses();
    } catch (err) {
      setMessage("Error saving expense");
      setMessageColor("crimson");
    }
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This expense will be marked as deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (confirm.isConfirmed) {
      try {
        const res = await axios.delete(`${API_BASE}/expenses/${id}`, {
          headers: { Authorization: token },
        });
        Swal.fire("Deleted!", res.data.message, "success");
        if (viewAll) fetchExpenses();
      } catch (err) {
        Swal.fire("Error!", "Could not delete expense.", "error");
      }
    }
  };
  const handleEdit = (expense) => {
    setForm({
      edate: expense.edate.split("T")[0],
      ename: expense.ename,
      eamount: expense.eamount,
    });
    setEditingId(expense._id);
    setMessage("");

    // Smooth scroll up; offset handled by CSS on the form
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const cancelEdit = () => {
    setForm({ edate: "", ename: "", eamount: "" });
    setEditingId(null);
    setMessage("");
  };

  // Filtered expenses
  const filteredExpenses = expenses.filter((e) => {
    const matchesName = e.ename
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const date = new Date(e.edate);
    const fromOK = filterFrom ? date >= new Date(filterFrom) : true;
    const toOK = filterTo ? date <= new Date(filterTo) : true;
    return matchesName && fromOK && toOK;
  });
  const exportToCSV = () => {
    if (filteredExpenses.length === 0) {
      Swal.fire("No data", "There are no expenses to export.", "info");
      return;
    }

    const rows = filteredExpenses.map((e, i) => ({
      "#": i + 1,
      Date: new Date(e.edate).toLocaleDateString(),
      "Name of Cost": e.ename,
      Amount: e.eamount,
    }));

    const headers = Object.keys(rows[0] || {}).join(",");
    const csv = [headers, ...rows.map((r) => Object.values(r).join(","))].join(
      "\n"
    );

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    // ✅ Automatically name file with today’s date
    const today = new Date().toISOString().split("T")[0]; // e.g. "2025-10-06"
    a.download = `Expense_records_${today}.csv`;

    a.click();
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
        Expense Management
      </h2>
      <div
        style={{
          width: "100%",
          maxWidth: "1000px",
          background: "#fff",
          padding: "30px",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          margin: "0 auto",
        }}
      >
        {/* ✅ View All / Hide All toggle for both admin and manager */}
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
              // Wait a moment for the section to render, then scroll
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
        {/* Expense Form */}
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          style={{
            background: "#fefefe",
            padding: 24,
            borderRadius: 8,
            border: "1px solid #ddd",
            marginBottom: 30,
            scrollMarginTop: "120px", // 👈 offset above the form
          }}
        >
          <div style={{ marginBottom: 12 }}>
            <label>Date</label>
            <input
              type="date"
              value={form.edate}
              onChange={(e) => setForm({ ...form, edate: e.target.value })}
              style={{ width: "100%", padding: 8, marginTop: 4 }}
              required
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Name of cost</label>
            <input
              type="text"
              value={form.ename}
              onChange={(e) => setForm({ ...form, ename: e.target.value })}
              style={{ width: "100%", padding: 8, marginTop: 4 }}
              required
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Amount</label>
          <input
  type="number"
  min="1"
  step="any"
  value={form.eamount}
  onChange={(e) => setForm({ ...form, eamount: e.target.value })}
  style={{ width: "100%", padding: 8, marginTop: 4 }}
  required
  onInvalid={(e) => e.target.setCustomValidity("Value cannot be 0 or negative (-)")}
  onInput={(e) => e.target.setCustomValidity("")}
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
              {editingId ? "Update Expense" : "Submit"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                style={{
                  background: "#d32f2f",

                  color: "#f1ececff",
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
        {/* List only shows when viewAll is true */}
        {viewAll && (
          <div ref={viewRef}>
            {/* ✅ Section Header */}
            <h3
              style={{
                textAlign: "center",
                marginBottom: 20,
                fontWeight: 700,
              }}
            >
              Your Recent Expenses
            </h3>

            {/* ✅ Filters Row */}
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
                placeholder="Search Name of cost..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ flex: 1, padding: 8 }}
              />

              <div style={{ display: "flex", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "0.9rem" }}>Expense From:</label>
                  <input
                    type="date"
                    value={filterFrom || ""}
                    onChange={(e) => setFilterFrom(e.target.value)}
                    style={{ padding: 8, marginLeft: 8 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.9rem" }}>Expense To:</label>
                  <input
                    type="date"
                    value={filterTo || ""}
                    onChange={(e) => setFilterTo(e.target.value)}
                    style={{ padding: 8, marginLeft: 8 }}
                  />
                </div>
              </div>
            </div>

            {/* ✅ Export CSV button aligned right, above the table */}
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

            {filteredExpenses.length === 0 ? (
              <p>No expenses found.</p>
            ) : (
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
                    <th style={{ border: "1px solid #ddd", padding: 8 }}>#</th>
                    <th style={{ border: "1px solid #ddd", padding: 8 }}>
                      Date
                    </th>
                    <th style={{ border: "1px solid #ddd", padding: 8 }}>
                      Name of Cost
                    </th>
                    <th style={{ border: "1px solid #ddd", padding: 8 }}>
                      Amount (৳)
                    </th>
                    {role === "admin" && (
                      <th style={{ border: "1px solid #ddd", padding: 8 }}>
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((e, i) => (
                    <tr key={e._id}>
                      <td style={{ border: "1px solid #ddd", padding: 8 }}>
                        {i + 1}
                      </td>
                      <td style={{ border: "1px solid #ddd", padding: 8 }}>
                        {new Date(e.edate).toLocaleDateString()}
                      </td>
                      <td style={{ border: "1px solid #ddd", padding: 8 }}>
                        {e.ename}
                      </td>
                      <td style={{ border: "1px solid #ddd", padding: 8 }}>
                        {e.eamount}
                      </td>
                      {role === "admin" && (
                        <td style={{ border: "1px solid #ddd", padding: 8 }}>
                          <button
                            onClick={() => handleEdit(e)}
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
                            onClick={() => handleDelete(e._id)}
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
            )}
          </div>
        )}{" "}
        {/* ✅ closes viewAll condition */}
      </div>{" "}
      {/* ✅ closes the main white container */}
    </PageWrapper>
  );
}

export default Expenses;
