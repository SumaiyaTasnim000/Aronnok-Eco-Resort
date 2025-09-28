const express = require("express");
const router = express.Router();
const Salary = require("../models/Salary");
const auth = require("../middleware/auth");

// Create salary (Admin only)
router.post("/", auth("admin"), async (req, res) => {
  try {
    const { sname, smonthly, spaidMonth, spaidDays, spaidSalary } = req.body;

    if (!sname || !smonthly || !spaidMonth || !spaidDays || !spaidSalary) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const salary = new Salary({
      sname,
      smonthly,
      spaidMonth,
      spaidDays,
      spaidSalary,
    });

    await salary.save();
    res.json({ message: "Salary saved successfully", salary });
  } catch (err) {
    console.error("Salary save error:", err);
    res
      .status(500)
      .json({ message: "Error saving salary", error: err.message });
  }
});

// Get all salaries (Admin only)
router.get("/", auth("admin"), async (req, res) => {
  try {
    const salaries = await Salary.find({ sisDeleted: false }).sort({
      createdAt: -1,
    });
    res.json(salaries);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching salaries", error: err.message });
  }
});

// Update salary (Admin only)
router.put("/:id", auth("admin"), async (req, res) => {
  try {
    const salary = await Salary.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(salary);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating salary", error: err.message });
  }
});

// Soft delete salary (Admin only)
router.delete("/:id", auth("admin"), async (req, res) => {
  try {
    const salary = await Salary.findByIdAndUpdate(
      req.params.id,
      { sisDeleted: true },
      { new: true }
    );
    res.json({ message: "Salary entry successfully deleted", salary });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting salary", error: err.message });
  }
});

module.exports = router;
