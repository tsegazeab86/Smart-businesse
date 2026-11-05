
import api from "./api";

// ====================================
// AUTHENTICATION
// ====================================

// Read token saved by AuthProvider
const getToken = () => {
  return sessionStorage.getItem("isb_token");
};

// ====================================
// REUSABLE SELLER API REQUEST
// ====================================

const request = async (method, path, body) => {
  const token = getToken();

  if (!token) {
    throw new Error(
      "Login session not found. Please sign in again."
    );
  }

  try {
    const response = await api({
      method,
      url: path,
      data: body,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (err) {
    console.error("Seller API error:", err);

    if (err.response?.status === 401) {
      console.error("Login session expired or invalid.");
    }

    if (err.response?.status === 403) {
      console.error("Seller access denied.");
    }

    throw err;
  }
};

// ====================================
// SELLER API ENDPOINTS
// ====================================

export const sellerApi = {

  // ==================================
  // DASHBOARD STATISTICS
  // ==================================

  getDashboardStats: () =>
    request("GET", "/seller/dashboard/stats"),

  // ==================================
  // PRODUCT MANAGEMENT
  // ==================================

  getProducts: () =>
    request("GET", "/seller/products"),

  addProduct: (product) =>
    request("POST", "/seller/products", product),

  updateProduct: (id, product) =>
    request("PUT", `/seller/products/${id}`, product),

  deleteProduct: (id) =>
    request("DELETE", `/seller/products/${id}`),

  // ==================================
  // ORDER MANAGEMENT
  // ==================================

  getOrders: () =>
    request("GET", "/seller/orders"),

  getOrderDetails: (id) =>
    request("GET", `/seller/orders/${id}`),

  // ==================================
  // SALES REPORTS
  // ==================================

  getSalesReport: () =>
    request("GET", "/seller/reports/sales"),

  // ==================================
  // SELLER PROFILE
  // ==================================

  getProfile: () =>
    request("GET", "/seller/profile"),

  updateProfile: (profile) =>
    request("PUT", "/seller/profile", profile),

};

export default sellerApi;
