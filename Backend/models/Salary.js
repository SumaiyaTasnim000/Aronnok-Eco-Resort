const mongoose = require("mongoose");

const salarySchema = new mongoose.Schema(
  {
    sid: { type: Number, unique: true }, // Auto increment salary ID
    sname: { type: String, required: true },
    smonthly: { type: Number, required: true },
    spaidMonth: { type: String, required: true },
    spaidDays: { type: Number, required: true },
    spaidSalary: { type: Number, required: true },
    sisDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Auto-increment sid safely
salarySchema.pre("save", async function (next) {
  try {
    if (this.isNew) {
      const lastSalary = await this.constructor
        .findOne()
        .sort({ sid: -1 })
        .lean();
      this.sid = lastSalary ? lastSalary.sid + 1 : 1;
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Salary", salarySchema);
