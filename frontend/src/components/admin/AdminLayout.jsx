
import { NavLink, Outlet, Link } from "react-router-dom";

import {
  ArrowLeft,
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers3,
  ShieldCheck,
  BarChart3,
  UsersRound,
  Settings,
} from "lucide-react";

import "../../pages/admin/AdminDashboard.css";
// import NotificationsBell from "../notifications/NotificationsBell";

export default function AdminLayout() {
  const menu = [
    {
      to: "/admin",
      label: "Dashboard",
      icon: LayoutDashboard,
      end: true,
    },
    {
      to: "/admin/orders",
      label: "Manage Orders",
      icon: ShoppingBag,
    },
    {
      to: "/admin/products",
      label: "Manage Products",
      icon: Package,
    },
    {
      to: "/admin/categories",
      label: "Manage Categories",
      icon: Layers3,
    },
    {
      to: "/admin/customers",
      label: "Customers",
      icon: UsersRound,
    },
    {
      to: "/admin/analytics",
      label: "Analytics & Reports",
      icon: BarChart3,
    },
    {
      to: "/admin/settings",
      label: "Settings",
      icon: Settings,
    },
  ];

  return (
    <div className="admin-page">
      <div className="admin-layout">
        <aside className="admin-sidebar">

          {/* ADMIN BRAND */}
          <div className="admin-brand">
            <ShieldCheck size={27} />

            <div>
              <strong>INJIBARA</strong>
              <span>ADMIN PANEL</span>
            </div>
          </div>

           {/* <div className="admin-sidebar-notifications"> */}
            {/* <NotificationsBell adminMode /> */}
            {/* <span>Notifications</span> */}
          {/* </div> */}

          {/* ADMIN NAVIGATION */}
          <nav className="admin-nav">
            {menu.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `admin-nav-link ${isActive ? "active" : ""}`
                }
              >
                <Icon size={19} />
                <span>{label}</span>
              </NavLink>
            ))}

            <Link to="/" className="admin-nav-link">
              <ArrowLeft size={19} />
              <span>Back to Store</span>
            </Link>
          </nav>

          {/* SIDEBAR FOOTER */}
          <div className="admin-sidebar-bottom">
            <ShieldCheck size={17} />
            <span>Secure Admin Access</span>
          </div>
        </aside>

        <section className="admin-content">
          <Outlet />
        </section>
      </div>
    </div>
  );
}
