
const db = require("../config/db");

function validateProduct(body) {
  const name = typeof body.name === "string"
    ? body.name.trim()
    : "";

  const description = typeof body.description === "string"
    ? body.description.trim()
    : "";

  const image = typeof body.image === "string"
    ? body.image.trim()
    : "";

  const badge = typeof body.badge === "string"
    ? body.badge.trim()
    : "";

  const categoryId = Number(body.categoryId);
  const price = Number(body.price);
  const stock = Number(body.stock);
  const rating = body.rating === "" || body.rating == null
    ? 0
    : Number(body.rating);

  if (!name || name.length > 200) {
    return { error: "Product name must be 1–200 characters." };
  }

  if (
    !Number.isSafeInteger(categoryId) ||
    categoryId < 1
  ) {
    return { error: "Please select a valid category." };
  }

  if (
    !Number.isFinite(price) ||
    price < 0 ||
    price > 99999999.99 ||
    Math.round(price * 100) / 100 !== price
  ) {
    return { error: "Enter a valid price with up to 2 decimals." };
  }

  if (
    !Number.isSafeInteger(stock) ||
    stock < 0 ||
    stock > 1000000
  ) {
    return { error: "Stock must be a valid non-negative integer." };
  }

  if (
    !Number.isFinite(rating) ||
    rating < 0 ||
    rating > 5 ||
    Math.round(rating * 10) / 10 !== rating
  ) {
    return { error: "Rating must be between 0 and 5." };
  }


if (image.length > 500 || badge.length > 50) {
  return { error: "Image URL or badge is too long." };
}

if (
  image &&
  !/^https?:\/\/\S+$/i.test(image) &&
  !image.startsWith("/images/") &&
  !/^\/uploads\/products\/[^/]+\.(jpg|jpeg|png|webp)$/i.test(image)
) {
  return {
    error:
      "Enter a valid image URL, /images/ path, or /uploads/products/ path.",
  };
}

  return {
    product: {
      name,
      description,
      categoryId,
      price: price.toFixed(2),
      stock,
      image,
      rating: rating.toFixed(1),
      badge,
      isFeatured:
        body.isFeatured === true ||
        body.isFeatured === 1 ||
        body.isFeatured === "1",
    },
  };
}

// GET /api/admin/products
async function getAdminProducts(req, res) {
  try {
    const [products] = await db.query(`
      SELECT
        p.*,
        c.name AS category
      FROM products p
      JOIN categories c ON c.id = p.category_id
      ORDER BY p.id DESC
    `);

    return res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("ADMIN GET PRODUCTS:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load admin products.",
    });
  }
}

// POST /api/admin/products
async function createProduct(req, res) {
  try {
    const result = validateProduct(req.body);

    if (result.error) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    const p = result.product;

    const [categories] = await db.query(
      "SELECT id FROM categories WHERE id = ? LIMIT 1",
      [p.categoryId]
    );

    if (categories.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Selected category does not exist.",
      });
    }

    const [insert] = await db.query(
      `INSERT INTO products (
        category_id,
        name,
        description,
        price,
        stock,
        image,
        rating,
        badge,
        is_featured,
        is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        p.categoryId,
        p.name,
        p.description,
        p.price,
        p.stock,
        p.image,
        p.rating,
        p.badge,
        p.isFeatured ? 1 : 0,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Product created successfully.",
      product: { id: insert.insertId, ...p },
    });
  } catch (error) {
    console.error("ADMIN CREATE PRODUCT:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create product.",
    });
  }
}

// PUT /api/admin/products/:id
async function updateProduct(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const result = validateProduct(req.body);

    if (result.error) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    const p = result.product;

    const [categories] = await db.query(
      "SELECT id FROM categories WHERE id = ? LIMIT 1",
      [p.categoryId]
    );

    if (categories.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Selected category does not exist.",
      });
    }

    const [update] = await db.query(
      `UPDATE products SET
        category_id = ?,
        name = ?,
        description = ?,
        price = ?,
        stock = ?,
        image = ?,
        rating = ?,
        badge = ?,
        is_featured = ?
       WHERE id = ? AND is_active = 1`,
      [
        p.categoryId,
        p.name,
        p.description,
        p.price,
        p.stock,
        p.image,
        p.rating,
        p.badge,
        p.isFeatured ? 1 : 0,
        id,
      ]
    );

    if (update.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Active product not found.",
      });
    }

    return res.json({
      success: true,
      message: "Product updated successfully.",
      product: { id, ...p },
    });
  } catch (error) {
    console.error("ADMIN UPDATE PRODUCT:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update product.",
    });
  }
}

// DELETE /api/admin/products/:id
// Soft delete: preserve historical order references
async function deleteProduct(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const [result] = await db.query(
      `UPDATE products
       SET is_active = 0, is_featured = 0
       WHERE id = ? AND is_active = 1`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Active product not found.",
      });
    }

    return res.json({
      success: true,
      message: "Product removed from the store.",
    });
  } catch (error) {
    console.error("ADMIN DELETE PRODUCT:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to remove product.",
    });
  }
}

module.exports = {
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};
