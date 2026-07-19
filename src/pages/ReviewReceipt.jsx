import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";

export default function ReviewReceipt() {
    const { receiptId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [receiptImage, setReceiptImage] = useState(null);

    const [form, setForm] = useState({
        user_id: 1,
        merchant: "",
        expense_name: "",
        category_id: "",
        amount: "",
        expense_date: "",
        payment_method: "",
        notes: ""
    });

    const [products, setProducts] = useState([]);

    useEffect(() => {
        fetchAIReceipt();
    }, []);

    const fetchAIReceipt = async () => {
        try {
            const res = await API.get(`/ai/parse/${receiptId}`);
            const ai = res.data.data;

            if (ai.receipt_image) {
                setReceiptImage(ai.receipt_image);
            }

            setForm({
                user_id: 1,
                merchant: ai.company_name || ai.seller_name || "",
                expense_name: ai.company_name || "Expense",
                category_id: "",
                amount: ai.total_amount || "",
                expense_date: ai.invoice_date || "",
                payment_method: ai.payment_method || "",
                notes: ""
            });

            if (Array.isArray(ai.items)) {
                setProducts(
                    ai.items.map(item => ({
                        product_name: item.name || "",
                        quantity: Number(item.quantity) || 1,
                        unit_price: Number(item.unit_price) || 0,
                        discount: 0,
                        gst_applicable: true,
                        gst_percent: 18,
                        gst: 0,
                        final_price: Number(item.amount) || 0
                    }))
                );
            }
        } catch (err) {
            console.log(err);
            alert("Unable to load AI receipt.");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    // FIXED: Calculate and update only the changed product
    const handleProductChange = (index, e) => {
        const updated = [...products];
        const field = e.target.name;
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        
        updated[index][field] = value;

        // Recalculate this product's values
        const qty = Number(updated[index].quantity) || 1;
        const unit = Number(updated[index].unit_price) || 0;
        const discount = Number(updated[index].discount) || 0;
        const gstPercent = Number(updated[index].gst_percent) || 0;

        const subtotal = qty * unit;
        const afterDiscount = subtotal - discount;
        const gst = updated[index].gst_applicable
            ? (afterDiscount * gstPercent) / 100
            : 0;

        updated[index].gst = gst;
        updated[index].final_price = afterDiscount + gst;

        setProducts(updated);
    };

    const addProduct = () => {
        setProducts([
            ...products,
            {
                product_name: "",
                quantity: 1,
                unit_price: 0,
                discount: 0,
                gst_applicable: true,
                gst_percent: 18,
                gst: 0,
                final_price: 0
            }
        ]);
    };

    const removeProduct = (index) => {
        const updated = [...products];
        updated.splice(index, 1);
        setProducts(updated);
    };

    // FIXED: Pure calculation function - NO setState() calls
    const calculateTotals = () => {
        let subtotal = 0;
        let totalDiscount = 0;
        let totalGST = 0;
        let grandTotal = 0;

        products.forEach((item) => {
            const quantity = Number(item.quantity) || 1;
            const unitPrice = Number(item.unit_price) || 0;
            const discount = Number(item.discount) || 0;
            const gstPercent = Number(item.gst_percent) || 0;

            const itemSubtotal = quantity * unitPrice;
            const afterDiscount = itemSubtotal - discount;
            const gstAmount = item.gst_applicable
                ? (afterDiscount * gstPercent) / 100
                : 0;
            const finalPrice = afterDiscount + gstAmount;

            subtotal += itemSubtotal;
            totalDiscount += discount;
            totalGST += gstAmount;
            grandTotal += finalPrice;
        });

        return {
            subtotal,
            totalDiscount,
            totalGST,
            grandTotal
        };
    };

    // Calculate totals - this is called on every render but doesn't cause re-renders
    const totals = calculateTotals();

    const saveExpense = async () => {
        try {
            setSaving(true);
            
            // Validate products
            const invalidProducts = products.filter(p => !p.product_name.trim());
            if (invalidProducts.length > 0) {
                alert("Please enter product names for all items.");
                setSaving(false);
                return;
            }

            const expenseData = {
                ...form,
                amount: totals.grandTotal,
                products: products.map(p => ({
                    ...p,
                    quantity: Number(p.quantity),
                    unit_price: Number(p.unit_price),
                    discount: Number(p.discount),
                    gst_percent: Number(p.gst_percent)
                }))
            };

            await API.post("/expenses/add", expenseData);
            alert("Expense Saved Successfully");
            navigate("/expenses");
        } catch (err) {
            console.log(err);
            alert(err.response?.data?.message || "Unable to save expense");
        } finally {
            setSaving(false);
        }
    };

    const inputStyle = {
        width: "100%",
        padding: "12px",
        border: "1px solid #ddd",
        borderRadius: "8px",
        fontSize: "15px",
        boxSizing: "border-box"
    };

    if (loading) {
        return (
            <div style={{ textAlign: "center", marginTop: "100px" }}>
                <h2>Loading AI Receipt...</h2>
            </div>
        );
    }

    return (
        <div
            style={{
                maxWidth: "1100px",
                margin: "30px auto",
                background: "#fff",
                padding: "30px",
                borderRadius: "12px",
                boxShadow: "0 0 10px #ddd"
            }}
        >
            <h1>Review AI Receipt</h1>
            <p>Verify the extracted details before saving.</p>
            <br />

            {/* Receipt Image */}
            {receiptImage && (
                <div
                    style={{
                        marginBottom: "20px",
                        padding: "15px",
                        background: "#f8f9fa",
                        borderRadius: "8px"
                    }}
                >
                    <h3>Original Receipt</h3>
                    <img
                        src={receiptImage}
                        alt="Receipt"
                        style={{ maxWidth: "100%", maxHeight: "400px", objectFit: "contain" }}
                    />
                </div>
            )}

            {/* Form Fields */}
            <input
                style={inputStyle}
                name="merchant"
                placeholder="Merchant *"
                value={form.merchant}
                onChange={handleChange}
                required
            />
            <br /><br />

            <input
                style={inputStyle}
                name="expense_name"
                placeholder="Expense Name *"
                value={form.expense_name}
                onChange={handleChange}
                required
            />
            <br /><br />

            <select
                style={inputStyle}
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
                required
            >
                <option value="">Select Category *</option>
                <option value="1">Groceries</option>
                <option value="2">Medical</option>
                <option value="3">Restaurant</option>
                <option value="4">Fuel</option>
                <option value="5">Shopping</option>
                <option value="6">Travel</option>
                <option value="7">Electricity</option>
                <option value="8">Internet</option>
                <option value="9">Entertainment</option>
                <option value="10">Education</option>
                <option value="11">Others</option>
            </select>
            <br /><br />

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "20px"
                }}
            >
                <input
                    type="date"
                    style={inputStyle}
                    name="expense_date"
                    value={form.expense_date}
                    onChange={handleChange}
                    required
                />

                <select
                    style={inputStyle}
                    name="payment_method"
                    value={form.payment_method}
                    onChange={handleChange}
                >
                    <option value="">Payment Method</option>
                    <option>Cash</option>
                    <option>UPI</option>
                    <option>Credit Card</option>
                    <option>Debit Card</option>
                    <option>Net Banking</option>
                </select>
            </div>
            <br />

            <input
                type="number"
                style={inputStyle}
                name="amount"
                placeholder="Total Amount"
                value={form.amount}
                onChange={handleChange}
                step="0.01"
            />
            <br /><br />

            <textarea
                style={inputStyle}
                rows="3"
                name="notes"
                placeholder="Notes (optional)"
                value={form.notes}
                onChange={handleChange}
            />
            <br /><br />

            <hr />

            <h2>Products</h2>
            {products.map((item, index) => (
                <div
                    key={index}
                    style={{
                        border: "1px solid #ddd",
                        padding: "20px",
                        borderRadius: "10px",
                        marginBottom: "20px"
                    }}
                >
                    <input
                        style={inputStyle}
                        placeholder="Product Name *"
                        name="product_name"
                        value={item.product_name}
                        onChange={(e) => handleProductChange(index, e)}
                    />
                    <br /><br />

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(4, 1fr)",
                            gap: "15px"
                        }}
                    >
                        <input
                            style={inputStyle}
                            type="number"
                            name="quantity"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => handleProductChange(index, e)}
                            min="1"
                            step="1"
                        />
                        <input
                            style={inputStyle}
                            type="number"
                            name="unit_price"
                            placeholder="Unit Price"
                            value={item.unit_price}
                            onChange={(e) => handleProductChange(index, e)}
                            min="0"
                            step="0.01"
                        />
                        <input
                            style={inputStyle}
                            type="number"
                            name="discount"
                            placeholder="Discount"
                            value={item.discount}
                            onChange={(e) => handleProductChange(index, e)}
                            min="0"
                            step="0.01"
                        />
                        <input
                            style={inputStyle}
                            type="number"
                            name="gst_percent"
                            placeholder="GST %"
                            value={item.gst_percent}
                            onChange={(e) => handleProductChange(index, e)}
                            min="0"
                            step="0.01"
                        />
                    </div>
                    <br />

                    <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <input
                            type="checkbox"
                            name="gst_applicable"
                            checked={item.gst_applicable}
                            onChange={(e) => handleProductChange(index, e)}
                        />
                        GST Applicable
                    </label>
                    
                    <div style={{ marginTop: "10px", fontSize: "14px", color: "#555" }}>
                        <span>Subtotal: ₹{(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}</span>
                        <span style={{ marginLeft: "15px" }}>GST: ₹{item.gst.toFixed(2)}</span>
                        <span style={{ marginLeft: "15px", fontWeight: "bold" }}>
                            Final: ₹{item.final_price.toFixed(2)}
                        </span>
                    </div>
                    <br />

                    <button
                        type="button"
                        onClick={() => removeProduct(index)}
                        style={{
                            padding: "8px 16px",
                            background: "#dc2626",
                            color: "#fff",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer"
                        }}
                    >
                        Remove Product
                    </button>
                </div>
            ))}

            <button
                type="button"
                onClick={addProduct}
                style={{
                    padding: "10px 20px",
                    background: "#2563eb",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px"
                }}
            >
                + Add Product
            </button>

            <br /><br />
            <hr />

            <h2>Bill Summary</h2>
            <div style={{ 
                background: "#f8f9fa", 
                padding: "20px", 
                borderRadius: "8px",
                marginBottom: "20px"
            }}>
                <p style={{ fontSize: "16px", margin: "5px 0" }}>
                    Subtotal: <b>₹{totals.subtotal.toFixed(2)}</b>
                </p>
                <p style={{ fontSize: "16px", margin: "5px 0" }}>
                    Total Discount: <b>₹{totals.totalDiscount.toFixed(2)}</b>
                </p>
                <p style={{ fontSize: "16px", margin: "5px 0" }}>
                    Total GST: <b>₹{totals.totalGST.toFixed(2)}</b>
                </p>
                <p style={{ fontSize: "20px", margin: "10px 0 0 0", borderTop: "2px solid #ddd", paddingTop: "10px" }}>
                    Grand Total: <b>₹{totals.grandTotal.toFixed(2)}</b>
                </p>
            </div>

            <div style={{ display: "flex", gap: "15px" }}>
                <button
                    onClick={saveExpense}
                    style={{
                        padding: "15px 30px",
                        background: "#16a34a",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "16px",
                        cursor: "pointer",
                        flex: 1
                    }}
                    disabled={saving}
                >
                    {saving ? "Saving..." : "Save Expense"}
                </button>
                
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        padding: "15px 30px",
                        background: "#6b7280",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "16px",
                        cursor: "pointer"
                    }}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}