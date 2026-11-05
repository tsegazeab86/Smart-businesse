
import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import api from "../../services/api";
import "./AdminNotifications.css";

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadNotifications() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/notifications", {
        params: { limit: 100 },
      });

      setNotifications(response.data.notifications || []);
      setUnreadCount(Number(response.data.unreadCount || 0));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Notifications could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }
useEffect(() => {
  async function fetchData() {
    await loadNotifications();
  }

  fetchData();
}, []);
  async function markAllRead() {
    try {
      await api.patch("/notifications/read-all");

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          isRead: 1,
          is_read: 1,
        }))
      );

      setUnreadCount(0);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not mark notifications as read."
      );
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <h1>
          <Bell size={25} style={{ marginRight: 10 }} />
          Notifications
        </h1>

        {unreadCount > 0 && (
          <button onClick={markAllRead}>
            <CheckCheck size={17} /> Mark all as read
          </button>
        )}
      </div>

      <p>{unreadCount} unread notifications</p>

      <button onClick={loadNotifications}>Refresh</button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {loading ? (
        <p>Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <p>No notifications yet.</p>
      ) : (
        notifications.map((item) => (
          <div
            key={item.id}
            style={{
              padding: 16,
              marginTop: 12,
              border: "1px solid #ddd",
              borderRadius: 10,
              background:
                Number(item.isRead ?? item.is_read) === 1
                  ? "#fff"
                  : "#eff6ff",
            }}
          >
            <strong>{item.title}</strong>
            <p>{item.message}</p>
            <small>
              {item.createdAt || item.created_at
                ? new Date(
                    item.createdAt || item.created_at
                  ).toLocaleString()
                : ""}
            </small>
          </div>
        ))
      )}
    </div>
  );
}
