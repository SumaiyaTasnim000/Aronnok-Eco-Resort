// backend/server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const roomRoutes = require("./routes/room");
const bookingRoutes = require("./routes/booking");
const expensesRoutes = require("./routes/expenses");
const salaryRoutes = require("./routes/salaries");
const dashboardRoutes = require("./routes/dashboard");
const expenseCategoryRoutes = require("./routes/expenseCategories");

const app = express();
app.use(cors());
app.use(express.json());

// test route
app.get("/", (req, res) => res.send("Backend is running ✅"));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/expenses", expensesRoutes);
app.use("/api/salaries", salaryRoutes);
app.use("/api/restaurants", require("./routes/restaurants"));
app.use("/api/staffs", require("./routes/staffs"));
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/expenseCategories", expenseCategoryRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date() });
});

const PORT = process.env.PORT || 5001;

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    dbName: "hotelDB",
  })
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));
