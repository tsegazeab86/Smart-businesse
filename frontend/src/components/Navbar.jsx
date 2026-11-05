
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import {
  ShoppingCart,
  Search,
  Menu,
  X,
  Store,
} from "lucide-react";

import NavbarProfile from "./NavbarProfile";
import NotificationsBell from "./notifications/NotificationsBell";
import useCart from "../hooks/useCart";
import useAuth from "../hooks/useAuth";

import "./Navbar.css";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");

  const navigate = useNavigate();

  // Real cart count from CartContext
  const { cartCount } = useCart();

  // Authentication state
  const { isAuthenticated, logout, user } = useAuth();

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();

    const searchTerm = search.trim();

    if (!searchTerm) return;

    navigate(
      `/products?search=${encodeURIComponent(searchTerm)}`
    );

    closeMenu();
  };

  const handleMobileLogout = () => {
    logout();
    closeMenu();
    navigate("/login", { replace: true });
  };

  return (
    <header className="site-header">
      <div className="nav-container">
        {/* Logo */}
        <Link
          to="/"
          className="nav-logo"
          onClick={closeMenu}
        >
          <span className="logo-icon">
            <Store size={23} />
          </span>

          <span className="logo-text">
            Injibara<span>Smart</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="desktop-links"
          aria-label="Main navigation"
        >
          <NavLink to="/" end>
            Home
          </NavLink>

          <NavLink to="/products">
            Products
          </NavLink>

          <NavLink to="/categories">
            Categories
          </NavLink>
        </nav>

        {/* Desktop Search */}
        <form
          className="nav-search"
          onSubmit={handleSearch}
        >
          <Search size={19} />

          <input
            type="search"
            placeholder="Search products..."
            aria-label="Search products"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button type="submit">
            Search
          </button>
        </form>

        {/* Right Actions */}
        <div className="nav-actions">
          {/* Notifications - authenticated users only */}
          {isAuthenticated && user && (
            <NotificationsBell />
          )}

          {/* Cart */}
          <Link
            to="/cart"
            className="cart-button"
            aria-label={`Shopping cart, ${cartCount} items`}
            onClick={closeMenu}
          >
            <ShoppingCart size={23} />

            {cartCount > 0 && (
              <span className="cart-count">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>

          {/* Profile / Login / Register */}
          <NavbarProfile />

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className="menu-toggle"
            onClick={() =>
              setMenuOpen((previous) => !previous)
            }
            aria-label={
              menuOpen ? "Close menu" : "Open menu"
            }
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
          >
            {menuOpen ? (
              <X size={25} />
            ) : (
              <Menu size={25} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {menuOpen && (
        <nav
          id="mobile-navigation"
          className="mobile-menu"
          aria-label="Mobile navigation"
        >
          <NavLink
            to="/"
            end
            onClick={closeMenu}
          >
            Home
          </NavLink>

          <NavLink
            to="/products"
            onClick={closeMenu}
          >
            Products
          </NavLink>

          <NavLink
            to="/categories"
            onClick={closeMenu}
          >
            Categories
          </NavLink>

          <Link
            to="/cart"
            onClick={closeMenu}
          >
            My Cart ({cartCount})
          </Link>

          {/* Mobile Search */}
          <form
            onSubmit={handleSearch}
            className="mobile-search"
          >
            <input
              type="search"
              placeholder="Search products..."
              aria-label="Search products"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <button type="submit">
              Search
            </button>
          </form>

          {/* Mobile Authentication Links */}
          {isAuthenticated ? (
            <>
              <Link
                to="/profile"
                onClick={closeMenu}
              >
                My Profile
                {user?.fullName
                  ? ` (${user.fullName})`
                  : ""}
              </Link>

              <button
                type="button"
                onClick={handleMobileLogout}
                className="mobile-logout"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={closeMenu}
              >
                Login
              </Link>

              <Link
                to="/register"
                onClick={closeMenu}
              >
                Create Account
              </Link>
            </>
          )}
        </nav>
      )}
    </header>
  );
}

export default Navbar;
