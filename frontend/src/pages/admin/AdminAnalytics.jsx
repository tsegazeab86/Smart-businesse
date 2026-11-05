import { useCallback, useEffect, useMemo, useState } from "react";

import {
  BarChart3,
  RefreshCw,
  Download,
  TrendingUp,
  ShoppingBag,
  Wallet,
  Package,
  FileText,
  CalendarDays,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import api from "../../services/api";
import "./AdminAnalytics.css";

const COLORS = [
  "#2563eb",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
];

const emptyAnalytics = {
  summary: {
    totalOrders: 0,
    paidOrders: 0,
    cancelledOrders: 0,
    paidRevenue: 0,
  },
  monthlyRevenue: [],
  orderStatuses: [],
  ordersTrend: [],
  paymentMethods: [],
  topProducts: [],
};

const formatMoney = (value) =>
  `ETB ${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const dateToString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getPresetDates = (preset) => {
  const end = new Date();
  const start = new Date(end);

  if (preset === "today") {
    // Start and end remain today.
  } else if (preset === "7days") {
    start.setDate(start.getDate() - 6);
  } else if (preset === "30days") {
    start.setDate(start.getDate() - 29);
  } else if (preset === "12months") {
    // Set day first to avoid month overflow on dates such as the 31st.
    start.setDate(1);
    start.setMonth(start.getMonth() - 11);
  }

  return {
    startDate: dateToString(start),
    endDate: dateToString(end),
  };
};

const escapeCSV = (value) => {
  let text = String(value ?? "");

  // Prefix formula-like values to reduce spreadsheet formula injection risk.
  if (/^[\s]*[=+\-@]/.test(text)) {
    text = `'${text}`;
  }

  return `"${text.replace(/"/g, '""')}"`;
};

