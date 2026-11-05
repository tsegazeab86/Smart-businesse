
const db = require("../config/db");

const sellerOnly = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required."
      });
    }

    if (req.user.role !== "seller") {
      return res.status(403).json({
        success: false,
        message: "Seller access only."
      });
    }

    const [rows] = await db.query(
      `SELECT id, user_id, approval_status
       FROM seller_profiles
       WHERE user_id = ?
       LIMIT 1`,
      [req.user.id]
    );

    if (
      rows.length === 0 ||
      rows[0].approval_status !== "approved"
    ) {
      return res.status(403).json({
        success: false,
        message: "Seller account is not approved."
      });
    }

    req.seller = {
      id: rows[0].id,
      userId: rows[0].user_id
    };

    next();
  } catch (error) {
    console.error("Seller middleware error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify seller access."
    });
  }
};

module.exports = { sellerOnly };
