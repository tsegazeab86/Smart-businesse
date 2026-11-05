
const db = require("../config/db");

const getAdminSettings = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
        id,
        store_name,
        email,
        phone,
        address,
        currency,
        shipping_fee,
        maintenance_mode,
        updated_at
       FROM store_settings
       WHERE id = 1`
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Store settings not found.",
      });
    }

    return res.json(rows[0]);
  } catch (error) {
    console.error("Get admin settings error:", error);

    return res.status(500).json({
      message: "Failed to load store settings.",
    });
  }
};

const updateAdminSettings = async (req, res) => {
  try {
    const {
      store_name,
      email,
      phone,
      address,
      currency,
      shipping_fee,
      maintenance_mode,
    } = req.body;

    if (
      typeof store_name !== "string" ||
      !store_name.trim() ||
      typeof email !== "string" ||
      typeof phone !== "string"
    ) {
      return res.status(400).json({
        message: "Store name, email, and phone are required.",
      });
    }

    const allowedCurrencies = ["ETB", "USD", "EUR", "GBP"];

    if (!allowedCurrencies.includes(currency)) {
      return res.status(400).json({
        message: "Unsupported currency.",
      });
    }

    const parsedShippingFee = Number(shipping_fee);

    if (
      !Number.isFinite(parsedShippingFee) ||
      parsedShippingFee < 0
    ) {
      return res.status(400).json({
        message: "Shipping fee must be a valid non-negative number.",
      });
    }

    if (typeof maintenance_mode !== "boolean") {
      return res.status(400).json({
        message: "Maintenance mode must be true or false.",
      });
    }

    await db.query(
      `INSERT INTO store_settings (
        id,
        store_name,
        email,
        phone,
        address,
        currency,
        shipping_fee,
        maintenance_mode
      )
      VALUES (1, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        store_name = VALUES(store_name),
        email = VALUES(email),
        phone = VALUES(phone),
        address = VALUES(address),
        currency = VALUES(currency),
        shipping_fee = VALUES(shipping_fee),
        maintenance_mode = VALUES(maintenance_mode)`,
      [
        store_name.trim(),
        email.trim(),
        phone.trim(),
        typeof address === "string" ? address.trim() : "",
        currency,
        parsedShippingFee,
        maintenance_mode ? 1 : 0,
      ]
    );

    const [rows] = await db.query(
      `SELECT
        id,
        store_name,
        email,
        phone,
        address,
        currency,
        shipping_fee,
        maintenance_mode,
        updated_at
       FROM store_settings
       WHERE id = 1`
    );

    return res.json({
      message: "Settings saved successfully.",
      settings: rows[0],
    });
  } catch (error) {
    console.error("Update admin settings error:", error);

    return res.status(500).json({
      message: "Failed to save store settings.",
    });
  }
};

module.exports = {
  getAdminSettings,
  updateAdminSettings,
};
