
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShoppingBag,
  ShieldCheck,
  Sparkles,
  AlertCircle
} from "lucide-react";

import api from "../services/api";
import useAuth from "../hooks/useAuth"; 
import "./Auth.css";

function Login() {
  const navigate = useNavigate();

  // Global authentication
  const { login } = useAuth();

  // Form state
  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle input changes
  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));

    if (error) {
      setError("");
    }
  };

  // Handle login submission
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    setError("");

    // Frontend validation
    if (!form.email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!form.password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      // Express backend API
      const response = await api.post("/auth/login", {
        email: form.email.trim(),
        password: form.password
      });

      const { token, user } = response.data;

      if (!token || !user) {
        throw new Error("Invalid authentication response.");
      }

      // Update Auth Context + sessionStorage
      login(user, token);

      // Redirect to homepage
      navigate("/", { replace: true });

    } catch (err) {
      console.error("Login Error:", err);

      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to sign in. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">

      <section className="auth-shell">

        {/* LEFT SIDE — SHOWCASE */}
        <div className="auth-showcase">

          <div className="auth-showcase-glow glow-one" />
          <div className="auth-showcase-glow glow-two" />

          <Link to="/" className="auth-brand">
            <span className="auth-brand-icon">
              <ShoppingBag size={23} />
            </span>

            <span>
              Injibara<span>Smart</span>
            </span>
          </Link>

          <div className="auth-showcase-main">

            <div className="auth-floating-icon">
              <Sparkles size={34} />
            </div>

            <span className="auth-showcase-label">
              YOUR SHOPPING JOURNEY
            </span>

            <h2>
              Welcome back to
              <br />
              something amazing.
            </h2>

            <p>
              Discover products you love and enjoy a smarter
              shopping experience, all in one place.
            </p>

            <div className="auth-showcase-feature">
              <ShieldCheck size={20} />
              <span>Secure account access</span>
            </div>

          </div>

          <span className="auth-showcase-bottom">
            INJIBARA SMART BUSINESS
          </span>

        </div>

        {/* RIGHT SIDE — LOGIN FORM */}
        <div className="auth-form-side">

          <div className="auth-form-wrap">

            <div className="auth-mobile-brand">
              <ShoppingBag size={23} />
              <strong>Injibara Smart</strong>
            </div>

            <span className="auth-form-eyebrow">
              WELCOME BACK
            </span>

            <h1>Sign in to your account</h1>

            <p className="auth-subtitle">
              Enter your details to continue shopping.
            </p>

            {/* ERROR ALERT */}
            {error && (
              <div className="auth-alert" role="alert">
                <AlertCircle size={19} />
                <span>{error}</span>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="auth-form"
            >

              {/* EMAIL */}
              <div className="auth-field">

                <label htmlFor="login-email">
                  Email Address
                </label>

                <div className="auth-input-wrap">

                  <Mail size={19} />

                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={form.email}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />

                </div>

              </div>

              {/* PASSWORD */}
              <div className="auth-field">

                <label htmlFor="login-password">
                  Password
                </label>

                <div className="auth-input-wrap">

                  <LockKeyhole size={19} />

                  <input
                    id="login-password"
                    name="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    value={form.password}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />

                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() =>
                      setShowPassword((previous) => !previous)
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>

                </div>

              </div>

              {/* LOGIN BUTTON */}
              <button
                type="submit"
                className="auth-submit"
                disabled={loading}
              >

                {loading ? (
                  <>
                    <span
                      className="auth-button-spinner"
                      aria-hidden="true"
                    />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={19} />
                  </>
                )}

              </button>

            </form>

            {/* REGISTER LINK */}
            <p className="auth-switch">
              Don't have an account?{" "}
              <Link to="/register">
                Create account
              </Link>
            </p>

            <div className="auth-back">
              <Link to="/">
                ← Back to Store
              </Link>
            </div>

          </div>

        </div>

      </section>

    </main>
  );
}

export default Login;
