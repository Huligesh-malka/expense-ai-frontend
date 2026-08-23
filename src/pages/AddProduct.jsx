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
    const getUnitLabel = (unit) =>
        UNITS.find((u) => u.value === unit)?.label || unit;

    // ─── Live "already exists / new" checks ────────────────────
    // Check if product name exists using getProducts endpoint
    useEffect(() => {
        const name = form.product_name.trim();
        if (name.length < 2) {
            setNameCheck({ status: "idle" });
            return;
        }
        setNameCheck({ status: "checking" });
        let cancelled = false;
        const handle = setTimeout(async () => {
            try {
                // Check if product with this name exists
                const res = await API.get("/products", {
                    params: {
                        search: name,
                        limit: 20,
                    },
                });

                if (!cancelled && res.data?.success) {
                    const products = Array.isArray(res.data.data)
                        ? res.data.data
                        : [];

                    const normalizedName = name.toLowerCase();

                    const exists = products.some(
                        (product) =>
                            product.product_name?.trim().toLowerCase() ===
                            normalizedName
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
    }, [form.product_name]);

    // Check if barcode exists using getProductByBarcode endpoint
    useEffect(() => {
        const barcode = form.barcode.trim();
        if (!barcode) {
            setBarcodeCheck({ status: "idle" });
            return;
        }
        setBarcodeCheck({ status: "checking" });
        let cancelled = false;
        const handle = setTimeout(async () => {
            try {
                // Try to get product by barcode
                const res = await API.get(`/products/barcode/${encodeURIComponent(barcode)}`);
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
    }, [form.barcode]);

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
        0:
            !form.product_name.trim() ||
            form.product_name.trim().length < 2 ||
            !form.category ||
            nameCheck.status === "exists" ||
            nameCheck.status === "checking",

        1:
            purchaseNum <= 0 ||
            sellingNum <= 0 ||
            parseFloat(form.price_per) <= 0,

        2:
            form.stock === "" ||
            stockNum < 0 ||
            minStockNum < 0,

        3: false,
        4: false,
    };

    // Check if Next button should be disabled for step 0
    const isNextDisabled = (stepIndex) => {
        if (stepIndex === 0) {
            return (
                !form.product_name.trim() ||
                form.product_name.trim().length < 2 ||
                !form.category ||
                nameCheck.status === "exists" ||
                nameCheck.status === "checking"
            );
        }

        if (stepIndex === 1) {
            return (
                purchaseNum <= 0 ||
                sellingNum <= 0 ||
                parseFloat(form.price_per) <= 0
            );
        }

        if (stepIndex === 2) {
            return form.stock === "" || stockNum < 0 || minStockNum < 0;
        }

        return false;
    };

    const goNext = () => {
        setTouched((prev) => ({ ...prev, [`step${step}`]: true }));

        if (
            step === 0 &&
            (nameCheck.status === "exists" ||
                nameCheck.status === "checking")
        ) {
            setMessage(
                nameCheck.status === "checking"
                    ? "Checking product name. Please wait a moment."
                    : "This product name already exists in your shop. Please use a different name."
            );
            setMessageType("error");
            return;
        }

        if (stepErrors[step]) return;

        setMessage("");
        setMessageType("");
        setStep((s) => Math.min(STEPS.length - 1, s + 1));
    };

    const goBack = () => setStep((s) => Math.max(0, s - 1));
    const jumpTo = (i) => setStep(i);

    const handleSubmit = async () => {
        if (loading) return;

        setLoading(true);
        setMessage("");
        setMessageType("");

        const productName = form.product_name.trim();
        const pricePer = Number(form.price_per);
        const tax = Number(form.tax);
        const stock = Number(form.stock);
        const minStock = Number(form.min_stock);

        if (productName.length < 2) {
            setMessage("Product name must contain at least 2 characters.");
            setMessageType("error");
            setLoading(false);
            setStep(0);
            return;
        }

        if (!form.category) {
            setMessage("Please select a product category.");
            setMessageType("error");
            setLoading(false);
            setStep(0);
            return;
        }

        if (
            !Number.isFinite(purchaseNum) ||
            !Number.isFinite(sellingNum) ||
            purchaseNum <= 0 ||
            sellingNum <= 0
        ) {
            setMessage("Purchase and selling prices must be greater than 0.");
            setMessageType("error");
            setLoading(false);
            setStep(1);
            return;
        }

        if (!Number.isFinite(pricePer) || pricePer <= 0) {
            setMessage("Price quantity must be greater than 0.");
            setMessageType("error");
            setLoading(false);
            setStep(1);
            return;
        }

        if (form.stock === "" || !Number.isFinite(stock) || stock < 0) {
            setMessage("Stock must be 0 or greater.");
            setMessageType("error");
            setLoading(false);
            setStep(2);
            return;
        }

        if (!Number.isFinite(minStock) || minStock < 0) {
            setMessage("Minimum stock cannot be negative.");
            setMessageType("error");
            setLoading(false);
            setStep(2);
            return;
        }

        if (!Number.isFinite(tax) || tax < 0 || tax > 100) {
            setMessage("Tax rate must be between 0% and 100%.");
            setMessageType("error");
            setLoading(false);
            setStep(3);
            return;
        }

        if (nameCheck.status === "checking") {
            setMessage("Still checking the product name. Please wait.");
            setMessageType("error");
            setLoading(false);
            setStep(0);
            return;
        }

        if (nameCheck.status === "exists") {
            setMessage(
                "This product name already exists in your shop. Please use a different name."
            );
            setMessageType("error");
            setLoading(false);
            setStep(0);
            return;
        }

        if (barcodeCheck.status === "checking") {
            setMessage("Still checking the barcode. Please wait.");
            setMessageType("error");
            setLoading(false);
            setStep(3);
            return;
        }

        if (form.barcode.trim() && barcodeCheck.status === "exists") {
            setMessage("This barcode is already used in your shop.");
            setMessageType("error");
            setLoading(false);
            setStep(3);
            return;
        }

        const submitData = {
            ...form,
            product_name: productName,
            product_code: form.product_code.trim(),
            barcode: form.barcode.trim(),
            purchase_price: purchaseNum,
            selling_price: sellingNum,
            price_per: pricePer,
            price_unit: form.price_unit,
            stock: stock,
            stock_unit: form.stock_unit,
            unit: form.stock_unit,
            min_stock: minStock,
            tax: tax,
            image: form.image.trim(),
            description: form.description.trim(),
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
            console.error("Create product response:", err.response?.data);

            setMessage(
                err.response?.data?.message ||
                "Could not save. Try again."
            );
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
                            id="add-product-name"
                            name="product_name"
                            placeholder="Product name"
                            value={form.product_name}
                            autoComplete="off"
                            maxLength={120}
                            onChange={(e) => {
                                setForm((p) => ({ ...p, product_name: e.target.value }));
                                // Clear any previous error message when user types
                                if (message && messageType === "error") {
                                    setMessage("");
                                    setMessageType("");
                                }
                            }}
                            style={{
                                ...styles.bigInput,
                                ...(nameCheck.status === "exists" ? { borderColor: "#E4572E", background: "#FDF5F3" } : {})
                            }}
                        />
                        <CheckBadge check={nameCheck} newLabel="New product" existsLabel="Already in your shop" />
                        
                        {nameCheck.status === "exists" && (
                            <span style={{ ...styles.stepError, marginTop: "-8px" }}>
                                ⚠️ This product name already exists. Please use a different name.
                            </span>
                        )}

                        <div style={styles.gridGrid}>
                            {CATEGORIES.map((c) => (
                                <button
                                    type="button"
                                    key={c.value}
                                    aria-pressed={form.category === c.value}
                                    onClick={() => selectCategory(c.value)}
                                    style={{ ...styles.gridTile, ...(form.category === c.value ? styles.gridTileActive : {}) }}
                                >
                                    <span style={styles.gridTileIcon}>{c.icon}</span>
                                    <span>{c.label}</span>
                                </button>
                            ))}
                        </div>

                        {touched.step0 && stepErrors[0] && (
                            <span style={styles.stepError}>
                                {nameCheck.status === "exists" 
                                    ? "Product name already exists! Please use a different name." 
                                    : "Add a name and pick a category to continue"}
                            </span>
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
                                        id="add-product-purchase-price"
                                        name="purchase_price"
                                        placeholder="0"
                                        value={form.purchase_price}
                                        autoComplete="off"
                                        inputMode="decimal"
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
                                        id="add-product-selling-price"
                                        name="selling_price"
                                        placeholder="0"
                                        value={form.selling_price}
                                        autoComplete="off"
                                        inputMode="decimal"
                                        onChange={(e) => setForm((p) => ({ ...p, selling_price: e.target.value }))}
                                        min="0"
                                        step="0.01"
                                        style={styles.priceInput}
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.priceLabel}>
                                Price quantity
                            </label>
                            <input
                                id="add-product-price-per"
                                name="price_per"
                                type="number"
                                min="0.01"
                                step="0.01"
                                inputMode="decimal"
                                value={form.price_per}
                                onChange={(e) =>
                                    setForm((p) => ({
                                        ...p,
                                        price_per: e.target.value,
                                    }))
                                }
                                autoComplete="off"
                                style={styles.input}
                                aria-label="Price quantity"
                            />
                            <span style={styles.fieldHint}>
                                Example: 1 kg, 500 g, 1 pcs
                            </span>
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
                            id="add-product-stock"
                            name="stock"
                            placeholder="or type exact quantity"
                            value={form.stock}
                            autoComplete="off"
                            inputMode="decimal"
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
                            <input 
                                type="text" 
                                id="add-product-barcode"
                                name="barcode"
                                placeholder="Scan or type" 
                                value={form.barcode}
                                autoComplete="off"
                                inputMode="numeric"
                                maxLength={64} 
                                onChange={(e) => {
                                    setForm((p) => ({ ...p, barcode: e.target.value }));
                                    // Clear any previous error message when user types
                                    if (message && messageType === "error") {
                                        setMessage("");
                                        setMessageType("");
                                    }
                                }} 
                                style={styles.input} 
                            />
                            <CheckBadge check={barcodeCheck} newLabel="New barcode" existsLabel="Barcode already used" />
                            {barcodeCheck.status === "exists" && (
                                <span style={{ ...styles.stepError, fontSize: "11px" }}>
                                    ⚠️ This barcode is already used for another product
                                </span>
                            )}
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Product code</label>
                            <input
                                id="add-product-code"
                                name="product_code"
                                type="text"
                                placeholder="PRD-001"
                                value={form.product_code}
                                autoComplete="off"
                                maxLength={64}
                                onChange={(e) => setForm((p) => ({ ...p, product_code: e.target.value }))} style={styles.input} />
                        </div>
                        <div style={styles.row}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Expiry date</label>
                                <input id="add-product-expiry" name="expiry_date" type="date" value={form.expiry_date} onChange={(e) => setForm((p) => ({ ...p, expiry_date: e.target.value }))} style={styles.input} />
                                {expiryStatus && (
                                    <span style={{ ...styles.expiryPill, color: expiryStatus.color, borderColor: expiryStatus.color }}>
                                        {expiryStatus.label} · {expiryStatus.detail}
                                    </span>
                                )}
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Or shelf life (days)</label>
                                <input
                                    id="add-product-shelf-life"
                                    name="shelf_life_days"
                                    type="number"
                                    placeholder="e.g., 365"
                                    min="0"
                                    max="36500"
                                    autoComplete="off"
                                    inputMode="numeric"
                                    style={styles.input}
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
                            <input id="add-product-tax" name="tax" type="number" value={form.tax} onChange={(e) => setForm((p) => ({ ...p, tax: e.target.value }))} min="0" max="100" step="0.01" style={styles.input} />
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Description</label>
                            <textarea id="add-product-description" name="description" rows="2" maxLength={1000} placeholder="Brand, features…" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} style={styles.textarea} />
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Image URL</label>
                            <input id="add-product-image" name="image" type="url" placeholder="https://…" value={form.image} autoComplete="url" onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))} style={styles.input} />
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
                        <button 
                            type="button" 
                            style={{
                                ...styles.nextBtn,
                                ...(isNextDisabled(step) ? styles.nextBtnDisabled : {})
                            }} 
                            disabled={isNextDisabled(step)} 
                            onClick={goNext}
                        >
                            {step === 3 ? "Continue" : "Next"}
                        </button>
                    ) : (
                        <button
                            type="button"
                            style={{
                                ...styles.nextBtn,
                                ...(
                                    loading ||
                                    nameCheck.status === "checking" ||
                                    nameCheck.status === "exists" ||
                                    barcodeCheck.status === "checking" ||
                                    barcodeCheck.status === "exists"
                                )
                                    ? styles.nextBtnDisabled
                                    : {}
                            }}
                            disabled={
                                loading ||
                                nameCheck.status === "checking" ||
                                nameCheck.status === "exists" ||
                                barcodeCheck.status === "checking" ||
                                barcodeCheck.status === "exists"
                            }
                            onClick={handleSubmit}
                        >
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
    fieldHint: { fontSize: "11px", color: "#8C96A5", marginTop: "-6px" },
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