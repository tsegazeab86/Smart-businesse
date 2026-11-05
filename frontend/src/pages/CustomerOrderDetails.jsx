
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  ShoppingBag,
  UserRound,
  AlertCircle,
  FileText,
  LoaderCircle,
} from "lucide-react";

import api from "../services/api";

import OrderTracking from "../components/OrderTracking";
import OrderStatusHistory from "../components/OrderStatusHistory";

import "./CustomerOrderDetails.css";

// Payment method labels
const paymentLabels = {
  cash_on_delivery: "Cash on Delivery",
  telebirr: "Telebirr",
  bank_transfer: "Bank Transfer",
};

// Order status labels
const statusLabels = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

// Format Ethiopian Birr
const formatMoney = (value) => {
  return `ETB ${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// Format date
const formatDate = (value) => {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export default function CustomerOrderDetails() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  // Fetch selected customer's order
  const fetchOrder = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setError("");

        const { data } = await api.get(`/orders/${id}`);

        if (!data.success || !data.order) {
          throw new Error("Unable to load order details.");
        }

        setOrder(data.order);
      } catch (err) {
        console.error("CUSTOMER ORDER DETAILS ERROR:", err);

        const message =
          err.response?.data?.message ||
          err.message ||
          "Unable to load order details.";

        setError(message);

        if (showLoading) {
          setOrder(null);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id]
  );

useEffect(() => {
  let active = true;

  async function loadInitialOrder() {
    try {
      const { data } = await api.get(`/orders/${id}`);

      if (!active) return;

      if (!data.success || !data.order) {
        throw new Error("Unable to load order details.");
      }

      setOrder(data.order);
      setError("");
    } catch (err) {
      if (!active) return;

      console.error("CUSTOMER ORDER DETAILS ERROR:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load order details."
      );

      setOrder(null);
    } finally {
      if (active) {
        setLoading(false);
      }
    }
  }

  loadInitialOrder();

  return () => {
    active = false;
  };
}, [id]);
  // Loading
  if (loading) {
    return (
      <main className="cod-page">
        <div className="cod-container">
          <div className="cod-state">
            <LoaderCircle
              size={40}
              className="cod-spinning"
            />

            <h2>Loading your order...</h2>

            <p>
              Please wait while we retrieve your order details.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Error / Order not found
  if (!order) {
    return (
      <main className="cod-page">
        <div className="cod-container">
          <div className="cod-state">
            <AlertCircle size={45} />

            <h2>Order unavailable</h2>

            <p>
              {error || "We could not find this order."}
            </p>

            <button
              type="button"
              className="cod-refresh"
              onClick={() => fetchOrder(true)}
            >
              <RefreshCw size={17} />
              Try Again
            </button>

            <Link
              to="/my-orders"
              className="cod-primary-btn"
            >
              <ArrowLeft size={17} />
              Back to My Orders
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const items = Array.isArray(order.items)
    ? order.items
    : [];

  const history = Array.isArray(order.history)
    ? order.history
    : [];

  return (
    <main className="cod-page">
      <div className="cod-container">

        {/* TOP NAVIGATION */}
        <div className="cod-topbar">
          <Link
            to="/my-orders"
            className="cod-back"
          >
            <ArrowLeft size={18} />
            My Orders
          </Link>

          <button
            type="button"
            className="cod-refresh"
            disabled={refreshing}
            onClick={() => fetchOrder(false)}
          >
            <RefreshCw
              size={17}
              className={
                refreshing ? "cod-spinning" : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh Status"}
          </button>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="cod-alert" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* PAGE HEADER */}
        <header className="cod-header">
          <div>
            <span className="cod-eyebrow">
              ORDER DETAILS
            </span>

            <h1>Order #{order.id}</h1>

            <p className="cod-date">
              <CalendarDays size={16} />
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>

          <span
            className={`cod-status cod-status-${order.status}`}
          >
            {statusLabels[order.status] ||
              order.status}
          </span>
        </header>

        {/* ORDER TRACKING */}
        <section className="cod-card">
          <div className="cod-section-heading">
            <div className="cod-heading-icon">
              <Package size={20} />
            </div>

            <div>
              <h2>Track Your Order</h2>

              <p>
                Follow your order from placement to delivery.
              </p>
            </div>
          </div>

          <OrderTracking status={order.status} />
        </section>

        <div className="cod-layout">

          {/* LEFT COLUMN */}
          <div className="cod-main-column">

            {/* ORDERED PRODUCTS */}
            <section className="cod-card">
              <div className="cod-section-heading">
                <div className="cod-heading-icon">
                  <ShoppingBag size={20} />
                </div>

                <div>
                  <h2>Ordered Products</h2>

                  <p>
                    {items.length} product
                    {items.length !== 1 ? "s" : ""}
                    {" "}in this order
                  </p>
                </div>
              </div>

              <div className="cod-items">
                {items.map((item) => (
                  <div
                    className="cod-item"
                    key={item.id}
                  >
                    <div className="cod-product-image">
                      {item.productImage ? (
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          onError={(event) => {
                            event.currentTarget.style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <Package size={27} />
                      )}
                    </div>

                    <div className="cod-product-info">
                      <h3>{item.productName}</h3>

                      <p>
                        Quantity: {item.quantity}
                      </p>

                      <span>
                        Unit Price: {formatMoney(item.price)}
                      </span>
                    </div>

                    <strong className="cod-line-total">
                      {formatMoney(item.lineTotal)}
                    </strong>
                  </div>
                ))}

                {items.length === 0 && (
                  <p className="cod-muted">
                    No product details are available.
                  </p>
                )}
              </div>
            </section>

            {/* STATUS HISTORY */}
            <section className="cod-card">
              <div className="cod-section-heading">
                <div className="cod-heading-icon">
                  <FileText size={20} />
                </div>

                <div>
                  <h2>Order Status History</h2>

                  <p>
                    Recorded updates for this order.
                  </p>
                </div>
              </div>

              <OrderStatusHistory history={history} />
            </section>
          </div>

          {/* RIGHT COLUMN */}
          <aside className="cod-side-column">

            {/* DELIVERY INFORMATION */}
            <section className="cod-card">
              <div className="cod-section-heading">
                <div className="cod-heading-icon">
                  <MapPin size={20} />
                </div>

                <div>
                  <h2>Delivery Details</h2>

                  <p>Shipping information</p>
                </div>
              </div>

              <div className="cod-detail-list">
                <div className="cod-detail">
                  <UserRound size={18} />

                  <div>
                    <span>Full Name</span>

                    <strong>
                      {order.fullName}
                    </strong>
                  </div>
                </div>

                <div className="cod-detail">
                  <Phone size={18} />

                  <div>
                    <span>Phone Number</span>

                    <strong>{order.phone}</strong>
                  </div>
                </div>

                <div className="cod-detail">
                  <MapPin size={18} />

                  <div>
                    <span>Delivery Address</span>

                    <strong>
                      {order.address}, {order.city}
                    </strong>
                  </div>
                </div>

                {order.notes && (
                  <div className="cod-detail">
                    <FileText size={18} />

                    <div>
                      <span>Delivery Notes</span>

                      <strong>
                        {order.notes}
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* PAYMENT INFORMATION */}
            <section className="cod-card">
              <div className="cod-section-heading">
                <div className="cod-heading-icon">
                  <CreditCard size={20} />
                </div>

                <div>
                  <h2>Payment Details</h2>

                  <p>Order payment information</p>
                </div>
              </div>

              <div className="cod-payment-method">
                <span>Payment Method</span>

                <strong>
                  {paymentLabels[order.paymentMethod] ||
                    order.paymentMethod}
                </strong>
              </div>

              <div className="cod-payment-method">
                <span>Payment Status</span>

                <span
                  className={`cod-payment-status ${
                    order.paymentStatus === "paid"
                      ? "cod-paid"
                      : "cod-unpaid"
                  }`}
                >
                  {order.paymentStatus === "paid"
                    ? "Paid"
                    : "Pending"}
                </span>
              </div>

              {order.paymentReference && (
                <div className="cod-payment-method">
                  <span>Payment Reference</span>

                  <strong>
                    {order.paymentReference}
                  </strong>
                </div>
              )}

              <div className="cod-divider" />

              {/* PRICE SUMMARY */}
              <div className="cod-price-row">
                <span>Subtotal</span>

                <strong>
                  {formatMoney(order.subtotal)}
                </strong>
              </div>

              <div className="cod-price-row">
                <span>Shipping Fee</span>

                <strong>
                  {formatMoney(order.shippingFee)}
                </strong>
              </div>

              <div className="cod-total">
                <span>Total Amount</span>

                <strong>
                  {formatMoney(order.total)}
                </strong>
              </div>
            </section>

            <Link
              to="/my-orders"
              className="cod-bottom-link"
            >
              <ArrowLeft size={17} />
              Back to All Orders
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
