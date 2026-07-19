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

    useEffect(() => {
        fetchExpense();
    }, [id]);

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
            <h2 style={{
                textAlign: "center",
                marginTop: "100px"
            }}>
                Loading...
            </h2>
        );
    }

    return (
        <div style={{
            maxWidth: "1200px",
            margin: "30px auto",
            background: "#fff",
            padding: "30px",
            borderRadius: "16px",
            boxShadow: "0 4px 12px rgba(0,0,0,.08)",
            border: "1px solid rgba(0,0,0,.04)"
        }}>
            <h1 style={{
                fontSize: "28px",
                fontWeight: "700",
                color: "#1a2332",
                marginBottom: "30px"
            }}>
                Edit Expense
            </h1>

            <form onSubmit={handleSubmit}>
                {/* Two Column Layout */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "20px",
                }}>
                    {/* Left Column */}
                    <div>
                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>Merchant *</label>
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
                            <label style={labelStyle}>Expense Name *</label>
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
                            <label style={labelStyle}>Amount *</label>
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
                                }}
                                readOnly={products.some(p => p.product_name.trim() !== "")}
                            />
                            {products.some(p => p.product_name.trim() !== "") && (
                                <span style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                                    ℹ️ Amount is auto-calculated from products. To enter manually, remove all products.
                                </span>
                            )}
                        </div>

                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>Date *</label>
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
                            <label style={labelStyle}>Category *</label>
                            <select
                                name="category_id"
                                value={form.category_id}
                                onChange={handleChange}
                                required
                                style={inputStyle}
                            >
                                <option value="">Select Category</option>
                                <option value="1">🛒 Groceries</option>
                                <option value="2">🏥 Medical</option>
                                <option value="3">🍽️ Restaurant</option>
                                <option value="4">⛽ Fuel</option>
                                <option value="5">🛍️ Shopping</option>
                                <option value="6">✈️ Travel</option>
                                <option value="7">💡 Electricity</option>
                                <option value="8">🌐 Internet</option>
                                <option value="9">🎬 Entertainment</option>
                                <option value="10">📚 Education</option>
                                <option value="11">📌 Others</option>
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
                <div style={{
                    marginTop: "30px",
                    paddingTop: "25px",
                    borderTop: "2px solid #f1f5f9",
                }}>
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "20px",
                    }}>
                        <h2 style={{
                            fontSize: "18px",
                            fontWeight: "600",
                            color: "#1a2332",
                            margin: 0,
                        }}>
                            🛍️ Products (Optional)
                        </h2>
                        <button
                            type="button"
                            onClick={addProductRow}
                            style={{
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
                            }}
                        >
                            + Add Product
                        </button>
                    </div>

                    {products.length > 0 && (
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "1.5fr 0.8fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 0.5fr",
                            gap: "10px",
                            padding: "15px",
                            background: "#f8fafc",
                            borderRadius: "10px",
                            marginBottom: "10px",
                            fontWeight: "600",
                            color: "#64748b",
                            fontSize: "12px",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                        }}>
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
                        <div key={index} style={{
                            display: "grid",
                            gridTemplateColumns: "1.5fr 0.8fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 0.5fr",
                            gap: "10px",
                            padding: "12px",
                            background: "#fff",
                            borderRadius: "10px",
                            marginBottom: "10px",
                            border: "1px solid #e8edf5",
                            alignItems: "center",
                            transition: "all 0.3s ease",
                        }}>
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
                                style={{
                                    width: "20px",
                                    height: "20px",
                                    cursor: "pointer",
                                    margin: "0 auto",
                                    display: "block",
                                }}
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
                            <span style={{
                                fontSize: "14px",
                                fontWeight: "600",
                                color: "#1a2332",
                                textAlign: "center",
                            }}>
                                ₹{product.gst_amount || 0}
                            </span>
                            <span style={{
                                fontSize: "14px",
                                fontWeight: "700",
                                color: "#16a34a",
                                textAlign: "center",
                            }}>
                                ₹{product.final_price || 0}
                            </span>
                            {products.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeProductRow(index)}
                                    style={{
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
                                    }}
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Bill Summary Section */}
                {products.some(p => p.product_name.trim() !== "" || p.unit_price > 0) && (
                    <div style={{
                        marginTop: "30px",
                        padding: "25px",
                        background: "#f8fafc",
                        borderRadius: "12px",
                        border: "1px solid #e8edf5",
                    }}>
                        <h3 style={{
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#1a2332",
                            marginBottom: "20px",
                        }}>
                            📊 Bill Summary
                        </h3>

                        <div style={{ maxWidth: "400px", marginLeft: "auto" }}>
                            <div style={{
                                display: "flex",
                                justifyContent: "space-between",
                                padding: "8px 0",
                                borderBottom: "1px solid #e8edf5",
                            }}>
                                <span style={{ color: "#64748b" }}>Subtotal</span>
                                <span style={{ fontWeight: "600", color: "#1a2332" }}>
                                    ₹{billSummary.subtotal.toFixed(2)}
                                </span>
                            </div>
                            <div style={{
                                display: "flex",
                                justifyContent: "space-between",
                                padding: "8px 0",
                                borderBottom: "1px solid #e8edf5",
                                color: "#dc2626",
                            }}>
                                <span>Discount</span>
                                <span>-₹{billSummary.totalDiscount.toFixed(2)}</span>
                            </div>
                            <div style={{
                                display: "flex",
                                justifyContent: "space-between",
                                padding: "8px 0",
                                borderBottom: "1px solid #e8edf5",
                                color: "#2563eb",
                            }}>
                                <span>GST</span>
                                <span>+₹{billSummary.totalGST.toFixed(2)}</span>
                            </div>

                            {/* Extras */}
                            <div style={{ marginTop: "10px" }}>
                                <div style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "10px",
                                    marginTop: "10px",
                                }}>
                                    <div style={inputGroupStyle}>
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
                                    <div style={inputGroupStyle}>
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
                                    <div style={inputGroupStyle}>
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
                                    <div style={inputGroupStyle}>
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
                                    <div style={inputGroupStyle}>
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
                            </div>

                            {/* Grand Total */}
                            <div style={{
                                display: "flex",
                                justifyContent: "space-between",
                                padding: "12px 0",
                                marginTop: "10px",
                                borderTop: "2px solid #1a2332",
                                fontSize: "18px",
                                fontWeight: "700",
                                color: "#1a2332",
                            }}>
                                <span>Grand Total</span>
                                <span>₹{billSummary.grandTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Buttons */}
                <div style={{
                    marginTop: "30px",
                    display: "flex",
                    gap: "15px",
                    justifyContent: "flex-end",
                }}>
                    <button
                        type="button"
                        onClick={() => navigate("/expenses")}
                        style={{
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
                        }}
                    >
                        ✕ Cancel
                    </button>
                    <button
                        type="submit"
                        style={{
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
                        }}
                    >
                        💾 Update Expense
                    </button>
                </div>
            </form>
        </div>
    );
}

// Styles
const inputGroupStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginBottom: "18px",
};

const labelStyle = {
    fontSize: "14px",
    fontWeight: "500",
    color: "#1a2332",
    display: "flex",
    alignItems: "center",
    gap: "6px",
};

const smallLabelStyle = {
    fontSize: "12px",
    fontWeight: "500",
    color: "#64748b",
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