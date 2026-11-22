import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const EMPTY_FORM = {
    supplier_name: "",
    company_name: "",
    supplier_phone: "",
    supplier_email: "",
    gst_number: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    notes: ""
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

.as-root {
    --ink: #10243b;
    --ink-soft: #51627a;
    --paper: #eef2f7;
    --card: #ffffff;
    --line: #d9e1ec;
    --brand: #0f766e;
    --brand-dark: #0b5a54;
    --brand-tint: #e3f4f1;
    --danger: #c0392b;
    --danger-tint: #fdecea;

    font-family: 'Manrope', system-ui, -apple-system, 'Segoe UI', sans-serif;
    background: var(--paper);
    color: var(--ink);
    min-height: 100vh;
    padding: 32px 24px 56px;
    box-sizing: border-box;
}

.as-root *,
.as-root *::before,
.as-root *::after {
    box-sizing: border-box;
}

.as-wrap {
    max-width: 1120px;
    margin: 0 auto;
}

.as-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 24px;
    flex-wrap: wrap;
}

.as-title {
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.02em;
    margin: 0;
}

.as-sub {
    margin: 4px 0 0;
    color: var(--ink-soft);
    font-size: 15px;
}

.as-back {
    background: transparent;
    border: 1px solid var(--line);
    color: var(--ink);
    padding: 10px 16px;
    border-radius: 10px;
    font: inherit;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
}

.as-back:hover {
    background: var(--card);
}

.as-grid {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 24px;
    align-items: start;
}

/* Supplier Preview */

.as-preview {
    position: sticky;
    top: 24px;
    background: var(--ink);
    color: #fff;
    border-radius: 20px;
    padding: 24px;
    overflow: hidden;
}

.as-preview::after {
    content: "";
    position: absolute;
    right: -60px;
    top: -60px;
    width: 180px;
    height: 180px;
    border-radius: 50%;
    background: rgba(15, 118, 110, 0.35);
}

.as-avatar {
    position: relative;
    z-index: 1;
    width: 56px;
    height: 56px;
    border-radius: 16px;
    background: var(--brand);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    font-weight: 800;
    margin-bottom: 18px;
}

.as-pname {
    position: relative;
    z-index: 1;
    font-size: 20px;
    font-weight: 700;
    margin: 0;
    word-break: break-word;
}

.as-pcompany {
    position: relative;
    z-index: 1;
    margin: 2px 0 0;
    color: #a9b8cc;
    font-size: 14px;
    min-height: 20px;
    word-break: break-word;
}

.as-prows {
    position: relative;
    z-index: 1;
    margin-top: 20px;
    display: grid;
    gap: 12px;
}

.as-prow {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-size: 14px;
    border-top: 1px solid rgba(255,255,255,0.12);
    padding-top: 12px;
}

.as-prow span:first-child {
    color: #a9b8cc;
    flex-shrink: 0;
}

.as-prow span:last-child {
    font-weight: 600;
    text-align: right;
    word-break: break-word;
}

/* Form */

.as-form {
    display: grid;
    gap: 20px;
}

.as-section {
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 18px;
    padding: 24px;
}

.as-section h3 {
    margin: 0 0 4px;
    font-size: 17px;
    font-weight: 700;
}

.as-section p.hint {
    margin: 0 0 20px;
    color: var(--ink-soft);
    font-size: 14px;
}

.as-fields {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
}

.as-full {
    grid-column: 1 / -1;
}

.as-field label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 6px;
}

.as-field label .opt {
    color: var(--ink-soft);
    font-weight: 500;
}

.as-input {
    width: 100%;
    padding: 12px 14px;
    font: inherit;
    font-size: 15px;
    color: var(--ink);
    background: #fff;
    border: 1.5px solid var(--line);
    border-radius: 10px;
    outline: none;
    transition: border-color .15s, box-shadow .15s;
}

.as-input::placeholder {
    color: #98a6ba;
}

.as-input:hover {
    border-color: #b8c4d6;
}

