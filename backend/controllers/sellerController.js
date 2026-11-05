
const db = require("../config/db");

// POST /api/seller/apply
const applyAsSeller = async (req, res) => {
  try {
    const userId = req.user.id;

    if (req.user.role !== "customer") {
      return res.status(403).json({
        success: false,
        message: "Only customers can apply to become sellers."
      });
    }

    const {
      storeName,
      storeDescription,
      phone,
      city,
      address
    } = req.body || {};

    if (
      typeof storeName !== "string" ||
      typeof phone !== "string" ||
      typeof city !== "string" ||
      typeof address !== "string" ||
      (storeDescription != null &&
        typeof storeDescription !== "string")
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid store information."
      });
    }

    const cleanStoreName = storeName.trim();
    const cleanPhone = phone.trim();
    const cleanCity = city.trim();
    const cleanAddress = address.trim();
    const cleanDescription = (storeDescription || "").trim();

    if (
      cleanStoreName.length < 2 ||
      cleanStoreName.length > 200 ||
      cleanPhone.length < 7 ||
      cleanPhone.length > 30 ||
      cleanCity.length < 2 ||
      cleanCity.length > 100 ||
      cleanAddress.length < 5 ||
      cleanDescription.length > 5000
    ) {
      return res.status(400).json({
        success: false,
        message: "Please check the store information and try again."
      });
    }

    const [existing] = await db.query(
      `SELECT id, approval_status
       FROM seller_profiles
       WHERE user_id = ?
       LIMIT 1`,
      [userId]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "You already have a seller application.",
        approvalStatus: existing[0].approval_status
      });
    }

    const [result] = await db.query(
      `INSERT INTO seller_profiles
       (
         user_id,
         store_name,
         store_description,
         phone,
         city,
         address,
         approval_status
       )
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [
        userId,
        cleanStoreName,
        cleanDescription || null,
        cleanPhone,
        cleanCity,
        cleanAddress
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Seller application submitted successfully.",
      application: {
        id: result.insertId,
        storeName: cleanStoreName,
        approvalStatus: "pending"
      }
    });

  } catch (error) {
    console.error("Seller application error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "You already have a seller application."
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to submit seller application."
    });
  }
};

// GET /api/seller/application
const getMyApplication = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         id,
         store_name AS storeName,
         store_description AS storeDescription,
         phone,
         city,
         address,
         logo,
         approval_status AS approvalStatus,
         created_at AS createdAt,
         updated_at AS updatedAt
       FROM seller_profiles
       WHERE user_id = ?
       LIMIT 1`,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      application: rows[0] || null
    });

  } catch (error) {
    console.error("Get seller application error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load seller application."
    });
  }
};

module.exports = {
  applyAsSeller,
  getMyApplication
};
