
import { Link, Navigate } from "react-router-dom";
import { Mail, UserRound, ShieldCheck } from "lucide-react";

import useAuth from "../hooks/useAuth";
function Profile() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <main
      style={{
        maxWidth: "800px",
        margin: "70px auto",
        padding: "0 20px"
      }}
    >
      <div
        style={{
          padding: "35px",
          borderRadius: "22px",
          border: "1px solid #e2e8f0",
          background: "white",
          boxShadow: "0 15px 45px rgba(15,23,42,0.05)"
        }}
      >
        <UserRound size={36} color="#6366f1" />

        <h1>My Profile</h1>
        <p>Welcome back, {user.fullName}!</p>

        <hr
          style={{
            margin: "25px 0",
            border: 0,
            borderTop: "1px solid #e2e8f0"
          }}
        />

        <p>
          <UserRound size={17} style={{ verticalAlign: "middle" }} />
          {" "}Name: {user.fullName}
        </p>

        <p>
          <Mail size={17} style={{ verticalAlign: "middle" }} />
          {" "}Email: {user.email}
        </p>

        <p>
          <ShieldCheck size={17} style={{ verticalAlign: "middle" }} />
          {" "}Role: {user.role}
        </p>

        <Link to="/products" style={{ color: "#4f46e5" }}>
          Continue Shopping →
        </Link>
      </div>
    </main>
  );
}

export default Profile;
