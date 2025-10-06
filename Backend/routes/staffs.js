// backend/routes/staffs.js
const express = require("express");
const router = express.Router();
const Staff = require("../models/Staff");
const auth = require("../middleware/auth");

// ✅ Create new staff (Admin only)
router.post("/", auth("admin"), async (req, res) => {
  try {
    console.log("📥 Incoming staff data:", req.body);

    let { sname, stype, smonthly } = req.body;

    if (!sname || !stype)
      return res.status(400).json({ message: "Name and Type are required" });

    // ✅ Default to 0 if not provided or invalid
    smonthly = Number(smonthly);
    if (isNaN(smonthly) || smonthly < 0) smonthly = 0;

    // ✅ Check for existing (case-insensitive)
    const existing = await Staff.findOne({
      sname: { $regex: new RegExp(`^${sname}$`, "i") },
      sisDeleted: false,
    });

    // ✅ If exists, return the same staff instead of throwing duplicate error
    if (existing) return res.json({ staff: existing });

    // ✅ Create new staff record
    const staff = new Staff({ sname, stype, smonthly });
    await staff.save();

    res.json({ message: "Staff added successfully", staff });
  } catch (err) {
    console.error("Add staff error:", err);
    res.status(500).json({ message: "Error adding staff", error: err.message });
  }
});

// ✅ Get all active staff
router.get("/", auth("admin"), async (req, res) => {
  try {
    const staffs = await Staff.find({ sisDeleted: false })
      .select("sname stype smonthly sisDeleted")
      .sort({ createdAt: -1 });
    res.json(staffs);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching staff", error: err.message });
  }
});

// ✅ Soft delete staff
router.delete("/:id", auth("admin"), async (req, res) => {
  try {
    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      { sisDeleted: true },
      { new: true }
    );
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    res.json({ message: "Staff deleted successfully", staff });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting staff", error: err.message });
  }
});

// ✅ Update staff
router.put("/:id", auth("admin"), async (req, res) => {
  try {
    const { sname, stype, smonthly } = req.body;

    // ✅ Allow missing or 0 salary safely
    let monthlyValue = Number(smonthly);
    if (isNaN(monthlyValue) || monthlyValue < 0) monthlyValue = 0;

    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      { sname, stype, smonthly: monthlyValue },
      { new: true }
    );

    if (!staff) return res.status(404).json({ message: "Staff not found" });

    res.json({ message: "Staff updated successfully", staff });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating staff", error: err.message });
  }
});

module.exports = router;
