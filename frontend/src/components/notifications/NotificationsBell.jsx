
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Bell,
  CheckCheck,
  Package,
  X,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./NotificationsBell.css";
function timeAgo(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const seconds = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 1000)
  );

  if (seconds < 60) return "Just now";

  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m ago`;
  }

  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)}h ago`;
  }

  if (seconds < 604800) {
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  return date.toLocaleDateString();
}

function isRead(notification) {
  return (
    Number(notification.isRead) === 1 ||
    notification.isRead === true
  );
}
export default function NotificationsBell({ adminMode = false }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const rootRef = useRef(null);
  const navigate = useNavigate();

  const loadNotifications = useCallback(
    async (showLoading = false) => {
      if (showLoading) setLoading(true);

      try {
        const response = await api.get(
          "/notifications",
          {
            params: { limit: 20 },
          }
        );

        const data = response.data;

        if (!data?.success) {
          throw new Error(
            data?.message ||
              "Could not load notifications."
          );
        }

        setItems(
          Array.isArray(data.notifications)
            ? data.notifications
            : []
        );

        setUnreadCount(
          Number(data.unreadCount || 0)
        );

        setError("");
      } catch (err) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Could not load notifications."
        );
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    []
  );


  // Close the dropdown when clicking outside or pressing Escape.
  useEffect(() => {
    function handlePointerDown(event) {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener(
      "pointerdown",
      handlePointerDown
    );

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  async function markRead(notification) {
    if (isRead(notification)) return true;

    try {
      await api.patch(
        `/notifications/${notification.id}/read`
      );

      setItems((current) =>
        current.map((item) =>
          item.id === notification.id
            ? { ...item, isRead: 1 }
            : item
        )
      );

      setUnreadCount((count) =>
        Math.max(0, count - 1)
      );

      return true;
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not mark notification as read."
      );

      return false;
    }
  }

  async function markAllRead() {
    try {
      await api.patch("/notifications/read-all");

      setItems((current) =>
        current.map((item) => ({
          ...item,
          isRead: 1,
        }))
      );

      setUnreadCount(0);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not update notifications."
      );
    }
  }

  async function openNotification(notification) {
    await markRead(notification);

    setOpen(false);
if (notification.orderId) {
  if (adminMode) {
    navigate(`/admin/orders/${notification.orderId}`);
  } else {
    navigate("/my-orders");
  }
}
  }

  return (
    <div
      className="notifications-root"
      ref={rootRef}
    >
      <button
        type="button"
        className={`notifications-trigger ${
          open ? "is-open" : ""
        }`}
        aria-label={`Notifications${
          unreadCount
            ? `, ${unreadCount} unread`
            : ""
        }`}
        aria-expanded={open}
        onClick={() => {
          const next = !open;
          setOpen(next);

          if (next) {
            loadNotifications(true);
          }
        }}
      >
        <Bell size={20} />

        {unreadCount > 0 && (
          <span className="notifications-badge">
            {unreadCount > 99
              ? "99+"
              : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <section
          className="notifications-panel"
          aria-label="Notifications"
        >
          <header className="notifications-header">
            <div>
              <h3>Notifications</h3>

              <p>
                {unreadCount
                  ? `${unreadCount} unread`
                  : "You're all caught up"}
              </p>
            </div>

            <div className="notifications-header-actions">
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="notifications-icon-button"
                  onClick={markAllRead}
                  title="Mark all as read"
                  aria-label="Mark all as read"
                >
                  <CheckCheck size={18} />
                </button>
              )}

              <button
                type="button"
                className="notifications-icon-button"
                onClick={() => setOpen(false)}
                title="Close"
                aria-label="Close notifications"
              >
                <X size={18} />
              </button>
            </div>
          </header>

          {error && (
            <div
              className="notifications-error"
              role="alert"
            >
              {error}
            </div>
          )}

          {loading ? (
            <div className="notifications-empty">
              Loading notifications...
            </div>
          ) : items.length === 0 ? (
            <div className="notifications-empty">
              <Bell size={25} />
              <strong>No notifications yet</strong>
              <span>
                Order updates will appear here.
              </span>
            </div>
          ) : (
            <ul className="notifications-list">
              {items.map((item) => {
                const unread = !isRead(item);

                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`notifications-item ${
                        unread ? "is-unread" : ""
                      }`}
                      onClick={() =>
                        openNotification(item)
                      }
                    >
                      <span className="notifications-item-icon">
                        <Package size={18} />
                      </span>

                      <span className="notifications-item-content">
                        <strong>{item.title}</strong>

                        <span>{item.message}</span>

                        <small>
                          {timeAgo(item.createdAt)}
                        </small>
                      </span>

                      {unread && (
                        <span
                          className="notifications-unread-dot"
                          aria-label="Unread"
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <footer className="notifications-footer">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
navigate(adminMode ? "/admin/notifications" : "/my-orders");
              }}
            >
              View my orders
            </button>
          </footer>
        </section>
      )}
    </div>
  );
}
