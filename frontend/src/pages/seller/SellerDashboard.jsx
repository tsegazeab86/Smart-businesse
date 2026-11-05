
import   { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { sellerApi } from "../../services/sellerApi";
import "./SellerDashboard.css";

// ========================================
// QUICK ACCESS ITEMS
// ========================================

const dashboardItems = [
  {
    title: "Manage Products",
    description:
      "Add products, update details, and manage your inventory.",
    icon: "📦",
    path: "/seller/products",
    label: "View Products",
    className: "products",
  },
  {
    title: "Manage Orders",
    description:
      "Review customer orders and manage order processing.",
    icon: "🛍️",
    path: "/seller/orders",
    label: "View Orders",
    className: "orders",
  },
];

// ========================================
// STATISTICS CONFIGURATION
// ========================================

const statisticItems = [
  {
    key: "totalProducts",
    title: "Total Products",
    icon: "📦",
    color: "blue",
  },
  {
    key: "totalOrders",
    title: "Total Orders",
    icon: "🛒",
    color: "purple",
  },
  {
    key: "pendingOrders",
    title: "Pending Orders",
    icon: "⏳",
    color: "orange",
  },
  {
    key: "completedOrders",
    title: "Completed Orders",
    icon: "✅",
    color: "green",
  },
  {
    key: "totalSales",
    title: "Total Sales",
    icon: "💰",
    color: "cyan",
    money: true,
  },
  {
    key: "outOfStock",
    title: "Out of Stock",
    icon: "⚠️",
    color: "red",
  },
];

// ========================================
// NUMBER FORMATTING
// ========================================

const formatNumber = (value) => {
  const number = Number(value ?? 0);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return number.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
};

// ========================================
// SELLER DASHBOARD
// ========================================

const SellerDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Tracks the latest request to avoid stale updates.
  const requestId = useRef(0);

  // ======================================
  // LOAD DASHBOARD STATISTICS
  // ======================================

  const loadStatistics = async () => {
    const currentRequest = ++requestId.current;

    try {
      setLoading(true);
      setError("");

      const response = await sellerApi.getDashboardStats();

      if (currentRequest !== requestId.current) {
        return;
      }

      if (!response?.stats || typeof response.stats !== "object") {
        throw new Error(
          "Invalid dashboard response. Expected a stats object."
        );
      }

      setStats(response.stats);
    } catch (err) {
      if (currentRequest !== requestId.current) {
        return;
      }

      console.error("Dashboard statistics error:", err);

      setStats(null);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load dashboard statistics."
      );
    } finally {
      if (currentRequest === requestId.current) {
        setLoading(false);
      }
    }
  };

  // ======================================
  // FETCH DATA WHEN PAGE OPENS
  // ======================================

  useEffect(() => {
    const currentRequest = ++requestId.current;

    const fetchStatistics = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await sellerApi.getDashboardStats();

        if (currentRequest !== requestId.current) {
          return;
        }

        if (!response?.stats || typeof response.stats !== "object") {
          throw new Error(
            "Invalid dashboard response. Expected a stats object."
          );
        }

        setStats(response.stats);
      } catch (err) {
        if (currentRequest !== requestId.current) {
          return;
        }

        console.error("Dashboard statistics error:", err);

        setStats(null);

        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load dashboard statistics."
        );
      } finally {
        if (currentRequest === requestId.current) {
          setLoading(false);
        }
      }
    };

    fetchStatistics();

    return () => {
      requestId.current += 1;
    };
  }, []);

  // ======================================
  // JSX
  // ======================================

  return (
    <div className="seller-dashboard">

      {/* ==================================
          TOP BAR
      ================================== */}

      <header className="sd-topbar">
        <div>
          <span className="sd-eyebrow">
            SELLER WORKSPACE
          </span>

          <h1>Dashboard</h1>
        </div>

        <Link
          to="/seller/products"
          className="sd-primary-button"
        >
          <span>＋</span> Manage Products
        </Link>
      </header>

      {/* ==================================
          HERO SECTION
      ================================== */}

      <section className="sd-hero">
        <div className="sd-hero-content">
          <span className="sd-hero-tag">
            <span className="sd-status-dot" />
            YOUR BUSINESS, YOUR CONTROL
          </span>

          <h2>
            Welcome to your
            <br />
            <span>business workspace.</span>
          </h2>

          <p>
            Manage your products, keep track of orders,
            and grow your business from one simple workspace.
          </p>

          <div className="sd-hero-actions">
            <Link
              to="/seller/products"
              className="sd-light-button"
            >
              Manage Products <span>→</span>
            </Link>

            <Link
              to="/seller/orders"
              className="sd-outline-button"
            >
              Explore Orders
            </Link>
          </div>
        </div>

        <div
          className="sd-hero-art"
          aria-hidden="true"
        >
          <div className="sd-art-orbit sd-orbit-one" />
          <div className="sd-art-orbit sd-orbit-two" />

          <div className="sd-art-circle">
            <span>SB</span>
          </div>

          <div className="sd-art-card sd-art-card-top">
            <span className="sd-art-icon">📦</span>

            <div>
              <strong>Products</strong>
              <small>Manage inventory</small>
            </div>
          </div>

          <div className="sd-art-card sd-art-card-bottom">
            <span className="sd-art-icon">✓</span>

            <div>
              <strong>Stay organized</strong>
              <small>Everything in one place</small>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================
          DASHBOARD STATISTICS
      ================================== */}

      <section className="sd-section">
        <div className="sd-section-heading">
          <div>
            <span className="sd-eyebrow">
              BUSINESS OVERVIEW
            </span>

            <h2>Dashboard Statistics</h2>

            <p>
              Monitor your business performance.
            </p>
          </div>

          <button
            type="button"
            className="sd-refresh-button"
            onClick={loadStatistics}
            disabled={loading}
          >
            {loading ? "Loading..." : "↻ Refresh"}
          </button>
        </div>

        {/* ERROR MESSAGE */}

        {error && (
          <div
            className="sd-error"
            role="alert"
          >
            <span>{error}</span>

            <button
              type="button"
              onClick={loadStatistics}
              disabled={loading}
            >
              Retry
            </button>
          </div>
        )}

        {/* LOADING MESSAGE */}

        {loading && !stats && (
          <div
            className="sd-loading"
            role="status"
          >
            Loading your business statistics...
          </div>
        )}

        {/* STATISTICS CARDS */}

        {stats && (
          <div className="sd-stats-grid">
            {statisticItems.map((item) => (
              <article
                key={item.key}
                className={`sd-stat-card sd-stat-${item.color}`}
              >
                <div className="sd-stat-header">
                  <span className="sd-stat-icon">
                    {item.icon}
                  </span>

                  <span className="sd-stat-indicator" />
                </div>

                <p className="sd-stat-title">
                  {item.title}
                </p>

                <h3 className="sd-stat-value">
                  {item.money && (
                    <small className="sd-currency">
                      ETB{" "}
                    </small>
                  )}

                  {formatNumber(stats[item.key])}
                </h3>

                <span className="sd-stat-caption">
                  Business overview
                </span>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ==================================
          QUICK ACCESS
      ================================== */}

      <section className="sd-section">
        <div className="sd-section-heading">
          <div>
            <span className="sd-eyebrow">
              QUICK ACCESS
            </span>

            <h2>Your Workspace</h2>

            <p>
              Choose an area to manage your business.
            </p>
          </div>
        </div>

        <div className="sd-workspace-grid">
          {dashboardItems.map((item) => (
            <article
              className={`sd-workspace-card sd-card-${item.className}`}
              key={item.path}
            >
              <div className="sd-card-top">
                <div className="sd-card-icon">
                  {item.icon}
                </div>

                <span className="sd-card-arrow">
                  ↗
                </span>
              </div>

              <h3>{item.title}</h3>

              <p>{item.description}</p>

              <Link
                to={item.path}
                className="sd-card-link"
              >
                {item.label} <span>→</span>
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* ==================================
          BOTTOM PANEL
      ================================== */}

      <section className="sd-bottom-panel">
        <div className="sd-bottom-icon">
          ✦
        </div>

        <div>
          <h3>
            Make every business day count.
          </h3>

          <p>
            Keep your product information organized
            and stay on top of your incoming orders.
          </p>
        </div>

        <Link
          to="/seller/products"
          className="sd-bottom-link"
        >
          Get started <span>→</span>
        </Link>
      </section>

      {/* ==================================
          FOOTER
      ================================== */}

      <footer className="sd-footer">
        <span>
          © {new Date().getFullYear()} Smart Business
        </span>

        <span>
          Seller Management Workspace
        </span>
      </footer>

    </div>
  );
};

export default SellerDashboard;
