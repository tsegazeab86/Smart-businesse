
const express = require("express");

const { protect } = require("../middleware/authMiddleware");
const { sellerOnly } = require("../middleware/sellerMiddleware");

const {
  applyAsSeller,
  getMyApplication,
} = require("../controllers/sellerController");

const {
  getSellerProducts,
  createSellerProduct,
  updateSellerProduct,
  deleteSellerProduct,
} = require("../controllers/sellerProductController");

const {
  getSellerOrders,
  getSellerOrderById,
} = require("../controllers/sellerOrderController");

const {
  getDashboardStats,
  getSalesReport,
  getSellerProfile,
  updateSellerProfile,
} = require("../controllers/sellerDashboardController");

const router = express.Router();

// ====================================
// AUTHENTICATION
// ====================================

router.use(protect);

// ====================================
// SELLER APPLICATION
// ====================================

router.post("/apply", applyAsSeller);

router.get("/application", getMyApplication);

// ====================================
// APPROVED SELLERS ONLY
// ====================================

router.use(sellerOnly);

// ====================================
// DASHBOARD
// ====================================

router.get("/dashboard/stats", getDashboardStats);

// ====================================
// PRODUCT MANAGEMENT
// ====================================

router.get("/products", getSellerProducts);

router.post("/products", createSellerProduct);

router.put("/products/:id", updateSellerProduct);

router.delete("/products/:id", deleteSellerProduct);

// ====================================
// ORDER MANAGEMENT
// ====================================

router.get("/orders", getSellerOrders);

router.get("/orders/:id", getSellerOrderById);

// ====================================
// SALES REPORTS
// ====================================

router.get("/reports/sales", getSalesReport);

// ====================================
// SELLER PROFILE
// ====================================

router.get("/profile", getSellerProfile);

router.put("/profile", updateSellerProfile);

// ====================================
// EXPORT
// ====================================

module.exports = router;
