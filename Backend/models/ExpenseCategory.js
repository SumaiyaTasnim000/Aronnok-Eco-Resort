const mongoose = require("mongoose");

const expenseCategorySchema = new mongoose.Schema(
  {
    expcatid: { type: Number, unique: true },
    expcatname: { type: String, required: true, unique: true },
    expcatcreatedByUid: { type: String },
    expcatisDeleted: { type: Boolean, default: false },
  },
  { timestamps: true } // ✅ adds createdAt & updatedAt automatically
);

// ✅ Auto-increment logic for expcatid
expenseCategorySchema.pre("save", async function (next) {
  try {
    if (this.isNew) {
      const lastCat = await this.constructor
        .findOne()
        .sort({ expcatid: -1 })
        .lean();
      this.expcatid = lastCat ? lastCat.expcatid + 1 : 1;
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("ExpenseCategory", expenseCategorySchema);
