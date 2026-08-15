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
    const marginClamped = Math.max(0, Math.min(100, profitMargin));

    // ─── Expiry Status ──────────────────────────────────────
    const getExpiryStatus = () => {
        if (!form.expiry_date) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiryDate = new Date(form.expiry_date);
        expiryDate.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { label: "EXPIRED", detail: `${Math.abs(diffDays)}d ago`, color: "#FF6B6B" };
        if (diffDays <= 7) return { label: "EXPIRING SOON", detail: `${diffDays}d left`, color: "#FFC145" };
        if (diffDays <= 30) return { label: "WATCH", detail: `${diffDays}d left`, color: "#FFE066" };
        return { label: "FRESH", detail: `${diffDays}d left`, color: "#37E6C4" };
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

    const handleBlur = (e) => setTouched((prev) => ({ ...prev, [e.target.name]: true }));

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
            setMessage(`Missing: ${missing.join(", ")}`);
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
            setMessage("Product synced to inventory.");
            setMessageType("success");
            resetForm();
            setTimeout(() => {
                setMessage("");
                setMessageType("");
            }, 5000);
        } catch (err) {
            console.error("Error adding product:", err);
            setMessage(err.response?.data?.message || "Sync failed. Try again.");
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
            <div style={styles.shell}>
                {/* ─── Top bar ─── */}
                <div style={styles.topBar}>
                    <div>
                        <span style={styles.kicker}>// INVENTORY / NEW SKU</span>
                        <h1 style={styles.title}>Add Product</h1>
                    </div>
                    <Link to="/products" style={styles.backLink} className="back-link">
                        ‹ All Products
                    </Link>
                </div>

                {message && (
                    <div style={{ ...styles.toast, ...(messageType === "success" ? styles.toastSuccess : styles.toastError) }}>
                        <span style={styles.toastDot} />
                        {message}
                    </div>
                )}

                <div style={styles.grid} className="ap-grid">
                    {/* ─── Left: form ─── */}
                    <form onSubmit={handleSubmit} style={styles.form}>
                        <div style={styles.panel}>
                            <div style={styles.panelHead}>
                                <span style={styles.panelTitle}>01 · Identity</span>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Product name <span style={styles.required}>*</span></label>
                                <input
                                    type="text"
                                    name="product_name"
                                    placeholder="e.g., Tata Salt 1kg"
                                    value={form.product_name}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    style={{ ...styles.input, ...(isFieldInvalid("product_name") ? styles.inputError : {}) }}
                                />
                                {isFieldInvalid("product_name") && <span style={styles.errorText}>Required</span>}
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
                                            {c.icon} {c.label}
                                        </button>
                                    ))}
                                </div>
                                {isFieldInvalid("category") && <span style={styles.errorText}>Pick one</span>}
                            </div>

                            <div style={styles.row}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Product code</label>
                                    <input type="text" name="product_code" placeholder="PRD-001" value={form.product_code} onChange={handleChange} style={{ ...styles.input, ...styles.inputMono }} />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Barcode</label>
                                    <input type="text" name="barcode" placeholder="Scan or type" value={form.barcode} onChange={handleChange} style={{ ...styles.input, ...styles.inputMono }} />
                                </div>
                            </div>
                        </div>

                        <div style={styles.panel}>
                            <div style={styles.panelHead}>
                                <span style={styles.panelTitle}>02 · Pricing & stock</span>
                            </div>

                            <div style={styles.row}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Purchase price <span style={styles.required}>*</span></label>
                                    <div style={styles.inputWithSymbol}>
                                        <span style={styles.inputSymbol}>₹</span>
                                        <input
                                            type="number" name="purchase_price" placeholder="0.00" value={form.purchase_price}
                                            onChange={handleChange} onBlur={handleBlur} min="0" step="0.01"
                                            style={{ ...styles.input, ...styles.inputMono, ...styles.inputWithSymbolField, ...(isFieldInvalid("purchase_price") ? styles.inputError : {}) }}
                                        />
                                    </div>
                                    {isFieldInvalid("purchase_price") && <span style={styles.errorText}>Required</span>}
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Selling price <span style={styles.required}>*</span></label>
                                    <div style={styles.inputWithSymbol}>
                                        <span style={styles.inputSymbol}>₹</span>
                                        <input
                                            type="number" name="selling_price" placeholder="0.00" value={form.selling_price}
                                            onChange={handleChange} onBlur={handleBlur} min="0" step="0.01"
                                            style={{ ...styles.input, ...styles.inputMono, ...styles.inputWithSymbolField, ...(isFieldInvalid("selling_price") ? styles.inputError : {}) }}
                                        />
                                    </div>
                                    {isFieldInvalid("selling_price") && <span style={styles.errorText}>Required</span>}
                                </div>
                            </div>

                            <div style={styles.row}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Unit <span style={styles.required}>*</span></label>
                                    <select name="price_unit" value={form.price_unit} onChange={handleChange} style={styles.select}>
                                        {UNITS.map((u) => (<option key={u.value} value={u.value}>{u.icon} {u.label}</option>))}
                                    </select>
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Stock quantity <span style={styles.required}>*</span></label>
                                    <input
                                        type="number" name="stock" placeholder="0" value={form.stock}
                                        onChange={handleChange} onBlur={handleBlur} min="0" step="0.01"
                                        style={{ ...styles.input, ...styles.inputMono, ...(isFieldInvalid("stock") ? styles.inputError : {}) }}
                                    />
                                    {isFieldInvalid("stock") && <span style={styles.errorText}>Required</span>}
                                </div>
                            </div>

                            <div style={styles.row}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Minimum stock</label>
                                    <input type="number" name="min_stock" value={form.min_stock} onChange={handleChange} min="0" style={{ ...styles.input, ...styles.inputMono }} />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Tax rate (%)</label>
                                    <input type="number" name="tax" value={form.tax} onChange={handleChange} min="0" max="100" step="0.01" style={{ ...styles.input, ...styles.inputMono }} />
                                </div>
                            </div>
                        </div>

                        <div style={styles.panel}>
                            <div style={styles.panelHead}>
                                <span style={styles.panelTitle}>03 · Shelf life</span>
                                <span style={styles.optionalTag}>optional</span>
                            </div>
                            <div style={styles.row}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Expiry date</label>
                                    <input type="date" name="expiry_date" value={form.expiry_date} onChange={handleChange} style={{ ...styles.input, ...styles.inputMono }} />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Shelf life (days)</label>
                                    <input
                                        type="number" name="shelf_life" placeholder="e.g., 365" min="0"
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
                                </div>
                            </div>
                        </div>

                        <div style={styles.panel}>
                            <div style={styles.panelHead}>
                                <span style={styles.panelTitle}>04 · Notes</span>
                                <span style={styles.optionalTag}>optional</span>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Description</label>
                                <textarea name="description" placeholder="Brand, features, specifications…" rows="3" value={form.description} onChange={handleChange} style={styles.textarea} />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Image URL</label>
                                <input type="text" name="image" placeholder="https://example.com/image.jpg" value={form.image} onChange={handleChange} style={styles.input} />
                            </div>
                        </div>

                        <div style={styles.actions}>
                            <button type="button" onClick={resetForm} style={styles.resetButton} className="reset-button">Clear</button>
                            <button type="submit" disabled={loading} style={{ ...styles.submitButton, ...(loading ? styles.submitButtonDisabled : {}) }} className="submit-button">
                                {loading ? (<><span style={styles.spinner}></span>Syncing…</>) : "Save Product →"}
                            </button>
                        </div>
                    </form>

                    {/* ─── Right: live digital shelf label ─── */}
                    <div style={styles.previewCol}>
                        <div style={styles.stickyWrap}>
                            <span style={styles.previewKicker}>LIVE SHELF LABEL</span>
                            <div style={styles.tag}>
                                <div style={styles.tagTopRow}>
                                    <span style={styles.tagCat}>
                                        {form.category ? `${CATEGORIES.find(c => c.value === form.category)?.icon || ""} ${CATEGORIES.find(c => c.value === form.category)?.label || ""}` : "— no category —"}
                                    </span>
                                    <span style={styles.tagDot(isOutOfStock ? "#FF6B6B" : isLowStock ? "#FFC145" : "#37E6C4")} />
                                </div>
                                <div style={styles.tagName}>{form.product_name || "Untitled product"}</div>
                                <div style={styles.tagPrice}>₹{sellingNum ? sellingNum.toFixed(2) : "0.00"}</div>
                                <div style={styles.tagUnit}>per {getUnitIcon(form.price_unit)} {getUnitLabel(form.price_unit)}</div>

                                <div style={styles.tagDivider} />

                                <div style={styles.tagStatRow}>
                                    <span>Cost</span><span style={styles.tagMono}>₹{purchaseNum.toFixed(2)}</span>
                                </div>
                                <div style={styles.tagStatRow}>
                                    <span>Margin</span>
                                    <span style={{ ...styles.tagMono, color: isProfitPositive ? "#37E6C4" : "#FF6B6B" }}>
                                        {isProfitPositive ? "+" : ""}{profitMargin.toFixed(1)}%
                                    </span>
                                </div>
                                <div style={styles.marginBarTrack}>
                                    <div style={{ ...styles.marginBarFill, width: `${marginClamped}%`, background: isProfitPositive ? "#37E6C4" : "#FF6B6B" }} />
                                </div>

                                <div style={styles.tagStatRow}>
                                    <span>In stock</span>
                                    <span style={styles.tagMono}>{stockNum || 0} {form.stock_unit}</span>
                                </div>
                                <div style={styles.tagStatRow}>
                                    <span>Stock value</span>
                                    <span style={styles.tagMono}>₹{totalValue.toFixed(2)}</span>
                                </div>

                                {expiryStatus && (
                                    <div style={{ ...styles.tagExpiry, color: expiryStatus.color, borderColor: expiryStatus.color }}>
                                        {expiryStatus.label} · {expiryStatus.detail}
                                    </div>
                                )}

                                {form.barcode && <div style={styles.barcodeStrip}>{form.barcode}</div>}
                            </div>
                            <span style={styles.previewFootnote}>Updates as you type — this won't be saved as an image.</span>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');

                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @keyframes pop { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }

                .back-link:hover { border-color: #37E6C4 !important; color: #37E6C4 !important; }
                input:focus, textarea:focus, select:focus {
                    border-color: #37E6C4 !important;
                    box-shadow: 0 0 0 3px rgba(55, 230, 196, 0.12) !important;
                }
                .reset-button:hover { border-color: #7C8791 !important; color: #E7ECEF !important; }
                .submit-button:hover:not(:disabled) { background: #2BC9AE !important; transform: translateY(-1px); }
                .submit-button:active:not(:disabled) { transform: scale(0.98); }

                @media (max-width: 880px) {
                    .ap-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </div>
    );
}

// ─── Styles ──────────────────────────────────────────────────
const FONT_DISPLAY = "'Space Grotesk', sans-serif";
const FONT_MONO = "'JetBrains Mono', monospace";
const FONT_BODY = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const styles = {
    pageWrapper: {
        background: "#0F1317",
        minHeight: "100vh",
        padding: "36px 20px",
        fontFamily: FONT_BODY,
    },
    shell: { maxWidth: "1080px", margin: "0 auto" },

    topBar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginBottom: "22px",
        flexWrap: "wrap",
        gap: "12px",
    },
    kicker: { fontFamily: FONT_MONO, fontSize: "11px", color: "#37E6C4", letterSpacing: "1px" },
    title: { fontFamily: FONT_DISPLAY, fontSize: "30px", fontWeight: 700, color: "#E7ECEF", margin: "4px 0 0 0" },
    backLink: {
        color: "#7C8791",
        textDecoration: "none",
        fontSize: "13px",
        fontWeight: "600",
        fontFamily: FONT_MONO,
        padding: "8px 16px",
        borderRadius: "6px",
        border: "1px solid #2A323A",
        transition: "all 0.15s",
    },

    toast: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "11px 16px",
        marginBottom: "18px",
        borderRadius: "8px",
        fontSize: "13.5px",
        fontFamily: FONT_MONO,
        border: "1px solid",
    },
    toastSuccess: { background: "rgba(55,230,196,0.08)", borderColor: "#37E6C4", color: "#37E6C4" },
    toastError: { background: "rgba(255,107,107,0.08)", borderColor: "#FF6B6B", color: "#FF6B6B" },
    toastDot: { width: "6px", height: "6px", borderRadius: "50%", background: "currentColor" },

    grid: { display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "24px", alignItems: "start" },
    form: { display: "flex", flexDirection: "column", gap: "18px" },

    panel: {
        background: "#161B21",
        border: "1px solid #242C34",
        borderRadius: "12px",
        padding: "20px 22px",
        animation: "pop 0.25s ease",
    },
    panelHead: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" },
    panelTitle: { fontFamily: FONT_MONO, fontSize: "12px", fontWeight: 600, color: "#7C8791", letterSpacing: "0.5px", textTransform: "uppercase" },
    optionalTag: { fontFamily: FONT_MONO, fontSize: "10px", color: "#4B5560", border: "1px solid #2A323A", borderRadius: "10px", padding: "1px 8px" },

    row: { display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "14px" },
    formGroup: { display: "flex", flexDirection: "column", gap: "6px", flex: "1 1 180px", minWidth: "150px", marginBottom: "14px" },

    label: { fontSize: "12px", fontWeight: "600", color: "#AEB8C2" },
    required: { color: "#FF6B6B" },

    input: {
        padding: "10px 12px",
        border: "1px solid #2A323A",
        borderRadius: "7px",
        fontSize: "14px",
        width: "100%",
        boxSizing: "border-box",
        backgroundColor: "#0F1317",
        color: "#E7ECEF",
        outline: "none",
        fontFamily: FONT_BODY,
        transition: "all 0.15s",
    },
    inputMono: { fontFamily: FONT_MONO },
    inputError: { borderColor: "#FF6B6B" },
    select: {
        padding: "10px 12px",
        border: "1px solid #2A323A",
        borderRadius: "7px",
        fontSize: "14px",
        width: "100%",
        boxSizing: "border-box",
        backgroundColor: "#0F1317",
        color: "#E7ECEF",
        outline: "none",
        fontFamily: FONT_BODY,
    },
    inputWithSymbol: { position: "relative", display: "flex", alignItems: "center" },
    inputSymbol: { position: "absolute", left: "12px", fontSize: "13px", fontWeight: "700", color: "#4B5560", pointerEvents: "none" },
    inputWithSymbolField: { paddingLeft: "26px" },
    textarea: {
        padding: "10px 12px",
        border: "1px solid #2A323A",
        borderRadius: "7px",
        fontSize: "14px",
        width: "100%",
        boxSizing: "border-box",
        resize: "vertical",
        minHeight: "80px",
        fontFamily: FONT_BODY,
        backgroundColor: "#0F1317",
        color: "#E7ECEF",
        outline: "none",
    },
    errorText: { fontSize: "11px", color: "#FF6B6B" },

    chipRow: { display: "flex", gap: "8px", flexWrap: "wrap" },
    chip: {
        fontFamily: FONT_BODY,
        fontSize: "12.5px",
        fontWeight: "500",
        padding: "7px 13px",
        borderRadius: "7px",
        border: "1px solid #2A323A",
        background: "#0F1317",
        color: "#AEB8C2",
        cursor: "pointer",
        transition: "all 0.15s",
    },
    chipActive: { background: "rgba(55,230,196,0.12)", borderColor: "#37E6C4", color: "#37E6C4" },

    actions: { display: "flex", gap: "12px", marginTop: "2px" },
    resetButton: {
        padding: "12px 24px",
        background: "transparent",
        color: "#7C8791",
        border: "1px solid #2A323A",
        borderRadius: "7px",
        fontSize: "13.5px",
        fontWeight: "600",
        fontFamily: FONT_MONO,
        cursor: "pointer",
        flex: "1 1 auto",
        transition: "all 0.15s",
    },
    submitButton: {
        padding: "12px 30px",
        background: "#37E6C4",
        color: "#0F1317",
        border: "none",
        borderRadius: "7px",
        fontSize: "14px",
        fontWeight: "700",
        fontFamily: FONT_MONO,
        cursor: "pointer",
        flex: "2 1 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        transition: "all 0.15s",
    },
    submitButtonDisabled: { background: "#3A4550", color: "#7C8791", cursor: "not-allowed" },
    spinner: {
        display: "inline-block",
        width: "14px",
        height: "14px",
        border: "2px solid rgba(15,19,23,0.3)",
        borderTop: "2px solid #0F1317",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
    },

    // ─── Live shelf-label preview ───
    previewCol: { position: "relative" },
    stickyWrap: { position: "sticky", top: "24px", display: "flex", flexDirection: "column", gap: "10px" },
    previewKicker: { fontFamily: FONT_MONO, fontSize: "11px", color: "#4B5560", letterSpacing: "1px", paddingLeft: "4px" },

    tag: {
        background: "linear-gradient(180deg, #0D3A33 0%, #0A1614 100%)",
        border: "1px solid #1E4A42",
        borderRadius: "14px",
        padding: "22px 22px 18px",
        boxShadow: "0 0 0 1px rgba(55,230,196,0.06), 0 20px 40px rgba(0,0,0,0.35)",
        animation: "pop 0.3s ease",
    },
    tagTopRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" },
    tagCat: { fontFamily: FONT_MONO, fontSize: "11px", color: "#6FE8CE", letterSpacing: "0.3px" },
    tagDot: (color) => ({ width: "9px", height: "9px", borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}` }),
    tagName: { fontFamily: FONT_DISPLAY, fontSize: "18px", fontWeight: 600, color: "#F2FBF9", marginBottom: "6px" },
    tagPrice: { fontFamily: FONT_MONO, fontSize: "38px", fontWeight: 700, color: "#37E6C4", lineHeight: 1 },
    tagUnit: { fontFamily: FONT_MONO, fontSize: "11.5px", color: "#6FE8CE", marginTop: "4px" },
    tagDivider: { height: "1px", background: "rgba(55,230,196,0.15)", margin: "16px 0 12px" },
    tagStatRow: { display: "flex", justifyContent: "space-between", fontSize: "12.5px", color: "#9FD9CC", padding: "3px 0" },
    tagMono: { fontFamily: FONT_MONO, fontWeight: 600, color: "#EAF9F5" },
    marginBarTrack: { height: "5px", background: "rgba(255,255,255,0.08)", borderRadius: "4px", margin: "8px 0 10px", overflow: "hidden" },
    marginBarFill: { height: "100%", borderRadius: "4px", transition: "width 0.25s ease" },
    tagExpiry: {
        marginTop: "12px",
        fontFamily: FONT_MONO,
        fontSize: "11px",
        fontWeight: 700,
        border: "1px dashed",
        borderRadius: "6px",
        padding: "5px 10px",
        display: "inline-block",
    },
    barcodeStrip: {
        marginTop: "14px",
        fontFamily: FONT_MONO,
        fontSize: "13px",
        letterSpacing: "3px",
        color: "#0A1614",
        background: "#6FE8CE",
        padding: "6px 10px",
        borderRadius: "4px",
        textAlign: "center",
    },
    previewFootnote: { fontSize: "11px", color: "#3F4A53", paddingLeft: "4px" },
};