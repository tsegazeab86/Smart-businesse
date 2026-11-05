
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import {
  Search,
  SlidersHorizontal,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Package,
  Star,
  X,
  RotateCcw,
  LoaderCircle,
  Sparkles,
  ShoppingBag,
} from "lucide-react";

import api from "../services/api";
import "./Products.css";

/* =========================
   HELPERS
========================= */

const formatMoney = (value) =>
  `ETB ${Number(value || 0).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })}`;

const sortOptions = [
  { value: "newest", label: "Newest Arrivals" },
  { value: "oldest", label: "Oldest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
  { value: "name_asc", label: "Name: A to Z" },
];

const getCategoryList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.categories)) return data.categories;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const getProductList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

/* =========================
   COMPONENT
========================= */

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const sort = searchParams.get("sort") || "newest";

  const page = Math.max(
    1,
    Number(searchParams.get("page")) || 1
  );

  /* Form state, keyed by URL values to sync on navigation */
  const [searchDraft, setSearchDraft] = useState({
    source: search,
    value: search,
  });

  const [priceDraft, setPriceDraft] = useState({
    source: `${minPrice}|${maxPrice}`,
    min: minPrice,
    max: maxPrice,
  });

  const searchInput =
    searchDraft.source === search
      ? searchDraft.value
      : search;

  const priceSource = `${minPrice}|${maxPrice}`;

  const minInput =
    priceDraft.source === priceSource
      ? priceDraft.min
      : minPrice;

  const maxInput =
    priceDraft.source === priceSource
      ? priceDraft.max
      : maxPrice;

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileFilters, setMobileFilters] = useState(false);

  /* =========================
     UPDATE URL FILTERS
  ========================= */

  const updateFilters = (updates) => {
    const next = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (
        value === "" ||
        value === null ||
        value === undefined
      ) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    });

    if (!Object.prototype.hasOwnProperty.call(updates, "page")) {
      next.delete("page");
    }

    setSearchParams(next);
  };

  /* =========================
     LOAD CATEGORIES
  ========================= */

  useEffect(() => {
    let active = true;

    async function loadCategories() {
      try {
        const { data } = await api.get("/categories");

        console.log("CATEGORIES RESPONSE:", data);

        if (!active) return;

        setCategories(getCategoryList(data));
      } catch (err) {
        if (!active) return;

        console.error("LOAD CATEGORIES ERROR:", err);
      }
    }

    loadCategories();

    return () => {
      active = false;
    };
  }, []);

  /* =========================
     LOAD PRODUCTS
  ========================= */

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        const { data } = await api.get("/products", {
          params: {
            search,
            category,
            minPrice,
            maxPrice,
            sort,
            page,
            limit: 12,
          },
        });

        if (!active) return;

        console.log("PRODUCT FILTERS:", {
          search,
          category,
          minPrice,
          maxPrice,
          sort,
          page,
        });

        console.log("PRODUCTS RESPONSE:", data);

        setProducts(getProductList(data));

        setPagination(
          data?.pagination || {
            page,
            total: getProductList(data).length,
            totalPages: 1,
          }
        );

        setError("");
      } catch (err) {
        if (!active) return;

        console.error("LOAD PRODUCTS ERROR:", err);

        setError(
          err.response?.data?.message ||
            "Unable to load products. Please try again."
        );

        setProducts([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      active = false;
    };
  }, [
    search,
    category,
    minPrice,
    maxPrice,
    sort,
    page,
  ]);

  /* =========================
     ACTIONS
  ========================= */

  const clearFilters = () => {
    setSearchDraft({
      source: "",
      value: "",
    });

    setPriceDraft({
      source: "|",
      min: "",
      max: "",
    });

    setSearchParams({});
  };

  const submitSearch = (event) => {
    event.preventDefault();

    updateFilters({
      search: searchInput.trim(),
    });
  };

  const submitPrice = (event) => {
    event.preventDefault();

    const min = minInput.trim();
    const max = maxInput.trim();

    if (
      (min !== "" &&
        (!Number.isFinite(Number(min)) || Number(min) < 0)) ||
      (max !== "" &&
        (!Number.isFinite(Number(max)) || Number(max) < 0)) ||
      (min !== "" &&
        max !== "" &&
        Number(min) > Number(max))
    ) {
      setError("Please enter a valid price range.");
      return;
    }

    updateFilters({
      minPrice: min,
      maxPrice: max,
    });
  };

  const goToPage = (nextPage) => {
    if (
      nextPage < 1 ||
      nextPage > pagination.totalPages
    ) {
      return;
    }

    updateFilters({ page: nextPage });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const hasFilters = Boolean(
    search || category || minPrice || maxPrice
  );

  const selectedCategory = categories.find(
    (item) => String(item.id) === String(category)
  );

  /* =========================
     RENDER
  ========================= */

  return (
    <main className="pd-page">
      <div className="pd-container">

        {/* HERO */}
        <section className="pd-hero">
          <div className="pd-hero-content">
            <span className="pd-eyebrow">
              <Sparkles size={15} />
              INJIBARA SMART BUSINESS
            </span>

            <h1>
              Discover Products
              <br />
              You'll <span>Love.</span>
            </h1>

            <p>
              Explore carefully selected products,
              discover great deals, and enjoy a smarter
              way to shop.
            </p>

            <form
              className="pd-search"
              onSubmit={submitSearch}
            >
              <Search size={20} />

              <input
                type="search"
                placeholder="Search for products..."
                value={searchInput}
                onChange={(e) =>
                  setSearchDraft({
                    source: search,
                    value: e.target.value,
                  })
                }
                aria-label="Search products"
              />

              <button type="submit">
                Search
                <ArrowRight size={17} />
              </button>
            </form>
          </div>

          <div className="pd-hero-art" aria-hidden="true">
            <div className="pd-art-circle">
              <ShoppingBag
                size={100}
                strokeWidth={1.1}
              />
            </div>

            <span className="pd-floating-tag pd-tag-one">
              Premium Quality
            </span>

            <span className="pd-floating-tag pd-tag-two">
              Smart Shopping
            </span>
          </div>
        </section>

        {/* MOBILE FILTER TOGGLE */}
        <button
          type="button"
          className="pd-mobile-filter-btn"
          onClick={() =>
            setMobileFilters((previous) => !previous)
          }
        >
          <SlidersHorizontal size={18} />
          Filters

          {mobileFilters ? (
            <X size={18} />
          ) : (
            <ChevronRight size={18} />
          )}
        </button>

        <div className="pd-layout">

          {/* SIDEBAR */}
          <aside
            className={`pd-sidebar ${
              mobileFilters ? "pd-sidebar-open" : ""
            }`}
          >
            <div className="pd-sidebar-header">
              <h2>
                <SlidersHorizontal size={19} />
                Filters
              </h2>

              <button
                type="button"
                onClick={clearFilters}
              >
                <RotateCcw size={14} />
                Reset
              </button>
            </div>

            {/* CATEGORIES */}
            <div className="pd-filter-group">
              <h3>Categories</h3>

              <div className="pd-category-list">
                <button
                  type="button"
                  className={
                    !category ? "pd-category-active" : ""
                  }
                  onClick={() =>
                    updateFilters({ category: "" })
                  }
                >
                  <span>All Products</span>
                  <ArrowRight size={15} />
                </button>

                {categories.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={
                      String(category) === String(item.id)
                        ? "pd-category-active"
                        : ""
                    }
                    onClick={() =>
                      updateFilters({
                        category: String(item.id),
                      })
                    }
                  >
                    <span>
                      {item.icon || "◈"} {item.name}
                    </span>

                    <ArrowRight size={15} />
                  </button>
                ))}
              </div>
            </div>

            {/* PRICE RANGE */}
            <div className="pd-filter-group">
              <h3>Price Range</h3>

              <form
                className="pd-price-form"
                onSubmit={submitPrice}
              >
                <div className="pd-price-fields">
                  <label>
                    Min (ETB)

                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={minInput}
                      onChange={(e) =>
                        setPriceDraft({
                          source: priceSource,
                          min: e.target.value,
                          max: maxInput,
                        })
                      }
                    />
                  </label>

                  <label>
                    Max (ETB)

                    <input
                      type="number"
                      min="0"
                      placeholder="50000"
                      value={maxInput}
                      onChange={(e) =>
                        setPriceDraft({
                          source: priceSource,
                          min: minInput,
                          max: e.target.value,
                        })
                      }
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  className="pd-apply-btn"
                >
                  Apply Price
                </button>
              </form>
            </div>

            <div className="pd-sidebar-promo">
              <Sparkles size={23} />

              <strong>
                Discover Something New
              </strong>

              <p>
                Find quality products for your everyday life.
              </p>
            </div>
          </aside>

          {/* PRODUCTS */}
          <section className="pd-content">

            {/* TOOLBAR */}
            <div className="pd-toolbar">
              <div>
                <span className="pd-small-label">
                  CURATED COLLECTION
                </span>

                <h2>
                  {search
                    ? `Results for "${search}"`
                    : selectedCategory
                    ? selectedCategory.name
                    : "Explore Our Products"}
                </h2>

                <p>
                  {loading
                    ? "Loading products..."
                    : `${pagination.total} products found`}
                </p>
              </div>

              <div className="pd-sort">
                <label htmlFor="pd-sort-select">
                  Sort by
                </label>

                <select
                  id="pd-sort-select"
                  value={sort}
                  onChange={(e) =>
                    updateFilters({
                      sort: e.target.value,
                    })
                  }
                >
                  {sortOptions.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ACTIVE FILTERS */}
            {hasFilters && (
              <div className="pd-active-filters">
                <span>Active filters:</span>

                {search && (
                  <button
                    type="button"
                    onClick={() =>
                      updateFilters({ search: "" })
                    }
                  >
                    Search: {search}
                    <X size={13} />
                  </button>
                )}

                {category && (
                  <button
                    type="button"
                    onClick={() =>
                      updateFilters({ category: "" })
                    }
                  >
                    {selectedCategory?.name || "Category"}
                    <X size={13} />
                  </button>
                )}

                {(minPrice || maxPrice) && (
                  <button
                    type="button"
                    onClick={() =>
                      updateFilters({
                        minPrice: "",
                        maxPrice: "",
                      })
                    }
                  >
                    Price Range
                    <X size={13} />
                  </button>
                )}

                <button
                  type="button"
                  className="pd-clear-all"
                  onClick={clearFilters}
                >
                  Clear all
                </button>
              </div>
            )}

            {/* ERROR */}
            {error && (
              <div className="pd-error" role="alert">
                {error}
              </div>
            )}

            {/* LOADING */}
            {loading ? (
              <div className="pd-loading">
                <LoaderCircle
                  size={35}
                  className="pd-spin"
                />

                <p>
                  Finding great products for you...
                </p>
              </div>
            ) : products.length === 0 ? (
              <div className="pd-empty">
                <Package size={48} />

                <h3>No products found</h3>

                <p>
                  Try changing your search or filters.
                </p>

                <button
                  type="button"
                  onClick={clearFilters}
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <>
                {/* PRODUCT GRID */}
                <div className="pd-grid">
                  {products.map((product) => (
                    <article
                      className="pd-product-card"
                      key={product.id}
                    >
                      <Link
                        to={`/products/${product.id}`}
                        className="pd-product-image"
                      >
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            loading="lazy"
                          />
                        ) : (
                          <Package size={55} />
                        )}

                        {product.badge && (
                          <span className="pd-product-badge">
                            {product.badge}
                          </span>
                        )}
                      </Link>

                      <div className="pd-product-body">
                        <span className="pd-product-category">
                          {product.categoryName ||
                            "Collection"}
                        </span>

                        <Link
                          to={`/products/${product.id}`}
                          className="pd-product-title"
                        >
                          {product.name}
                        </Link>

                        <div className="pd-rating">
                          <Star
                            size={14}
                            fill="currentColor"
                          />

                          <strong>
                            {Number(
                              product.rating || 0
                            ).toFixed(1)}
                          </strong>

                          <span>Rating</span>
                        </div>

                        <div className="pd-product-bottom">
                          <div>
                            <strong className="pd-product-price">
                              {formatMoney(product.price)}
                            </strong>

                            <span
                              className={
                                Number(product.stock) > 0
                                  ? "pd-in-stock"
                                  : "pd-out-stock"
                              }
                            >
                              {Number(product.stock) > 0
                                ? "In Stock"
                                : "Out of Stock"}
                            </span>
                          </div>

                          <Link
                            to={`/products/${product.id}`}
                            className="pd-view-product"
                            aria-label={`View ${product.name}`}
                          >
                            <ArrowRight size={19} />
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                {/* PAGINATION */}
                {pagination.totalPages > 1 && (
                  <nav
                    className="pd-pagination"
                    aria-label="Product pages"
                  >
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() =>
                        goToPage(page - 1)
                      }
                    >
                      <ChevronLeft size={18} />
                    </button>

                    {Array.from(
                      {
                        length: pagination.totalPages,
                      },
                      (_, index) => index + 1
                    ).map((number) => (
                      <button
                        type="button"
                        key={number}
                        className={
                          page === number
                            ? "pd-page-active"
                            : ""
                        }
                        onClick={() =>
                          goToPage(number)
                        }
                      >
                        {number}
                      </button>
                    ))}

                    <button
                      type="button"
                      disabled={
                        page >= pagination.totalPages
                      }
                      onClick={() =>
                        goToPage(page + 1)
                      }
                    >
                      <ChevronRight size={18} />
                    </button>
                  </nav>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
