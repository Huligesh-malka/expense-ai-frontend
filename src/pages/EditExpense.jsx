import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

export default function EditExpense() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);
    const [billSummary, setBillSummary] = useState({
        subtotal: 0,
        totalDiscount: 0,
        totalGST: 0,
        grandTotal: 0,
    });
    const [extras, setExtras] = useState({
        couponDiscount: 0,
        deliveryCharge: 0,
        packingCharge: 0,
        serviceCharge: 0,
        roundOff: 0,
    });
    const [form, setForm] = useState({
        merchant: "",
        expense_name: "",
        category_id: "",
        amount: "",
        expense_date: "",
        payment_method: "",
        notes: ""
    });
    const [manualAmount, setManualAmount] = useState("");
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        fetchCategories();
        fetchExpense();
    }, [id]);

    const fetchCategories = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/categories");
            setCategories(res.data.categories || []);
        } catch (err) {
            console.error("Error fetching categories:", err);
        }
    };

    const fetchExpense = async () => {
        try {
            const res = await axios.get(
                `http://localhost:5000/api/expenses/${id}`
            );
            
            const expenseData = res.data.expense;
            const productsData = res.data.products || [];
            const extrasData = res.data.extras || {};
            
            setForm({
                merchant: expenseData?.merchant || "",
                expense_name: expenseData?.expense_name || "",
                category_id: expenseData?.category_id || "",
                amount: expenseData?.amount || "",
                expense_date: expenseData?.expense_date
                    ? expenseData.expense_date.split("T")[0]
                    : "",
                payment_method: expenseData?.payment_method || "",
                notes: expenseData?.notes || ""
            });

            // Set manual amount if products don't exist
            if (!productsData || productsData.length === 0) {
                setManualAmount(expenseData?.amount || "");
            }

            // Set products if they exist
            if (productsData && productsData.length > 0) {
                setProducts(productsData.map(product => ({
                    product_name: product.product_name || "",
                    quantity: product.quantity || 1,
                    unit_price: product.unit_price || 0,
                    discount: product.discount || 0,
                    gst_applicable: product.gst_applicable || false,
                    gst_percent: product.gst_percent || 0,
                    gst_amount: product.gst_amount || 0,
                    final_price: product.final_price || 0,
                })));
            } else {
                // Add one empty product row if no products exist
                setProducts([{
                    product_name: "",
                    quantity: 1,
                    unit_price: 0,
                    discount: 0,
                    gst_applicable: false,
                    gst_percent: 0,
                    gst_amount: 0,
                    final_price: 0,
                }]);
            }

            // Set extras if they exist
            if (extrasData) {
                setExtras({
                    couponDiscount: extrasData.couponDiscount || 0,
                    deliveryCharge: extrasData.deliveryCharge || 0,
                    packingCharge: extrasData.packingCharge || 0,
                    serviceCharge: extrasData.serviceCharge || 0,
                    roundOff: extrasData.roundOff || 0,
                });
            }

        } catch (err) {
            console.error("Error fetching expense:", err);
            alert(err.response?.data?.message || "Unable to load expense.");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // If amount is being manually changed
        if (name === "amount") {
            setManualAmount(value);
            setForm({
                ...form,
                [name]: value,
            });
            // If user manually enters amount, clear products
            if (products.length > 0 && products.some(p => p.product_name.trim() !== "")) {
                setProducts([{
                    product_name: "",
                    quantity: 1,
                    unit_price: 0,
                    discount: 0,
                    gst_applicable: false,
                    gst_percent: 0,
                    gst_amount: 0,
                    final_price: 0,
                }]);
            }
        } else {
            setForm({
                ...form,
                [name]: value
            });
        }
    };

    // Handle product field changes
    const handleProductChange = (index, field, value) => {
        const updatedProducts = [...products];
        updatedProducts[index][field] = value;
        
        // Auto-calculate GST and final price
        const item = updatedProducts[index];
        if (item.unit_price > 0 && item.quantity > 0) {
            const subtotal = parseFloat(item.unit_price || 0) * parseFloat(item.quantity || 0);
            const discount = parseFloat(item.discount || 0);
            const afterDiscount = subtotal - discount;
            
            if (item.gst_applicable && item.gst_percent > 0) {
                const gstAmount = (afterDiscount * parseFloat(item.gst_percent)) / 100;
                item.gst_amount = parseFloat(gstAmount.toFixed(2));
                item.final_price = parseFloat((afterDiscount + gstAmount).toFixed(2));
            } else {
                item.gst_amount = 0;
                item.final_price = parseFloat(afterDiscount.toFixed(2));
            }
        } else {
            item.gst_amount = 0;
            item.final_price = 0;
        }
        
        setProducts(updatedProducts);
        // Clear manual amount when products are updated
        setManualAmount("");
    };

    // Add new product row
    const addProductRow = () => {
        setProducts([...products, {
            product_name: "",
            quantity: 1,
            unit_price: 0,
            discount: 0,
            gst_applicable: false,
            gst_percent: 0,
            gst_amount: 0,
            final_price: 0,
        }]);
        // Clear manual amount when adding product
        setManualAmount("");
    };

    // Remove product row
    const removeProductRow = (index) => {
        if (products.length > 1) {
            const updatedProducts = products.filter((_, i) => i !== index);
            setProducts(updatedProducts);
            if (updatedProducts.length === 0 || !updatedProducts.some(p => p.product_name.trim() !== "")) {
                setManualAmount("");
            }
        }
    };

    const handleExtraChange = (e) => {
        const { name, value } = e.target;
        setExtras({
            ...extras,
            [name]: parseFloat(value) || 0,
        });
    };

    // Calculate bill summary whenever products or extras change
    useEffect(() => {
        let subtotal = 0;
        let totalDiscount = 0;
        let totalGST = 0;
        let grandTotal = 0;

        // Only calculate if there are products with data
        if (products.length > 0 && products.some(p => p.product_name.trim() !== "" || p.unit_price > 0)) {
            products.forEach((item) => {
                if (item.unit_price > 0 && item.quantity > 0) {
                    const itemSubtotal = parseFloat(item.unit_price) * parseFloat(item.quantity);
                    const discount = parseFloat(item.discount || 0);
                    const afterDiscount = itemSubtotal - discount;
                    
                    subtotal += itemSubtotal;
                    totalDiscount += discount;
                    totalGST += parseFloat(item.gst_amount || 0);
                    grandTotal += parseFloat(item.final_price || 0);
                }
            });

            // Add extras
            const extrasTotal = 
                (extras.couponDiscount || 0) * -1 +
                (extras.deliveryCharge || 0) +
                (extras.packingCharge || 0) +
                (extras.serviceCharge || 0) +
                (extras.roundOff || 0);

            grandTotal = parseFloat((grandTotal + extrasTotal).toFixed(2));

            setBillSummary({
                subtotal: parseFloat(subtotal.toFixed(2)),
                totalDiscount: parseFloat(totalDiscount.toFixed(2)),
                totalGST: parseFloat(totalGST.toFixed(2)),
                grandTotal,
            });

            // Update main amount field automatically from products
            setForm(prev => ({
                ...prev,
                amount: grandTotal.toString()
            }));
        } else {
            // Reset bill summary if no products
            setBillSummary({
                subtotal: 0,
                totalDiscount: 0,
                totalGST: 0,
                grandTotal: 0,
            });
            
            // If no products and manual amount exists, use that
            if (manualAmount && !products.some(p => p.product_name.trim() !== "")) {
                setForm(prev => ({
                    ...prev,
                    amount: manualAmount
                }));
            }
        }
    }, [products, extras]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate that either amount is filled manually or products exist
        if (!form.amount || parseFloat(form.amount) <= 0) {
            alert("Please enter an amount or add products with prices");
            return;
        }

        // Prepare data with products
        const filteredProducts = products.filter(
            (p) => p.product_name.trim() !== "" && p.unit_price > 0
        );

        const expenseData = {
            ...form,
            amount: Number(form.amount),
            category_id: Number(form.category_id),
            products: filteredProducts,
            bill_summary: filteredProducts.length > 0 ? billSummary : null,
            extras: filteredProducts.length > 0 ? extras : null,
        };

        try {
            const res = await axios.put(
                `http://localhost:5000/api/expenses/${id}`,
                expenseData
            );
            alert(res.data.message);
            navigate("/expenses");
        } catch (err) {
            console.error("Error updating expense:", err);
            alert(
                err.response?.data?.message ||
                "Unable to update expense."
            );
        }
    };

    if (loading) {
        return (
            <div style={loadingContainerStyle}>
                <div style={loadingSpinnerStyle}></div>
                <h2 style={{ color: "#64748b", marginTop: "20px" }}>
                    Loading Expense...
                </h2>
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            {/* Header Section */}
            <div style={headerStyle}>
                <div>
                    <h1 style={titleStyle}>✏️ Edit Expense</h1>
                    <p style={subtitleStyle}>Update your expense details below</p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate("/expenses")}
                    style={backButtonStyle}
                >
                    ← Back to Expenses
                </button>
            </div>

            <form onSubmit={handleSubmit} style={formStyle}>
                {/* Two Column Layout */}
                <div style={twoColumnStyle}>
                    {/* Left Column */}
                    <div>
                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>
                                <span style={{ color: "#ef4444" }}>*</span> Merchant
                            </label>
                            <input
                                type="text"
                                name="merchant"
                                placeholder="e.g., D-Mart, Amazon, etc."
                                value={form.merchant}
                                onChange={handleChange}
                                required
                                style={inputStyle}
                            />
                        </div>

                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>
                                <span style={{ color: "#ef4444" }}>*</span> Expense Name
                            </label>
                            <input
                                type="text"
                                name="expense_name"
                                placeholder="e.g., Monthly Groceries"
                                value={form.expense_name}
                                onChange={handleChange}
                                required
                                style={inputStyle}
                            />
                        </div>

                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>
                                <span style={{ color: "#ef4444" }}>*</span> Amount
                            </label>
                            <input
                                type="number"
                                name="amount"
                                placeholder="Enter amount or add products"
                                value={form.amount}
                                onChange={handleChange}
                                required
                                style={{
                                    ...inputStyle,
                                    background: products.some(p => p.product_name.trim() !== "") ? "#f1f5f9" : "#fff",
                                    cursor: products.some(p => p.product_name.trim() !== "") ? "not-allowed" : "text",
                                }}
                                readOnly={products.some(p => p.product_name.trim() !== "")}
                            />
                            {products.some(p => p.product_name.trim() !== "") && (
                                <span style={infoTextStyle}>
                                    ℹ️ Amount is auto-calculated from products. To enter manually, remove all products.
                                </span>
                            )}
                        </div>

                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>
                                <span style={{ color: "#ef4444" }}>*</span> Date
                            </label>
                            <input
                                type="date"
                                name="expense_date"
                                value={form.expense_date}
                                onChange={handleChange}
                                required
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    {/* Right Column */}
                    <div>
                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>
                                <span style={{ color: "#ef4444" }}>*</span> Category
                            </label>
                            <select
                                name="category_id"
                                value={form.category_id}
                                onChange={handleChange}
                                required
                                style={inputStyle}
                            >
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.icon} {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>Payment Method</label>
                            <select
                                name="payment_method"
                                value={form.payment_method}
                                onChange={handleChange}
                                style={inputStyle}
                            >
                                <option value="">Select Payment Method</option>
                                <option value="Cash">💵 Cash</option>
                                <option value="UPI">📱 UPI</option>
                                <option value="Credit Card">💳 Credit Card</option>
                                <option value="Debit Card">💳 Debit Card</option>
                                <option value="Net Banking">🏦 Net Banking</option>
                            </select>
                        </div>

                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>Notes</label>
                            <textarea
                                name="notes"
                                rows="4"
                                placeholder="Additional notes about this expense..."
                                value={form.notes}
                                onChange={handleChange}
                                style={textareaStyle}
                            />
                        </div>
                    </div>
                </div>

                {/* Products Section */}
                <div style={productsSectionStyle}>
                    <div style={productsHeaderStyle}>
                        <h2 style={productsTitleStyle}>
                            🛍️ Products
                            <span style={optionalBadgeStyle}>Optional</span>
                        </h2>
                        <button
                            type="button"
                            onClick={addProductRow}
                            style={addProductButtonStyle}
                        >
                            + Add Product
                        </button>
                    </div>

                    {products.length > 0 && (
                        <div style={productTableHeaderStyle}>
                            <span>Product</span>
                            <span>Qty</span>
                            <span>Unit Price</span>
                            <span>Discount</span>
                            <span>GST</span>
                            <span>GST %</span>
                            <span>GST Amt</span>
                            <span>Final Price</span>
                            <span>Action</span>
                        </div>
                    )}

                    {products.map((product, index) => (
                        <div key={index} style={productRowStyle}>
                            <input
                                type="text"
                                placeholder="Product Name"
                                value={product.product_name}
                                onChange={(e) => handleProductChange(index, "product_name", e.target.value)}
                                style={productInputStyle}
                            />
                            <input
                                type="number"
                                placeholder="Qty"
                                value={product.quantity}
                                onChange={(e) => handleProductChange(index, "quantity", Number(e.target.value))}
                                min="1"
                                style={productInputStyle}
                            />
                            <input
                                type="number"
                                placeholder="Price"
                                value={product.unit_price}
                                onChange={(e) => handleProductChange(index, "unit_price", Number(e.target.value))}
                                min="0"
                                step="0.01"
                                style={productInputStyle}
                            />
                            <input
                                type="number"
                                placeholder="₹0"
                                value={product.discount}
                                onChange={(e) => handleProductChange(index, "discount", Number(e.target.value))}
                                min="0"
                                step="0.01"
                                style={productInputStyle}
                            />
                            <input
                                type="checkbox"
                                checked={product.gst_applicable}
                                onChange={(e) => handleProductChange(index, "gst_applicable", e.target.checked)}
                                style={checkboxStyle}
                            />
                            <input
                                type="number"
                                placeholder="%"
                                value={product.gst_percent}
                                onChange={(e) => handleProductChange(index, "gst_percent", Number(e.target.value))}
                                disabled={!product.gst_applicable}
                                style={{
                                    ...productInputStyle,
                                    opacity: product.gst_applicable ? 1 : 0.5,
                                }}
                            />
                            <span style={gstAmountStyle}>
                                ₹{product.gst_amount || 0}
                            </span>
                            <span style={finalPriceStyle}>
                                ₹{product.final_price || 0}
                            </span>
                            {products.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeProductRow(index)}
                                    style={removeButtonStyle}
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Bill Summary Section */}
                {products.some(p => p.product_name.trim() !== "" || p.unit_price > 0) && (
                    <div style={summarySectionStyle}>
                        <h3 style={summaryTitleStyle}>📊 Bill Summary</h3>

                        <div style={summaryContainerStyle}>
                            <div style={summaryRowStyle}>
                                <span style={summaryLabelStyle}>Subtotal</span>
                                <span style={summaryValueStyle}>₹{billSummary.subtotal.toFixed(2)}</span>
                            </div>
                            <div style={{ ...summaryRowStyle, color: "#dc2626" }}>
                                <span>Discount</span>
                                <span>-₹{billSummary.totalDiscount.toFixed(2)}</span>
                            </div>
                            <div style={{ ...summaryRowStyle, color: "#2563eb" }}>
                                <span>GST</span>
                                <span>+₹{billSummary.totalGST.toFixed(2)}</span>
                            </div>

                            {/* Extras */}
                            <div style={extrasGridStyle}>
                                <div style={extraFieldStyle}>
                                    <label style={smallLabelStyle}>Coupon Discount</label>
                                    <input
                                        type="number"
                                        name="couponDiscount"
                                        value={extras.couponDiscount}
                                        onChange={handleExtraChange}
                                        style={extraInputStyle}
                                        placeholder="₹0"
                                    />
                                </div>
                                <div style={extraFieldStyle}>
                                    <label style={smallLabelStyle}>Delivery Charge</label>
                                    <input
                                        type="number"
                                        name="deliveryCharge"
                                        value={extras.deliveryCharge}
                                        onChange={handleExtraChange}
                                        style={extraInputStyle}
                                        placeholder="₹0"
                                    />
                                </div>
                                <div style={extraFieldStyle}>
                                    <label style={smallLabelStyle}>Packing Charge</label>
                                    <input
                                        type="number"
                                        name="packingCharge"
                                        value={extras.packingCharge}
                                        onChange={handleExtraChange}
                                        style={extraInputStyle}
                                        placeholder="₹0"
                                    />
                                </div>
                                <div style={extraFieldStyle}>
                                    <label style={smallLabelStyle}>Service Charge</label>
                                    <input
                                        type="number"
                                        name="serviceCharge"
                                        value={extras.serviceCharge}
                                        onChange={handleExtraChange}
                                        style={extraInputStyle}
                                        placeholder="₹0"
                                    />
                                </div>
                                <div style={extraFieldStyle}>
                                    <label style={smallLabelStyle}>Round Off</label>
                                    <input
                                        type="number"
                                        name="roundOff"
                                        value={extras.roundOff}
                                        onChange={handleExtraChange}
                                        style={extraInputStyle}
                                        placeholder="₹0"
                                        step="0.01"
                                    />
                                </div>
                            </div>

                            {/* Grand Total */}
                            <div style={grandTotalStyle}>
                                <span>Grand Total</span>
                                <span>₹{billSummary.grandTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Buttons */}
                <div style={buttonContainerStyle}>
                    <button
                        type="button"
                        onClick={() => navigate("/expenses")}
                        style={cancelButtonStyle}
                    >
                        ✕ Cancel
                    </button>
                    <button
                        type="submit"
                        style={submitButtonStyle}
                    >
                        💾 Update Expense
                    </button>
                </div>
            </form>
        </div>
    );
}

// Styles
const containerStyle = {
    maxWidth: "1200px",
    margin: "30px auto",
    padding: "20px",
    background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
    borderRadius: "20px",
    minHeight: "100vh",
};

const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    padding: "20px 30px",
    background: "#fff",
    borderRadius: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
};

const titleStyle = {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1a2332",
    margin: 0,
};

const subtitleStyle = {
    fontSize: "14px",
    color: "#64748b",
    marginTop: "4px",
    marginBottom: 0,
};

const backButtonStyle = {
    padding: "10px 20px",
    background: "#f1f5f9",
    color: "#64748b",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "14px",
    transition: "all 0.2s ease",
};

const formStyle = {
    background: "#fff",
    padding: "30px",
    borderRadius: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
};

const twoColumnStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "30px",
};

const inputGroupStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginBottom: "20px",
};

const labelStyle = {
    fontSize: "14px",
    fontWeight: "500",
    color: "#1a2332",
    display: "flex",
    alignItems: "center",
    gap: "4px",
};

const inputStyle = {
    padding: "12px 16px",
    border: "2px solid #e8edf5",
    borderRadius: "10px",
    fontSize: "14px",
    transition: "all 0.3s ease",
    outline: "none",
    background: "#fafbfc",
    width: "100%",
    boxSizing: "border-box",
};

const textareaStyle = {
    padding: "12px 16px",
    border: "2px solid #e8edf5",
    borderRadius: "10px",
    fontSize: "14px",
    transition: "all 0.3s ease",
    outline: "none",
    background: "#fafbfc",
    width: "100%",
    boxSizing: "border-box",
    resize: "vertical",
    fontFamily: "inherit",
    minHeight: "100px",
};

const infoTextStyle = {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "4px",
};

const productsSectionStyle = {
    marginTop: "30px",
    paddingTop: "25px",
    borderTop: "2px solid #f1f5f9",
};

const productsHeaderStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
};

