
const db = require("../config/db");

const validId = (value) =>
  /^[1-9]\d*$/.test(String(value));

const formatCustomer = (row) => ({
  id: Number(row.id),
  fullName: row.fullName,
  email: row.email,
  isActive: Boolean(Number(row.isActive)),
  createdAt: row.createdAt,
  phone: row.phone || "",
  city: row.city || "",
  totalOrders: Number(row.totalOrders || 0),
  totalSpent: Number(row.totalSpent || 0),
});

// GET /api/admin/customers
async function getAdminCustomers(req, res) {
  try {
    const search = String(req.query.search || "").trim();

    if (search.length > 150) {
      return res.status(400).json({
        success: false,
        message: "Search text is too long.",
      });
    }

    const [rows] = await db.query(
      `
      SELECT
        u.id,
        u.full_name AS fullName,
        u.email,
        u.is_active AS isActive,
        u.created_at AS createdAt,

        (
          SELECT o.phone
          FROM orders o
          WHERE o.user_id = u.id
          ORDER BY o.created_at DESC, o.id DESC
          LIMIT 1
        ) AS phone,

        (
          SELECT o.city
          FROM orders o
          WHERE o.user_id = u.id
          ORDER BY o.created_at DESC, o.id DESC
          LIMIT 1
        ) AS city,

        COUNT(o.id) AS totalOrders,

        COALESCE(
          SUM(
            CASE
              WHEN o.payment_status = 'paid'
                AND o.status <> 'cancelled'
              THEN o.total
              ELSE 0
            END
          ), 0
        ) AS totalSpent

      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id

      WHERE u.role = 'customer'
        AND (
          ? = ''
          OR u.full_name LIKE ?
          OR u.email LIKE ?
          OR EXISTS (
            SELECT 1
            FROM orders so
            WHERE so.user_id = u.id
              AND so.phone LIKE ?
          )
        )

      GROUP BY
        u.id,
        u.full_name,
        u.email,
        u.is_active,
        u.created_at

      ORDER BY u.created_at DESC, u.id DESC
      `,
      [
        search,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
      ]
    );

    return res.json({
      success: true,
      customers: rows.map(formatCustomer),
    });
  } catch (error) {
    console.error("GET CUSTOMERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load customers.",
    });
  }
}

// GET /api/admin/customers/:id
async function getAdminCustomerById(req, res) {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID.",
      });
    }

    const [customers] = await db.query(
      `
      SELECT
        id,
        full_name AS fullName,
        email,
        is_active AS isActive,
        created_at AS createdAt
      FROM users
      WHERE id = ? AND role = 'customer'
      LIMIT 1
      `,
      [req.params.id]
    );

    if (!customers.length) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    const [orders] = await db.query(
      `
      SELECT
        id,
        full_name AS fullName,
        phone,
        city,
        address,
        notes,
        subtotal,
        shipping_fee AS shippingFee,
        total,
        payment_method AS paymentMethod,
        payment_status AS paymentStatus,
        payment_reference AS paymentReference,
        status,
        created_at AS createdAt
      FROM orders
      WHERE user_id = ?
      ORDER BY created_at DESC, id DESC
      `,
      [req.params.id]
    );

    const totalSpent = orders.reduce(
      (sum, order) =>
        sum +
        (order.paymentStatus === "paid" &&
        order.status !== "cancelled"
          ? Number(order.total)
          : 0),
      0
    );

    return res.json({
      success: true,
      customer: {
        ...formatCustomer({
          ...customers[0],
          totalOrders: orders.length,
          totalSpent,
          phone: orders[0]?.phone,
          city: orders[0]?.city,
        }),
        orders: orders.map((order) => ({
          ...order,
          subtotal: Number(order.subtotal),
          shippingFee: Number(order.shippingFee),
          total: Number(order.total),
        })),
      },
    });
  } catch (error) {
    console.error("GET CUSTOMER DETAILS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load customer details.",
    });
  }
}

// PATCH /api/admin/customers/:id/status
async function updateCustomerStatus(req, res) {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID.",
      });
    }

    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false.",
      });
    }

    const [result] = await db.query(
      `
      UPDATE users
      SET is_active = ?
      WHERE id = ? AND role = 'customer'
      `,
      [isActive ? 1 : 0, req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    return res.json({
      success: true,
      message: isActive
        ? "Customer activated successfully."
        : "Customer deactivated successfully.",
    });
  } catch (error) {
    console.error("UPDATE CUSTOMER STATUS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update customer status.",
    });
  }
}

module.exports = {
  getAdminCustomers,
  getAdminCustomerById,
  updateCustomerStatus,
};
