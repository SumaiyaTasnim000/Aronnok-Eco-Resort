// backend/routes/expenses.js
const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense");
const auth = require("../middleware/auth");

/// Create expense (Manager + Admin)
router.post("/", auth(["manager", "admin"]), async (req, res) => {
  try {
    console.log("Incoming expense body:", req.body);
    console.log("Decoded user:", req.user);

    const { edate, ename, eamount, ecategoryId } = req.body;

    if (!edate || !ename || !eamount || !ecategoryId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const expense = new Expense({
      eid: Date.now(),
      edate,
      ename,
      eamount,
      ecategoryId, // ✅ include reference
      ecreatedByUid: req.user?.uid || null,
      eisDeleted: false,
    });

    await expense.save();
    res.json({ message: "Expense saved successfully", expense });
  } catch (err) {
    console.error("Expense save error:", err);
    res
      .status(500)
      .json({ message: "Error saving expense", error: err.message });
  }
});

// Get my expenses (Manager) or all (Admin)
router.get("/", auth(["manager", "admin"]), async (req, res) => {
  try {
    const expenses = await Expense.find({ eisDeleted: false })
      .populate("ecategoryId", "expcatname") // ✅ pull category name
      .sort({ edate: -1 });
    res.json(expenses);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching expenses", error: err.message });
  }
});

// Update expense (Admin only)
router.put("/:id", auth("admin"), async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(expense);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating expense", error: err.message });
  }
});

// Soft delete expense (Admin only)
router.delete("/:id", auth("admin"), async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      { eisDeleted: true },
      { new: true }
    );
    res.json({ message: "Expense entry successfully deleted", expense });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting expense", error: err.message });
  }
});

module.exports = router;