const productsTitleStyle = {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1a2332",
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: "10px",
};

const optionalBadgeStyle = {
    fontSize: "11px",
    fontWeight: "500",
    color: "#64748b",
    background: "#f1f5f9",
    padding: "2px 10px",
    borderRadius: "20px",
};

const addProductButtonStyle = {
    padding: "10px 20px",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.3s ease",
};

const productTableHeaderStyle = {
    display: "grid",
    gridTemplateColumns: "1.5fr 0.8fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 0.5fr",
    gap: "10px",
    padding: "12px 15px",
    background: "#f8fafc",
    borderRadius: "10px",
    marginBottom: "10px",
    fontWeight: "600",
    color: "#64748b",
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
};

const productRowStyle = {
    display: "grid",
    gridTemplateColumns: "1.5fr 0.8fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 0.5fr",
    gap: "10px",
    padding: "12px 15px",
    background: "#fff",
    borderRadius: "10px",
    marginBottom: "10px",
    border: "1px solid #e8edf5",
    alignItems: "center",
    transition: "all 0.3s ease",
};

const productInputStyle = {
    padding: "8px 10px",
    border: "2px solid #e8edf5",
    borderRadius: "6px",
    fontSize: "13px",
    transition: "all 0.3s ease",
    outline: "none",
    background: "#fff",
    width: "100%",
    boxSizing: "border-box",
};