function downloadCSV(filename, rows) {
  const csv = rows
    .map((row) => row.map(escapeCSV).join(","))
    .join("\r\n");

  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  // Allow the browser to begin the download before releasing the object URL.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const formatPeriod = (value, groupBy) => {
  if (!value) return "—";

  if (groupBy === "month") {
    const [year, month] = value.split("-").map(Number);

    return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  }

  // Backend emits YYYY-MM-DD keys for both day and week.
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const prepareChartData = (rows = [], key, groupBy) =>
  rows.map((row) => ({
    ...row,
    label: formatPeriod(row.month, groupBy),
    [key]: Number(row[key] ?? 0),
  }));

export default function AdminAnalytics() {
  const initialDates = useMemo(() => getPresetDates("30days"), []);

  const [preset, setPreset] = useState("30days");
  const [startDate, setStartDate] = useState(initialDates.startDate);
  const [endDate, setEndDate] = useState(initialDates.endDate);
  const [groupBy, setGroupBy] = useState("day");

  const [analytics, setAnalytics] = useState(emptyAnalytics);
  const [appliedFilters, setAppliedFilters] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async (filters) => {
    const { data } = await api.get("/admin/analytics", {
      params: filters,
    });

    if (!data?.success || !data.analytics) {
      throw new Error("Invalid analytics response.");
    }

    return data;
  }, []);

  useEffect(() => {
    let active = true;

    const filters = {
      ...initialDates,
      groupBy: "day",
    };

    const fetchInitialData = async () => {
      try {
        setLoading(true);

        const data = await loadAnalytics(filters);

        if (!active) return;

        setAnalytics(data.analytics);
        setAppliedFilters(data.filters || filters);
        setError("");
      } catch (err) {
        if (!active) return;

        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load analytics."
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchInitialData();

    return () => {
      active = false;
    };
  }, [initialDates, loadAnalytics]);

  const changePreset = (value) => {
    setPreset(value);

    if (value === "custom") return;

    const dates = getPresetDates(value);
    setStartDate(dates.startDate);
    setEndDate(dates.endDate);
    setGroupBy(value === "12months" ? "month" : "day");
  };

  const refreshAnalytics = async () => {
    if (!startDate || !endDate || startDate > endDate) {
      setError("Please select a valid date range.");
      return;
    }

    try {
      setRefreshing(true);
      setError("");

      const filters = { startDate, endDate, groupBy };
      const data = await loadAnalytics(filters);

      setAnalytics(data.analytics);
      setAppliedFilters(data.filters || filters);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to refresh analytics."
      );
    } finally {
      setRefreshing(false);
    }
  };

  const currentGroup = appliedFilters?.groupBy || groupBy;

  const revenueData = prepareChartData(
    analytics.monthlyRevenue,
    "revenue",
    currentGroup
  );

  const ordersData = prepareChartData(
    analytics.ordersTrend,
    "totalOrders",
    currentGroup
  );

  const summary = {
    totalOrders: Number(
      analytics.summary?.totalOrders ??
        analytics.orderStatuses.reduce(
          (sum, row) => sum + Number(row.total || 0),
          0
        )
    ),
    paidOrders: Number(analytics.summary?.paidOrders || 0),
    cancelledOrders: Number(
      analytics.summary?.cancelledOrders ??
        analytics.orderStatuses
          .filter((row) => row.status === "cancelled")
          .reduce((sum, row) => sum + Number(row.total || 0), 0)
    ),
    paidRevenue: Number(
      analytics.summary?.paidRevenue ??
        analytics.paymentMethods.reduce(
          (sum, row) => sum + Number(row.paidRevenue || 0),
          0
        )
    ),
  };

  const reportName = appliedFilters
    ? `injibara-report-${appliedFilters.startDate}-to-${appliedFilters.endDate}`
    : "injibara-analytics-report";

  const reportRows = () => [
    ["INJIBARA SMART BUSINESS - ANALYTICS REPORT"],
    [
      "Start Date",
      appliedFilters?.startDate,
      "End Date",
      appliedFilters?.endDate,
    ],
    ["Grouping", currentGroup],
    [],
    ["SUMMARY"],
    ["Total Orders", summary.totalOrders],
    ["Paid Orders", summary.paidOrders],
    ["Cancelled Orders", summary.cancelledOrders],
    ["Paid Revenue (ETB)", summary.paidRevenue],
    [],
    ["PAID REVENUE"],
    ["Period", "Paid Orders", "Revenue (ETB)"],
    ...analytics.monthlyRevenue.map((row) => [
      row.month,
      row.totalOrders,
      row.revenue,
    ]),
    [],
    ["ORDERS TREND"],
    ["Period", "Orders"],
    ...analytics.ordersTrend.map((row) => [row.month, row.totalOrders]),
    [],
    ["ORDER STATUS"],
    ["Status", "Orders"],
    ...analytics.orderStatuses.map((row) => [row.status, row.total]),
    [],
    ["PAYMENT METHODS"],
    ["Method", "Orders", "Paid Revenue (ETB)"],
    ...analytics.paymentMethods.map((row) => [
      row.method,
      row.totalOrders,
      row.paidRevenue,
    ]),
    [],
    ["TOP PRODUCTS - NON-CANCELLED ORDERS"],
    ["Product", "Units", "Orders", "Order Value (ETB)"],
    ...analytics.topProducts.map((row) => [
      row.productName,
      row.unitsSold,
      row.orderCount,
      row.orderValue,
    ]),
  ];

  const exportCSV = () => {
    if (!appliedFilters) return;
    downloadCSV(`${reportName}.csv`, reportRows());
  };

  const exportPDF = () => {
    if (!appliedFilters) return;

    const doc = new jsPDF();

    doc.setFontSize(17);
    doc.text("Injibara Smart Business", 14, 18);

    doc.setFontSize(12);
    doc.text("Analytics & Sales Report", 14, 26);

    doc.setFontSize(9);
    doc.text(
      `Period: ${appliedFilters.startDate} to ${appliedFilters.endDate}`,
      14,
      34
    );
    doc.text(`Grouping: ${currentGroup}`, 14, 40);

    const addTable = (title, head, body, startY) => {
      doc.setFontSize(11);
      doc.text(title, 14, startY);

      autoTable(doc, {
        startY: startY + 4,
        head: [head],
        body: body.length
          ? body
          : [head.map((_, index) => (index === 0 ? "No data" : ""))],
        theme: "striped",
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [37, 99, 235],
        },
        margin: {
          left: 14,
          right: 14,
        },
      });

      return doc.lastAutoTable.finalY + 12;
    };

    let y = addTable(
      "Summary",
      ["Metric", "Value"],
      [
        ["Total Orders", summary.totalOrders],
        ["Paid Orders", summary.paidOrders],
        ["Cancelled Orders", summary.cancelledOrders],
        ["Paid Revenue", formatMoney(summary.paidRevenue)],
      ],
      49
    );

    const ensureSpace = (needed = 35) => {
      if (y + needed > doc.internal.pageSize.getHeight() - 12) {
        doc.addPage();
        y = 18;
      }
    };

    ensureSpace();
    y = addTable(
      "Paid Revenue",
      ["Period", "Paid Orders", "Revenue"],
      analytics.monthlyRevenue.map((row) => [
        row.month,
        row.totalOrders,
        formatMoney(row.revenue),
      ]),
      y
    );

    ensureSpace();
    y = addTable(
      "Orders Trend",
      ["Period", "Orders"],
      analytics.ordersTrend.map((row) => [row.month, row.totalOrders]),
      y
    );

    ensureSpace();
    y = addTable(
      "Order Status",
      ["Status", "Orders"],
      analytics.orderStatuses.map((row) => [row.status, row.total]),
      y
    );

    ensureSpace();
    y = addTable(
      "Payment Methods",
      ["Method", "Orders", "Paid Revenue"],
      analytics.paymentMethods.map((row) => [
        row.method,
        row.totalOrders,
        formatMoney(row.paidRevenue),
      ]),
      y
    );

    ensureSpace();
    addTable(
      "Top 5 Products (Non-Cancelled Orders)",
      ["Product", "Units", "Orders", "Order Value"],
      analytics.topProducts.map((row) => [
        row.productName,
        row.unitsSold,
        row.orderCount,
        formatMoney(row.orderValue),
      ]),
      y
    );

    const pages = doc.internal.getNumberOfPages();

    for (let page = 1; page <= pages; page += 1) {
      doc.setPage(page);
      doc.setFontSize(8);
      doc.text(
        `Page ${page} of ${pages}`,
        196,
        doc.internal.pageSize.getHeight() - 9,
        { align: "right" }
      );
    }

    doc.save(`${reportName}.pdf`);
  };

  if (loading) {
    return <div className="analytics-loading">Loading analytics...</div>;
  }

  return (
    <div className="analytics-page">
      <header className="analytics-header">
        <div>
          <span className="analytics-eyebrow">BUSINESS INTELLIGENCE</span>
          <h1>
            <BarChart3 size={29} />
            Analytics &amp; Reports
          </h1>
          <p>Monitor sales, customer orders and product performance.</p>
        </div>

        <div className="analytics-header-actions">
          <button
            type="button"
            onClick={refreshAnalytics}
            disabled={refreshing}
          >
            <RefreshCw size={17} />
            {refreshing ? "Loading..." : "Refresh"}
          </button>

          <button
            type="button"
            className="analytics-export"
            onClick={exportCSV}
            disabled={!appliedFilters || refreshing}
          >
            <Download size={17} />
            Export CSV
          </button>

          <button
            type="button"
            className="analytics-export"
            onClick={exportPDF}
            disabled={!appliedFilters || refreshing}
          >
            <FileText size={17} />
            Export PDF
          </button>
        </div>
      </header>

      <section className="analytics-card analytics-filters">
        <h2>
          <CalendarDays size={19} />
          Report Filters
        </h2>

        <div className="analytics-filter-grid">
          <label>
            Date Range
            <select
              value={preset}
              onChange={(event) => changePreset(event.target.value)}
            >
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="12months">Last 12 Months</option>
              <option value="custom">Custom Range</option>
            </select>
          </label>

          <label>
            Start Date
            <input
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(event) => {
                setStartDate(event.target.value);
                setPreset("custom");
              }}
            />
          </label>

          <label>
            End Date
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => {
                setEndDate(event.target.value);
                setPreset("custom");
              }}
            />
          </label>

          <label>
            Group By
            <select
              value={groupBy}
              onChange={(event) => setGroupBy(event.target.value)}
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
            </select>
          </label>

          <button
            type="button"
            className="analytics-apply"
            onClick={refreshAnalytics}
            disabled={refreshing}
          >
            {refreshing ? "Applying..." : "Apply Filters"}
          </button>
        </div>

        {appliedFilters && (
          <p className="analytics-applied">
            Showing: {appliedFilters.startDate} to {appliedFilters.endDate} (
            {appliedFilters.groupBy})
          </p>
        )}
      </section>

      {error && (
        <div className="analytics-error" role="alert">
          {error}
        </div>
      )}

      <section className="analytics-stats">
        <div className="analytics-stat">
          <ShoppingBag size={23} />
          <span>Total Orders</span>
          <strong>{summary.totalOrders}</strong>
        </div>

        <div className="analytics-stat">
          <Wallet size={23} />
          <span>Paid Revenue</span>
          <strong>{formatMoney(summary.paidRevenue)}</strong>
        </div>

        <div className="analytics-stat">
          <TrendingUp size={23} />
          <span>Paid Orders</span>
          <strong>{summary.paidOrders}</strong>
        </div>

        <div className="analytics-stat">
          <Package size={23} />
          <span>Cancelled Orders</span>
          <strong>{summary.cancelledOrders}</strong>
        </div>
      </section>

      <section className="analytics-grid">
        <div className="analytics-card">
          <h2>Paid Revenue</h2>
          <p>Revenue for the selected reporting period</p>

          <div className="analytics-chart">
            {revenueData.length === 0 ? (
              <div className="analytics-empty">No paid revenue in this period.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatMoney(value)} />
                  <Bar
                    dataKey="revenue"
                    name="Paid Revenue"
                    fill="#2563eb"
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="analytics-card">
          <h2>Orders Trend</h2>
          <p>Orders placed in the selected reporting period</p>

          <div className="analytics-chart">
            {ordersData.length === 0 ? (
              <div className="analytics-empty">No orders in this period.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ordersData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="totalOrders"
                    name="Orders"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="analytics-card">
          <h2>Order Status Distribution</h2>
          <p>Status breakdown for the selected period</p>

          <div className="analytics-chart">
            {analytics.orderStatuses.length === 0 ? (
              <div className="analytics-empty">No orders yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.orderStatuses}
                    dataKey="total"
                    nameKey="status"
                    outerRadius={100}
                    label
                  >
                    {analytics.orderStatuses.map((row, index) => (
                      <Cell
                        key={row.status}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="analytics-card">
          <h2>Payment Method Report</h2>
          <p>Orders and paid revenue by payment method</p>

          <div className="analytics-table-wrap">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Method</th>
                  <th>Orders</th>
                  <th>Paid Revenue</th>
                </tr>
              </thead>
              <tbody>
                {analytics.paymentMethods.length === 0 ? (
                  <tr>
                    <td colSpan={3}>No payment data.</td>
                  </tr>
                ) : (
                  analytics.paymentMethods.map((row) => (
                    <tr key={row.method}>
                      <td>{String(row.method).replaceAll("_", " ")}</td>
                      <td>{row.totalOrders}</td>
                      <td>{formatMoney(row.paidRevenue)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="analytics-card analytics-products">
        <h2>Top 5 Selling Products</h2>
        <p>
          Ranked by units in non-cancelled orders, including unpaid orders.
        </p>

        <div className="analytics-table-wrap">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Units</th>
                <th>Orders</th>
                <th>Order Value</th>
              </tr>
            </thead>
            <tbody>
              {analytics.topProducts.length === 0 ? (
                <tr>
                  <td colSpan={4}>No product sales data for this period.</td>
                </tr>
              ) : (
                analytics.topProducts.map((row) => (
                  <tr key={row.productId}>
                    <td>{row.productName}</td>
                    <td>{row.unitsSold}</td>
                    <td>{row.orderCount}</td>
                    <td>{formatMoney(row.orderValue)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
