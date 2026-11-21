import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import {
    FiArrowLeft,
    FiSave,
    FiUser,
    FiBriefcase,
    FiMapPin,
    FiPhone,
    FiMail,
    FiHash,
    FiCreditCard,
    FiImage,
    FiCheckCircle,
    FiAlertCircle,
    FiZap,
} from "react-icons/fi";

export default function EditBusiness() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [form, setForm] = useState({
        id: "",
        business_name: "",
        business_type: "",
        owner_name: "",
        phone: "",
        email: "",
        gst_number: "",
        upi_id: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        logo: ""
    });

    useEffect(() => {
        loadBusiness();
    }, []);

    const loadBusiness = async () => {
        try {
            const res = await API.get("/business/profile");
            setForm(res.data.business);
        } catch (err) {
            console.log(err);
            alert("Unable to load business profile.");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await API.put("/business/profile", form);
            localStorage.setItem("businessName", form.business_name);
            localStorage.setItem("businessType", form.business_type);
            setSaved(true);
            setTimeout(() => {
                alert("Business profile updated successfully!");
                navigate("/dashboard");
            }, 500);
        } catch (err) {
            console.log(err);
            alert(err.response?.data?.message || "Unable to update business.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="lux-shell lux-loading-screen">
                <div className="lux-loading-card">
                    <div className="lux-mark"><FiZap /></div>
                    <div className="lux-spin" />
                    <h3>Loading your business profile</h3>
                    <p>Fetching your saved information…</p>
                </div>
                <EditStyles />
            </div>
        );
    }

    return (
        <div className="lux-shell">
            <main className="lux-main">
                {/* Topbar */}
                <header className="lux-topbar">
                    <div className="lux-crumbs">
                        <Link to="/dashboard">Workspace</Link>
                        <span className="lux-slash">/</span>
                        <span>Settings</span>
                        <span className="lux-slash">/</span>
                        <strong>Business Profile</strong>
                    </div>

                    <div className="lux-topbar-actions">
                        <button
                            type="button"
                            className="lux-btn-ghost"
                            onClick={() => navigate("/dashboard")}
                        >
                            <FiArrowLeft /> Back
                        </button>
                        <button
                            type="submit"
                            form="edit-business-form"
                            className={`lux-btn-primary ${saving ? "is-loading" : ""}`}
                            disabled={saving}
                        >
                            {saved ? <FiCheckCircle /> : <FiSave />}
                            {saving ? "Saving…" : saved ? "Saved" : "Save Changes"}
                        </button>
                    </div>
                </header>

                {/* Masthead */}
                <section className="lux-masthead">
                    <div className="lux-masthead-copy">
                        <span className="lux-eyebrow">
                            <i /> BUSINESS SETTINGS
                        </span>
                        <h1>
                            Edit your <span className="lux-accent">business</span> profile
                        </h1>
                    </div>
                </section>

                {/* Form layout */}
                <form
                    id="edit-business-form"
                    onSubmit={handleSubmit}
                    className="lux-form-grid"
                >
                    {/* LEFT: Identity preview + Section */}
                    <aside className="lux-profile-aside">
                        <div className="lux-profile-card">
                            <div className="lux-avatar-wrap">
                                {form.logo ? (
                                    <img src={form.logo} alt="Business Logo" className="lux-avatar-img" />
                                ) : (
                                    <div className="lux-avatar-placeholder"><FiBriefcase /></div>
                                )}
                                <span className="lux-avatar-badge">
                                    <FiZap />
                                </span>
                            </div>

                            <h2 className="lux-profile-name">
                                {form.business_name || "Business Name"}
                            </h2>
                            <span className="lux-profile-type">
                                {form.business_type ? form.business_type.toUpperCase() : "BUSINESS"}
                            </span>

                            <div className="lux-profile-meta">
                                <div className="lux-meta-row">
                                    <FiUser />
                                    <span>{form.owner_name || "Owner name not set"}</span>
                                </div>
                                <div className="lux-meta-row">
                                    <FiPhone />
                                    <span>{form.phone || "Phone not set"}</span>
                                </div>
                                <div className="lux-meta-row">
                                    <FiMail />
                                    <span>{form.email || "Email not set"}</span>
                                </div>
                                <div className="lux-meta-row">
                                    <FiMapPin />
                                    <span>
                                        {[form.city, form.state].filter(Boolean).join(", ") ||
                                            "Location not set"}
                                    </span>
                                </div>
                            </div>

                            <div className="lux-profile-note">
                                <FiAlertCircle />
                                <span>Changes update your public storefront instantly.</span>
                            </div>
                        </div>
                    </aside>

                    {/* RIGHT: Form fields */}
                    <div className="lux-form-main">
                        {/* Business Information */}
                        <div className="lux-card">
                            <header className="lux-card-head">
                                <div>
                                    <span className="lux-eyebrow">SECTION 01</span>
                                    <h3>Business information</h3>
                                </div>
                                <span className="lux-hint">Required</span>
                            </header>

                            <div className="lux-field-grid">
                                <div className="lux-field lux-field-full">
                                    <label>Business Name <span className="lux-req">*</span></label>
                                    <input
                                        type="text"
                                        name="business_name"
                                        placeholder="Enter business name"
                                        value={form.business_name || ""}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="lux-field">
                                    <label>Business Type <span className="lux-req">*</span></label>
                                    <select
                                        name="business_type"
                                        value={form.business_type || ""}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select Business Type</option>
                                        <option value="grocery">Grocery Store</option>
                                        <option value="medical">Medical Shop</option>
                                        <option value="restaurant">Restaurant</option>
                                        <option value="clothing">Clothing Store</option>
                                        <option value="mobile">Mobile Shop</option>
                                        <option value="electronics">Electronics</option>
                                        <option value="hardware">Hardware</option>
                                        <option value="bakery">Bakery</option>
                                        <option value="supermarket">Supermarket</option>
                                        <option value="pharmacy">Pharmacy</option>
                                        <option value="salon">Salon</option>
                                        <option value="hotel">Hotel</option>
                                        <option value="factory">Factory</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div className="lux-field">
                                    <label>Owner Name</label>
                                    <input
                                        type="text"
                                        name="owner_name"
                                        placeholder="Enter owner's full name"
                                        value={form.owner_name || ""}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="lux-field lux-field-full">
                                    <label><FiImage style={{ marginRight: 6 }} /> Logo URL</label>
                                    <input
                                        type="text"
                                        name="logo"
                                        placeholder="https://example.com/logo.png"
                                        value={form.logo || ""}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Contact & Location */}
                        <div className="lux-card">
                            <header className="lux-card-head">
                                <div>
                                    <span className="lux-eyebrow">SECTION 02</span>
                                    <h3>Contact & location</h3>
                                </div>
                                <span className="lux-hint">Optional</span>
                            </header>

                            <div className="lux-field-grid">
                                <div className="lux-field">
                                    <label>Phone Number</label>
                                    <input
                                        type="text"
                                        name="phone"
                                        placeholder="Enter phone number"
                                        value={form.phone || ""}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="lux-field">
                                    <label>Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="Enter business email"
                                        value={form.email || ""}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="lux-field">
                                    <label>GST Number</label>
                                    <input
                                        type="text"
                                        name="gst_number"
                                        placeholder="Enter GST number"
                                        value={form.gst_number || ""}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="lux-field">
                                    <label>UPI ID</label>
                                    <input
                                        type="text"
                                        name="upi_id"
                                        placeholder="Enter UPI ID"
                                        value={form.upi_id || ""}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="lux-field lux-field-full">
                                    <label>Address</label>
                                    <textarea
                                        rows="2"
                                        name="address"
                                        placeholder="Enter business address"
                                        value={form.address || ""}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="lux-field">
                                    <label>City</label>
                                    <input
                                        type="text"
                                        name="city"
                                        placeholder="City"
                                        value={form.city || ""}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="lux-field">
                                    <label>State</label>
                                    <input
                                        type="text"
                                        name="state"
                                        placeholder="State"
                                        value={form.state || ""}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="lux-field">
                                    <label>Pincode</label>
                                    <input
                                        type="text"
                                        name="pincode"
                                        placeholder="Enter pincode"
                                        value={form.pincode || ""}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="lux-actions">
                            <button
                                type="button"
                                className="lux-btn-ghost"
                                onClick={() => navigate("/dashboard")}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className={`lux-btn-primary ${saving ? "is-loading" : ""}`}
                                disabled={saving}
                            >
                                {saved ? <FiCheckCircle /> : <FiSave />}
                                {saving ? "Saving…" : saved ? "Saved" : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </form>

                <footer className="lux-footer">
                    <span>BusinessOS · Profile Settings</span>
                    <span>All changes are logged</span>
                </footer>
            </main>

            <EditStyles />
        </div>
    );
}

