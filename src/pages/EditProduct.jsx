import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../services/api";

const UNITS = [
    { value: "pcs", label: "Pieces" },
    { value: "kg", label: "Kilogram" },
    { value: "g", label: "Gram" },
    { value: "ml", label: "Milliliter" },
    { value: "l", label: "Liter" },
    { value: "pack", label: "Pack" },
    { value: "box", label: "Box" },
    { value: "bottle", label: "Bottle" },
    { value: "dozen", label: "Dozen" },
    { value: "meter", label: "Meter" },
    { value: "feet", label: "Feet" }
];

const FALLBACK_CATEGORIES = [
    { id: "electronics", name: "Electronics" },
    { id: "clothing", name: "Clothing" },
    { id: "food", name: "Food" },
    { id: "medicine", name: "Medicine" },
    { id: "grocery", name: "Grocery" },
    { id: "restaurant", name: "Restaurant" },
    { id: "medical", name: "Medical" },
    { id: "other", name: "Other" }
];

const inr = (n) =>
    "₹" +
    Number(n).toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });

const isBlank = (v) => v === "" || v === null || v === undefined;

export default function EditProduct() {
    const { id } = useParams();
    const navigate = useNavigate();
    const redirectTimer = useRef(null);

    const [pageLoading, setPageLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [errors, setErrors] = useState({});
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [imageFailed, setImageFailed] = useState(false);

    const [form, setForm] = useState({
        category: "",
        product_name: "",
        product_code: "",
        barcode: "",
        purchase_price: "",
        selling_price: "",
        price_per: 1,
        price_unit: "pcs",
        stock: "",
        stock_unit: "pcs",
        min_stock: 5,
        image: "",
        description: "",
        expiry_date: "",
        status: "active"
    });

    useEffect(() => {
        loadProduct();
        loadCategories();
        return () => clearTimeout(redirectTimer.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    useEffect(() => {
        setImageFailed(false);
    }, [form.image]);

    const loadCategories = async () => {
        setLoadingCategories(true);
        try {
            const res = await API.get("/categories");
            setCategories(res.data.data || []);
        } catch (err) {
            console.error("Error loading categories:", err);
            setCategories(FALLBACK_CATEGORIES);
        } finally {
            setLoadingCategories(false);
        }
    };

    const loadProduct = async () => {
        setPageLoading(true);
        try {
            const res = await API.get(`/products/${id}`);
            const product = res.data.data;

            let expiryDate = "";
            if (product.expiry_date) {
                expiryDate = new Date(product.expiry_date)
                    .toISOString()
                    .split("T")[0];
            }

            setForm({
                category: product.category || "",
                product_name: product.product_name || "",
                product_code: product.product_code || "",
                barcode: product.barcode || "",
                purchase_price: product.purchase_price ?? "",
                selling_price: product.selling_price ?? "",
                price_per: product.price_per ?? 1,
                price_unit: product.price_unit || "pcs",
                stock: product.stock ?? "",
                stock_unit: product.unit || "pcs",
                min_stock: product.min_stock ?? 5,
                image: product.image || "",
                description: product.description || "",
                expiry_date: expiryDate,
                status: product.status || "active"
            });
            setMessage("");
        } catch (err) {
            console.error("Error loading product:", err);
            setMessage("Couldn't load this product. Taking you back to your products.");
            setMessageType("error");
            redirectTimer.current = setTimeout(() => navigate("/products"), 2000);
        } finally {
            setPageLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[name];
                return next;
            });
        }
    };

    const validate = () => {
        const next = {};
        if (!form.product_name.trim()) next.product_name = "Enter a product name";
        if (!form.category) next.category = "Choose a category";
        if (isBlank(form.purchase_price)) next.purchase_price = "Enter the purchase price";
        if (isBlank(form.selling_price)) next.selling_price = "Enter the selling price";
        if (isBlank(form.stock)) next.stock = "Enter the stock quantity";
        if (isBlank(form.price_per) || Number(form.price_per) <= 0)
            next.price_per = "Must be greater than 0";
        if (!form.price_unit) next.price_unit = "Choose a unit";
        return next;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setMessageType("");

        const found = validate();
        setErrors(found);
        if (Object.keys(found).length > 0) {
            setMessage("Some fields need your attention before you can save.");
            setMessageType("error");
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        setSaving(true);
        try {
            const submitData = {
                category: form.category,
                product_name: form.product_name,
                product_code: form.product_code,
                barcode: form.barcode,
                purchase_price: parseFloat(form.purchase_price),
                selling_price: parseFloat(form.selling_price),
                price_per: parseInt(form.price_per),
                price_unit: form.price_unit,
                stock: parseFloat(form.stock),
                unit: form.stock_unit,
                min_stock: parseInt(form.min_stock) || 0,
                image: form.image,
                description: form.description,
                expiry_date: form.expiry_date || null,
                status: form.status
            };

            await API.put(`/products/${id}`, submitData);

            setMessage("Product updated. Taking you back to your products.");
            setMessageType("success");
            redirectTimer.current = setTimeout(() => navigate("/products"), 1800);
        } catch (err) {
            console.error("Error updating product:", err);
            setMessage(
                err.response?.data?.message ||
                    "Couldn't update the product. Check your connection and try again."
            );
            setMessageType("error");
            window.scrollTo({ top: 0, behavior: "smooth" });
        } finally {
            setSaving(false);
        }
    };

    /* ---------- Derived values for the live summary ---------- */

    const margin = useMemo(() => {
        const p = parseFloat(form.purchase_price);
        const s = parseFloat(form.selling_price);
        if (!isFinite(p) || !isFinite(s) || s <= 0) return null;
        const profit = s - p;
        return { profit, percent: (profit / s) * 100 };
    }, [form.purchase_price, form.selling_price]);

    const stockState = useMemo(() => {
        if (isBlank(form.stock)) return null;
        const stock = parseFloat(form.stock);
        const min = parseFloat(form.min_stock) || 0;
        if (stock <= 0) return { tone: "bad", text: "Out of stock" };
        if (stock <= min) return { tone: "warn", text: "Low stock" };
        return { tone: "good", text: "In stock" };
    }, [form.stock, form.min_stock]);

    const expiryState = useMemo(() => {
        if (!form.expiry_date) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const days = Math.round(
            (new Date(form.expiry_date) - today) / (1000 * 60 * 60 * 24)
        );
        if (days < 0) return { tone: "bad", text: `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago` };
        if (days === 0) return { tone: "bad", text: "Expires today" };
        if (days <= 30) return { tone: "warn", text: `Expires in ${days} day${days === 1 ? "" : "s"}` };
        return { tone: "good", text: `Expires in ${days} days` };
    }, [form.expiry_date]);

    const unitLabel = (v) => UNITS.find((u) => u.value === v)?.label || v;
    const marginTone = margin ? (margin.profit < 0 ? "bad" : margin.percent < 10 ? "warn" : "good") : "idle";

    /* ---------- Loading state ---------- */

    if (pageLoading) {
        return (
            <div className="ep-root">
                <style>{css}</style>
                <div className="ep-wrap">
                    <div className="ep-skel ep-skel-title" />
                    <div className="ep-layout">
                        <div className="ep-skel ep-skel-main" />
                        <div className="ep-skel ep-skel-side" />
                    </div>
                    {message && (
                        <div className={`ep-banner ep-banner-${messageType}`} role="alert">
                            {message}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    /* ---------- Small field helpers ---------- */

    const Field = ({ label, name, required, hint, children }) => (
        <div className="ep-field">
            <label className="ep-label" htmlFor={name}>
                {label}
                {required && <span className="ep-req" aria-hidden="true"> *</span>}
            </label>
            {children}
            {errors[name] ? (
                <span className="ep-error" id={`${name}-error`}>{errors[name]}</span>
            ) : (
                hint && <span className="ep-hint">{hint}</span>
            )}
        </div>
    );

    const inputProps = (name) => ({
        id: name,
        name,
        value: form[name] ?? "",
        onChange: handleChange,
        className: `ep-input${errors[name] ? " ep-input-error" : ""}`,
        "aria-invalid": errors[name] ? "true" : undefined,
        "aria-describedby": errors[name] ? `${name}-error` : undefined
    });

    const unitOptions = UNITS.map((u) => (
        <option key={u.value} value={u.value}>
            {u.label}
        </option>
    ));

    return (
        <div className="ep-root">
            <style>{css}</style>

            <form className="ep-wrap" onSubmit={handleSubmit} noValidate>
                {/* Header */}
                <header className="ep-header">
                    <button
                        type="button"
                        className="ep-back"
                        onClick={() => navigate("/products")}
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Products
                    </button>
                    <h1 className="ep-title">Edit product</h1>
                    <p className="ep-subtitle">
                        {form.product_name || "Untitled product"}
                        {form.product_code && <span className="ep-code">{form.product_code}</span>}
                    </p>
                </header>

                {message && (
                    <div className={`ep-banner ep-banner-${messageType}`} role="alert">
                        {message}
                    </div>
                )}

                <div className="ep-layout">
                    {/* ---------------- Main column ---------------- */}
                    <div className="ep-main">
                        <section className="ep-section">
                            <h2 className="ep-section-title">Basic details</h2>

                            <Field label="Product name" name="product_name" required>
                                <input {...inputProps("product_name")} type="text" placeholder="e.g. Toor dal 1 kg" />
                            </Field>

                            <Field
                                label="Category"
                                name="category"
                                required
                                hint={loadingCategories ? "Loading categories…" : undefined}
                            >
                                <select {...inputProps("category")} disabled={loadingCategories}>
                                    <option value="">Select a category</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id || cat} value={cat.id || cat}>
                                            {cat.name || cat}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <div className="ep-row">
                                <Field label="Product code" name="product_code">
                                    <input {...inputProps("product_code")} type="text" placeholder="e.g. PRD-001" />
                                </Field>
                                <Field label="Barcode" name="barcode">
                                    <input {...inputProps("barcode")} type="text" placeholder="Scan or type barcode" inputMode="numeric" />
                                </Field>
                            </div>

                            <Field label="Description" name="description">
                                <textarea
                                    {...inputProps("description")}
                                    rows={3}
                                    placeholder="Brand, size, anything your staff should know"
                                    className="ep-input ep-textarea"
                                />
                            </Field>
                        </section>

                        <section className="ep-section">
                            <h2 className="ep-section-title">Pricing</h2>

                            <div className="ep-row">
                                <Field label="Purchase price (₹)" name="purchase_price" required>
                                    <input {...inputProps("purchase_price")} type="number" min="0" step="0.01" placeholder="0.00" inputMode="decimal" />
                                </Field>
                                <Field label="Selling price (₹)" name="selling_price" required>
                                    <input {...inputProps("selling_price")} type="number" min="0" step="0.01" placeholder="0.00" inputMode="decimal" />
                                </Field>
                            </div>

                            <div className="ep-row">
                                <Field label="Prices are for" name="price_per" required hint="How many units one price covers">
                                    <input {...inputProps("price_per")} type="number" min="1" step="1" placeholder="1" inputMode="numeric" />
                                </Field>
                                <Field label="Price unit" name="price_unit" required>
                                    <select {...inputProps("price_unit")}>{unitOptions}</select>
                                </Field>
                            </div>
                        </section>

                        <section className="ep-section">
                            <h2 className="ep-section-title">Stock</h2>

                            <div className="ep-row">
                                <Field label="Stock quantity" name="stock" required>
                                    <input {...inputProps("stock")} type="number" min="0" step="0.01" placeholder="0" inputMode="decimal" />
                                </Field>
                                <Field label="Stock unit" name="stock_unit" required>
                                    <select {...inputProps("stock_unit")}>{unitOptions}</select>
                                </Field>
                            </div>

                            <div className="ep-row">
                                <Field label="Low-stock alert at" name="min_stock" hint="You'll be warned when stock falls to this level">
                                    <input {...inputProps("min_stock")} type="number" min="0" placeholder="5" inputMode="numeric" />
                                </Field>
                                <Field
                                    label="Expiry date"
                                    name="expiry_date"
                                    hint={expiryState ? undefined : "Leave empty if this product doesn't expire"}
                                >
                                    <input {...inputProps("expiry_date")} type="date" />
                                    {expiryState && (
                                        <span className={`ep-chip ep-chip-${expiryState.tone}`}>{expiryState.text}</span>
                                    )}
                                </Field>
                            </div>
                        </section>

                        {/* Sticky action bar */}
                        <div className="ep-actions">
                            <button type="button" className="ep-btn ep-btn-ghost" onClick={() => navigate("/products")}>
                                Cancel
                            </button>
                            <button type="submit" className="ep-btn ep-btn-primary" disabled={saving}>
                                {saving ? (
                                    <>
                                        <span className="ep-spinner" aria-hidden="true" />
                                        Saving…
                                    </>
                                ) : (
                                    "Save changes"
                                )}
                            </button>
                        </div>
                    </div>

                    {/* ---------------- Side column ---------------- */}
                    <aside className="ep-side">
                        {/* Margin: the focal element */}
                        <div className={`ep-margin ep-margin-${marginTone}`} aria-live="polite">
                            <span className="ep-margin-label">Profit per sale</span>
                            {margin ? (
                                <>
                                    <span className="ep-margin-value">
                                        {margin.profit < 0 ? "−" : ""}
                                        {inr(Math.abs(margin.profit))}
                                    </span>
                                    <span className="ep-margin-sub">
                                        {margin.percent.toFixed(1)}% margin on {form.price_per || 1} {unitLabel(form.price_unit).toLowerCase()}
                                    </span>
                                    {margin.profit < 0 && (
                                        <span className="ep-margin-note">You're selling below purchase price.</span>
                                    )}
                                </>
                            ) : (
                                <span className="ep-margin-sub">Enter both prices to see your margin.</span>
                            )}
                        </div>

                        {/* Image */}
                        <div className="ep-panel">
                            <div className="ep-image">
                                {form.image && !imageFailed ? (
                                    <img
                                        src={form.image}
                                        alt={form.product_name || "Product"}
                                        onError={() => setImageFailed(true)}
                                    />
                                ) : (
                                    <div className="ep-image-empty">
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                            <rect x="3" y="4" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.6" />
                                            <circle cx="9" cy="10" r="1.8" stroke="currentColor" strokeWidth="1.6" />
                                            <path d="M4 17l5-4.5 4 3 3-2.5 4 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <span>{imageFailed ? "Image couldn't load" : "No image yet"}</span>
                                    </div>
                                )}
                            </div>
                            <Field label="Image URL" name="image">
                                <input {...inputProps("image")} type="url" placeholder="https://…" />
                            </Field>
                        </div>

                        {/* Status + stock summary */}
                        <div className="ep-panel">
                            <span className="ep-label" id="status-label">Status</span>
                            <div className="ep-segment" role="radiogroup" aria-labelledby="status-label">
                                {["active", "inactive"].map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        role="radio"
                                        aria-checked={form.status === s}
                                        className={`ep-segment-btn${form.status === s ? " is-on" : ""}${s === "inactive" && form.status === s ? " is-off" : ""}`}
                                        onClick={() => setForm((prev) => ({ ...prev, status: s }))}
                                    >
                                        {s === "active" ? "Active" : "Inactive"}
                                    </button>
                                ))}
                            </div>
                            <p className="ep-hint">
                                {form.status === "active"
                                    ? "Shows up in billing and your product list."
                                    : "Hidden from billing until you make it active again."}
                            </p>

                            {stockState && (
                                <div className="ep-stockline">
                                    <span className={`ep-dot ep-dot-${stockState.tone}`} />
                                    <span>
                                        {stockState.text}
                                        {!isBlank(form.stock) && (
                                            <strong> · {form.stock} {form.stock_unit}</strong>
                                        )}
                                    </span>
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            </form>
        </div>
    );
}

/* ====================================================================
   Styles
   ==================================================================== */

const css = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

.ep-root {
    --ink: #13233a;
    --ink-soft: #52627a;
    --ink-faint: #8593a8;
    --paper: #eef1f6;
    --surface: #ffffff;
    --line: #dde3ec;
    --line-strong: #c3ccd9;
    --brand: #0e7c7b;
    --brand-dark: #0a5f5e;
    --brand-tint: #e3f3f2;
    --good: #15803d;
    --good-tint: #e6f5ec;
    --warn: #b45309;
    --warn-tint: #fdf1de;
    --bad: #b91c1c;
    --bad-tint: #fcebeb;

    font-family: 'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', sans-serif;
    color: var(--ink);
    background: var(--paper);
    min-height: 100vh;
    padding: 32px 20px 0;
    box-sizing: border-box;
}
.ep-root *, .ep-root *::before, .ep-root *::after { box-sizing: border-box; }

.ep-wrap { max-width: 1040px; margin: 0 auto; }

/* Header */
.ep-header { margin-bottom: 24px; }
.ep-back {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 6px 10px 6px 6px; margin-left: -6px;
    background: none; border: 0; border-radius: 8px;
    font: inherit; font-size: 14px; font-weight: 600; color: var(--ink-soft);
    cursor: pointer;
}
.ep-back:hover { color: var(--brand-dark); background: var(--brand-tint); }
.ep-title { margin: 10px 0 4px; font-size: 30px; line-height: 1.15; font-weight: 800; letter-spacing: -0.02em; }
.ep-subtitle { margin: 0; font-size: 15px; color: var(--ink-soft); display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.ep-code {
    font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 6px;
    background: var(--surface); border: 1px solid var(--line); color: var(--ink-soft);
}

/* Banner */
.ep-banner {
    padding: 12px 16px; margin-bottom: 20px; border-radius: 10px;
    font-size: 14px; font-weight: 600; border: 1px solid transparent;
}
.ep-banner-success { background: var(--good-tint); color: var(--good); border-color: #bfe3cc; }
.ep-banner-error { background: var(--bad-tint); color: var(--bad); border-color: #f2c4c4; }

/* Layout */
.ep-layout { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 24px; align-items: start; }
.ep-main {
    background: var(--surface); border: 1px solid var(--line); border-radius: 16px; overflow: clip;
}
.ep-side { display: flex; flex-direction: column; gap: 16px; position: sticky; top: 20px; }

/* Sections */
.ep-section { padding: 26px 28px; border-bottom: 1px solid var(--line); display: flex; flex-direction: column; gap: 18px; }
.ep-section-title { margin: 0; font-size: 17px; font-weight: 700; letter-spacing: -0.01em; }
.ep-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }

/* Fields */
.ep-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.ep-label { font-size: 13px; font-weight: 600; color: var(--ink); }
.ep-req { color: var(--bad); }
.ep-hint { font-size: 12px; color: var(--ink-faint); line-height: 1.4; }
.ep-error { font-size: 12px; font-weight: 600; color: var(--bad); }

.ep-input {
    width: 100%; padding: 11px 13px; font: inherit; font-size: 15px; color: var(--ink);
    background: var(--surface); border: 1.5px solid var(--line-strong); border-radius: 10px;
    font-variant-numeric: tabular-nums;
    transition: border-color .15s, box-shadow .15s;
}
.ep-input::placeholder { color: var(--ink-faint); }
.ep-input:hover { border-color: var(--ink-faint); }
.ep-input:focus-visible { outline: none; border-color: var(--brand); box-shadow: 0 0 0 4px var(--brand-tint); }
.ep-input:disabled { background: var(--paper); cursor: wait; }
.ep-input-error { border-color: var(--bad); }
.ep-input-error:focus-visible { box-shadow: 0 0 0 4px var(--bad-tint); border-color: var(--bad); }
.ep-textarea { resize: vertical; min-height: 84px; line-height: 1.5; }

/* Chips and dots */
.ep-chip { align-self: flex-start; font-size: 12px; font-weight: 700; padding: 3px 9px; border-radius: 999px; }
.ep-chip-good { background: var(--good-tint); color: var(--good); }
.ep-chip-warn { background: var(--warn-tint); color: var(--warn); }
.ep-chip-bad  { background: var(--bad-tint);  color: var(--bad); }

.ep-dot { width: 9px; height: 9px; border-radius: 50%; flex: none; }
.ep-dot-good { background: var(--good); }
.ep-dot-warn { background: var(--warn); }
.ep-dot-bad  { background: var(--bad); }

/* Action bar */
.ep-actions {
    position: sticky; bottom: 0; z-index: 5;
    display: flex; justify-content: flex-end; gap: 12px;
    padding: 16px 28px; background: rgba(255,255,255,.94);
    backdrop-filter: blur(8px); border-top: 1px solid var(--line);
}
.ep-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 10px;
    padding: 12px 22px; font: inherit; font-size: 15px; font-weight: 700;
    border-radius: 10px; border: 1.5px solid transparent; cursor: pointer;
    transition: background .15s, border-color .15s;
}
.ep-btn:focus-visible { outline: 3px solid var(--brand-tint); outline-offset: 2px; box-shadow: 0 0 0 2px var(--brand); }
.ep-btn-ghost { background: var(--surface); color: var(--ink-soft); border-color: var(--line-strong); }
.ep-btn-ghost:hover { background: var(--paper); color: var(--ink); }
.ep-btn-primary { background: var(--brand); color: #fff; min-width: 160px; }
.ep-btn-primary:hover:not(:disabled) { background: var(--brand-dark); }
.ep-btn-primary:disabled { opacity: .7; cursor: not-allowed; }

.ep-spinner {
    width: 16px; height: 16px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,.4); border-top-color: #fff;
    animation: ep-spin .8s linear infinite;
}
@keyframes ep-spin { to { transform: rotate(360deg); } }

/* Side panels */
.ep-panel {
    background: var(--surface); border: 1px solid var(--line); border-radius: 16px;
    padding: 18px; display: flex; flex-direction: column; gap: 12px;
}

/* Margin card (the focal element) */
.ep-margin {
    border-radius: 16px; padding: 20px; display: flex; flex-direction: column; gap: 4px;
    border: 1px solid var(--line); background: var(--surface);
    transition: background .25s, border-color .25s;
}
.ep-margin-label { font-size: 13px; font-weight: 600; color: var(--ink-soft); }
.ep-margin-value { font-size: 38px; line-height: 1.1; font-weight: 800; letter-spacing: -0.03em; font-variant-numeric: tabular-nums; }
.ep-margin-sub { font-size: 13px; color: var(--ink-soft); line-height: 1.4; }
.ep-margin-note { margin-top: 6px; font-size: 13px; font-weight: 700; }
.ep-margin-good { background: var(--good-tint); border-color: #bfe3cc; }
.ep-margin-good .ep-margin-value { color: var(--good); }
.ep-margin-warn { background: var(--warn-tint); border-color: #f1d9ae; }
.ep-margin-warn .ep-margin-value { color: var(--warn); }
.ep-margin-bad { background: var(--bad-tint); border-color: #f2c4c4; }
.ep-margin-bad .ep-margin-value, .ep-margin-bad .ep-margin-note { color: var(--bad); }

/* Image */
.ep-image {
    aspect-ratio: 4 / 3; border-radius: 12px; overflow: hidden;
    background: var(--paper); border: 1px dashed var(--line-strong);
    display: flex; align-items: center; justify-content: center;
}
.ep-image img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ep-image-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; color: var(--ink-faint); font-size: 13px; font-weight: 600; }

/* Status segmented control */
.ep-segment { display: grid; grid-template-columns: 1fr 1fr; padding: 4px; gap: 4px; background: var(--paper); border-radius: 10px; }
.ep-segment-btn {
    padding: 9px 10px; font: inherit; font-size: 14px; font-weight: 700; color: var(--ink-soft);
    background: transparent; border: 0; border-radius: 7px; cursor: pointer;
    transition: background .15s, color .15s;
}
.ep-segment-btn.is-on { background: var(--brand); color: #fff; }
.ep-segment-btn.is-on.is-off { background: var(--ink-soft); }
.ep-segment-btn:focus-visible { outline: 3px solid var(--brand-tint); box-shadow: 0 0 0 2px var(--brand); }
.ep-stockline { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; padding-top: 12px; border-top: 1px solid var(--line); }
.ep-stockline strong { font-weight: 500; color: var(--ink-soft); font-variant-numeric: tabular-nums; }

/* Loading skeleton */
.ep-skel { background: linear-gradient(90deg, #e3e8f0 25%, #edf0f6 50%, #e3e8f0 75%); background-size: 200% 100%; animation: ep-shimmer 1.4s ease-in-out infinite; border-radius: 16px; }
.ep-skel-title { height: 64px; width: 260px; margin-bottom: 24px; }
.ep-skel-main { height: 560px; }
.ep-skel-side { height: 360px; }
@keyframes ep-shimmer { to { background-position: -200% 0; } }

/* Responsive */
@media (max-width: 900px) {
    .ep-layout { grid-template-columns: 1fr; }
    .ep-side { position: static; order: -1; }
}
@media (max-width: 560px) {
    .ep-root { padding: 20px 12px 0; }
    .ep-row { grid-template-columns: 1fr; }
    .ep-section { padding: 22px 18px; }
    .ep-actions { padding: 14px 18px; }
    .ep-actions .ep-btn { flex: 1; }
    .ep-title { font-size: 26px; }
}
@media (prefers-reduced-motion: reduce) {
    .ep-spinner, .ep-skel { animation: none; }
    .ep-root * { transition: none !important; }
}
`;