
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Smartphone,
  Building2,
  ShieldCheck,
  Truck,
} from "lucide-react";

import api from "../services/api";
import useCart from "../hooks/useCart";
import "./Checkout.css";

const paymentOptions = [
  {
    value: "telebirr",
    label: "Telebirr",
    description: "Pay using Telebirr mobile money",
    Icon: Smartphone,
  },
  {
    value: "bank_transfer",
    label: "Bank Transfer",
    description: "Transfer money through your bank",
    Icon: Building2,
  },
  {
    value: "cash_on_delivery",
    label: "Cash on Delivery",
    description: "Pay when your order arrives",
    Icon: Banknote,
  },
];

function Checkout() {
  const navigate = useNavigate();
  const { cart, cartTotal, clearCart } = useCart();

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    city: "Injibara",
    address: "",
    notes: "",
    paymentMethod: "cash_on_delivery",
    paymentReference: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (cart.length === 0) {
      setError("Your cart is empty. Please add a product first.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
        notes: form.notes.trim(),
        paymentMethod: form.paymentMethod,
        paymentReference: form.paymentReference.trim(),
        items: cart.map((item) => ({
          id: item.id,
          quantity: item.quantity,
        })),
      };

      const { data } = await api.post("/orders", payload);

      if (!data.success || !data.order?.id) {
        throw new Error(data.message || "Order could not be created.");
      }

      clearCart();

      navigate(`/order-success/${data.order.id}`, {
        replace: true,
        state: { order: data.order },
      });
    } catch (err) {
      console.error("CHECKOUT ERROR:", err);
      console.error("SERVER RESPONSE:", err.response?.data);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to place your order. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <main className="checkout-page">
        <div className="checkout-empty">
          <Truck size={42} />
          <h2>Your cart is empty</h2>
          <p>Add products before proceeding to checkout.</p>
          <Link to="/products" className="checkout-submit">
            Browse Products <ArrowRight size={18} />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <div className="checkout-container">
        <Link to="/cart" className="checkout-back">
          <ArrowLeft size={17} /> Back to Cart
        </Link>

        <header className="checkout-header">
          <span className="checkout-eyebrow">INJIBARA SMART BUSINESS</span>
          <h1>Secure Checkout</h1>
          <p>Enter your delivery information and choose how to pay.</p>
        </header>

        <form onSubmit={handleSubmit} className="checkout-layout">
          <div className="checkout-main">
            <section className="checkout-panel">
              <h2>01. Delivery Information</h2>

              <div className="checkout-fields">
                <label>
                  Full Name *
                  <input
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    required
                    maxLength={150}
                  />
                </label>

                <label>
                  Phone Number *
                  <input
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                    autoComplete="tel"
                    required
                    maxLength={30}
                  />
                </label>

                <label>
                  City *
                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="City or town"
                    required
                    maxLength={100}
                  />
                </label>

                <label>
                  Delivery Address *
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Area, neighborhood, street, or landmark"
                    rows={3}
                    required
                  />
                </label>

                <label>
                  Order Notes (optional)
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Additional delivery instructions"
                    rows={2}
                  />
                </label>
              </div>
            </section>

            <section className="checkout-panel">
              <h2>02. Payment Method</h2>
              <p className="checkout-section-description">
                Select your preferred payment option.
              </p>

              <div className="payment-options">
                {paymentOptions.map(({ value, label, description, Icon }) => (
                  <label
                    key={value}
                    className={`payment-option ${
                      form.paymentMethod === value ? "selected" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={value}
                      checked={form.paymentMethod === value}
                      onChange={handleChange}
                    />

                    <span className="payment-option-icon">
                      <Icon size={23} />
                    </span>

                    <span className="payment-option-text">
                      <strong>{label}</strong>
                      <small>{description}</small>
                    </span>

                    <span className="payment-option-radio" />
                  </label>
                ))}
              </div>

              {form.paymentMethod === "telebirr" && (
                <div className="payment-instructions">
                  <strong>Telebirr payment</strong>
                  <p>
                    Follow the official payment instructions provided by the
                    store. The store's merchant details and payment verification
                    must be configured before real payments can be accepted.
                  </p>

                  <label>
                    Transaction Reference (if available)
                    <input
                      name="paymentReference"
                      value={form.paymentReference}
                      onChange={handleChange}
                      placeholder="Enter transaction reference"
                      maxLength={150}
                    />
                  </label>
                </div>
              )}

              {form.paymentMethod === "bank_transfer" && (
                <div className="payment-instructions">
                  <strong>Bank transfer</strong>
                  <p>
                    Contact the store for its verified bank account details.
                    Do not transfer money until you have confirmed the account
                    information directly with the business.
                  </p>

                  <label>
                    Transfer Reference (if available)
                    <input
                      name="paymentReference"
                      value={form.paymentReference}
                      onChange={handleChange}
                      placeholder="Enter bank transaction reference"
                      maxLength={150}
                    />
                  </label>
                </div>
              )}

              {form.paymentMethod === "cash_on_delivery" && (
                <div className="payment-instructions">
                  <strong>Pay on delivery</strong>
                  <p>
                    Pay the delivery person when your order arrives.
                  </p>
                </div>
              )}
            </section>
          </div>

          <aside className="checkout-summary">
            <h2>Order Summary</h2>

            <div className="checkout-items">
              {cart.map((item) => (
                <div className="checkout-item" key={item.id}>
                  <div className="checkout-item-image">
                    {item.image ? (
                      <img src={item.image} alt={item.name} />
                    ) : (
                      <Truck size={20} />
                    )}
                  </div>

                  <div className="checkout-item-info">
                    <strong>{item.name}</strong>
                    <span>Qty: {item.quantity}</span>
                  </div>

                  <strong>
                    {(Number(item.price) * item.quantity).toLocaleString(
                      "en-ET",
                      {
                        style: "currency",
                        currency: "ETB",
                      }
                    )}
                  </strong>
                </div>
              ))}
            </div>

            <div className="checkout-total-row">
              <span>Subtotal</span>
              <strong>
                {Number(cartTotal).toLocaleString("en-ET", {
                  style: "currency",
                  currency: "ETB",
                })}
              </strong>
            </div>

            <div className="checkout-total-row">
              <span>Shipping</span>
              <strong>Free</strong>
            </div>

            <div className="checkout-grand-total">
              <span>Total</span>
              <strong>
                {Number(cartTotal).toLocaleString("en-ET", {
                  style: "currency",
                  currency: "ETB",
                })}
              </strong>
            </div>

            {error && (
              <div className="checkout-error" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="checkout-submit"
              disabled={loading}
            >
              {loading ? "Processing Order..." : "Place Order"}
              {!loading && <ArrowRight size={18} />}
            </button>

            <div className="checkout-trust">
              <ShieldCheck size={18} />
              <span>Your order is submitted securely.</span>
            </div>

            <p className="checkout-payment-note">
              Online payments remain pending until independently verified.
            </p>
          </aside>
        </form>
      </div>
    </main>
  );
}

export default Checkout;
