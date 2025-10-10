// backend/routes/booking.js
const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const auth = require("../middleware/auth");
const Room = require("../models/Room");

// 📌 Create booking (Customer + Manager + Admin)
router.post("/", auth(["customer", "manager", "admin"]), async (req, res) => {
  try {
    const {
      rid,
      cname,
      ccontact,
      startDate,
      endDate,
      advance,
      advanceReceiver,
      due,
      dueReceiver,
    } = req.body;

    if (!rid || !cname || !ccontact || !startDate || !endDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const booking = new Booking({
      rid,
      cname,
      ccontact,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      advance: advance || 0,
      advanceReceiver: advanceReceiver || "",
      due: due || 0,
      dueReceiver: dueReceiver || "",
      bcreatedByUid: req.user?.uid || "system",
    });

    await booking.save();
    res.status(201).json({ message: "Booking saved successfully ✅", booking });
  } catch (err) {
    console.error("❌ Booking save error:", err);
    res
      .status(500)
      .json({ message: "Error saving booking", error: err.message });
  }
});

// 📌 Get all bookings (Manager + Admin)
router.get("/", auth(["manager", "admin"]), async (req, res) => {
  try {
    const bookings = await Booking.find({ isDeleted: false }).sort({
      startDate: -1,
    });
    res.json(bookings);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching bookings", error: err.message });
  }
});

// 📌 Get booking by ID (Manager + Admin)
router.get("/:id", auth(["manager", "admin"]), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking || booking.isDeleted) {
      return res.status(404).json({ error: "Booking not found" });
    }
    res.json(booking);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching booking", error: err.message });
  }
});

// 📌 Update booking (Admin only)
router.put("/:id", auth("admin"), async (req, res) => {
  try {
    const updated = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) return res.status(404).json({ error: "Booking not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 📌 Soft delete booking (Admin only)
// 📌 Soft delete booking (Admin only)
router.patch("/:id/delete", auth("admin"), async (req, res) => {
  try {
    // Mark the booking as deleted
    const deleted = await Booking.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );

    if (!deleted) return res.status(404).json({ error: "Booking not found" });

    // 🟢 Recalculate if that room still has any active bookings
    const activeBookings = await Booking.countDocuments({
      rid: deleted.rid,
      isDeleted: false,
    });

    // 🟢 Update the corresponding Room's isBooked flag
    await Room.findOneAndUpdate(
      { rid: deleted.rid },
      { $set: { isBooked: activeBookings > 0 } }
    );

    res.json({
      message: "Booking soft deleted ✅",
      booking: deleted,
      updatedRoom: deleted.rid,
    });
  } catch (err) {
    console.error("❌ Error deleting booking:", err.message);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
