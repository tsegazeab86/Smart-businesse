
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  ShoppingBag,
  Eye,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import api from "../../services/api";
import "./AdminOrders.css";

const nextStatus = {
  pending: "confirmed",
  confirmed: "shipped",
  shipped: "delivered",
};

const formatMoney = (value) =>
  `ETB ${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString("en-ET", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadOrders = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const { data } = await api.get("/admin/orders");

      if (!data?.success || !Array.isArray(data.orders)) {
        throw new Error("Invalid orders response.");
      }

      setOrders(data.orders);
    } catch (err) {
      console.error("ADMIN ORDERS ERROR:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load orders."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


useEffect(() => {
  let active = true;

  async function fetchOrders() {
    try {
      const { data } = await api.get("/admin/orders");

      if (!active) return;

      if (!data?.success || !Array.isArray(data.orders)) {
        throw new Error("Invalid orders response.");
      }

      setOrders(data.orders);
    } catch (err) {
      if (!active) return;

      console.error("ADMIN ORDERS ERROR:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load orders."
      );
    } finally {
      if (active) {
        setLoading(false);
      }
    }
  }

  fetchOrders();

  return () => {
    active = false;
  };
}, []);

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "all" ||
        order.status === statusFilter;

      const searchableText = [
        order.id,
        order.fullName,
        order.customerEmail,
        order.phone,
        order.city,
      ]
        .filter((value) => value != null)
        .join(" ")
        .toLowerCase();

      return matchesStatus && searchableText.includes(term);
    });
  }, [orders, search, statusFilter]);

  const updateStatus = async (order) => {
    const next = nextStatus[order.status];

    if (!next || updatingId !== null) return;

    const confirmed = window.confirm(
      `Change order #${order.id} from ${order.status} to ${next}?`
    );

    if (!confirmed) return;

    try {
      setUpdatingId(order.id);
      setError("");
      setMessage("");

      const { data } = await api.patch(
        `/admin/orders/${order.id}/status`,
        { status: next }
      );

      if (!data?.success) {
        throw new Error("Unable to update order.");
      }

      setOrders((previous) =>
        previous.map((item) =>
          item.id === order.id
            ? { ...item, status: data.order.status }
            : item
        )
      );

      setMessage(data.message || "Order updated successfully.");
    } catch (err) {
      console.error("UPDATE ORDER ERROR:", err);

      setError(
        err.response?.data?.message ||
          "Unable to update order status. Refresh and try again."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <main className="ao-page">
      <div className="ao-container">
        <header className="ao-header">
          <div>
            <span className="ao-eyebrow">
              ADMINISTRATION
            </span>

            <h1>
              <ShoppingBag size={29} />
              Manage Orders
            </h1>

            <p>
              View customer orders and manage their progress.
            </p>
          </div>

          <button
            type="button"
            className="ao-refresh"
            onClick={() => loadOrders(true)}
            disabled={loading || refreshing || updatingId !== null}
          >
            <RefreshCw size={17} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        <section className="ao-summary">
          <div>
            <span>Total Orders</span>
            <strong>{orders.length}</strong>
          </div>

          <div>
            <span>Pending</span>
            <strong>
              {orders.filter((o) => o.status === "pending").length}
            </strong>
          </div>

          <div>
            <span>Shipped</span>
            <strong>
              {orders.filter((o) => o.status === "shipped").length}
            </strong>
          </div>

          <div>
            <span>Delivered</span>
            <strong>
              {orders.filter((o) => o.status === "delivered").length}
            </strong>
          </div>
        </section>

        {error && (
          <div className="ao-alert ao-error" role="alert">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {message && (
          <div className="ao-alert ao-success" role="status">
            {message}
          </div>
        )}

        <section className="ao-panel">
          <div className="ao-toolbar">
            <div className="ao-search">
              <Search size={18} />

              <input
                type="search"
                placeholder="Search order, customer, email..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              aria-label="Filter orders by status"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {loading ? (
            <div className="ao-empty">Loading orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="ao-empty">
              <ShoppingBag size={42} />
              <h3>No orders found</h3>
              <p>Try changing your search or status filter.</p>
            </div>
          ) : (
            <div className="ao-table-wrap">
              <table className="ao-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.map((order) => {
                    const next = nextStatus[order.status];

                    return (
                      <tr key={order.id}>
                        <td>
                          <strong>#{order.id}</strong>
                        </td>

                        <td>
                          <strong>{order.fullName}</strong>
                          <small>{order.customerEmail || "—"}</small>
                          <small>{order.phone || "—"}</small>
                        </td>

                        <td>{formatDate(order.createdAt)}</td>

                        <td className="ao-money">
                          {formatMoney(order.total)}
                        </td>

                        <td>
                          <span className="ao-payment">
                            {order.paymentStatus || "pending"}
                          </span>
                          <small>{order.paymentMethod || "—"}</small>
                        </td>

                        <td>
                          <span
                            className={`ao-status ao-status-${order.status}`}
                          >
                            {order.status}
                          </span>
                        </td>

                        <td>
                          <div className="ao-actions">
                            <Link
                              to={`/admin/orders/${order.id}`}
                              className="ao-view"
                            >
                              <Eye size={16} />
                              View
                            </Link>

                            {next && (
                              <button
                                type="button"
                                className="ao-next"
                                disabled={updatingId !== null}
                                onClick={() => updateStatus(order)}
                              >
                                {updatingId === order.id
                                  ? "Updating..."
                                  : `Mark ${next}`}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
