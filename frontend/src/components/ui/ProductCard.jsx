
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Check, Star } from "lucide-react";

import useCart from "../../hooks/useCart";

import "./ProductCard.css";

function ProductCard({ product }) {
  const { addToCart } = useCart();

  const [added, setAdded] = useState(false);

  const stock = Number(product.stock) || 0;
  const outOfStock = stock <= 0;

  useEffect(() => {
    if (!added) return;

    const timer = setTimeout(() => {
      setAdded(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [added]);

  const handleAddToCart = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (outOfStock) return;

    addToCart(product, 1);
    setAdded(true);
  };

  return (
    <article className="product-card">

      {/* Product Image */}
      <Link
        to={`/products/${product.id}`}
        className="product-image"
      >
        <img
          src={
            product.image ||
            "https://placehold.co/500x500?text=No+Image"
          }
          alt={product.name}
          loading="lazy"
        />

        {product.badge && (
          <span className="product-badge">
            {product.badge}
          </span>
        )}

        {outOfStock && (
          <span className="product-stock-badge">
            Out of Stock
          </span>
        )}
      </Link>

      {/* Product Information */}
      <div className="product-info">

        <span className="product-category">
          {product.category || "General"}
        </span>

        <Link
          to={`/products/${product.id}`}
          className="product-name"
        >
          {product.name}
        </Link>

        {product.rating != null && (
          <div className="product-rating">
            <Star size={14} fill="currentColor" />

            <span>
              {Number(product.rating).toFixed(1)}
            </span>
          </div>
        )}

        {/* Price and Add to Cart */}
        <div className="product-bottom">

          <strong className="product-price">
            ETB{" "}
            {Number(product.price).toLocaleString()}
          </strong>

          <button
            type="button"
            className={`product-add-btn ${
              added ? "is-added" : ""
            }`}
            onClick={handleAddToCart}
            disabled={outOfStock}
            aria-label={
              outOfStock
                ? `${product.name} is out of stock`
                : `Add ${product.name} to cart`
            }
          >
            {added ? (
              <>
                <Check size={16} />
                <span>Added!</span>
              </>
            ) : outOfStock ? (
              <span>Sold Out</span>
            ) : (
              <>
                <ShoppingCart size={16} />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
