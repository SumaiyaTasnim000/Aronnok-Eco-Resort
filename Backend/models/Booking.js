const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    bid: { type: Number, unique: true },
    rid: { type: Number, required: true },
    cname: { type: String, required: true },
    ccontact: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    advance: { type: Number, default: 0 },
    advanceReceiver: { type: String, default: "" },
    due: { type: Number, default: 0 },
    dueReceiver: { type: String, default: "" },
    isDeleted: { type: Boolean, default: false },

    // 🟢 New field for user tracking
    bcreatedByUid: { type: String, required: false },
  },
  {
    timestamps: true, // 🕒 adds createdAt and updatedAt automatically
  }
);

// 🔹 Auto-increment bid safely
bookingSchema.pre("save", async function (next) {
  try {
    if (this.isNew) {
      const lastBooking = await this.constructor
        .findOne()
        .sort({ bid: -1 })
        .lean();
      this.bid = lastBooking ? lastBooking.bid + 1 : 1;
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Booking", bookingSchema);
