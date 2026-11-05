
import { useState } from "react";
import { AuthContext } from "./auth-context";

// Read saved user
function getSavedUser() {
  try {
    const token = sessionStorage.getItem("isb_token");
    const savedUser = sessionStorage.getItem("isb_user");

    if (!token || !savedUser) {
      return null;
    }

    const user = JSON.parse(savedUser);

    if (
      !user ||
      typeof user !== "object" ||
      Array.isArray(user)
    ) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

// Authentication Provider
export function AuthProvider({ children }) {
  const [user, setUser] = useState(getSavedUser);

  // LOGIN
  const login = (userData, token) => {
    if (!userData || !token) {
      throw new Error("Invalid authentication data.");
    }

    sessionStorage.setItem("isb_token", token);

    sessionStorage.setItem(
      "isb_user",
      JSON.stringify(userData)
    );

    setUser(userData);
  };

  // LOGOUT
  const logout = () => {
    sessionStorage.removeItem("isb_token");
    sessionStorage.removeItem("isb_user");

    setUser(null);
  };

  // GET TOKEN
  const getToken = () => {
    return sessionStorage.getItem("isb_token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        login,
        logout,
        getToken
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