.as-input:focus {
    border-color: var(--brand);
    box-shadow: 0 0 0 3px rgba(15,118,110,0.18);
}

.as-input.bad {
    border-color: var(--danger);
}

.as-input.bad:focus {
    box-shadow: 0 0 0 3px rgba(192,57,43,0.16);
}

textarea.as-input {
    resize: vertical;
    line-height: 1.5;
}

.as-err {
    margin: 6px 0 0;
    font-size: 13px;
    color: var(--danger);
}

.as-help {
    margin: 6px 0 0;
    font-size: 13px;
    color: var(--ink-soft);
}

.as-banner {
    background: var(--danger-tint);
    color: var(--danger);
    border: 1px solid #f3c3bd;
    padding: 12px 16px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
}

.as-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    flex-wrap: wrap;
}

.as-btn {
    padding: 13px 24px;
    border-radius: 10px;
    font: inherit;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    border: 1.5px solid transparent;
    transition: background .15s, border-color .15s;
}

.as-btn.ghost {
    background: transparent;
    border-color: var(--line);
    color: var(--ink);
}

.as-btn.ghost:hover {
    background: var(--card);
    border-color: #b8c4d6;
}

.as-btn.primary {
    background: var(--brand);
    color: #fff;
    min-width: 160px;
}

.as-btn.primary:hover:not(:disabled) {
    background: var(--brand-dark);
}

.as-btn:disabled {
    opacity: .65;
    cursor: not-allowed;
}

.as-btn:focus-visible,
.as-back:focus-visible {
    outline: 3px solid rgba(15,118,110,0.4);
    outline-offset: 2px;
}

@media (max-width: 900px) {
    .as-grid {
        grid-template-columns: 1fr;
    }

    .as-preview {
        position: relative;
        top: 0;
    }
}

@media (max-width: 560px) {
    .as-root {
        padding: 20px 14px 40px;
    }

    .as-fields {
        grid-template-columns: 1fr;
    }

    .as-section {
        padding: 18px;
    }

    .as-title {
        font-size: 24px;
    }

    .as-actions .as-btn {
        flex: 1;
    }
}