function EditStyles() {
    return (
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Geist:wght@400;500;600;700&display=swap');

            .lux-shell {
                --canvas: #efece5;
                --canvas-2: #e7e3d9;
                --paper: #fbf9f4;
                --paper-2: #f4f1ea;
                --ink: #0f0f0e;
                --ink-2: #1a1a18;
                --ink-soft: #3a3a36;
                --muted: #8a8780;
                --line: #ded9cd;
                --line-strong: #cdc6b6;
                --gold: #c9a24a;
                --gold-soft: #e6c987;
                --gold-bg: #f7edd4;
                --danger: #b63b3b;
                --ok: #3f7d4f;

                min-height: 100vh;
                background: var(--canvas);
                background-image:
                    radial-gradient(1200px 600px at 100% -10%, rgba(201,162,74,.07), transparent 60%),
                    radial-gradient(900px 500px at -10% 110%, rgba(20,20,15,.05), transparent 60%);
                color: var(--ink);
                font-family: 'Geist', system-ui, -apple-system, sans-serif;
                letter-spacing: -.005em;
                -webkit-font-smoothing: antialiased;
            }
            .lux-shell * { box-sizing: border-box; }
            .lux-shell a { color: inherit; text-decoration: none; }

            /* Main column */
            .lux-main {
                max-width: 1240px;
                margin: 0 auto;
                padding: 0 32px 32px;
                display: flex;
                flex-direction: column;
            }

            /* Topbar */
            .lux-topbar {
                min-height: 84px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 16px;
                padding: 12px 0;
                border-bottom: 1px solid var(--line);
                flex-wrap: wrap;
            }
            .lux-crumbs {
                display: flex;
                align-items: center;
                gap: 10px;
                color: var(--muted);
                font-size: 12px;
            }
            .lux-crumbs a { color: var(--muted); transition: color .2s; }
            .lux-crumbs a:hover { color: var(--ink); }
            .lux-crumbs strong { color: var(--ink); font-weight: 600; }
            .lux-slash { color: var(--line-strong); }

            .lux-topbar-actions {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            /* Buttons */
            .lux-btn-primary,
            .lux-btn-ghost {
                min-height: 42px;
                padding: 0 18px;
                border-radius: 10px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                font-size: 12.5px;
                font-weight: 600;
                cursor: pointer;
                transition: all .2s ease;
                border: 1px solid transparent;
                font-family: inherit;
            }
            .lux-btn-primary {
                background: var(--ink);
                color: var(--paper);
                box-shadow: 0 8px 22px rgba(20,20,15,.20);
            }
            .lux-btn-primary:hover:not(:disabled) {
                background: var(--ink-2);
                transform: translateY(-2px);
                box-shadow: 0 14px 28px rgba(20,20,15,.24);
            }
            .lux-btn-primary:disabled { opacity: .6; cursor: not-allowed; }
            .lux-btn-primary.is-loading svg { animation: lux-spin .8s linear infinite; }

            .lux-btn-ghost {
                background: transparent;
                color: var(--ink);
                border-color: var(--line-strong);
            }
            .lux-btn-ghost:hover {
                border-color: var(--ink);
                background: var(--paper);
            }

            /* Masthead */
            .lux-masthead {
                padding: 22px 0 26px;
            }
            .lux-eyebrow {
                display: inline-flex;
                align-items: center;
                gap: 9px;
                color: var(--muted);
                font-size: 10px;
                letter-spacing: 2px;
                font-weight: 600;
                text-transform: uppercase;
            }
            .lux-eyebrow i {
                width: 14px;
                height: 1.5px;
                border-radius: 4px;
                background: var(--gold);
            }
            .lux-masthead-copy h1 {
                font-family: 'Fraunces', Georgia, serif;
                font-size: clamp(26px, 3.4vw, 40px);
                line-height: 1.05;
                letter-spacing: -1.4px;
                margin: 12px 0 0;
                font-weight: 600;
                color: var(--ink);
            }
            .lux-accent {
                font-style: italic;
                position: relative;
                padding-bottom: 2px;
            }
            .lux-accent::after {
                content: "";
                position: absolute;
                left: 2px; right: 2px; bottom: -2px;
                height: 6px;
                background: var(--gold);
                opacity: .28;
                border-radius: 3px;
                z-index: -1;
            }

            /* Form layout */
            .lux-form-grid {
                display: grid;
                grid-template-columns: 300px minmax(0, 1fr);
                gap: 20px;
                align-items: start;
            }

            /* Profile aside */
            .lux-profile-aside {
                position: sticky;
                top: 24px;
            }
            .lux-profile-card {
                background: var(--paper);
                border: 1px solid var(--line);
                border-radius: 18px;
                padding: 28px 22px;
                box-shadow: 0 1px 0 rgba(20,20,15,.03), 0 8px 24px rgba(30,28,20,.06);
                text-align: center;
            }

            .lux-avatar-wrap {
                position: relative;
                width: 88px;
                height: 88px;
                margin: 0 auto 16px;
            }
            .lux-avatar-img,
            .lux-avatar-placeholder {
                width: 100%;
                height: 100%;
                border-radius: 22px;
                display: grid;
                place-items: center;
                overflow: hidden;
                font-size: 32px;
                border: 3px solid var(--paper);
                box-shadow: 0 12px 28px rgba(20,20,15,.14);
            }
            .lux-avatar-img { object-fit: cover; }
            .lux-avatar-placeholder {
                background: linear-gradient(160deg, var(--gold-soft), var(--gold));
                color: var(--ink);
            }
            .lux-avatar-badge {
                position: absolute;
                right: -6px;
                bottom: -6px;
                width: 28px;
                height: 28px;
                border-radius: 9px;
                display: grid;
                place-items: center;
                background: var(--ink);
                color: var(--gold);
                font-size: 13px;
                border: 3px solid var(--paper);
            }

            .lux-profile-name {
                font-family: 'Fraunces', serif;
                font-size: 20px;
                font-weight: 600;
                color: var(--ink);
                margin: 0 0 8px;
                letter-spacing: -.5px;
                line-height: 1.2;
                word-break: break-word;
            }
            .lux-profile-type {
                display: inline-block;
                font-size: 9.5px;
                font-weight: 600;
                letter-spacing: 1.6px;
                padding: 5px 12px;
                border-radius: 999px;
                color: #a8802a;
                background: var(--gold-bg);
                border: 1px solid rgba(201,162,74,.2);
            }

            .lux-profile-meta {
                margin-top: 22px;
                padding-top: 20px;
                border-top: 1px solid var(--line);
                display: flex;
                flex-direction: column;
                gap: 12px;
                text-align: left;
            }
            .lux-meta-row {
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 11.5px;
                color: var(--ink-soft);
            }
            .lux-meta-row svg {
                color: var(--muted);
                font-size: 13px;
                flex-shrink: 0;
            }
            .lux-meta-row span {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .lux-profile-note {
                display: flex;
                align-items: flex-start;
                gap: 8px;
                margin-top: 20px;
                padding: 12px;
                border-radius: 10px;
                background: var(--paper-2);
                border: 1px solid var(--line);
                font-size: 10.5px;
                color: var(--muted);
                text-align: left;
                line-height: 1.5;
            }
            .lux-profile-note svg {
                color: var(--gold);
                flex-shrink: 0;
                font-size: 13px;
                margin-top: 1px;
            }

            /* Form main */
            .lux-form-main {
                display: flex;
                flex-direction: column;
                gap: 18px;
                min-width: 0;
            }

            .lux-card {
                background: var(--paper);
                border: 1px solid var(--line);
                border-radius: 18px;
                padding: 26px;
                box-shadow: 0 1px 0 rgba(20,20,15,.03), 0 8px 24px rgba(30,28,20,.06);
            }

            .lux-card-head {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 14px;
                margin-bottom: 22px;
                padding-bottom: 18px;
                border-bottom: 1px solid var(--line);
            }
            .lux-card-head h3 {
                font-family: 'Fraunces', Georgia, serif;
                font-size: 19px;
                font-weight: 600;
                margin: 6px 0 0;
                letter-spacing: -.5px;
                color: var(--ink);
            }
            .lux-hint {
                color: var(--muted);
                font-size: 10.5px;
                padding: 5px 10px;
                border: 1px solid var(--line);
                border-radius: 7px;
                background: var(--paper-2);
                white-space: nowrap;
            }

            /* Field grid */
            .lux-field-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 16px;
            }
            .lux-field {
                display: flex;
                flex-direction: column;
                gap: 7px;
                min-width: 0;
            }
            .lux-field-full { grid-column: 1 / -1; }

            .lux-field label {
                font-size: 11px;
                font-weight: 600;
                color: var(--ink-soft);
                letter-spacing: .2px;
                display: inline-flex;
                align-items: center;
            }
            .lux-req { color: var(--danger); margin-left: 2px; }

            .lux-field input,
            .lux-field select,
            .lux-field textarea {
                width: 100%;
                padding: 11px 14px;
                border: 1px solid var(--line);
                border-radius: 10px;
                font-size: 13px;
                font-family: inherit;
                background: var(--paper-2);
                color: var(--ink);
                outline: none;
                transition: all .2s ease;
            }
            .lux-field input:hover,
            .lux-field select:hover,
            .lux-field textarea:hover {
                border-color: var(--line-strong);
            }
            .lux-field input:focus,
            .lux-field select:focus,
            .lux-field textarea:focus {
                border-color: var(--ink);
                background: var(--paper);
                box-shadow: 0 0 0 3px rgba(20,20,15,.06);
            }
            .lux-field textarea {
                resize: vertical;
                min-height: 68px;
                line-height: 1.5;
            }
            .lux-field select { cursor: pointer; }

            /* Actions */
            .lux-actions {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                padding: 6px 0 0;
            }

            /* Footer */
            .lux-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                color: var(--muted);
                font-size: 11px;
                padding: 24px 4px 0;
                border-top: 1px solid var(--line);
                margin-top: 24px;
                letter-spacing: .2px;
            }

            /* Loading */
            .lux-loading-screen {
                width: 100%;
                min-height: 100vh;
                display: grid;
                place-items: center;
                padding: 24px;
            }
            .lux-loading-card {
                width: min(440px, 100%);
                padding: 42px 34px;
                background: var(--paper);
                border: 1px solid var(--line);
                border-radius: 20px;
                box-shadow: 0 24px 48px rgba(30,28,20,.08);
                text-align: center;
            }
            .lux-mark {
                width: 56px;
                height: 56px;
                margin: 0 auto 18px;
                border-radius: 14px;
                display: grid;
                place-items: center;
                font-size: 24px;
                background: linear-gradient(160deg, var(--gold-soft), var(--gold));
                color: var(--ink);
                box-shadow: 0 8px 22px rgba(201,162,74,.25);
            }
            .lux-spin {
                width: 24px;
                height: 24px;
                border: 2.5px solid var(--line);
                border-top-color: var(--ink);
                border-radius: 50%;
                animation: lux-spin .8s linear infinite;
                margin: 0 auto 18px;
            }
            @keyframes lux-spin { to { transform: rotate(360deg); } }
            .lux-loading-card h3 {
                font-family: 'Fraunces', serif;
                font-size: 18px;
                font-weight: 600;
                margin: 0 0 8px;
                color: var(--ink);
            }
            .lux-loading-card p {
                color: var(--muted);
                font-size: 12px;
                margin: 0;
                line-height: 1.6;
            }

            /* Responsive */
            @media (max-width: 1000px) {
                .lux-form-grid { grid-template-columns: 1fr; }
                .lux-profile-aside { position: static; }
                .lux-profile-card { text-align: center; }
                .lux-profile-meta { text-align: left; }
            }
            @media (max-width: 720px) {
                .lux-main { padding: 0 18px 24px; }
                .lux-topbar { min-height: 72px; }
                .lux-topbar-actions { width: 100%; }
                .lux-topbar-actions > * { flex: 1; }
                .lux-masthead-copy h1 { font-size: 26px; letter-spacing: -1px; }
                .lux-field-grid { grid-template-columns: 1fr; }
                .lux-card { padding: 20px; }
                .lux-actions { flex-direction: column-reverse; }
                .lux-actions > * { width: 100%; }
                .lux-footer { flex-direction: column; align-items: flex-start; gap: 8px; }
            }
        `}</style>
    );
}