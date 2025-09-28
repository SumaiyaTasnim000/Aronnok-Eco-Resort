const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema(
  {
    resid: { type: Number, unique: true }, // Auto-increment ID
    res_date: { type: Date, required: true },
    res_amountSpent: { type: Number, required: true },
    res_amountEarned: { type: Number, required: true },
    res_createdByUid: { type: Number }, // Who created (from JWT)
    res_isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Auto-increment resid safely
restaurantSchema.pre("save", async function (next) {
  try {
    if (this.isNew) {
      const lastRestaurant = await this.constructor.findOne().sort({ resid: -1 }).lean();
      this.resid = lastRestaurant ? lastRestaurant.resid + 1 : 1;
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Restaurant", restaurantSchema);
