
const jwt = require("jsonwebtoken");
const db = require("../config/db");

// ==========================================
// 1. PROTECT - AUTHENTICATED USERS ONLY
// ==========================================

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Please login.",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is missing.",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Always get the latest user role from the database
    const [users] = await db.query(
      `SELECT
        id,
        full_name AS fullName,
        email,
        role,
        created_at AS createdAt
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists.",
      });
    }

    req.user = users[0];

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please login again.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    console.error("Auth Middleware Error:", error);

    return res.status(500).json({
      success: false,
      message: "Authentication failed.",
    });
  }
};

// ==========================================
// 2. ADMIN ONLY - ADMIN ACCESS CONTROL
// ==========================================

const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required.",
    });
  }

  next();
};

module.exports = {
  protect,
  adminOnly,
};
