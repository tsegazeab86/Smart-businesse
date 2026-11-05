
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  ArrowRight,
  ArrowUpRight,
  Grid2X2,
  RefreshCw,
  ShoppingBag,
  WifiOff
} from "lucide-react";

import api from "../services/api";

import "./Categories.css";

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/categories", {
          signal: controller.signal
        });

        setCategories(response.data.categories || []);

      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Categories API Error:", err);

          setError(
            "We couldn't load categories. Please try again."
          );
        }

      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchCategories();

    return () => controller.abort();
  }, []);

  return (
    <main className="categories-page container">

      {/* HERO */}
      <section className="categories-hero">

        <div className="categories-hero-content">

          <span className="categories-eyebrow">
            <Grid2X2 size={16} />
            EXPLORE OUR COLLECTION
          </span>

          <h1>
            Shop by <span>Category.</span>
          </h1>

          <p>
            From the latest technology to everyday essentials,
            find exactly what you're looking for.
          </p>

          <div className="categories-hero-footer">
            <span>
              <ShoppingBag size={18} />
              Discover your next favorite
            </span>

            <Link to="/products">
              All Products <ArrowRight size={17} />
            </Link>
          </div>

        </div>

        <div className="categories-hero-art" aria-hidden="true">
          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />

          <span className="hero-art-icon icon-one">💻</span>
          <span className="hero-art-icon icon-two">👟</span>
          <span className="hero-art-icon icon-three">🏠</span>
          <span className="hero-art-icon icon-four">⌚</span>

          <div className="hero-art-center">
            <Grid2X2 size={42} />
          </div>
        </div>

      </section>

      {/* SECTION HEADING */}
      <section className="categories-section">

        <div className="categories-section-heading">
          <div>
            <span className="section-overline">
              FIND WHAT YOU LOVE
            </span>

            <h2>Explore Categories</h2>

            <p>
              Browse our curated collections and start shopping.
            </p>
          </div>

          {!loading && !error && (
            <span className="categories-count">
              {categories.length} Categories
            </span>
          )}
        </div>

        {/* LOADING SKELETON */}
        {loading && (
          <div
            className="category-skeleton-grid"
            role="status"
            aria-label="Loading categories"
          >
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div className="category-skeleton" key={item}>
                <div className="category-skeleton-icon shimmer" />
                <div className="category-skeleton-line shimmer" />
                <div className="category-skeleton-small shimmer" />
              </div>
            ))}
          </div>
        )}

        {/* ERROR STATE */}
        {!loading && error && (
          <div className="categories-error" role="alert">

            <div className="categories-error-icon">
              <WifiOff size={34} />
            </div>

            <h3>Unable to load categories</h3>
            <p>{error}</p>

            <button
              type="button"
              onClick={() => window.location.reload()}
            >
              <RefreshCw size={17} />
              Try Again
            </button>

          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && categories.length === 0 && (
          <div className="categories-empty">
            <Grid2X2 size={42} />
            <h3>No categories yet</h3>
            <p>New collections will appear here soon.</p>
          </div>
        )}

        {/* CATEGORY CARDS */}
        {!loading && !error && categories.length > 0 && (
          <div className="categories-grid">

            {categories.map((category, index) => (
              <Link
                key={category.id}
                to={`/products?category=${encodeURIComponent(
                  category.name
                )}`}
                className="premium-category-card"
                style={{ "--card-index": index }}
              >

                <div className="category-card-top">

                  <div className="category-card-icon">
                    {category.icon || "🛍️"}
                  </div>

                  <span className="category-card-arrow">
                    <ArrowUpRight size={20} />
                  </span>

                </div>

                <div className="category-card-content">
                  <h3>{category.name}</h3>

                  <p>
                    Explore our {category.name.toLowerCase()} collection.
                  </p>
                </div>

                <div className="category-card-bottom">

                  <span>
                    {Number(category.count) === 1
                      ? "1 Product"
                      : `${Number(category.count || 0)} Products`}
                  </span>

                  <span className="category-explore">
                    Explore <ArrowRight size={15} />
                  </span>

                </div>

              </Link>
            ))}

          </div>
        )}

      </section>

      {/* BOTTOM CTA */}
      <section className="categories-bottom-cta">

        <div>
          <span>CAN'T DECIDE?</span>
          <h2>Explore everything in one place.</h2>
          <p>
            Browse all available products and discover something amazing.
          </p>
        </div>

        <Link to="/products">
          Browse All Products
          <ArrowRight size={19} />
        </Link>

      </section>

    </main>
  );
}

export default Categories;
