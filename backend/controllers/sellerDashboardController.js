
const db = require("../config/db");

// ==========================================
// HELPER: GET SELLER PROFILE
// ==========================================

async function getSellerProfile(userId, executor = db) {
  const [rows] = await executor.execute(
    `SELECT
       id,
       user_id,
       store_name,
       store_description,
       phone,
       city,
       address,
       logo,
       approval_status
     FROM seller_profiles
     WHERE user_id = ?
     LIMIT 1`,
    [userId]
  );

  if (!rows.length) {
    const error = new Error("Seller profile not found.");
    error.statusCode = 404;
    throw error;
  }

  return rows[0];
}

// ==========================================
// 1. DASHBOARD STATISTICS
// ==========================================

exports.getDashboardStats = async (req, res, next) => {
  try {
    const seller = await getSellerProfile(req.user.id);

    // PRODUCT STATISTICS
    const [productRows] = await db.execute(
      `SELECT
         COUNT(*) AS totalProducts,

         COALESCE(
           SUM(
             CASE
               WHEN stock <= 0 THEN 1
               ELSE 0
             END
           ),
           0
         ) AS outOfStock

       FROM products
       WHERE seller_id = ?
         AND is_active = 1`,
      [seller.id]
    );

    // ORDER STATISTICS
    const [orderRows] = await db.execute(
      `SELECT
         COUNT(DISTINCT o.id) AS totalOrders,

         COUNT(
           DISTINCT CASE
             WHEN o.status = 'pending'
             THEN o.id
           END
         ) AS pendingOrders,

         COUNT(
           DISTINCT CASE
             WHEN o.status = 'delivered'
             THEN o.id
           END
         ) AS completedOrders,

         COALESCE(
           SUM(
             CASE
               WHEN o.status = 'delivered'
               THEN oi.line_total
               ELSE 0
             END
           ),
           0
         ) AS totalSales

       FROM orders o

       INNER JOIN order_items oi
         ON oi.order_id = o.id

       INNER JOIN products p
         ON p.id = oi.product_id

       WHERE p.seller_id = ?`,
      [seller.id]
    );

    const products = productRows[0];
    const orders = orderRows[0];

    return res.status(200).json({
      stats: {
        totalProducts: Number(products.totalProducts),
        totalOrders: Number(orders.totalOrders),
        pendingOrders: Number(orders.pendingOrders),
        completedOrders: Number(orders.completedOrders),
        totalSales: Number(orders.totalSales),
        outOfStock: Number(products.outOfStock),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. SALES REPORT
// ==========================================

exports.getSalesReport = async (req, res, next) => {
  try {
    const seller = await getSellerProfile(req.user.id);

    // MONTHLY SALES
    const [salesByMonth] = await db.execute(
      `SELECT
         DATE_FORMAT(
           o.created_at,
           '%Y-%m'
         ) AS month,

         COUNT(DISTINCT o.id) AS orders,

         COALESCE(
           SUM(oi.line_total),
           0
         ) AS sales

       FROM orders o

       INNER JOIN order_items oi
         ON oi.order_id = o.id

       INNER JOIN products p
         ON p.id = oi.product_id

       WHERE p.seller_id = ?
         AND o.status = 'delivered'

       GROUP BY
         DATE_FORMAT(o.created_at, '%Y-%m')

       ORDER BY month DESC

       LIMIT 12`,
      [seller.id]
    );

    // BEST-SELLING PRODUCTS
    const [bestSellers] = await db.execute(
      `SELECT
         p.id AS productId,
         p.name AS productName,

         COALESCE(
           SUM(oi.quantity),
           0
         ) AS unitsSold,

         COALESCE(
           SUM(oi.line_total),
           0
         ) AS sales

       FROM products p

       INNER JOIN order_items oi
         ON oi.product_id = p.id

       INNER JOIN orders o
         ON o.id = oi.order_id

       WHERE p.seller_id = ?
         AND o.status = 'delivered'

       GROUP BY p.id, p.name

       ORDER BY unitsSold DESC

       LIMIT 10`,
      [seller.id]
    );

    return res.status(200).json({
      report: {
        salesByMonth: salesByMonth.map((row) => ({
          month: row.month,
          orders: Number(row.orders),
          sales: Number(row.sales),
        })),

        bestSellers: bestSellers.map((row) => ({
          productId: row.productId,
          productName: row.productName,
          unitsSold: Number(row.unitsSold),
          sales: Number(row.sales),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. GET SELLER PROFILE
// ==========================================

exports.getSellerProfile = async (req, res, next) => {
  try {
    const seller = await getSellerProfile(req.user.id);

    const [users] = await db.execute(
      `SELECT
         id,
         full_name,
         email,
         role,
         is_active
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [req.user.id]
    );

    if (!users.length) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.status(200).json({
      profile: {
        ...users[0],

        store_name: seller.store_name,
        store_description: seller.store_description,
        phone: seller.phone,
        city: seller.city,
        address: seller.address,
        logo: seller.logo,
        approval_status: seller.approval_status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 4. UPDATE SELLER PROFILE
// ==========================================

exports.updateSellerProfile = async (req, res, next) => {
  let connection;
  let transactionStarted = false;

  try {
    const fullName = String(
      req.body?.full_name ?? ""
    ).trim();

    const storeName = String(
      req.body?.store_name ?? ""
    ).trim();

    // VALIDATION
    if (!fullName || !storeName) {
      return res.status(400).json({
        message:
          "Full name and store name are required.",
      });
    }

    if (fullName.length > 150) {
      return res.status(400).json({
        message:
          "Full name must not exceed 150 characters.",
      });
    }

    if (storeName.length > 200) {
      return res.status(400).json({
        message:
          "Store name must not exceed 200 characters.",
      });
    }

    // START TRANSACTION
    connection = await db.getConnection();

    await connection.beginTransaction();
    transactionStarted = true;

    const seller = await getSellerProfile(
      req.user.id,
      connection
    );

    // UPDATE USER
    await connection.execute(
      `UPDATE users
       SET full_name = ?
       WHERE id = ?`,
      [fullName, req.user.id]
    );

    // UPDATE STORE
    await connection.execute(
      `UPDATE seller_profiles
       SET store_name = ?
       WHERE id = ?`,
      [storeName, seller.id]
    );

    await connection.commit();
    transactionStarted = false;

    return res.status(200).json({
      message:
        "Seller profile updated successfully.",

      profile: {
        full_name: fullName,
        store_name: storeName,
        approval_status: seller.approval_status,
      },
    });
  } catch (error) {
    if (connection && transactionStarted) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(
          "Transaction rollback failed:",
          rollbackError
        );
      }
    }

    next(error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};