const checkboxStyle = {
    width: "20px",
    height: "20px",
    cursor: "pointer",
    margin: "0 auto",
    display: "block",
};

const gstAmountStyle = {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1a2332",
    textAlign: "center",
};

const finalPriceStyle = {
    fontSize: "14px",
    fontWeight: "700",
    color: "#16a34a",
    textAlign: "center",
};

const removeButtonStyle = {
    padding: "8px",
    background: "#fef2f2",
    color: "#dc2626",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
    width: "36px",
    height: "36px",
    margin: "0 auto",
};

const summarySectionStyle = {
    marginTop: "30px",
    padding: "25px",
    background: "#f8fafc",
    borderRadius: "12px",
    border: "1px solid #e8edf5",
};

const summaryTitleStyle = {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1a2332",
    marginBottom: "20px",
};

const summaryContainerStyle = {
    maxWidth: "400px",
    marginLeft: "auto",
};

const summaryRowStyle = {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
    borderBottom: "1px solid #e8edf5",
};

const summaryLabelStyle = {
    color: "#64748b",
};

const summaryValueStyle = {
    fontWeight: "600",
    color: "#1a2332",
};

const extrasGridStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginTop: "10px",
};

const extraFieldStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
};

const smallLabelStyle = {
    fontSize: "12px",
    fontWeight: "500",
    color: "#64748b",
};

const extraInputStyle = {
    padding: "8px 12px",
    border: "2px solid #e8edf5",
    borderRadius: "6px",
    fontSize: "13px",
    transition: "all 0.3s ease",
    outline: "none",
    background: "#fff",
    width: "100%",
    boxSizing: "border-box",
};

const grandTotalStyle = {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 0",
    marginTop: "10px",
    borderTop: "2px solid #1a2332",
    fontSize: "18px",
    fontWeight: "700",
    color: "#1a2332",
};

const buttonContainerStyle = {
    marginTop: "30px",
    display: "flex",
    gap: "15px",
    justifyContent: "flex-end",
};

const cancelButtonStyle = {
    padding: "14px 30px",
    background: "#f1f5f9",
    color: "#64748b",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "15px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.3s ease",
};

const submitButtonStyle = {
    padding: "14px 35px",
    background: "linear-gradient(135deg, #16a34a, #15803d)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "15px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(22, 163, 74, 0.3)",
};

const loadingContainerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    background: "#f8fafc",
};

const loadingSpinnerStyle = {
    width: "50px",
    height: "50px",
    border: "4px solid #e8edf5",
    borderTop: "4px solid #2563eb",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
};