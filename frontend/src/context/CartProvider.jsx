import { useEffect, useState } from "react";
import { CartContext } from "./cart-context";

const CART_KEY = "isb_cart";

function getSavedCart() {
  try {
    const saved = localStorage.getItem(CART_KEY);
    const parsed = saved ? JSON.parse(saved) : [];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function CartProvider({ children }) {
  const [cart, setCart] = useState(getSavedCart);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, quantity = 1) => {
    if (!product || product.id == null) return;

    const amount = Math.floor(Number(quantity));
    if (!Number.isFinite(amount) || amount < 1) return;

    setCart((previous) => {
      const existing = previous.find(
        (item) => String(item.id) === String(product.id)
      );

      const stock = Math.max(0, Number(product.stock) || 0);

      if (stock === 0) return previous;

      if (existing) {
        return previous.map((item) =>
          String(item.id) === String(product.id)
            ? {
                ...item,
                quantity: Math.min(
                  item.quantity + amount,
                  stock
                ),
                stock,
              }
            : item
        );
      }

      return [
        ...previous,
        {
          id: product.id,
          name: product.name,
          price: Number(product.price),
          image: product.image,
          stock,
          quantity: Math.min(amount, stock),
        },
      ];
    });
  };

  const removeFromCart = (productId) => {
    setCart((previous) =>
      previous.filter(
        (item) => String(item.id) !== String(productId)
      )
    );
  };

  const updateQuantity = (productId, quantity) => {
    const amount = Math.floor(Number(quantity));

    if (!Number.isFinite(amount)) return;

    if (amount <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((previous) =>
      previous.map((item) =>
        String(item.id) === String(productId)
          ? {
              ...item,
              quantity: Math.min(amount, item.stock),
            }
          : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const cartTotal = cart.reduce(
    (total, item) =>
      total + Number(item.price) * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        cartTotal,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export default CartProvider;