import React, { useState, useEffect } from "react";
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
    { value: "kg", label: "Kilogram", icon: "⚖️" },
    { value: "g", label: "Gram", icon: "⚖️" },
    { value: "pcs", label: "Pieces", icon: "📦" },
    { value: "l", label: "Liter", icon: "🥤" },
    { value: "ml", label: "Milliliter", icon: "🥤" },
    { value: "meter", label: "Meter", icon: "📏" },
    { value: "feet", label: "Feet", icon: "📏" },
    { value: "pack", label: "Pack", icon: "📦" },
    { value: "box", label: "Box", icon: "📦" },
    { value: "bottle", label: "Bottle", icon: "🧴" },
    { value: "dozen", label: "Dozen", icon: "📦" },
];

const STEPS = ["Item", "Price", "Stock", "Extras", "Review"];

// ─── Small inline "new / already exists" indicator ────────────
function CheckBadge({ check, newLabel, existsLabel }) {
    if (!check || check.status === "idle") return null;
    if (check.status === "checking") {
        return (
            <span style={styles.checkBadge}>
                <span style={{ ...styles.checkDot, background: "#C7CDD8" }} />
                Checking…
            </span>
        );
    }
    if (check.status === "exists") {
        return (
            <span style={{ ...styles.checkBadge, color: "#B3691E" }}>
                <span style={{ ...styles.checkDot, background: "#E4A23A" }} />
                {existsLabel}
            </span>
        );
    }
    return (
        <span style={{ ...styles.checkBadge, color: "#2C7A46" }}>
            <span style={{ ...styles.checkDot, background: "#2C7A46" }} />
            {newLabel}
        </span>
    );
}

