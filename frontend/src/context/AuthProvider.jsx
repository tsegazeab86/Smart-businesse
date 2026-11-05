import { useEffect, useState } from "react";
import {AuthContext} from "./auth-context";
import api from "../services/api";

function getSavedUser() {
  try {
    const token = sessionStorage.getItem("isb_token");
    const savedUser = sessionStorage.getItem("isb_user");

    if (!token || !savedUser) return null;

    return JSON.parse(savedUser);
  } catch {
    return null;
  }
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(getSavedUser);
  const [authLoading, setAuthLoading] = useState(
    () => Boolean(sessionStorage.getItem("isb_token"))
  );

  useEffect(() => {
    let active = true;

    async function verifySession() {
      const token = sessionStorage.getItem("isb_token");

      if (!token) {
        if (active) {
          setUser(null);
          setAuthLoading(false);
        }
        return;
      }

      try {
        const { data } = await api.get("/auth/me");

        if (!active) return;

        setUser(data.user);

        sessionStorage.setItem(
          "isb_user",
          JSON.stringify(data.user)
        );
      } catch (error) {
        if (!active) return;

        console.error("Session verification failed:", error);

        // An invalid/expired token must not keep the user logged in.
        // For a temporary network/server failure, preserve the token
        // but do not treat the cached user as authenticated.
        if (error.response?.status === 401) {
          sessionStorage.removeItem("isb_token");
          sessionStorage.removeItem("isb_user");
        }

        setUser(null);
      } finally {
        if (active) setAuthLoading(false);
      }
    }

    verifySession();

    return () => {
      active = false;
    };
  }, []);

  const login = (userData, token) => {
    if (!userData || !token) return;

    sessionStorage.setItem("isb_token", token);
    sessionStorage.setItem("isb_user", JSON.stringify(userData));

    setUser(userData);
    setAuthLoading(false);
  };

  const logout = () => {
    sessionStorage.removeItem("isb_token");
    sessionStorage.removeItem("isb_user");

    setUser(null);
    setAuthLoading(false);
  };

  const getToken = () => sessionStorage.getItem("isb_token");

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        authLoading,
        login,
        logout,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;