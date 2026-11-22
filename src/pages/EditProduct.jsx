import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../services/api";

const UNITS = [
    ["pcs", "Pieces"],
    ["kg", "Kilogram"],
    ["g", "Gram"],
    ["ml", "Milliliter"],
    ["l", "Liter"],
    ["pack", "Pack"],
    ["box", "Box"],
    ["bottle", "Bottle"],
    ["dozen", "Dozen"],
    ["meter", "Meter"],
    ["feet", "Feet"]
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
        maximumFractionDigits: 2
    });

export default function EditProduct() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [loaded, setLoaded] = useState(false);

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

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
        setLoading(true);
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

            setLoaded(true);
            setMessage("");
        } catch (err) {
            console.error("Error loading product:", err);
            setMessage("Couldn't load this product. Taking you back to the list.");
            setMessageType("error");
            setTimeout(() => navigate("/products"), 2000);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const fail = (text) => {
        setMessage(text);
        setMessageType("error");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setMessageType("");

        if (
            !form.product_name.trim() ||
            !form.category ||
            form.purchase_price === "" ||
            form.selling_price === "" ||
            form.stock === ""
        ) {
            return fail("Fill in the product name, category, both prices and stock quantity.");
        }
        if (Number(form.price_per) <= 0) {
            return fail("Price per must be greater than 0.");
        }
        if (!form.price_unit) {
            return fail("Choose a price unit.");
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

            setMessage("Product updated.");
            setMessageType("success");
            window.scrollTo({ top: 0, behavior: "smooth" });
            setTimeout(() => navigate("/products"), 1800);
        } catch (err) {
            console.error("Error updating product:", err);
            fail(
                err.response?.data?.message ||
                    "Couldn't save changes. Check your connection and try again."
            );
        } finally {
            setSaving(false);
        }
    };

    /* ---------- live summary ---------- */
    const summary = useMemo(() => {
        const p = parseFloat(form.purchase_price);
        const s = parseFloat(form.selling_price);
        const stock = parseFloat(form.stock);
        const min = parseFloat(form.min_stock) || 0;

        const hasPrices = !isNaN(p) && !isNaN(s);
        const margin = hasPrices ? s - p : null;
        const pct = hasPrices && s > 0 ? (margin / s) * 100 : null;

        let stockState = "unknown";
        if (!isNaN(stock)) {
            stockState = stock <= 0 ? "out" : stock <= min ? "low" : "ok";
        }

        let expiryState = "none";
        let daysLeft = null;
        if (form.expiry_date) {
            daysLeft = Math.ceil(
                (new Date(form.expiry_date) - new Date()) / 86400000
            );
            expiryState = daysLeft < 0 ? "expired" : daysLeft <= 30 ? "soon" : "ok";
        }

        const stockValue =
            !isNaN(stock) && !isNaN(p) && Number(form.price_per) > 0
                ? (stock / Number(form.price_per)) * p
                : null;

        return { margin, pct, stockState, expiryState, daysLeft, stockValue };
    }, [form]);

    const stockLabel = {
        ok: "In stock",
        low: "Running low",
        out: "Out of stock",
        unknown: "—"
    }[summary.stockState];

    const expiryLabel =
        summary.expiryState === "none"
            ? "No expiry"
            : summary.expiryState === "expired"
            ? `Expired ${Math.abs(summary.daysLeft)} day${Math.abs(summary.daysLeft) === 1 ? "" : "s"} ago`
            : `${summary.daysLeft} day${summary.daysLeft === 1 ? "" : "s"} left`;

    /* ---------- loading ---------- */
    if (loading && !loaded) {
        return (
            <div className="ep">
                <style>{css}</style>
                <div className="ep-loading">
                    <span className="ep-spin ep-spin--dark" />
                    <p>Loading product…</p>
                </div>
            </div>
        );
    }

    const unitOptions = UNITS.map(([v, l]) => (
        <option key={v} value={v}>
            {l}
        </option>
    ));

    return (
        <div className="ep">
            <style>{css}</style>

            <header className="ep-head">
                <button
                    type="button"
                    className="ep-back"
                    onClick={() => navigate(window.history.state?.idx > 0 ? -1 : "/products")}
                >
                    ‹ Products
                </button>
                <h1>{form.product_name || "Edit product"}</h1>
                <p>Update details, pricing and stock. Changes apply to billing right after you save.</p>
            </header>

            {message && (
                <div
                    role="status"
                    className={`ep-alert ep-alert--${messageType}`}
                >
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="ep-layout">
                <div className="ep-main">
                    {/* BASICS */}
                    <section className="ep-sec">
                        <div className="ep-sec-title">
                            <h2>Basics</h2>
                            <p>What you call it and where it sits in your catalogue.</p>
                        </div>
                        <div className="ep-fields">
                            <div className="ep-f ep-f--full">
                                <label htmlFor="product_name">
                                    Product name <b>*</b>
                                </label>
                                <input
                                    id="product_name"
                                    name="product_name"
                                    type="text"
                                    placeholder="e.g. Toor dal 1 kg"
                                    value={form.product_name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="ep-f ep-f--full">
                                <label htmlFor="category">
                                    Category <b>*</b>
                                </label>
                                <select
                                    id="category"
                                    name="category"
                                    value={form.category}
                                    onChange={handleChange}
                                    required
                                    disabled={loadingCategories}
                                >
                                    <option value="">
                                        {loadingCategories ? "Loading categories…" : "Select category"}
                                    </option>
                                    {categories.map((cat) => (
                                        <option key={cat.id || cat} value={cat.id || cat}>
                                            {cat.name || cat}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="ep-f">
                                <label htmlFor="product_code">Product code</label>
                                <input
                                    id="product_code"
                                    name="product_code"
                                    type="text"
                                    placeholder="PRD-001"
                                    value={form.product_code}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="ep-f">
                                <label htmlFor="barcode">Barcode</label>
                                <input
                                    id="barcode"
                                    name="barcode"
                                    type="text"
                                    placeholder="Scan or type barcode"
                                    value={form.barcode}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </section>

                    {/* PRICING */}
                    <section className="ep-sec">
                        <div className="ep-sec-title">
                            <h2>Pricing</h2>
                            <p>What you pay and what you charge, per unit.</p>
                        </div>
                        <div className="ep-fields">
                            <div className="ep-f">
                                <label htmlFor="purchase_price">
                                    Purchase price <b>*</b>
                                </label>
                                <div className="ep-affix">
                                    <span>₹</span>
                                    <input
                                        id="purchase_price"
                                        name="purchase_price"
                                        type="number"
                                        inputMode="decimal"
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                        value={form.purchase_price}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="ep-f">
                                <label htmlFor="selling_price">
                                    Selling price <b>*</b>
                                </label>
                                <div className="ep-affix">
                                    <span>₹</span>
                                    <input
                                        id="selling_price"
                                        name="selling_price"
                                        type="number"
                                        inputMode="decimal"
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                        value={form.selling_price}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="ep-f ep-f--full">
                                <label htmlFor="price_unit">
                                    Price unit <b>*</b>
                                </label>
                                <select
                                    id="price_unit"
                                    name="price_unit"
                                    value={form.price_unit}
                                    onChange={handleChange}
                                    required
                                >
                                    {unitOptions}
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* INVENTORY */}
                    <section className="ep-sec">
                        <div className="ep-sec-title">
                            <h2>Inventory</h2>
                            <p>What's on the shelf and when it expires.</p>
                        </div>
                        <div className="ep-fields">
                            <div className="ep-f ep-f--full">
                                <label htmlFor="stock">
                                    Stock quantity <b>*</b>
                                </label>
                                <input
                                    id="stock"
                                    name="stock"
                                    type="number"
                                    inputMode="decimal"
                                    placeholder="0"
                                    min="0"
                                    step="0.01"
                                    value={form.stock}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="ep-f ep-f--full">
                                <label htmlFor="expiry_date">Expiry date</label>
                                <input
                                    id="expiry_date"
                                    name="expiry_date"
                                    type="date"
                                    value={form.expiry_date}
                                    onChange={handleChange}
                                />
                                <small>Leave empty if it doesn't expire.</small>
                            </div>
                        </div>
                    </section>

                    {/* DETAILS */}
                    <section className="ep-sec">
                        <div className="ep-sec-title">
                            <h2>Details</h2>
                            <p>Optional notes about this product.</p>
                        </div>
                        <div className="ep-fields">
                            <div className="ep-f ep-f--full">
                                <label htmlFor="description">Description</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    rows="3"
                                    placeholder="Brand, pack size, storage notes…"
                                    value={form.description}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </section>
                </div>

                {/* SIDE SUMMARY */}
                <aside className="ep-side">
                    <div className="ep-sum">
                        <div className="ep-thumb">
                            <span>{(form.product_name || "?").charAt(0).toUpperCase()}</span>
                        </div>

                        <div className="ep-status" role="group" aria-label="Product status">
                            <button
                                type="button"
                                className={form.status === "active" ? "is-on" : ""}
                                aria-pressed={form.status === "active"}
                                onClick={() => setForm((p) => ({ ...p, status: "active" }))}
                            >
                                Active
                            </button>
                            <button
                                type="button"
                                className={form.status === "inactive" ? "is-on is-off" : ""}
                                aria-pressed={form.status === "inactive"}
                                onClick={() => setForm((p) => ({ ...p, status: "inactive" }))}
                            >
                                Inactive
                            </button>
                        </div>
                        <p className="ep-hint">
                            {form.status === "active"
                                ? "Shows up in billing and search."
                                : "Hidden from billing. History is kept."}
                        </p>

                        <dl className="ep-stats">
                            <div>
                                <dt>Profit per sale</dt>
                                <dd
                                    className={
                                        summary.margin === null
                                            ? ""
                                            : summary.margin < 0
                                            ? "neg"
                                            : "pos"
                                    }
                                >
                                    {summary.margin === null
                                        ? "—"
                                        : `${summary.margin < 0 ? "−" : ""}${inr(Math.abs(summary.margin))}`}
                                    {summary.pct !== null && (
                                        <em>{summary.pct.toFixed(1)}%</em>
                                    )}
                                </dd>
                            </div>
                            <div>
                                <dt>Stock</dt>
                                <dd className={`st-${summary.stockState}`}>
                                    {stockLabel}
                                </dd>
                            </div>
                            <div>
                                <dt>Expiry</dt>
                                <dd className={`ex-${summary.expiryState}`}>
                                    {expiryLabel}
                                </dd>
                            </div>
                            <div>
                                <dt>Stock at cost</dt>
                                <dd>
                                    {summary.stockValue === null ? "—" : inr(summary.stockValue)}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    <div className="ep-actions">
                        <button
                            type="button"
                            className="ep-btn ep-btn--ghost"
                            onClick={() => navigate(window.history.state?.idx > 0 ? -1 : "/products")}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="ep-btn ep-btn--primary"
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <span className="ep-spin" /> Saving…
                                </>
                            ) : (
                                "Save changes"
                            )}
                        </button>
                    </div>
                </aside>
            </form>
        </div>
    );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=Instrument+Sans:wght@400;500;600&display=swap');

.ep {
    --ink: #16211d;
    --muted: #5d6b65;
    --line: #d9e1dc;
    --paper: #f3f6f4;
    --field: #ffffff;
    --green: #0f6b57;
    --green-d: #0a4f40;
    --green-t: #e1f1ec;
    --amber: #b86e00;
    --amber-t: #fdf0d5;
    --red: #b3261e;
    --red-t: #fbe7e5;
    min-height: 100vh;
    padding: 32px 20px 64px;
    background: var(--paper);
    color: var(--ink);
    font-family: 'Instrument Sans', system-ui, -apple-system, 'Segoe UI', sans-serif;
    font-size: 15px;
    line-height: 1.5;
    box-sizing: border-box;
}
.ep *, .ep *::before, .ep *::after { box-sizing: border-box; }

.ep-head, .ep-alert, .ep-layout { max-width: 1040px; margin-left: auto; margin-right: auto; }

.ep-head { margin-bottom: 24px; }
.ep-head h1 {
    margin: 6px 0 4px;
    font-family: 'Bricolage Grotesque', 'Instrument Sans', system-ui, sans-serif;
    font-size: clamp(26px, 4vw, 36px);
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.15;
    overflow-wrap: anywhere;
}
.ep-head p { margin: 0; color: var(--muted); max-width: 60ch; }

.ep-back {
    padding: 4px 0;
    border: 0;
    background: none;
    color: var(--green);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
}
.ep-back:hover { text-decoration: underline; }

.ep-alert {
    margin-bottom: 20px;
    padding: 12px 16px;
    border-radius: 10px;
    font-weight: 500;
    border: 1px solid;
}
.ep-alert--success { background: var(--green-t); color: var(--green-d); border-color: #a9d6c9; }
.ep-alert--error { background: var(--red-t); color: var(--red); border-color: #f0bcb8; }

.ep-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 300px;
    gap: 32px;
    align-items: start;
}

/* sections: ruled, not boxed */
.ep-main { background: var(--field); border: 1px solid var(--line); border-radius: 14px; }
.ep-sec {
    display: grid;
    grid-template-columns: 190px minmax(0, 1fr);
    gap: 24px;
    padding: 28px;
}
.ep-sec + .ep-sec { border-top: 1px solid var(--line); }
.ep-sec-title h2 {
    margin: 0 0 4px;
    font-family: 'Bricolage Grotesque', 'Instrument Sans', system-ui, sans-serif;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.01em;
}
.ep-sec-title p { margin: 0; font-size: 13px; color: var(--muted); }

.ep-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.ep-f { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.ep-f--full { grid-column: 1 / -1; }
.ep-f label { font-size: 13.5px; font-weight: 600; }
.ep-f label b { color: var(--red); font-weight: 600; }
.ep-f small { font-size: 12px; color: var(--muted); }

.ep input, .ep select, .ep textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    transition: border-color .15s, box-shadow .15s, background .15s;
}
.ep textarea { resize: vertical; min-height: 84px; }
.ep input:hover, .ep select:hover, .ep textarea:hover { border-color: #b7c4bd; }
.ep input:focus, .ep select:focus, .ep textarea:focus {
    outline: none;
    background: var(--field);
    border-color: var(--green);
    box-shadow: 0 0 0 3px rgba(15, 107, 87, .18);
}
.ep select:disabled { opacity: .6; }

.ep-affix { position: relative; }
.ep-affix span {
    position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
    color: var(--muted); pointer-events: none;
}
.ep-affix input { padding-left: 28px; }

/* side summary */
.ep-side { position: sticky; top: 20px; display: flex; flex-direction: column; gap: 14px; }
.ep-sum {
    padding: 20px;
    background: var(--field);
    border: 1px solid var(--line);
    border-radius: 14px;
}
.ep-thumb {
    position: relative;
    display: grid;
    place-items: center;
    aspect-ratio: 16 / 10;
    margin-bottom: 16px;
    overflow: hidden;
    border-radius: 10px;
    background: var(--green-t);
    color: var(--green);
    font-family: 'Bricolage Grotesque', 'Instrument Sans', sans-serif;
    font-size: 56px;
    font-weight: 700;
}

.ep-status {
    display: grid;
    grid-template-columns: 1fr 1fr;
    padding: 3px;
    border-radius: 9px;
    background: var(--paper);
    border: 1px solid var(--line);
}
.ep-status button {
    padding: 7px 0;
    border: 0;
    border-radius: 7px;
    background: transparent;
    color: var(--muted);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
    transition: background .15s, color .15s;
}
.ep-status button.is-on { background: var(--green); color: #fff; }
.ep-status button.is-on.is-off { background: var(--ink); }
.ep-status button:focus-visible { outline: 2px solid var(--green); outline-offset: 2px; }
.ep-hint { margin: 8px 2px 0; font-size: 12.5px; color: var(--muted); }

.ep-stats { margin: 18px 0 0; display: grid; gap: 0; }
.ep-stats > div {
    display: flex; justify-content: space-between; align-items: baseline; gap: 12px;
    padding: 10px 0;
    border-top: 1px solid var(--line);
}
.ep-stats dt { font-size: 13px; color: var(--muted); }
.ep-stats dd { margin: 0; font-weight: 600; text-align: right; font-variant-numeric: tabular-nums; }
.ep-stats dd em { margin-left: 8px; font-style: normal; font-size: 12px; padding: 2px 6px; border-radius: 99px; background: var(--green-t); color: var(--green-d); }
.ep-stats dd.neg { color: var(--red); }
.ep-stats dd.neg em { background: var(--red-t); color: var(--red); }
.ep-stats dd.st-low, .ep-stats dd.ex-soon { color: var(--amber); }
.ep-stats dd.st-out, .ep-stats dd.ex-expired { color: var(--red); }

.ep-actions { display: grid; grid-template-columns: 1fr 1.6fr; gap: 10px; }
.ep-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    padding: 12px 16px;
    border-radius: 10px;
    border: 1px solid transparent;
    font: inherit;
    font-weight: 600;
    cursor: pointer;
    transition: background .15s, border-color .15s;
}
.ep-btn:focus-visible { outline: 2px solid var(--green); outline-offset: 2px; }
.ep-btn--ghost { background: var(--field); border-color: var(--line); color: var(--ink); }
.ep-btn--ghost:hover { border-color: #b7c4bd; }
.ep-btn--primary { background: var(--green); color: #fff; }
.ep-btn--primary:hover:not(:disabled) { background: var(--green-d); }
.ep-btn--primary:disabled { opacity: .65; cursor: not-allowed; }

.ep-loading { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 120px 0; color: var(--muted); }
.ep-spin {
    display: inline-block; width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,.4); border-top-color: #fff;
    border-radius: 50%; animation: ep-spin .8s linear infinite;
}
.ep-spin--dark { width: 28px; height: 28px; border-color: var(--line); border-top-color: var(--green); }
@keyframes ep-spin { to { transform: rotate(360deg); } }

@media (max-width: 900px) {
    .ep-layout { grid-template-columns: 1fr; }
    .ep-side { position: static; }
}
@media (max-width: 640px) {
    .ep { padding: 20px 12px 48px; }
    .ep-sec { grid-template-columns: 1fr; gap: 16px; padding: 20px 16px; }
    .ep-fields { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) {
    .ep * { transition: none !important; }
    .ep-spin { animation-duration: 2s; }
}
`;