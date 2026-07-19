import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../services/api";

export default function EditProduct() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

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
        tax: 0,
        image: "",
        description: "",
        expiry_date: "",
        status: "active"
    });

    useEffect(() => {
        loadProduct();
    }, [id]);

    const loadProduct = async () => {
        setLoading(true);
        try {
            const res = await API.get(`/products/${id}`);
            const product = res.data.data;
            
            // Format expiry date for input if it exists
            let expiryDate = "";
            if (product.expiry_date) {
                const date = new Date(product.expiry_date);
                expiryDate = date.toISOString().split('T')[0];
            }
            
            setForm({
                ...product,
                stock_unit: product.unit || "pcs",
                price_unit: product.price_unit || "pcs",
                price_per: product.price_per || 1,
                expiry_date: expiryDate
            });
            
            setMessage("");
        } catch (err) {
            console.error("Error loading product:", err);
            setMessage("❌ Product not found or failed to load");
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
        
        // If price_unit changes, also update stock_unit to match
        if (name === "price_unit") {
            setForm(prev => ({
                ...prev,
                price_unit: value,
                stock_unit: value
            }));
            return;
        }
        
        setForm({
            ...form,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");
        setMessageType("");

        // Validate required fields
        if (!form.product_name || !form.category || !form.purchase_price || 
            !form.selling_price || !form.stock) {
            setMessage("❌ Please fill in all required fields");
            setMessageType("error");
            setLoading(false);
            return;
        }

        // Validate price_per
        if (form.price_per <= 0) {
            setMessage("❌ Price Per must be greater than 0");
            setMessageType("error");
            setLoading(false);
            return;
        }

        // Validate price_unit
        if (!form.price_unit) {
            setMessage("❌ Please select a price unit");
            setMessageType("error");
            setLoading(false);
            return;
        }

        try {
            // Prepare data for backend - map stock_unit to unit
            const submitData = {
                ...form,
                unit: form.stock_unit,
                // Only send expiry_date if it has a value
                expiry_date: form.expiry_date || null
            };
            
            const res = await API.put(`/products/${id}`, submitData);
            setMessage("✅ Product updated successfully!");
            setMessageType("success");
            
            // Navigate after 2 seconds
            setTimeout(() => {
                navigate("/products");
            }, 2000);
        } catch (err) {
            console.error("Error updating product:", err);
            const errorMessage = err.response?.data?.message || "Failed to update product. Please try again.";
            setMessage(`❌ ${errorMessage}`);
            setMessageType("error");
        } finally {
            setLoading(false);
        }
    };

    // Show loading state while fetching product
    if (loading && !form.product_name) {
        return (
            <div style={styles.container}>
                <div style={styles.loadingState}>
                    <div style={styles.spinner}></div>
                    <p>Loading product details...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Edit Product</h2>
            
            {message && (
                <div style={{
                    ...styles.message,
                    ...(messageType === "success" ? styles.successMessage : styles.errorMessage)
                }}>
                    {message}
                </div>
            )}
            
            <form onSubmit={handleSubmit} style={styles.form}>
                {/* Product Name */}
                <div style={styles.formGroup}>
                    <label style={styles.label}>
                        Product Name <span style={styles.required}>*</span>
                    </label>
                    <input
                        type="text"
                        name="product_name"
                        placeholder="Enter product name"
                        value={form.product_name || ""}
                        onChange={handleChange}
                        required
                        style={styles.input}
                    />
                </div>

                {/* Category */}
                <div style={styles.formGroup}>
                    <label style={styles.label}>
                        Category <span style={styles.required}>*</span>
                    </label>
                    <select
                        name="category"
                        value={form.category || ""}
                        onChange={handleChange}
                        required
                        style={styles.input}
                    >
                        <option value="">Select Category</option>
                        <option value="electronics">Electronics</option>
                        <option value="clothing">Clothing</option>
                        <option value="food">Food</option>
                        <option value="medicine">Medicine</option>
                        <option value="grocery">Grocery</option>
                        <option value="restaurant">Restaurant</option>
                        <option value="medical">Medical</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                {/* Product Code & Barcode */}
                <div style={styles.row}>
                    <div style={styles.formGroupHalf}>
                        <label style={styles.label}>Product Code</label>
                        <input
                            type="text"
                            name="product_code"
                            placeholder="e.g., PRD-001"
                            value={form.product_code || ""}
                            onChange={handleChange}
                            style={styles.input}
                        />
                    </div>
                    <div style={styles.formGroupHalf}>
                        <label style={styles.label}>Barcode</label>
                        <input
                            type="text"
                            name="barcode"
                            placeholder="Enter barcode"
                            value={form.barcode || ""}
                            onChange={handleChange}
                            style={styles.input}
                        />
                    </div>
                </div>

                {/* Purchase & Selling Price */}
                <div style={styles.row}>
                    <div style={styles.formGroupHalf}>
                        <label style={styles.label}>
                            Purchase Price <span style={styles.required}>*</span>
                        </label>
                        <input
                            type="number"
                            name="purchase_price"
                            placeholder="0.00"
                            value={form.purchase_price || ""}
                            onChange={handleChange}
                            required
                            min="0"
                            step="0.01"
                            style={styles.input}
                        />
                    </div>
                    <div style={styles.formGroupHalf}>
                        <label style={styles.label}>
                            Selling Price <span style={styles.required}>*</span>
                        </label>
                        <input
                            type="number"
                            name="selling_price"
                            placeholder="0.00"
                            value={form.selling_price || ""}
                            onChange={handleChange}
                            required
                            min="0"
                            step="0.01"
                            style={styles.input}
                        />
                    </div>
                </div>

                {/* Price Per & Price Unit */}
                <div style={styles.row}>
                    <div style={styles.formGroupHalf}>
                        <label style={styles.label}>
                            Price Per <span style={styles.required}>*</span>
                        </label>
                        <input
                            type="number"
                            name="price_per"
                            placeholder="1"
                            value={form.price_per || ""}
                            onChange={handleChange}
                            required
                            min="1"
                            step="1"
                            style={styles.input}
                        />
                    </div>
                    <div style={styles.formGroupHalf}>
                        <label style={styles.label}>
                            Price Unit <span style={styles.required}>*</span>
                        </label>
                        <select
                            name="price_unit"
                            value={form.price_unit || "pcs"}
                            onChange={handleChange}
                            required
                            style={styles.input}
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

                {/* Stock Quantity & Stock Unit */}
                <div style={styles.row}>
                    <div style={styles.formGroupHalf}>
                        <label style={styles.label}>
                            Stock Quantity <span style={styles.required}>*</span>
                        </label>
                        <input
                            type="number"
                            name="stock"
                            placeholder="0"
                            value={form.stock || ""}
                            onChange={handleChange}
                            required
                            min="0"
                            style={styles.input}
                        />
                    </div>
                    <div style={styles.formGroupHalf}>
                        <label style={styles.label}>
                            Stock Unit <span style={styles.required}>*</span>
                        </label>
                        <select
                            name="stock_unit"
                            value={form.stock_unit || "pcs"}
                            onChange={handleChange}
                            required
                            style={styles.input}
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

                {/* Minimum Stock & Tax */}
                <div style={styles.row}>
                    <div style={styles.formGroupHalf}>
                        <label style={styles.label}>Minimum Stock</label>
                        <input
                            type="number"
                            name="min_stock"
                            placeholder="5"
                            value={form.min_stock || ""}
                            onChange={handleChange}
                            min="0"
                            style={styles.input}
                        />
                    </div>
                    <div style={styles.formGroupHalf}>
                        <label style={styles.label}>Tax (%)</label>
                        <input
                            type="number"
                            name="tax"
                            placeholder="0"
                            value={form.tax || ""}
                            onChange={handleChange}
                            min="0"
                            max="100"
                            step="0.01"
                            style={styles.input}
                        />
                    </div>
                </div>

                {/* Expiry Date */}
                <div style={styles.formGroup}>
                    <label style={styles.label}>Expiry Date</label>
                    <input
                        type="date"
                        name="expiry_date"
                        value={form.expiry_date || ""}
                        onChange={handleChange}
                        min={new Date().toISOString().split('T')[0]}
                        style={styles.input}
                    />
                    <small style={styles.helperText}>
                        Leave empty if product doesn't have an expiry date
                    </small>
                </div>

                {/* Description */}
                <div style={styles.formGroup}>
                    <label style={styles.label}>Description</label>
                    <textarea
                        name="description"
                        placeholder="Enter product description"
                        rows="3"
                        value={form.description || ""}
                        onChange={handleChange}
                        style={styles.textarea}
                    />
                </div>

                {/* Image URL */}
                <div style={styles.formGroup}>
                    <label style={styles.label}>Image URL</label>
                    <input
                        type="text"
                        name="image"
                        placeholder="https://example.com/image.jpg"
                        value={form.image || ""}
                        onChange={handleChange}
                        style={styles.input}
                    />
                </div>

                {/* Status */}
                <div style={styles.formGroup}>
                    <label style={styles.label}>
                        Status <span style={styles.required}>*</span>
                    </label>
                    <select
                        name="status"
                        value={form.status || "active"}
                        onChange={handleChange}
                        required
                        style={styles.input}
                    >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>

                {/* Buttons */}
                <div style={styles.buttonGroup}>
                    <button
                        type="button"
                        onClick={() => navigate("/products")}
                        style={styles.cancelButton}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            ...styles.submitButton,
                            ...(loading ? styles.buttonDisabled : {})
                        }}
                    >
                        {loading ? (
                            <>
                                <span style={styles.spinner}></span>
                                Updating...
                            </>
                        ) : (
                            "Update Product"
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

const styles = {
    container: {
        maxWidth: "700px",
        margin: "40px auto",
        padding: "35px",
        background: "#ffffff",
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
        border: "1px solid #e5e7eb"
    },
    title: {
        fontSize: "24px",
        fontWeight: "600",
        color: "#111827",
        margin: "0 0 25px 0",
        paddingBottom: "15px",
        borderBottom: "2px solid #f3f4f6"
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "18px"
    },
    formGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "6px"
    },
    formGroupHalf: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        flex: 1
    },
    label: {
        fontSize: "14px",
        fontWeight: "500",
        color: "#374151"
    },
    required: {
        color: "#ef4444"
    },
    input: {
        padding: "10px 14px",
        border: "1px solid #d1d5db",
        borderRadius: "8px",
        fontSize: "14px",
        width: "100%",
        boxSizing: "border-box",
        transition: "border-color 0.2s",
        backgroundColor: "#f9fafb"
    },
    textarea: {
        padding: "10px 14px",
        border: "1px solid #d1d5db",
        borderRadius: "8px",
        fontSize: "14px",
        width: "100%",
        boxSizing: "border-box",
        resize: "vertical",
        minHeight: "80px",
        fontFamily: "inherit",
        backgroundColor: "#f9fafb",
        transition: "border-color 0.2s"
    },
    helperText: {
        fontSize: "12px",
        color: "#6b7280",
        marginTop: "2px"
    },
    row: {
        display: "flex",
        gap: "16px"
    },
    buttonGroup: {
        display: "flex",
        gap: "12px",
        marginTop: "10px"
    },
    submitButton: {
        padding: "14px",
        background: "#2563eb",
        color: "#ffffff",
        border: "none",
        borderRadius: "8px",
        fontSize: "16px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "background 0.2s",
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px"
    },
    cancelButton: {
        padding: "14px",
        background: "#f3f4f6",
        color: "#374151",
        border: "1px solid #d1d5db",
        borderRadius: "8px",
        fontSize: "16px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "background 0.2s",
        flex: 0.4
    },
    buttonDisabled: {
        background: "#93c5fd",
        cursor: "not-allowed",
        opacity: 0.7
    },
    message: {
        padding: "12px 16px",
        marginBottom: "20px",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: "500"
    },
    successMessage: {
        background: "#f0fdf4",
        color: "#166534",
        border: "1px solid #bbf7d0"
    },
    errorMessage: {
        background: "#fef2f2",
        color: "#991b1b",
        border: "1px solid #fecaca"
    },
    spinner: {
        display: "inline-block",
        width: "16px",
        height: "16px",
        border: "2px solid #ffffff",
        borderTop: "2px solid transparent",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite"
    },
    loadingState: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px",
        gap: "16px"
    }
};

// Add keyframe animation for spinner
const styleSheet = document.createElement("style");
styleSheet.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(styleSheet);