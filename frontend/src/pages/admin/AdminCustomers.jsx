
import { useEffect, useState } from "react";
import {
  Users,
  Search,
  RefreshCw,
  Eye,
  ArrowLeft,
  UserCheck,
  UserX,
} from "lucide-react";

import api from "../../services/api";
import "./AdminCustomers.css";

const money = (value) =>
  `ETB ${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const dateText = (value) =>
  value ? new Date(value).toLocaleDateString("en-GB") : "-";

const errorMessage = (error) =>
  error.response?.data?.message ||
  error.message ||
  "Something went wrong.";

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadCustomers = async (query = "") => {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.get("/admin/customers", {
        params: { search: query },
      });

      if (!data?.success) {
        throw new Error("Invalid customers response.");
      }

      setCustomers(data.customers || []);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    async function initialLoad() {
      try {
        const { data } = await api.get("/admin/customers");

        if (!active) return;

        setCustomers(data.customers || []);
      } catch (err) {
        if (active) setError(errorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    }

    initialLoad();

    return () => {
      active = false;
    };
  }, []);

  const openCustomer = async (id) => {
    try {
      setDetailsLoading(true);
      setError("");

      const { data } = await api.get(
        `/admin/customers/${id}`
      );

      if (!data?.success) {
        throw new Error("Unable to load customer.");
      }

      setSelected(data.customer);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setDetailsLoading(false);
    }
  };

  const changeStatus = async () => {
    if (!selected || saving) return;

    const nextStatus = !selected.isActive;

    const confirmed = window.confirm(
      `Are you sure you want to ${
        nextStatus ? "activate" : "deactivate"
      } ${selected.fullName}?`
    );

    if (!confirmed) return;

    try {
      setSaving(true);
      setError("");

      await api.patch(
        `/admin/customers/${selected.id}/status`,
        { isActive: nextStatus }
      );

      setSelected((previous) => ({
        ...previous,
        isActive: nextStatus,
      }));

      setCustomers((previous) =>
        previous.map((customer) =>
          customer.id === selected.id
            ? { ...customer, isActive: nextStatus }
            : customer
        )
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="customers-page">
      <header className="customers-header">
        <div>
          <span className="customers-eyebrow">
            CUSTOMER RELATIONSHIP MANAGEMENT
          </span>
          <h1>
            <Users size={27} />
            Customer Management
          </h1>
          <p>
            Manage customer accounts and review order history.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadCustomers(search)}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </header>

      {error && (
        <div className="customers-error" role="alert">
          {error}
        </div>
      )}

      {selected ? (
        <section className="customers-card">
          <button
            className="customers-back"
            type="button"
            onClick={() => setSelected(null)}
          >
            <ArrowLeft size={17} />
            Back to Customers
          </button>

          <div className="customers-details-heading">
            <div>
              <h2>{selected.fullName}</h2>
              <p>{selected.email}</p>
              <span
                className={
                  selected.isActive
                    ? "customer-status active"
                    : "customer-status inactive"
                }
              >
                {selected.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <button
              type="button"
              className={
                selected.isActive
                  ? "customers-deactivate"
                  : "customers-activate"
              }
              onClick={changeStatus}
              disabled={saving}
            >
              {selected.isActive ? (
                <UserX size={17} />
              ) : (
                <UserCheck size={17} />
              )}

              {saving
                ? "Saving..."
                : selected.isActive
                  ? "Deactivate"
                  : "Activate"}
            </button>
          </div>

          <div className="customers-summary">
            <div>
              <span>Total Orders</span>
              <strong>{selected.totalOrders}</strong>
            </div>

            <div>
              <span>Total Paid Spending</span>
              <strong>{money(selected.totalSpent)}</strong>
            </div>

            <div>
              <span>Latest Phone</span>
              <strong>{selected.phone || "-"}</strong>
            </div>

            <div>
              <span>Latest City</span>
              <strong>{selected.city || "-"}</strong>
            </div>

            <div>
              <span>Joined</span>
              <strong>{dateText(selected.createdAt)}</strong>
            </div>
          </div>

          <h3>Order History</h3>

          <div className="customers-table-wrap">
            <table className="customers-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Date</th>
                  <th>Phone</th>
                  <th>City</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Total</th>
                </tr>
              </thead>

              <tbody>
                {selected.orders.length === 0 ? (
                  <tr>
                    <td colSpan={7}>No orders yet.</td>
                  </tr>
                ) : (
                  selected.orders.map((order) => (
                    <tr key={order.id}>
                      <td>#{order.id}</td>
                      <td>{dateText(order.createdAt)}</td>
                      <td>{order.phone}</td>
                      <td>{order.city}</td>
                      <td>{order.status}</td>
                      <td>{order.paymentStatus}</td>
                      <td>{money(order.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="customers-card">
          <div className="customers-toolbar">
            <div>
              <h2>All Customers</h2>
              <p>{customers.length} matching customers</p>
            </div>

            <form
              className="customers-search"
              onSubmit={(event) => {
                event.preventDefault();
                loadCustomers(search);
              }}
            >
              <Search size={18} />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search name, email or phone..."
                maxLength={150}
              />

              <button type="submit" disabled={loading}>
                Search
              </button>
            </form>
          </div>

          {loading || detailsLoading ? (
            <p className="customers-message">Loading...</p>
          ) : (
            <div className="customers-table-wrap">
              <table className="customers-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>City</th>
                    <th>Orders</th>
                    <th>Paid Spending</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        No customers found.
                      </td>
                    </tr>
                  ) : (
                    customers.map((customer) => (
                      <tr key={customer.id}>
                        <td>
                          <strong>{customer.fullName}</strong>
                          <small>{customer.email}</small>
                        </td>
                        <td>{customer.phone || "-"}</td>
                        <td>{customer.city || "-"}</td>
                        <td>{customer.totalOrders}</td>
                        <td>{money(customer.totalSpent)}</td>
                        <td>
                          <span
                            className={
                              customer.isActive
                                ? "customer-status active"
                                : "customer-status inactive"
                            }
                          >
                            {customer.isActive
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() =>
                              openCustomer(customer.id)
                            }
                            disabled={detailsLoading}
                          >
                            <Eye size={16} />
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
