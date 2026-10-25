
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const types = [
  ["grocery", "🛒 Grocery Store"],
  ["medical", "💊 Medical Shop"],
  ["restaurant", "🍽️ Restaurant"],
  ["clothing", "👕 Clothing Store"],
  ["mobile", "📱 Mobile Shop"],
  ["electronics", "💻 Electronics"],
  ["hardware", "🔧 Hardware"],
  ["bakery", "🥐 Bakery"],
  ["supermarket", "🏪 Supermarket"],
  ["pharmacy", "🩺 Pharmacy"],
  ["salon", "✂️ Salon"],
  ["hotel", "🏨 Hotel"],
  ["factory", "🏭 Factory"],
  ["other", "🏢 Other Business"],
];

const initialForm = {
  owner_id: localStorage.getItem("userId") || 1,
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
  logo: "",
};

const styles = `
* { box-sizing: border-box; }

.cb-page {
  min-height: 100vh;
  padding: 24px;
  background: #f4f6fb;
  color: #19243a;
  font-family: Inter, "Segoe UI", Arial, sans-serif;
}

.cb-topbar {
  max-width: 1250px;
  margin: 0 auto 24px;
  display: flex;
  align-items: center;
  gap: 14px;
}

.cb-back {
  width: 42px;
  height: 42px;
  border: 1px solid #e1e6ef;
  background: white;
  border-radius: 12px;
  cursor: pointer;
  font-size: 22px;
}

.cb-brand {
  display: flex;
  align-items: center;
  gap: 11px;
  margin-right: auto;
}

.cb-logo {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  color: white;
  font-size: 23px;
  font-weight: 800;
  border-radius: 14px;
  background: linear-gradient(135deg,#4f46e5,#8b5cf6);
  box-shadow: 0 5px 15px #4f46e533;
}

.cb-brand strong, .cb-brand small { display: block; }
.cb-brand strong { font-size: 17px; }
.cb-brand small { margin-top: 4px; color: #8993a7; font-size: 12px; }

.cb-status {
  padding: 10px 15px;
  background: white;
  border: 1px solid #e4e8f0;
  border-radius: 30px;
  color: #475569;
  font-size: 12px;
}

.cb-status span { color: #16a34a; margin-right: 7px; }

.cb-layout {
  max-width: 1250px;
  margin: auto;
  display: grid;
  grid-template-columns: minmax(260px, .75fr) minmax(0, 1.65fr);
  background: white;
  border: 1px solid #e7eaf2;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 18px 60px #2538580c;
}

.cb-sidebar {
  position: relative;
  overflow: hidden;
  padding: 45px 30px 28px;
  color: white;
  background:
    radial-gradient(ellipse at 20% 5%, #6366f155, transparent 48%),
    linear-gradient(155deg,#171f3c,#242e54 60%,#37308a);
}

.cb-sidebar:after {
  content: "";
  position: absolute;
  width: 310px;
  height: 310px;
  right: -220px;
  bottom: 20%;
  border: 1px solid #ffffff20;
  border-radius: 50%;
  box-shadow: 0 0 0 35px #ffffff08, 0 0 0 70px #ffffff05;
  pointer-events: none;
}

.cb-eyebrow {
  display: inline-block;
  padding: 8px 12px;
  border: 1px solid #ffffff25;
  background: #ffffff0c;
  color: #c7d2fe;
  border-radius: 30px;
  letter-spacing: 1.7px;
  font-size: 10px;
  font-weight: 800;
}

.cb-sidebar h1 {
  margin: 29px 0 16px;
  font-size: clamp(30px,3.4vw,44px);
  letter-spacing: -1.8px;
  line-height: 1.15;
}

.cb-sidebar h1 span { color: #a5b4fc; }

.cb-description {
  color: #c3cbe0;
  font-size: 13px;
  line-height: 1.9;
}

.cb-features {
  display: grid;
  gap: 23px;
  margin-top: 38px;
}

.cb-feature {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.cb-check {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 29px;
  height: 29px;
  color: #c7d2fe;
  background: #818cf829;
  border: 1px solid #a5b4fc30;
  border-radius: 9px;
}

.cb-feature strong, .cb-feature small { display: block; }
.cb-feature strong { font-size: 13px; margin: 3px 0 5px; }
.cb-feature small { color: #b6c0d8; font-size: 11px; line-height: 1.6; }

.cb-sidebar-footer {
  position: relative;
  z-index: 1;
  margin-top: 45px;
  padding-top: 22px;
  border-top: 1px solid #ffffff20;
  color: #bdc7df;
  font-size: 11px;
  line-height: 1.8;
}

.cb-form {
  min-width: 0;
  padding: 40px clamp(20px,4vw,52px) 28px;
}

.cb-step {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #818aa0;
  font-size: 10px;
  letter-spacing: 1.5px;
  font-weight: 800;
}

.cb-step span {
  display: grid;
  place-items: center;
  width: 29px;
  height: 29px;
  color: #4f46e5;
  background: #eef2ff;
  border-radius: 9px;
  letter-spacing: 0;
}

.cb-heading h2 {
  margin: 20px 0 9px;
  font-size: clamp(25px,3vw,33px);
  letter-spacing: -1.1px;
}

.cb-heading p {
  margin: 0;
  color: #7c879b;
  font-size: 13px;
  line-height: 1.7;
}

.cb-section { margin-top: 34px; }

.cb-section-heading {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 21px;
}

.cb-section-number {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  background: #f0efff;
  color: #4f46e5;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 800;
}

.cb-section-heading h3 { margin: 2px 0 5px; font-size: 15px; }
.cb-section-heading p { margin: 0; color: #8b95a8; font-size: 12px; line-height: 1.6; }

.cb-grid {
  display: grid;
  grid-template-columns: repeat(2,minmax(0,1fr));
  gap: 19px 17px;
}

.cb-field { min-width: 0; }
.cb-field label {
  display: block;
  margin-bottom: 9px;
  color: #39445a;
  font-size: 12px;
  font-weight: 700;
}

.cb-required { color: #e5484d; }

.cb-control { position: relative; }

.cb-icon {
  position: absolute;
  top: 50%;
  left: 13px;
  transform: translateY(-50%);
  color: #8b94a9;
  font-size: 14px;
  pointer-events: none;
}

.cb-control input, .cb-control select {
  padding-left: 38px !important;
}

.cb-field input, .cb-field select, .cb-field textarea {
  display: block;
  width: 100%;
  min-width: 0;
  padding: 13px 14px;
  border: 1px solid #e1e6ef;
  border-radius: 11px;
  background: #fbfcfe;
  color: #263248;
  outline: none;
  font: inherit;
  font-size: 12px;
  line-height: 1.5;
  transition: border-color .2s,box-shadow .2s,background .2s;
}

.cb-field input::placeholder, .cb-field textarea::placeholder { color: #a3abba; }

.cb-field input:focus, .cb-field select:focus, .cb-field textarea:focus {
  background: white;
  border-color: #818cf8;
  box-shadow: 0 0 0 4px #6366f116;
}

.cb-field textarea { resize: vertical; min-height: 88px; }
.cb-full { grid-column: 1 / -1; }
.cb-hint { display: block; margin-top: 7px; color: #8b95a8; font-size: 11px; }

.cb-divider { height: 1px; margin-top: 31px; background: #edf0f5; }

.cb-alert {
  display: flex;
  gap: 10px;
  padding: 13px;
  margin-top: 20px;
  border-radius: 11px;
  font-size: 12px;
  line-height: 1.7;
  overflow-wrap: anywhere;
}

.cb-alert p { margin: 0; }
.cb-error { color: #a1262d; background: #fff1f2; border: 1px solid #fecdd3; }
.cb-success { color: #166534; background: #f0fdf4; border: 1px solid #bbf7d0; }

.cb-submit-area {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 18px;
  margin-top: 33px;
  padding-top: 23px;
  border-top: 1px solid #edf0f5;
}

.cb-submit-area p {
  max-width: 240px;
  margin: 0;
  color: #7b8598;
  font-size: 11px;
  line-height: 1.8;
}

.cb-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  min-height: 47px;
  padding: 0 22px;
  border: none;
  border-radius: 11px;
  background: linear-gradient(110deg,#4f46e5,#6366f1);
  color: white;
  font-size: 12px;
  font-weight: 750;
  cursor: pointer;
  box-shadow: 0 6px 16px #4f46e52a;
  transition: transform .2s,box-shadow .2s,opacity .2s;
}

.cb-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 9px 22px #4f46e53b;
}

.cb-submit:disabled { opacity: .7; cursor: not-allowed; }

.cb-spinner {
  width: 15px;
  height: 15px;
  border: 2px solid #ffffff70;
  border-top-color: white;
  border-radius: 50%;
  animation: cb-spin .7s linear infinite;
}

@keyframes cb-spin { to { transform: rotate(360deg); } }

.cb-bottom {
  margin: 23px 0 0;
  text-align: center;
  color: #9aa3b3;
  font-size: 10px;
  line-height: 1.7;
}

@media(max-width:900px) {
  .cb-layout { grid-template-columns: 1fr; }
  .cb-sidebar { padding: 32px 27px; }
  .cb-sidebar h1 { margin-top: 23px; }
  .cb-features { grid-template-columns: repeat(3,minmax(0,1fr)); gap: 13px; margin-top: 26px; }
  .cb-feature { flex-direction: column; gap: 8px; }
  .cb-sidebar-footer { margin-top: 28px; }
  .cb-form { padding: 32px 27px 25px; }
}

@media(max-width:560px) {
  .cb-page { padding: 12px; }
  .cb-topbar { gap: 9px; margin-bottom: 14px; }
  .cb-brand { gap: 8px; }
  .cb-logo { width: 38px; height: 38px; }
  .cb-brand strong { font-size: 15px; }
  .cb-brand small { font-size: 10px; }
  .cb-status { padding: 8px 10px; font-size: 10px; }
  .cb-layout { border-radius: 17px; }
  .cb-sidebar { padding: 27px 21px; }
  .cb-sidebar h1 { font-size: 32px; }
  .cb-features { grid-template-columns: 1fr; gap: 16px; }
  .cb-feature { flex-direction: row; gap: 11px; }
  .cb-sidebar-footer { margin-top: 25px; }
  .cb-form { padding: 27px 19px 22px; }
  .cb-grid { grid-template-columns: 1fr; gap: 17px; }
  .cb-full { grid-column: auto; }
  .cb-section { margin-top: 29px; }
  .cb-submit-area { align-items: stretch; flex-direction: column; }
  .cb-submit-area p { max-width: none; }
  .cb-submit { width: 100%; min-height: 49px; }
}
`;

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  icon,
  type = "text",
  required = false,
  autoComplete,
}) {
  return (
    <div className="cb-field">
      <label htmlFor={name}>
        {label}
        {required && <span className="cb-required"> *</span>}
      </label>
      <div className="cb-control">
        {icon && <span className="cb-icon">{icon}</span>}
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
        />
      </div>
    </div>
  );
}

