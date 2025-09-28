const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  rid: { type: Number, unique: true },
  rname: String,
  rcategory: String,
  rprice: Number,
  isBooked: { type: Boolean, default: false },
  bookings: [
    {
      startDate: Date,
      endDate: Date,
      uname: String,
      ucontact: String,
      advance: Number,
      advanceReceiver: String,
      due: Number,
      dueReceiver: String,
    },
  ],
});

module.exports = mongoose.model("Room", roomSchema);
