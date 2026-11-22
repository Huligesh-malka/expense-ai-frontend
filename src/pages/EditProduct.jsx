import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../services/api";

export default function EditProduct() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);

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
        status: "active",
    });

    useEffect(() => {
        loadProduct();
        loadCategories();
    }, [id]);

    const loadCategories = async () => {
        setLoadingCategories(true);

        try {
            const res = await API.get("/categories");
            setCategories(res.data.data || []);
        } catch (err) {
            console.error("Error loading categories:", err);

            setCategories([
                { id: "electronics", name: "Electronics" },
                { id: "clothing", name: "Clothing" },
                { id: "food", name: "Food" },
                { id: "medicine", name: "Medicine" },
                { id: "grocery", name: "Grocery" },
                { id: "restaurant", name: "Restaurant" },
                { id: "medical", name: "Medical" },
                { id: "other", name: "Other" },
            ]);
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
                const date = new Date(product.expiry_date);

                if (!isNaN(date.getTime())) {
                    expiryDate = date.toISOString().split("T")[0];
                }
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
                status: product.status || "active",
            });

            setMessage("");
        } catch (err) {
            console.error("Error loading product:", err);

            setMessage("Product not found or failed to load");
            setMessageType("error");

            setTimeout(() => {
                navigate("/products");
            }, 2000);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setSaving(true);
        setMessage("");
        setMessageType("");

        if (
            !form.product_name ||
            !form.category ||
            !form.purchase_price ||
            !form.selling_price ||
            !form.stock
        ) {
            setMessage("Please fill in all required fields");
            setMessageType("error");
            setSaving(false);
            return;
        }

        if (form.price_per <= 0) {
            setMessage("Price Per must be greater than 0");
            setMessageType("error");
            setSaving(false);
            return;
        }

        if (!form.price_unit) {
            setMessage("Please select a price unit");
            setMessageType("error");
            setSaving(false);
            return;
        }

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
                min_stock: parseInt(form.min_stock),
                image: form.image,
                description: form.description,
                expiry_date: form.expiry_date || null,
                status: form.status,
            };

            await API.put(`/products/${id}`, submitData);

            setMessage("Product updated successfully!");
            setMessageType("success");

            setTimeout(() => {
                navigate("/products");
            }, 1500);
        } catch (err) {
            console.error("Error updating product:", err);

            const errorMessage =
                err.response?.data?.message ||
                "Failed to update product. Please try again.";

            setMessage(errorMessage);
            setMessageType("error");
        } finally {
            setSaving(false);
        }
    };

    const inputStyle = {
        width: "100%",
        padding: "12px 14px",
        border: "1px solid #e2e8f0",
        borderRadius: "10px",
        background: "#ffffff",
        fontSize: "14px",
        color: "#1e293b",
        outline: "none",
        boxSizing: "border-box",
        transition: "all 0.2s ease",
    };

    const labelStyle = {
        display: "block",
        fontSize: "13px",
        fontWeight: "600",
        color: "#475569",
        marginBottom: "8px",
    };

    const fieldStyle = {
        marginBottom: "22px",
    };

    const requiredStyle = {
        color: "#ef4444",
        marginLeft: "3px",
    };

    const helperStyle = {
        color: "#94a3b8",
        fontSize: "12px",
        marginTop: "6px",
        display: "block",
    };

    const sectionStyle = {
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "16px",
        padding: "26px",
        marginBottom: "22px",
    };

    const sectionHeaderStyle = {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "24px",
        paddingBottom: "18px",
        borderBottom: "1px solid #f1f5f9",
    };

    const sectionIconStyle = {
        width: "42px",
        height: "42px",
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#eff6ff",
        color: "#2563eb",
        fontSize: "20px",
        flexShrink: 0,
    };

    const sectionTitleStyle = {
        margin: 0,
        fontSize: "16px",
        fontWeight: "700",
        color: "#0f172a",
    };

    const sectionSubtitleStyle = {
        margin: "5px 0 0",
        color: "#94a3b8",
        fontSize: "12px",
    };

    if (loading && !form.product_name) {
        return (
            <div style={styles.page}>
                <div style={styles.loadingContainer}>
                    <div style={styles.spinner}></div>
                    <h3 style={{ color: "#334155", margin: "16px 0 8px" }}>
                        Loading product
                    </h3>
                    <p style={{ color: "#94a3b8", margin: 0 }}>
                        Please wait while we load product details...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <style>{`
                * {
                    box-sizing: border-box;
                }

                .edit-product-input:focus {
                    border-color: #3b82f6 !important;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12) !important;
                    background: #ffffff !important;
                }

                .edit-product-button {
                    transition: all 0.2s ease;
                }

                .edit-product-button:hover {
                    transform: translateY(-1px);
                }

                .edit-product-cancel:hover {
                    background: #f1f5f9 !important;
                }

                .edit-product-save:hover {
                    background: #1d4ed8 !important;
                    box-shadow: 0 6px 16px rgba(37, 99, 235, 0.25);
                }

                @keyframes editProductSpin {
                    to {
                        transform: rotate(360deg);
                    }
                }

                .edit-product-spinner {
                    animation: editProductSpin 0.8s linear infinite;
                }

                @media (max-width: 768px) {
                    .edit-product-grid {
                        grid-template-columns: 1fr !important;
                    }

                    .edit-product-page {
                        padding: 15px !important;
                    }

                    .edit-product-section {
                        padding: 20px !important;
                    }

                    .edit-product-header {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                    }

                    .edit-product-actions {
                        flex-direction: column-reverse !important;
                    }

                    .edit-product-actions button {
                        width: 100% !important;
                    }
                }
            `}</style>

            {/* Page Header */}
            <div
                className="edit-product-header"
                style={styles.header}
            >
                <div>
                    <div style={styles.breadcrumb}>
                        <span
                            onClick={() => navigate("/products")}
                            style={styles.breadcrumbLink}
                        >
                            Products
                        </span>

                        <span style={{ color: "#cbd5e1" }}> / </span>

                        <span style={{ color: "#64748b" }}>
                            Edit Product
                        </span>
                    </div>

                    <h1 style={styles.pageTitle}>
                        Edit Product
                    </h1>

                    <p style={styles.pageSubtitle}>
                        Update product information, pricing and inventory details.
                    </p>
                </div>

                <div style={styles.headerBadge}>
                    <span style={styles.headerBadgeIcon}>✏️</span>
                    <div>
                        <div style={styles.headerBadgeTitle}>
                            Product Editing
                        </div>
                        <div style={styles.headerBadgeSubtitle}>
                            ID: #{id}
                        </div>
                    </div>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div
                    style={{
                        ...styles.message,
                        ...(messageType === "success"
                            ? styles.successMessage
                            : styles.errorMessage),
                    }}
                >
                    <span style={{ fontSize: "18px" }}>
                        {messageType === "success" ? "✓" : "⚠"}
                    </span>

                    <span>{message}</span>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Basic Information */}
                <div
                    className="edit-product-section"
                    style={sectionStyle}
                >
                    <div style={sectionHeaderStyle}>
                        <div style={sectionIconStyle}>
                            📦
                        </div>

                        <div>
                            <h3 style={sectionTitleStyle}>
                                Basic Information
                            </h3>

                            <p style={sectionSubtitleStyle}>
                                Product name, category and identification
                            </p>
                        </div>
                    </div>

                    <div
                        className="edit-product-grid"
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "20px",
                        }}
                    >
                        {/* Product Name */}
                        <div style={{ ...fieldStyle, gridColumn: "1 / -1" }}>
                            <label style={labelStyle}>
                                Product Name
                                <span style={requiredStyle}>*</span>
                            </label>

                            <input
                                className="edit-product-input"
                                type="text"
                                name="product_name"
                                placeholder="Enter product name"
                                value={form.product_name || ""}
                                onChange={handleChange}
                                required
                                style={inputStyle}
                            />
                        </div>

                        {/* Category */}
                        <div style={fieldStyle}>
                            <label style={labelStyle}>
                                Category
                                <span style={requiredStyle}>*</span>
                            </label>

                            <select
                                className="edit-product-input"
                                name="category"
                                value={form.category || ""}
                                onChange={handleChange}
                                required
                                disabled={loadingCategories}
                                style={inputStyle}
                            >
                                <option value="">
                                    {loadingCategories
                                        ? "Loading categories..."
                                        : "Select Category"}
                                </option>

                                {categories.map((cat) => (
                                    <option
                                        key={cat.id || cat}
                                        value={cat.id || cat}
                                    >
                                        {cat.name || cat}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Product Code */}
                        <div style={fieldStyle}>
                            <label style={labelStyle}>
                                Product Code
                            </label>

                            <input
                                className="edit-product-input"
                                type="text"
                                name="product_code"
                                placeholder="e.g. PRD-001"
                                value={form.product_code || ""}
                                onChange={handleChange}
                                style={inputStyle}
                            />
                        </div>

                        {/* Barcode */}
                        <div style={fieldStyle}>
                            <label style={labelStyle}>
                                Barcode
                            </label>

                            <input
                                className="edit-product-input"
                                type="text"
                                name="barcode"
                                placeholder="Enter barcode number"
                                value={form.barcode || ""}
                                onChange={handleChange}
                                style={inputStyle}
                            />
                        </div>

                        {/* Status */}
                        <div style={fieldStyle}>
                            <label style={labelStyle}>
                                Product Status
                            </label>

                            <select
                                className="edit-product-input"
                                name="status"
                                value={form.status || "active"}
                                onChange={handleChange}
                                style={inputStyle}
                            >
                                <option value="active">
                                    Active
                                </option>

                                <option value="inactive">
                                    Inactive
                                </option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Pricing */}
                <div
                    className="edit-product-section"
                    style={sectionStyle}
                >
                    <div style={sectionHeaderStyle}>
                        <div
                            style={{
                                ...sectionIconStyle,
                                background: "#f0fdf4",
                                color: "#16a34a",
                            }}
                        >
                            💰
                        </div>

                        <div>
                            <h3 style={sectionTitleStyle}>
                                Pricing Information
                            </h3>

                            <p style={sectionSubtitleStyle}>
                                Purchase price, selling price and unit pricing
                            </p>
                        </div>
                    </div>

                    <div
                        className="edit-product-grid"
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "20px",
                        }}
                    >
                        {/* Purchase Price */}
                        <div style={fieldStyle}>
                            <label style={labelStyle}>
                                Purchase Price
                                <span style={requiredStyle}>*</span>
                            </label>

                            <div style={styles.priceInputWrapper}>
                                <span style={styles.currencySymbol}>
                                    ₹
                                </span>

                                <input
                                    className="edit-product-input"
                                    type="number"
                                    name="purchase_price"
                                    placeholder="0.00"
                                    value={form.purchase_price || ""}
                                    onChange={handleChange}
                                    required
                                    min="0"
                                    step="0.01"
                                    style={{
                                        ...inputStyle,
                                        paddingLeft: "38px",
                                    }}
                                />
                            </div>
                        </div>

                        {/* Selling Price */}
                        <div style={fieldStyle}>
                            <label style={labelStyle}>
                                Selling Price
                                <span style={requiredStyle}>*</span>
                            </label>

                            <div style={styles.priceInputWrapper}>
                                <span style={styles.currencySymbol}>
                                    ₹
                                </span>

                                <input
                                    className="edit-product-input"
                                    type="number"
                                    name="selling_price"
                                    placeholder="0.00"
                                    value={form.selling_price || ""}
                                    onChange={handleChange}
                                    required
                                    min="0"
                                    step="0.01"
                                    style={{
                                        ...inputStyle,
                                        paddingLeft: "38px",
                                    }}
                                />
                            </div>
                        </div>

                        {/* Price Per */}
                        <div style={fieldStyle}>
                            <label style={labelStyle}>
                                Price Per
                                <span style={requiredStyle}>*</span>
                            </label>

                            <input
                                className="edit-product-input"
                                type="number"
                                name="price_per"
                                placeholder="1"
                                value={form.price_per || ""}
                                onChange={handleChange}
                                required
                                min="1"
                                step="1"
                                style={inputStyle}
                            />

                            <small style={helperStyle}>
                                Quantity per unit price
                            </small>
                        </div>

                        {/* Price Unit */}
                        <div style={fieldStyle}>
                            <label style={labelStyle}>
                                Price Unit
                                <span style={requiredStyle}>*</span>
                            </label>

                            <select
                                className="edit-product-input"
                                name="price_unit"
                                value={form.price_unit || "pcs"}
                                onChange={handleChange}
                                required
                                style={inputStyle}
                            >
                                <option value="pcs">Pieces</option>
                                <option value="kg">Kilogram</option>
                                <option value="g">Gram</option>
                                <option value="ml">Milliliter</option>
                                <option value="l">Liter</option>
                                <option value="pack">Pack</option>
                                <option value="box">Box</option>
                                <option value="bottle">Bottle</option>
                                <option value="dozen">Dozen</option>
                                <option value="meter">Meter</option>
                                <option value="feet">Feet</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Inventory */}
                <div
                    className="edit-product-section"
                    style={sectionStyle}
                >
                    <div style={sectionHeaderStyle}>
                        <div
                            style={{
                                ...sectionIconStyle,
                                background: "#fff7ed",
                                color: "#ea580c",
                            }}
                        >
                            📊
                        </div>

                        <div>
                            <h3 style={sectionTitleStyle}>
                                Inventory Information
                            </h3>

                            <p style={sectionSubtitleStyle}>
                                Stock quantity and inventory control
                            </p>
                        </div>
                    </div>

                    <div
                        className="edit-product-grid"
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "20px",
                        }}
                    >
                        {/* Stock */}
                        <div style={fieldStyle}>
                            <label style={labelStyle}>
                                Stock Quantity
                                <span style={requiredStyle}>*</span>
                            </label>

                            <input
                                className="edit-product-input"
                                type="number"
                                name="stock"
                                placeholder="0"
                                value={form.stock || ""}
                                onChange={handleChange}
                                required
                                min="0"
                                step="0.01"
                                style={inputStyle}
                            />
                        </div>

                        {/* Stock Unit */}
                        <div style={fieldStyle}>
                            <label style={labelStyle}>
                                Stock Unit
                                <span style={requiredStyle}>*</span>
                            </label>

                            <select
                                className="edit-product-input"
                                name="stock_unit"
                                value={form.stock_unit || "pcs"}
                                onChange={handleChange}
                                required
                                style={inputStyle}
                            >
                                <option value="pcs">Pieces</option>
                                <option value="kg">Kilogram</option>
                                <option value="g">Gram</option>
                                <option value="ml">Milliliter</option>
                                <option value="l">Liter</option>
                                <option value="pack">Pack</option>
                                <option value="box">Box</option>
                                <option value="bottle">Bottle</option>
                                <option value="dozen">Dozen</option>
                                <option value="meter">Meter</option>
                                <option value="feet">Feet</option>
                            </select>
                        </div>

                        {/* Minimum Stock */}
                        <div style={fieldStyle}>
                            <label style={labelStyle}>
                                Minimum Stock
                            </label>

                            <input
                                className="edit-product-input"
                                type="number"
                                name="min_stock"
                                placeholder="5"
                                value={form.min_stock || ""}
                                onChange={handleChange}
                                min="0"
                                step="1"
                                style={inputStyle}
                            />

                            <small style={helperStyle}>
                                Alert when stock reaches this quantity
                            </small>
                        </div>

                        {/* Expiry */}
                        <div style={fieldStyle}>
                            <label style={labelStyle}>
                                Expiry Date
                            </label>

                            <input
                                className="edit-product-input"
                                type="date"
                                name="expiry_date"
                                value={form.expiry_date || ""}
                                onChange={handleChange}
                                style={inputStyle}
                            />

                            <small style={helperStyle}>
                                Leave empty if product doesn't have an expiry date
                            </small>
                        </div>
                    </div>
                </div>

                {/* Additional Details */}
                <div
                    className="edit-product-section"
                    style={sectionStyle}
                >
                    <div style={sectionHeaderStyle}>
                        <div
                            style={{
                                ...sectionIconStyle,
                                background: "#f5f3ff",
                                color: "#7c3aed",
                            }}
                        >
                            📝
                        </div>

                        <div>
                            <h3 style={sectionTitleStyle}>
                                Additional Details
                            </h3>

                            <p style={sectionSubtitleStyle}>
                                Product description and image
                            </p>
                        </div>
                    </div>

                    {/* Description */}
                    <div style={fieldStyle}>
                        <label style={labelStyle}>
                            Description
                        </label>

                        <textarea
                            className="edit-product-input"
                            name="description"
                            placeholder="Enter product description..."
                            rows="4"
                            value={form.description || ""}
                            onChange={handleChange}
                            style={{
                                ...inputStyle,
                                resize: "vertical",
                                minHeight: "110px",
                                fontFamily: "inherit",
                            }}
                        />
                    </div>

                    {/* Image */}
                    <div style={fieldStyle}>
                        <label style={labelStyle}>
                            Product Image URL
                        </label>

                        <input
                            className="edit-product-input"
                            type="text"
                            name="image"
                            placeholder="https://example.com/product-image.jpg"
                            value={form.image || ""}
                            onChange={handleChange}
                            style={inputStyle}
                        />

                        {form.image && (
                            <div style={styles.imagePreview}>
                                <img
                                    src={form.image}
                                    alt="Product preview"
                                    style={styles.previewImage}
                                    onError={(e) => {
                                        e.target.style.display = "none";
                                    }}
                                />

                                <div>
                                    <div style={styles.previewTitle}>
                                        Image Preview
                                    </div>

                                    <div style={styles.previewSubtitle}>
                                        Product image URL
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Actions */}
                <div
                    className="edit-product-actions"
                    style={styles.actions}
                >
                    <button
                        type="button"
                        className="edit-product-button edit-product-cancel"
                        onClick={() => navigate("/products")}
                        style={styles.cancelButton}
                    >
                        ← Cancel
                    </button>

                    <button
                        type="submit"
                        disabled={saving}
                        className="edit-product-button edit-product-save"
                        style={{
                            ...styles.saveButton,
                            ...(saving ? styles.disabledButton : {}),
                        }}
                    >
                        {saving ? (
                            <>
                                <span
                                    className="edit-product-spinner"
                                    style={styles.buttonSpinner}
                                ></span>

                                Saving Changes...
                            </>
                        ) : (
                            <>
                                <span>✓</span>
                                Update Product
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "30px",
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },

    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "28px",
        gap: "20px",
    },

    breadcrumb: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "13px",
        marginBottom: "12px",
    },

    breadcrumbLink: {
        color: "#2563eb",
        cursor: "pointer",
        fontWeight: "500",
    },

    pageTitle: {
        fontSize: "28px",
        fontWeight: "800",
        color: "#0f172a",
        margin: "0 0 8px",
        letterSpacing: "-0.5px",
    },

    pageSubtitle: {
        fontSize: "14px",
        color: "#64748b",
        margin: 0,
    },

    headerBadge: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "14px 18px",
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
    },

    headerBadgeIcon: {
        width: "42px",
        height: "42px",
        background: "#eff6ff",
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "20px",
    },

    headerBadgeTitle: {
        fontSize: "13px",
        fontWeight: "700",
        color: "#334155",
    },

    headerBadgeSubtitle: {
        fontSize: "12px",
        color: "#94a3b8",
        marginTop: "4px",
    },

    message: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "15px 18px",
        borderRadius: "12px",
        marginBottom: "22px",
        fontSize: "14px",
        fontWeight: "500",
    },

    successMessage: {
        background: "#f0fdf4",
        border: "1px solid #bbf7d0",
        color: "#166534",
    },

    errorMessage: {
        background: "#fef2f2",
        border: "1px solid #fecaca",
        color: "#991b1b",
    },

    priceInputWrapper: {
        position: "relative",
    },

    currencySymbol: {
        position: "absolute",
        left: "14px",
        top: "50%",
        transform: "translateY(-50%)",
        fontSize: "14px",
        fontWeight: "600",
        color: "#64748b",
        zIndex: 1,
    },

    imagePreview: {
        display: "flex",
        alignItems: "center",
        gap: "14px",
        marginTop: "14px",
        padding: "14px",
        background: "#f8fafc",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
    },

    previewImage: {
        width: "60px",
        height: "60px",
        objectFit: "cover",
        borderRadius: "10px",
        border: "1px solid #e2e8f0",
        background: "#ffffff",
    },

    previewTitle: {
        fontSize: "13px",
        fontWeight: "600",
        color: "#334155",
    },

    previewSubtitle: {
        fontSize: "12px",
        color: "#94a3b8",
        marginTop: "5px",
    },

    actions: {
        display: "flex",
        justifyContent: "flex-end",
        gap: "12px",
        padding: "20px",
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "16px",
        marginBottom: "30px",
    },

    cancelButton: {
        padding: "13px 24px",
        background: "#ffffff",
        color: "#475569",
        border: "1px solid #e2e8f0",
        borderRadius: "10px",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
        minWidth: "120px",
    },

    saveButton: {
        padding: "13px 28px",
        background: "#2563eb",
        color: "#ffffff",
        border: "none",
        borderRadius: "10px",
        fontSize: "14px",
        fontWeight: "700",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        minWidth: "180px",
        boxShadow: "0 4px 12px rgba(37, 99, 235, 0.15)",
    },

    disabledButton: {
        opacity: 0.7,
        cursor: "not-allowed",
    },

    buttonSpinner: {
        width: "16px",
        height: "16px",
        border: "2px solid rgba(255,255,255,0.4)",
        borderTop: "2px solid #ffffff",
        borderRadius: "50%",
        display: "inline-block",
    },

    loadingContainer: {
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffff",
        borderRadius: "16px",
        border: "1px solid #e5e7eb",
    },

    spinner: {
        width: "42px",
        height: "42px",
        border: "4px solid #e2e8f0",
        borderTop: "4px solid #2563eb",
        borderRadius: "50%",
        animation: "editProductSpin 0.8s linear infinite",
    },
};