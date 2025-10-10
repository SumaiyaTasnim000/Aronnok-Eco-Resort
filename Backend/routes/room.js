// backend/routes/room.js
const express = require("express");
const router = express.Router();
const Room = require("../models/Room");
const Booking = require("../models/Booking");
const auth = require("../middleware/auth");

router.get("/", async (req, res) => {
  try {
    const rooms = await Room.find().sort({ rid: 1 });
    res.json(rooms);
  } catch (err) {
    console.error("Error fetching rooms:", err);
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
});
// ✅ Check room availability (public-ish)
router.post("/check", async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Start and end dates are required" });
    }

    // ✅ Include all needed fields for the calendar view
    const rooms = await Room.find({}, "rid rname rcategory rprice").sort({
      rcategory: 1,
      rid: 1,
    });

    // find bookings overlapping with requested dates
    const bookings = await Booking.find({
      $or: [
        {
          startDate: { $lte: new Date(endDate) },
          endDate: { $gte: new Date(startDate) },
        },
      ],
      isDeleted: false,
    });

    const bookedRids = bookings.map((b) => b.rid);

    const result = rooms.map((r) => ({
      rid: r.rid,
      rname: r.rname,
      rcategory: r.rcategory,
      rprice: r.rprice,
      available: !bookedRids.includes(r.rid),
    }));

    res.json(result);
  } catch (err) {
    console.error("❌ Error in /rooms/check:", err.message);
    console.error(err.stack);
    res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
});
// backend/routes/rooms.js (example)
router.get("/bookings/:rid", async (req, res) => {
  try {
    const { rid } = req.params;
    const booking = await Booking.findOne({ rid, deleted: { $ne: true } });
    if (!booking) {
      return res.status(200).json(null); // not an error, just no booking
    }
    res.json(booking);
  } catch (err) {
    console.error("Error fetching booking:", err);
    res.status(500).json({ error: "Server error while fetching booking" });
  }
});

// Book a room via room endpoint
// Require manager/admin
router.post("/book/:rid", auth(["manager", "admin"]), async (req, res) => {
  try {
    const { rid } = req.params;
    const {
      cname,
      ccontact,
      advance,
      advanceReceiver,
      due,
      dueReceiver,
      startDate,
      endDate,
    } = req.body;

    if (!cname || !ccontact || !startDate || !endDate) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // check overlap
    const existing = await Booking.findOne({
      rid: parseInt(rid),
      isDeleted: false,
      $or: [
        {
          startDate: { $lte: new Date(endDate) },
          endDate: { $gte: new Date(startDate) },
        },
      ],
    });

    if (existing) {
      return res
        .status(400)
        .json({ error: "Room already booked for given dates" });
    }

    const booking = new Booking({
  rid: parseInt(rid),
  cname,
  ccontact,
  startDate: new Date(startDate),
  endDate: new Date(endDate),
  advance: parseInt(advance) || 0,
  advanceReceiver: advanceReceiver || "",
  due: parseInt(due) || 0,
  dueReceiver: dueReceiver || "",
  isDeleted: false,

  // 🟢 Add this line to track creator
  bcreatedByUid: req.user?._id || req.user?.uid || "system",
});

    await booking.save();

    // update room status
    const count = await Booking.countDocuments({
      rid: parseInt(rid),
      isDeleted: false,
    });
    await Room.findOneAndUpdate(
      { rid: parseInt(rid) },
      { $set: { isBooked: count > 0 } }
    );

    res.json({ message: "Room booked successfully", booking });
  } catch (err) {
    console.error("❌ Error in /rooms/book:", err.message);
    console.error(err.stack);
    res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
});

module.exports = router;
