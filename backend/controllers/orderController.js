
const db = require("../config/db");

const {
  notifyOrderCreated,
  notifyOrderStatusChanged,
} = require("./orderNotificationHelpers");

// ==========================================
// CREATE ORDER
// POST /api/orders
// ==========================================

const createOrder = async (req, res) => {
  let connection;

  try {
    const {
      fullName,
      phone,
      city,
      address,
      notes,
      paymentMethod = "cash_on_delivery",
      paymentReference,
      items,
    } = req.body || {};

    const cleanFullName =
      typeof fullName === "string" ? fullName.trim() : "";
    const cleanPhone =
      typeof phone === "string" ? phone.trim() : "";
    const cleanCity =
      typeof city === "string" ? city.trim() : "";
    const cleanAddress =
      typeof address === "string" ? address.trim() : "";
    const cleanNotes =
      typeof notes === "string" ? notes.trim() : "";
    const cleanPaymentReference =
      typeof paymentReference === "string"
        ? paymentReference.trim()
        : "";

    if (
      !cleanFullName ||
      !cleanPhone ||
      !cleanCity ||
      !cleanAddress
    ) {
      return res.status(400).json({
        success: false,
        message: "Full name, phone, city and address are required.",
      });
    }

    if (
      cleanFullName.length > 150 ||
      cleanPhone.length > 30 ||
      cleanCity.length > 100 ||
      cleanAddress.length > 500 ||
      cleanNotes.length > 2000 ||
      cleanPaymentReference.length > 150
    ) {
      return res.status(400).json({
        success: false,
        message: "One or more fields are too long.",
      });
    }

    const allowedPaymentMethods = [
      "cash_on_delivery",
      "telebirr",
      "bank_transfer",
    ];

    if (!allowedPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method.",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty.",
      });
    }

    const mergedItems = new Map();

    for (const item of items) {
      const productId = Number(
        item?.productId ?? item?.product_id ?? item?.id
      );
      const quantity = Number(item?.quantity);

      if (
        !Number.isSafeInteger(productId) ||
        productId <= 0 ||
        !Number.isSafeInteger(quantity) ||
        quantity <= 0 ||
        quantity > 1000000
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid product or quantity.",
        });
      }

      const newQuantity =
        (mergedItems.get(productId) || 0) + quantity;

      if (
        !Number.isSafeInteger(newQuantity) ||
        newQuantity > 1000000
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid total product quantity.",
        });
      }

      mergedItems.set(productId, newQuantity);
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    const verifiedItems = [];
    let subtotalCents = 0;

    const sortedItems = [...mergedItems.entries()].sort(
      (a, b) => a[0] - b[0]
    );

    for (const [productId, quantity] of sortedItems) {
      const [products] = await connection.query(
        `
        SELECT id, name, price, stock
        FROM products
        WHERE id = ? AND is_active = 1
        FOR UPDATE
        `,
        [productId]
      );

      if (!products.length) {
        await connection.rollback();

        return res.status(404).json({
          success: false,
          message: `Product #${productId} is unavailable.`,
        });
      }

      const product = products[0];

      if (Number(product.stock) < quantity) {
        await connection.rollback();

        return res.status(409).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Only ${product.stock} available.`,
        });
      }

      const priceCents = Math.round(Number(product.price) * 100);

      if (
        !Number.isSafeInteger(priceCents) ||
        priceCents < 0
      ) {
        throw new Error("Invalid database product price.");
      }

      const lineTotalCents = priceCents * quantity;

      if (!Number.isSafeInteger(lineTotalCents)) {
        throw new Error("Order amount is too large.");
      }

      subtotalCents += lineTotalCents;

      if (!Number.isSafeInteger(subtotalCents)) {
        throw new Error("Order amount is too large.");
      }

      verifiedItems.push({
        productId: product.id,
        productName: product.name,
        priceCents,
        quantity,
        lineTotalCents,
      });
    }

    // Keep consistent with your store shipping policy.
    const shippingFeeCents = 0;
    const totalCents = subtotalCents + shippingFeeCents;

    if (
      !Number.isSafeInteger(totalCents) ||
      totalCents > 9999999999
    ) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Order total exceeds the allowed limit.",
      });
    }

    const subtotal = subtotalCents / 100;
    const shippingFee = shippingFeeCents / 100;
    const total = totalCents / 100;

    const [orderResult] = await connection.query(
      `
      INSERT INTO orders (
        user_id,
        full_name,
        phone,
        city,
        address,
        notes,
        subtotal,
        shipping_fee,
        total,
        payment_method,
        payment_reference,
        payment_status,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending')
      `,
      [
        req.user.id,
        cleanFullName,
        cleanPhone,
        cleanCity,
        cleanAddress,
        cleanNotes || null,
        subtotal,
        shippingFee,
        total,
        paymentMethod,
        cleanPaymentReference || null,
      ]
    );

    const orderId = orderResult.insertId;

    for (const item of verifiedItems) {
      await connection.query(
        `
        INSERT INTO order_items (
          order_id,
          product_id,
          product_name,
          price,
          quantity,
          line_total
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          orderId,
          item.productId,
          item.productName,
          item.priceCents / 100,
          item.quantity,
          item.lineTotalCents / 100,
        ]
      );

      await connection.query(
        `
        UPDATE products
        SET stock = stock - ?
        WHERE id = ?
        `,
        [item.quantity, item.productId]
      );
    }

    // Save initial order status history.
    await connection.query(
      `
      INSERT INTO order_status_history (
        order_id,
        status,
        changed_by,
        note
      )
      VALUES (?, 'pending', NULL, ?)
      `,
      [orderId, "Customer placed a new order"]
    );

    // Create customer/admin notifications using this transaction.
    await notifyOrderCreated(
      {
        id: orderId,
        user_id: req.user.id,
        total,
      },
      connection
    );

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "Order placed successfully.",
      order: {
        id: orderId,
        status: "pending",
        paymentStatus: "pending",
        paymentMethod,
        subtotal,
        shippingFee,
        total,
      },
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("CREATE ORDER ROLLBACK:", rollbackError);
      }
    }

    console.error("CREATE ORDER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to place your order.",
    });
  } finally {
    if (connection) connection.release();
  }
};

