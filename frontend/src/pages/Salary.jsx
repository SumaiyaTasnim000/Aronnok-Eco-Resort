import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import PageWrapper from "../components/PageWrapper";

function Salary({ role }) {
  const API_BASE = "http://localhost:5001/api";
  const token = localStorage.getItem("token");

  // ---------------- State ----------------
  const [form, setForm] = useState({
    sname: "",
    stype: "",
    spaidFrom: "",
    spaidUntil: "",
    smonthly: "",
    spaidDays: "",
    spaidSalary: "",
  });
  const [message, setMessage] = useState("");
  const [messageColor, setMessageColor] = useState("");
  const [salaries, setSalaries] = useState([]);
  const [staffs, setStaffs] = useState([]); // from DB (active only)

  const [viewAll, setViewAll] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Filters
  const [filterStaffName, setFilterStaffName] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterUntil, setFilterUntil] = useState("");

  // ---------------- Fetch helpers ----------------
  const axiosAuth = useMemo(() => {
    const authHeader = token?.startsWith("Bearer ") ? token : `Bearer ${token}`;
    return { headers: { Authorization: authHeader } };
  }, [token]);

  const fetchSalaries = async () => {
    try {
      const res = await axios.get(`${API_BASE}/salaries`, axiosAuth);
      setSalaries(res.data);
    } catch (err) {
      console.error("fetchSalaries error:", err.response?.data || err.message);
    }
  };

  const fetchStaffs = async () => {
    try {
      const res = await axios.get(`${API_BASE}/staffs`, axiosAuth);
      setStaffs(res.data);
    } catch (err) {
      console.error("fetchStaffs error:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    if (viewAll) {
      // Reset filters before showing all
      setFilterStaffName("");
      setFilterFrom("");
      setFilterUntil("");
      fetchSalaries();
    } else {
      // Clear all data when hiding
      setSalaries([]);
    }
  }, [viewAll]);

  useEffect(() => {
    // Load active staffs immediately (admin-only route; this page is admin)
    fetchStaffs();
  }, []);
  // ✅ Auto-calculate Paid For (Days) when both dates are selected
  useEffect(() => {
    if (form.spaidFrom && form.spaidUntil) {
      const from = new Date(form.spaidFrom);
      const until = new Date(form.spaidUntil);
      const diff = Math.floor((until - from) / (1000 * 60 * 60 * 24)) + 1; // inclusive count
      if (diff > 0) {
        setForm((prev) => ({ ...prev, spaidDays: diff }));
      } else {
        setForm((prev) => ({ ...prev, spaidDays: 0 }));
      }
    }
  }, [form.spaidFrom, form.spaidUntil]);

  // ---------------- Derived lists ----------------
  const uniqueStaffNames = useMemo(
    () => [...new Set(staffs.map((s) => s.sname))],
    [staffs]
  );

  const uniqueStaffTypes = useMemo(
    () => [...new Set(staffs.map((s) => s.stype))],
    [staffs]
  );

  // When sname changes, default stype to that staff's type (first match)
  // When sname changes, auto-fill type & previous monthly salary
  // ✅ Auto-fill staff type & monthly salary when selecting a staff name
  useEffect(() => {
    if (form.sname && staffs.length > 0) {
      const match = staffs.find((s) => s._id === form.staffId);
      if (match) {
        setForm((prev) => ({
          ...prev,
          stype: match.stype || prev.stype,
          smonthly: match.smonthly || prev.smonthly || "",
        }));
      }
    }
  }, [form.sname, staffs]);

  // ---------------- Handlers: Staff Add/Delete ----------------
  // ✅ Add staff locally only (not saved to DB yet)
  const handleAddStaffPrompt = async (prefillType = "") => {
    const { value: result } = await Swal.fire({
      title: "Add New Staff",
      html: `
      <input id="swal-sname" class="swal2-input" placeholder="Staff Name (letters and spaces only)" />
      <input id="swal-stype" class="swal2-input" placeholder="Staff Type (e.g., Manager, Chef)" value="${prefillType}" />
    `,
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => {
        const sname = document.getElementById("swal-sname").value.trim();
        const stype = document.getElementById("swal-stype").value.trim();
        if (!/^[a-zA-Z\\s]+$/.test(sname)) {
          Swal.showValidationMessage(
            "Staff Name must contain letters/spaces only"
          );
          return false;
        }
        if (!stype) {
          Swal.showValidationMessage("Staff Type is required");
          return false;
        }
        return { sname, stype };
      },
    });

    if (!result) return;

    // ✅ Add locally
    const exists = staffs.find(
      (s) => s.sname.toLowerCase() === result.sname.toLowerCase()
    );
    if (!exists) {
      setStaffs((prev) => [
        ...prev,
        {
          sname: result.sname,
          stype: result.stype,
          smonthly: null,
          temp: true,
        },
      ]);
    }

    setForm((f) => ({ ...f, sname: result.sname, stype: result.stype }));
    Swal.fire("New Staff Added!");
  };

  const handleDeleteStaff = async (staff) => {
    const confirm = await Swal.fire({
      title: `Delete "${staff.sname}"?`,
      text: "You can’t use this staff name again unless re-added.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete",
    });

    if (!confirm.isConfirmed) return;

    try {
      await axios.delete(`${API_BASE}/staffs/${staff._id}`, axiosAuth);
      setStaffs((prev) => prev.filter((s) => s._id !== staff._id));
      Swal.fire("Deleted!", "Staff has been deleted.", "success");
      // Clear form if currently selected name got deleted
      if (form.sname === staff.sname) {
        setForm((f) => ({ ...f, sname: "", stype: "" }));
      }
    } catch (err) {
      Swal.fire(
        "Error",
        err.response?.data?.message || "Failed to delete staff",
        "error"
      );
    }
  };

  // ---------------- Handlers: Salary CRUD ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    // ✅ Numeric field validation
    if (
      !form.smonthly ||
      Number(form.smonthly) <= 0 ||
      !form.spaidSalary ||
      Number(form.spaidSalary) <= 0
    ) {
      setMessage(
        "Error: Monthly Salary and Paid Salary must be positive numbers."
      );
      setMessageColor("crimson");
      return;
    }

    // ✅ Ensure staff exists in DB before saving salary
    let staffRecord = staffs.find((s) => s.sname === form.sname);
    if (!staffRecord || staffRecord.temp) {
      // 🔹 Prevent creating staff with invalid salary
      if (!form.smonthly || Number(form.smonthly) <= 0) {
        setMessage("Please enter a valid Monthly Salary before saving.");
        setMessageColor("crimson");
        return;
      }

      let retryCount = 0;
      while (retryCount < 3) {
        try {
          console.log("📤 Sending to /staffs:", {
            sname: form.sname,
            stype: form.stype,
            smonthly: form.smonthly,
          });

          const resStaff = await axios.post(
            `${API_BASE}/staffs`,
            {
              sname: form.sname,
              stype: form.stype,
              smonthly: form.smonthly,
            },
            axiosAuth
          );

          staffRecord = resStaff.data.staff;
          setStaffs((prev) => [resStaff.data.staff, ...prev]);
          break; // ✅ success → exit retry loop
        } catch (err) {
          console.error(
            "Staff save failed:",
            err.response?.data || err.message
          );
          retryCount++;
          if (retryCount >= 3) {
            setMessage(
              `Failed to save staff before salary: ${
                err.response?.data?.message || "Unknown error"
              }`
            );
            setMessageColor("crimson");
            return;
          }
          await new Promise((r) => setTimeout(r, 1000)); // wait 1s then retry
        }
      }
    }

    // Basic date validation
    if (form.spaidFrom && form.spaidUntil) {
      const from = new Date(form.spaidFrom);
      const until = new Date(form.spaidUntil);
      if (until < from) {
        setMessage("Paid Until date cannot be earlier than Paid From");
        setMessageColor("crimson");
        return;
      }
    }

    try {
      if (editingId) {
        await axios.put(`${API_BASE}/salaries/${editingId}`, form, axiosAuth);
        setMessage("Salary updated successfully");
        setMessageColor("green");
      } else {
        // ✅ Calculate spaidDays in frontend before sending
        let diffDays = 0;
        if (form.spaidFrom && form.spaidUntil) {
          const from = new Date(form.spaidFrom);
          const until = new Date(form.spaidUntil);
          diffDays = Math.floor((until - from) / (1000 * 60 * 60 * 24)) + 1; // inclusive
        }

        const res = await axios.post(
          `${API_BASE}/salaries`,
          {
            staffId: staffRecord?._id, // ✅ reference to staff
            spaidFrom: form.spaidFrom,
            spaidUntil: form.spaidUntil,
            spaidDays: diffDays, // ✅ now included
            spaidSalary: form.spaidSalary,
          },
          axiosAuth
        );

        setMessage(res.data.message || "Salary saved successfully");
        setMessageColor("green");
        setTimeout(() => window.location.reload(), 800);
      }

      setForm({
        sname: "",
        stype: "",
        spaidFrom: "",
        spaidUntil: "",
        smonthly: "",
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
    const result = await Swal.fire({
      title: "Are you sure you want to delete?",
      //text: "This salary record will be soft-deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });
    if (!result.isConfirmed) return;

    try {
      const res = await axios.delete(`${API_BASE}/salaries/${id}`, axiosAuth);
      setMessage(res.data.message);
      setMessageColor("green");
      if (viewAll) fetchSalaries();
      Swal.fire("Deleted!", "The record has been deleted.", "success");
    } catch (err) {
      setMessage("Error deleting salary");
      setMessageColor("crimson");
      Swal.fire("Error!", "Failed to delete record.", "error");
    }
  };

  const handleEdit = (s) => {
    setForm({
      sname: s.staff?.sname || "",
      stype: s.staff?.stype || "",
      spaidFrom: s.spaidFrom?.split("T")[0] || "",
      spaidUntil: s.spaidUntil?.split("T")[0] || "",
      smonthly: s.staff?.smonthly || "",
      spaidDays: s.spaidDays,
      spaidSalary: s.spaidSalary,
    });
    setEditingId(s._id);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setForm({
      sname: "",
      stype: "",
      spaidFrom: "",
      spaidUntil: "",
      smonthly: "",
      spaidDays: "",
      spaidSalary: "",
    });
    setEditingId(null);
    setMessage("");
  };

  // ---------------- Filtered table ----------------
  const filteredSalaries = useMemo(() => {
    let data = salaries;
    if (filterStaffName) {
      data = data.filter((s) => s.staff?.sname === filterStaffName);
    }
    if (filterFrom) {
      const from = new Date(filterFrom);
      data = data.filter((s) => new Date(s.spaidFrom) >= from);
    }
    if (filterUntil) {
      const until = new Date(filterUntil);
      data = data.filter((s) => new Date(s.spaidUntil) <= until);
    }
    return data;
  }, [salaries, filterStaffName, filterFrom, filterUntil]);

  // ---------------- UI ----------------
  if (role !== "admin") {
    return (
      <div style={{ padding: 24, color: "crimson" }}>
        You do not have access to this page.
      </div>
    );
  }

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
        Salary Management
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
        {/* View toggle */}
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
          {/* Staff Name + Add */}
          <div
            style={{
              marginBottom: 12,
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <div style={{ flex: 1 }}>
              <label>Staff Name</label>
              <select
                value={form.sname}
                onChange={(e) => setForm({ ...form, sname: e.target.value })}
                style={{ width: "100%", padding: 8, marginTop: 4 }}
                required
              >
                <option value="">Select staff</option>
                {uniqueStaffNames.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            {/* Add staff button */}
            <button
              type="button"
              onClick={() => handleAddStaffPrompt("")}
              title="Add Staff"
              style={{
                marginTop: 22,
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #ddd",
                cursor: "pointer",
                background: "#00bcd4",
                color: "#fff",
              }}
            >
              + Add
            </button>
          </div>

          {/* Staff Type + Add (adds a new staff with selected type) */}
          <div
            style={{
              marginBottom: 12,
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <div style={{ flex: 1 }}>
              <label>Staff Type</label>
              <select
                value={form.stype}
                onChange={(e) => setForm({ ...form, stype: e.target.value })}
                style={{ width: "100%", padding: 8, marginTop: 4 }}
                required
              >
                <option value="">Select type</option>
                {uniqueStaffTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Add Type via new Staff entry */}
            <button
              type="button"
              onClick={() => handleAddStaffPrompt(form.stype || "")}
              title="Add a new type (creates a staff with that type)"
              style={{
                marginTop: 22,
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #ddd",
                cursor: "pointer",
                background: "#00bcd4",
                color: "#fff",
              }}
            >
              + Add
            </button>
          </div>

          {/* Manage Staff (list + delete) */}
          <div style={{ marginBottom: 12 }}>
            <details>
              <summary
                style={{
                  cursor: "pointer",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  padding: "8px 10px",
                  background: "#bd6868ff",
                  fontWeight: "bold",
                }}
              >
                Delete Staffs
              </summary>
              <div style={{ paddingTop: 10 }}>
                {staffs.length === 0 ? (
                  <p style={{ color: "#666" }}>No staff yet.</p>
                ) : (
                  <div style={{ display: "grid", gap: 6 }}>
                    {staffs.map((st) => (
                      <div
                        key={st._id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          border: "1px solid #eee",
                          borderRadius: 6,
                          padding: "6px 10px",
                        }}
                      >
                        <div>
                          <strong>{st.sname}</strong>{" "}
                          <span style={{ color: "#666" }}>({st.stype})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteStaff(st)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 4,
                            border: "none",
                            background: "#ffeaea",
                            color: "#d33",
                            cursor: "pointer",
                          }}
                          title="Soft delete"
                        >
                          − Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </details>
          </div>

          {/* Dates */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <label>Paid From</label>
              <input
                type="date"
                value={form.spaidFrom}
                onChange={(e) =>
                  setForm({ ...form, spaidFrom: e.target.value })
                }
                style={{ width: "100%", padding: 8, marginTop: 4 }}
                required
              />
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <label>Paid Until</label>
              <input
                type="date"
                value={form.spaidUntil}
                onChange={(e) =>
                  setForm({ ...form, spaidUntil: e.target.value })
                }
                style={{ width: "100%", padding: 8, marginTop: 4 }}
                required
              />
            </div>
          </div>

          {/* Numbers */}
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              marginTop: 12,
            }}
          >
            <div style={{ flex: 1, minWidth: 220 }}>
              <label>Monthly Salary (৳)</label>
              {/* Monthly Salary */}
              <input
                type="number"
                min="1"
                value={form.smonthly}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm({ ...form, smonthly: e.target.value });
                }}
                style={{ width: "100%", padding: 8, marginTop: 4 }}
                required
              />
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <label>Paid For (Days)</label>
              {/* Paid For (Days) */}
              <input
                type="number"
                value={form.spaidDays}
                readOnly
                style={{
                  width: "100%",
                  padding: 8,
                  marginTop: 4,
                  background: "#f5f5f5",
                  cursor: "not-allowed",
                  color: "#000",
                }}
              />
              <small style={{ color: "#666" }}>
                Auto-calculated from Paid From - Paid Until
              </small>
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <label>Paid Salary (৳)</label>
              {/* Paid Salary */}
              <input
                type="number"
                min="1"
                value={form.spaidSalary}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm({ ...form, spaidSalary: e.target.value });
                }}
                style={{ width: "100%", padding: 8, marginTop: 4 }}
                required
              />
            </div>
          </div>

          {/* Actions */}
          <div style={{ textAlign: "center", marginTop: 16 }}>
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

        {/* View: Filters + Table */}
        {viewAll && (
          <>
            <h3 style={{ marginBottom: 16 }}>Salary Records</h3>

            {/* Filters */}
            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 14,
              }}
            >
              <div>
                <label>Filter by Staff</label>
                <select
                  value={filterStaffName}
                  onChange={(e) => setFilterStaffName(e.target.value)}
                  style={{ padding: 8, marginLeft: 8 }}
                >
                  <option value="">All Staff</option>
                  {uniqueStaffNames.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>From</label>
                <input
                  type="date"
                  value={filterFrom}
                  onChange={(e) => setFilterFrom(e.target.value)}
                  style={{ padding: 8, marginLeft: 8 }}
                />
              </div>
              <div>
                <label>Until</label>
                <input
                  type="date"
                  value={filterUntil}
                  onChange={(e) => setFilterUntil(e.target.value)}
                  style={{ padding: 8, marginLeft: 8 }}
                />
              </div>
            </div>
            {/* Export CSV Button */}
            <div style={{ textAlign: "right", marginBottom: 10 }}>
              <button
                onClick={() => {
                  if (filteredSalaries.length === 0) {
                    Swal.fire("No data to export", "", "warning");
                    return;
                  }
                  const rows = filteredSalaries.map(
                    ({
                      staff,
                      spaidFrom,
                      spaidUntil,
                      spaidDays,
                      spaidSalary,
                    }) => ({
                      Staff: staff?.sname || "",
                      Type: staff?.stype || "",
                      "Paid From": new Date(spaidFrom).toLocaleDateString(),
                      "Paid Until": new Date(spaidUntil).toLocaleDateString(),
                      "Monthly Salary": staff?.smonthly || "",
                      "Paid Days": spaidDays,
                      "Paid Salary": spaidSalary,
                    })
                  );

                  const csv =
                    "data:text/csv;charset=utf-8," +
                    [
                      Object.keys(rows[0]).join(","),
                      ...rows.map((r) => Object.values(r).join(",")),
                    ].join("\n");

                  const link = document.createElement("a");
                  link.setAttribute("href", encodeURI(csv));
                  link.setAttribute(
                    "download",
                    `salary_records_${
                      new Date().toISOString().split("T")[0]
                    }.csv`
                  );
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                style={{
                  background: "#007bff",
                  color: "#fff",
                  padding: "8px 14px",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Export CSV
              </button>
            </div>

            {/* Table View */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f0f3f5" }}>
                    <th style={th}>#</th>
                    <th style={th}>Staff</th>
                    <th style={th}>Type</th>
                    <th style={th}>Paid From</th>
                    <th style={th}>Paid Until</th>
                    <th style={th}>Monthly (৳)</th>
                    <th style={th}>Days</th>
                    <th style={th}>Paid (৳)</th>
                    <th style={th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSalaries.length === 0 ? (
                    <tr>
                      <td
                        colSpan="9"
                        style={{
                          padding: 16,
                          textAlign: "center",
                          color: "crimson",
                          fontWeight: "bold",
                        }}
                      >
                        No matching salary records found.
                      </td>
                    </tr>
                  ) : (
                    filteredSalaries.map((s, idx) => (
                      <tr
                        key={s._id}
                        style={{ borderBottom: "1px solid #eee" }}
                      >
                        <td style={td}>{idx + 1}</td>
                        <td style={td}>{s.staff?.sname || "—"}</td>
                        <td style={td}>{s.staff?.stype || "—"}</td>
                        <td style={td}>
                          {new Date(s.spaidFrom).toLocaleDateString()}
                        </td>
                        <td style={td}>
                          {new Date(s.spaidUntil).toLocaleDateString()}
                        </td>
                        <td style={td}>{s.staff?.smonthly || "—"}</td>
                        <td style={td}>{s.spaidDays}</td>
                        <td style={td}>{s.spaidSalary}</td>
                        <td style={{ ...td, whiteSpace: "nowrap" }}>
                          <button
                            onClick={() => handleEdit(s)}
                            style={{
                              background: "#007bff",
                              color: "#fff",
                              padding: "6px 10px",
                              marginRight: 6,
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
                              padding: "6px 10px",
                              border: "none",
                              borderRadius: 4,
                              cursor: "pointer",
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </PageWrapper>
  );
}

const th = {
  textAlign: "left",
  padding: "10px 8px",
  borderBottom: "1px solid #ddd",
};
const td = { padding: "10px 8px" };

export default Salary;
