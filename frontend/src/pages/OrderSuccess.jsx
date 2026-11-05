import { Link, useParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";

function OrderSuccess() {
  const { id } = useParams();

  return (
    <main
      style={{
        minHeight: "75vh",
        display: "grid",
        placeItems: "center",
        padding: "40px 20px",
        background: "#f7f9fe",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "45px",
          borderRadius: "20px",
          textAlign: "center",
          maxWidth: "500px",
          width: "100%",
        }}
      >
        <CheckCircle2 size={65} color="#16a34a" />

        <h1>Order Placed Successfully!</h1>

        <p>Thank you for shopping with Injibara Smart Business.</p>

        <h3>Order Number: #{id}</h3>

        <Link to="/my-orders">View My Orders</Link>
      </div>
    </main>
  );
}

export default OrderSuccess;