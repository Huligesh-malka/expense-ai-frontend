import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../services/api";

const CATEGORIES = [
    { value: "electronics", label: "Electronics" },
    { value: "clothing", label: "Clothing" },
    { value: "food", label: "Food" },
    { value: "medicine", label: "Medicine" },
    { value: "grocery", label: "Grocery" },
    { value: "restaurant", label: "Restaurant" },
    { value: "medical", label: "Medical" },
    { value: "cosmetics", label: "Cosmetics" },
    { value: "other", label: "Other" },
];

const UNITS = [
    { value: "pcs", label: "Pieces" },
    { value: "g", label: "Gram" },
    { value: "kg", label: "Kilogram" },
    { value: "ml", label: "Milliliter" },
    { value: "l", label: "Liter" },
    { value: "pack", label: "Pack" },
    { value: "box", label: "Box" },
    { value: "bottle", label: "Bottle" },
    { value: "dozen", label: "Dozen" },
    { value: "meter", label: "Meter" },
    { value: "feet", label: "Feet" },
];

const INITIAL_FORM = {
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
    status: "active",
};

const formatDateForInput = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
};

const normalizeText = (value) => String(value ?? "").trim();

const getErrorMessage = (error, fallback) =>
    error?.response?.data?.message || fallback;

export default function EditProduct() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState(INITIAL_FORM);
    const [initialProduct, setInitialProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [nameCheck, setNameCheck] = useState({ status: "idle" });
    const [barcodeCheck, setBarcodeCheck] = useState({ status: "idle" });

    useEffect(() => {
        let cancelled = false;

        const loadProduct = async () => {
            if (!id) {
                setMessage("Product ID is missing.");
                setMessageType("error");
                setLoading(false);
                return;
            }

            setLoading(true);
            setMessage("");
            setMessageType("");

            try {
                const res = await API.get(`/products/${encodeURIComponent(id)}`);
                const product = res.data?.data;

                if (!product) {
                    throw new Error("Product data was not returned.");
                }

                if (cancelled) return;

                const nextForm = {
                    category: product.category || "",
                    product_name: product.product_name || "",
                    product_code: product.product_code || "",
                    barcode: product.barcode || "",
                    purchase_price: product.purchase_price ?? "",
                    selling_price: product.selling_price ?? "",
                    price_per: product.price_per ?? 1,
                    price_unit: product.price_unit || product.unit || "pcs",
                    stock: product.stock ?? "",
                    stock_unit: product.unit || "pcs",
                    min_stock: product.min_stock ?? 5,
                    tax: product.tax ?? 0,
                    image: product.image || "",
                    description: product.description || "",
                    expiry_date: formatDateForInput(product.expiry_date),
                    status: product.status || "active",
                };

                setForm(nextForm);
                setInitialProduct(product);
                setNameCheck({ status: "idle" });
                setBarcodeCheck({ status: "idle" });
            } catch (error) {
                if (cancelled) return;

                console.error("Error loading product:", error);
                setMessage(
                    getErrorMessage(error, "Product not found or failed to load.")
                );
                setMessageType("error");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadProduct();

        return () => {
            cancelled = true;
        };
    }, [id]);

    const purchaseNum = Number(form.purchase_price);
    const sellingNum = Number(form.selling_price);
    const pricePerNum = Number(form.price_per);
    const stockNum = Number(form.stock);
    const minStockNum = Number(form.min_stock);
    const taxNum = Number(form.tax);

    const isValidPurchasePrice = Number.isFinite(purchaseNum) && purchaseNum >= 0;
    const isValidSellingPrice = Number.isFinite(sellingNum) && sellingNum > 0;
    const isValidPricePer = Number.isFinite(pricePerNum) && pricePerNum > 0;
    const isValidStock = Number.isFinite(stockNum) && stockNum >= 0;
    const isValidMinStock = Number.isFinite(minStockNum) && minStockNum >= 0;
    const isValidTax = Number.isFinite(taxNum) && taxNum >= 0 && taxNum <= 100;

    const profit = useMemo(
        () => sellingNum - purchaseNum,
        [sellingNum, purchaseNum]
    );

    const profitMargin = useMemo(
        () => (purchaseNum > 0 ? (profit / purchaseNum) * 100 : 0),
        [profit, purchaseNum]
    );

    const hasChanges = useMemo(() => {
        if (!initialProduct) return false;

        return (
            normalizeText(form.category) !== normalizeText(initialProduct.category) ||
            normalizeText(form.product_name) !== normalizeText(initialProduct.product_name) ||
            normalizeText(form.product_code) !== normalizeText(initialProduct.product_code) ||
            normalizeText(form.barcode) !== normalizeText(initialProduct.barcode) ||
            Number(form.purchase_price) !== Number(initialProduct.purchase_price) ||
            Number(form.selling_price) !== Number(initialProduct.selling_price) ||
            Number(form.price_per) !== Number(initialProduct.price_per || 1) ||
            normalizeText(form.price_unit) !== normalizeText(initialProduct.price_unit || initialProduct.unit || "pcs") ||
            Number(form.stock) !== Number(initialProduct.stock) ||
            normalizeText(form.stock_unit) !== normalizeText(initialProduct.unit || "pcs") ||
            Number(form.min_stock) !== Number(initialProduct.min_stock ?? 5) ||
            Number(form.tax) !== Number(initialProduct.tax || 0) ||
            normalizeText(form.image) !== normalizeText(initialProduct.image) ||
            normalizeText(form.description) !== normalizeText(initialProduct.description) ||
            normalizeText(form.expiry_date) !== formatDateForInput(initialProduct.expiry_date) ||
            normalizeText(form.status) !== normalizeText(initialProduct.status || "active")
        );
    }, [form, initialProduct]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((prev) => {
            if (name === "price_unit") {
                return {
                    ...prev,
                    price_unit: value,
                    stock_unit: value,
                };
            }

            return {
                ...prev,
                [name]: value,
            };
        });

        if (messageType === "error") {
            setMessage("");
            setMessageType("");
        }

        if (name === "product_name") {
            setNameCheck({ status: "idle" });
        }

        if (name === "barcode") {
            setBarcodeCheck({ status: "idle" });
        }
    };

    // Duplicate name check. The backend remains the final authority.
    useEffect(() => {
        const name = normalizeText(form.product_name);

        if (!name || name.length < 2 || !id) {
            setNameCheck({ status: "idle" });
            return;
        }

        const originalName = normalizeText(initialProduct?.product_name);

        if (name.toLowerCase() === originalName.toLowerCase()) {
            setNameCheck({ status: "same" });
            return;
        }

        let cancelled = false;
        const timer = setTimeout(async () => {
            setNameCheck({ status: "checking" });

            try {
                const response = await API.get("/products", {
                    params: {
                        search: name,
                        limit: 20,
                    },
                });

                const products = response.data?.data || [];
                const exists = products.some(
                    (product) =>
                        String(product.id) !== String(id) &&
                        normalizeText(product.product_name).toLowerCase() ===
                            name.toLowerCase()
                );

                if (!cancelled) {
                    setNameCheck({ status: exists ? "exists" : "new" });
                }
            } catch (error) {
                if (!cancelled) {
                    console.error("Product name check failed:", error);
                    setNameCheck({ status: "idle" });
                }
            }
        }, 500);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [form.product_name, id, initialProduct]);

    // Duplicate barcode check. A 404 means barcode is unused.
    useEffect(() => {
        const barcode = normalizeText(form.barcode);

        if (!barcode || !id) {
            setBarcodeCheck({ status: "idle" });
            return;
        }

        const originalBarcode = normalizeText(initialProduct?.barcode);

        if (barcode === originalBarcode && originalBarcode) {
            setBarcodeCheck({ status: "same" });
            return;
        }

        let cancelled = false;
        const timer = setTimeout(async () => {
            setBarcodeCheck({ status: "checking" });

            try {
                const response = await API.get(
                    `/products/barcode/${encodeURIComponent(barcode)}`
                );

                const existingProduct = response.data?.data;
                const exists =
                    Boolean(existingProduct) &&
                    String(existingProduct.id) !== String(id);

                if (!cancelled) {
                    setBarcodeCheck({ status: exists ? "exists" : "new" });
                }
            } catch (error) {
                if (cancelled) return;

                if (error.response?.status === 404) {
                    setBarcodeCheck({ status: "new" });
                } else {
                    console.error("Barcode check failed:", error);
                    setBarcodeCheck({ status: "idle" });
                }
            }
        }, 600);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [form.barcode, id, initialProduct]);

    const validateForm = () => {
        const productName = normalizeText(form.product_name);
        const category = normalizeText(form.category);

        if (!productName || productName.length < 2) {
            return "Product name must contain at least 2 characters.";
        }

        if (!category) {
            return "Please select a product category.";
        }

        if (!isValidPurchasePrice) {
            return "Purchase price cannot be negative.";
        }

        if (!isValidSellingPrice) {
            return "Selling price must be greater than 0.";
        }

        if (!isValidPricePer) {
            return "Price quantity must be greater than 0.";
        }

        if (!form.price_unit) {
            return "Please select a price unit.";
        }

        if (!isValidStock) {
            return "Stock must be 0 or greater.";
        }

        if (!isValidMinStock) {
            return "Minimum stock cannot be negative.";
        }

        if (!isValidTax) {
            return "Tax rate must be between 0% and 100%.";
        }

        if (nameCheck.status === "checking") {
            return "Please wait while the product name is checked.";
        }

        if (nameCheck.status === "exists") {
            return "Product name already exists in this business.";
        }

        if (barcodeCheck.status === "checking") {
            return "Please wait while the barcode is checked.";
        }

        if (barcodeCheck.status === "exists") {
            return "Barcode already exists for another product in this business.";
        }

        return null;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (saving) return;

        const validationError = validateForm();
        if (validationError) {
            setMessage(validationError);
            setMessageType("error");
            return;
        }

        const submitData = {
            category: normalizeText(form.category),
            product_name: normalizeText(form.product_name),
            product_code: normalizeText(form.product_code),
            barcode: normalizeText(form.barcode),
            purchase_price: purchaseNum,
            selling_price: sellingNum,
            price_per: pricePerNum,
            price_unit: form.price_unit,
            stock: stockNum,
            unit: form.stock_unit || form.price_unit,
            min_stock: minStockNum,
            tax: taxNum,
            image: normalizeText(form.image),
            description: normalizeText(form.description),
            expiry_date: form.expiry_date || null,
            status: form.status || "active",
        };

        try {
            setSaving(true);
            setMessage("");
            setMessageType("");

            const response = await API.put(`/products/${encodeURIComponent(id)}`, submitData);

            const updatedProduct = response.data?.data;
            if (updatedProduct) {
                setInitialProduct(updatedProduct);
                setForm((prev) => ({
                    ...prev,
                    category: updatedProduct.category || prev.category,
                    product_name: updatedProduct.product_name || prev.product_name,
                    product_code: updatedProduct.product_code || "",
                    barcode: updatedProduct.barcode || "",
                    purchase_price: updatedProduct.purchase_price ?? prev.purchase_price,
                    selling_price: updatedProduct.selling_price ?? prev.selling_price,
                    price_per: updatedProduct.price_per ?? prev.price_per,
                    price_unit: updatedProduct.price_unit || updatedProduct.unit || prev.price_unit,
                    stock: updatedProduct.stock ?? prev.stock,
                    stock_unit: updatedProduct.unit || prev.stock_unit,
                    min_stock: updatedProduct.min_stock ?? prev.min_stock,
                    tax: updatedProduct.tax ?? prev.tax,
                    image: updatedProduct.image || "",
                    description: updatedProduct.description || "",
                    expiry_date: formatDateForInput(updatedProduct.expiry_date),
                    status: updatedProduct.status || "active",
                }));
            }

            setMessage(response.data?.message || "Product updated successfully!");
            setMessageType("success");

            window.setTimeout(() => {
                navigate("/products");
            }, 1200);
        } catch (error) {
            console.error("Error updating product:", error);
            console.error("Backend response:", error.response?.data);

            setMessage(
                getErrorMessage(error, "Failed to update product. Please try again.")
            );
            setMessageType("error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div>
                <EditProductStyles />
                <div style={styles.container}>
                <div style={styles.loadingState} role="status" aria-live="polite">
                    <div style={styles.spinner}></div>
                    <p>Loading product details...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <EditProductStyles />
            <div style={styles.container}>
            <div style={styles.headerRow}>
                <div>
                    <h2 style={styles.title}>Edit Product</h2>
                    <p style={styles.subtitle}>Update product, pricing and inventory details.</p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate("/products")}
                    style={styles.backButton}
                    disabled={saving}
                >
                    Back to products
                </button>
            </div>

            {message && (
                <div
                    style={{
                        ...styles.message,
                        ...(messageType === "success"
                            ? styles.successMessage
                            : styles.errorMessage),
                    }}
                    role="alert"
                >
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit} style={styles.form} noValidate>
                <div style={styles.formGroup}>
                    <label htmlFor="edit-product-name" style={styles.label}>
                        Product Name <span style={styles.required}>*</span>
                    </label>
                    <input
                        id="edit-product-name"
                        type="text"
                        name="product_name"
                        placeholder="Enter product name"
                        value={form.product_name}
                        onChange={handleChange}
                        autoComplete="off"
                        maxLength={120}
                        style={styles.input}
                    />
                    {nameCheck.status === "checking" && (
                        <small style={styles.checkingText}>Checking product name...</small>
                    )}
                    {nameCheck.status === "exists" && (
                        <small style={styles.errorHint}>Product name already exists.</small>
                    )}
                    {nameCheck.status === "new" && (
                        <small style={styles.successHint}>Product name is available.</small>
                    )}
                </div>

                <div style={styles.formGroup}>
                    <label htmlFor="edit-product-category" style={styles.label}>
                        Category <span style={styles.required}>*</span>
                    </label>
                    <select
                        id="edit-product-category"
                        name="category"
                        value={form.category}
                        onChange={handleChange}
                        style={styles.input}
                    >
                        <option value="">Select Category</option>
                        {CATEGORIES.map((category) => (
                            <option key={category.value} value={category.value}>
                                {category.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={styles.row} className="edit-product-responsive-row">
                    <div style={styles.formGroupHalf}>
                        <label htmlFor="edit-product-code" style={styles.label}>Product Code</label>
                        <input
                            id="edit-product-code"
                            type="text"
                            name="product_code"
                            placeholder="PRD-001"
                            value={form.product_code}
                            onChange={handleChange}
                            autoComplete="off"
                            maxLength={64}
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.formGroupHalf}>
                        <label htmlFor="edit-product-barcode" style={styles.label}>Barcode</label>
                        <input
                            id="edit-product-barcode"
                            type="text"
                            name="barcode"
                            placeholder="Enter barcode"
                            value={form.barcode}
                            onChange={handleChange}
                            autoComplete="off"
                            inputMode="numeric"
                            maxLength={64}
                            style={styles.input}
                        />
                        {barcodeCheck.status === "checking" && (
                            <small style={styles.checkingText}>Checking barcode...</small>
                        )}
                        {barcodeCheck.status === "exists" && (
                            <small style={styles.errorHint}>Barcode already exists.</small>
                        )}
                        {barcodeCheck.status === "new" && (
                            <small style={styles.successHint}>Barcode is available.</small>
                        )}
                    </div>
                </div>

                <div style={styles.row} className="edit-product-responsive-row">
                    <div style={styles.formGroupHalf}>
                        <label htmlFor="edit-purchase-price" style={styles.label}>
                            Purchase Price <span style={styles.required}>*</span>
                        </label>
                        <input
                            id="edit-purchase-price"
                            type="number"
                            name="purchase_price"
                            min="0"
                            step="0.01"
                            inputMode="decimal"
                            value={form.purchase_price}
                            onChange={handleChange}
                            autoComplete="off"
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.formGroupHalf}>
                        <label htmlFor="edit-selling-price" style={styles.label}>
                            Selling Price <span style={styles.required}>*</span>
                        </label>
                        <input
                            id="edit-selling-price"
                            type="number"
                            name="selling_price"
                            min="0.01"
                            step="0.01"
                            inputMode="decimal"
                            value={form.selling_price}
                            onChange={handleChange}
                            autoComplete="off"
                            style={styles.input}
                        />
                    </div>
                </div>

                <div style={styles.priceSummary}>
                    <span>Current margin</span>
                    <strong style={{ color: profit >= 0 ? "#166534" : "#b91c1c" }}>
                        ₹{Number.isFinite(profit) ? profit.toFixed(2) : "0.00"} / {Number.isFinite(profitMargin) ? profitMargin.toFixed(1) : "0.0"}%
                    </strong>
                </div>

                <div style={styles.row} className="edit-product-responsive-row">
                    <div style={styles.formGroupHalf}>
                        <label htmlFor="edit-price-per" style={styles.label}>
                            Price Quantity <span style={styles.required}>*</span>
                        </label>
                        <input
                            id="edit-price-per"
                            type="number"
                            name="price_per"
                            min="0.01"
                            step="0.01"
                            inputMode="decimal"
                            value={form.price_per}
                            onChange={handleChange}
                            autoComplete="off"
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.formGroupHalf}>
                        <label htmlFor="edit-price-unit" style={styles.label}>
                            Price Unit <span style={styles.required}>*</span>
                        </label>
                        <select
                            id="edit-price-unit"
                            name="price_unit"
                            value={form.price_unit}
                            onChange={handleChange}
                            style={styles.input}
                        >
                            {UNITS.map((unit) => (
                                <option key={unit.value} value={unit.value}>
                                    {unit.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div style={styles.row} className="edit-product-responsive-row">
                    <div style={styles.formGroupHalf}>
                        <label htmlFor="edit-stock" style={styles.label}>
                            Stock Quantity <span style={styles.required}>*</span>
                        </label>
                        <input
                            id="edit-stock"
                            type="number"
                            name="stock"
                            min="0"
                            step="0.01"
                            inputMode="decimal"
                            value={form.stock}
                            onChange={handleChange}
                            autoComplete="off"
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.formGroupHalf}>
                        <label htmlFor="edit-stock-unit" style={styles.label}>
                            Stock Unit <span style={styles.required}>*</span>
                        </label>
                        <select
                            id="edit-stock-unit"
                            name="stock_unit"
                            value={form.stock_unit}
                            onChange={handleChange}
                            style={styles.input}
                        >
                            {UNITS.map((unit) => (
                                <option key={unit.value} value={unit.value}>
                                    {unit.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div style={styles.row} className="edit-product-responsive-row">
                    <div style={styles.formGroupHalf}>
                        <label htmlFor="edit-min-stock" style={styles.label}>Minimum Stock</label>
                        <input
                            id="edit-min-stock"
                            type="number"
                            name="min_stock"
                            min="0"
                            step="0.01"
                            inputMode="decimal"
                            value={form.min_stock}
                            onChange={handleChange}
                            autoComplete="off"
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.formGroupHalf}>
                        <label htmlFor="edit-tax" style={styles.label}>Tax (%)</label>
                        <input
                            id="edit-tax"
                            type="number"
                            name="tax"
                            min="0"
                            max="100"
                            step="0.01"
                            inputMode="decimal"
                            value={form.tax}
                            onChange={handleChange}
                            autoComplete="off"
                            style={styles.input}
                        />
                    </div>
                </div>

                <div style={styles.formGroup}>
                    <label htmlFor="edit-expiry" style={styles.label}>Expiry Date</label>
                    <input
                        id="edit-expiry"
                        type="date"
                        name="expiry_date"
                        value={form.expiry_date}
                        onChange={handleChange}
                        style={styles.input}
                    />
                    <small style={styles.helperText}>
                        Leave empty if this product does not expire. Existing expiry dates can also be kept or changed.
                    </small>
                </div>

                <div style={styles.formGroup}>
                    <label htmlFor="edit-description" style={styles.label}>Description</label>
                    <textarea
                        id="edit-description"
                        name="description"
                        rows="4"
                        maxLength={1000}
                        placeholder="Brand, features, notes..."
                        value={form.description}
                        onChange={handleChange}
                        style={styles.textarea}
                    />
                </div>

                <div style={styles.formGroup}>
                    <label htmlFor="edit-image" style={styles.label}>Image URL</label>
                    <input
                        id="edit-image"
                        type="url"
                        name="image"
                        placeholder="https://example.com/image.jpg"
                        value={form.image}
                        onChange={handleChange}
                        autoComplete="url"
                        style={styles.input}
                    />
                </div>

                <div style={styles.formGroup}>
                    <label htmlFor="edit-status" style={styles.label}>
                        Status <span style={styles.required}>*</span>
                    </label>
                    <select
                        id="edit-status"
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                        style={styles.input}
                    >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>

                <div style={styles.footerSummary}>
                    <span>{hasChanges ? "Unsaved changes" : "No changes yet"}</span>
                </div>

                <div style={styles.buttonGroup}>
                    <button
                        type="button"
                        onClick={() => navigate("/products")}
                        disabled={saving}
                        style={styles.cancelButton}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving || !hasChanges}
                        style={{
                            ...styles.submitButton,
                            ...(saving || !hasChanges ? styles.buttonDisabled : {}),
                        }}
                    >
                        {saving ? "Updating..." : "Update Product"}
                    </button>
                </div>
            </form>
        </div>
    );
}

const styles = {
    container: {
        maxWidth: "760px",
        margin: "32px auto",
        padding: "32px",
        background: "#ffffff",
        borderRadius: "16px",
        boxShadow: "0 8px 28px rgba(0, 0, 0, 0.08)",
        border: "1px solid #e5e7eb",
        boxSizing: "border-box",
    },
    headerRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "16px",
        marginBottom: "24px",
    },
    title: {
        fontSize: "26px",
        fontWeight: "700",
        color: "#111827",
        margin: 0,
    },
    subtitle: {
        margin: "6px 0 0",
        color: "#6b7280",
        fontSize: "13px",
    },
    backButton: {
        border: "1px solid #d1d5db",
        background: "#f9fafb",
        color: "#374151",
        borderRadius: "8px",
        padding: "9px 12px",
        cursor: "pointer",
        whiteSpace: "nowrap",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "18px",
    },
    formGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
    },
    formGroupHalf: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        flex: 1,
        minWidth: 0,
    },
    label: {
        fontSize: "13px",
        fontWeight: "600",
        color: "#374151",
    },
    required: { color: "#dc2626" },
    input: {
        width: "100%",
        padding: "11px 13px",
        border: "1px solid #d1d5db",
        borderRadius: "9px",
        fontSize: "14px",
        boxSizing: "border-box",
        background: "#fff",
        color: "#111827",
        outline: "none",
    },
    textarea: {
        width: "100%",
        padding: "11px 13px",
        border: "1px solid #d1d5db",
        borderRadius: "9px",
        fontSize: "14px",
        boxSizing: "border-box",
        resize: "vertical",
        minHeight: "96px",
        background: "#fff",
        color: "#111827",
        fontFamily: "inherit",
        outline: "none",
    },
    row: {
        display: "flex",
        gap: "16px",
    },
    priceSummary: {
        display: "flex",
        justifyContent: "space-between",
        gap: "12px",
        padding: "11px 13px",
        background: "#f8fafc",
        border: "1px solid #e5e7eb",
        borderRadius: "9px",
        fontSize: "13px",
        color: "#475569",
    },
    footerSummary: {
        fontSize: "12px",
        color: "#6b7280",
        padding: "4px 0",
    },
    helperText: {
        fontSize: "12px",
        color: "#6b7280",
    },
    checkingText: {
        color: "#6b7280",
        fontSize: "12px",
    },
    successHint: {
        color: "#166534",
        fontSize: "12px",
    },
    errorHint: {
        color: "#b91c1c",
        fontSize: "12px",
    },
    message: {
        padding: "12px 16px",
        marginBottom: "20px",
        borderRadius: "9px",
        fontSize: "14px",
        fontWeight: "500",
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
    buttonGroup: {
        display: "flex",
        gap: "12px",
        marginTop: "8px",
    },
    submitButton: {
        flex: 1,
        padding: "13px 16px",
        background: "#2563eb",
        color: "#fff",
        border: "none",
        borderRadius: "9px",
        fontSize: "15px",
        fontWeight: "700",
        cursor: "pointer",
    },
    cancelButton: {
        padding: "13px 18px",
        background: "#f3f4f6",
        color: "#374151",
        border: "1px solid #d1d5db",
        borderRadius: "9px",
        fontSize: "15px",
        fontWeight: "600",
        cursor: "pointer",
    },
    buttonDisabled: {
        background: "#93c5fd",
        cursor: "not-allowed",
        opacity: 0.75,
    },
    loadingState: {
        minHeight: "320px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "14px",
        color: "#6b7280",
    },
    spinner: {
        width: "28px",
        height: "28px",
        border: "3px solid #dbeafe",
        borderTopColor: "#2563eb",
        borderRadius: "50%",
        animation: "edit-product-spin 0.8s linear infinite",
    },
};

export const EditProductStyles = () => (
    <style>{`
        @keyframes edit-product-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        #edit-product-name:focus,
        #edit-product-category:focus,
        #edit-product-code:focus,
        #edit-product-barcode:focus,
        #edit-purchase-price:focus,
        #edit-selling-price:focus,
        #edit-price-per:focus,
        #edit-price-unit:focus,
        #edit-stock:focus,
        #edit-stock-unit:focus,
        #edit-min-stock:focus,
        #edit-tax:focus,
        #edit-expiry:focus,
        #edit-description:focus,
        #edit-image:focus,
        #edit-status:focus {
            border-color: #2563eb !important;
            box-shadow: 0 0 0 3px rgba(37,99,235,0.10);
        }

        @media (max-width: 640px) {
            .edit-product-responsive-row {
                flex-direction: column !important;
            }
        }
    `}</style>
);