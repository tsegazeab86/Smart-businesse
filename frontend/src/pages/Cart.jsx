
import { Link, useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ShieldCheck,
  Truck,
} from "lucide-react";

import useCart from "../hooks/useCart";

import "./Cart.css";

const formatPrice = (price) =>
  Number(price).toLocaleString("en-ET", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function Cart() {
  const navigate = useNavigate();

  const {
    cart,
    cartCount,
    cartTotal,
    removeFromCart,
    updateQuantity,
    clearCart,
  } = useCart();

  // ProtectedRoute handles authentication on /checkout.
  const handleCheckout = () => {
    if (cart.length === 0) return;

    navigate("/checkout");
  };

  return (
    <main className="cart-page">
      <div className="cart-container">

        {/* Page Header */}
        <div className="cart-heading">
          <div>
            <Link
              to="/products"
              className="cart-back"
            >
              <ArrowLeft size={17} />
              Continue Shopping
            </Link>

            <h1>
              Your Shopping <span>Cart</span>
            </h1>

            <p>
              {cartCount === 0
                ? "Your cart is waiting for something special."
                : `${cartCount} item${
                    cartCount === 1 ? "" : "s"
                  } in your shopping cart`}
            </p>
          </div>

          {cart.length > 0 && (
            <button
              type="button"
              className="cart-clear"
              onClick={clearCart}
            >
              <Trash2 size={16} />
              Clear Cart
            </button>
          )}
        </div>

        {/* Empty Cart */}
        {cart.length === 0 ? (
          <section className="cart-empty">
            <div className="cart-empty-icon">
              <ShoppingBag
                size={45}
                strokeWidth={1.5}
              />
            </div>

            <h2>Your cart is empty</h2>

            <p>
              Discover amazing products and add your
              favorites to your cart.
            </p>

            <Link
              to="/products"
              className="cart-shop-btn"
            >
              Explore Products
              <ArrowRight size={18} />
            </Link>
          </section>
        ) : (
          <div className="cart-layout">

            {/* Cart Items */}
            <section className="cart-items">
              <div className="cart-items-title">
                <h2>Cart Items</h2>

                <span>
                  {cart.length} Product
                  {cart.length !== 1 ? "s" : ""}
                </span>
              </div>

              {cart.map((item) => (
                <article
                  className="cart-item"
                  key={item.id}
                >
                  {/* Product Image */}
                  <Link
                    to={`/products/${item.id}`}
                    className="cart-item-image"
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                      />
                    ) : (
                      <ShoppingBag size={32} />
                    )}
                  </Link>

                  {/* Product Information */}
                  <div className="cart-item-details">
                    <Link
                      to={`/products/${item.id}`}
                      className="cart-item-name"
                    >
                      {item.name}
                    </Link>

                    <span className="cart-item-price">
                      {formatPrice(item.price)} ETB
                    </span>

                    <span className="cart-stock">
                      {Number(item.stock) > 0
                        ? `${item.stock} available`
                        : "Out of stock"}
                    </span>

                    {/* Quantity Controls */}
                    <div className="cart-quantity">
                      <button
                        type="button"
                        aria-label={`Decrease ${item.name} quantity`}
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            item.quantity - 1
                          )
                        }
                      >
                        <Minus size={15} />
                      </button>

                      <span>{item.quantity}</span>

                      <button
                        type="button"
                        aria-label={`Increase ${item.name} quantity`}
                        disabled={
                          item.quantity >= Number(item.stock)
                        }
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            item.quantity + 1
                          )
                        }
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Item Total / Remove */}
                  <div className="cart-item-right">
                    <button
                      type="button"
                      className="cart-remove"
                      aria-label={`Remove ${item.name}`}
                      onClick={() =>
                        removeFromCart(item.id)
                      }
                    >
                      <Trash2 size={18} />
                    </button>

                    <strong>
                      {formatPrice(
                        Number(item.price) *
                          Number(item.quantity)
                      )}{" "}
                      ETB
                    </strong>
                  </div>
                </article>
              ))}
            </section>

            {/* Order Summary */}
            <aside className="cart-summary">
              <h2>Order Summary</h2>

              <div className="cart-summary-row">
                <span>
                  Subtotal ({cartCount} items)
                </span>

                <strong>
                  {formatPrice(cartTotal)} ETB
                </strong>
              </div>

              <div className="cart-summary-row">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>

              <div className="cart-summary-divider" />

              <div className="cart-summary-total">
                <span>Subtotal</span>

                <strong>
                  {formatPrice(cartTotal)} ETB
                </strong>
              </div>

              {/* Checkout Button */}
              <button
                type="button"
                className="cart-checkout"
                onClick={handleCheckout}
                disabled={cart.length === 0}
              >
                Proceed to Checkout
                <ArrowRight size={19} />
              </button>

              <div className="cart-trust">
                <p>
                  <ShieldCheck size={17} />
                  Secure checkout
                </p>

                <p>
                  <Truck size={17} />
                  Shipping calculated at checkout
                </p>
              </div>

              <Link
                to="/products"
                className="cart-continue"
              >
                Continue Shopping
              </Link>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

export default Cart;
