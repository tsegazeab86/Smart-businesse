
const db = require("../config/db");

function getUserId(req) {
  return req.user?.id ??
    req.user?.user_id ??
    req.user?.userId;
}

// GET /api/notifications
async function getNotifications(req, res) {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User identity missing from token.",
      });
    }

    const parsedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isInteger(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 50)
      : 20;

    const [notifications] = await db.query(
      `SELECT
         id,
         type,
         title,
         message,
         order_id AS orderId,
         is_read AS isRead,
         created_at AS createdAt,
         read_at AS readAt
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT ?`,
      [userId, limit]
    );

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS unreadCount
       FROM notifications
       WHERE user_id = ? AND is_read = 0`,
      [userId]
    );

    return res.json({
      success: true,
      notifications,
      unreadCount: Number(
        countRows[0]?.unreadCount || 0
      ),
    });
  } catch (error) {
    console.error("getNotifications error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load notifications.",
    });
  }
}

// PATCH /api/notifications/:id/read
async function markNotificationRead(req, res) {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User identity missing from token.",
      });
    }

    const [result] = await db.query(
      `UPDATE notifications
       SET is_read = 1,
           read_at = COALESCE(
             read_at,
             CURRENT_TIMESTAMP
           )
       WHERE id = ? AND user_id = ?`,
      [req.params.id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    return res.json({
      success: true,
      message: "Notification marked as read.",
    });
  } catch (error) {
    console.error("markNotificationRead error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update notification.",
    });
  }
}

// PATCH /api/notifications/read-all
async function markAllNotificationsRead(req, res) {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User identity missing from token.",
      });
    }

    await db.query(
      `UPDATE notifications
       SET is_read = 1,
           read_at = COALESCE(
             read_at,
             CURRENT_TIMESTAMP
           )
       WHERE user_id = ? AND is_read = 0`,
      [userId]
    );

    return res.json({
      success: true,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    console.error(
      "markAllNotificationsRead error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update notifications.",
    });
  }
}

module.exports = {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
