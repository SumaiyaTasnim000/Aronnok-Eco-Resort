import React, { useState, useEffect } from "react";
import axios from "axios";
import PageWrapper from "../components/PageWrapper";

function Expenses({ role }) {
  const API_BASE = "http://localhost:5001/api";
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({ edate: "", ename: "", eamount: "" });
  const [message, setMessage] = useState("");
  const [messageColor, setMessageColor] = useState("");
  const [expenses, setExpenses] = useState([]);

  const [viewAll, setViewAll] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMonth, setFilterMonth] = useState("");

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
    try {
      const res = await axios.delete(`${API_BASE}/expenses/${id}`, {
        headers: { Authorization: token },
      });
      setMessage(res.data.message);
      setMessageColor("green");
      if (viewAll) fetchExpenses();
    } catch (err) {
      setMessage("Error deleting expense");
      setMessageColor("crimson");
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
    const matchesMonth = filterMonth
      ? new Date(e.edate).getMonth() + 1 === parseInt(filterMonth)
      : true;
    return matchesName && matchesMonth;
  });

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
        Expenses Management
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
            onClick={() => setViewAll(!viewAll)}
          >
            {viewAll ? "Hide All" : "View All"}
          </button>
        </div>

        {/* Expense Form */}
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
              value={form.eamount}
              onChange={(e) => setForm({ ...form, eamount: e.target.value })}
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
          <>
            {/* Filters */}
            <div
              style={{
                marginBottom: 20,
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <input
                type="text"
                placeholder="Search Name of cost..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ flex: 1, padding: 8 }}
              />
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                style={{ flex: 1, padding: 8 }}
              >
                <option value="">All Months</option>
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString("default", {
                      month: "long",
                    })}
                  </option>
                ))}
              </select>
            </div>

            <h3 style={{ marginBottom: 16 }}>Your Recent Expenses</h3>
            {filteredExpenses.length === 0 ? (
              <p>No expenses found.</p>
            ) : (
              filteredExpenses.map((e) => (
                <div
                  key={e._id}
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
                    {new Date(e.edate).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Name of cost:</strong> {e.ename}
                  </p>
                  <p>
                    <strong>Amount:</strong> {e.eamount} ৳
                  </p>
                  <div style={{ marginTop: 8 }}>
                    {/* Only admin sees Edit/Delete */}
                    {role === "admin" && (
                      <>
                        <button
                          onClick={() => handleEdit(e)}
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

export default Expenses;
