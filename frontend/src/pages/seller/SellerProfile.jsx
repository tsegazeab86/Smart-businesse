
import  { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { sellerApi } from "../../services/sellerApi";
import "./SellerProfile.css";

const SellerProfile = () => {
  const [profile, setProfile] = useState(null);

  const [form, setForm] = useState({
    full_name: "",
    store_name: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================
  // LOAD SELLER PROFILE
  // =====================================

  useEffect(() => {
    let active = true;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await sellerApi.getProfile();

        if (!active) return;

        if (!response?.profile) {
          throw new Error("Invalid seller profile response.");
        }

        setProfile(response.profile);

        setForm({
          full_name: response.profile.full_name || "",
          store_name: response.profile.store_name || "",
        });
      } catch (err) {
        if (!active) return;

        console.error("Seller profile error:", err);

        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load seller profile."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      active = false;
    };
  }, []);

  // =====================================
  // HANDLE INPUT
  // =====================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setSuccess("");
  };

  // =====================================
  // UPDATE PROFILE
  // =====================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) return;

    setError("");
    setSuccess("");

    const fullName = form.full_name.trim();
    const storeName = form.store_name.trim();

    if (!fullName || !storeName) {
      setError("Full name and store name are required.");
      return;
    }

    if (fullName.length > 150) {
      setError("Full name must not exceed 150 characters.");
      return;
    }

    if (storeName.length > 200) {
      setError("Store name must not exceed 200 characters.");
      return;
    }

    try {
      setSaving(true);

      const response = await sellerApi.updateProfile({
        full_name: fullName,
        store_name: storeName,
      });

      setProfile((previous) => ({
        ...previous,
        ...response.profile,
        full_name: fullName,
        store_name: storeName,
      }));

      setForm({
        full_name: fullName,
        store_name: storeName,
      });

      setSuccess(
        response.message ||
          "Seller profile updated successfully."
      );
    } catch (err) {
      console.error("Update seller profile error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to update seller profile."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================
  // LOADING
  // =====================================

  if (loading) {
    return (
      <div className="seller-profile-page">
        <div className="sp-message" role="status">
          Loading seller profile...
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="seller-profile-page">
        <div className="sp-error" role="alert">
          {error || "Seller profile is unavailable."}
        </div>

        <Link to="/seller/dashboard" className="sp-back-link">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  // =====================================
  // PROFILE PAGE
  // =====================================

  const initials = (profile.store_name || "S")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <div className="seller-profile-page">

      {/* HEADER */}

      <header className="sp-header">
        <div>
          <span className="sp-eyebrow">
            SELLER ACCOUNT
          </span>

          <h1>Seller Profile</h1>

          <p>
            Manage your business identity and account information.
          </p>
        </div>

        <Link
          to="/seller/dashboard"
          className="sp-back-link"
        >
          ← Dashboard
        </Link>
      </header>

      {/* PROFILE BANNER */}

      <section className="sp-banner">
        <div className="sp-avatar">
          {initials}
        </div>

        <div className="sp-banner-info">
          <span className="sp-banner-label">
            SMART BUSINESS SELLER
          </span>

          <h2>{profile.store_name}</h2>

          <p>{profile.email}</p>
        </div>

        <span
          className={`sp-status sp-status-${profile.approval_status}`}
        >
          {profile.approval_status || "Unknown"}
        </span>
      </section>

      {/* ALERTS */}

      {error && (
        <div className="sp-error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="sp-success" role="status">
          ✓ {success}
        </div>
      )}

      <div className="sp-content-grid">

        {/* EDIT PROFILE */}

        <section className="sp-panel">
          <div className="sp-panel-heading">
            <span className="sp-eyebrow">
              EDIT INFORMATION
            </span>

            <h2>Basic Information</h2>

            <p>
              Update your personal and business display names.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="sp-form">

            <div className="sp-field">
              <label htmlFor="full_name">
                Full Name
              </label>

              <input
                id="full_name"
                type="text"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                maxLength={150}
                required
                disabled={saving}
                placeholder="Enter your full name"
              />
            </div>

            <div className="sp-field">
              <label htmlFor="store_name">
                Store Name
              </label>

              <input
                id="store_name"
                type="text"
                name="store_name"
                value={form.store_name}
                onChange={handleChange}
                maxLength={200}
                required
                disabled={saving}
                placeholder="Enter your store name"
              />
            </div>

            <div className="sp-field">
              <label htmlFor="seller_email">
                Email Address
              </label>

              <input
                id="seller_email"
                type="email"
                value={profile.email || ""}
                readOnly
              />

              <small>
                Your email address cannot be changed here.
              </small>
            </div>

            <button
              type="submit"
              className="sp-save-button"
              disabled={saving}
            >
              {saving ? "Saving Changes..." : "Save Changes"}
            </button>
          </form>
        </section>

        {/* BUSINESS INFORMATION */}

        <section className="sp-panel">
          <div className="sp-panel-heading">
            <span className="sp-eyebrow">
              BUSINESS DETAILS
            </span>

            <h2>Store Information</h2>

            <p>
              Information registered with your seller application.
            </p>
          </div>

          <div className="sp-details">

            <div className="sp-detail-row">
              <span>Store Name</span>
              <strong>{profile.store_name || "—"}</strong>
            </div>

            <div className="sp-detail-row">
              <span>Description</span>
              <strong>
                {profile.store_description || "Not provided"}
              </strong>
            </div>

            <div className="sp-detail-row">
              <span>Phone Number</span>
              <strong>{profile.phone || "Not provided"}</strong>
            </div>

            <div className="sp-detail-row">
              <span>City</span>
              <strong>{profile.city || "Not provided"}</strong>
            </div>

            <div className="sp-detail-row">
              <span>Address</span>
              <strong>{profile.address || "Not provided"}</strong>
            </div>

            <div className="sp-detail-row">
              <span>Account Role</span>
              <strong>{profile.role || "Seller"}</strong>
            </div>

            <div className="sp-detail-row">
              <span>Approval Status</span>

              <strong className="sp-status-text">
                {profile.approval_status || "Unknown"}
              </strong>
            </div>

            <div className="sp-detail-row">
              <span>Account Status</span>

              <strong>
                {Number(profile.is_active) === 1
                  ? "Active"
                  : "Inactive"}
              </strong>
            </div>
          </div>
        </section>

      </div>

      {/* FOOTER */}

      <footer className="sp-footer">
        <span>
          © {new Date().getFullYear()} Smart Business
        </span>

        <span>Seller Account Management</span>
      </footer>

    </div>
  );
};

export default SellerProfile;
