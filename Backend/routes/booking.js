const express = require("express");
const Booking = require("../models/Booking");
const auth = require("../middleware/auth");

const router = express.Router();

// ✅ Create booking (Manager + Admin)
router.post("/", auth(["manager", "admin"]), async (req, res) => {
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

    // Basic validation
    if (!rid || !cname || !ccontact || !startDate || !endDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const booking = new Booking({
      rid: Number(rid),
      cname,
      ccontact,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      advance: Number(advance) || 0,
      advanceReceiver: advanceReceiver || "",
      due: Number(due) || 0,
      dueReceiver: dueReceiver || "",
      isDeleted: false,
    });

    await booking.save();

    res.status(201).json({ message: "Booking saved successfully ✅", booking });
  } catch (err) {
    console.error("❌ Booking save error:", err); // full error in terminal
    res.status(500).json({
      message: "Error saving booking",
      error: err.message,
      stack: err.stack, // expose for debugging
    });
  }
});

// ✅ Get all bookings
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

// ✅ Get booking by ID
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

// ✅ Get booking by Room ID (for "View Details")
router.get("/room/:rid", auth(["manager", "admin"]), async (req, res) => {
  try {
    const { rid } = req.params;
    const booking = await Booking.findOne({
      rid: Number(rid),
      isDeleted: false,
    });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.json(booking);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching booking details", error: err.message });
  }
});

// ✅ Update booking (Admin only)
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

// ✅ Soft delete booking (Admin only)
router.patch("/:id/delete", auth("admin"), async (req, res) => {
  try {
    const deleted = await Booking.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    if (!deleted) return res.status(404).json({ error: "Booking not found" });
    res.json({ message: "Booking soft deleted ✅", booking: deleted });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