export default function AddProduct() {
    // ─── State ───────────────────────────────────────────────
    const [step, setStep] = useState(0);
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

    // { status: "idle" | "checking" | "new" | "exists" }
    const [nameCheck, setNameCheck] = useState({ status: "idle" });
    const [barcodeCheck, setBarcodeCheck] = useState({ status: "idle" });

    // ─── Helpers ──────────────────────────────────────────────
    const getUnitIcon = (unit) => UNITS.find((u) => u.value === unit)?.icon || "📦";
    const getUnitLabel = (unit) => UNITS.find((u) => u.value === unit)?.label || unit;

    // ─── Live "already exists / new" checks ────────────────────
    // Check if product name exists using getProducts endpoint
    useEffect(() => {
        const name = form.product_name.trim();
        if (name.length < 2 || !form.business_id) {
            setNameCheck({ status: "idle" });
            return;
        }
        setNameCheck({ status: "checking" });
        let cancelled = false;
        const handle = setTimeout(async () => {
            try {
                // Check if product with this name exists
                const res = await API.get("/products", {
                    params: { business_id: form.business_id }
                });
                if (!cancelled && res.data?.success) {
                    const exists = res.data.data.some(
                        product => product.product_name.toLowerCase() === name.toLowerCase()
                    );
                    setNameCheck(
                        exists
                            ? { status: "exists" }
                            : { status: "new" }
                    );
                }
            } catch (err) {
                if (!cancelled) setNameCheck({ status: "idle" });
            }
        }, 450);
        return () => {
            cancelled = true;
            clearTimeout(handle);
        };
    }, [form.product_name, form.business_id]);

    // Check if barcode exists using getProductByBarcode endpoint
    useEffect(() => {
        const barcode = form.barcode.trim();
        if (!barcode || !form.business_id) {
            setBarcodeCheck({ status: "idle" });
            return;
        }
        setBarcodeCheck({ status: "checking" });
        let cancelled = false;
        const handle = setTimeout(async () => {
            try {
                // Try to get product by barcode
                const res = await API.get(`/products/barcode/${encodeURIComponent(barcode)}`, {
                    params: { business_id: form.business_id }
                });
                if (!cancelled) {
                    setBarcodeCheck(
                        res.data?.success && res.data?.data
                            ? { status: "exists" }
                            : { status: "new" }
                    );
                }
            } catch (err) {
                // If 404, barcode is new; if other error, reset
                if (!cancelled) {
                    if (err.response?.status === 404) {
                        setBarcodeCheck({ status: "new" });
                    } else {
                        setBarcodeCheck({ status: "idle" });
                    }
                }
            }
        }, 450);
        return () => {
            cancelled = true;
            clearTimeout(handle);
        };
    }, [form.barcode, form.business_id]);

    // ─── Computed fields ──────────────────────────────────────
    const purchaseNum = parseFloat(form.purchase_price) || 0;
    const sellingNum = parseFloat(form.selling_price) || 0;
    const stockNum = parseFloat(form.stock) || 0;
    const minStockNum = parseFloat(form.min_stock) || 0;

    const profit = sellingNum - purchaseNum;
    const profitMargin = purchaseNum > 0 ? (profit / purchaseNum) * 100 : 0;
    const totalValue = stockNum * purchaseNum;
    const isProfitPositive = profit >= 0;
    const isLowStock = stockNum > 0 && stockNum <= minStockNum;
    const isOutOfStock = stockNum === 0;

    const getExpiryStatus = () => {
        if (!form.expiry_date) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiryDate = new Date(form.expiry_date);
        expiryDate.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return { label: "Expired", detail: `${Math.abs(diffDays)}d ago`, color: "#E4572E" };
        if (diffDays <= 7) return { label: "Expiring soon", detail: `${diffDays}d left`, color: "#D9A441" };
        if (diffDays <= 30) return { label: "Watch", detail: `${diffDays}d left`, color: "#B8A23A" };
        return { label: "Fresh", detail: `${diffDays}d left`, color: "#3E8E5A" };
    };
    const expiryStatus = getExpiryStatus();
    const category = CATEGORIES.find((c) => c.value === form.category);

    // ─── Handlers ─────────────────────────────────────────────
    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "price_unit" || name === "stock_unit") {
            setForm((prev) => ({ ...prev, price_unit: value, stock_unit: value }));
            return;
        }
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const bump = (field, delta, min = 0) => {
        setForm((prev) => {
            const current = parseFloat(prev[field]) || 0;
            const next = Math.max(min, current + delta);
            return { ...prev, [field]: next };
        });
    };

    const selectCategory = (value) => setForm((prev) => ({ ...prev, category: value }));
    const selectUnit = (value) => setForm((prev) => ({ ...prev, price_unit: value, stock_unit: value }));

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
        setStep(0);
        setNameCheck({ status: "idle" });
        setBarcodeCheck({ status: "idle" });
    };

    // ─── Per-step validation ──────────────────────────────────
    const stepErrors = {
        0: !form.product_name || !form.category,
        1: !form.purchase_price || !form.selling_price || purchaseNum < 0 || sellingNum < 0,
        2: !form.stock || stockNum < 0,
        3: false,
        4: false,
    };

    const goNext = () => {
        setTouched((prev) => ({ ...prev, [`step${step}`]: true }));
        if (stepErrors[step]) return;
        setStep((s) => Math.min(STEPS.length - 1, s + 1));
    };
    const goBack = () => setStep((s) => Math.max(0, s - 1));
    const jumpTo = (i) => setStep(i);

    const handleSubmit = async () => {
        setLoading(true);
        setMessage("");
        setMessageType("");

        const required = ["product_name", "category", "purchase_price", "selling_price", "stock"];
        const missing = required.filter((field) => !form[field] || form[field] === "");
        if (missing.length > 0) {
            setMessage(`Missing: ${missing.join(", ")}`);
            setMessageType("error");
            setLoading(false);
            return;
        }

        // Check if product name already exists (final check before submit)
        try {
            const checkRes = await API.get("/products", {
                params: { business_id: form.business_id }
            });
            if (checkRes.data?.success) {
                const exists = checkRes.data.data.some(
                    product => product.product_name.toLowerCase() === form.product_name.trim().toLowerCase()
                );
                if (exists) {
                    setMessage("Product with this name already exists in your shop!");
                    setMessageType("error");
                    setLoading(false);
                    return;
                }
            }
        } catch (err) {
            console.error("Error checking product existence:", err);
        }

        const submitData = {
            ...form,
            unit: form.stock_unit,
            price_per: 1,
            expiry_date: form.expiry_date || null,
        };

        try {
            await API.post("/products/create", submitData);
            setMessage("Product added!");
            setMessageType("success");
            resetForm();
            setTimeout(() => {
                setMessage("");
                setMessageType("");
            }, 4000);
        } catch (err) {
            console.error("Error adding product:", err);
            setMessage(err.response?.data?.message || "Could not save. Try again.");
            setMessageType("error");
        } finally {
            setLoading(false);
        }
    };

    // ─── Render ──────────────────────────────────────────────
    return (
        <div style={styles.pageWrapper}>
            <div style={styles.card}>
                {/* ─── Top: back + progress ─── */}
                <div style={styles.topBar}>
                    <Link to="/products" style={styles.exitLink}>✕</Link>
                    <div style={styles.progressTrack}>
                        {STEPS.map((label, i) => (
                            <div
                                key={label}
                                style={{
                                    ...styles.progressDot,
                                    ...(i === step ? styles.progressDotActive : {}),
                                    ...(i < step ? styles.progressDotDone : {}),
                                }}
                                onClick={() => (i < step ? jumpTo(i) : null)}
                            />
                        ))}
                    </div>
                    <span style={styles.stepCount}>{step + 1}/{STEPS.length}</span>
                </div>

                {message && (
                    <div style={{ ...styles.toast, ...(messageType === "success" ? styles.toastSuccess : styles.toastError) }}>
                        {message}
                    </div>
                )}

                {/* ─── Step 0: Item ─── */}
                {step === 0 && (
                    <div style={styles.stepBody}>
                        <h1 style={styles.question}>What are you adding?</h1>
                        <p style={styles.subtext}>Just the name and category to start</p>

                        <input
                            type="text"
                            autoFocus
                            placeholder="Product name"
                            value={form.product_name}
                            onChange={(e) => setForm((p) => ({ ...p, product_name: e.target.value }))}
                            style={styles.bigInput}
                        />
                        <CheckBadge check={nameCheck} newLabel="New product" existsLabel="Already in your shop" />

                        <div style={styles.gridGrid}>
                            {CATEGORIES.map((c) => (
                                <button
                                    type="button"
                                    key={c.value}
                                    onClick={() => selectCategory(c.value)}
                                    style={{ ...styles.gridTile, ...(form.category === c.value ? styles.gridTileActive : {}) }}
                                >
                                    <span style={styles.gridTileIcon}>{c.icon}</span>
                                    <span>{c.label}</span>
                                </button>
                            ))}
                        </div>

                        {touched.step0 && stepErrors[0] && (
                            <span style={styles.stepError}>Add a name and pick a category to continue</span>
                        )}
                    </div>
                )}

                {/* ─── Step 1: Price ─── */}
                {step === 1 && (
                    <div style={styles.stepBody}>
                        <h1 style={styles.question}>Set the price</h1>
                        <p style={styles.subtext}>What you pay, and what you charge</p>

                        <div style={styles.priceRow}>
                            <div style={styles.priceCol}>
                                <label style={styles.priceLabel}>You pay</label>
                                <div style={styles.priceInputWrap}>
                                    <span style={styles.rupee}>₹</span>
                                    <input
                                        type="number"
                                        autoFocus
                                        placeholder="0"
                                        value={form.purchase_price}
                                        onChange={(e) => setForm((p) => ({ ...p, purchase_price: e.target.value }))}
                                        min="0"
                                        step="0.01"
                                        style={styles.priceInput}
                                    />
                                </div>
                            </div>
                            <div style={styles.priceCol}>
                                <label style={styles.priceLabel}>You charge</label>
                                <div style={styles.priceInputWrap}>
                                    <span style={styles.rupee}>₹</span>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={form.selling_price}
                                        onChange={(e) => setForm((p) => ({ ...p, selling_price: e.target.value }))}
                                        min="0"
                                        step="0.01"
                                        style={styles.priceInput}
                                    />
                                </div>
                            </div>
                        </div>

                        {purchaseNum > 0 && sellingNum > 0 && (
                            <div style={{ ...styles.marginBanner, borderColor: isProfitPositive ? "#3E8E5A" : "#E4572E" }}>
                                You earn <strong>₹{profit.toFixed(2)}</strong> per {form.price_unit} · {isProfitPositive ? "+" : ""}{profitMargin.toFixed(0)}% margin
                            </div>
                        )}

                        <span style={styles.miniLabel}>Sold per</span>
                        <div style={styles.chipRow}>
                            {UNITS.map((u) => (
                                <button
                                    type="button"
                                    key={u.value}
                                    onClick={() => selectUnit(u.value)}
                                    style={{ ...styles.unitChip, ...(form.price_unit === u.value ? styles.unitChipActive : {}) }}
                                >
                                    {u.icon} {u.label}
                                </button>
                            ))}
                        </div>

                        {touched.step1 && stepErrors[1] && (
                            <span style={styles.stepError}>Enter both prices to continue</span>
                        )}
                    </div>
                )}

                {/* ─── Step 2: Stock ─── */}
                {step === 2 && (
                    <div style={styles.stepBody}>
                        <h1 style={styles.question}>How much do you have?</h1>
                        <p style={styles.subtext}>Current stock on hand, in {getUnitLabel(form.stock_unit)}</p>

                        <div style={styles.stepperRow}>
                            <button type="button" style={styles.stepperBtn} onClick={() => bump("stock", -1)}>−</button>
                            <div style={styles.stepperValue}>{form.stock || 0}</div>
                            <button type="button" style={styles.stepperBtn} onClick={() => bump("stock", 1)}>+</button>
                        </div>
                        <input
                            type="number"
                            placeholder="or type exact quantity"
                            value={form.stock}
                            onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
                            min="0"
                            step="0.01"
                            style={styles.typedInput}
                        />

                        <div style={styles.minStockRow}>
                            <span style={styles.miniLabel}>Warn me when stock falls below</span>
                            <div style={styles.smallStepper}>
                                <button type="button" style={styles.smallStepperBtn} onClick={() => bump("min_stock", -1)}>−</button>
                                <span style={styles.smallStepperValue}>{form.min_stock}</span>
                                <button type="button" style={styles.smallStepperBtn} onClick={() => bump("min_stock", 1)}>+</button>
                            </div>
                        </div>

                        {touched.step2 && stepErrors[2] && (
                            <span style={styles.stepError}>Add a stock quantity to continue</span>
                        )}
                    </div>
                )}

                {/* ─── Step 3: Extras (skippable) ─── */}
                {step === 3 && (
                    <div style={styles.stepBody}>
                        <h1 style={styles.question}>Anything else?</h1>
                        <p style={styles.subtext}>All optional — skip if you're in a hurry</p>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Barcode</label>
                            <input type="text" placeholder="Scan or type" value={form.barcode} onChange={(e) => setForm((p) => ({ ...p, barcode: e.target.value }))} style={styles.input} />
                            <CheckBadge check={barcodeCheck} newLabel="New barcode" existsLabel="Barcode already used" />
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Product code</label>
                            <input type="text" placeholder="PRD-001" value={form.product_code} onChange={(e) => setForm((p) => ({ ...p, product_code: e.target.value }))} style={styles.input} />
                        </div>
                        <div style={styles.row}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Expiry date</label>
                                <input type="date" value={form.expiry_date} onChange={(e) => setForm((p) => ({ ...p, expiry_date: e.target.value }))} style={styles.input} />
                                {expiryStatus && (
                                    <span style={{ ...styles.expiryPill, color: expiryStatus.color, borderColor: expiryStatus.color }}>
                                        {expiryStatus.label} · {expiryStatus.detail}
                                    </span>
                                )}
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Or shelf life (days)</label>
                                <input
                                    type="number" placeholder="e.g., 365" min="0" style={styles.input}
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
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Tax rate (%)</label>
                            <input type="number" value={form.tax} onChange={(e) => setForm((p) => ({ ...p, tax: e.target.value }))} min="0" max="100" step="0.01" style={styles.input} />
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Description</label>
                            <textarea rows="2" placeholder="Brand, features…" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} style={styles.textarea} />
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Image URL</label>
                            <input type="text" placeholder="https://…" value={form.image} onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))} style={styles.input} />
                        </div>
                    </div>
                )}

                {/* ─── Step 4: Review ─── */}
                {step === 4 && (
                    <div style={styles.stepBody}>
                        <h1 style={styles.question}>Looks good?</h1>
                        <p style={styles.subtext}>Check the details, then add it to your shop</p>

                        <div style={styles.reviewCard}>
                            <div style={styles.reviewTop}>
                                <div>
                                    <div style={styles.reviewName}>{form.product_name || "Untitled product"}</div>
                                    <div style={styles.reviewCat}>{category ? `${category.icon} ${category.label}` : "No category"}</div>
                                </div>
                                <button type="button" style={styles.editBtn} onClick={() => jumpTo(0)}>Edit</button>
                            </div>

                            <div style={styles.reviewSection}>
                                <div style={styles.reviewRow}>
                                    <span>Price</span>
                                    <span style={styles.reviewMono}>₹{sellingNum.toFixed(2)} <span style={styles.reviewDim}>(cost ₹{purchaseNum.toFixed(2)})</span></span>
                                </div>
                                <div style={styles.reviewRow}>
                                    <span>Margin</span>
                                    <span style={{ ...styles.reviewMono, color: isProfitPositive ? "#3E8E5A" : "#E4572E" }}>
                                        {isProfitPositive ? "+" : ""}{profitMargin.toFixed(1)}%
                                    </span>
                                </div>
                                <button type="button" style={styles.editBtnInline} onClick={() => jumpTo(1)}>Edit price</button>
                            </div>

                            <div style={styles.reviewSection}>
                                <div style={styles.reviewRow}>
                                    <span>Stock</span>
                                    <span style={styles.reviewMono}>{stockNum} {getUnitLabel(form.stock_unit)}</span>
                                </div>
                                <div style={styles.reviewRow}>
                                    <span>Status</span>
                                    <span style={{ fontWeight: 700, color: isOutOfStock ? "#E4572E" : isLowStock ? "#D9A441" : "#3E8E5A" }}>
                                        {isOutOfStock ? "Out of stock" : isLowStock ? "Low stock" : "In stock"}
                                    </span>
                                </div>
                                <div style={styles.reviewRow}>
                                    <span>Stock value</span>
                                    <span style={styles.reviewMono}>₹{totalValue.toFixed(2)}</span>
                                </div>
                                <button type="button" style={styles.editBtnInline} onClick={() => jumpTo(2)}>Edit stock</button>
                            </div>

                            {(form.barcode || form.expiry_date || form.description) && (
                                <div style={styles.reviewSection}>
                                    {form.barcode && <div style={styles.reviewRow}><span>Barcode</span><span style={styles.reviewMono}>{form.barcode}</span></div>}
                                    {expiryStatus && <div style={styles.reviewRow}><span>Expiry</span><span style={{ color: expiryStatus.color, fontWeight: 700 }}>{expiryStatus.label} · {expiryStatus.detail}</span></div>}
                                    <button type="button" style={styles.editBtnInline} onClick={() => jumpTo(3)}>Edit extras</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ─── Bottom nav ─── */}
                <div style={styles.bottomNav}>
                    {step > 0 ? (
                        <button type="button" style={styles.backBtn} onClick={goBack}>Back</button>
                    ) : <span />}

                    {step === 3 && (
                        <button type="button" style={styles.skipBtn} onClick={() => setStep(4)}>Skip →</button>
                    )}

                    {step < 4 ? (
                        <button type="button" style={styles.nextBtn} onClick={goNext}>
                            {step === 3 ? "Continue" : "Next"}
                        </button>
                    ) : (
                        <button type="button" style={{ ...styles.nextBtn, ...(loading ? styles.nextBtnDisabled : {}) }} disabled={loading} onClick={handleSubmit}>
                            {loading ? "Saving…" : "Add Product"}
                        </button>
                    )}
                </div>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
                * { box-sizing: border-box; }
                button { font-family: inherit; }
                input:focus, textarea:focus { border-color: #2F6FED !important; box-shadow: 0 0 0 3px rgba(47,111,237,0.12) !important; }
            `}</style>
        </div>
    );
}

// ─── Styles ──────────────────────────────────────────────────
const FONT_DISPLAY = "'Space Grotesk', sans-serif";
const FONT_BODY = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const styles = {
    pageWrapper: {
        background: "#F4F6F9",
        minHeight: "100vh",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "28px 16px",
        fontFamily: FONT_BODY,
    },
    card: {
        width: "100%",
        maxWidth: "480px",
        background: "#FFFFFF",
        borderRadius: "20px",
        padding: "22px 24px 24px",
        boxShadow: "0 12px 32px rgba(20,30,50,0.08)",
        display: "flex",
        flexDirection: "column",
        minHeight: "560px",
    },

    topBar: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" },
    exitLink: { fontSize: "16px", color: "#9AA4B2", textDecoration: "none", fontWeight: 600 },
    progressTrack: { flex: 1, display: "flex", gap: "6px" },
    progressDot: { flex: 1, height: "5px", borderRadius: "3px", background: "#E7EAF0", cursor: "default" },
    progressDotActive: { background: "#2F6FED" },
    progressDotDone: { background: "#B9CCF9", cursor: "pointer" },
    stepCount: { fontSize: "12px", color: "#9AA4B2", fontWeight: 600, fontFamily: FONT_DISPLAY, minWidth: "28px", textAlign: "right" },

    toast: { padding: "10px 14px", borderRadius: "10px", fontSize: "13px", marginBottom: "16px", fontWeight: 600 },
    toastSuccess: { background: "#EAF7EE", color: "#2C7A46" },
    toastError: { background: "#FDECEA", color: "#B3261E" },

    stepBody: { flex: 1, display: "flex", flexDirection: "column", gap: "14px" },
    question: { fontFamily: FONT_DISPLAY, fontSize: "24px", fontWeight: 700, color: "#151A23", margin: 0 },
    subtext: { fontSize: "13.5px", color: "#8891A0", margin: "-8px 0 4px" },
    stepError: { fontSize: "12.5px", color: "#B3261E", fontWeight: 600 },

    bigInput: {
        width: "100%",
        padding: "16px 16px",
        fontSize: "18px",
        fontWeight: 600,
        border: "2px solid #E7EAF0",
        borderRadius: "14px",
        outline: "none",
        color: "#151A23",
        background: "#FAFBFD",
    },

    checkBadge: {
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "12px",
        fontWeight: 600,
        color: "#8891A0",
        marginTop: "-4px",
    },
    checkDot: { width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0 },

    gridGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" },
    gridTile: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "6px",
        padding: "16px 6px",
        borderRadius: "14px",
        border: "2px solid #E7EAF0",
        background: "#FAFBFD",
        color: "#3B4351",
        fontSize: "12.5px",
        fontWeight: 600,
        cursor: "pointer",
    },
    gridTileIcon: { fontSize: "22px" },
    gridTileActive: { borderColor: "#2F6FED", background: "#EEF3FE", color: "#2F6FED" },

    priceRow: { display: "flex", gap: "12px" },
    priceCol: { flex: 1, display: "flex", flexDirection: "column", gap: "6px" },
    priceLabel: { fontSize: "12.5px", fontWeight: 600, color: "#8891A0" },
    priceInputWrap: { position: "relative", display: "flex", alignItems: "center" },
    rupee: { position: "absolute", left: "16px", fontSize: "18px", fontWeight: 700, color: "#9AA4B2" },
    priceInput: {
        width: "100%",
        padding: "16px 14px 16px 32px",
        fontSize: "20px",
        fontWeight: 700,
        border: "2px solid #E7EAF0",
        borderRadius: "14px",
        outline: "none",
        color: "#151A23",
        background: "#FAFBFD",
        fontFamily: FONT_DISPLAY,
    },
    marginBanner: {
        padding: "10px 14px",
        borderRadius: "10px",
        border: "1.5px solid",
        fontSize: "13.5px",
        color: "#3B4351",
        background: "#FAFBFD",
    },

    miniLabel: { fontSize: "12.5px", fontWeight: 600, color: "#8891A0", marginTop: "4px" },
    chipRow: { display: "flex", gap: "8px", flexWrap: "wrap" },
    unitChip: {
        fontSize: "12.5px",
        fontWeight: 600,
        padding: "8px 13px",
        borderRadius: "20px",
        border: "1.5px solid #E7EAF0",
        background: "#FAFBFD",
        color: "#3B4351",
        cursor: "pointer",
    },
    unitChipActive: { borderColor: "#2F6FED", background: "#EEF3FE", color: "#2F6FED" },

    stepperRow: { display: "flex", alignItems: "center", justifyContent: "center", gap: "22px", padding: "10px 0" },
    stepperBtn: {
        width: "52px",
        height: "52px",
        borderRadius: "50%",
        border: "2px solid #E7EAF0",
        background: "#FAFBFD",
        fontSize: "24px",
        fontWeight: 700,
        color: "#2F6FED",
        cursor: "pointer",
    },
    stepperValue: { fontFamily: FONT_DISPLAY, fontSize: "40px", fontWeight: 700, color: "#151A23", minWidth: "90px", textAlign: "center" },
    typedInput: {
        width: "100%",
        padding: "12px 14px",
        fontSize: "14px",
        border: "1.5px solid #E7EAF0",
        borderRadius: "10px",
        outline: "none",
        color: "#151A23",
        background: "#FAFBFD",
        textAlign: "center",
    },
    minStockRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px" },
    smallStepper: { display: "flex", alignItems: "center", gap: "10px" },
    smallStepperBtn: { width: "30px", height: "30px", borderRadius: "8px", border: "1.5px solid #E7EAF0", background: "#FAFBFD", fontWeight: 700, color: "#2F6FED", cursor: "pointer" },
    smallStepperValue: { fontFamily: FONT_DISPLAY, fontWeight: 700, minWidth: "20px", textAlign: "center" },

    row: { display: "flex", gap: "12px" },
    formGroup: { display: "flex", flexDirection: "column", gap: "5px", flex: "1 1 auto" },
    label: { fontSize: "12.5px", fontWeight: 600, color: "#3B4351" },
    input: { padding: "10px 12px", fontSize: "14px", border: "1.5px solid #E7EAF0", borderRadius: "10px", outline: "none", color: "#151A23", background: "#FAFBFD" },
    textarea: { padding: "10px 12px", fontSize: "14px", border: "1.5px solid #E7EAF0", borderRadius: "10px", outline: "none", color: "#151A23", background: "#FAFBFD", resize: "vertical", fontFamily: FONT_BODY },
    expiryPill: { marginTop: "4px", display: "inline-block", fontSize: "11px", fontWeight: 700, border: "1.5px dashed", borderRadius: "8px", padding: "3px 8px", alignSelf: "flex-start" },

    reviewCard: { border: "1.5px solid #E7EAF0", borderRadius: "16px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "14px" },
    reviewTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
    reviewName: { fontFamily: FONT_DISPLAY, fontSize: "18px", fontWeight: 700, color: "#151A23" },
    reviewCat: { fontSize: "12.5px", color: "#8891A0", marginTop: "2px" },
    editBtn: { fontSize: "12px", fontWeight: 700, color: "#2F6FED", background: "none", border: "none", cursor: "pointer" },
    editBtnInline: { fontSize: "11.5px", fontWeight: 700, color: "#2F6FED", background: "none", border: "none", cursor: "pointer", alignSelf: "flex-start", padding: 0, marginTop: "2px" },
    reviewSection: { borderTop: "1px solid #F0F2F6", paddingTop: "10px", display: "flex", flexDirection: "column", gap: "4px" },
    reviewRow: { display: "flex", justifyContent: "space-between", fontSize: "13.5px", color: "#3B4351" },
    reviewMono: { fontFamily: FONT_DISPLAY, fontWeight: 700, color: "#151A23" },
    reviewDim: { fontFamily: FONT_BODY, fontWeight: 400, color: "#9AA4B2", fontSize: "12px" },

    bottomNav: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginTop: "20px" },
    backBtn: { padding: "13px 20px", borderRadius: "12px", border: "none", background: "none", color: "#8891A0", fontWeight: 600, fontSize: "14px", cursor: "pointer" },
    skipBtn: { padding: "13px 16px", borderRadius: "12px", border: "none", background: "none", color: "#9AA4B2", fontWeight: 600, fontSize: "13px", cursor: "pointer" },
    nextBtn: {
        marginLeft: "auto",
        padding: "14px 34px",
        borderRadius: "14px",
        border: "none",
        background: "#2F6FED",
        color: "#FFFFFF",
        fontWeight: 700,
        fontSize: "15px",
        cursor: "pointer",
        boxShadow: "0 6px 16px rgba(47,111,237,0.28)",
    },
    nextBtnDisabled: { opacity: 0.6, cursor: "not-allowed", boxShadow: "none" },
};