const express = require("express");

const { protect } = require("../middleware/authMiddleware");

const {
  createOrder,
  getMyOrders,
  getMyOrderHistory,
  getMyOrderById,
} = require("../controllers/orderController");

const router = express.Router();

router.use(protect);

router.post("/", createOrder);
router.get("/my", getMyOrders);

// Keep the specific history route before /:id.
router.get("/:id/history", getMyOrderHistory);

router.get("/:id", getMyOrderById);

module.exports = router;