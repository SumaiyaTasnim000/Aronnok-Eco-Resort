// backend/models/Staff.js
const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema(
  {
    sid: { type: Number, unique: true }, // ✅ auto increment ID
    sname: { type: String, required: true, trim: true },
    stype: { type: String, required: true, trim: true },
    smonthly: { type: Number, default: 0, min: 0 },
    sisDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ✅ Auto-increment sid safely
staffSchema.pre("save", async function (next) {
  try {
    if (this.isNew) {
      const lastStaff = await this.constructor
        .findOne()
        .sort({ sid: -1 })
        .lean();
      this.sid = lastStaff ? lastStaff.sid + 1 : 1;
    }
    next();
  } catch (err) {
    console.error("Error during sid auto-increment:", err);
    next(err);
  }
});

module.exports = mongoose.model("Staff", staffSchema);
