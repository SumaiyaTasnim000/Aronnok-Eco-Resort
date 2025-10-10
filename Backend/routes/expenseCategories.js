// routes/expenseCategories.js
const express = require("express");
const router = express.Router();
const ExpenseCategory = require("../models/ExpenseCategory");
const auth = require("../middleware/auth");

// ✅ Create new category (Manager + Admin)
router.post("/", auth(["manager", "admin"]), async (req, res) => {
  try {
    const { expcatname } = req.body;
    if (!expcatname)
      return res.status(400).json({ message: "Category name required" });

    const existing = await ExpenseCategory.findOne({
      expcatname: { $regex: new RegExp("^" + expcatname + "$", "i") },
      expcatisDeleted: false,
    });
    if (existing)
      return res.status(400).json({ message: "Category already exists" });

    const category = new ExpenseCategory({
      expcatname,
      expcatcreatedByUid: req.user?.uid || null,
    });

    await category.save();
    res.json({ message: "Category created successfully", category });
  } catch (err) {
    console.error("Category create error:", err);
    res
      .status(500)
      .json({ message: "Error creating category", error: err.message });
  }
});

// ✅ Get all active categories (Manager + Admin)
router.get("/", auth(["manager", "admin"]), async (req, res) => {
  try {
    const categories = await ExpenseCategory.find({
      expcatisDeleted: false,
    }).sort({ expcatid: 1 });
    res.json(categories);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching categories", error: err.message });
  }
});

// ✅ Update category (Admin only)
router.put("/:id", auth("admin"), async (req, res) => {
  try {
    const { expcatname } = req.body;
    const updated = await ExpenseCategory.findByIdAndUpdate(
      req.params.id,
      { expcatname },
      { new: true }
    );
    res.json({ message: "Category updated successfully", category: updated });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating category", error: err.message });
  }
});

// ✅ Soft delete category (Admin only)
router.delete("/:id", auth("admin"), async (req, res) => {
  try {
    const updated = await ExpenseCategory.findByIdAndUpdate(
      req.params.id,
      { expcatisDeleted: true },
      { new: true }
    );
    res.json({ message: "Category deleted successfully", category: updated });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting category", error: err.message });
  }
});

module.exports = router;
