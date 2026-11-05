
const express = require("express");
const multer = require("multer");

const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

// Controllers: Dashboard and orders
const {
  getDashboardStats,
  getAllOrders,
  updateOrderStatus,
} = require("../controllers/adminController");

const {
  getAdminOrderById,
} = require("../controllers/adminOrderDetailsController");

// Controllers: Products
const {
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/adminProductController");

// Controllers: Categories
const {
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/adminCategoryController");

// Controllers: Settings
const {
  getAdminSettings,
  updateAdminSettings,
} = require("../controllers/adminSettingsController");

// Controllers: Analytics
const {
  getAdminAnalytics,
} = require("../controllers/adminAnalyticsController");

// Controllers: Customers
const {
  getAdminCustomers,
  getAdminCustomerById,
  updateCustomerStatus,
} = require("../controllers/adminCustomerController");

const {
  getSellerApplications,
  approveSeller,
  rejectSeller
} = require("../controllers/adminSellerController");

// Middleware: Product image upload
const uploadProductImageMiddleware = require(
  "../middleware/uploadProductImage"
);

// Controllers: Product image upload
const {
  uploadProductImage,
  removeUploadedFile,
} = require("../controllers/adminUploadController");

const router = express.Router();

// Protect all admin endpoints
router.use(protect);
router.use(adminOnly);

// ===================================
// DASHBOARD
// ===================================
router.get("/stats", getDashboardStats);

// ===================================
// SETTINGS
// ===================================
router.get("/settings", getAdminSettings);
router.put("/settings", updateAdminSettings);

// Seller management
router.get("/sellers", getSellerApplications);
router.patch("/sellers/:id/approve", approveSeller);
router.patch("/sellers/:id/reject", rejectSeller);

// ===================================
// ORDERS
// ===================================
router.get("/orders", getAllOrders);
router.get("/orders/:id", getAdminOrderById);
router.patch("/orders/:id/status", updateOrderStatus);

// ===================================
// PRODUCT IMAGE UPLOAD
// Declare before product ID routes
// ===================================
router.post(
  "/products/upload-image",
  (req, res) => {
    uploadProductImageMiddleware.single("image")(
      req,
      res,
      async (error) => {
        if (error) {
          await removeUploadedFile(req.file);

          const statusCode =
            error instanceof multer.MulterError &&
            error.code === "LIMIT_FILE_SIZE"
              ? 413
              : 400;

          return res.status(statusCode).json({
            success: false,
            message:
              error.code === "LIMIT_FILE_SIZE"
                ? "Image must not exceed 5MB."
                : error.message,
          });
        }

        return uploadProductImage(req, res);
      }
    );
  }
);

// ===================================
// PRODUCTS
// ===================================
router.get("/products", getAdminProducts);
router.post("/products", createProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);

// ===================================
// CATEGORIES
// ===================================
router.get("/categories", getAdminCategories);
router.post("/categories", createCategory);
router.put("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);

// ===================================
// CUSTOMERS
// ===================================
router.get("/customers", getAdminCustomers);
router.get("/customers/:id", getAdminCustomerById);
router.patch("/customers/:id/status", updateCustomerStatus);

// ===================================
// ANALYTICS
// ===================================
router.get("/analytics", getAdminAnalytics);

module.exports = router;
