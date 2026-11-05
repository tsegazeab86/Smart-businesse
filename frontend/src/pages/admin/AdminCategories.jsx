
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  FolderOpen,
  Layers3,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

import api from "../../services/api";
import "./AdminCategories.css";

const emptyForm = {
  name: "",
  icon: "🛍️",
};

function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  // Initial API request:
  // No synchronous setState call inside useEffect.
  useEffect(() => {
    let active = true;

    async function fetchInitialCategories() {
      try {
        const { data } = await api.get("/admin/categories");

        if (!active) return;

        setCategories(data.categories || []);
      } catch (err) {
        if (!active) return;

        console.error("LOAD CATEGORIES:", err);

        setError(
          err.response?.data?.message ||
            "Unable to load categories."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchInitialCategories();

    return () => {
      active = false;
    };
  }, []);

  // Used by Refresh, Add, Edit and Delete actions.
  const loadCategories = async () => {
    try {
      setRefreshing(true);
      setError("");

      const { data } = await api.get("/admin/categories");

      setCategories(data.categories || []);
    } catch (err) {
      console.error("REFRESH CATEGORIES:", err);

      setError(
        err.response?.data?.message ||
          "Unable to refresh categories."
      );
    } finally {
      setRefreshing(false);
    }
  };

  const filteredCategories = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return categories;

    return categories.filter((category) => {
      return (
        category.name.toLowerCase().includes(keyword) ||
        String(category.id).includes(keyword)
      );
    });
  }, [categories, search]);

  const totalProducts = categories.reduce(
    (sum, category) => sum + Number(category.productCount || 0),
    0
  );

  const emptyCategories = categories.filter(
    (category) => Number(category.productCount) === 0
  ).length;

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (category) => {
    setEditingId(category.id);

    setForm({
      name: category.name,
      icon: category.icon || "🛍️",
    });

    setFormError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const name = form.name.trim();
    const icon = form.icon.trim();

    if (!name || name.length > 100) {
      setFormError(
        "Category name must contain 1–100 characters."
      );
      return;
    }

    if (!icon || [...icon].length > 10) {
      setFormError("Please enter a valid category icon.");
      return;
    }

    try {
      setSaving(true);
      setFormError("");
      setError("");
      setNotice("");

      const payload = { name, icon };

      let response;

      if (editingId) {
        response = await api.put(
          `/admin/categories/${editingId}`,
          payload
        );
      } else {
        response = await api.post(
          "/admin/categories",
          payload
        );
      }

      setNotice(
        response.data.message ||
          "Category saved successfully."
      );

      setShowModal(false);
      setEditingId(null);
      setForm(emptyForm);

      await loadCategories();
    } catch (err) {
      console.error("SAVE CATEGORY:", err);

      setFormError(
        err.response?.data?.message ||
          "Unable to save category."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    const count = Number(category.productCount || 0);

    if (count > 0) {
      setError(
        `"${category.name}" contains ${count} product(s). Move its products to another category before deleting it.`
      );
      setNotice("");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${category.name}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(category.id);
      setError("");
      setNotice("");

      const { data } = await api.delete(
        `/admin/categories/${category.id}`
      );

      setNotice(
        data.message || "Category deleted successfully."
      );

      await loadCategories();
    } catch (err) {
      console.error("DELETE CATEGORY:", err);

      setError(
        err.response?.data?.message ||
          "Unable to delete category."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="ac-page">
      <div className="ac-container">
        {/* TOP BAR */}
        <div className="ac-topline">
          <Link to="/admin" className="ac-back">
            <ArrowLeft size={17} />
            Back to Dashboard
          </Link>

          <span className="ac-admin-label">
            <ShieldCheck size={16} />
            ADMIN MANAGEMENT
          </span>
        </div>

        {/* HEADER */}
        <header className="ac-header">
          <div>
            <span className="ac-eyebrow">
              STORE ORGANIZATION
            </span>

            <h1>Manage Categories</h1>

            <p>
              Create, organize and manage your store's
              product categories.
            </p>
          </div>

          <div className="ac-header-actions">
            <button
              type="button"
              className="ac-btn ac-btn-light"
              onClick={loadCategories}
              disabled={loading || refreshing}
            >
              <RefreshCw
                size={17}
                className={refreshing ? "ac-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              className="ac-btn ac-btn-primary"
              onClick={openAddModal}
            >
              <Plus size={18} />
              Add Category
            </button>
          </div>
        </header>

        {/* ALERTS */}
        {notice && (
          <div className="ac-alert ac-alert-success">
            <CheckCircle2 size={19} />
            <span>{notice}</span>

            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {error && (
          <div className="ac-alert ac-alert-error" role="alert">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* STATISTICS */}
        <div className="ac-stats">
          <div className="ac-stat">
            <div className="ac-stat-icon">
              <Layers3 size={22} />
            </div>
            <span>Total Categories</span>
            <strong>{categories.length}</strong>
            <small>Store departments</small>
          </div>

          <div className="ac-stat">
            <div className="ac-stat-icon">
              <FolderOpen size={22} />
            </div>
            <span>Assigned Products</span>
            <strong>{totalProducts}</strong>
            <small>Including inactive products</small>
          </div>

          <div className="ac-stat">
            <div className="ac-stat-icon">
              <Plus size={22} />
            </div>
            <span>Empty Categories</span>
            <strong>{emptyCategories}</strong>
            <small>Available for new products</small>
          </div>
        </div>

        {/* CATEGORY PANEL */}
        <section className="ac-panel">
          <div className="ac-panel-heading">
            <div>
              <h2>All Categories</h2>
              <p>
                Search, edit or remove your store categories.
              </p>
            </div>

            <span className="ac-count">
              {filteredCategories.length} Categories
            </span>
          </div>

          <div className="ac-toolbar">
            <div className="ac-search">
              <Search size={18} />

              <input
                type="search"
                placeholder="Search by category name or ID..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </div>
          </div>

          {loading ? (
            <div className="ac-empty">
              <LoaderCircle
                size={35}
                className="ac-spin"
              />
              <p>Loading categories...</p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="ac-empty">
              <FolderOpen size={35} />

              <h3>No categories found</h3>

              <p>
                {search
                  ? "Try a different search keyword."
                  : "Create your first category to get started."}
              </p>
            </div>
          ) : (
            <div className="ac-table-scroll">
              <table className="ac-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Category ID</th>
                    <th>Products</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCategories.map((category) => {
                    const productCount = Number(
                      category.productCount || 0
                    );

                    return (
                      <tr key={category.id}>
                        <td>
                          <div className="ac-category-cell">
                            <div className="ac-category-icon">
                              {category.icon || "🛍️"}
                            </div>

                            <div>
                              <strong>{category.name}</strong>
                              <small>Product category</small>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="ac-id">
                            #{category.id}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`ac-product-count ${
                              productCount === 0
                                ? "ac-product-count-empty"
                                : ""
                            }`}
                          >
                            {productCount} Products
                          </span>
                        </td>

                        <td className="ac-date">
                          {category.created_at
                            ? new Date(
                                category.created_at
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "—"}
                        </td>

                        <td>
                          <div className="ac-actions">
                            <button
                              type="button"
                              className="ac-icon-btn"
                              title="Edit category"
                              aria-label={`Edit ${category.name}`}
                              onClick={() =>
                                openEditModal(category)
                              }
                            >
                              <Pencil size={16} />
                            </button>

                            <button
                              type="button"
                              className="ac-icon-btn ac-delete-btn"
                              title={
                                productCount > 0
                                  ? "Move products before deleting"
                                  : "Delete category"
                              }
                              aria-label={`Delete ${category.name}`}
                              disabled={
                                deletingId === category.id
                              }
                              onClick={() =>
                                handleDelete(category)
                              }
                            >
                              {deletingId === category.id ? (
                                <LoaderCircle
                                  size={16}
                                  className="ac-spin"
                                />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
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

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div
          className="ac-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <section
            className="ac-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ac-modal-title"
          >
            <div className="ac-modal-header">
              <div>
                <span className="ac-eyebrow">
                  CATEGORY DETAILS
                </span>

                <h2 id="ac-modal-title">
                  {editingId
                    ? "Edit Category"
                    : "Add New Category"}
                </h2>
              </div>

              <button
                type="button"
                className="ac-modal-close"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <form className="ac-form" onSubmit={handleSubmit}>
              {formError && (
                <div
                  className="ac-alert ac-alert-error"
                  role="alert"
                >
                  {formError}
                </div>
              )}

              <div className="ac-field">
                <label htmlFor="category-name">
                  Category Name *
                </label>

                <input
                  id="category-name"
                  type="text"
                  placeholder="e.g. Kitchen Appliances"
                  maxLength={100}
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      name: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="ac-field">
                <label htmlFor="category-icon">
                  Category Icon *
                </label>

                <input
                  id="category-icon"
                  type="text"
                  placeholder="e.g. 🍳"
                  required
                  value={form.icon}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      icon: event.target.value,
                    }))
                  }
                />

                <small>
                  Use an emoji such as 📱, 👟, 🏠, 💄 or 🍳.
                </small>
              </div>

              <div className="ac-icon-preview">
                <div className="ac-preview-symbol">
                  {form.icon || "🛍️"}
                </div>

                <div>
                  <strong>
                    {form.name.trim() || "Category Preview"}
                  </strong>

                  <span>
                    This is how your category icon will appear.
                  </span>
                </div>
              </div>

              <div className="ac-modal-footer">
                <button
                  type="button"
                  className="ac-btn ac-btn-light"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="ac-btn ac-btn-primary"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <LoaderCircle
                        size={17}
                        className="ac-spin"
                      />
                      Saving...
                    </>
                  ) : editingId ? (
                    <>
                      <CheckCircle2 size={17} />
                      Save Changes
                    </>
                  ) : (
                    <>
                      <Plus size={17} />
                      Create Category
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

export default AdminCategories;
