
const db = require("../config/db");

// GET /api/admin/categories
const getAdminCategories = async (req, res) => {
  try {
    const [categories] = await db.query(`
      SELECT
        c.id,
        c.name,
        c.icon,
        c.created_at,
        COUNT(p.id) AS productCount
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id, c.name, c.icon, c.created_at
      ORDER BY c.id DESC
    `);

    res.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error("GET ADMIN CATEGORIES:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load categories.",
    });
  }
};

// POST /api/admin/categories
const createCategory = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const icon = String(req.body.icon || "🛍️").trim();

    if (!name || name.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Category name must contain 1–100 characters.",
      });
    }

    if (!icon || [...icon].length > 10) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid category icon.",
      });
    }

    const [existing] = await db.query(
      "SELECT id FROM categories WHERE name = ? LIMIT 1",
      [name]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "This category already exists.",
      });
    }

    const [result] = await db.query(
      "INSERT INTO categories (name, icon) VALUES (?, ?)",
      [name, icon]
    );

    res.status(201).json({
      success: true,
      message: "Category created successfully.",
      category: {
        id: result.insertId,
        name,
        icon,
      },
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "This category already exists.",
      });
    }

    console.error("CREATE CATEGORY:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create category.",
    });
  }
};

// PUT /api/admin/categories/:id
const updateCategory = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const name = String(req.body.name || "").trim();
    const icon = String(req.body.icon || "🛍️").trim();

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID.",
      });
    }

    if (!name || name.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Category name must contain 1–100 characters.",
      });
    }

    if (!icon || [...icon].length > 10) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid category icon.",
      });
    }

    const [result] = await db.query(
      "UPDATE categories SET name = ?, icon = ? WHERE id = ?",
      [name, icon, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    res.json({
      success: true,
      message: "Category updated successfully.",
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "This category name already exists.",
      });
    }

    console.error("UPDATE CATEGORY:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update category.",
    });
  }
};

// DELETE /api/admin/categories/:id
const deleteCategory = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID.",
      });
    }

    // Do not delete a category containing products.
    const [products] = await db.query(
      "SELECT COUNT(*) AS total FROM products WHERE category_id = ?",
      [id]
    );

    if (Number(products[0].total) > 0) {
      return res.status(409).json({
        success: false,
        message:
          "This category contains products. Move its products to another category before deleting it.",
      });
    }

    const [result] = await db.query(
      "DELETE FROM categories WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    res.json({
      success: true,
      message: "Category deleted successfully.",
    });
  } catch (error) {
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({
        success: false,
        message:
          "This category is still used by products and cannot be deleted.",
      });
    }

    console.error("DELETE CATEGORY:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete category.",
    });
  }
};

module.exports = {
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
