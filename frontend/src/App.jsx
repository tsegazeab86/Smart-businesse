
import { Routes, Route, Navigate } from "react-router-dom";

// ======================================
// GLOBAL COMPONENTS
// ======================================

import Navbar from "./components/Navbar";
import Footer from "./components/layout/Footer";

// ======================================
// PUBLIC PAGES
// ======================================

import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Categories from "./pages/Categories";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Cart from "./pages/Cart";

// ======================================
// CUSTOMER PAGES
// ======================================

import Profile from "./pages/Profile";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import MyOrders from "./pages/MyOrders";
import CustomerOrderDetails from "./pages/CustomerOrderDetails";

// ======================================
// ROUTE PROTECTION
// ======================================

import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

// ======================================
// ADMIN COMPONENTS
// ======================================

import AdminLayout from "./components/admin/AdminLayout";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminOrderDetails from "./pages/admin/AdminOrderDetails";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminSettings from "./pages/admin/AdminSettings";

// ======================================
// SELLER COMPONENTS
// ======================================

import SellerLayout from "./pages/seller/SellerLayout";
import SellerDashboard from "./pages/seller/SellerDashboard";
import SellerProducts from "./pages/seller/SellerProducts";
import SellerOrders from "./pages/seller/SellerOrders";
import SellerSalesReport from "./pages/seller/SellerSalesReport";
import SellerProfile from "./pages/seller/SellerProfile";

// ======================================
// MAIN APP
// ======================================

function App() {
  return (
    <>
      <Navbar />

      <Routes>

        {/* ============================
            PUBLIC ROUTES
        ============================ */}

        <Route path="/" element={<Home />} />

        <Route path="/products" element={<Products />} />

        <Route
          path="/products/:id"
          element={<ProductDetails />}
        />

        <Route
          path="/categories"
          element={<Categories />}
        />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/cart" element={<Cart />} />

        {/* ============================
            CUSTOMER ROUTES
        ============================ */}

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-orders"
          element={
            <ProtectedRoute>
              <MyOrders />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-orders/:id"
          element={
            <ProtectedRoute>
              <CustomerOrderDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/order-success/:id"
          element={
            <ProtectedRoute>
              <OrderSuccess />
            </ProtectedRoute>
          }
        />

        {/* ============================
            SELLER ROUTES
        ============================ */}

        <Route
          path="/seller"
          element={
            <ProtectedRoute>
              <SellerLayout />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={<Navigate to="dashboard" replace />}
          />

          <Route
            path="dashboard"
            element={<SellerDashboard />}
          />

          <Route
            path="products"
            element={<SellerProducts />}
          />

          <Route
            path="orders"
            element={<SellerOrders />}
          />

          <Route
            path="reports"
            element={<SellerSalesReport />}
          />

          <Route
            path="profile"
            element={<SellerProfile />}
          />
        </Route>

        {/* ============================
            ADMIN ROUTES
        ============================ */}

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />

          <Route path="orders" element={<AdminOrders />} />

          <Route
            path="orders/:id"
            element={<AdminOrderDetails />}
          />

          <Route
            path="products"
            element={<AdminProducts />}
          />

          <Route
            path="categories"
            element={<AdminCategories />}
          />

          <Route
            path="analytics"
            element={<AdminAnalytics />}
          />

          <Route
            path="customers"
            element={<AdminCustomers />}
          />

          <Route
            path="settings"
            element={<AdminSettings />}
          />
        </Route>

      </Routes>

      <Footer />
    </>
  );
}

export default App;
