import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { sellerApi } from "../../services/sellerApi";
import "./SellerProducts.css";

const blank = { name: "", description: "", categoryId: "", price: "", stock: "", image: "" };
const listOf = (r) => Array.isArray(r) ? r : r?.products ?? r?.data?.products ?? r?.data ?? [];
const messageOf = (e) => e?.response?.data?.message || e?.message || "Something went wrong.";
const money = (v) => Number(v || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });

export default function SellerProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [modal, setModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  // Initial request: state updates only after the async response.
  useEffect(() => {
    let cancelled = false;
    async function initialLoad() {
      try {
        const r = await sellerApi.getProducts();
        if (!cancelled) setProducts(listOf(r));
      } catch (e) {
        if (!cancelled) setError(messageOf(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    initialLoad();
    return () => { cancelled = true; };
  }, []);
  const reload = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await sellerApi.getProducts();
      setProducts(listOf(r));
      setError("");
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!modal) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [modal]);

  useEffect(() => {
    if (!modal) return undefined;
    const onKey = (e) => { if (e.key === "Escape" && !saving) setModal(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal, saving]);

  function openCreate() {
    setEditingId(null);
    setForm({ ...blank });
    setFormError("");
    setNotice("");
    setModal(true);
  }

  function openEdit(p) {
    setEditingId(p.id);
    setForm({
      name: String(p.name ?? ""),
      description: String(p.description ?? ""),
      categoryId: String(p.categoryId ?? p.category_id ?? ""),
      price: String(p.price ?? ""),
      stock: String(p.stock ?? ""),
      image: String(p.image ?? "")
    });
    setFormError("");
    setNotice("");
    setModal(true);
  }

  function closeModal() { if (!saving) setModal(false); }

  function validate() {
    const name = form.name.trim();
    const description = form.description.trim();
    const image = form.image.trim();
    const categoryId = Number(form.categoryId);
    const price = Number(form.price);
    const stock = Number(form.stock);
    if (name.length < 2 || name.length > 200) return { error: "Product name must contain 2–200 characters." };
    if (!Number.isSafeInteger(categoryId) || categoryId < 1) return { error: "Enter an existing category ID." };
    if (form.price === "" || !/^\d+(\.\d{1,2})?$/.test(form.price) || !Number.isFinite(price) || price <= 0 || price > 99999999.99)
      return { error: "Price must be greater than zero, with at most two decimal places." };
    if (form.stock === "" || !Number.isSafeInteger(stock) || stock < 0) return { error: "Stock must be a non-negative whole number." };
    if (image.length > 5) return { error: "Image URL is too long (maximum 50 characters)." };
    return { payload: { name, description, categoryId, price, stock, image } };
  }
  async function submit(e) {
    e.preventDefault();

    console.log("STEP 1: Create clicked");
    console.log("FORM:", form);

    const result = validate();

    console.log("STEP 2: Validation result:", result);

    if (result.error) {
      alert("VALIDATION ERROR: " + result.error);
      setFormError(result.error);
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      console.log("STEP 3: Sending request...");
      console.log("PAYLOAD:", result.payload);

      const response =
        editingId !== null
          ? await sellerApi.updateProduct(editingId, result.payload)
          : await sellerApi.addProduct(result.payload);

      console.log("STEP 4: API SUCCESS:", response);

      alert("Product saved successfully!");

      setModal(false);
      await reload();

    } catch (err) {
      console.error("FULL API ERROR:", err);
      console.error("BACKEND RESPONSE:", err.response?.data);

      const message =
        err.response?.data?.message ||
        err.message ||
        "Unknown error";

      alert("CREATE PRODUCT FAILED: " + message);
      setFormError(message);

    } finally {
      setSaving(false);
    }
  }

  async function remove(p) {
    if (!window.confirm(`Deactivate "${p.name}"?`)) return;
    setDeletingId(p.id);
    setNotice("");
    try {
      await sellerApi.deleteProduct(p.id);
      setNotice("Product deactivated successfully.");
      await reload();
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setDeletingId(null);
    }
  }

  const active = products.filter((p) => Number(p.isActive ?? p.is_active ?? 1) === 1);
  const units = active.reduce((sum, p) => sum + Number(p.stock || 0), 0);
  const value = active.reduce((sum, p) => sum + Number(p.stock || 0) * Number(p.price || 0), 0);

  return (
    <main className="sp-page">
      <div className="sp-container">
        <header className="sp-hero">
          <div>
            <span className="sp-eyebrow"><span className="sp-live-dot" /> SELLER WORKSPACE / INVENTORY</span>
            <h1>Product <em>Studio.</em></h1>
            <p>Everything in your store, beautifully organized in one place.</p>
          </div>
          <button className="sp-primary-btn" type="button" onClick={openCreate}>
            <i className="bi bi-plus-lg" aria-hidden="true" /> Add new product
          </button>
        </header>

        {error && <div className="sp-alert sp-alert-error" role="alert">{error}<button type="button" onClick={() => setError("")} aria-label="Dismiss">×</button></div>}
        {notice && <div className="sp-alert sp-alert-success" role="status"><i className="bi bi-check-circle" /> {notice}<button type="button" onClick={() => setNotice("")} aria-label="Dismiss">×</button></div>}

        <section className="sp-stats" aria-label="Inventory summary">
          <article className="sp-stat-card"><span className="sp-stat-icon"><i className="bi bi-grid-1x2" /></span><div><span>Active products</span><strong>{active.length}</strong><small>In your catalog</small></div></article>
          <article className="sp-stat-card"><span className="sp-stat-icon purple"><i className="bi bi-box-seam" /></span><div><span>Available units</span><strong>{money(units)}</strong><small>Across all products</small></div></article>
          <article className="sp-stat-card"><span className="sp-stat-icon green"><i className="bi bi-graph-up-arrow" /></span><div><span>Inventory value</span><strong>{money(value)} <span className="sp-currency">ETB</span></strong><small>Price × stock</small></div></article>
        </section>

        <section className="sp-inventory">
          <div className="sp-inventory-heading">
            <div><span className="sp-section-label">YOUR COLLECTION</span><h2>Product inventory <span className="sp-count">{active.length}</span></h2><p>Manage listings, prices, and availability.</p></div>
            <button type="button" className="sp-refresh-btn" disabled={refreshing || loading} onClick={reload}><i className={`bi bi-arrow-clockwise ${refreshing ? "sp-spin" : ""}`} /> {refreshing ? "Refreshing..." : "Refresh"}</button>
          </div>
          {loading ? (
            <div className="sp-state"><span className="sp-loader" /><h3>Loading your inventory</h3><p>Getting everything ready...</p></div>
          ) : active.length === 0 ? (
            <div className="sp-state"><div className="sp-empty-icon"><i className="bi bi-box-seam" /></div><h3>Your next big thing starts here.</h3><p>Create your first product and make your storefront shine.</p><button className="sp-primary-btn" onClick={openCreate} type="button"><i className="bi bi-plus-lg" /> Create first product</button></div>
          ) : (
            <div className="sp-product-grid">
              {active.map((p) => (
                <article className="sp-product-card" key={p.id}>
                  <div className="sp-product-image">
                    {p.image ? <img src={p.image} alt={p.name} onError={(e) => { e.currentTarget.style.display = "none"; }} /> : <div className="sp-fallback-icon"><i className="bi bi-box-seam" /></div>}
                    <span className="sp-status"><span /> Active</span>
                  </div>
                  <div className="sp-product-content">
                    <span className="sp-product-category">{p.categoryName || p.category_name || `Category #${p.categoryId ?? p.category_id ?? "—"}`}</span>
                    <h3>{p.name}</h3>
                    <p className="sp-product-description">{p.description || "No description provided."}</p>
                    <div className="sp-product-meta"><div><span>PRICE</span><strong>{money(p.price)} ETB</strong></div><div><span>IN STOCK</span><strong>{money(p.stock)} units</strong></div></div>
                    <div className="sp-product-actions"><button type="button" className="sp-edit-btn" onClick={() => openEdit(p)}><i className="bi bi-pencil-square" /> Edit product</button><button type="button" className="sp-delete-btn" disabled={deletingId === p.id} onClick={() => remove(p)}>{deletingId === p.id ? <span className="sp-mini-loader" /> : <i className="bi bi-trash3" />} {deletingId === p.id ? "Deleting..." : "Delete"}</button></div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {modal && createPortal(
        <div className="sp-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <section className="sp-modal" role="dialog" aria-modal="true" aria-labelledby="sp-modal-title">
            <div className="sp-modal-top"><div><span className="sp-section-label">{editingId === null ? "NEW LISTING" : "UPDATE LISTING"}</span><h2 id="sp-modal-title">{editingId === null ? "Create a product" : "Edit your product"}</h2><p>Add the details customers need to know about your product.</p></div><button className="sp-modal-close" type="button" onClick={closeModal} disabled={saving} aria-label="Close dialog"><i className="bi bi-x-lg" /></button></div>
            <form onSubmit={submit} className="sp-form">
              {formError && <div className="sp-alert sp-alert-error" role="alert">{formError}</div>}
              <div className="sp-field"><label htmlFor="sp-name">Product name <b>*</b></label><input autoFocus id="sp-name" name="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} maxLength={200} placeholder="e.g. Smart Electric Kettle" required /></div>
              <div className="sp-field"><label htmlFor="sp-description">Description</label><textarea id="sp-description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={6} placeholder="Write a detailed product description..." /></div>
              <div className="sp-two-columns">
                <div className="sp-field"><label htmlFor="sp-category">Category ID <b>*</b></label><input id="sp-category" type="number" min="1" step="1" value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))} placeholder="Existing category ID" required /><small>Must exist in your categories table.</small></div>
                <div className="sp-field"><label htmlFor="sp-price">Price (ETB) <b>*</b></label><input id="sp-price" type="number" min="0.01" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="2800.00" required /></div>
              </div>
              <div className="sp-two-columns">
                <div className="sp-field"><label htmlFor="sp-stock">Available stock <b>*</b></label><input id="sp-stock" type="number" min="0" step="1" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} placeholder="10" required /></div>
                <div className="sp-field"><label htmlFor="sp-image">Product image URL</label><input id="sp-image" type="url" value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} placeholder="https://example.com/image.jpg" /></div>
              </div>
              {form.image.trim() && <div className="sp-image-preview"><img src={form.image.trim()} alt="Product preview" onError={(e) => { e.currentTarget.style.display = "none"; }} /><span>Image preview</span></div>}
              <footer className="sp-modal-actions"><button className="sp-secondary-btn" type="button" onClick={closeModal} disabled={saving}>Cancel</button><button className="sp-primary-btn" type="submit" disabled={saving}>{saving ? <><span className="sp-mini-loader" /> {editingId === null ? "Creating product..." : "Saving changes..."}</> : <><i className={`bi ${editingId === null ? "bi-plus-lg" : "bi-check-lg"}`} /> {editingId === null ? "Create product" : "Save changes"}</>}</button></footer>
            </form>
            {saving && <div className="sp-saving-overlay" role="status"><span className="sp-loader" /><strong>{editingId === null ? "Creating your product" : "Updating your product"}</strong><p>Just a moment...</p></div>}
          </section>
        </div>, document.body
      )}
    </main>
  );
}
