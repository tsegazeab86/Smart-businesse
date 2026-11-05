require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./config/db");
const path = require("path");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminRoutes = require("./routes/adminRoutes");
const sellerRoutes = require("./routes/sellerRoutes");

const notificationRoutes = require(
  "./routes/notificationRoutes"
);

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);
app.use("/api/seller", sellerRoutes);
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(
  "/api/notifications",
  notificationRoutes
);
app.post("/api/admin/products/upload-test", (req, res) => {
  console.log("UPLOAD TEST ROUTE WORKING");

  return res.json({
    success: true,
    message: "Upload test route is working",
  });
});
// Health Check
app.get("/api/health", async (req, res) => {
  try {
    await db.query("SELECT 1");

    res.json({
      success: true,
      message: "Database Connected Successfully",
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

// Register API routes
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/orders", orderRoutes);
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
