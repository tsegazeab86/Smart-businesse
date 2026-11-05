
import  { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { sellerApi } from "../../services/sellerApi";
import "./SellerSalesReport.css";

const formatMoney = (value) => {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatMonth = (value) => {
  if (!/^\d{4}-\d{2}$/.test(String(value))) {
    return value;
  }

  const [year, month] = value.split("-").map(Number);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
};

const SellerSalesReport = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReport = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await sellerApi.getSalesReport();

      if (!response?.report) {
        throw new Error("Invalid sales report response.");
      }

      setReport(response.report);
    } catch (err) {
      console.error("Sales report error:", err);

      setReport(null);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load sales report."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const fetchReport = async () => {
      try {
        const response = await sellerApi.getSalesReport();

        if (!active) return;

        if (!response?.report) {
          throw new Error("Invalid sales report response.");
        }

        setReport(response.report);
        setError("");
      } catch (err) {
        if (!active) return;

        console.error("Sales report error:", err);

        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load sales report."
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchReport();

    return () => {
      active = false;
    };
  }, []);

  const monthlySales = [...(report?.salesByMonth || [])].reverse();

  const bestSellers = report?.bestSellers || [];

  const totalRevenue = monthlySales.reduce(
    (sum, item) => sum + Number(item.sales || 0),
    0
  );

  const totalOrders = monthlySales.reduce(
    (sum, item) => sum + Number(item.orders || 0),
    0
  );

  const totalUnitsSold = bestSellers.reduce(
    (sum, item) => sum + Number(item.unitsSold || 0),
    0
  );

  const highestSale = Math.max(
    0,
    ...monthlySales.map((item) => Number(item.sales || 0))
  );

  return (
    <div className="seller-sales-page">
      <header className="ssr-header">
        <div>
          <span className="ssr-eyebrow">SELLER ANALYTICS</span>
          <h1>Sales Reports</h1>
          <p>
            Understand your revenue and track your best-selling products.
          </p>
        </div>

        <button
          type="button"
          className="ssr-refresh"
          onClick={loadReport}
          disabled={loading}
        >
          {loading ? "Loading..." : "↻ Refresh Report"}
        </button>
      </header>

      <div className="ssr-navigation">
        <Link to="/seller/dashboard">Dashboard</Link>
        <span>/</span>
        <strong>Sales Reports</strong>
      </div>

      {loading && !report && (
        <div className="ssr-message">
          Loading your sales report...
        </div>
      )}

      {error && (
        <div className="ssr-error" role="alert">
          <span>{error}</span>

          <button
            type="button"
            onClick={loadReport}
            disabled={loading}
          >
            Retry
          </button>
        </div>
      )}

      {report && (
        <>
          <section className="ssr-summary">
            <article className="ssr-summary-card">
              <div className="ssr-summary-icon">💰</div>
              <span>Total Revenue</span>
              <h2>
                <small>ETB </small>
                {formatMoney(totalRevenue)}
              </h2>
              <p>Across the reported months</p>
            </article>

            <article className="ssr-summary-card">
              <div className="ssr-summary-icon">🛒</div>
              <span>Delivered Orders</span>
              <h2>{totalOrders.toLocaleString()}</h2>
              <p>Across the reported months</p>
            </article>

            <article className="ssr-summary-card">
              <div className="ssr-summary-icon">📦</div>
              <span>Top Products</span>
              <h2>{bestSellers.length}</h2>
              <p>Up to 10 best-selling products</p>
            </article>

            <article className="ssr-summary-card">
              <div className="ssr-summary-icon">📈</div>
              <span>Units Sold</span>
              <h2>{totalUnitsSold.toLocaleString()}</h2>
              <p>Among the listed top products</p>
            </article>
          </section>

          <section className="ssr-panel">
            <div className="ssr-panel-heading">
              <div>
                <span className="ssr-eyebrow">REVENUE ANALYTICS</span>
                <h2>Monthly Sales Performance</h2>
                <p>Revenue from delivered orders.</p>
              </div>
            </div>

            {monthlySales.length === 0 ? (
              <div className="ssr-empty">
                No delivered sales have been recorded yet.
              </div>
            ) : (
              <div className="ssr-chart-scroll">
                <div className="ssr-chart">
                  {monthlySales.map((item) => {
                    const sales = Number(item.sales || 0);

                    const height =
                      highestSale > 0
                        ? (sales / highestSale) * 100
                        : 0;

                    return (
                      <div
                        className="ssr-chart-column"
                        key={item.month}
                      >
                        <span className="ssr-chart-value">
                          {formatMoney(sales)}
                        </span>

                        <div className="ssr-chart-track">
                          <div
                            className="ssr-chart-bar"
                            style={{
                              height: `${height}%`,
                            }}
                            title={`${formatMonth(item.month)}: ETB ${formatMoney(sales)}`}
                          />
                        </div>

                        <span className="ssr-chart-label">
                          {formatMonth(item.month)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          <section className="ssr-panel">
            <div className="ssr-panel-heading">
              <div>
                <span className="ssr-eyebrow">PRODUCT PERFORMANCE</span>
                <h2>Best-Selling Products</h2>
                <p>
                  Your highest-selling products based on delivered orders.
                </p>
              </div>

              <Link
                to="/seller/products"
                className="ssr-products-link"
              >
                Manage Products →
              </Link>
            </div>

            {bestSellers.length === 0 ? (
              <div className="ssr-empty">
                No product sales data available yet.
              </div>
            ) : (
              <div className="ssr-table-scroll">
                <table className="ssr-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Product</th>
                      <th>Units Sold</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>

                  <tbody>
                    {bestSellers.map((product, index) => (
                      <tr key={product.productId}>
                        <td>
                          <span className="ssr-rank">
                            {index + 1}
                          </span>
                        </td>

                        <td>
                          <strong>{product.productName}</strong>
                        </td>

                        <td>
                          {Number(product.unitsSold).toLocaleString()}
                        </td>

                        <td className="ssr-revenue">
                          ETB {formatMoney(product.sales)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <footer className="ssr-footer">
            <span>
              © {new Date().getFullYear()} Smart Business
            </span>

            <span>
              Sales figures are based on delivered orders.
            </span>
          </footer>
        </>
      )}
    </div>
  );
};

export default SellerSalesReport;
