
const db = require("../config/db");

async function createNotification(
  {
    userId,
    type = "order_update",
    title,
    message,
    orderId = null,
  },
  connection = db
) {
  if (!userId || !title || !message) {
    return;
  }

  await connection.query(
    `INSERT INTO notifications
      (user_id, type, title, message, order_id)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, type, title, message, orderId]
  );
}

// Call after a new order is successfully created.
async function notifyOrderCreated(
  order,
  connection = db
) {
  const orderId = order.id ?? order.orderId;
  const customerId =
    order.user_id ?? order.userId;
  const orderTotal = Number(order.total ?? 0);

  // Customer confirmation
  if (customerId) {
    await createNotification(
      {
        userId: customerId,
        type: "order_created",
        title: "Order placed successfully",
        message:
          `Your order #${orderId} has been received ` +
          "and is being processed.",
        orderId,
      },
      connection
    );
  }

  // Admin notifications.
  // Assumes users.role contains the value "admin".
  try {
    const [admins] = await connection.query(
      `SELECT id
       FROM users
       WHERE LOWER(role) = 'admin'`
    );

    for (const admin of admins) {
      await createNotification(
        {
          userId: admin.id,
          type: "new_order",
          title: "New customer order",
          message:
            `Order #${orderId} was placed ` +
            `(total: ${orderTotal.toFixed(2)}).`,
          orderId,
        },
        connection
      );
    }
  } catch (error) {
    console.warn(
      "Could not create admin notification:",
      error.message
    );
  }
}

// Call after an order's status has been updated.
async function notifyOrderStatusChanged(
  { userId, orderId, status },
  connection = db
) {
  if (!userId || !orderId || !status) {
    return;
  }

  const normalizedStatus =
    String(status).toLowerCase();

  const labels = {
    pending: "pending",
    confirmed: "confirmed",
    shipped: "shipped",
    delivered: "delivered",
    cancelled: "cancelled",
  };

  const label =
    labels[normalizedStatus] || normalizedStatus;

  await createNotification(
    {
      userId,
      type: "order_status",
      title: `Order #${orderId} updated`,
      message: `Your order status is now ${label}.`,
      orderId,
    },
    connection
  );
}

module.exports = {
  createNotification,
  notifyOrderCreated,
  notifyOrderStatusChanged,
};
