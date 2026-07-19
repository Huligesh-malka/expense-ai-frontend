import { useState, useEffect } from "react";
import axios from "axios";
import {
  FiPlus,
  FiTrash2,
  FiSave,
  FiX,
  FiShoppingCart,
  FiTag,
  FiDollarSign,
  FiCalendar,
  FiCreditCard,
  FiFileText,
  FiHome,
  FiPercent,
  FiGift,
} from "react-icons/fi";
import { Link } from "react-router-dom";

export default function AddExpense() {
  const [form, setForm] = useState({
    user_id: 1,
    merchant: "",
    expense_name: "",
    category_id: "",
    amount: "",
    expense_date: "",
    payment_method: "",
    notes: "",
  });

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
  const [manualAmount, setManualAmount] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // If amount is being manually changed, clear products mode
    if (name === "amount") {
      setManualAmount(value);
      setForm({
        ...form,
        [name]: value,
      });
      // If user manually enters amount, clear products
      if (products.length > 0) {
        setProducts([]);
      }
    } else {
      setForm({
        ...form,
        [name]: value,
      });
    }
  };

  const handleProductChange = (index, e) => {
    const { name, value, type, checked } = e.target;
    const updated = [...products];
    
    if (type === "checkbox") {
      updated[index][name] = checked;
    } else if (type === "number") {
      updated[index][name] = value === "" ? "" : parseFloat(value) || 0;
    } else {
      updated[index][name] = value;
    }
    
    // Auto-calculate GST and final price
    const item = updated[index];
    if (item.unit_price !== "" && item.quantity > 0) {
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
    
    setProducts(updated);
    // Clear manual amount when products are updated
    setManualAmount("");
  };

  const addProduct = () => {
    setProducts([
      ...products,
      {
        product_name: "",
        quantity: 1,
        unit_price: "",
        discount: 0,
        gst_applicable: true,
        gst_percent: 18,
        gst_amount: 0,
        final_price: 0,
      },
    ]);
    // Clear manual amount when adding product
    setManualAmount("");
  };

  const removeProduct = (index) => {
    const updated = [...products];
    updated.splice(index, 1);
    setProducts(updated);
    if (updated.length === 0) {
      setManualAmount("");
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

    // Only calculate if there are products
    if (products.length > 0 && products.some(p => p.product_name.trim() !== "" || p.unit_price !== "")) {
      products.forEach((item) => {
        if (item.unit_price && item.quantity > 0) {
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
    }
  }, [products, extras]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate that either amount is filled manually or products exist
    if (!form.amount || parseFloat(form.amount) <= 0) {
      alert("Please enter an amount or add products with prices");
      return;
    }

    try {
      const filteredProducts = products.filter(
        (item) => item.product_name.trim() !== "" && item.unit_price !== ""
      );

      const res = await axios.post(
        "http://localhost:5000/api/expenses/add",
        {
          ...form,
          products: filteredProducts,
          bill_summary: filteredProducts.length > 0 ? billSummary : null,
          extras: filteredProducts.length > 0 ? extras : null,
        }
      );

      alert(res.data.message);

      setForm({
        user_id: 1,
        merchant: "",
        expense_name: "",
        category_id: "",
        amount: "",
        expense_date: "",
        payment_method: "",
        notes: "",
      });

      setProducts([]);
      setExtras({
        couponDiscount: 0,
        deliveryCharge: 0,
        packingCharge: 0,
        serviceCharge: 0,
        roundOff: 0,
      });
      setManualAmount("");
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Unable to save expense");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f5f7fb 0%, #e8edf5 100%)",
        padding: "30px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {/* Header with Back Button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "30px",
          }}
        >
          <Link
            to="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#64748b",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: "500",
              padding: "8px 16px",
              borderRadius: "8px",
              background: "#fff",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#2563eb";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.color = "#64748b";
            }}
          >
            <FiHome size={18} /> Back to Dashboard
          </Link>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "700",
              color: "#1a2332",
              margin: 0,
            }}
          >
            Add Expense
          </h1>
        </div>

        {/* Main Form Card */}
        <div
          style={{
            background: "#fff",
            padding: "35px",
            borderRadius: "16px",
            boxShadow: "0 4px 12px rgba(0,0,0,.08)",
            border: "1px solid rgba(0,0,0,.04)",
          }}
        >
          <form onSubmit={handleSubmit}>
            {/* Two Column Layout */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
              }}
            >
              {/* Left Column */}
              <div>
                <div style={inputGroupStyle}>
                  <label style={labelStyle}>
                    <FiShoppingCart size={16} /> Merchant *
                  </label>
                  <input
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
                    <FiTag size={16} /> Expense Name *
                  </label>
                  <input
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
                    <FiDollarSign size={16} /> Amount *
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
                      background: products.length > 0 ? "#f1f5f9" : "#fafbfc",
                    }}
                    readOnly={products.length > 0}
                  />
                  {products.length > 0 && (
                    <span style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                      ℹ️ Amount is auto-calculated from products. To enter manually, remove all products.
                    </span>
                  )}
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>
                    <FiCalendar size={16} /> Date *
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
                  <label style={labelStyle}>Category *</label>
                  <select
                    name="category_id"
                    value={form.category_id}
                    onChange={handleChange}
                    required
                    style={selectStyle}
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
                  <label style={labelStyle}>
                    <FiCreditCard size={16} /> Payment Method
                  </label>
                  <select
                    name="payment_method"
                    value={form.payment_method}
                    onChange={handleChange}
                    style={selectStyle}
                  >
                    <option value="">Select Payment Method</option>
                    <option>💵 Cash</option>
                    <option>📱 UPI</option>
                    <option>💳 Credit Card</option>
                    <option>💳 Debit Card</option>
                    <option>🏦 Net Banking</option>
                  </select>
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>
                    <FiFileText size={16} /> Notes
                  </label>
                  <textarea
                    name="notes"
                    placeholder="Additional notes about this expense..."
                    value={form.notes}
                    onChange={handleChange}
                    rows="4"
                    style={textareaStyle}
                  />
                </div>
              </div>
            </div>

            {/* Products Section */}
            <div
              style={{
                marginTop: "30px",
                paddingTop: "25px",
                borderTop: "2px solid #f1f5f9",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                }}
              >
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#1a2332",
                    margin: 0,
                  }}
                >
                  🛍️ Products (Optional)
                </h2>
                <button
                  type="button"
                  onClick={addProduct}
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
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 6px 20px rgba(37, 99, 235, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <FiPlus /> Add Product
                </button>
              </div>

              {products.length > 0 && (
                <div
                  style={{
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
                  }}
                >
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

              {products.map((item, index) => (
                <div
                  key={index}
                  style={{
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
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#2563eb";
                    e.currentTarget.style.boxShadow =
                      "0 2px 8px rgba(37, 99, 235, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e8edf5";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <input
                    name="product_name"
                    placeholder="Product Name"
                    value={item.product_name}
                    onChange={(e) => handleProductChange(index, e)}
                    style={productInputStyle}
                  />
                  <input
                    type="number"
                    name="quantity"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => handleProductChange(index, e)}
                    style={productInputStyle}
                  />
                  <input
                    type="number"
                    name="unit_price"
                    placeholder="Price"
                    value={item.unit_price}
                    onChange={(e) => handleProductChange(index, e)}
                    style={productInputStyle}
                  />
                  <input
                    type="number"
                    name="discount"
                    placeholder="₹0"
                    value={item.discount}
                    onChange={(e) => handleProductChange(index, e)}
                    style={productInputStyle}
                  />
                  <input
                    type="checkbox"
                    name="gst_applicable"
                    checked={item.gst_applicable}
                    onChange={(e) => handleProductChange(index, e)}
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
                    name="gst_percent"
                    placeholder="%"
                    value={item.gst_percent}
                    onChange={(e) => handleProductChange(index, e)}
                    disabled={!item.gst_applicable}
                    style={{
                      ...productInputStyle,
                      opacity: item.gst_applicable ? 1 : 0.5,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#1a2332",
                      textAlign: "center",
                    }}
                  >
                    ₹{item.gst_amount || 0}
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "700",
                      color: "#16a34a",
                      textAlign: "center",
                    }}
                  >
                    ₹{item.final_price || 0}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeProduct(index)}
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
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#dc2626";
                      e.currentTarget.style.color = "#fff";
                      e.currentTarget.style.borderColor = "#dc2626";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#fef2f2";
                      e.currentTarget.style.color = "#dc2626";
                      e.currentTarget.style.borderColor = "#fecaca";
                    }}
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Bill Summary Section */}
            {products.length > 0 && products.some(p => p.product_name || p.unit_price) && (
              <div
                style={{
                  marginTop: "30px",
                  padding: "25px",
                  background: "#f8fafc",
                  borderRadius: "12px",
                  border: "1px solid #e8edf5",
                }}
              >
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#1a2332",
                    marginBottom: "20px",
                  }}
                >
                  📊 Bill Summary
                </h3>

                {/* Main Summary */}
                <div style={{ maxWidth: "400px", marginLeft: "auto" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom: "1px solid #e8edf5",
                    }}
                  >
                    <span style={{ color: "#64748b" }}>Subtotal</span>
                    <span style={{ fontWeight: "600", color: "#1a2332" }}>
                      ₹{billSummary.subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom: "1px solid #e8edf5",
                      color: "#dc2626",
                    }}
                  >
                    <span>Discount</span>
                    <span>-₹{billSummary.totalDiscount.toFixed(2)}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom: "1px solid #e8edf5",
                      color: "#2563eb",
                    }}
                  >
                    <span>GST</span>
                    <span>+₹{billSummary.totalGST.toFixed(2)}</span>
                  </div>

                  {/* Extras */}
                  <div style={{ marginTop: "10px" }}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "10px",
                        marginTop: "10px",
                      }}
                    >
                      <div style={inputGroupStyle}>
                        <label style={smallLabelStyle}>
                          <FiGift size={12} /> Coupon Discount
                        </label>
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
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "12px 0",
                      marginTop: "10px",
                      borderTop: "2px solid #1a2332",
                      fontSize: "18px",
                      fontWeight: "700",
                      color: "#1a2332",
                    }}
                  >
                    <span>Grand Total</span>
                    <span>₹{billSummary.grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div
              style={{
                marginTop: "30px",
                display: "flex",
                gap: "15px",
                justifyContent: "flex-end",
              }}
            >
              <Link to="/">
                <button
                  type="button"
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
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#e2e8f0";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#f1f5f9";
                  }}
                >
                  <FiX size={18} /> Cancel
                </button>
              </Link>
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
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 20px rgba(22, 163, 74, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(22, 163, 74, 0.3)";
                }}
              >
                <FiSave size={18} /> Save Expense
              </button>
            </div>
          </form>
        </div>
      </div>
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

const selectStyle = {
  padding: "12px 16px",
  border: "2px solid #e8edf5",
  borderRadius: "10px",
  fontSize: "14px",
  transition: "all 0.3s ease",
  outline: "none",
  background: "#fafbfc",
  width: "100%",
  boxSizing: "border-box",
  cursor: "pointer",
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