@media (prefers-reduced-motion: reduce) {
    .as-input,
    .as-btn {
        transition: none;
    }
}
`;

function Field({ label, optional, error, help, full, children }) {
    return (
        <div className={`as-field${full ? " as-full" : ""}`}>
            <label>
                {label}
                {optional && <span className="opt"> (optional)</span>}
            </label>

            {children}

            {error ? (
                <p className="as-err">{error}</p>
            ) : help ? (
                <p className="as-help">{help}</p>
            ) : null}
        </div>
    );
}

export default function AddSupplier() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [touched, setTouched] = useState({});
    const [submitError, setSubmitError] = useState("");

    // Handle input changes
    const handleChange = (e) => {
        let { name, value } = e.target;

        if (name === "supplier_phone") {
            value = value.replace(/[^\d+\s-]/g, "");
        }

        if (name === "pincode") {
            value = value.replace(/\D/g, "").slice(0, 6);
        }

        setForm((prev) => ({
            ...prev,
            [name]: value
        }));

        setSubmitError("");
    };

    // Handle field blur
    const handleBlur = (e) => {
        setTouched((prev) => ({
            ...prev,
            [e.target.name]: true
        }));
    };

    // Auto-fill city and state using PIN code
    const handlePincodeBlur = async (e) => {
        handleBlur(e);

        const pin = form.pincode;

        if (pin.length !== 6 || (form.city && form.state)) {
            return;
        }

        try {
            const res = await fetch(
                `https://api.postalpincode.in/pincode/${pin}`
            );

            const data = await res.json();
            const office = data?.[0]?.PostOffice?.[0];

            if (office) {
                setForm((prev) => ({
                    ...prev,
                    city: prev.city || office.District || "",
                    state: prev.state || office.State || ""
                }));
            }
        } catch (err) {
            // Auto-fill is only a convenience
        }
    };

    // Validation
    const errors = useMemo(() => {
        const e = {};

        if (!form.supplier_name.trim()) {
            e.supplier_name = "Enter the supplier's name.";
        }

        const digits = form.supplier_phone.replace(/\D/g, "");

        if (!form.supplier_phone.trim()) {
            e.supplier_phone = "Enter a phone number.";
        } else if (digits.length < 10 || digits.length > 13) {
            e.supplier_phone = "Enter a valid phone number.";
        }

        if (
            form.supplier_email &&
            !/^\S+@\S+\.\S+$/.test(form.supplier_email)
        ) {
            e.supplier_email =
                "Enter a valid email, like name@example.com.";
        }

        if (form.pincode && form.pincode.length !== 6) {
            e.pincode = "Pincode must be 6 digits.";
        }

        return e;
    }, [form]);

    const show = (name) => touched[name] ? errors[name] : undefined;

    const cls = (name) => `as-input${show(name) ? " bad" : ""}`;

    // Submit supplier
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (Object.keys(errors).length > 0) {
            setTouched(
                Object.keys(EMPTY_FORM).reduce(
                    (acc, key) => ({
                        ...acc,
                        [key]: true
                    }),
                    {}
                )
            );

            setSubmitError("Fix the highlighted fields and try again.");
            return;
        }

        try {
            setLoading(true);
            setSubmitError("");

            // Opening balance removed
            await API.post("/suppliers", {
                ...form
            });

            navigate("/suppliers");
        } catch (err) {
            console.error(err);

            setSubmitError(
                err.response?.data?.message ||
                "Could not add the supplier. Check your connection and try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const initial = (
        form.supplier_name.trim()[0] || "S"
    ).toUpperCase();

    const location = [form.city, form.state]
        .filter(Boolean)
        .join(", ");

    return (
        <div className="as-root">
            <style>{css}</style>

            <div className="as-wrap">

                {/* Header */}
                <div className="as-head">
                    <div>
                        <h2 className="as-title">
                            Add supplier
                        </h2>

                        <p className="as-sub">
                            Save who you buy from, so purchases and payments
                            stay in one place.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="as-back"
                        onClick={() => navigate("/suppliers")}
                    >
                        Back to suppliers
                    </button>
                </div>

                <div className="as-grid">

                    {/* Supplier Preview */}
                    <aside
                        className="as-preview"
                        aria-label="Supplier preview"
                    >
                        <div className="as-avatar">
                            {initial}
                        </div>

                        <p className="as-pname">
                            {form.supplier_name || "New supplier"}
                        </p>

                        <p className="as-pcompany">
                            {form.company_name}
                        </p>

                        <div className="as-prows">

                            <div className="as-prow">
                                <span>Phone</span>
                                <span>
                                    {form.supplier_phone || "Not added"}
                                </span>
                            </div>

                            <div className="as-prow">
                                <span>Email</span>
                                <span>
                                    {form.supplier_email || "Not added"}
                                </span>
                            </div>

                            <div className="as-prow">
                                <span>GST</span>
                                <span>
                                    {form.gst_number || "Not added"}
                                </span>
                            </div>

                            <div className="as-prow">
                                <span>Location</span>
                                <span>
                                    {location || "Not added"}
                                </span>
                            </div>

                        </div>
                    </aside>

                    {/* Form */}
                    <form
                        className="as-form"
                        onSubmit={handleSubmit}
                        noValidate
                    >

                        {submitError && (
                            <div
                                className="as-banner"
                                role="alert"
                            >
                                {submitError}
                            </div>
                        )}

                        {/* Contact Details */}
                        <section className="as-section">
                            <h3>Contact details</h3>

                            <p className="hint">
                                Who you deal with and how to reach them.
                            </p>

                            <div className="as-fields">

                                <Field
                                    label="Supplier name *"
                                    error={show("supplier_name")}
                                >
                                    <input
                                        className={cls("supplier_name")}
                                        type="text"
                                        name="supplier_name"
                                        value={form.supplier_name}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        placeholder="e.g. Ramesh Kumar"
                                        autoComplete="off"
                                    />
                                </Field>

                                <Field
                                    label="Company name"
                                    optional
                                >
                                    <input
                                        className="as-input"
                                        type="text"
                                        name="company_name"
                                        value={form.company_name}
                                        onChange={handleChange}
                                        placeholder="e.g. Sri Lakshmi Traders"
                                        autoComplete="off"
                                    />
                                </Field>

                                <Field
                                    label="Phone *"
                                    error={show("supplier_phone")}
                                >
                                    <input
                                        className={cls("supplier_phone")}
                                        type="tel"
                                        name="supplier_phone"
                                        value={form.supplier_phone}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        placeholder="98765 43210"
                                        inputMode="tel"
                                    />
                                </Field>

                                <Field
                                    label="Email"
                                    optional
                                    error={show("supplier_email")}
                                >
                                    <input
                                        className={cls("supplier_email")}
                                        type="email"
                                        name="supplier_email"
                                        value={form.supplier_email}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        placeholder="name@example.com"
                                    />
                                </Field>

                            </div>
                        </section>

                        {/* Address */}
                        <section className="as-section">
                            <h3>Address</h3>

                            <p className="hint">
                                Enter the pincode and we will fill in
                                the city and state.
                            </p>

                            <div className="as-fields">

                                <Field
                                    label="Full address"
                                    optional
                                    full
                                >
                                    <textarea
                                        className="as-input"
                                        name="address"
                                        value={form.address}
                                        onChange={handleChange}
                                        rows="3"
                                        placeholder="Shop or building, street, area"
                                    />
                                </Field>

                                <Field
                                    label="Pincode"
                                    optional
                                    error={show("pincode")}
                                >
                                    <input
                                        className={cls("pincode")}
                                        type="text"
                                        name="pincode"
                                        value={form.pincode}
                                        onChange={handleChange}
                                        onBlur={handlePincodeBlur}
                                        placeholder="560001"
                                        inputMode="numeric"
                                    />
                                </Field>

                                <Field
                                    label="City"
                                    optional
                                >
                                    <input
                                        className="as-input"
                                        type="text"
                                        name="city"
                                        value={form.city}
                                        onChange={handleChange}
                                        placeholder="Bengaluru"
                                    />
                                </Field>

                                <Field
                                    label="State"
                                    optional
                                    full
                                >
                                    <input
                                        className="as-input"
                                        type="text"
                                        name="state"
                                        value={form.state}
                                        onChange={handleChange}
                                        placeholder="Karnataka"
                                    />
                                </Field>

                            </div>
                        </section>

                        {/* Tax Details */}
                        <section className="as-section">
                            <h3>Tax details</h3>

                            <p className="hint">
                                Add GST details for tax-related purchases.
                            </p>

                            <div className="as-fields">

                                <Field
                                    label="GST number"
                                    optional
                                >
                                    <input
                                        className="as-input"
                                        type="text"
                                        name="gst_number"
                                        value={form.gst_number}
                                        onChange={handleChange}
                                        placeholder="Enter GST number"
                                        autoComplete="off"
                                    />
                                </Field>

                                <Field
                                    label="Notes"
                                    optional
                                    full
                                >
                                    <textarea
                                        className="as-input"
                                        name="notes"
                                        value={form.notes}
                                        onChange={handleChange}
                                        rows="3"
                                        placeholder="Delivery days, payment terms, items they supply"
                                    />
                                </Field>

                            </div>
                        </section>

                        {/* Actions */}
                        <div className="as-actions">

                            <button
                                type="button"
                                className="as-btn ghost"
                                onClick={() => navigate("/suppliers")}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="as-btn primary"
                                disabled={loading}
                            >
                                {loading
                                    ? "Saving..."
                                    : "Save supplier"}
                            </button>

                        </div>

                    </form>

                </div>

            </div>
        </div>
    );
}