
const db = require("../config/db");

// ==========================================
// GET SINGLE ADMIN ORDER WITH ITEMS
// GET /api/admin/orders/:id
// ==========================================

const getAdminOrderById = async (req, res) => {
  try {
    const orderId = Number(req.params.id);

    // Validate Order ID
    if (
      !Number.isSafeInteger(orderId) ||
      orderId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    // Fetch order and customer information
    const [orders] = await db.query(
      `
      SELECT
        o.id,
        o.user_id AS userId,
        o.full_name AS fullName,
        o.phone,
        o.city,
        o.address,
        o.notes,
        o.subtotal,
        o.shipping_fee AS shippingFee,
        o.total,
        o.payment_method AS paymentMethod,
        o.payment_reference AS paymentReference,
        o.payment_status AS paymentStatus,
        o.status,
        o.created_at AS createdAt,

        u.email AS customerEmail

      FROM orders o

      LEFT JOIN users u
        ON u.id = o.user_id

      WHERE o.id = ?

      LIMIT 1
      `,
      [orderId]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // Fetch products purchased in this order
    const [items] = await db.query(
      `
      SELECT
        oi.id,
        oi.product_id AS productId,
        oi.product_name AS productName,
        oi.price,
        oi.quantity,
        oi.line_total AS lineTotal,

        p.image AS productImage

      FROM order_items oi

      LEFT JOIN products p
        ON p.id = oi.product_id

      WHERE oi.order_id = ?

      ORDER BY oi.id ASC
      `,
      [orderId]
    );


const [history] = await db.query(
  `
  SELECT
    h.id,
    h.status,
    h.note,
    h.created_at AS createdAt,
    u.full_name AS changedByName
  FROM order_status_history h
  LEFT JOIN users u ON u.id = h.changed_by
  WHERE h.order_id = ?
  ORDER BY h.created_at ASC, h.id ASC
  `,
  [orderId]
);

console.log("ADMIN HISTORY:", orderId, history);

return res.status(200).json({
  success: true,
  order: {
    ...orders[0],
    items,
    history,
  },
});


    // Return complete order
    return res.status(200).json({
      success: true,

      order: {
        ...orders[0],
        items,
      },
    });
  } catch (error) {
    console.error("GET ADMIN ORDER DETAILS:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load order details.",
    });
  }
};

const updateOrderStatus = async (req, res) => {
  let connection;

  try {
    const orderId = Number(req.params.id);
    const { status } = req.body;

    if (!Number.isSafeInteger(orderId) || orderId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    // Only the next valid status is allowed.
    const nextStatus = {
      pending: "confirmed",
      confirmed: "shipped",
      shipped: "delivered",
    };

    if (!Object.values(nextStatus).includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status.",
      });
    }

    connection = await db.getConnection();

    await connection.beginTransaction();

    // Lock the order to prevent concurrent status updates.
    const [orders] = await connection.query(
      `
      SELECT id, status
      FROM orders
      WHERE id = ?
      FOR UPDATE
      `,
      [orderId]
    );

    if (orders.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const currentStatus = orders[0].status;
    const allowedNextStatus = nextStatus[currentStatus];

    if (!allowedNextStatus || status !== allowedNextStatus) {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message: allowedNextStatus
          ? `This order must move from ${currentStatus} to ${allowedNextStatus}.`
          : `Order with status "${currentStatus}" cannot be updated.`,
      });
    }

    await connection.query(
      `
      UPDATE orders
      SET status = ?
      WHERE id = ?
      `,
      [status, orderId]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: `Order successfully moved to ${status}.`,
      order: {
        id: orderId,
        status,
      },
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("ROLLBACK ERROR:", rollbackError);
      }
    }

    console.error("UPDATE ORDER STATUS:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update order status.",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
  return res.status(200).json({
  success: true,
  order: {
    ...orders[0],
    items,
    history,
  },
});
};

module.exports = {
  getAdminOrderById,
};
