
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  ChevronDown,
  LogIn,
  LogOut,
  UserRound,
  UserPlus
} from "lucide-react";

import useAuth from "../hooks/useAuth";
import "./NavbarProfile.css";

function NavbarProfile() {
  const { user, isAuthenticated, logout } = useAuth();

  const navigate = useNavigate();

  const [open, setOpen] = useState(false);

  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener(
      "pointerdown",
      handleOutsideClick
    );

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handleOutsideClick
      );

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/login", { replace: true });
  };

  // USER NOT LOGGED IN
  if (!isAuthenticated) {
    return (
      <div className="nav-auth-actions">

        <Link
          to="/login"
          className="nav-login-link"
        >
          <LogIn size={17} />
          <span>Login</span>
        </Link>

        <Link
          to="/register"
          className="nav-register-link"
        >
          <UserPlus size={17} />
          <span>Register</span>
        </Link>

      </div>
    );
  }

  // USER LOGGED IN
  const firstName =
    user?.fullName?.trim().split(/\s+/)[0] || "Account";

  const initial = firstName.charAt(0).toUpperCase();

  return (
    <div
      className="nav-profile-container"
      ref={dropdownRef}
    >

      <button
        type="button"
        className={`nav-profile-trigger ${
          open ? "active" : ""
        }`}
        onClick={() => setOpen((previous) => !previous)}
        aria-expanded={open}
        aria-haspopup="true"
      >

        <span className="nav-profile-avatar">
          {initial}
        </span>

        <span className="nav-profile-name">
          {firstName}
        </span>

        <ChevronDown
          size={16}
          className={open ? "rotated" : ""}
        />

      </button>

      {open && (
        <div className="nav-profile-dropdown">

          <div className="nav-profile-info">

            <div className="nav-profile-large-avatar">
              {initial}
            </div>

            <div className="nav-profile-details">
              <strong>{user.fullName}</strong>
              <span>{user.email}</span>
            </div>

          </div>

          <div className="nav-profile-divider" />

          <div className="nav-profile-menu-label">
            MY ACCOUNT
          </div>

          <Link
            to="/profile"
            className="nav-profile-menu-item"
            onClick={() => setOpen(false)}
          >
            <UserRound size={18} />
            <span>My Profile</span>
          </Link>

          <div className="nav-profile-divider" />

          <button
            type="button"
            className="nav-profile-menu-item nav-logout"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>

        </div>
      )}

    </div>
  );
}

export default NavbarProfile;
