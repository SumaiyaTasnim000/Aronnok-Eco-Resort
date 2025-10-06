const express = require("express");
const router = express.Router();
const Salary = require("../models/Salary");
const Staff = require("../models/Staff");
const auth = require("../middleware/auth");

// ✅ Create new salary (Admin only)
router.post("/", auth("admin"), async (req, res) => {
  try {
    const { staffId, spaidFrom, spaidUntil, spaidDays, spaidSalary } = req.body;

    // --- Validate required fields ---
    if (!staffId || !spaidFrom || !spaidUntil || !spaidSalary) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // --- Validate referenced staff ---
    const staff = await Staff.findById(staffId);
    if (!staff || staff.sisDeleted) {
      return res.status(404).json({ message: "Staff not found or deleted" });
    }

    // --- Create normalized salary entry ---
    const salary = new Salary({
      staff: staffId, // reference Staff _id
      spaidFrom,
      spaidUntil,
      spaidDays,
      spaidSalary,
    });

    await salary.save();

    res.json({
      message: "Salary saved successfully",
      salary: await salary.populate("staff", "sname stype smonthly"),
    });
  } catch (err) {
    console.error("Salary save error:", err);
    res.status(500).json({
      message: "Error saving salary",
      error: err.message,
    });
  }
});

// ✅ Get all salaries (Admin only)
router.get("/", auth("admin"), async (req, res) => {
  try {
    const salaries = await Salary.find({ sisDeleted: false })
      .populate("staff", "sname stype smonthly") // populate staff info
      .sort({ createdAt: -1 });
    res.json(salaries);
  } catch (err) {
    console.error("Fetch salaries error:", err);
    res.status(500).json({
      message: "Error fetching salaries",
      error: err.message,
    });
  }
});

// ✅ Update salary (Admin only)
router.put("/:id", auth("admin"), async (req, res) => {
  try {
    const { staffId, spaidFrom, spaidUntil, spaidSalary } = req.body;

    const salary = await Salary.findByIdAndUpdate(
      req.params.id,
      { staff: staffId, spaidFrom, spaidUntil, spaidSalary },
      { new: true }
    ).populate("staff", "sname stype smonthly");

    if (!salary)
      return res.status(404).json({ message: "Salary record not found" });

    res.json({ message: "Salary updated successfully", salary });
  } catch (err) {
    console.error("Update salary error:", err);
    res.status(500).json({
      message: "Error updating salary",
      error: err.message,
    });
  }
});

// ✅ Soft delete salary (Admin only)
router.delete("/:id", auth("admin"), async (req, res) => {
  try {
    const salary = await Salary.findByIdAndUpdate(
      req.params.id,
      { sisDeleted: true },
      { new: true }
    );

    if (!salary) return res.status(404).json({ message: "Salary not found" });

    res.json({ message: "Salary entry successfully deleted", salary });
  } catch (err) {
    console.error("Delete salary error:", err);
    res.status(500).json({
      message: "Error deleting salary",
      error: err.message,
    });
  }
});

module.exports = router;
