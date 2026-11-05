
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  LoaderCircle,
  MapPin,
  Package,
  RefreshCw,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";

import api from "../services/api";
import OrderTracking from "../components/OrderTracking";
import OrderStatusHistory from "../components/OrderStatusHistory";

import "./MyOrders.css";

const formatMoney = (amount) =>
  `ETB ${Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const paymentLabels = {
  cash_on_delivery: "Cash on Delivery",
  telebirr: "Telebirr",
  bank_transfer: "Bank Transfer",
};

const statusIcons = {
  pending: Clock3,
  confirmed: CheckCircle2,
  shipped: Truck,
  delivered: CheckCircle2,
  cancelled: XCircle,
};

async function fetchOrderHistories(orders) {
  const results = await Promise.all(
    orders.map(async (order) => {
      try {
        const { data } = await api.get(
          `/orders/${order.id}/history`
        );

        return [
          order.id,
          {
            history: Array.isArray(data.history)
              ? data.history
              : [],
            error: "",
          },
        ];
      } catch (error) {
        console.error(
          `ORDER #${order.id} HISTORY ERROR:`,
          error
        );

        return [
          order.id,
          {
            history: [],
            error: "Unable to load this order's history.",
          },
        ];
      }
    })
  );

  return Object.fromEntries(results);
}

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [historyByOrder, setHistoryByOrder] = useState({});

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [error, setError] = useState("");

  const loadOrders = useCallback(async (initial = false) => {
    try {
      if (initial) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const { data } = await api.get("/orders/my");

      const latestOrders = Array.isArray(data.orders)
        ? data.orders
        : [];

      setOrders(latestOrders);

      setHistoryLoading(true);

      const histories = await fetchOrderHistories(latestOrders);

      setHistoryByOrder(histories);
    } catch (err) {
      console.error("LOAD MY ORDERS:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load your orders. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
      setHistoryLoading(false);
    }
  }, []);


useEffect(() => {
  let active = true;

  async function fetchInitialOrders() {
    try {
      const { data } = await api.get("/orders/my");

      if (!active) return;

      const latestOrders = Array.isArray(data.orders)
        ? data.orders
        : [];

      setOrders(latestOrders);

      // Fetch status histories after loading orders
      const histories = await fetchOrderHistories(latestOrders);

      if (!active) return;

      setHistoryByOrder(histories);
      setError("");
    } catch (err) {
      if (!active) return;

      console.error("INITIAL MY ORDERS ERROR:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load your orders."
      );
    } finally {
      if (active) {
        setLoading(false);
      }
    }
  }

  fetchInitialOrders();

  return () => {
    active = false;
  };
}, []);

  const totalOrders = orders.length;

  const activeOrders = orders.filter((order) =>
    ["pending", "confirmed", "shipped"].includes(order.status)
  ).length;

  const deliveredOrders = orders.filter(
    (order) => order.status === "delivered"
  ).length;

  return (
    <main className="mo-page">
      <div className="mo-container">
        {/* BACK NAVIGATION */}
        <Link to="/" className="mo-back-link">
          <ArrowLeft size={17} />
          Back to Store
        </Link>

        {/* HEADER */}
        <header className="mo-header">
          <div>
            <span className="mo-eyebrow">
              YOUR SHOPPING JOURNEY
            </span>

            <h1>My Orders</h1>

            <p>
              View your purchases and track their delivery progress.
            </p>
          </div>

          <button
            type="button"
            className="mo-refresh-btn"
            onClick={() => loadOrders(false)}
            disabled={loading || refreshing}
          >
            <RefreshCw
              size={17}
              className={refreshing ? "mo-spin" : ""}
            />

            {refreshing ? "Refreshing..." : "Refresh Orders"}
          </button>
        </header>

        {loading ? (
          <div className="mo-state-card">
            <LoaderCircle size={37} className="mo-spin" />
            <h2>Loading your orders...</h2>
            <p>Please wait a moment.</p>
          </div>
        ) : (
          <>
            {/* ERROR */}
            {error && (
              <div className="mo-error" role="alert">
                <XCircle size={20} />

                <div>
                  <strong>Something went wrong</strong>
                  <p>{error}</p>
                </div>

                <button
                  type="button"
                  onClick={() => loadOrders(false)}
                  disabled={refreshing}
                >
                  Try Again
                </button>
              </div>
            )}

            {/* SUMMARY */}
            <div className="mo-stats">
              <div className="mo-stat-card">
                <div className="mo-stat-icon mo-stat-blue">
                  <ShoppingBag size={21} />
                </div>

                <div>
                  <span>Total Orders</span>
                  <strong>{totalOrders}</strong>
                </div>
              </div>

              <div className="mo-stat-card">
                <div className="mo-stat-icon mo-stat-orange">
                  <Truck size={21} />
                </div>

                <div>
                  <span>Active Orders</span>
                  <strong>{activeOrders}</strong>
                </div>
              </div>

              <div className="mo-stat-card">
                <div className="mo-stat-icon mo-stat-green">
                  <CheckCircle2 size={21} />
                </div>

                <div>
                  <span>Delivered</span>
                  <strong>{deliveredOrders}</strong>
                </div>
              </div>
            </div>

            {/* EMPTY STATE */}
            {!error && orders.length === 0 && (
              <div className="mo-state-card mo-empty">
                <div className="mo-empty-icon">
                  <Package size={34} />
                </div>

                <h2>No orders yet</h2>

                <p>
                  You haven't placed any orders yet. Explore our
                  products and start shopping.
                </p>

                <Link to="/products" className="mo-shop-btn">
                  Explore Products
                  <ArrowRight size={17} />
                </Link>
              </div>
            )}

            {/* ORDERS LIST */}
            {orders.length > 0 && (
              <section className="mo-orders-section">
                <div className="mo-section-heading">
                  <div>
                    <h2>Order History</h2>
                    <p>Your recent and previous purchases</p>
                  </div>

                  <span className="mo-order-count">
                    {totalOrders} Orders
                  </span>
                </div>

                <div className="mo-orders-list">
                  {orders.map((order) => {
                    const StatusIcon =
                      statusIcons[order.status] || Package;

                    const historyInfo =
                      historyByOrder[order.id];

                    return (
                      <article
                        className="mo-order-card"
                        key={order.id}
                      >
                        {/* ORDER HEADER */}
                        <div className="mo-order-header">
                          <div className="mo-order-identity">
                            <div className="mo-order-icon">
                              <ShoppingBag size={21} />
                            </div>

                            <div>
                              <h3>Order #{order.id}</h3>

                              <span>
                                <CalendarDays size={14} />
                                {formatDate(
                                  order.createdAt ||
                                    order.created_at
                                )}
                              </span>
                            </div>
                          </div>

                          <span
                            className={`mo-status mo-status-${order.status}`}
                          >
                            <StatusIcon size={15} />
                            {order.status}
                          </span>
                        </div>

                        {/* ORDER INFORMATION */}
                        <div className="mo-order-info">
                          <div className="mo-info-item">
                            <span>Order Total</span>

                            <strong className="mo-total">
                              {formatMoney(order.total)}
                            </strong>
                          </div>

                          <div className="mo-info-item">
                            <span>Payment Method</span>

                            <strong>
                              <CreditCard size={15} />
                              {paymentLabels[
                                order.paymentMethod ||
                                  order.payment_method
                              ] || "—"}
                            </strong>
                          </div>

                          <div className="mo-info-item">
                            <span>Payment Status</span>

                            <span
                              className={`mo-payment-badge ${
                                (order.paymentStatus ||
                                  order.payment_status) === "paid"
                                  ? "mo-payment-paid"
                                  : "mo-payment-pending"
                              }`}
                            >
                              {(order.paymentStatus ||
                                order.payment_status) === "paid"
                                ? "Paid"
                                : "Pending"}
                            </span>
                          </div>

                          <div className="mo-info-item">
                            <span>Delivery City</span>

                            <strong>
                              <MapPin size={15} />
                              {order.city || "—"}
                            </strong>
                          </div>
                        </div>

                        {/* TRACKING */}
                        <div className="mo-tracking-section">
                          <OrderTracking status={order.status} />
                        </div>

                        {/* STATUS HISTORY */}
                        <div className="mo-history-section">
                          <h4>Status History</h4>

                          {historyInfo?.error ? (
                            <p className="mo-history-error">
                              {historyInfo.error}
                            </p>
                          ) : (
                            <OrderStatusHistory
                              history={historyInfo?.history || []}
                              loading={
                                historyLoading && !historyInfo
                              }
                            />
                          )}
                        </div>

                        {/* FOOTER */}
                        <div className="mo-order-footer">
                          <div>
                            <Package size={17} />

                            <span>
                              {order.status === "delivered"
                                ? "Your order has been delivered."
                                : order.status === "cancelled"
                                ? "This order was cancelled."
                                : "Your order is being processed."}
                            </span>
                          </div>

                          <span className="mo-order-reference">
                            Reference: #{order.id}
                          </span>
                        </div>

                        {/* VIEW DETAILS */}
                        <Link
                          to={`/my-orders/${order.id}`}
                          className="mo-view-details"
                        >
                          View Order Details
                          <ArrowRight size={16} />
                        </Link>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
