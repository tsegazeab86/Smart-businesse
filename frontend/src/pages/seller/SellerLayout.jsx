
// import   from "react";
import {
  Link,
  Outlet,
  NavLink,
} from "react-router-dom";

import "./SellerLayout.css";

const menuItems = [
  {
    label: "Dashboard",
    path: "/seller/dashboard",
    icon: "🏠",
  },
  {
    label: "My Products",
    path: "/seller/products",
    icon: "📦",
  },
  {
    label: "My Orders",
    path: "/seller/orders",
    icon: "🛒",
  },
  {
    label: "Sales Reports",
    path: "/seller/reports",
    icon: "📊",
  },
  {
    label: "Seller Profile",
    path: "/seller/profile",
    icon: "👤",
  },
];

const SellerLayout = () => {
  return (
    <div className="seller-layout">

      {/* SIDEBAR */}

      <aside className="seller-sidebar">

        {/* BRAND */}

        <Link
          to="/seller/dashboard"
          className="seller-brand"
        >
          <span className="seller-brand-icon">
            S
          </span>

          <span>Smart Business</span>
        </Link>

        {/* SELLER INFORMATION */}

        <div className="seller-profile">
          <div className="seller-avatar">
            S
          </div>

          <div>
            <h3>Seller Portal</h3>
            <p>Manage your business</p>
          </div>
        </div>

        {/* NAVIGATION */}

        <nav className="seller-navigation">
          <p className="seller-menu-title">
            WORKSPACE
          </p>

          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/seller/dashboard"}
              className={({ isActive }) =>
                `seller-menu-link ${
                  isActive ? "active" : ""
                }`
              }
            >
              <span className="seller-menu-icon">
                {item.icon}
              </span>

              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* SIDEBAR FOOTER */}

        <div className="seller-sidebar-bottom">
          <p>Smart Business</p>

          <span>
            Seller Management System
          </span>
        </div>

      </aside>

      {/* MAIN CONTENT */}

      <main className="seller-content">
        <Outlet />
      </main>

    </div>
  );
};

export default SellerLayout;
