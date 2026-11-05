
import {
  Check,
  CheckCircle2,
  Clock3,
  PackageCheck,
  Truck,
  XCircle,
} from "lucide-react";

import "./OrderTracking.css";

const steps = [
  { key: "pending", label: "Pending", Icon: Clock3 },
  { key: "confirmed", label: "Confirmed", Icon: CheckCircle2 },
  { key: "shipped", label: "Shipped", Icon: Truck },
  { key: "delivered", label: "Delivered", Icon: PackageCheck },
];

export default function OrderTracking({ status = "pending" }) {
  if (status === "cancelled") {
    return (
      <div className="ot-cancelled">
        <XCircle size={20} />
        <div>
          <strong>Order Cancelled</strong>
          <p>This order is no longer being processed.</p>
        </div>
      </div>
    );
  }

  const currentIndex = steps.findIndex(
    (step) => step.key === status
  );

  return (
    <section className="ot-wrapper">
      <div className="ot-header">
        <div>
          <span className="ot-eyebrow">DELIVERY PROGRESS</span>
          <h3>Track Your Order</h3>
        </div>
        <span className={`ot-status ot-status-${status}`}>
          {status}
        </span>
      </div>

      <div className="ot-steps">
        {steps.map(({ key, label, Icon }, index) => {
          const completed = index < currentIndex;
          const active = index <= currentIndex;

          return (
            <div
              className={`ot-step ${active ? "ot-active" : ""} ${
                index === currentIndex ? "ot-current" : ""
              }`}
              key={key}
            >
              <div className="ot-step-circle">
                {completed ? <Check size={19} /> : <Icon size={19} />}
              </div>
              <strong>{label}</strong>
              <small>
                {completed
                  ? "Completed"
                  : index === currentIndex
                  ? "Current status"
                  : "Upcoming"}
              </small>
            </div>
          );
        })}
      </div>
    </section>
  );
}
