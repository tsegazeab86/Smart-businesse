
const db = require("../config/db");

// =====================================
// HELPERS
// =====================================

const validId = (value) => {
  const id = Number(value);

  return Number.isSafeInteger(id) && id > 0
    ? id
    : null;
};

const validateProduct = (body) => {
  const {
    name,
    description,
    categoryId,
    price,
    stock,
    image,
  } = body || {};

  const cleanName =
    typeof name === "string" ? name.trim() : "";

  const cleanDescription =
    typeof description === "string"
      ? description.trim()
      : "";

  const cleanCategoryId = validId(categoryId);

  const cleanPrice = Number(price);
  const cleanStock = Number(stock);

  const cleanImage =
    typeof image === "string" ? image.trim() : "";

  if (cleanName.length < 2 || cleanName.length > 200) {
    return {
      error: "Product name must be between 2 and 200 characters.",
    };
  }

  if (cleanDescription.length > 10000) {
    return {
      error: "Description is too long.",
    };
  }

  if (!cleanCategoryId) {
    return {
      error: "Please select a valid product category.",
    };
  }

  if (
    price === "" ||
    price === null ||
    price === undefined ||
    !Number.isFinite(cleanPrice) ||
    cleanPrice <= 0 ||
    cleanPrice > 99999999.99 ||
    !/^\d+(\.\d{1,2})?$/.test(String(price))
  ) {
    return {
      error: "Enter a valid price with up to two decimal places.",
    };
  }

  if (
    stock === "" ||
    stock === null ||
    stock === undefined ||
    !Number.isSafeInteger(cleanStock) ||
    cleanStock < 0
  ) {
    return {
      error: "Stock must be a non-negative whole number.",
    };
  }

  if (cleanImage.length > 500) {
    return {
      error: "Image URL must not exceed 500 characters.",
    };
  }

  return {
    value: {
      name: cleanName,
      description: cleanDescription || null,
      categoryId: cleanCategoryId,
      price: cleanPrice,
      stock: cleanStock,
      image: cleanImage || null,
    },
  };
};

// =====================================
// GET SELLER PRODUCTS
// GET /api/seller/products
// =====================================

const getSellerProducts = async (req, res) => {
  try {
    const [products] = await db.query(
      `
      SELECT
        p.id,
        p.name,
        p.description,
        p.category_id AS categoryId,
        c.name AS categoryName,
        p.price,
        p.stock,
        p.image,
        p.is_active AS isActive,
        p.created_at AS createdAt
      FROM products p
      LEFT JOIN categories c
        ON c.id = p.category_id
      WHERE p.seller_id = ?
      ORDER BY p.created_at DESC, p.id DESC
      `,
      [req.seller.id]
    );

    return res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Get seller products error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load your products.",
    });
  }
};

// =====================================
// CREATE SELLER PRODUCT
// POST /api/seller/products
// =====================================

const createSellerProduct = async (req, res) => {
  const result = validateProduct(req.body);

  if (result.error) {
    return res.status(400).json({
      success: false,
      message: result.error,
    });
  }

  const {
    name,
    description,
    categoryId,
    price,
    stock,
    image,
  } = result.value;

  try {
    const [categories] = await db.query(
      "SELECT id FROM categories WHERE id = ? LIMIT 1",
      [categoryId]
    );

    if (!categories.length) {
      return res.status(400).json({
        success: false,
        message: "Selected category does not exist.",
      });
    }

    const [insert] = await db.query(
      `
      INSERT INTO products (
        seller_id,
        category_id,
        name,
        description,
        price,
        stock,
        image,
        is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      `,
      [
        req.seller.id,
        categoryId,
        name,
        description,
        price,
        stock,
        image,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Product created successfully.",
      productId: insert.insertId,
    });
  } catch (error) {
    console.error("Create seller product error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create product.",
    });
  }
};

// =====================================
// UPDATE SELLER PRODUCT
// PUT /api/seller/products/:id
// =====================================

const updateSellerProduct = async (req, res) => {
  const productId = validId(req.params.id);

  if (!productId) {
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

  const {
    name,
    description,
    categoryId,
    price,
    stock,
    image,
  } = result.value;

  try {
    const [categories] = await db.query(
      "SELECT id FROM categories WHERE id = ? LIMIT 1",
      [categoryId]
    );

    if (!categories.length) {
      return res.status(400).json({
        success: false,
        message: "Selected category does not exist.",
      });
    }

    const [update] = await db.query(
      `
      UPDATE products
      SET
        category_id = ?,
        name = ?,
        description = ?,
        price = ?,
        stock = ?,
        image = ?
      WHERE id = ?
        AND seller_id = ?
        AND is_active = 1
      `,
      [
        categoryId,
        name,
        description,
        price,
        stock,
        image,
        productId,
        req.seller.id,
      ]
    );

    if (update.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    return res.json({
      success: true,
      message: "Product updated successfully.",
    });
  } catch (error) {
    console.error("Update seller product error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update product.",
    });
  }
};

// =====================================
// DELETE SELLER PRODUCT
// DELETE /api/seller/products/:id
// =====================================

const deleteSellerProduct = async (req, res) => {
  const productId = validId(req.params.id);

  if (!productId) {
    return res.status(400).json({
      success: false,
      message: "Invalid product ID.",
    });
  }

  try {
    const [result] = await db.query(
      `
      UPDATE products
      SET is_active = 0
      WHERE id = ?
        AND seller_id = ?
        AND is_active = 1
      `,
      [productId, req.seller.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    return res.json({
      success: true,
      message: "Product deactivated successfully.",
    });
  } catch (error) {
    console.error("Delete seller product error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to deactivate product.",
    });
  }
};

// =====================================
// EXPORTS
// =====================================

module.exports = {
  getSellerProducts,
  createSellerProduct,
  updateSellerProduct,
  deleteSellerProduct,
};
