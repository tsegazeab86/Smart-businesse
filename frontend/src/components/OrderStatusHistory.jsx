
import {
  CheckCircle2,
  Clock3,
  History,
  PackageCheck,
  Truck,
  XCircle,
} from "lucide-react";

import "./OrderStatusHistory.css";

const icons = {
  pending: Clock3,
  confirmed: CheckCircle2,
  shipped: Truck,
  delivered: PackageCheck,
  cancelled: XCircle,
};

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function OrderStatusHistory({
  history = [],
  loading = false,
  showChangedBy = false,
}) {
  return (
    <section className="osh-card">
      <header className="osh-heading">
        <div className="osh-heading-icon">
          <History size={20} />
        </div>
        <div>
          <span>ORDER ACTIVITY</span>
          <h3>Status History</h3>
        </div>
      </header>

      {loading ? (
        <p className="osh-message">Loading status history...</p>
      ) : !Array.isArray(history) || history.length === 0 ? (
        <p className="osh-message">
          No recorded status history is available yet.
        </p>
      ) : (
        <div className="osh-timeline">
          {history.map((entry) => {
            const Icon = icons[entry.status] || Clock3;
            const snapshot =
              entry.note === "Initial history snapshot";

            return (
              <div
                className={`osh-entry osh-${entry.status}`}
                key={entry.id}
              >
                <div className="osh-marker">
                  <Icon size={17} />
                </div>

                <div className="osh-entry-content">
                  <div className="osh-entry-top">
                    <strong>{entry.status}</strong>
                    <time>
                      {formatDate(entry.createdAt)}
                    </time>
                  </div>

                  {entry.note && <p>{entry.note}</p>}

                  {snapshot && (
                    <small>
                      Existing order snapshot. This is not
                      the original status change time.
                    </small>
                  )}

                  {showChangedBy && entry.changedByName && (
                    <small>
                      Updated by: {entry.changedByName}
                    </small>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
