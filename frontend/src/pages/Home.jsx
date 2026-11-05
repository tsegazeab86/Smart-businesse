
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  ArrowRight,
  Truck,
  ShieldCheck,
  Headphones,
  ShoppingBag
} from "lucide-react";

import ProductCard from "../components/ui/ProductCard";
import api from "../services/api";

import "./Home.css";

function Home() {
  // ==========================
  // 1. STATE MANAGEMENT
  // ==========================

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================
  // 2. FETCH DATA FROM BACKEND
  // ==========================

  useEffect(() => {
    const controller = new AbortController();

    const loadHomepage = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch products and categories together
        const [productRes, categoryRes] = await Promise.all([
          api.get("/products", {
            params: {
              featured: true
            },
            signal: controller.signal
          }),

          api.get("/categories", {
            signal: controller.signal
          })
        ]);

        // Save API data into React state
        setProducts(productRes.data.products || []);
        setCategories(categoryRes.data.categories || []);

      } catch (err) {
        // Ignore canceled requests
        if (
          err.code !== "ERR_CANCELED" &&
          !controller.signal.aborted
        ) {
          console.error("Homepage Error:", err);

          setError(
            "Unable to load products. Please check your connection."
          );
        }

      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadHomepage();

    // Cleanup when component unmounts
    return () => {
      controller.abort();
    };

  }, []);

  // ==========================
  // 3. HOMEPAGE DESIGN
  // ==========================

  return (
    <main>

      {/* ======================
          HERO SECTION
      ====================== */}

      <section className="hero">
        <div className="container hero-grid">

          {/* Hero Left Content */}
          <div className="hero-content">

            <span className="hero-label">
              ✨ Your Favorite Online Marketplace
            </span>

            <h1>
              Discover Amazing Products
              <span> For Everyday Living.</span>
            </h1>

            <p>
              Explore a modern shopping experience.
              Discover quality products from local
              businesses in one convenient place.
            </p>

            <div className="hero-actions">

              <Link
                to="/products"
                className="primary-btn"
              >
                Shop Now
                <ArrowRight size={19} />
              </Link>

              <Link
                to="/categories"
                className="secondary-btn"
              >
                Explore Categories
              </Link>

            </div>

            <div className="hero-trust">
              <span>✓ Easy Shopping</span>
              <span>✓ Local Marketplace</span>
              <span>✓ Secure Accounts</span>
            </div>

          </div>

          {/* Hero Right Image */}
          <div className="hero-visual">

            <div className="hero-image-wrap">

              <img
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1100"
                alt="Modern shopping collection"
              />

              <div className="floating-card">

                <ShoppingBag size={22} />

                <div>
                  <strong>Discover More</strong>
                  <small>Shop your favorites</small>
                </div>

              </div>

            </div>

          </div>

        </div>
      </section>


      {/* ======================
          BENEFITS SECTION
      ====================== */}

      <section className="benefits container">

        <div className="benefit">
          <Truck size={26} />

          <div>
            <strong>Convenient Shopping</strong>
            <p>Browse products easily</p>
          </div>
        </div>

        <div className="benefit">
          <ShieldCheck size={26} />

          <div>
            <strong>Account Protection</strong>
            <p>Designed with security in mind</p>
          </div>
        </div>

        <div className="benefit">
          <Headphones size={26} />

          <div>
            <strong>Customer Support</strong>
            <p>We're here to help</p>
          </div>
        </div>

      </section>


      {/* ======================
          CATEGORIES SECTION
      ====================== */}

      <section className="section container">

        <div className="section-heading">

          <div>
            <span className="section-label">
              SHOP BY CATEGORY
            </span>

            <h2>Explore Categories</h2>

            <p>
              Find what you love in one place.
            </p>
          </div>

          <Link
            to="/categories"
            className="view-all"
          >
            View All
            <ArrowRight size={17} />
          </Link>

        </div>

        <div className="category-grid">

          {loading ? (

            <p role="status">
              Loading categories...
            </p>

          ) : error ? (

            <p role="alert">
              {error}
            </p>

          ) : categories.length === 0 ? (

            <p>No categories available.</p>

          ) : (

            categories.map((category) => (

              <Link
                key={category.id}
                to={`/products?category=${encodeURIComponent(
                  category.name
                )}`}
                className="category-card"
              >

                <div className="category-icon">
                  {category.icon || "🛍️"}
                </div>

                <h3>
                  {category.name}
                </h3>

                <p>
                  {category.count} Products
                </p>

              </Link>

            ))

          )}

        </div>

      </section>


      {/* ======================
          FEATURED PRODUCTS
      ====================== */}

      <section className="section featured-section">

        <div className="container">

          <div className="section-heading">

            <div>

              <span className="section-label">
                HANDPICKED FOR YOU
              </span>

              <h2>
                Featured Products
              </h2>

              <p>
                Explore our featured collection.
              </p>

            </div>

            <Link
              to="/products"
              className="view-all"
            >
              View All
              <ArrowRight size={17} />
            </Link>

          </div>

          <div className="products-grid">

            {loading ? (

              <p role="status">
                Loading featured products...
              </p>

            ) : error ? (

              <p role="alert">
                {error}
              </p>

            ) : products.length === 0 ? (

              <p>
                No featured products available.
              </p>

            ) : (

              products.map((product) => (

                <ProductCard
                  key={product.id}
                  product={product}
                />

              ))

            )}

          </div>

        </div>

      </section>


      {/* ======================
          CALL TO ACTION
      ====================== */}

      <section className="container">

        <div className="cta-section">

          <div>

            <span>
              START EXPLORING TODAY
            </span>

            <h2>
              Your Next Favorite Product Awaits.
            </h2>

            <p>
              Discover products and enjoy a simpler
              online shopping experience.
            </p>

          </div>

          <Link
            to="/products"
            className="cta-btn"
          >
            Start Shopping
            <ArrowRight size={19} />
          </Link>

        </div>

      </section>

    </main>
  );
}

export default Home;