// ==========================================
// UPDATE ORDER STATUS
// Admin updates order status
// ==========================================

const updateOrderStatus = async (req, res) => {
  let connection;

  try {
    const orderId = Number(req.params.id);

    const newStatus =
      typeof req.body?.status === "string"
        ? req.body.status.trim().toLowerCase()
        : "";

    const allowedStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!Number.isSafeInteger(orderId) || orderId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    if (!allowedStatuses.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status.",
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [orders] = await connection.query(
      `
      SELECT id, user_id, status
      FROM orders
      WHERE id = ?
      FOR UPDATE
      `,
      [orderId]
    );

    if (!orders.length) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const order = orders[0];

    if (order.status === newStatus) {
      await connection.rollback();

      return res.status(200).json({
        success: true,
        message: "Order status is already set to this value.",
      });
    }

    await connection.query(
      "UPDATE orders SET status = ? WHERE id = ?",
      [newStatus, orderId]
    );

    await connection.query(
      `
      INSERT INTO order_status_history (
        order_id,
        status,
        changed_by,
        note
      )
      VALUES (?, ?, ?, ?)
      `,
      [
        orderId,
        newStatus,
        req.user?.id ?? null,
        `Order status changed to ${newStatus}`,
      ]
    );

    await connection.commit();

    // Notify the customer after the status update is committed.
    try {
      await notifyOrderStatusChanged({
        userId: order.user_id,
        orderId: order.id,
        status: newStatus,
      });
    } catch (notificationError) {
      // The order update has already succeeded.
      console.error(
        "ORDER STATUS NOTIFICATION ERROR:",
        notificationError
      );
    }

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully.",
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(
          "UPDATE ORDER STATUS ROLLBACK:",
          rollbackError
        );
      }
    }

    console.error("UPDATE ORDER STATUS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update order status.",
    });
  } finally {
    if (connection) connection.release();
  }
};

// ==========================================
// GET MY ORDERS
// GET /api/orders/my
// ==========================================

const getMyOrders = async (req, res) => {
  try {
    const [orders] = await db.query(
      `
      SELECT
        o.id,
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
        o.created_at AS createdAt
      FROM orders o
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC, o.id DESC
      `,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("GET MY ORDERS:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load your orders.",
    });
  }
};

// ==========================================
// GET MY ORDER HISTORY
// GET /api/orders/:id/history
// ==========================================

const getMyOrderHistory = async (req, res) => {
  try {
    const orderId = Number(req.params.id);

    if (!Number.isSafeInteger(orderId) || orderId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    // Customers can only view their own order history.
    const [orders] = await db.query(
      `
      SELECT id, status
      FROM orders
      WHERE id = ? AND user_id = ?
      LIMIT 1
      `,
      [orderId, req.user.id]
    );

    if (!orders.length) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const [history] = await db.query(
      `
      SELECT
        id,
        status,
        note,
        created_at AS createdAt
      FROM order_status_history
      WHERE order_id = ?
      ORDER BY created_at ASC, id ASC
      `,
      [orderId]
    );

    return res.status(200).json({
      success: true,
      orderId,
      currentStatus: orders[0].status,
      history,
    });
  } catch (error) {
    console.error("GET MY ORDER HISTORY:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load order history.",
    });
  }
};

// ==========================================
// GET MY ORDER DETAILS
// GET /api/orders/:id
// ==========================================

const getMyOrderById = async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    const userId = req.user.id;

    if (!Number.isSafeInteger(orderId) || orderId < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    // Security: order must belong to the logged-in customer.
    const [orders] = await db.query(
      `
      SELECT
        id,
        user_id AS userId,
        full_name AS fullName,
        phone,
        city,
        address,
        notes,
        subtotal,
        shipping_fee AS shippingFee,
        total,
        payment_method AS paymentMethod,
        payment_reference AS paymentReference,
        payment_status AS paymentStatus,
        status,
        created_at AS createdAt
      FROM orders
      WHERE id = ? AND user_id = ?
      LIMIT 1
      `,
      [orderId, userId]
    );

    if (!orders.length) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

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
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = ?
      ORDER BY oi.id ASC
      `,
      [orderId]
    );

    const [history] = await db.query(
      `
      SELECT
        id,
        status,
        note,
        created_at AS createdAt
      FROM order_status_history
      WHERE order_id = ?
      ORDER BY created_at ASC, id ASC
      `,
      [orderId]
    );

    return res.status(200).json({
      success: true,
      order: {
        ...orders[0],
        items,
        history,
      },
    });
  } catch (error) {
    console.error("GET CUSTOMER ORDER DETAILS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load order details.",
    });
  }
};

// ==========================================
// EXPORT CONTROLLERS
// ==========================================

module.exports = {
  createOrder,
  updateOrderStatus,
  getMyOrders,
  getMyOrderHistory,
  getMyOrderById,
};
