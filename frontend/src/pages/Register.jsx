
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
  ShoppingBag,
  ShieldCheck,
  Sparkles,
  AlertCircle
} from "lucide-react";

import api from "../services/api";
import useAuth from "../hooks/useAuth"; 
import "./Auth.css";

function Register() {
  const navigate = useNavigate();

  // Global authentication
  const { login } = useAuth();

  // Form state
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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

  // Handle registration
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    setError("");

    // Validate full name
    if (form.fullName.trim().length < 2) {
      setError("Full name must contain at least 2 characters.");
      return;
    }

    // Validate email
    if (!form.email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    // Validate password
    if (
      form.password.length < 8 ||
      form.password.length > 72
    ) {
      setError(
        "Password must contain between 8 and 72 characters."
      );
      return;
    }

    // Confirm password
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      // Send data to Express backend
      const response = await api.post("/auth/register", {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password
      });

      const { token, user } = response.data;

      if (!token || !user) {
        throw new Error("Invalid registration response.");
      }

      // Update Auth Context + sessionStorage
      login(user, token);

      // Redirect to homepage
      navigate("/", { replace: true });

    } catch (err) {
      console.error("Register Error:", err);

      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to create your account. Please try again."
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
              JOIN OUR COMMUNITY
            </span>

            <h2>
              Your next great
              <br />
              discovery starts here.
            </h2>

            <p>
              Create your account and explore a world of
              products with Injibara Smart Business.
            </p>

            <div className="auth-showcase-feature">
              <ShieldCheck size={20} />
              <span>A smarter way to shop</span>
            </div>

          </div>

          <span className="auth-showcase-bottom">
            INJIBARA SMART BUSINESS
          </span>

        </div>

        {/* RIGHT SIDE — REGISTER FORM */}
        <div className="auth-form-side">

          <div className="auth-form-wrap">

            <div className="auth-mobile-brand">
              <ShoppingBag size={23} />
              <strong>Injibara Smart</strong>
            </div>

            <span className="auth-form-eyebrow">
              GET STARTED
            </span>

            <h1>Create your account</h1>

            <p className="auth-subtitle">
              Join us today. It only takes a moment.
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

              {/* FULL NAME */}
              <div className="auth-field">

                <label htmlFor="register-name">
                  Full Name
                </label>

                <div className="auth-input-wrap">

                  <UserRound size={19} />

                  <input
                    id="register-name"
                    name="fullName"
                    type="text"
                    placeholder="Your full name"
                    autoComplete="name"
                    maxLength={150}
                    value={form.fullName}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />

                </div>

              </div>

              {/* EMAIL */}
              <div className="auth-field">

                <label htmlFor="register-email">
                  Email Address
                </label>

                <div className="auth-input-wrap">

                  <Mail size={19} />

                  <input
                    id="register-email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    maxLength={190}
                    value={form.email}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />

                </div>

              </div>

              {/* PASSWORD */}
              <div className="auth-field">

                <label htmlFor="register-password">
                  Password
                </label>

                <div className="auth-input-wrap">

                  <LockKeyhole size={19} />

                  <input
                    id="register-password"
                    name="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={72}
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

              {/* CONFIRM PASSWORD */}
              <div className="auth-field">

                <label htmlFor="register-confirm">
                  Confirm Password
                </label>

                <div className="auth-input-wrap">

                  <LockKeyhole size={19} />

                  <input
                    id="register-confirm"
                    name="confirmPassword"
                    type={
                      showConfirm
                        ? "text"
                        : "password"
                    }
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={72}
                    value={form.confirmPassword}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />

                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() =>
                      setShowConfirm((previous) => !previous)
                    }
                    aria-label={
                      showConfirm
                        ? "Hide confirmation password"
                        : "Show confirmation password"
                    }
                    aria-pressed={showConfirm}
                  >
                    {showConfirm ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>

                </div>

              </div>

              <p className="auth-password-hint">
                Use 8–72 characters for your password.
              </p>

              {/* REGISTER BUTTON */}
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
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight size={19} />
                  </>
                )}

              </button>

            </form>

            {/* LOGIN LINK */}
            <p className="auth-switch">
              Already have an account?{" "}
              <Link to="/login">
                Sign in
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

export default Register;
