// backend/models/Salary.js
const mongoose = require("mongoose");

const salarySchema = new mongoose.Schema(
  {
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    }, // ✅ normalized link
    spaidFrom: { type: Date, required: true },
    spaidUntil: { type: Date, required: true },
    spaidDays: { type: Number, required: true, min: 1 },
    spaidSalary: { type: Number, required: true, min: 0 },
    sisDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

salarySchema.pre("save", async function (next) {
  if (this.isNew) {
    const last = await this.constructor.findOne().sort({ sid: -1 }).lean();
    this.sid = last ? last.sid + 1 : 1;
  }
  next();
});

module.exports = mongoose.model("Salary", salarySchema);
