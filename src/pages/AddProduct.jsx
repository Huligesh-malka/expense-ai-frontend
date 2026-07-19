import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

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
        expiry_date: "" // NEW: Product expiry date
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [touched, setTouched] = useState({});

    // ─── Helpers ──────────────────────────────────────────────
    const getUnitIcon = (unit) => {
        const icons = {
            kg: "⚖️",
            g: "⚖️",
            pcs: "📦",
            l: "🥤",
            ml: "🥤",
            meter: "📏",
            feet: "📏",
            pack: "📦",
            box: "📦",
            bottle: "🧴",
            dozen: "📦",
        };
        return icons[unit] || "📦";
    };

    const getUnitLabel = (unit) => {
        const labels = {
            kg: "Kilogram",
            g: "Gram",
            pcs: "Pieces",
            l: "Liter",
            ml: "Milliliter",
            meter: "Meter",
            feet: "Feet",
            pack: "Pack",
            box: "Box",
            bottle: "Bottle",
            dozen: "Dozen",
        };
        return labels[unit] || unit;
    };

    // ─── Computed fields ──────────────────────────────────────
    const purchaseNum = parseFloat(form.purchase_price) || 0;
    const sellingNum = parseFloat(form.selling_price) || 0;
    const stockNum = parseFloat(form.stock) || 0;
    const taxNum = parseFloat(form.tax) || 0;
    const minStockNum = parseFloat(form.min_stock) || 0;

    const profit = sellingNum - purchaseNum;
    const profitMargin = purchaseNum > 0 ? ((profit / purchaseNum) * 100) : 0;
    const totalValue = stockNum * purchaseNum;
    const totalSellValue = stockNum * sellingNum;

    const isProfitPositive = profit >= 0;
    const isLowStock = stockNum > 0 && stockNum <= minStockNum;
    const isOutOfStock = stockNum === 0;

    // ─── Expiry Status ──────────────────────────────────────
    const getExpiryStatus = () => {
        if (!form.expiry_date) return null;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const expiryDate = new Date(form.expiry_date);
        expiryDate.setHours(0, 0, 0, 0);
        
        const diffTime = expiryDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
            return { status: "expired", label: "🔴 Expired", color: "#dc2626" };
        } else if (diffDays <= 7) {
            return { status: "expiring_soon", label: "🟠 Expiring in " + diffDays + " days", color: "#ea580c" };
        } else if (diffDays <= 30) {
            return { status: "expiring", label: "🟡 Expiring in " + diffDays + " days", color: "#ca8a04" };
        } else {
            return { status: "good", label: "✅ " + diffDays + " days remaining", color: "#16a34a" };
        }
    };

    const expiryStatus = getExpiryStatus();

    // ─── Handlers ─────────────────────────────────────────────
    const handleChange = (e) => {
        const { name, value } = e.target;

        // Sync price_unit ↔ stock_unit
        if (name === "price_unit") {
            setForm((prev) => ({
                ...prev,
                price_unit: value,
                stock_unit: value,
            }));
            return;
        }
        if (name === "stock_unit") {
            setForm((prev) => ({
                ...prev,
                stock_unit: value,
                price_unit: value,
            }));
            return;
        }

        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleBlur = (e) => {
        const { name } = e.target;
        setTouched((prev) => ({ ...prev, [name]: true }));
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
            expiry_date: "" // Reset expiry date
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
            setMessage(`❌ Please fill in all required fields: ${missing.join(", ")}`);
            setMessageType("error");
            setLoading(false);
            // Mark all as touched to show errors
            const allTouched = required.reduce((acc, f) => ({ ...acc, [f]: true }), {});
            setTouched(allTouched);
            return;
        }

        const submitData = {
            ...form,
            unit: form.stock_unit,
            price_per: 1,
            expiry_date: form.expiry_date || null // Send null if empty
        };

        try {
            await API.post("/products/create", submitData);
            setMessage("✅ Product added successfully!");
            setMessageType("success");
            resetForm();
            setTimeout(() => {
                setMessage("");
                setMessageType("");
            }, 5000);
        } catch (err) {
            console.error("Error adding product:", err);
            const errorMessage = err.response?.data?.message || "Failed to add product. Please try again.";
            setMessage(`❌ ${errorMessage}`);
            setMessageType("error");
        } finally {
            setLoading(false);
        }
    };

    // ─── Validation helpers ──────────────────────────────────
    const isFieldInvalid = (field) => {
        if (!touched[field]) return false;
        const val = form[field];
        if (field === "product_name" || field === "category") return !val || val === "";
        if (field === "purchase_price" || field === "selling_price" || field === "stock") {
            return !val || parseFloat(val) < 0;
        }
        return false;
    };

    // ─── Render ──────────────────────────────────────────────
    return (
        <div style={styles.pageWrapper}>
            <div style={styles.container}>
                {/* ─── Header ─── */}
                <div style={styles.header}>
                    <div>
                        <h1 style={styles.title}>➕ Add Product</h1>
                        <p style={styles.subtitle}>Create a new inventory item</p>
                    </div>
                    <Link to="/products" style={styles.backLink}>
                        ← Back to Products
                    </Link>
                </div>

                {/* ─── Message ─── */}
                {message && (
                    <div
                        style={{
                            ...styles.message,
                            ...(messageType === "success"
                                ? styles.successMessage
                                : styles.errorMessage),
                        }}
                    >
                        {message}
                    </div>
                )}

                {/* ─── Form ─── */}
                <form onSubmit={handleSubmit} style={styles.form}>
                    {/* ─── Basic Information ─── */}
                    <div style={styles.section}>
                        <div style={styles.sectionHeader}>
                            <span style={styles.sectionIcon}>📋</span>
                            <h3 style={styles.sectionTitle}>Basic Information</h3>
                            <span style={styles.sectionBadge}>Required</span>
                        </div>
                        <div style={styles.sectionBody}>
                            <div style={styles.row}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>
                                        Product Name <span style={styles.required}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="product_name"
                                        placeholder="Enter product name"
                                        value={form.product_name}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        style={{
                                            ...styles.input,
                                            ...(isFieldInvalid("product_name")
                                                ? styles.inputError
                                                : {}),
                                        }}
                                    />
                                    {isFieldInvalid("product_name") && (
                                        <span style={styles.errorText}>Product name is required</span>
                                    )}
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>
                                        Category <span style={styles.required}>*</span>
                                    </label>
                                    <select
                                        name="category"
                                        value={form.category}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        style={{
                                            ...styles.input,
                                            ...(isFieldInvalid("category")
                                                ? styles.inputError
                                                : {}),
                                        }}
                                    >
                                        <option value="">Select Category</option>
                                        <option value="electronics">📱 Electronics</option>
                                        <option value="clothing">👕 Clothing</option>
                                        <option value="food">🍎 Food</option>
                                        <option value="medicine">💊 Medicine</option>
                                        <option value="grocery">🛒 Grocery</option>
                                        <option value="cosmetics">🧴 Cosmetics</option>
                                        <option value="other">📦 Other</option>
                                    </select>
                                    {isFieldInvalid("category") && (
                                        <span style={styles.errorText}>Category is required</span>
                                    )}
                                </div>
                            </div>

                            <div style={styles.row}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Product Code</label>
                                    <input
                                        type="text"
                                        name="product_code"
                                        placeholder="e.g., PRD-001"
                                        value={form.product_code}
                                        onChange={handleChange}
                                        style={styles.input}
                                    />
                                    <span style={styles.helperText}>Optional internal reference</span>
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Barcode</label>
                                    <input
                                        type="text"
                                        name="barcode"
                                        placeholder="Enter barcode"
                                        value={form.barcode}
                                        onChange={handleChange}
                                        style={styles.input}
                                    />
                                    <span style={styles.helperText}>Scan or enter manually</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ─── Pricing & Stock ─── */}
                    <div style={styles.section}>
                        <div style={styles.sectionHeader}>
                            <span style={styles.sectionIcon}>💰</span>
                            <h3 style={styles.sectionTitle}>Pricing & Stock</h3>
                            <span style={{ ...styles.sectionBadge, background: "#dbeafe", color: "#1e40af" }}>
                                Critical
                            </span>
                        </div>
                        <div style={styles.sectionBody}>
                            {/* Purchase / Sell */}
                            <div style={styles.row}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>
                                        Purchase Price <span style={styles.required}>*</span>
                                    </label>
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
                                            style={{
                                                ...styles.input,
                                                ...styles.inputWithSymbolField,
                                                ...(isFieldInvalid("purchase_price")
                                                    ? styles.inputError
                                                    : {}),
                                            }}
                                        />
                                    </div>
                                    {isFieldInvalid("purchase_price") && (
                                        <span style={styles.errorText}>Valid purchase price required</span>
                                    )}
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>
                                        Selling Price <span style={styles.required}>*</span>
                                    </label>
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
                                            style={{
                                                ...styles.input,
                                                ...styles.inputWithSymbolField,
                                                ...(isFieldInvalid("selling_price")
                                                    ? styles.inputError
                                                    : {}),
                                            }}
                                        />
                                    </div>
                                    {isFieldInvalid("selling_price") && (
                                        <span style={styles.errorText}>Valid selling price required</span>
                                    )}
                                </div>
                            </div>

                            {/* Unit (Price Per fixed to 1) */}
                            <div style={styles.row}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>
                                        Price Per <span style={styles.required}>*</span>
                                    </label>
                                    <div style={styles.fixedValue}>
                                        <span style={styles.fixedNumber}>1</span>
                                        <span style={styles.fixedLabel}>unit (fixed)</span>
                                    </div>
                                    <span style={styles.helperText}>
                                        Price is always per <strong>1</strong> unit
                                    </span>
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>
                                        Unit <span style={styles.required}>*</span>
                                    </label>
                                    <select
                                        name="price_unit"
                                        value={form.price_unit}
                                        onChange={handleChange}
                                        style={styles.input}
                                    >
                                        <option value="kg">⚖️ Kilogram (KG)</option>
                                        <option value="g">⚖️ Gram (G)</option>
                                        <option value="pcs">📦 Pieces (PCS)</option>
                                        <option value="l">🥤 Liter (L)</option>
                                        <option value="ml">🥤 Milliliter (ML)</option>
                                        <option value="meter">📏 Meter</option>
                                        <option value="feet">📏 Feet</option>
                                        <option value="pack">📦 Pack</option>
                                        <option value="box">📦 Box</option>
                                        <option value="bottle">🧴 Bottle</option>
                                        <option value="dozen">📦 Dozen</option>
                                    </select>
                                </div>
                            </div>

                            {/* Stock */}
                            <div style={styles.row}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>
                                        Stock Quantity <span style={styles.required}>*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="stock"
                                        placeholder="0"
                                        value={form.stock}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        min="0"
                                        step="0.01"
                                        style={{
                                            ...styles.input,
                                            ...(isFieldInvalid("stock") ? styles.inputError : {}),
                                        }}
                                    />
                                    {isFieldInvalid("stock") && (
                                        <span style={styles.errorText}>Stock quantity required</span>
                                    )}
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>
                                        Stock Unit <span style={styles.required}>*</span>
                                    </label>
                                    <select
                                        name="stock_unit"
                                        value={form.stock_unit}
                                        onChange={handleChange}
                                        style={styles.input}
                                    >
                                        <option value="kg">⚖️ Kilogram (KG)</option>
                                        <option value="g">⚖️ Gram (G)</option>
                                        <option value="pcs">📦 Pieces (PCS)</option>
                                        <option value="l">🥤 Liter (L)</option>
                                        <option value="ml">🥤 Milliliter (ML)</option>
                                        <option value="meter">📏 Meter</option>
                                        <option value="feet">📏 Feet</option>
                                        <option value="pack">📦 Pack</option>
                                        <option value="box">📦 Box</option>
                                        <option value="bottle">🧴 Bottle</option>
                                        <option value="dozen">📦 Dozen</option>
                                    </select>
                                </div>
                            </div>

                            {/* Min Stock & Tax */}
                            <div style={styles.row}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Minimum Stock</label>
                                    <input
                                        type="number"
                                        name="min_stock"
                                        placeholder="5"
                                        value={form.min_stock}
                                        onChange={handleChange}
                                        min="0"
                                        style={styles.input}
                                    />
                                    <span style={styles.helperText}>Alert when stock falls below</span>
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Tax Rate (%)</label>
                                    <input
                                        type="number"
                                        name="tax"
                                        placeholder="0"
                                        value={form.tax}
                                        onChange={handleChange}
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        style={styles.input}
                                    />
                                    <span style={styles.helperText}>Applicable tax percentage</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ─── Expiry Date Section ─── */}
                    <div style={styles.section}>
                        <div style={styles.sectionHeader}>
                            <span style={styles.sectionIcon}>📅</span>
                            <h3 style={styles.sectionTitle}>Expiry & Shelf Life</h3>
                            <span style={{ ...styles.sectionBadge, background: "#fef3c7", color: "#92400e" }}>
                                Optional
                            </span>
                        </div>
                        <div style={styles.sectionBody}>
                            <div style={styles.row}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Expiry Date</label>
                                    <input
                                        type="date"
                                        name="expiry_date"
                                        value={form.expiry_date}
                                        onChange={handleChange}
                                        style={styles.input}
                                    />
                                    <span style={styles.helperText}>
                                        Useful for medicine, food, grocery & cosmetics
                                    </span>
                                    
                                    {/* Expiry Status Preview */}
                                    {expiryStatus && (
                                        <div style={{
                                            marginTop: "10px",
                                            padding: "10px 14px",
                                            borderRadius: "8px",
                                            background: expiryStatus.status === "expired" ? "#fef2f2" :
                                                      expiryStatus.status === "expiring_soon" ? "#fff7ed" :
                                                      expiryStatus.status === "expiring" ? "#fefce8" : "#f0fdf4",
                                            border: `1px solid ${expiryStatus.color}30`,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px"
                                        }}>
                                            <span style={{ fontSize: "18px" }}>
                                                {expiryStatus.status === "expired" ? "🔴" :
                                                 expiryStatus.status === "expiring_soon" ? "🟠" :
                                                 expiryStatus.status === "expiring" ? "🟡" : "✅"}
                                            </span>
                                            <span style={{
                                                fontWeight: "600",
                                                color: expiryStatus.color,
                                                fontSize: "14px"
                                            }}>
                                                {expiryStatus.label}
                                            </span>
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
                                        style={styles.input}
                                        onChange={(e) => {
                                            const days = parseInt(e.target.value);
                                            if (days > 0) {
                                                const date = new Date();
                                                date.setDate(date.getDate() + days);
                                                setForm(prev => ({
                                                    ...prev,
                                                    expiry_date: date.toISOString().split('T')[0]
                                                }));
                                            }
                                        }}
                                    />
                                    <span style={styles.helperText}>
                                        Auto-calculate expiry from today
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ─── Profit Preview ─── */}
                    {(purchaseNum > 0 && sellingNum > 0) || expiryStatus ? (
                        <div style={styles.previewCard}>
                            <div style={styles.previewHeader}>
                                <span style={styles.previewIcon}>📊</span>
                                <span style={styles.previewTitle}>Product Summary</span>
                            </div>
                            <div style={styles.previewGrid}>
                                {purchaseNum > 0 && sellingNum > 0 && (
                                    <>
                                        <div style={styles.previewItem}>
                                            <span style={styles.previewLabel}>Profit per unit</span>
                                            <span
                                                style={{
                                                    ...styles.previewValue,
                                                    color: isProfitPositive ? "#16a34a" : "#dc2626",
                                                }}
                                            >
                                                {isProfitPositive ? "+" : ""}
                                                ₹{profit.toFixed(2)}
                                            </span>
                                        </div>
                                        <div style={styles.previewItem}>
                                            <span style={styles.previewLabel}>Margin</span>
                                            <span
                                                style={{
                                                    ...styles.previewValue,
                                                    color: isProfitPositive ? "#16a34a" : "#dc2626",
                                                }}
                                            >
                                                {profitMargin.toFixed(1)}%
                                            </span>
                                        </div>
                                        <div style={styles.previewItem}>
                                            <span style={styles.previewLabel}>Stock Value (cost)</span>
                                            <span style={styles.previewValue}>
                                                ₹{totalValue.toFixed(2)}
                                            </span>
                                        </div>
                                        <div style={styles.previewItem}>
                                            <span style={styles.previewLabel}>Stock Value (sell)</span>
                                            <span style={styles.previewValue}>
                                                ₹{totalSellValue.toFixed(2)}
                                            </span>
                                        </div>
                                        <div style={styles.previewItem}>
                                            <span style={styles.previewLabel}>Stock Status</span>
                                            <span
                                                style={{
                                                    ...styles.previewStatus,
                                                    ...(isOutOfStock
                                                        ? styles.previewStatusDanger
                                                        : isLowStock
                                                            ? styles.previewStatusWarning
                                                            : styles.previewStatusSuccess),
                                                }}
                                            >
                                                {isOutOfStock
                                                    ? "🚫 Out of Stock"
                                                    : isLowStock
                                                        ? "⚠️ Low Stock"
                                                        : "✅ In Stock"}
                                            </span>
                                        </div>
                                        <div style={styles.previewItem}>
                                            <span style={styles.previewLabel}>Unit</span>
                                            <span style={styles.previewValue}>
                                                {getUnitIcon(form.price_unit)} {getUnitLabel(form.price_unit)}
                                            </span>
                                        </div>
                                    </>
                                )}
                                
                                {/* Expiry Status in Summary */}
                                {expiryStatus && (
                                    <div style={styles.previewItem}>
                                        <span style={styles.previewLabel}>Expiry Status</span>
                                        <span
                                            style={{
                                                ...styles.previewValue,
                                                fontSize: "14px",
                                                color: expiryStatus.color,
                                            }}
                                        >
                                            {expiryStatus.label}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : null}

                    {/* ─── Additional Details ─── */}
                    <div style={styles.section}>
                        <div style={styles.sectionHeader}>
                            <span style={styles.sectionIcon}>📝</span>
                            <h3 style={styles.sectionTitle}>Additional Details</h3>
                            <span style={{ ...styles.sectionBadge, background: "#f3f4f6", color: "#6b7280" }}>
                                Optional
                            </span>
                        </div>
                        <div style={styles.sectionBody}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Description</label>
                                <textarea
                                    name="description"
                                    placeholder="Enter product description (e.g., brand, features, specifications…)"
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
                    </div>

                    {/* ─── Submit ─── */}
                    <div style={styles.actions}>
                        <button
                            type="button"
                            onClick={resetForm}
                            style={styles.resetButton}
                            className="reset-button"
                        >
                            Reset
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                ...styles.submitButton,
                                ...(loading ? styles.submitButtonDisabled : {}),
                            }}
                            className="submit-button"
                        >
                            {loading ? (
                                <>
                                    <span style={styles.spinner}></span>
                                    Adding Product…
                                </>
                            ) : (
                                "➕ Add Product"
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* ─── Inline keyframes ─── */}
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes fadeSlideUp {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .preview-card {
                    animation: fadeSlideUp 0.35s ease;
                }
            `}</style>
        </div>
    );
}

// ─── Styles ──────────────────────────────────────────────────
const styles = {
    pageWrapper: {
        background: "#f8fafc",
        minHeight: "100vh",
        padding: "32px 16px",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },

    container: {
        maxWidth: "820px",
        margin: "0 auto",
        background: "#ffffff",
        borderRadius: "20px",
        padding: "36px 40px",
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)",
        border: "1px solid #eef2f6",
        transition: "all 0.2s",
    },

    // ─── Header ───
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "28px",
        flexWrap: "wrap",
        gap: "12px",
    },
    title: {
        fontSize: "26px",
        fontWeight: "700",
        color: "#0f172a",
        margin: 0,
        letterSpacing: "-0.4px",
    },
    subtitle: {
        fontSize: "14px",
        color: "#64748b",
        margin: "4px 0 0 0",
    },
    backLink: {
        color: "#2563eb",
        textDecoration: "none",
        fontSize: "14px",
        fontWeight: "500",
        padding: "8px 16px",
        borderRadius: "8px",
        background: "#eff6ff",
        transition: "all 0.2s",
        whiteSpace: "nowrap",
    },

    // ─── Message ───
    message: {
        padding: "14px 20px",
        marginBottom: "24px",
        borderRadius: "12px",
        fontSize: "14px",
        fontWeight: "500",
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },
    successMessage: {
        background: "#f0fdf4",
        color: "#166534",
        border: "1px solid #bbf7d0",
    },
    errorMessage: {
        background: "#fef2f2",
        color: "#991b1b",
        border: "1px solid #fecaca",
    },

    // ─── Form ───
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "28px",
    },

    // ─── Sections ───
    section: {
        border: "1px solid #eef2f6",
        borderRadius: "14px",
        overflow: "hidden",
        background: "#fafcff",
        transition: "border-color 0.2s",
    },
    sectionHeader: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "14px 20px",
        background: "#f8fafc",
        borderBottom: "1px solid #eef2f6",
    },
    sectionIcon: {
        fontSize: "18px",
        lineHeight: 1,
    },
    sectionTitle: {
        fontSize: "15px",
        fontWeight: "600",
        color: "#0f172a",
        margin: 0,
        flex: 1,
    },
    sectionBadge: {
        fontSize: "11px",
        fontWeight: "600",
        padding: "2px 12px",
        borderRadius: "20px",
        background: "#fef2f2",
        color: "#991b1b",
        textTransform: "uppercase",
        letterSpacing: "0.3px",
    },
    sectionBody: {
        padding: "20px 20px 18px",
        display: "flex",
        flexDirection: "column",
        gap: "18px",
    },

    // ─── Form Groups ───
    row: {
        display: "flex",
        gap: "18px",
        flexWrap: "wrap",
    },
    formGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "5px",
        flex: "1 1 200px",
        minWidth: "160px",
    },
    label: {
        fontSize: "13px",
        fontWeight: "600",
        color: "#1e293b",
        letterSpacing: "0.2px",
    },
    required: {
        color: "#ef4444",
        marginLeft: "2px",
    },
    input: {
        padding: "10px 14px",
        border: "1px solid #e2e8f0",
        borderRadius: "10px",
        fontSize: "14px",
        width: "100%",
        boxSizing: "border-box",
        transition: "all 0.2s",
        backgroundColor: "#ffffff",
        color: "#0f172a",
        outline: "none",
        fontFamily: "inherit",
    },
    inputError: {
        borderColor: "#ef4444",
        backgroundColor: "#fef2f2",
    },
    inputWithSymbol: {
        position: "relative",
        display: "flex",
        alignItems: "center",
    },
    inputSymbol: {
        position: "absolute",
        left: "12px",
        fontSize: "14px",
        fontWeight: "600",
        color: "#94a3b8",
        pointerEvents: "none",
    },
    inputWithSymbolField: {
        paddingLeft: "30px",
    },
    textarea: {
        padding: "10px 14px",
        border: "1px solid #e2e8f0",
        borderRadius: "10px",
        fontSize: "14px",
        width: "100%",
        boxSizing: "border-box",
        resize: "vertical",
        minHeight: "82px",
        fontFamily: "inherit",
        backgroundColor: "#ffffff",
        color: "#0f172a",
        outline: "none",
        transition: "all 0.2s",
    },
    errorText: {
        fontSize: "12px",
        color: "#ef4444",
        fontWeight: "500",
        marginTop: "2px",
    },
    helperText: {
        fontSize: "12px",
        color: "#94a3b8",
        fontWeight: "400",
        marginTop: "2px",
    },

    // ─── Fixed Price Per ───
    fixedValue: {
        padding: "10px 14px",
        border: "1px solid #e2e8f0",
        borderRadius: "10px",
        backgroundColor: "#f8fafc",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        cursor: "default",
    },
    fixedNumber: {
        fontSize: "16px",
        fontWeight: "700",
        color: "#0f172a",
    },
    fixedLabel: {
        fontSize: "13px",
        color: "#94a3b8",
        fontWeight: "400",
    },

    // ─── Preview Card ───
    previewCard: {
        background: "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
        padding: "18px 22px 20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
    },
    previewHeader: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "14px",
    },
    previewIcon: {
        fontSize: "18px",
    },
    previewTitle: {
        fontSize: "14px",
        fontWeight: "600",
        color: "#0f172a",
    },
    previewGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: "12px",
    },
    previewItem: {
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        padding: "8px 12px",
        background: "#ffffff",
        borderRadius: "10px",
        border: "1px solid #f1f5f9",
    },
    previewLabel: {
        fontSize: "11px",
        fontWeight: "500",
        color: "#94a3b8",
        textTransform: "uppercase",
        letterSpacing: "0.3px",
    },
    previewValue: {
        fontSize: "17px",
        fontWeight: "700",
        color: "#0f172a",
    },
    previewStatus: {
        fontSize: "13px",
        fontWeight: "600",
        padding: "2px 10px",
        borderRadius: "20px",
        display: "inline-block",
        alignSelf: "flex-start",
    },
    previewStatusSuccess: {
        background: "#dcfce7",
        color: "#166534",
    },
    previewStatusWarning: {
        background: "#fef3c7",
        color: "#92400e",
    },
    previewStatusDanger: {
        background: "#fee2e2",
        color: "#991b1b",
    },

    // ─── Actions ───
    actions: {
        display: "flex",
        gap: "14px",
        marginTop: "6px",
        flexWrap: "wrap",
    },
    resetButton: {
        padding: "12px 28px",
        background: "#f1f5f9",
        color: "#475569",
        border: "1px solid #e2e8f0",
        borderRadius: "10px",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.2s",
        flex: "1 1 auto",
    },
    submitButton: {
        padding: "12px 36px",
        background: "#0f172a",
        color: "#ffffff",
        border: "none",
        borderRadius: "10px",
        fontSize: "15px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.2s",
        flex: "2 1 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        boxShadow: "0 4px 14px rgba(15, 23, 42, 0.15)",
    },
    submitButtonDisabled: {
        background: "#94a3b8",
        cursor: "not-allowed",
        opacity: 0.7,
        boxShadow: "none",
    },
    spinner: {
        display: "inline-block",
        width: "18px",
        height: "18px",
        border: "2px solid rgba(255,255,255,0.3)",
        borderTop: "2px solid #ffffff",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
    },
};

// ─── Inject hover styles ─────────────────────────────────────
const styleSheet = document.createElement("style");
styleSheet.textContent = `
    .back-link:hover {
        background: #dbeafe !important;
        color: #1d4ed8 !important;
    }
    .input:focus, .textarea:focus {
        border-color: #0f172a !important;
        box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.06) !important;
        background: #ffffff !important;
    }
    .reset-button:hover {
        background: #e2e8f0 !important;
        border-color: #cbd5e1 !important;
    }
    .submit-button:hover:not(:disabled) {
        background: #1e293b !important;
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(15, 23, 42, 0.2) !important;
    }
    .section:hover {
        border-color: #d1d9e6 !important;
    }
    .preview-item:hover {
        background: #f8fafc !important;
    }
`;
document.head.appendChild(styleSheet);