import { useContext } from "react";
import { CartContext } from "../context/cart-context";

export default function useCart() {
  const context = useContext(CartContext);

  if (context === null) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
}