const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  uid: { type: Number },
  uemail: { type: String, unique: true },
  upassword: String, // we’ll hash later
  urole: { type: String, enum: ["admin", "manager"], default: "manager" },
});

module.exports = mongoose.model("User", userSchema);
