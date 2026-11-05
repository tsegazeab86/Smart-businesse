
import { useEffect, useState } from "react";
import { sellerApi } from "../../services/sellerApi";

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    sellerApi.getOrders()
      .then((data) => {
        if (active) setOrders(data.orders || []);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const viewOrder = async (id) => {
    try {
      setError("");
      const data = await sellerApi.getOrderDetails(id);
      setSelectedOrder(data.order);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main style={{ padding: 24, maxWidth: 1100, margin: "auto" }}>
      <h1>Seller Orders</h1>

      {error && <p role="alert" style={{ color: "crimson" }}>{error}</p>}

      {loading ? (
        <p>Loading orders...</p>
      ) : orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table width="100%" cellPadding="12">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Seller Subtotal</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{order.customerName}</td>
                  <td>{order.itemCount}</td>
                  <td>{Number(order.sellerSubtotal).toFixed(2)} ETB</td>
                  <td>{order.status}</td>
                  <td>
                    <button onClick={() => viewOrder(order.id)}>
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedOrder && (
        <section style={{ marginTop: 32 }}>
          <h2>Order #{selectedOrder.id}</h2>
          <p>Customer: {selectedOrder.customerName}</p>
          <p>City: {selectedOrder.city}</p>
          <p>Status: {selectedOrder.status}</p>

          <h3>My Sold Items</h3>

          {selectedOrder.items.map((item) => (
            <p key={item.id}>
              {item.productName} — {item.quantity} × {item.price} ETB
            </p>
          ))}

          <strong>
            Seller Subtotal: {selectedOrder.sellerSubtotal} ETB
          </strong>

          <p>
            <button onClick={() => setSelectedOrder(null)}>
              Close Details
            </button>
          </p>
        </section>
      )}
    </main>
  );
}
