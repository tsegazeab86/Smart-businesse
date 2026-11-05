
import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";

function AdminRoute({ children }) {
  const { user, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return (
      <div style={{ padding: "100px 20px", textAlign: "center" }}>
        <h3>Verifying admin access...</h3>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  if (user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default AdminRoute;
