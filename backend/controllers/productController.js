
const db = require("../config/db");

// =============================================
// GET ALL PRODUCTS
// Supports search, category, price, sorting,
// featured products, and pagination.
// =============================================

const getProducts = async (req, res) => {
  try {
    const {
      search = "",
      category = "",
      minPrice = "",
      maxPrice = "",
      sort = "newest",
      featured = "",
      page = "1",
      limit = "12",
    } = req.query;

    const pageNumber = Math.max(
      1,
      parseInt(page, 10) || 1
    );

    const limitNumber = Math.min(
      48,
      Math.max(1, parseInt(limit, 10) || 12)
    );

    const offset = (pageNumber - 1) * limitNumber;

    const conditions = ["p.is_active = 1"];
    const params = [];

    // SEARCH
    if (String(search).trim()) {
      conditions.push(
        "(p.name LIKE ? OR p.description LIKE ?)"
      );

      const term = `%${String(search).trim()}%`;
      params.push(term, term);
    }

    // CATEGORY FILTER
    if (String(category).trim()) {
      if (/^\d+$/.test(String(category))) {
        conditions.push("p.category_id = ?");
        params.push(Number(category));
      } else {
        conditions.push("c.name = ?");
        params.push(String(category).trim());
      }
    }

    // MINIMUM PRICE
    if (minPrice !== "") {
      const min = Number(minPrice);

      if (!Number.isFinite(min) || min < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid minimum price.",
        });
      }

      conditions.push("p.price >= ?");
      params.push(min);
    }

    // MAXIMUM PRICE
    if (maxPrice !== "") {
      const max = Number(maxPrice);

      if (!Number.isFinite(max) || max < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid maximum price.",
        });
      }

      conditions.push("p.price <= ?");
      params.push(max);
    }

    // VALIDATE PRICE RANGE
    if (
      minPrice !== "" &&
      maxPrice !== "" &&
      Number(minPrice) > Number(maxPrice)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Minimum price cannot exceed maximum price.",
      });
    }

    // FEATURED PRODUCTS
    if (featured === "true" || featured === "1") {
      conditions.push("p.is_featured = 1");
    }

    // SAFE SORTING OPTIONS
    const sorting = {
      newest: "p.created_at DESC, p.id DESC",
      oldest: "p.created_at ASC, p.id ASC",
      price_asc: "p.price ASC, p.id DESC",
      price_desc: "p.price DESC, p.id DESC",
      rating: "p.rating DESC, p.id DESC",
      name_asc: "p.name ASC, p.id ASC",
    };

    const orderBy =
      sorting[String(sort)] || sorting.newest;

    const whereClause = conditions.join(" AND ");

    // COUNT MATCHING PRODUCTS
    const [countRows] = await db.query(
      `
      SELECT COUNT(*) AS total
      FROM products p
      LEFT JOIN categories c
        ON c.id = p.category_id
      WHERE ${whereClause}
      `,
      params
    );

    const total = Number(countRows[0].total);
    const totalPages = Math.ceil(
      total / limitNumber
    );

    // FETCH PRODUCTS
    const [products] = await db.query(
      `
      SELECT
        p.id,
        p.category_id AS categoryId,
        c.name AS categoryName,
        p.name,
        p.description,
        p.price,
        p.stock,
        p.image,
        p.rating,
        p.badge,
        p.is_featured AS isFeatured,
        p.created_at AS createdAt
      FROM products p
      LEFT JOIN categories c
        ON c.id = p.category_id
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
      `,
      [...params, limitNumber, offset]
    );

    return res.status(200).json({
      success: true,
      products,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages,
        hasNextPage: pageNumber < totalPages,
        hasPreviousPage: pageNumber > 1,
      },
    });
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch products.",
    });
  }
};

// =============================================
// GET SINGLE PRODUCT BY ID
// =============================================

const getProductById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const [products] = await db.query(
      `
      SELECT
        p.*,
        c.name AS category
      FROM products p
      LEFT JOIN categories c
        ON c.id = p.category_id
      WHERE p.id = ?
        AND p.is_active = 1
      LIMIT 1
      `,
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    return res.status(200).json({
      success: true,
      product: products[0],
    });
  } catch (error) {
    console.error("GET PRODUCT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load product.",
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
};
