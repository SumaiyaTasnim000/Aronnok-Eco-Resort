const express = require("express");
const router = express.Router();
const Restaurant = require("../models/Restaurant");
const auth = require("../middleware/auth");

// Create restaurant entry (Manager + Admin)
router.post("/", auth(["manager", "admin"]), async (req, res) => {
  try {
    const { res_date, res_amountSpent, res_amountEarned } = req.body;
    if (!res_date || !res_amountSpent || !res_amountEarned) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const restaurant = new Restaurant({
      res_date,
      res_amountSpent,
      res_amountEarned,
      res_createdByUid: req.user?.uid || null,
    });

    await restaurant.save();
    res.json({ message: "Restaurant entry saved successfully", restaurant });
  } catch (err) {
    console.error("Restaurant save error:", err);
    res
      .status(500)
      .json({ message: "Error saving restaurant entry", error: err.message });
  }
});

// Get entries (Manager sees only their entries, Admin sees all)
router.get("/", auth(["manager", "admin"]), async (req, res) => {
  try {
    const query =
      req.user.urole === "manager"
        ? { res_createdByUid: req.user.uid, res_isDeleted: false }
        : { res_isDeleted: false };
    const restaurants = await Restaurant.find(query).sort({ res_date: -1 });
    res.json(restaurants);
  } catch (err) {
    res
      .status(500)
      .json({
        message: "Error fetching restaurant entries",
        error: err.message,
      });
  }
});

// Update (Admin only)
router.put("/:id", auth("admin"), async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(restaurant);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating restaurant entry", error: err.message });
  }
});

// Soft delete (Admin only)
router.delete("/:id", auth("admin"), async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { res_isDeleted: true },
      { new: true }
    );
    res.json({ message: "Restaurant entry successfully deleted", restaurant });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting restaurant entry", error: err.message });
  }
});

module.exports = router;
