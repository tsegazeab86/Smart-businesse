
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  ArrowLeft,
  Boxes,
  CheckCircle2,
  ImageOff,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import api from "../../services/api";
import "./AdminProducts.css";

// Backend server URL
const BACKEND_URL = "http://localhost:5000";

// Convert relative image paths into full URLs
const getImageUrl = (image) => {
  if (!image) return "";

  if (/^https?:\/\//i.test(image)) {
    return image;
  }

  return `${BACKEND_URL}${
    image.startsWith("/") ? "" : "/"
  }${image}`;
};

const initialForm = {
  name: "",
  categoryId: "",
  description: "",
  price: "",
  stock: "",
  image: "",
  rating: "0",
  badge: "",
  isFeatured: false,
};

const formatMoney = (value) =>
  `ETB ${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function AdminProducts() {
  // Product data
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Messages
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");

  // Product form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState("");

  // Load products and categories
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [productsResponse, categoriesResponse] =
        await Promise.all([
          api.get("/admin/products"),
          api.get("/categories"),
        ]);

      setProducts(productsResponse.data.products || []);
      setCategories(categoriesResponse.data.categories || []);
    } catch (err) {
      console.error("LOAD ADMIN PRODUCTS:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load products. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    let active = true;

    async function fetchInitialData() {
      try {
        const [productsResponse, categoriesResponse] =
          await Promise.all([
            api.get("/admin/products"),
            api.get("/categories"),
          ]);

        if (!active) return;

        setProducts(productsResponse.data.products || []);
        setCategories(categoriesResponse.data.categories || []);
      } catch (err) {
        if (!active) return;

        console.error("LOAD ADMIN PRODUCTS:", err);

        setError(
          err.response?.data?.message ||
            "Unable to load products."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchInitialData();

    return () => {
      active = false;
    };
  }, []);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const keyword = search.trim().toLowerCase();

      const matchesSearch =
        !keyword ||
        String(product.name || "")
          .toLowerCase()
          .includes(keyword) ||
        String(product.id).includes(keyword);

      const matchesCategory =
        categoryFilter === "all" ||
        String(product.category_id) === categoryFilter;

      const active = Number(product.is_active) === 1;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && active) ||
        (statusFilter === "removed" && !active);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus
      );
    });
  }, [
    products,
    search,
    categoryFilter,
    statusFilter,
  ]);

  // Statistics
  const activeCount = products.filter(
    (product) => Number(product.is_active) === 1
  ).length;

  const lowStockCount = products.filter(
    (product) =>
      Number(product.is_active) === 1 &&
      Number(product.stock) <= 5
  ).length;

  // Open add product form
  const openAddForm = () => {
    setEditingId(null);
    setForm({ ...initialForm });
    setFormError("");
    setNotice("");
    setShowForm(true);
  };

  // Open edit product form
  const openEditForm = (product) => {
    setEditingId(product.id);

    setForm({
      name: product.name || "",
      categoryId: String(product.category_id ?? ""),
      description: product.description || "",
      price: String(product.price ?? ""),
      stock: String(product.stock ?? ""),
      image: product.image || "",
      rating: String(product.rating ?? 0),
      badge: product.badge || "",
      isFeatured: Number(product.is_featured) === 1,
    });

    setFormError("");
    setNotice("");
    setShowForm(true);
  };

  // Close form
  const closeForm = () => {
    if (saving || uploadingImage) return;

    setShowForm(false);
    setEditingId(null);
    setForm({ ...initialForm });
    setFormError("");
  };

  // Update form fields
  const updateField = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Upload image to backend
  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setFormError(
        "Only JPG, PNG and WebP images are allowed."
      );

      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError("Image must not exceed 5MB.");
      event.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    try {
      setUploadingImage(true);
      setFormError("");

      const { data } = await api.post(
        "/admin/products/upload-image",
        formData
      );

      if (!data.success || !data.image) {
        throw new Error("Image upload failed.");
      }

      setForm((previous) => ({
        ...previous,
        image: data.image,
      }));
    } catch (err) {
      console.error("IMAGE UPLOAD ERROR:", err);

      setFormError(
        err.response?.data?.message ||
          err.message ||
          "Unable to upload image."
      );
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  };

  // Save product
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving || uploadingImage) return;

    setSaving(true);
    setFormError("");

    const payload = {
      name: form.name.trim(),
      categoryId: Number(form.categoryId),
      description: form.description.trim(),
      price: Number(form.price),
      stock: Number(form.stock),
      image: form.image.trim(),
      rating: Number(form.rating),
      badge: form.badge.trim(),
      isFeatured: form.isFeatured,
    };

    try {
      if (editingId !== null) {
        await api.put(
          `/admin/products/${editingId}`,
          payload
        );

        setNotice("Product updated successfully.");
      } else {
        await api.post("/admin/products", payload);

        setNotice("New product added successfully.");
      }

      setShowForm(false);
      setEditingId(null);
      setForm({ ...initialForm });

      await loadData();
    }catch (err) {
  console.error("SAVE PRODUCT ERROR:", {
    status: err.response?.status,
    backendMessage: err.response?.data?.message,
    backendResponse: err.response?.data,
    submittedPayload: payload,
  });

  setFormError(
    err.response?.data?.message ||
    err.response?.data?.error ||
    "Unable to save product."
  );
} finally {
      setSaving(false);
    }
  };

  // Remove product
  const handleDelete = async (product) => {
    const confirmed = window.confirm(
      `Remove "${product.name}" from the store?\n\nHistorical orders will be preserved.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(product.id);
      setError("");
      setNotice("");

      await api.delete(`/admin/products/${product.id}`);

      setNotice(
        `"${product.name}" removed from the store.`
      );

      await loadData();
    } catch (err) {
      console.error("DELETE PRODUCT:", err);

      setError(
        err.response?.data?.message ||
          "Unable to remove product."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="ap-page">
      <div className="ap-container">

        {/* TOP NAVIGATION */}
        <div className="ap-topline">
          <Link to="/admin" className="ap-back">
            <ArrowLeft size={17} />
            Back to Dashboard
          </Link>

          <span className="ap-admin-label">
            <Boxes size={16} />
            Inventory Management
          </span>
        </div>

        {/* PAGE HEADER */}
        <header className="ap-header">
          <div>
            <span className="ap-eyebrow">
              INJIBARA SMART BUSINESS
            </span>

            <h1>Product Management</h1>

            <p>
              Manage your store inventory, pricing and
              product details.
            </p>
          </div>

          <div className="ap-header-actions">
            <button
              type="button"
              className="ap-btn ap-btn-light"
              onClick={loadData}
              disabled={loading}
            >
              <RefreshCw size={17} />
              Refresh
            </button>

            <button
              type="button"
              className="ap-btn ap-btn-primary"
              onClick={openAddForm}
            >
              <Plus size={18} />
              Add Product
            </button>
          </div>
        </header>

        {/* STATISTICS */}
        <section className="ap-stats">
          <div className="ap-stat">
            <span>Total Products</span>
            <strong>{products.length}</strong>
            <small>Including removed products</small>
          </div>

          <div className="ap-stat">
            <span>Active Products</span>
            <strong>{activeCount}</strong>
            <small>Visible in your store</small>
          </div>

          <div className="ap-stat">
            <span>Low Stock</span>
            <strong>{lowStockCount}</strong>
            <small>5 units or fewer</small>
          </div>
        </section>

        {/* SUCCESS MESSAGE */}
        {notice && (
          <div
            className="ap-alert ap-alert-success"
            role="status"
          >
            <CheckCircle2 size={19} />

            <span>{notice}</span>

            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss message"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* ERROR MESSAGE */}
        {error && (
          <div
            className="ap-alert ap-alert-error"
            role="alert"
          >
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* PRODUCTS PANEL */}
        <section className="ap-panel">
          <div className="ap-panel-heading">
            <div>
              <h2>Products</h2>

              <p>
                {filteredProducts.length} products found
              </p>
            </div>
          </div>

          {/* FILTERS */}
          <div className="ap-filters">
            <label className="ap-search">
              <Search size={19} />

              <input
                type="search"
                placeholder="Search product name or ID..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </label>

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value)
              }
              aria-label="Filter by category"
            >
              <option value="all">
                All Categories
              </option>

              {categories.map((category) => (
                <option
                  key={category.id}
                  value={String(category.id)}
                >
                  {category.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              aria-label="Filter by status"
            >
              <option value="active">
                Active Products
              </option>

              <option value="removed">
                Removed Products
              </option>

              <option value="all">
                All Products
              </option>
            </select>
          </div>

          {/* PRODUCT TABLE */}
          {loading ? (
            <div className="ap-empty">
              <LoaderCircle
                className="ap-spin"
                size={30}
              />

              <p>Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="ap-empty">
              <Boxes size={35} />

              <h3>No products found</h3>

              <p>
                Try another filter or add your first product.
              </p>
            </div>
          ) : (
            <div className="ap-table-scroll">
              <table className="ap-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProducts.map((product) => {
                    const active =
                      Number(product.is_active) === 1;

                    return (
                      <tr key={product.id}>
                        <td>
                          <div className="ap-product-cell">
                            <div className="ap-product-image">
                              {product.image ? (
                                <img
                                  src={getImageUrl(
                                    product.image
                                  )}
                                  alt={product.name}
                                  onError={(event) => {
                                    event.currentTarget.style.display =
                                      "none";
                                  }}
                                />
                              ) : (
                                <ImageOff size={23} />
                              )}
                            </div>

                            <div>
                              <strong>
                                {product.name}
                              </strong>

                              <small>
                                Product #{product.id}
                              </small>

                              {Number(
                                product.is_featured
                              ) === 1 && (
                                <span className="ap-featured">
                                  Featured
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td>{product.category}</td>

                        <td className="ap-price">
                          {formatMoney(product.price)}
                        </td>

                        <td>
                          <span
                            className={
                              Number(product.stock) <= 5
                                ? "ap-stock ap-stock-low"
                                : "ap-stock"
                            }
                          >
                            {product.stock} units
                          </span>
                        </td>

                        <td>
                          <span
                            className={`ap-status ${
                              active
                                ? "ap-status-active"
                                : "ap-status-removed"
                            }`}
                          >
                            {active
                              ? "Active"
                              : "Removed"}
                          </span>
                        </td>

                        <td>
                          <div className="ap-actions">
                            {active ? (
                              <>
                                <button
                                  type="button"
                                  className="ap-icon-btn"
                                  title="Edit product"
                                  aria-label={`Edit ${product.name}`}
                                  onClick={() =>
                                    openEditForm(product)
                                  }
                                >
                                  <Pencil size={17} />
                                </button>

                                <button
                                  type="button"
                                  className="ap-icon-btn ap-delete-btn"
                                  title="Remove product"
                                  aria-label={`Remove ${product.name}`}
                                  disabled={
                                    deletingId === product.id
                                  }
                                  onClick={() =>
                                    handleDelete(product)
                                  }
                                >
                                  {deletingId === product.id ? (
                                    <LoaderCircle
                                      className="ap-spin"
                                      size={17}
                                    />
                                  ) : (
                                    <Trash2 size={17} />
                                  )}
                                </button>
                              </>
                            ) : (
                              <span className="ap-muted">
                                Removed
                              </span>
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

      {/* ADD / EDIT PRODUCT MODAL */}
      {showForm && (
        <div
          className="ap-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeForm();
            }
          }}
        >
          <section
            className="ap-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ap-modal-title"
          >
            <div className="ap-modal-header">
              <div>
                <span className="ap-eyebrow">
                  PRODUCT DETAILS
                </span>

                <h2 id="ap-modal-title">
                  {editingId !== null
                    ? "Edit Product"
                    : "Add New Product"}
                </h2>
              </div>

              <button
                type="button"
                className="ap-modal-close"
                onClick={closeForm}
                disabled={saving || uploadingImage}
                aria-label="Close form"
              >
                <X size={22} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="ap-form"
            >
              {formError && (
                <div
                  className="ap-alert ap-alert-error"
                  role="alert"
                >
                  {formError}
                </div>
              )}

              {/* PRODUCT NAME */}
              <div className="ap-field">
                <label htmlFor="ap-name">
                  Product Name *
                </label>

                <input
                  id="ap-name"
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  maxLength={200}
                  required
                  placeholder="e.g. Wireless Bluetooth Speaker"
                />
              </div>

              {/* CATEGORY / PRICE / STOCK / RATING */}
              <div className="ap-form-grid">
                <div className="ap-field">
                  <label htmlFor="ap-category">
                    Category *
                  </label>

                  <select
                    id="ap-category"
                    name="categoryId"
                    value={form.categoryId}
                    onChange={updateField}
                    required
                  >
                    <option value="">
                      Select Category
                    </option>

                    {categories.map((category) => (
                      <option
                        key={category.id}
                        value={category.id}
                      >
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="ap-field">
                  <label htmlFor="ap-price">
                    Price (ETB) *
                  </label>

                  <input
                    id="ap-price"
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={updateField}
                    min="0"
                    max="99999999.99"
                    step="0.01"
                    required
                    placeholder="2500.00"
                  />
                </div>

                <div className="ap-field">
                  <label htmlFor="ap-stock">
                    Stock Quantity *
                  </label>

                  <input
                    id="ap-stock"
                    type="number"
                    name="stock"
                    value={form.stock}
                    onChange={updateField}
                    min="0"
                    max="1000000"
                    step="1"
                    required
                    placeholder="15"
                  />
                </div>

                <div className="ap-field">
                  <label htmlFor="ap-rating">
                    Rating (0–5)
                  </label>

                  <input
                    id="ap-rating"
                    type="number"
                    name="rating"
                    value={form.rating}
                    onChange={updateField}
                    min="0"
                    max="5"
                    step="0.1"
                  />
                </div>
              </div>

              {/* DESCRIPTION */}
              <div className="ap-field">
                <label htmlFor="ap-description">
                  Description
                </label>

                <textarea
                  id="ap-description"
                  name="description"
                  value={form.description}
                  onChange={updateField}
                  rows={4}
                  placeholder="Write a short product description..."
                />
              </div>

              {/* IMAGE UPLOAD */}
              <div className="ap-field">
                <label htmlFor="ap-image-upload">
                  Product Image
                </label>

                <label
                  htmlFor="ap-image-upload"
                  className="ap-btn ap-btn-light"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor:
                      uploadingImage || saving
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  <Upload size={17} />
                  Choose Image
                </label>

                <input
                  id="ap-image-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageUpload}
                  disabled={uploadingImage || saving}
                  style={{
                    display: "block",
                    marginTop: "10px",
                  }}
                />

                <small>
                  JPG, PNG or WebP. Maximum size: 5MB.
                </small>

                {uploadingImage && (
                  <span className="ap-uploading">
                    <LoaderCircle
                      className="ap-spin"
                      size={17}
                    />
                    Uploading image...
                  </span>
                )}
              </div>

              {/* IMAGE PREVIEW */}
              {form.image && (
                <div className="ap-image-preview">
                  <img
                    key={form.image}
                    src={getImageUrl(form.image)}
                    alt="Product preview"
                  />

                  <span>Image preview</span>
                </div>
              )}

              {/* BADGE */}
              <div className="ap-field">
                <label htmlFor="ap-badge">
                  Product Badge
                </label>

                <input
                  id="ap-badge"
                  name="badge"
                  value={form.badge}
                  onChange={updateField}
                  maxLength={50}
                  placeholder="New / Best Seller / Sale"
                />
              </div>

              {/* FEATURED */}
              <label className="ap-checkbox">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={form.isFeatured}
                  onChange={updateField}
                />

                <span>
                  <strong>
                    Featured Product
                  </strong>

                  <small>
                    Highlight this product on your store.
                  </small>
                </span>
              </label>

              {/* FORM ACTIONS */}
              <div className="ap-modal-footer">
                <button
                  type="button"
                  className="ap-btn ap-btn-light"
                  onClick={closeForm}
                  disabled={saving || uploadingImage}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="ap-btn ap-btn-primary"
                  disabled={saving || uploadingImage}
                >
                  {saving ? (
                    <>
                      <LoaderCircle
                        className="ap-spin"
                        size={17}
                      />
                      Saving...
                    </>
                  ) : editingId !== null ? (
                    "Save Changes"
                  ) : (
                    "Create Product"
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

export default AdminProducts;
