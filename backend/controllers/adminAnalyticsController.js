
const db = require("../config/db");

const isValidDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
};

const toNumber = (value) => Number(value || 0);

// GET /api/admin/analytics
async function getAdminAnalytics(req, res) {
  try {
    const { groupBy = "day" } = req.query;

    if (!["day", "week", "month"].includes(groupBy)) {
      return res.status(400).json({
        success: false,
        message: "groupBy must be day, week or month.",
      });
    }

    // Use MySQL's current date for consistent reporting.
    const [[defaults]] = await db.query(`
      SELECT
        DATE_FORMAT(
          DATE_SUB(CURDATE(), INTERVAL 29 DAY),
          '%Y-%m-%d'
        ) AS startDate,
        DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS endDate
    `);

    const startDate = req.query.startDate || defaults.startDate;
    const endDate = req.query.endDate || defaults.endDate;

    if (
      !isValidDate(startDate) ||
      !isValidDate(endDate) ||
      startDate > endDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid start and end date.",
      });
    }

    // Limit reporting to a maximum of 2 years.
    const difference =
      (Date.parse(`${endDate}T00:00:00Z`) -
        Date.parse(`${startDate}T00:00:00Z`)) /
      86400000;

    if (difference > 730) {
      return res.status(400).json({
        success: false,
        message: "Date range cannot exceed 731 days.",
      });
    }

    // Exclusive end date includes every time on the selected end day.
    const dateFilter = `
      created_at >= ?
      AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
    `;

    const dateParams = [startDate, endDate];

    // Whitelisted SQL expressions: never interpolate raw user input.
    const periodExpressions = {
      day: "DATE_FORMAT(created_at, '%Y-%m-%d')",
      week: `
        DATE_FORMAT(
          DATE_SUB(DATE(created_at), INTERVAL WEEKDAY(created_at) DAY),
          '%Y-%m-%d'
        )
      `,
      month: "DATE_FORMAT(created_at, '%Y-%m')",
    };

    const period = periodExpressions[groupBy];

    // Paid revenue excludes cancelled orders.
    const [monthlyRevenue] = await db.query(
      `
      SELECT
        ${period} AS month,
        COUNT(*) AS totalOrders,
        COALESCE(SUM(total), 0) AS revenue
      FROM orders
      WHERE ${dateFilter}
        AND payment_status = 'paid'
        AND status <> 'cancelled'
      GROUP BY month
      ORDER BY month ASC
      `,
      dateParams
    );

    // All order statuses within the selected period.
    const [orderStatuses] = await db.query(
      `
      SELECT
        status,
        COUNT(*) AS total
      FROM orders
      WHERE ${dateFilter}
      GROUP BY status
      ORDER BY total DESC
      `,
      dateParams
    );

    // Orders trend, including unpaid and cancelled orders.
    const [ordersTrend] = await db.query(
      `
      SELECT
        ${period} AS month,
        COUNT(*) AS totalOrders
      FROM orders
      WHERE ${dateFilter}
      GROUP BY month
      ORDER BY month ASC
      `,
      dateParams
    );

    // Payment methods and paid revenue.
    const [paymentMethods] = await db.query(
      `
      SELECT
        COALESCE(payment_method, 'unknown') AS method,
        COUNT(*) AS totalOrders,
        COALESCE(
          SUM(
            CASE
              WHEN payment_status = 'paid'
                AND status <> 'cancelled'
              THEN total
              ELSE 0
            END
          ),
          0
        ) AS paidRevenue
      FROM orders
      WHERE ${dateFilter}
      GROUP BY payment_method
      ORDER BY totalOrders DESC
      `,
      dateParams
    );

    // Top products: based on non-cancelled order items.
    const [topProducts] = await db.query(
      `
      SELECT
        oi.product_id AS productId,
        MAX(oi.product_name) AS productName,
        SUM(oi.quantity) AS unitsSold,
        COALESCE(SUM(oi.line_total), 0) AS orderValue,
        COUNT(DISTINCT oi.order_id) AS orderCount
      FROM order_items oi
      INNER JOIN orders o ON o.id = oi.order_id
      WHERE o.created_at >= ?
        AND o.created_at < DATE_ADD(?, INTERVAL 1 DAY)
        AND o.status <> 'cancelled'
      GROUP BY oi.product_id
      ORDER BY unitsSold DESC, orderValue DESC
      LIMIT 5
      `,
      dateParams
    );

    // Summary statistics.
    const [[summary]] = await db.query(
      `
      SELECT
        COUNT(*) AS totalOrders,

        COALESCE(
          SUM(CASE WHEN payment_status = 'paid'
            AND status <> 'cancelled' THEN 1 ELSE 0 END),
          0
        ) AS paidOrders,

        COALESCE(
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END),
          0
        ) AS cancelledOrders,

        COALESCE(
          SUM(CASE WHEN payment_status = 'paid'
            AND status <> 'cancelled' THEN total ELSE 0 END),
          0
        ) AS paidRevenue

      FROM orders
      WHERE ${dateFilter}
      `,
      dateParams
    );

    return res.json({
      success: true,

      filters: {
        startDate,
        endDate,
        groupBy,
      },

      analytics: {
        summary: {
          totalOrders: toNumber(summary.totalOrders),
          paidOrders: toNumber(summary.paidOrders),
          cancelledOrders: toNumber(summary.cancelledOrders),
          paidRevenue: toNumber(summary.paidRevenue),
        },

        monthlyRevenue: monthlyRevenue.map((row) => ({
          month: row.month,
          totalOrders: toNumber(row.totalOrders),
          revenue: toNumber(row.revenue),
        })),

        orderStatuses: orderStatuses.map((row) => ({
          status: row.status,
          total: toNumber(row.total),
        })),

        ordersTrend: ordersTrend.map((row) => ({
          month: row.month,
          totalOrders: toNumber(row.totalOrders),
        })),

        paymentMethods: paymentMethods.map((row) => ({
          method: row.method,
          totalOrders: toNumber(row.totalOrders),
          paidRevenue: toNumber(row.paidRevenue),
        })),

        topProducts: topProducts.map((row) => ({
          productId: toNumber(row.productId),
          productName: row.productName,
          unitsSold: toNumber(row.unitsSold),
          orderValue: toNumber(row.orderValue),
          orderCount: toNumber(row.orderCount),
        })),
      },
    });
  } catch (error) {
    console.error("ADMIN ANALYTICS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load analytics.",
    });
  }
}

module.exports = {
  getAdminAnalytics,
};
