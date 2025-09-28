// backend/routes/auth.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { uemail, upassword } = req.body;

  try {
    // find user by email
    const user = await User.findOne({ uemail });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // check password (plain text, since your DB users are plain text)
    if (upassword !== user.upassword) {
      return res.status(400).json({ message: "Wrong password" });
    }

    // create JWT
    const token = jwt.sign(
      { uid: user.uid, urole: user.urole },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, role: user.urole });
  } catch (err) {
    res.status(500).json({ message: "Login error", error: err.message });
  }
});

module.exports = router;
