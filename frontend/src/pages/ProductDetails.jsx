
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  ArrowLeft,
  ShoppingCart,
  Minus,
  Plus,
  Package,
  ShieldCheck,
  Truck
} from "lucide-react";

import api from "../services/api";
import ProductCard from "../components/ui/ProductCard";
import useCart from "../hooks/useCart";

import "./ProductDetails.css";

function ProductDetails() 
{
    const { addToCart } = useCart();
  // Get product ID from URL
  const { id } = useParams();

  // Product information
  const [product, setProduct] = useState(null);

  // Related products
  const [relatedProducts, setRelatedProducts] = useState([]);

  // Quantity selected by customer
  const [quantity, setQuantity] = useState(1);

  // API states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch product when ID changes
  useEffect(() => {
    const controller = new AbortController();

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          `/products/${id}`,
          { signal: controller.signal }
        );

        const currentProduct = response.data.product;

        setProduct(currentProduct);

        // Fetch products from the same category
        const relatedResponse = await api.get("/products", {
          params: {
          category: currentProduct.category_id 
          },

          signal: controller.signal
        });

        // Exclude the currently opened product
        const filtered = (
          relatedResponse.data.products || []
        )
          .filter(
            (item) => Number(item.id) !== Number(id)
          )
          .slice(0, 4);

        setRelatedProducts(filtered);

      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Product Details Error:", err);

          if (err.response?.status === 404) {
            setError("Product not found.");
          } else {
            setError(
              "Unable to load product details. Please try again."
            );
          }
        }

      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchProduct();

    return () => controller.abort();

  }, [id]);

  // Quantity should never exceed available stock
  const increaseQuantity = () => {
    if (product && quantity < product.stock) {
      setQuantity((previous) => previous + 1);
    }
  };

  const decreaseQuantity = () => {
    setQuantity((previous) => Math.max(1, previous - 1));
  };

  // Display loading
  if (loading) {
    return (
      <main className="product-details container">
        <div className="details-message" role="status">
          Loading product details...
        </div>
      </main>
    );
  }

  // Display error
  if (error || !product) {
    return (
      <main className="product-details container">
        <div className="details-message" role="alert">
          <h2>{error || "Product not found."}</h2>

          <Link to="/products" className="details-back-btn">
            <ArrowLeft size={18} />
            Back to Products
          </Link>
        </div>
      </main>
    );
  }

  const inStock = Number(product.stock) > 0;

  const totalPrice = Number(product.price) * quantity;

  return (
    <main className="product-details container">

      {/* BREADCRUMB */}
      <nav className="details-breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>

        <Link to="/products">Products</Link>
        <span>/</span>

        <span>{product.name}</span>
      </nav>

      {/* MAIN PRODUCT DETAILS */}
      <section className="details-grid">

        {/* LEFT: PRODUCT IMAGE */}
        <div className="details-image-box">

          <img
            src={
              product.image ||
              "https://placehold.co/700x700?text=No+Image"
            }
            alt={product.name}
          />

          {product.badge && (
            <span className="details-badge">
              {product.badge}
            </span>
          )}

        </div>

        {/* RIGHT: PRODUCT INFORMATION */}
        <div className="details-info">

          <span className="details-category">
            {product.category}
          </span>

          <h1>{product.name}</h1>

          {product.rating != null && (
            <div className="details-rating">
              <span>★</span>
              {Number(product.rating).toFixed(1)}
              <small> / 5</small>
            </div>
          )}

          <div className="details-price">
            ETB {Number(product.price).toLocaleString("en-ET", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </div>

          <p className="details-description">
            {product.description || "No description available."}
          </p>

          {/* STOCK INFORMATION */}
          <div className="details-stock">
            <Package size={19} />

            {inStock ? (
              <span className="in-stock">
                In Stock — {product.stock} available
              </span>
            ) : (
              <span className="out-of-stock">
                Out of Stock
              </span>
            )}
          </div>

          {/* QUANTITY SELECTOR */}
          <div className="quantity-section">

            <label>Quantity</label>

            <div className="quantity-control">

              <button
                type="button"
                onClick={decreaseQuantity}
                disabled={!inStock || quantity <= 1}
                aria-label="Decrease quantity"
              >
                <Minus size={17} />
              </button>

              <span>{quantity}</span>

              <button
                type="button"
                onClick={increaseQuantity}
                disabled={!inStock || quantity >= product.stock}
                aria-label="Increase quantity"
              >
                <Plus size={17} />
              </button>

            </div>

          </div>

          {/* TOTAL PRICE */}
          <div className="details-total">
            <span>Total Price:</span>

            <strong>
              ETB {totalPrice.toLocaleString("en-ET", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </strong>
          </div>

{/* CART BUTTON */}
<button
  type="button"
  className="details-cart-btn"
  onClick={() => addToCart(product, quantity)}
  disabled={!inStock}
>
  <ShoppingCart size={20} />
  {inStock ? "Add to Cart" : "Out of Stock"}
</button>

          {/* PRODUCT BENEFITS */}
          <div className="details-benefits">

            <div>
              <ShieldCheck size={20} />
              <span>Account protection</span>
            </div>

            <div>
              <Truck size={20} />
              <span>Delivery details at checkout</span>
            </div>

          </div>

        </div>

      </section>

      {/* RELATED PRODUCTS */}
      {relatedProducts.length > 0 && (
        <section className="related-section">

          <div className="related-heading">
            <div>
              <span>YOU MAY ALSO LIKE</span>
              <h2>Related Products</h2>
            </div>

            <Link to="/products">
              View All →
            </Link>
          </div>

          <div className="products-grid">
            {relatedProducts.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
              />
            ))}
          </div>

        </section>
      )}

    </main>
  );
}

export default ProductDetails;
