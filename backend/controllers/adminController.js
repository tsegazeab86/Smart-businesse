
const db = require("../config/db");

// ==========================================
// GET /api/admin/stats
// Dashboard statistics and recent orders
// ==========================================
async function getDashboardStats(req, res) {
  try {
    // 1. Order statistics
    const [[orderStats]] = await db.query(`
      SELECT
        COUNT(*) AS totalOrders,

        COALESCE(
          SUM(status = 'pending'),
          0
        ) AS pendingOrders,

        COALESCE(
          SUM(status = 'delivered'),
          0
        ) AS deliveredOrders,

        COALESCE(
          SUM(
            CASE
              WHEN payment_status = 'paid'
                AND status <> 'cancelled'
              THEN total
              ELSE 0
            END
          ),
          0
        ) AS paidRevenue

      FROM orders
    `);

    // 2. Total products
    const [[productStats]] = await db.query(`
      SELECT COUNT(*) AS totalProducts
      FROM products
    `);

    // 3. Total customers
    const [[customerStats]] = await db.query(`
      SELECT COUNT(*) AS totalCustomers
      FROM users
      WHERE role = 'customer'
    `);

    // 4. Five most recent orders
    const [recentOrders] = await db.query(`
      SELECT
        id,
        full_name AS fullName,
        total,
        payment_status AS paymentStatus,
        status,
        created_at AS createdAt
      FROM orders
      ORDER BY created_at DESC, id DESC
      LIMIT 5
    `);

    // 5. Send dashboard response
    return res.status(200).json({
      success: true,

      stats: {
        totalOrders: Number(orderStats.totalOrders),
        pendingOrders: Number(orderStats.pendingOrders),
        deliveredOrders: Number(orderStats.deliveredOrders),
        paidRevenue: Number(orderStats.paidRevenue),
        totalProducts: Number(productStats.totalProducts),
        totalCustomers: Number(customerStats.totalCustomers),
      },

      recentOrders,
    });
  } catch (error) {
    console.error("ADMIN STATS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load dashboard statistics.",
    });
  }
}

// ==========================================
// GET /api/admin/orders
// Get all customer orders
// ==========================================
async function getAllOrders(req, res) {
  try {
    const [orders] = await db.query(`
      SELECT
        o.id,
        o.full_name AS fullName,
        o.phone,
        o.city,
        o.address,
        o.subtotal,
        o.shipping_fee AS shippingFee,
        o.total,
        o.payment_method AS paymentMethod,
        o.payment_status AS paymentStatus,
        o.status,
        o.created_at AS createdAt,
        u.email AS customerEmail

      FROM orders o

      JOIN users u
        ON u.id = o.user_id

      ORDER BY
        o.created_at DESC,
        o.id DESC
    `);

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("ADMIN ORDERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load orders.",
    });
  }
}

// ==========================================
// PATCH /api/admin/orders/:id/status
// Update order status safely
// ==========================================
async function updateOrderStatus(req, res) {
  let connection;

  try {
    const orderId = Number(req.params.id);
    const { status } = req.body || {};

    // Validate order ID
    if (!Number.isSafeInteger(orderId) || orderId < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    // Only forward status transitions are allowed
    const transitions = {
      pending: "confirmed",
      confirmed: "shipped",
      shipped: "delivered",
    };

    // Validate requested status
    if (!Object.values(transitions).includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status.",
      });
    }

    // Start database transaction
    connection = await db.getConnection();

    await connection.beginTransaction();

    // Lock selected order
    const [orders] = await connection.query(
      `
      SELECT
        id,
        status
      FROM orders
      WHERE id = ?
      FOR UPDATE
      `,
      [orderId]
    );

    // Order does not exist
    if (orders.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const currentStatus = orders[0].status;

    const expectedNextStatus = transitions[currentStatus];

    // Prevent invalid status transitions
    if (status !== expectedNextStatus) {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message: expectedNextStatus
          ? `Order must move from ${currentStatus} to ${expectedNextStatus}.`
          : "This order cannot be updated further.",
      });
    }

    // Update order status
    await connection.query(
      `
      UPDATE orders
      SET status = ?
      WHERE id = ?
      `,
      [status, orderId]
    );

    // Save order status history
    const notes = {
      confirmed: "Order confirmed by admin",
      shipped: "Order marked as shipped by admin",
      delivered: "Order marked as delivered by admin",
    };

    const [historyResult] = await connection.query(
      `
      INSERT INTO order_status_history
        (
          order_id,
          status,
          changed_by,
          note
        )
      VALUES (?, ?, ?, ?)
      `,
      [
        orderId,
        status,
        req.user.id,
        notes[status],
      ]
    );

    // Commit transaction
    await connection.commit();

    return res.status(200).json({
      success: true,
      message: `Order successfully updated to ${status}.`,

      order: {
        id: orderId,
        status,
      },

      history: {
        id: historyResult.insertId,
        status,
      },
    });
  } catch (error) {
    // Roll back if any database operation fails
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(
          "ORDER ROLLBACK ERROR:",
          rollbackError
        );
      }
    }

    console.error(
      "UPDATE ORDER STATUS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to update order status.",
    });
  } finally {
    // Always release database connection
    if (connection) {
      connection.release();
    }
  }
}

// ==========================================
// EXPORT CONTROLLERS
// ==========================================
module.exports = {
  getDashboardStats,
  getAllOrders,
  updateOrderStatus,
};