export default function CreateBusiness() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        ...form,
        owner_id: Number(form.owner_id),
        business_name: form.business_name.trim(),
        owner_name: form.owner_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        gst_number: form.gst_number.trim(),
        upi_id: form.upi_id.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        logo: form.logo.trim(),
      };

      const res = await API.post("/business/create", payload);
      const business = res.data?.business;

      if (!business?.id) {
        throw new Error(
          "The server did not return a business ID. Check the server response before submitting again."
        );
      }

      localStorage.setItem("businessId", String(business.id));
      localStorage.setItem(
        "businessName",
        business.business_name || payload.business_name
      );
      localStorage.setItem(
        "businessType",
        business.business_type || payload.business_type
      );

      setSuccess("Business created successfully!");

      setTimeout(() => navigate("/dashboard"), 600);
    } catch (err) {
      console.error("Create business error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to create business. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>

      <main className="cb-page">
        <header className="cb-topbar">
          <button
            className="cb-back"
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            ←
          </button>

          <div className="cb-brand">
            <div className="cb-logo">N</div>
            <div>
              <strong>Nepxall</strong>
              <small>Business workspace</small>
            </div>
          </div>

          <div className="cb-status">
            <span>●</span> Business setup
          </div>
        </header>

        <div className="cb-layout">
          <aside className="cb-sidebar">
            <span className="cb-eyebrow">GET STARTED</span>

            <h1>
              Your business.
              <br />
              <span>Your control.</span>
            </h1>

            <p className="cb-description">
              Bring your business operations together in one place.
              Create your profile to get started with billing,
              inventory, and business management.
            </p>

            <div className="cb-features">
              <div className="cb-feature">
                <span className="cb-check">✓</span>
                <div>
                  <strong>Smart billing</strong>
                  <small>Manage sales and invoices</small>
                </div>
              </div>

              <div className="cb-feature">
                <span className="cb-check">✓</span>
                <div>
                  <strong>Product inventory</strong>
                  <small>Organize products and stock</small>
                </div>
              </div>

              <div className="cb-feature">
                <span className="cb-check">✓</span>
                <div>
                  <strong>Business insights</strong>
                  <small>Monitor your operations</small>
                </div>
              </div>
            </div>

            <div className="cb-sidebar-footer">
              N &nbsp; Built for your next stage of growth.
            </div>
          </aside>

          <section className="cb-form">
            <div className="cb-heading">
              <div className="cb-step">
                <span>01</span> BUSINESS SETUP
              </div>
              <h2>Create your business</h2>
              <p>
                Enter your details to configure your business workspace.
              </p>
            </div>

            {error && (
              <div className="cb-alert cb-error" role="alert">
                <strong>!</strong>
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div className="cb-alert cb-success" role="status">
                <strong>✓</strong>
                <p>{success} Redirecting to dashboard...</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <section className="cb-section">
                <div className="cb-section-heading">
                  <span className="cb-section-number">01</span>
                  <div>
                    <h3>Basic information</h3>
                    <p>Tell us about your business.</p>
                  </div>
                </div>

                <div className="cb-grid">
                  <Field
                    label="Business name"
                    name="business_name"
                    value={form.business_name}
                    onChange={handleChange}
                    placeholder="e.g. Sri Lakshmi Stores"
                    icon="▤"
                    required
                    autoComplete="organization"
                  />

                  <div className="cb-field">
                    <label htmlFor="business_type">
                      Business type<span className="cb-required"> *</span>
                    </label>
                    <div className="cb-control">
                      <span className="cb-icon">▦</span>
                      <select
                        id="business_type"
                        name="business_type"
                        value={form.business_type}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Choose a category</option>
                        {types.map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <Field
                    label="Owner name"
                    name="owner_name"
                    value={form.owner_name}
                    onChange={handleChange}
                    placeholder="Full name"
                    icon="♙"
                    autoComplete="name"
                  />

                  <Field
                    label="Phone number"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    icon="☎"
                    type="tel"
                    autoComplete="tel"
                  />

                  <Field
                    label="Business email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@company.com"
                    icon="@"
                    type="email"
                    autoComplete="email"
                  />

                  <Field
                    label="GST number"
                    name="gst_number"
                    value={form.gst_number}
                    onChange={handleChange}
                    placeholder="GSTIN (optional)"
                    icon="▣"
                  />
                </div>
              </section>

              <div className="cb-divider" />

              <section className="cb-section">
                <div className="cb-section-heading">
                  <span className="cb-section-number">02</span>
                  <div>
                    <h3>Payments and location</h3>
                    <p>Configure your payment and address details.</p>
                  </div>
                </div>

                <div className="cb-grid">
                  <Field
                    label="UPI ID"
                    name="upi_id"
                    value={form.upi_id}
                    onChange={handleChange}
                    placeholder="yourname@bank"
                    icon="₹"
                  />

                  <Field
                    label="City"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="Your city"
                    icon="⌖"
                    autoComplete="address-level2"
                  />

                  <Field
                    label="State"
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    placeholder="Your state"
                    icon="⌖"
                    autoComplete="address-level1"
                  />

                  <Field
                    label="Pincode"
                    name="pincode"
                    value={form.pincode}
                    onChange={handleChange}
                    placeholder="6-digit pincode"
                    icon="#"
                    autoComplete="postal-code"
                  />

                  <div className="cb-field cb-full">
                    <label htmlFor="address">Business address</label>
                    <textarea
                      id="address"
                      name="address"
                      rows="3"
                      value={form.address}
                      onChange={handleChange}
                      placeholder="Building, street, area and landmark"
                      autoComplete="street-address"
                    />
                  </div>

                  <div className="cb-field cb-full">
                    <label htmlFor="logo">Business logo URL</label>
                    <div className="cb-control">
                      <span className="cb-icon">▧</span>
                      <input
                        id="logo"
                        name="logo"
                        type="url"
                        value={form.logo}
                        onChange={handleChange}
                        placeholder="https://example.com/logo.png (optional)"
                      />
                    </div>
                    <small className="cb-hint">
                      You can add a logo URL later if you prefer.
                    </small>
                  </div>
                </div>
              </section>

              <div className="cb-submit-area">
                <p>
                  🔒 Your information will be sent through your
                  configured API connection.
                </p>

                <button
                  className="cb-submit"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="cb-spinner" />
                      Creating business...
                    </>
                  ) : (
                    <>
                      Create business <span>→</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            <p className="cb-bottom">
              Complete your details accurately before continuing.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
