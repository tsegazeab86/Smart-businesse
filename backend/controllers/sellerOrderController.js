
const db = require("../config/db");

const validId = (value) => {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

// GET /api/seller/orders
const getSellerOrders = async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT
         o.id,
         o.created_at AS createdAt,
         o.status,
         o.payment_method AS paymentMethod,
         o.payment_status AS paymentStatus,
         o.full_name AS customerName,
         o.city,
         COUNT(oi.id) AS itemCount,
         SUM(oi.quantity) AS totalQuantity,
         SUM(oi.line_total) AS sellerSubtotal
       FROM orders o
       INNER JOIN order_items oi ON oi.order_id = o.id
       INNER JOIN products p ON p.id = oi.product_id
       WHERE p.seller_id = ?
       GROUP BY
         o.id,
         o.created_at,
         o.status,
         o.payment_method,
         o.payment_status,
         o.full_name,
         o.city
       ORDER BY o.created_at DESC, o.id DESC`,
      [req.seller.id]
    );

    return res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error("Get seller orders:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load seller orders."
    });
  }
};

// GET /api/seller/orders/:id
const getSellerOrderById = async (req, res) => {
  try {
    const orderId = validId(req.params.id);

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID."
      });
    }

    const [orders] = await db.query(
      `SELECT
         o.id,
         o.created_at AS createdAt,
         o.status,
         o.payment_method AS paymentMethod,
         o.payment_status AS paymentStatus,
         o.full_name AS customerName,
         o.phone,
         o.city,
         o.address
       FROM orders o
       WHERE o.id = ?
         AND EXISTS (
           SELECT 1
           FROM order_items oi
           INNER JOIN products p ON p.id = oi.product_id
           WHERE oi.order_id = o.id
             AND p.seller_id = ?
         )
       LIMIT 1`,
      [orderId, req.seller.id]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found."
      });
    }

    const [items] = await db.query(
      `SELECT
         oi.id,
         oi.product_id AS productId,
         oi.product_name AS productName,
         oi.price,
         oi.quantity,
         oi.line_total AS lineTotal
       FROM order_items oi
       INNER JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = ?
         AND p.seller_id = ?
       ORDER BY oi.id ASC`,
      [orderId, req.seller.id]
    );

    const sellerSubtotal = items.reduce(
      (sum, item) => sum + Number(item.lineTotal),
      0
    );

    return res.json({
      success: true,
      order: {
        ...orders[0],
        items,
        sellerSubtotal: sellerSubtotal.toFixed(2)
      }
    });
  } catch (error) {
    console.error("Get seller order details:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load order details."
    });
  }
};

module.exports = {
  getSellerOrders,
  getSellerOrderById
};
