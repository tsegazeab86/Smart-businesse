
import { useEffect, useState } from "react";
import {
    Settings,
    Store,
    Truck,
    ShieldCheck,
    Save,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
} from "lucide-react";

import api from "../../services/api";
import "./AdminSettings.css";

const defaultSettings = {
    store_name: "",
    email: "",
    phone: "",
    address: "",
    currency: "ETB",
    shipping_fee: "0",
    maintenance_mode: false,
};

export default function AdminSettings() {
    const [settings, setSettings] = useState(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadSettings = async () => {
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const response = await api.get("/admin/settings");
            const data = response.data.settings || response.data;

            setSettings({
                store_name: data.store_name ?? "",
                email: data.email ?? "",
                phone: data.phone ?? "",
                address: data.address ?? "",
                currency: data.currency ?? "ETB",
                shipping_fee: String(data.shipping_fee ?? 0),
                maintenance_mode: Boolean(Number(data.maintenance_mode)),
            });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Could not load settings. Check your backend API."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchSettings = async () => {
            await loadSettings();
        };

        fetchSettings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setSettings((current) => ({
            ...current,
            [name]: value,
        }));

        setSuccess("");
        setError("");
    };

    const handleSave = async (event) => {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (!settings.store_name.trim()) {
            setError("Please enter a store name.");
            return;
        }

        const fee = Number(settings.shipping_fee);

        if (!Number.isFinite(fee) || fee < 0) {
            setError("Shipping fee must be zero or greater.");
            return;
        }

        setSaving(true);

        try {
            const payload = {
                ...settings,
                store_name: settings.store_name.trim(),
                email: settings.email.trim(),
                phone: settings.phone.trim(),
                address: settings.address.trim(),
                shipping_fee: fee,
                maintenance_mode: settings.maintenance_mode,
            };

            const response = await api.put("/admin/settings", payload);
            const saved = response.data.settings;

            if (saved) {
                setSettings({
                    store_name: saved.store_name ?? "",
                    email: saved.email ?? "",
                    phone: saved.phone ?? "",
                    address: saved.address ?? "",
                    currency: saved.currency ?? "ETB",
                    shipping_fee: String(saved.shipping_fee ?? 0),
                    maintenance_mode: Boolean(Number(saved.maintenance_mode)),
                });
            }

            setSuccess(
                response.data.message || "Settings saved successfully."
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Could not save settings. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="admin-settings-page">
                <div className="settings-loading">
                    <RefreshCw className="settings-spin" size={24} />
                    <span>Loading your settings...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-settings-page">
            <header className="settings-header">
                <div className="settings-heading-icon">
                    <Settings size={27} />
                </div>

                <div className="settings-heading-text">
                    <span className="settings-eyebrow">CONTROL CENTER</span>
                    <h1>Admin Settings</h1>
                    <p>
                        Customize your store information and business preferences.
                    </p>
                </div>

                <button
                    type="button"
                    className="settings-refresh-btn"
                    onClick={loadSettings}
                    disabled={saving}
                >
                    <RefreshCw size={17} />
                    Refresh
                </button>
            </header>

            {error && (
                <div className="settings-alert settings-alert-error" role="alert">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div
                    className="settings-alert settings-alert-success"
                    role="status"
                >
                    <CheckCircle2 size={20} />
                    <span>{success}</span>
                </div>
            )}

            <form onSubmit={handleSave}>
                <section className="settings-card">
                    <div className="settings-card-heading">
                        <div className="settings-section-icon store-icon">
                            <Store size={22} />
                        </div>
                        <div>
                            <h2>Store Information</h2>
                            <p>
                                Manage your business identity and contact details.
                            </p>
                        </div>
                    </div>

                    <div className="settings-form-grid">
                        <div className="settings-field">
                            <label htmlFor="store_name">Store Name</label>
                            <input
                                id="store_name"
                                name="store_name"
                                value={settings.store_name}
                                onChange={handleChange}
                                placeholder="Injibara Smart Business"
                                required
                                maxLength={150}
                            />
                        </div>

                        <div className="settings-field">
                            <label htmlFor="email">Store Email</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={settings.email}
                                onChange={handleChange}
                                placeholder="support@example.com"
                                maxLength={190}
                            />
                        </div>

                        <div className="settings-field">
                            <label htmlFor="phone">Phone Number</label>
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                value={settings.phone}
                                onChange={handleChange}
                                placeholder="+251..."
                                maxLength={30}
                            />
                        </div>

                        <div className="settings-field settings-field-full">
                            <label htmlFor="address">Store Address</label>
                            <textarea
                                id="address"
                                name="address"
                                value={settings.address}
                                onChange={handleChange}
                                placeholder="Enter your store address"
                                rows={3}
                            />
                        </div>
                    </div>
                </section>

                <section className="settings-card">
                    <div className="settings-card-heading">
                        <div className="settings-section-icon shipping-icon">
                            <Truck size={22} />
                        </div>
                        <div>
                            <h2>Business Preferences</h2>
                            <p>
                                Configure your preferred currency and delivery fee.
                            </p>
                        </div>
                    </div>

                    <div className="settings-form-grid">
                        <div className="settings-field">
                            <label htmlFor="currency">Store Currency</label>
                            <select
                                id="currency"
                                name="currency"
                                value={settings.currency}
                                onChange={handleChange}
                            >
                                <option value="ETB">ETB — Ethiopian Birr</option>
                                <option value="USD">USD — US Dollar</option>
                                <option value="EUR">EUR — Euro</option>
                                <option value="GBP">GBP — British Pound</option>
                            </select>
                            <small>
                                Existing prices and orders are not automatically converted.
                            </small>
                        </div>

                        <div className="settings-field">
                            <label htmlFor="shipping_fee">
                                Default Shipping Fee
                            </label>
                            <input
                                id="shipping_fee"
                                name="shipping_fee"
                                type="number"
                                min="0"
                                step="0.01"
                                value={settings.shipping_fee}
                                onChange={handleChange}
                                required
                            />
                            <small>
                                Connect this value to checkout separately if needed.
                            </small>
                        </div>
                    </div>
                </section>

                <section className="settings-card">
                    <div className="settings-card-heading">
                        <div className="settings-section-icon security-icon">
                            <ShieldCheck size={22} />
                        </div>
                        <div>
                            <h2>Store Availability</h2>
                            <p>Manage the maintenance mode setting.</p>
                        </div>
                    </div>

                    <div className="settings-toggle-row">
                        <div className="settings-toggle-copy">
                            <strong>Maintenance Mode</strong>
                            <p>
                                {settings.maintenance_mode
                                    ? "Maintenance mode is enabled in settings."
                                    : "Your maintenance setting is currently disabled."}
                            </p>
                            <small>
                                This saves the setting but does not block visitors unless
                                maintenance enforcement is implemented separately.
                            </small>
                        </div>

                        <label className="settings-switch">
                            <input
                                type="checkbox"
                                checked={settings.maintenance_mode}
                                onChange={(event) => {
                                    setSettings((current) => ({
                                        ...current,
                                        maintenance_mode: event.target.checked,
                                    }));
                                    setSuccess("");
                                    setError("");
                                }}
                                aria-label="Enable maintenance mode"
                            />
                            <span className="settings-switch-track" />
                        </label>
                    </div>
                </section>

                <div className="settings-actions">
                    <button
                        type="button"
                        className="settings-cancel-btn"
                        onClick={loadSettings}
                        disabled={saving}
                    >
                        <RefreshCw size={16} />
                        Reset Changes
                    </button>

                    <button
                        type="submit"
                        className="settings-save-btn"
                        disabled={saving}
                    >
                        {saving ? (
                            <>
                                <RefreshCw className="settings-spin" size={18} />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Save Settings
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
