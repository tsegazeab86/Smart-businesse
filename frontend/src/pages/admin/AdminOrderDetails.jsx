
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  LoaderCircle,
  Mail,
  MapPin,
  Package,
  PackageCheck,
  Phone,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Truck,
  UserRound,
  XCircle,
} from "lucide-react";

import api from "../../services/api";
import OrderStatusHistory from "../../components/OrderStatusHistory";
import "./AdminOrderDetails.css";

const money = (value) =>
  `ETB ${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const dateLabel = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
};

const paymentLabels = {
  cash_on_delivery: "Cash on Delivery",
  telebirr: "Telebirr",
  bank_transfer: "Bank Transfer",
};

const steps = [
  { key: "pending", label: "Pending", Icon: Clock3 },
  { key: "confirmed", label: "Confirmed", Icon: CheckCircle2 },
  { key: "shipped", label: "Shipped", Icon: Truck },
  { key: "delivered", label: "Delivered", Icon: PackageCheck },
];

const nextStatusMap = {
  pending: {
    status: "confirmed",
    label: "Confirm Order",
  },
  confirmed: {
    status: "shipped",
    label: "Mark as Shipped",
  },
  shipped: {
    status: "delivered",
    label: "Mark as Delivered",
  },
};

export default function AdminOrderDetails() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");

  // Initial order loading.
  useEffect(() => {
    let active = true;

    async function fetchOrder() {
      try {
        const { data } = await api.get(`/admin/orders/${id}`);

        if (!active) return;
        setOrder(data.order);
      } catch (err) {
        if (!active) return;

        console.error("ADMIN ORDER DETAILS:", err);
        setError(
          err.response?.data?.message ||
            "Unable to load order details."
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchOrder();

    return () => {
      active = false;
    };
  }, [id]);

  const refreshOrder = async () => {
    try {
      setRefreshing(true);
      setError("");

      const { data } = await api.get(`/admin/orders/${id}`);
      setOrder(data.order);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to refresh order details."
      );
    } finally {
      setRefreshing(false);
    }
  };

  const updateStatus = async () => {
    if (!order || updating) return;

    const next = nextStatusMap[order.status];
    if (!next) return;

    const confirmed = window.confirm(
      `Change Order #${order.id} from ${order.status} to ${next.status}?`
    );

    if (!confirmed) return;

    setUpdating(true);
    setActionError("");
    setNotice("");

    try {
      await api.patch(
        `/admin/orders/${order.id}/status`,
        { status: next.status }
      );

      // Re-fetch so both status AND history are current.
      const { data } = await api.get(
        `/admin/orders/${order.id}`
      );

      setOrder(data.order);
      setNotice(
        `Order successfully updated to ${next.status}.`
      );
    } catch (err) {
      console.error("UPDATE ORDER STATUS:", err);

      setActionError(
        err.response?.data?.message ||
          "Unable to update order status."
      );

      // Refresh after conflicts, e.g. another admin updated it.
      if (err.response?.status === 409) {
        try {
          const { data } = await api.get(
            `/admin/orders/${order.id}`
          );
          setOrder(data.order);
        } catch (refreshError) {
          console.error(
            "REFRESH AFTER STATUS CONFLICT:",
            refreshError
          );
        }
      }
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <main className="aod-page">
        <div className="aod-state">
          <LoaderCircle size={34} className="aod-spin" />
          <h2>Loading order details...</h2>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="aod-page">
        <div className="aod-state">
          <XCircle size={36} />
          <h2>Order unavailable</h2>
          <p>{error || "Order not found."}</p>
          <Link to="/admin">Back to Dashboard</Link>
        </div>
      </main>
    );
  }

  const currentIndex = steps.findIndex(
    (step) => step.key === order.status
  );

  const nextAction = nextStatusMap[order.status];

  return (
    <main className="aod-page">
      <div className="aod-container">
        <Link to="/admin" className="aod-back">
          <ArrowLeft size={17} />
          Back to Dashboard
        </Link>

        <header className="aod-header">
          <div>
            <span className="aod-eyebrow">
              ADMIN / ORDER MANAGEMENT
            </span>
            <h1>Order #{order.id}</h1>
            <p>
              <CalendarDays size={15} />
              Placed {dateLabel(order.createdAt)}
            </p>
          </div>

          <div className="aod-header-actions">
            <span
              className={`aod-status aod-status-${order.status}`}
            >
              {order.status}
            </span>

            <button
              type="button"
              className="aod-refresh"
              onClick={refreshOrder}
              disabled={refreshing || updating}
            >
              <RefreshCw
                size={16}
                className={refreshing ? "aod-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </header>

        {error && (
          <div className="aod-alert aod-alert-error" role="alert">
            {error}
          </div>
        )}

        {actionError && (
          <div className="aod-alert aod-alert-error" role="alert">
            {actionError}
          </div>
        )}

        {notice && (
          <div className="aod-alert aod-alert-success" role="status">
            <CheckCircle2 size={18} />
            {notice}
          </div>
        )}

        {/* SUMMARY */}
        <div className="aod-stats">
          <div className="aod-stat">
            <ShoppingBag size={21} />
            <span>Order Total</span>
            <strong>{money(order.total)}</strong>
          </div>

          <div className="aod-stat">
            <Package size={21} />
            <span>Products</span>
            <strong>
              {(order.items || []).reduce(
                (sum, item) => sum + Number(item.quantity),
                0
              )}
            </strong>
          </div>

          <div className="aod-stat">
            <CreditCard size={21} />
            <span>Payment</span>
            <strong className="aod-capitalize">
              {order.paymentStatus}
            </strong>
          </div>
        </div>

        {/* STATUS PROGRESS */}
        <section className="aod-panel aod-tracking-card">
          <div className="aod-panel-heading">
            <div>
              <span className="aod-eyebrow">ORDER PROGRESS</span>
              <h2>Delivery Status</h2>
            </div>
            <ShieldCheck size={22} />
          </div>

          {order.status === "cancelled" ? (
            <div className="aod-cancelled">
              <XCircle size={20} />
              This order has been cancelled.
            </div>
          ) : (
            <div className="aod-steps">
              {steps.map(({ key, label, Icon }, index) => {
                const active = index <= currentIndex;
                const completed = index < currentIndex;

                return (
                  <div
                    className={`aod-step ${
                      active ? "aod-step-active" : ""
                    } ${
                      index === currentIndex
                        ? "aod-step-current"
                        : ""
                    }`}
                    key={key}
                  >
                    <div className="aod-step-icon">
                      {completed ? (
                        <Check size={19} />
                      ) : (
                        <Icon size={19} />
                      )}
                    </div>
                    <strong>{label}</strong>
                    <small>
                      {completed
                        ? "Completed"
                        : index === currentIndex
                        ? "Current"
                        : "Upcoming"}
                    </small>
                  </div>
                );
              })}
            </div>
          )}

          <div className="aod-tracking-footer">
            {nextAction ? (
              <button
                type="button"
                className="aod-update-btn"
                onClick={updateStatus}
                disabled={updating || refreshing}
              >
                {updating ? (
                  <LoaderCircle
                    size={18}
                    className="aod-spin"
                  />
                ) : (
                  <CheckCircle2 size={18} />
                )}
                {updating
                  ? "Updating..."
                  : nextAction.label}
              </button>
            ) : (
              <span className="aod-finished">
                {order.status === "delivered"
                  ? "Order completed"
                  : "No further status updates available"}
              </span>
            )}
          </div>
        </section>

        {/* ACTUAL DATABASE HISTORY */}
        <div className="aod-history">
          <OrderStatusHistory
            history={order.history || []}
            showChangedBy={true}
          />
        </div>

        <div className="aod-grid">
          <div className="aod-main-column">
            {/* PRODUCTS */}
            <section className="aod-panel">
              <div className="aod-panel-heading">
                <div>
                  <span className="aod-eyebrow">
                    PURCHASE DETAILS
                  </span>
                  <h2>Ordered Products</h2>
                </div>
                <Package size={21} />
              </div>

              <div className="aod-products">
                {(order.items || []).map((item) => (
                  <div className="aod-product" key={item.id}>
                    <div className="aod-product-image">
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
                        <Package size={23} />
                      )}
                    </div>

                    <div className="aod-product-info">
                      <strong>{item.productName}</strong>
                      <span>Product #{item.productId}</span>
                      <small>
                        {money(item.price)} × {item.quantity}
                      </small>
                    </div>

                    <strong className="aod-product-total">
                      {money(item.lineTotal)}
                    </strong>
                  </div>
                ))}
              </div>
            </section>

            {/* CUSTOMER */}
            <section className="aod-panel">
              <div className="aod-panel-heading">
                <div>
                  <span className="aod-eyebrow">
                    CUSTOMER INFORMATION
                  </span>
                  <h2>Customer Details</h2>
                </div>
                <UserRound size={21} />
              </div>

              <div className="aod-details-list">
                <div>
                  <UserRound size={17} />
                  <span>Full Name</span>
                  <strong>{order.fullName}</strong>
                </div>
                <div>
                  <Mail size={17} />
                  <span>Email</span>
                  <strong>{order.customerEmail || "—"}</strong>
                </div>
                <div>
                  <Phone size={17} />
                  <span>Phone</span>
                  <strong>{order.phone}</strong>
                </div>
              </div>
            </section>
          </div>

          <aside className="aod-side-column">
            {/* DELIVERY */}
            <section className="aod-panel">
              <div className="aod-panel-heading">
                <div>
                  <span className="aod-eyebrow">DESTINATION</span>
                  <h2>Delivery Address</h2>
                </div>
                <MapPin size={21} />
              </div>

              <div className="aod-address">
                <strong>{order.fullName}</strong>
                <p>{order.address}</p>
                <p>{order.city}</p>
                <p>{order.phone}</p>
              </div>

              {order.notes && (
                <div className="aod-notes">
                  <FileText size={16} />
                  <p>{order.notes}</p>
                </div>
              )}
            </section>

            {/* PAYMENT */}
            <section className="aod-panel">
              <div className="aod-panel-heading">
                <div>
                  <span className="aod-eyebrow">BILLING</span>
                  <h2>Payment Summary</h2>
                </div>
                <CreditCard size={21} />
              </div>

              <div className="aod-payment-lines">
                <div>
                  <span>Subtotal</span>
                  <strong>{money(order.subtotal)}</strong>
                </div>
                <div>
                  <span>Shipping Fee</span>
                  <strong>{money(order.shippingFee)}</strong>
                </div>
                <div className="aod-payment-total">
                  <span>Total</span>
                  <strong>{money(order.total)}</strong>
                </div>
                <div>
                  <span>Payment Method</span>
                  <strong>
                    {paymentLabels[order.paymentMethod] ||
                      order.paymentMethod}
                  </strong>
                </div>
                <div>
                  <span>Payment Status</span>
                  <strong className="aod-capitalize">
                    {order.paymentStatus}
                  </strong>
                </div>
                {order.paymentReference && (
                  <div>
                    <span>Payment Reference</span>
                    <strong>{order.paymentReference}</strong>
                  </div>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
