// backend/routes/dashboard.js
const express = require("express");
const router = express.Router();
const Room = require("../models/Room");
const Booking = require("../models/Booking");
const auth = require("../middleware/auth");

// 📊 GET dashboard overview (admin & manager)
router.get("/", auth(["admin", "manager"]), async (req, res) => {
  try {
    const totalRooms = await Room.countDocuments();
    const totalBookings = await Booking.countDocuments({ isDeleted: false });

    // rooms currently booked
    const today = new Date();
    const activeBookings = await Booking.find({
      startDate: { $lte: today },
      endDate: { $gte: today },
      isDeleted: false,
    });

    const bookedRoomIds = activeBookings.map((b) => b.rid);
    const bookedCount = bookedRoomIds.length;
    const availableCount = totalRooms - bookedCount;

    const recentBookings = await Booking.find({ isDeleted: false })
      .sort({ startDate: -1 })
      .limit(5)
      .lean();

    res.json({
      totalRooms,
      totalBookings,
      bookedCount,
      availableCount,
      recentBookings,
    });
  } catch (err) {
    console.error("Dashboard fetch error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

module.exports = router;
