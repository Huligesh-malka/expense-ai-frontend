import React, { useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

// ─── Static option data ─────────────────────────────────────
const CATEGORIES = [
    { value: "electronics", label: "Electronics", icon: "📱" },
    { value: "clothing", label: "Clothing", icon: "👕" },
    { value: "food", label: "Food", icon: "🍎" },
    { value: "medicine", label: "Medicine", icon: "💊" },
    { value: "grocery", label: "Grocery", icon: "🛒" },
    { value: "cosmetics", label: "Cosmetics", icon: "🧴" },
    { value: "other", label: "Other", icon: "📦" },
];

const UNITS = [
    { value: "kg", label: "Kilogram (KG)", icon: "⚖️" },
    { value: "g", label: "Gram (G)", icon: "⚖️" },
    { value: "pcs", label: "Pieces (PCS)", icon: "📦" },
    { value: "l", label: "Liter (L)", icon: "🥤" },
    { value: "ml", label: "Milliliter (ML)", icon: "🥤" },
    { value: "meter", label: "Meter", icon: "📏" },
    { value: "feet", label: "Feet", icon: "📏" },
    { value: "pack", label: "Pack", icon: "📦" },
    { value: "box", label: "Box", icon: "📦" },
    { value: "bottle", label: "Bottle", icon: "🧴" },
    { value: "dozen", label: "Dozen", icon: "📦" },
];

export default function AddProduct() {
    // ─── State ───────────────────────────────────────────────
    const [form, setForm] = useState({
        business_id: localStorage.getItem("businessId") || "",
        category: "",
        product_name: "",
        product_code: "",
        barcode: "",
        purchase_price: "",
        selling_price: "",
        price_per: 1,
        price_unit: "kg",
        stock: "",
        stock_unit: "kg",
        min_stock: 5,
        unit: "kg",
        tax: 0,
        image: "",
        description: "",
        expiry_date: "",
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [touched, setTouched] = useState({});

    // ─── Helpers ──────────────────────────────────────────────
    const getUnitIcon = (unit) => UNITS.find((u) => u.value === unit)?.icon || "📦";
    const getUnitLabel = (unit) => UNITS.find((u) => u.value === unit)?.label || unit;

    // ─── Computed fields ──────────────────────────────────────
    const purchaseNum = parseFloat(form.purchase_price) || 0;
    const sellingNum = parseFloat(form.selling_price) || 0;
    const stockNum = parseFloat(form.stock) || 0;
    const minStockNum = parseFloat(form.min_stock) || 0;

    const profit = sellingNum - purchaseNum;
    const profitMargin = purchaseNum > 0 ? (profit / purchaseNum) * 100 : 0;
    const totalValue = stockNum * purchaseNum;
    const totalSellValue = stockNum * sellingNum;

    const isProfitPositive = profit >= 0;
    const isLowStock = stockNum > 0 && stockNum <= minStockNum;
    const isOutOfStock = stockNum === 0;
    const showTag = purchaseNum > 0 && sellingNum > 0;

    // ─── Expiry Status ──────────────────────────────────────
    const getExpiryStatus = () => {
        if (!form.expiry_date) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiryDate = new Date(form.expiry_date);
        expiryDate.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { status: "expired", label: "EXPIRED", detail: `${Math.abs(diffDays)} days ago`, color: "#A63D2D" };
        if (diffDays <= 7) return { status: "expiring_soon", label: "EXPIRING SOON", detail: `${diffDays} days left`, color: "#B5721C" };
        if (diffDays <= 30) return { status: "expiring", label: "WATCH", detail: `${diffDays} days left`, color: "#8A6D1A" };
        return { status: "good", label: "FRESH", detail: `${diffDays} days left`, color: "#2F5D3A" };
    };
    const expiryStatus = getExpiryStatus();

    // ─── Handlers ─────────────────────────────────────────────
    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "price_unit" || name === "stock_unit") {
            setForm((prev) => ({ ...prev, price_unit: value, stock_unit: value }));
            return;
        }
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleBlur = (e) => {
        const { name } = e.target;
        setTouched((prev) => ({ ...prev, [name]: true }));
    };

    const selectCategory = (value) => {
        setForm((prev) => ({ ...prev, category: value }));
        setTouched((prev) => ({ ...prev, category: true }));
    };

    const resetForm = () => {
        setForm({
            business_id: localStorage.getItem("businessId") || "",
            category: "",
            product_name: "",
            product_code: "",
            barcode: "",
            purchase_price: "",
            selling_price: "",
            price_per: 1,
            price_unit: "kg",
            stock: "",
            stock_unit: "kg",
            min_stock: 5,
            unit: "kg",
            tax: 0,
            image: "",
            description: "",
            expiry_date: "",
        });
        setTouched({});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");
        setMessageType("");

        const required = ["product_name", "category", "purchase_price", "selling_price", "stock"];
        const missing = required.filter((field) => !form[field] || form[field] === "");
        if (missing.length > 0) {
            setMessage(`Missing required entries: ${missing.join(", ")}`);
            setMessageType("error");
            setLoading(false);
            const allTouched = required.reduce((acc, f) => ({ ...acc, [f]: true }), {});
            setTouched(allTouched);
            return;
        }

        const submitData = {
            ...form,
            unit: form.stock_unit,
            price_per: 1,
            expiry_date: form.expiry_date || null,
        };

        try {
            await API.post("/products/create", submitData);
            setMessage("Item entered into the ledger.");
            setMessageType("success");
            resetForm();
            setTimeout(() => {
                setMessage("");
                setMessageType("");
            }, 5000);
        } catch (err) {
            console.error("Error adding product:", err);
            const errorMessage = err.response?.data?.message || "Could not save this entry. Try again.";
            setMessage(errorMessage);
            setMessageType("error");
        } finally {
            setLoading(false);
        }
    };

    const isFieldInvalid = (field) => {
        if (!touched[field]) return false;
        const val = form[field];
        if (field === "product_name" || field === "category") return !val || val === "";
        if (["purchase_price", "selling_price", "stock"].includes(field)) return !val || parseFloat(val) < 0;
        return false;
    };

    // ─── Render ──────────────────────────────────────────────
    return (
        <div style={styles.pageWrapper}>
            <div style={styles.sheet}>
                {/* red ledger margin */}
                <div style={styles.marginRule} />

                {/* ─── Header ─── */}
                <div style={styles.header}>
                    <div>
                        <span style={styles.eyebrow}>LAABHA · STOCK REGISTER</span>
                        <h1 style={styles.title}>New Item Entry</h1>
                        <p style={styles.subtitle}>Fill in the particulars below to add this item to your ledger</p>
                    </div>
                    <Link to="/products" style={styles.backLink} className="back-link">
                        ← Register
                    </Link>
                </div>

                {message && (
                    <div style={{ ...styles.stamp, ...(messageType === "success" ? styles.stampSuccess : styles.stampError) }}>
                        <span style={styles.stampMark}>{messageType === "success" ? "✓ ENTERED" : "✕ HOLD"}</span>
                        <span style={styles.stampText}>{message}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} style={styles.form}>
                    {/* ─── Basic Information ─── */}
                    <div style={styles.section}>
                        <div style={styles.sectionHeader}>
                            <span style={styles.sectionTitle}>Basic Particulars</span>
                            <span style={styles.sectionTag}>required</span>
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Product Name <span style={styles.required}>*</span></label>
                            <input
                                type="text"
                                name="product_name"
                                placeholder="e.g., Tata Salt 1kg"
                                value={form.product_name}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                style={{ ...styles.input, ...(isFieldInvalid("product_name") ? styles.inputError : {}) }}
                            />
                            {isFieldInvalid("product_name") && <span style={styles.errorText}>Name this item before saving</span>}
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Category <span style={styles.required}>*</span></label>
                            <div style={styles.chipRow}>
                                {CATEGORIES.map((c) => (
                                    <button
                                        type="button"
                                        key={c.value}
                                        onClick={() => selectCategory(c.value)}
                                        style={{ ...styles.chip, ...(form.category === c.value ? styles.chipActive : {}) }}
                                    >
                                        <span style={{ marginRight: 6 }}>{c.icon}</span>{c.label}
                                    </button>
                                ))}
                            </div>
                            {isFieldInvalid("category") && <span style={styles.errorText}>Pick a category above</span>}
                        </div>

                        <div style={styles.row}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Product Code</label>
                                <input
                                    type="text"
                                    name="product_code"
                                    placeholder="PRD-001"
                                    value={form.product_code}
                                    onChange={handleChange}
                                    style={{ ...styles.input, ...styles.inputMono }}
                                />
                                <span style={styles.helperText}>Optional internal reference</span>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Barcode</label>
                                <input
                                    type="text"
                                    name="barcode"
                                    placeholder="Scan or type"
                                    value={form.barcode}
                                    onChange={handleChange}
                                    style={{ ...styles.input, ...styles.inputMono }}
                                />
                                <span style={styles.helperText}>Scan or enter manually</span>
                            </div>
                        </div>
                    </div>

                    {/* ─── Pricing & Stock ─── */}
                    <div style={{ ...styles.section, position: "relative" }}>
                        <div style={styles.sectionHeader}>
                            <span style={styles.sectionTitle}>Pricing &amp; Stock</span>
                            <span style={{ ...styles.sectionTag, ...styles.sectionTagIndigo }}>critical</span>
                        </div>

                        {/* Signature element: swing price tag */}
                        {showTag && (
                            <div style={{ ...styles.priceTag, borderColor: isProfitPositive ? "#2F5D3A" : "#A63D2D" }}>
                                <div style={styles.priceTagString} />
                                <div style={styles.priceTagHole} />
                                <div style={styles.priceTagMrp}>₹{sellingNum.toFixed(2)}</div>
                                <div style={styles.priceTagRow}>
                                    <span>cost ₹{purchaseNum.toFixed(2)}</span>
                                    <span style={{ color: isProfitPositive ? "#2F5D3A" : "#A63D2D", fontWeight: 700 }}>
                                        {isProfitPositive ? "+" : ""}{profitMargin.toFixed(0)}%
                                    </span>
                                </div>
                            </div>
                        )}

                        <div style={styles.row}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Purchase Price <span style={styles.required}>*</span></label>
                                <div style={styles.inputWithSymbol}>
                                    <span style={styles.inputSymbol}>₹</span>
                                    <input
                                        type="number"
                                        name="purchase_price"
                                        placeholder="0.00"
                                        value={form.purchase_price}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        min="0"
                                        step="0.01"
                                        style={{ ...styles.input, ...styles.inputMono, ...styles.inputWithSymbolField, ...(isFieldInvalid("purchase_price") ? styles.inputError : {}) }}
                                    />
                                </div>
                                {isFieldInvalid("purchase_price") && <span style={styles.errorText}>Enter what you paid</span>}
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Selling Price <span style={styles.required}>*</span></label>
                                <div style={styles.inputWithSymbol}>
                                    <span style={styles.inputSymbol}>₹</span>
                                    <input
                                        type="number"
                                        name="selling_price"
                                        placeholder="0.00"
                                        value={form.selling_price}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        min="0"
                                        step="0.01"
                                        style={{ ...styles.input, ...styles.inputMono, ...styles.inputWithSymbolField, ...(isFieldInvalid("selling_price") ? styles.inputError : {}) }}
                                    />
                                </div>
                                {isFieldInvalid("selling_price") && <span style={styles.errorText}>Enter your counter price</span>}
                            </div>
                        </div>

                        <div style={styles.row}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Unit <span style={styles.required}>*</span></label>
                                <select name="price_unit" value={form.price_unit} onChange={handleChange} style={styles.select}>
                                    {UNITS.map((u) => (
                                        <option key={u.value} value={u.value}>{u.icon} {u.label}</option>
                                    ))}
                                </select>
                                <span style={styles.helperText}>Price and stock are tracked per 1 {form.price_unit}</span>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Stock Quantity <span style={styles.required}>*</span></label>
                                <input
                                    type="number"
                                    name="stock"
                                    placeholder="0"
                                    value={form.stock}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    min="0"
                                    step="0.01"
                                    style={{ ...styles.input, ...styles.inputMono, ...(isFieldInvalid("stock") ? styles.inputError : {}) }}
                                />
                                {isFieldInvalid("stock") && <span style={styles.errorText}>How many are on the shelf?</span>}
                            </div>
                        </div>

                        <div style={styles.row}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Minimum Stock</label>
                                <input
                                    type="number"
                                    name="min_stock"
                                    value={form.min_stock}
                                    onChange={handleChange}
                                    min="0"
                                    style={{ ...styles.input, ...styles.inputMono }}
                                />
                                <span style={styles.helperText}>Alert when stock falls below this</span>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Tax Rate (%)</label>
                                <input
                                    type="number"
                                    name="tax"
                                    value={form.tax}
                                    onChange={handleChange}
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    style={{ ...styles.input, ...styles.inputMono }}
                                />
                                <span style={styles.helperText}>Applicable GST / tax percentage</span>
                            </div>
                        </div>
                    </div>

                    {/* ─── Expiry Date Section ─── */}
                    <div style={styles.section}>
                        <div style={styles.sectionHeader}>
                            <span style={styles.sectionTitle}>Shelf Life</span>
                            <span style={styles.sectionTag}>optional</span>
                        </div>
                        <div style={styles.row}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Expiry Date</label>
                                <input
                                    type="date"
                                    name="expiry_date"
                                    value={form.expiry_date}
                                    onChange={handleChange}
                                    style={{ ...styles.input, ...styles.inputMono }}
                                />
                                <span style={styles.helperText}>Useful for medicine, food, grocery &amp; cosmetics</span>

                                {expiryStatus && (
                                    <div style={{ ...styles.expiryStamp, borderColor: expiryStatus.color, color: expiryStatus.color }}>
                                        {expiryStatus.label} · {expiryStatus.detail}
                                    </div>
                                )}
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Shelf Life (Days)</label>
                                <input
                                    type="number"
                                    name="shelf_life"
                                    placeholder="e.g., 365"
                                    min="0"
                                    style={{ ...styles.input, ...styles.inputMono }}
                                    onChange={(e) => {
                                        const days = parseInt(e.target.value);
                                        if (days > 0) {
                                            const date = new Date();
                                            date.setDate(date.getDate() + days);
                                            setForm((prev) => ({ ...prev, expiry_date: date.toISOString().split("T")[0] }));
                                        }
                                    }}
                                />
                                <span style={styles.helperText}>Auto-calculates expiry from today</span>
                            </div>
                        </div>
                    </div>

                    {/* ─── Additional Details ─── */}
                    <div style={styles.section}>
                        <div style={styles.sectionHeader}>
                            <span style={styles.sectionTitle}>Notes</span>
                            <span style={styles.sectionTag}>optional</span>
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Description</label>
                            <textarea
                                name="description"
                                placeholder="Brand, features, specifications…"
                                rows="3"
                                value={form.description}
                                onChange={handleChange}
                                style={styles.textarea}
                            />
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Image URL</label>
                            <input
                                type="text"
                                name="image"
                                placeholder="https://example.com/product-image.jpg"
                                value={form.image}
                                onChange={handleChange}
                                style={styles.input}
                            />
                            <span style={styles.helperText}>Paste a direct image URL</span>
                        </div>
                    </div>

                    {/* ─── Ledger totals strip ─── */}
                    {showTag && (
                        <div style={styles.totalsStrip}>
                            <div style={styles.totalsRow}>
                                <span>Stock value (cost)</span>
                                <span style={styles.totalsMono}>₹{totalValue.toFixed(2)}</span>
                            </div>
                            <div style={styles.totalsRow}>
                                <span>Stock value (sell)</span>
                                <span style={styles.totalsMono}>₹{totalSellValue.toFixed(2)}</span>
                            </div>
                            <div style={{ ...styles.totalsRow, borderTop: "2px double #2A2420", paddingTop: 8, marginTop: 4 }}>
                                <span>Shelf status</span>
                                <span style={{
                                    ...styles.totalsMono,
                                    color: isOutOfStock ? "#A63D2D" : isLowStock ? "#B5721C" : "#2F5D3A",
                                }}>
                                    {isOutOfStock ? "OUT OF STOCK" : isLowStock ? "LOW STOCK" : "IN STOCK"} · {getUnitIcon(form.price_unit)} {getUnitLabel(form.price_unit)}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* ─── Actions ─── */}
                    <div style={styles.actions}>
                        <button type="button" onClick={resetForm} style={styles.resetButton} className="reset-button">
                            Clear Entry
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{ ...styles.submitButton, ...(loading ? styles.submitButtonDisabled : {}) }}
                            className="submit-button"
                        >
                            {loading ? (
                                <>
                                    <span style={styles.spinner}></span>
                                    Saving…
                                </>
                            ) : (
                                "Add to Ledger"
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Rozha+One&family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap');

                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @keyframes swingIn {
                    from { opacity: 0; transform: rotate(-2deg) translateY(-6px); }
                    to { opacity: 1; transform: rotate(6deg) translateY(0); }
                }
                .back-link:hover { background: #1F3A5F !important; color: #F6F0E4 !important; }
                input:focus, textarea:focus, select:focus {
                    border-color: #1F3A5F !important;
                    box-shadow: 0 0 0 3px rgba(31, 58, 95, 0.10) !important;
                }
                .reset-button:hover { background: #EDE4D0 !important; }
                .submit-button:hover:not(:disabled) {
                    background: #16304F !important;
                    transform: translateY(-1px);
                }
                .submit-button:active:not(:disabled) { transform: scale(0.98); }
            `}</style>
        </div>
    );
}

// ─── Styles ──────────────────────────────────────────────────
const FONT_DISPLAY = "'Rozha One', serif";
const FONT_MONO = "'JetBrains Mono', 'IBM Plex Mono', monospace";
const FONT_BODY = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const styles = {
    pageWrapper: {
        background: "#EDE4D0",
        backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(42,36,32,0.05) 1px, transparent 0)",
        backgroundSize: "18px 18px",
        minHeight: "100vh",
        padding: "40px 16px",
        fontFamily: FONT_BODY,
    },

    sheet: {
        maxWidth: "820px",
        margin: "0 auto",
        background: "#F6F0E4",
        borderRadius: "4px",
        padding: "40px 44px 40px 56px",
        boxShadow: "0 18px 46px rgba(42,36,32,0.14), 0 1px 0 rgba(42,36,32,0.06)",
        border: "1px solid #DCD0B4",
        position: "relative",
        overflow: "visible",
    },
    marginRule: {
        position: "absolute",
        top: 0,
        bottom: 0,
        left: "40px",
        width: "2px",
        background: "#C0453A",
        opacity: 0.55,
    },

    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginBottom: "22px",
        flexWrap: "wrap",
        gap: "12px",
        borderBottom: "1px solid #DCD0B4",
        paddingBottom: "18px",
    },
    eyebrow: {
        fontFamily: FONT_MONO,
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "1.6px",
        color: "#B5721C",
    },
    title: {
        fontFamily: FONT_DISPLAY,
        fontSize: "34px",
        fontWeight: 400,
        color: "#1F3A5F",
        margin: "4px 0 0 0",
    },
    subtitle: {
        fontSize: "13.5px",
        color: "#6B6154",
        margin: "6px 0 0 0",
    },
    backLink: {
        color: "#1F3A5F",
        textDecoration: "none",
        fontSize: "12.5px",
        fontWeight: "600",
        fontFamily: FONT_MONO,
        padding: "8px 16px",
        borderRadius: "3px",
        border: "1px solid #1F3A5F",
        transition: "all 0.15s",
        whiteSpace: "nowrap",
    },

    stamp: {
        display: "flex",
        alignItems: "baseline",
        gap: "10px",
        padding: "10px 16px",
        marginBottom: "22px",
        borderRadius: "3px",
        border: "2px dashed",
        fontSize: "13.5px",
    },
    stampSuccess: { borderColor: "#2F5D3A", background: "#EEF3EA", color: "#2F5D3A" },
    stampError: { borderColor: "#A63D2D", background: "#F7EAE6", color: "#A63D2D" },
    stampMark: { fontFamily: FONT_MONO, fontWeight: 700, letterSpacing: "0.5px" },
    stampText: { color: "#2A2420" },

    form: { display: "flex", flexDirection: "column", gap: "26px" },

    section: {
        borderTop: "1px solid #DCD0B4",
        paddingTop: "16px",
    },
    sectionHeader: {
        display: "flex",
        alignItems: "baseline",
        gap: "10px",
        marginBottom: "14px",
    },
    sectionTitle: {
        fontFamily: FONT_DISPLAY,
        fontSize: "19px",
        color: "#1F3A5F",
        fontWeight: 400,
    },
    sectionTag: {
        fontFamily: FONT_MONO,
        fontSize: "10px",
        fontWeight: 700,
        letterSpacing: "0.8px",
        textTransform: "uppercase",
        color: "#8A7A5C",
        border: "1px solid #C7B98F",
        borderRadius: "20px",
        padding: "1px 9px",
    },
    sectionTagIndigo: { color: "#1F3A5F", borderColor: "#1F3A5F" },

    row: { display: "flex", gap: "18px", flexWrap: "wrap", marginBottom: "16px" },
    formGroup: { display: "flex", flexDirection: "column", gap: "6px", flex: "1 1 200px", minWidth: "160px", marginBottom: "16px" },

    label: { fontSize: "12.5px", fontWeight: "600", color: "#3B342C", letterSpacing: "0.15px" },
    required: { color: "#A63D2D", marginLeft: "2px" },

    input: {
        padding: "10px 13px",
        border: "1px solid #CBBE9C",
        borderRadius: "3px",
        fontSize: "14px",
        width: "100%",
        boxSizing: "border-box",
        backgroundColor: "#FFFDF8",
        color: "#2A2420",
        outline: "none",
        fontFamily: FONT_BODY,
        transition: "all 0.15s",
    },
    inputMono: { fontFamily: FONT_MONO },
    inputError: { borderColor: "#A63D2D", backgroundColor: "#F7EAE6" },
    select: {
        padding: "10px 13px",
        border: "1px solid #CBBE9C",
        borderRadius: "3px",
        fontSize: "14px",
        width: "100%",
        boxSizing: "border-box",
        backgroundColor: "#FFFDF8",
        color: "#2A2420",
        outline: "none",
        fontFamily: FONT_BODY,
    },
    inputWithSymbol: { position: "relative", display: "flex", alignItems: "center" },
    inputSymbol: { position: "absolute", left: "12px", fontSize: "14px", fontWeight: "700", color: "#8A7A5C", pointerEvents: "none" },
    inputWithSymbolField: { paddingLeft: "28px" },
    textarea: {
        padding: "10px 13px",
        border: "1px solid #CBBE9C",
        borderRadius: "3px",
        fontSize: "14px",
        width: "100%",
        boxSizing: "border-box",
        resize: "vertical",
        minHeight: "82px",
        fontFamily: FONT_BODY,
        backgroundColor: "#FFFDF8",
        color: "#2A2420",
        outline: "none",
    },
    errorText: { fontSize: "11.5px", color: "#A63D2D", fontWeight: "500" },
    helperText: { fontSize: "11.5px", color: "#8A7A5C" },

    chipRow: { display: "flex", gap: "8px", flexWrap: "wrap" },
    chip: {
        fontFamily: FONT_BODY,
        fontSize: "13px",
        fontWeight: "500",
        padding: "7px 14px",
        borderRadius: "20px",
        border: "1px solid #CBBE9C",
        background: "#FFFDF8",
        color: "#3B342C",
        cursor: "pointer",
        transition: "all 0.15s",
    },
    chipActive: {
        background: "#1F3A5F",
        borderColor: "#1F3A5F",
        color: "#F6F0E4",
        transform: "rotate(-1deg)",
        boxShadow: "0 2px 6px rgba(31,58,95,0.3)",
    },

    // ─── Signature: swing price tag ───
    priceTag: {
        position: "absolute",
        top: "-14px",
        right: "18px",
        width: "128px",
        background: "#FFFDF8",
        border: "2px solid",
        borderRadius: "6px",
        padding: "16px 10px 10px",
        textAlign: "center",
        boxShadow: "0 8px 18px rgba(42,36,32,0.18)",
        transform: "rotate(6deg)",
        animation: "swingIn 0.4s ease",
        zIndex: 2,
    },
    priceTagString: {
        position: "absolute",
        top: "-14px",
        left: "50%",
        width: "1px",
        height: "16px",
        background: "#8A7A5C",
    },
    priceTagHole: {
        position: "absolute",
        top: "4px",
        left: "50%",
        marginLeft: "-4px",
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        background: "#EDE4D0",
        border: "1px solid #CBBE9C",
    },
    priceTagMrp: { fontFamily: FONT_MONO, fontSize: "20px", fontWeight: 700, color: "#1F3A5F" },
    priceTagRow: {
        display: "flex",
        justifyContent: "space-between",
        fontFamily: FONT_MONO,
        fontSize: "10.5px",
        color: "#6B6154",
        marginTop: "4px",
    },

    expiryStamp: {
        marginTop: "6px",
        display: "inline-block",
        fontFamily: FONT_MONO,
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.5px",
        padding: "4px 10px",
        border: "2px dashed",
        borderRadius: "3px",
        alignSelf: "flex-start",
    },

    totalsStrip: {
        background: "#FFFDF8",
        border: "1px solid #DCD0B4",
        borderRadius: "4px",
        padding: "16px 20px",
    },
    totalsRow: {
        display: "flex",
        justifyContent: "space-between",
        fontSize: "13px",
        color: "#3B342C",
        padding: "4px 0",
    },
    totalsMono: { fontFamily: FONT_MONO, fontWeight: 600 },

    actions: { display: "flex", gap: "14px", marginTop: "4px", flexWrap: "wrap" },
    resetButton: {
        padding: "12px 26px",
        background: "#F6F0E4",
        color: "#3B342C",
        border: "1px solid #CBBE9C",
        borderRadius: "3px",
        fontSize: "13.5px",
        fontWeight: "600",
        fontFamily: FONT_MONO,
        cursor: "pointer",
        flex: "1 1 auto",
        transition: "all 0.15s",
    },
    submitButton: {
        padding: "12px 34px",
        background: "#1F3A5F",
        color: "#F6F0E4",
        border: "none",
        borderRadius: "3px",
        fontSize: "14.5px",
        fontWeight: "700",
        fontFamily: FONT_MONO,
        letterSpacing: "0.3px",
        cursor: "pointer",
        flex: "2 1 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        boxShadow: "0 4px 14px rgba(31,58,95,0.25)",
        transition: "all 0.15s",
    },
    submitButtonDisabled: { background: "#9AA6B4", cursor: "not-allowed", boxShadow: "none" },
    spinner: {
        display: "inline-block",
        width: "16px",
        height: "16px",
        border: "2px solid rgba(246,240,228,0.4)",
        borderTop: "2px solid #F6F0E4",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
    },
};