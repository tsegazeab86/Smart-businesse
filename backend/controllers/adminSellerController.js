
const db = require("../config/db");

// GET /api/admin/sellers
const getSellerApplications = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        sp.id,
        sp.user_id AS userId,
        u.full_name AS fullName,
        u.email,
        u.role,
        sp.store_name AS storeName,
        sp.store_description AS storeDescription,
        sp.phone,
        sp.city,
        sp.address,
        sp.approval_status AS approvalStatus,
        sp.created_at AS createdAt
      FROM seller_profiles sp
      INNER JOIN users u ON u.id = sp.user_id
      ORDER BY sp.created_at DESC, sp.id DESC
    `);

    return res.status(200).json({
      success: true,
      count: rows.length,
      sellers: rows
    });
  } catch (error) {
    console.error("Get seller applications error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load seller applications."
    });
  }
};

// PATCH /api/admin/sellers/:id/approve
const approveSeller = async (req, res) => {
  const sellerId = Number(req.params.id);

  if (!Number.isSafeInteger(sellerId) || sellerId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid seller application ID."
    });
  }

  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `SELECT sp.id, sp.user_id, sp.approval_status, u.role
       FROM seller_profiles sp
       INNER JOIN users u ON u.id = sp.user_id
       WHERE sp.id = ?
       FOR UPDATE`,
      [sellerId]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Seller application not found."
      });
    }

    const seller = rows[0];

    if (
      seller.approval_status !== "pending" ||
      seller.role !== "customer"
    ) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: "Only pending customer applications can be approved."
      });
    }

    await connection.query(
      `UPDATE seller_profiles
       SET approval_status = 'approved'
       WHERE id = ?`,
      [sellerId]
    );

    await connection.query(
      `UPDATE users
       SET role = 'seller'
       WHERE id = ?`,
      [seller.user_id]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Seller approved successfully."
    });
  } catch (error) {
    if (connection) await connection.rollback();

    console.error("Approve seller error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to approve seller."
    });
  } finally {
    if (connection) connection.release();
  }
};

// PATCH /api/admin/sellers/:id/reject
const rejectSeller = async (req, res) => {
  const sellerId = Number(req.params.id);

  if (!Number.isSafeInteger(sellerId) || sellerId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid seller application ID."
    });
  }

  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `SELECT sp.id, sp.user_id, sp.approval_status, u.role
       FROM seller_profiles sp
       INNER JOIN users u ON u.id = sp.user_id
       WHERE sp.id = ?
       FOR UPDATE`,
      [sellerId]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Seller application not found."
      });
    }

    const seller = rows[0];

    if (
      seller.approval_status !== "pending" ||
      seller.role !== "customer"
    ) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: "Only pending customer applications can be rejected."
      });
    }

    await connection.query(
      `UPDATE seller_profiles
       SET approval_status = 'rejected'
       WHERE id = ?`,
      [sellerId]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Seller application rejected."
    });
  } catch (error) {
    if (connection) await connection.rollback();

    console.error("Reject seller error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to reject seller application."
    });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  getSellerApplications,
  approveSeller,
  rejectSeller
};
