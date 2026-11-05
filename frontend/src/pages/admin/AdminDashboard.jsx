
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Package,
  RefreshCw,
  ShoppingBag,
  Eye,
  Users,
  Wallet,
} from "lucide-react";

import api from "../../services/api";
import useAuth from "../../hooks/useAuth";

import "./AdminDashboard.css";

// ==========================================
// FORMAT ETHIOPIAN BIRR
// ==========================================

const formatMoney = (value) =>
  `ETB ${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// ==========================================
// FORMAT DATE
// ==========================================

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
};

// ==========================================
// ADMIN DASHBOARD
// ==========================================

function AdminDashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmingId, setConfirmingId] = useState(null);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // ========================================
  // LOAD DASHBOARD DATA
  // ========================================

  const loadDashboard = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setError("");

        const [statsResponse, ordersResponse] =
          await Promise.all([
            api.get("/admin/stats"),
            api.get("/admin/orders"),
          ]);

        if (
          !statsResponse.data?.success ||
          !ordersResponse.data?.success
        ) {
          throw new Error(
            "Unable to load dashboard data."
          );
        }

        setStats(statsResponse.data.stats || null);

        // Use the latest five full order records.
        setOrders(
          (ordersResponse.data.orders || []).slice(0, 5)
        );
      } catch (err) {
        console.error(
          "ADMIN DASHBOARD ERROR:",
          err
        );

        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load admin dashboard."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  // ========================================
  // INITIAL LOAD
  // ========================================

useEffect(() => {
  let active = true;

  async function fetchInitialDashboard() {
    try {
      const [statsResponse, ordersResponse] =
        await Promise.all([
          api.get("/admin/stats"),
          api.get("/admin/orders"),
        ]);

      if (!active) return;

      if (
        !statsResponse.data?.success ||
        !ordersResponse.data?.success
      ) {
        throw new Error("Unable to load dashboard data.");
      }

      setStats(statsResponse.data.stats || null);

      setOrders(
        (ordersResponse.data.orders || []).slice(0, 5)
      );
    } catch (err) {
      if (!active) return;

      console.error("ADMIN DASHBOARD ERROR:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load admin dashboard."
      );
    } finally {
      if (active) {
        setLoading(false);
      }
    }
  }

  fetchInitialDashboard();

  return () => {
    active = false;
  };
}, []);

  // ========================================
  // CONFIRM PENDING ORDER
  // ========================================

  const confirmOrder = async (orderId) => {
    const confirmed = window.confirm(
      `Are you sure you want to confirm order #${orderId}?`
    );

    if (!confirmed) return;

    try {
      setConfirmingId(orderId);
      setError("");
      setNotice("");

      const { data } = await api.patch(
        `/admin/orders/${orderId}/status`,
        {
          status: "confirmed",
        }
      );

      if (!data?.success) {
        throw new Error(
          "Unable to confirm order."
        );
      }

      setNotice(
        `Order #${orderId} confirmed successfully.`
      );

      await loadDashboard(false);
    } catch (err) {
      console.error(
        "CONFIRM ORDER ERROR:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to confirm order."
      );
    } finally {
      setConfirmingId(null);
    }
  };

  // ========================================
  // STATISTICS CARDS
  // ========================================

  const statCards = [
    {
      title: "Total Orders",
      value: stats?.totalOrders ?? 0,
      icon: ShoppingBag,
    },
    {
      title: "Pending Orders",
      value: stats?.pendingOrders ?? 0,
      icon: Clock3,
    },
    {
      title: "Total Products",
      value: stats?.totalProducts ?? 0,
      icon: Package,
    },
    {
      title: "Customers",
      value: stats?.totalCustomers ?? 0,
      icon: Users,
    },
    {
      title: "Paid Revenue",
      value: formatMoney(stats?.paidRevenue),
      icon: Wallet,
    },
  ];

  return (
    <>
      {/* DASHBOARD HEADER */}

      <header className="admin-header">
        <div>
          <span className="admin-eyebrow">
            BUSINESS OVERVIEW
          </span>

          <h1>Admin Dashboard</h1>

          <p>
            Welcome back,{" "}
            <strong>
              {user?.fullName || "Administrator"}
            </strong>
            .
          </p>
        </div>

        <button
          type="button"
          className="admin-refresh-btn"
          onClick={() => loadDashboard(false)}
          disabled={loading || refreshing}
        >
          <RefreshCw
            size={17}
            className={
              refreshing ? "admin-spin" : ""
            }
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </header>

      {/* SUCCESS MESSAGE */}

      {notice && (
        <div
          className="admin-notice"
          role="status"
        >
          <CheckCircle2 size={19} />
          <span>{notice}</span>
        </div>
      )}

      {/* ERROR MESSAGE */}

      {error && (
        <div
          className="admin-error"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* LOADING */}

      {loading ? (
        <div className="admin-loading">
          <LoaderCircle
            size={34}
            className="admin-spin"
          />

          <p>Loading dashboard...</p>
        </div>
      ) : (
        <>
          {/* STATISTICS CARDS */}

          <div className="admin-stats-grid">
            {statCards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  className="admin-stat-card"
                  key={card.title}
                >
                  <div className="admin-stat-icon">
                    <Icon size={22} />
                  </div>

                  <span>{card.title}</span>

                  <strong>{card.value}</strong>
                </div>
              );
            })}
          </div>

          {/* RECENT ORDERS */}

          <section className="admin-orders-panel">
            <div className="admin-section-heading">
              <div>
                <h2>Recent Orders</h2>

                <p>
                  View and confirm the latest
                  customer orders.
                </p>
              </div>

              <Link
                to="/admin/orders"
                className="admin-order-count"
              >
                View All ({stats?.totalOrders ?? 0})
              </Link>
            </div>

            {orders.length === 0 ? (
              <div className="admin-empty">
                <ShoppingBag size={34} />

                <h3>No orders yet</h3>

                <p>
                  New customer orders will
                  appear here.
                </p>
              </div>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-orders-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Total</th>
                      <th>Payment</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        {/* ORDER ID */}

                        <td>
                          <strong>
                            #{order.id}
                          </strong>
                        </td>

                        {/* CUSTOMER */}

                        <td>
                          <div className="admin-customer">
                            <strong>
                              {order.fullName}
                            </strong>

                            <small>
                              {order.customerEmail || "—"}
                            </small>

                            <small>
                              {order.phone || "—"}
                            </small>

                            <small>
                              {order.city || "—"}
                            </small>
                          </div>
                        </td>

                        {/* DATE */}

                        <td>
                          {formatDate(
                            order.createdAt
                          )}
                        </td>

                        {/* TOTAL */}

                        <td>
                          <strong>
                            {formatMoney(
                              order.total
                            )}
                          </strong>
                        </td>

                        {/* PAYMENT */}

                        <td>
                          <div className="admin-payment">
                            <strong>
                              {order.paymentMethod || "—"}
                            </strong>

                            <span
                              className={`admin-badge ${
                                order.paymentStatus === "paid"
                                  ? "admin-badge-success"
                                  : "admin-badge-warning"
                              }`}
                            >
                              {order.paymentStatus || "pending"}
                            </span>
                          </div>
                        </td>

                        {/* ORDER STATUS */}

                        <td>
                          <span
                            className={`admin-badge admin-status-${order.status}`}
                          >
                            {order.status}
                          </span>
                        </td>

                        {/* ACTIONS */}

                        <td>
                          <div className="admin-order-actions">
                            <Link
                              to={`/admin/orders/${order.id}`}
                              className="admin-view-btn"
                            >
                              <Eye size={15} />
                              View Details
                            </Link>

                            {order.status === "pending" && (
                              <button
                                type="button"
                                className="admin-confirm-btn"
                                disabled={
                                  confirmingId !== null
                                }
                                onClick={() =>
                                  confirmOrder(order.id)
                                }
                              >
                                {confirmingId === order.id
                                  ? "Confirming..."
                                  : "Confirm"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}

export default AdminDashboard;
