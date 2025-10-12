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
  // 🆕 Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 10;

  // Categories state
  const [categories, setCategories] = useState([]);

  // Filters
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
      setExpenses(res.data.filter((e) => !e.eisDeleted));
    } catch (err) {
      console.error("fetchExpenses error:", err.response?.data || err.message);
    }
  };
  // 🆕 Fetch all categories (add this right below)
  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_BASE}/expenseCategories`, {
        headers: { Authorization: token },
      });
      setCategories(res.data);
    } catch (err) {
      console.error(
        "fetchCategories error:",
        err.response?.data || err.message
      );
    }
  };

  useEffect(() => {
    if (viewAll) fetchExpenses();
    else setExpenses([]);
  }, [viewAll]);
  // 🆕 Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterFrom, filterTo, searchTerm]);

  // 🆕 Trigger fetchCategories once when page loads
  useEffect(() => {
    fetchCategories();
  }, []);
  useEffect(() => {
    if (viewAll) fetchExpenses();
    else setExpenses([]);
  }, [viewAll]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!form.eamount || Number(form.eamount) <= 0) {
      setMessage("Amount must be greater than 0");
      setMessageColor("crimson");
      return;
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

      setForm({ edate: "", ename: "", eamount: "", ecategoryId: "" });
      setEditingId(null);
      if (viewAll) fetchExpenses();
    } catch {
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
      confirmButtonColor: "#dc3545", // 🔴 Red
      cancelButtonColor: "#3085d6", // 🔵 Blue
      confirmButtonText: "Yes, delete it!",
    });

    if (confirm.isConfirmed) {
      try {
        const res = await axios.delete(`${API_BASE}/expenses/${id}`, {
          headers: { Authorization: token },
        });
        Swal.fire("Deleted!", res.data.message, "success");
        if (viewAll) fetchExpenses();
      } catch {
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

    // Smooth scroll to form
    requestAnimationFrame(() => {
      if (formRef.current) {
        const yOffset = -80;
        const y =
          formRef.current.getBoundingClientRect().top +
          window.pageYOffset +
          yOffset;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    });
  };

  const cancelEdit = () => {
    setForm({ edate: "", ename: "", eamount: "" });
    setEditingId(null);
    setMessage("");
  };

  const filteredExpenses = expenses.filter((e) => {
    const lowerSearch = searchTerm.toLowerCase();

    // ✅ Match either Name of Cost OR Category name
    const matches =
      e.ename.toLowerCase().includes(lowerSearch) ||
      e.ecategoryId?.expcatname?.toLowerCase().includes(lowerSearch);

    const date = new Date(e.edate);
    const fromOK = filterFrom ? date >= new Date(filterFrom) : true;
    const toOK = filterTo ? date <= new Date(filterTo) : true;

    return matches && fromOK && toOK;
  });
  // 🆕 Pagination calculations
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredExpenses.slice(
    indexOfFirstEntry,
    indexOfLastEntry
  );
  const totalPages = Math.ceil(filteredExpenses.length / entriesPerPage);

  const exportToCSV = () => {
    if (filteredExpenses.length === 0) {
      Swal.fire("No data", "There are no expenses to export.", "info");
      return;
    }

    const rows = filteredExpenses.map((e, i) => ({
      "#": i + 1,
      Date: new Date(e.edate).toLocaleDateString(),
      Category: e.ecategoryId?.expcatname || "—",
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

    const today = new Date().toISOString().split("T")[0];
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
        🧾 Expense Management
      </h2>
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
        {/* ✅ Toggle Button */}
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

        {/* ✅ Expense Form */}
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          style={{
            background: "#fefefe",
            padding: 24,
            borderRadius: 8,
            border: "1px solid #ddd",
            marginBottom: 30,
            scrollMarginTop: "120px",
          }}
        >
          <div style={{ marginBottom: 12 }}>
            <label>Date</label>
            <input
              type="date"
              value={form.edate}
              onChange={(e) => setForm({ ...form, edate: e.target.value })}
              style={{
                width: "100%",
                padding: 8,
                marginTop: 4,
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
              required
            />
          </div>
          {/* Category Dropdown */}
          <div style={{ marginBottom: 12 }}>
            <label>Expense Category</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <select
                value={form.ecategoryId || ""}
                onChange={(e) =>
                  setForm({ ...form, ecategoryId: e.target.value })
                }
                style={{
                  flex: 1,
                  padding: 8,
                  borderRadius: 4,
                  border: "1px solid #ccc",
                  marginTop: 4,
                }}
                required
              >
                <option value="">Select category</option>
                {categories
                  .filter((cat) => !cat.expcatisDeleted)
                  .map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.expcatname}
                    </option>
                  ))}
              </select>

              {/* Add new category */}
              <button
                type="button"
                onClick={async () => {
                  const { value: name } = await Swal.fire({
                    title: "Add New Category",
                    input: "text",
                    inputPlaceholder: "Enter category name",
                    showCancelButton: true,
                    confirmButtonText: "Add",
                  });
                  if (!name) return;

                  try {
                    await axios.post(
                      `${API_BASE}/expenseCategories`,
                      { expcatname: name },
                      { headers: { Authorization: token } }
                    );
                    Swal.fire(
                      "Added!",
                      "Category created successfully",
                      "success"
                    );
                    fetchCategories();
                  } catch (err) {
                    Swal.fire(
                      "Error",
                      err.response?.data?.message || "Failed to add",
                      "error"
                    );
                  }
                }}
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid #ddd",
                  background: "#00bcd4",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                + New
              </button>
            </div>

            {/* Admin-only delete/edit panel */}
            {role === "admin" && (
              <details style={{ marginTop: 10 }}>
                <summary
                  style={{
                    cursor: "pointer",
                    background: "#00bcd4", // ✅ cyan color
                    color: "#fff",
                    border: "none",
                    padding: "10px 16px",
                    borderRadius: 6,
                    fontWeight: "bold",
                    textAlign: "center",
                    display: "flex",
                    alignItems: "center", // ✅ vertically centers text
                    justifyContent: "center", // ✅ horizontally centers text
                  }}
                >
                  Manage Categories ▽
                </summary>

                <div style={{ padding: 8 }}>
                  {categories.map((cat) => (
                    <div
                      key={cat._id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderBottom: "1px solid #eee",
                        padding: "6px 0",
                      }}
                    >
                      <span>{cat.expcatname}</span>

                      <div>
                        {/* Edit */}
                        <button
                          onClick={async () => {
                            const { value: newName } = await Swal.fire({
                              title: "Edit Category",
                              input: "text",
                              inputValue: cat.expcatname,
                              showCancelButton: true,
                            });
                            if (!newName) return;
                            try {
                              await axios.put(
                                `${API_BASE}/expenseCategories/${cat._id}`,
                                { expcatname: newName },
                                { headers: { Authorization: token } }
                              );
                              Swal.fire(
                                "Updated!",
                                "Category name updated",
                                "success"
                              );
                              fetchCategories();
                            } catch (err) {
                              Swal.fire(
                                "Error",
                                err.response?.data?.message || "Failed",
                                "error"
                              );
                            }
                          }}
                          style={{
                            background: "#007bff",
                            color: "#fff",
                            border: "none",
                            borderRadius: 4,
                            padding: "4px 10px",
                            marginRight: 6,
                            cursor: "pointer",
                          }}
                        >
                          Edit
                        </button>

                        {/* Delete */}
                        <button
                          onClick={async () => {
                            const confirm = await Swal.fire({
                              title: `Delete "${cat.expcatname}"?`,
                              icon: "warning",
                              showCancelButton: true,
                              confirmButtonColor: "#d32f2f", // 🔴 consistent red tone
                              cancelButtonColor: "#3085d6",
                              confirmButtonText: "Yes, delete",
                            });
                            if (!confirm.isConfirmed) return;

                            try {
                              await axios.delete(
                                `${API_BASE}/expenseCategories/${cat._id}`,
                                { headers: { Authorization: token } }
                              );
                              Swal.fire(
                                "Deleted!",
                                "Category removed",
                                "success"
                              );
                              fetchCategories();
                            } catch (err) {
                              Swal.fire(
                                "Error",
                                err.response?.data?.message || "Failed",
                                "error"
                              );
                            }
                          }}
                          style={{
                            background: "#d32f2f", // 🔴 unified red
                            color: "#fff",
                            border: "none",
                            borderRadius: 4,
                            padding: "4px 10px",
                            cursor: "pointer",
                            transition: "background 0.3s",
                          }}
                          onMouseOver={(e) =>
                            (e.target.style.background = "#b71c1c")
                          }
                          onMouseOut={(e) =>
                            (e.target.style.background = "#d32f2f")
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>

          <div style={{ marginBottom: 12 }}>
            <label>Name of cost</label>
            <input
              type="text"
              value={form.ename}
              onChange={(e) => setForm({ ...form, ename: e.target.value })}
              style={{
                width: "100%",
                padding: 8,
                marginTop: 4,
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
              required
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Amount (৳)</label>
            <input
              type="number"
              min="1"
              step="any"
              value={form.eamount}
              onChange={(e) => setForm({ ...form, eamount: e.target.value })}
              style={{
                width: "100%",
                padding: 8,
                marginTop: 4,
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
              required
              onInvalid={(e) =>
                e.target.setCustomValidity("Value cannot be 0 or negative (-)")
              }
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
                  color: "#2b3f7aff",
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
        <hr
          style={{
            width: "90%",
            border: "none",
            borderTop: "2px solid #eee",
            margin: "15px auto 25px",
          }}
        />

        {/* ✅ Your Recent Expenses Section */}
        {viewAll && (
          <div
            ref={viewRef}
            style={{
              background: "#fafafa",
              border: "1px solid #ddd",
              borderRadius: "10px",
              padding: "25px 30px",
              textAlign: "left",
            }}
          >
            <h3
              style={{
                textAlign: "center",
                marginBottom: 20,
                fontWeight: 700,
              }}
            >
              Expense Records
            </h3>
            <hr
              style={{
                width: "100%",
                border: "none",
                borderTop: "2px solid #eee",
                margin: "25px 0",
              }}
            />

            {/* Filters */}
            <div
              style={{
                marginBottom: 10,
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
                alignItems: "flex-end",
              }}
            >
              {/* 🔍 Search input with icon */}
              <div
                style={{
                  position: "relative",
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: 10,
                    color: "#888",
                    fontSize: "1rem",
                    pointerEvents: "none",
                  }}
                >
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Search Name/ Category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 8px 8px 32px", // 👈 extra left padding for the icon
                    borderRadius: 4,
                    border: "1px solid #ccc",
                  }}
                />
              </div>

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
              <>
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
                        Category
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
                    {currentEntries.map((e, i) => (
                      <tr key={e._id}>
                        <td style={{ border: "1px solid #ddd", padding: 8 }}>
                          {(currentPage - 1) * entriesPerPage + (i + 1)}
                        </td>
                        <td style={{ border: "1px solid #ddd", padding: 8 }}>
                          {new Date(e.edate).toLocaleDateString()}
                        </td>
                        <td style={{ border: "1px solid #ddd", padding: 8 }}>
                          {e.ecategoryId?.expcatname || "—"}
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

                {/* 🆕 Pagination Controls */}
                {filteredExpenses.length > entriesPerPage && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      marginTop: 20,
                      gap: "10px",
                    }}
                  >
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      style={{
                        padding: "8px 16px",
                        background: currentPage === 1 ? "#ccc" : "#0d47a1",
                        color: "white",
                        border: "none",
                        borderRadius: 6,
                        cursor: currentPage === 1 ? "not-allowed" : "pointer",
                      }}
                    >
                      ← Previous
                    </button>

                    <span style={{ fontWeight: "bold" }}>
                      Page {currentPage} of {totalPages}
                    </span>

                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(p + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      style={{
                        padding: "8px 16px",
                        background:
                          currentPage === totalPages ? "#ccc" : "#0d47a1",
                        color: "white",
                        border: "none",
                        borderRadius: 6,
                        cursor:
                          currentPage === totalPages
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>{" "}
      {/* closes main white card container */}
    </PageWrapper>
  );
}

export default Expenses;
