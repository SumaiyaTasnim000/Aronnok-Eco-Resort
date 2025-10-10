const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    eid: { type: Number, unique: true }, // Auto-increment ID
    edate: { type: Date, required: true },
    ename: { type: String, required: true },
    eamount: { type: Number, required: true },
    ecategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExpenseCategory", // ✅ normalized reference
      required: true,
    },
    ecreatedByUid: { type: Number }, // Who created (from JWT)
    eisDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Auto-increment eid safely
expenseSchema.pre("save", async function (next) {
  try {
    if (this.isNew) {
      const lastExpense = await this.constructor
        .findOne()
        .sort({ eid: -1 })
        .lean();
      this.eid = lastExpense ? lastExpense.eid + 1 : 1;
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Expense", expenseSchema);
