
const db = require("../config/db");

const getCategories = async (req, res) => {
  try {
    const [categories] = await db.query(`
      SELECT
        c.id,
        c.name,
        c.icon,
        COUNT(p.id) AS count
      FROM categories c
      LEFT JOIN products p
        ON c.id = p.category_id
      GROUP BY c.id, c.name, c.icon
      ORDER BY c.name ASC
    `);

    res.json({
      success: true,
      categories
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch categories"
    });
  }
};

module.exports = { getCategories };
