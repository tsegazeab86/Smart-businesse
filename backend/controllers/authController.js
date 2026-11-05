
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const createToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d"
    }
  );
};

const publicUser = (user) => ({
  id: user.id,
  fullName: user.full_name,
  email: user.email,
  role: user.role
});


// REGISTER
const register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (
      typeof fullName !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields."
      });
    }

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 2 || cleanName.length > 150) {
      return res.status(400).json({
        success: false,
        message: "Full name must be between 2 and 150 characters."
      });
    }

    if (
      cleanEmail.length > 190 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address."
      });
    }

    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({
        success: false,
        message: "Password must be between 8 and 72 characters."
      });
    }

    const [existing] = await db.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [cleanEmail]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "This email is already registered."
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await db.query(
      `INSERT INTO users (full_name, email, password_hash)
       VALUES (?, ?, ?)`,
      [cleanName, cleanEmail, passwordHash]
    );

    const user = {
      id: result.insertId,
      full_name: cleanName,
      email: cleanEmail,
      role: "customer"
    };

    const token = createToken(user);

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token,
      user: publicUser(user)
    });

  } catch (error) {
    console.error("Register error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "This email is already registered."
      });
    }

    return res.status(500).json({
      success: false,
      message: "Registration failed. Please try again."
    });
  }
};
const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
};
// LOGIN
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required."
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const [rows] = await db.query(
      `SELECT id, full_name, email, password_hash, role
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [cleanEmail]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    const user = rows[0];

    const validPassword = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    const token = createToken(user);

    return res.json({
      success: true,
      message: "Login successful.",
      token,
      user: publicUser(user)
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed. Please try again."
    });
  }
};

module.exports = {
  register,
  login,
  getMe
};
