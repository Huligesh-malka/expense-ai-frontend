import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";

export default function PurchaseDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [purchase, setPurchase] = useState(null);
    const [items, setItems] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("Cash");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadPurchase();
    }, []);

    const loadPurchase = async () => {
        try {
            const res = await API.get(`/purchases/details/${id}`);
            setPurchase(res.data.purchase);
            setItems(res.data.items || []);
            setPayments(res.data.payments || []);
        } catch (err) {
            console.log(err);
            alert("Failed to load purchase.");
        } finally {
            setLoading(false);
        }
    };

    const getStatus = () => {
        if (!purchase) return "";
        const total = Number(purchase.total_amount);
        const paid = Number(purchase.paid_amount);
        if (paid === total) return { text: "Fully Paid", icon: "🟢", color: "#15803d", bg: "#dcfce7" };
        if (paid > 0 && paid < total) return { text: "Partially Paid", icon: "🟠", color: "#b45309", bg: "#fef3c7" };
        return { text: "Not Paid", icon: "🔴", color: "#dc2626", bg: "#fee2e2" };
    };

    const handleAddPayment = async (e) => {
        e.preventDefault();
        if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
            alert("Please enter a valid amount");
            return;
        }

        const amount = parseFloat(paymentAmount);
        const due = Number(purchase.due_amount);

        if (amount > due) {
            alert(`Amount cannot exceed due amount: ₹${due.toFixed(2)}`);
            return;
        }

        setSubmitting(true);
        try {
            await API.post(`/purchases/${id}/pay`, {
                amount: amount,
                payment_method: paymentMethod
            });
            alert("Payment added successfully!");
            setShowPaymentForm(false);
            setPaymentAmount("");
            loadPurchase();
        } catch (err) {
            console.log(err);
            alert(err.response?.data?.message || "Failed to add payment");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: 40, textAlign: "center", fontSize: 20 }}>
                Loading Purchase...
            </div>
        );
    }

    if (!purchase) {
        return (
            <div style={{ padding: 40 }}>
                Purchase Not Found
            </div>
        );
    }

    const status = getStatus();
    const due = Number(purchase.total_amount) - Number(purchase.paid_amount);

    return (
        <div style={{
            background: "#f5f7fb",
            minHeight: "100vh",
            padding: 30
        }}>
            <div style={{
                maxWidth: 1100,
                margin: "auto",
                background: "#fff",
                borderRadius: 12,
                padding: 30,
                boxShadow: "0 2px 8px rgba(0,0,0,.08)"
            }}>
                {/* Header */}
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 25
                }}>
                    <div>
                        <h2 style={{ margin: 0 }}>Purchase Details</h2>
                        <p style={{ color: "#777" }}>{purchase.invoice_no}</p>
                    </div>
                    <button
                        onClick={() => navigate("/purchases")}
                        style={{
                            background: "#2563eb",
                            color: "#fff",
                            border: "none",
                            padding: "10px 18px",
                            borderRadius: 8,
                            cursor: "pointer"
                        }}
                    >
                        Back
                    </button>
                </div>

                {/* Basic Info */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 25,
                    marginBottom: 30,
                    background: "#f8fafc",
                    padding: 20,
                    borderRadius: 10
                }}>
                    <div>
                        <h3 style={{ marginBottom: 10 }}>Supplier</h3>
                        <p style={{ fontSize: 18, fontWeight: "bold", margin: 0 }}>
                            {purchase.supplier_name}
                        </p>
                        {purchase.company_name && (
                            <p style={{ color: "#6b7280", margin: "4px 0 0 0" }}>
                                {purchase.company_name}
                            </p>
                        )}
                        {purchase.supplier_phone && (
                            <p style={{ color: "#6b7280", margin: "4px 0 0 0" }}>
                                📞 {purchase.supplier_phone}
                            </p>
                        )}
                        {purchase.address && (
                            <p style={{ color: "#6b7280", margin: "4px 0 0 0" }}>
                                📍 {purchase.address}
                            </p>
                        )}
                    </div>
                    <div>
                        <h3 style={{ marginBottom: 10 }}>Invoice Details</h3>
                        <p><strong>Bill No:</strong> {purchase.invoice_no}</p>
                        <p><strong>Date:</strong> {new Date(purchase.created_at).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                        })}</p>
                        <p>
                            <strong>Status:</strong>{" "}
                            <span style={{
                                background: status.bg,
                                color: status.color,
                                padding: "4px 12px",
                                borderRadius: 20,
                                fontWeight: 600
                            }}>
                                {status.icon} {status.text}
                            </span>
                        </p>
                    </div>
                </div>

                {/* Products */}
                <h3 style={{ marginBottom: 15 }}>Products</h3>
                <div style={{ overflowX: "auto", marginBottom: 30 }}>
                    <table width="100%" cellPadding="12" style={{
                        borderCollapse: "collapse",
                        border: "1px solid #e5e7eb"
                    }}>
                        <thead>
                            <tr style={{ background: "#f3f4f6" }}>
                                <th align="left">Product</th>
                                <th align="center">Qty</th>
                                <th align="right">Price</th>
                                <th align="right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr key={index} style={{
                                    borderBottom: "1px solid #eee"
                                }}>
                                    <td>{item.product_name}</td>
                                    <td align="center">{item.quantity}</td>
                                    <td align="right">₹{Number(item.purchase_price).toFixed(2)}</td>
                                    <td align="right"><strong>₹{Number(item.total).toFixed(2)}</strong></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Summary */}
                <div style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginBottom: 30
                }}>
                    <div style={{
                        width: 350,
                        background: "#f8fafc",
                        padding: 20,
                        borderRadius: 10,
                        border: "1px solid #e5e7eb"
                    }}>
                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 8
                        }}>
                            <span>Total</span>
                            <strong>₹{Number(purchase.total_amount).toFixed(2)}</strong>
                        </div>
                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 8
                        }}>
                            <span>Paid</span>
                            <strong style={{ color: "#059669" }}>
                                ₹{Number(purchase.paid_amount).toFixed(2)}
                            </strong>
                        </div>
                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: 18,
                            fontWeight: "bold",
                            paddingTop: 10,
                            borderTop: "2px solid #e5e7eb"
                        }}>
                            <span>You Need to Pay</span>
                            <span style={{ color: due > 0 ? "#dc2626" : "#15803d" }}>
                                ₹{due.toFixed(2)}
                            </span>
                        </div>
                        <div style={{
                            marginTop: 10,
                            textAlign: "center"
                        }}>
                            <span style={{
                                background: status.bg,
                                color: status.color,
                                padding: "6px 16px",
                                borderRadius: 30,
                                fontSize: 14,
                                fontWeight: 600,
                                display: "inline-block"
                            }}>
                                {status.icon} {status.text}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Payments Made */}
                <h3 style={{ marginBottom: 15 }}>Payments Made</h3>
                {payments.length === 0 ? (
                    <p style={{ color: "#6b7280", marginBottom: 20 }}>No payments recorded yet</p>
                ) : (
                    <div style={{ marginBottom: 20 }}>
                        {payments.map((payment, index) => (
                            <div key={index} style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "12px 16px",
                                borderBottom: "1px solid #eee",
                                background: index % 2 === 0 ? "#fafafa" : "transparent"
                            }}>
                                <div>
                                    <div style={{ fontWeight: 500 }}>
                                        {new Date(payment.created_at).toLocaleDateString('en-IN', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </div>
                                    <div style={{ fontSize: 13, color: "#6b7280" }}>
                                        {payment.payment_method || "Cash"}
                                    </div>
                                </div>
                                <div style={{ fontWeight: "bold", color: "#059669" }}>
                                    ₹{Number(payment.amount).toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add Payment Button */}
                {due > 0 && (
                    <div style={{ marginBottom: 20 }}>
                        {!showPaymentForm ? (
                            <button
                                onClick={() => setShowPaymentForm(true)}
                                style={{
                                    background: "#22c55e",
                                    color: "#fff",
                                    border: "none",
                                    padding: "12px 24px",
                                    borderRadius: 8,
                                    cursor: "pointer",
                                    fontWeight: 600,
                                    fontSize: 15
                                }}
                            >
                                + Add Payment
                            </button>
                        ) : (
                            <form onSubmit={handleAddPayment} style={{
                                background: "#f8fafc",
                                padding: 20,
                                borderRadius: 10,
                                border: "1px solid #e5e7eb"
                            }}>
                                <h4 style={{ margin: "0 0 15px 0" }}>Add Payment</h4>
                                <div style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 12
                                }}>
                                    <div style={{ flex: 1, minWidth: "150px" }}>
                                        <label style={{ display: "block", fontSize: 14, color: "#6b7280", marginBottom: 4 }}>
                                            Amount
                                        </label>
                                        <input
                                            type="number"
                                            value={paymentAmount}
                                            onChange={(e) => setPaymentAmount(e.target.value)}
                                            placeholder="Enter amount"
                                            style={{
                                                width: "100%",
                                                padding: "10px 12px",
                                                border: "1px solid #ddd",
                                                borderRadius: 6,
                                                outline: "none",
                                                fontSize: 14
                                            }}
                                            required
                                        />
                                    </div>
                                    <div style={{ flex: 1, minWidth: "150px" }}>
                                        <label style={{ display: "block", fontSize: 14, color: "#6b7280", marginBottom: 4 }}>
                                            Payment Method
                                        </label>
                                        <select
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            style={{
                                                width: "100%",
                                                padding: "10px 12px",
                                                border: "1px solid #ddd",
                                                borderRadius: 6,
                                                outline: "none",
                                                fontSize: 14,
                                                background: "#fff"
                                            }}
                                        >
                                            <option value="Cash">Cash</option>
                                            <option value="UPI">UPI</option>
                                            <option value="Bank Transfer">Bank Transfer</option>
                                            <option value="Cheque">Cheque</option>
                                            <option value="Card">Card</option>
                                        </select>
                                    </div>
                                </div>
                                <div style={{
                                    display: "flex",
                                    gap: 10,
                                    marginTop: 15
                                }}>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        style={{
                                            background: "#22c55e",
                                            color: "#fff",
                                            border: "none",
                                            padding: "10px 20px",
                                            borderRadius: 6,
                                            cursor: submitting ? "not-allowed" : "pointer",
                                            fontWeight: 600
                                        }}
                                    >
                                        {submitting ? "Processing..." : "Add Payment"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowPaymentForm(false);
                                            setPaymentAmount("");
                                        }}
                                        style={{
                                            background: "#ef4444",
                                            color: "#fff",
                                            border: "none",
                                            padding: "10px 20px",
                                            borderRadius: 6,
                                            cursor: "pointer"
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                                <div style={{ marginTop: 8, fontSize: 13, color: "#6b7280" }}>
                                    Due amount: ₹{due.toFixed(2)}
                                </div>
                            </form>
                        )}
                    </div>
                )}

                {/* Buttons */}
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 10
                }}>
                    <button
                        onClick={() => window.print()}
                        style={{
                            background: "#16a34a",
                            color: "#fff",
                            border: "none",
                            padding: "12px 22px",
                            borderRadius: 8,
                            cursor: "pointer"
                        }}
                    >
                        🖨️ Print Invoice
                    </button>
                    <div style={{ display: "flex", gap: 10 }}>
                        <button
                            onClick={() => navigate(`/edit-purchase/${purchase.id}`)}
                            style={{
                                background: "#f59e0b",
                                color: "#fff",
                                border: "none",
                                padding: "12px 22px",
                                borderRadius: 8,
                                cursor: "pointer"
                            }}
                        >
                            ✏️ Edit
                        </button>
                        <button
                            onClick={() => navigate("/purchases")}
                            style={{
                                background: "#2563eb",
                                color: "#fff",
                                border: "none",
                                padding: "12px 22px",
                                borderRadius: 8,
                                cursor: "pointer"
                            }}
                        >
                            Back to Purchases
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}