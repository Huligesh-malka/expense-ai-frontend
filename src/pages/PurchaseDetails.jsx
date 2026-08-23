// src/pages/PurchaseDetails.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";

export default function PurchaseDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [purchase, setPurchase] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadPurchase();
    }, [id]);

    const loadPurchase = async () => {
        try {
            setError(null);
            setLoading(true);
            const res = await API.get(`/purchases/details/${id}`);
            setPurchase(res.data.purchase);
            setItems(res.data.items || []);
        } catch (err) {
            console.error("Failed to load purchase:", err);
            setError(err.response?.data?.message || "Failed to load purchase. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div
                style={{
                    padding: 40,
                    textAlign: "center",
                    fontSize: 20,
                    minHeight: "100vh",
                    background: "#f5f7fb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <div>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>⏳</div>
                    Loading Purchase...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div
                style={{
                    padding: 40,
                    minHeight: "100vh",
                    background: "#f5f7fb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <div
                    style={{
                        background: "#fff",
                        padding: 40,
                        borderRadius: 12,
                        textAlign: "center",
                        maxWidth: 400,
                        boxShadow: "0 2px 8px rgba(0,0,0,.08)",
                    }}
                >
                    <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
                    <h3 style={{ color: "#dc2626", margin: "0 0 8px 0" }}>Error</h3>
                    <p style={{ color: "#666", margin: "0 0 20px 0" }}>{error}</p>
                    <button
                        onClick={loadPurchase}
                        style={{
                            background: "#2563eb",
                            color: "#fff",
                            border: "none",
                            padding: "10px 24px",
                            borderRadius: 8,
                            cursor: "pointer",
                            fontSize: 14,
                        }}
                    >
                        🔄 Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!purchase) {
        return (
            <div
                style={{
                    padding: 40,
                    minHeight: "100vh",
                    background: "#f5f7fb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <div
                    style={{
                        background: "#fff",
                        padding: 40,
                        borderRadius: 12,
                        textAlign: "center",
                        maxWidth: 400,
                        boxShadow: "0 2px 8px rgba(0,0,0,.08)",
                    }}
                >
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
                    <h3 style={{ margin: "0 0 8px 0" }}>Purchase Not Found</h3>
                    <p style={{ color: "#666", margin: "0 0 20px 0" }}>
                        The purchase invoice you're looking for doesn't exist.
                    </p>
                    <button
                        onClick={() => navigate("/purchases")}
                        style={{
                            background: "#2563eb",
                            color: "#fff",
                            border: "none",
                            padding: "10px 24px",
                            borderRadius: 8,
                            cursor: "pointer",
                            fontSize: 14,
                        }}
                    >
                        ← Back to Purchases
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            style={{
                background: "#f5f7fb",
                minHeight: "100vh",
                padding: "30px 15px",
            }}
        >
            <div
                style={{
                    maxWidth: 1100,
                    margin: "auto",
                    background: "#fff",
                    borderRadius: 12,
                    padding: "30px 20px",
                    boxShadow: "0 2px 8px rgba(0,0,0,.08)",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 25,
                        flexWrap: "wrap",
                        gap: 12,
                    }}
                >
                    <div>
                        <h2
                            style={{
                                margin: 0,
                                fontSize: "clamp(20px, 4vw, 28px)",
                            }}
                        >
                            Purchase Invoice
                        </h2>
                        <p
                            style={{
                                color: "#777",
                                margin: "4px 0 0 0",
                            }}
                        >
                            #{purchase.invoice_no}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate("/purchases")}
                        style={{
                            background: "#2563eb",
                            color: "#fff",
                            border: "none",
                            padding: "10px 18px",
                            borderRadius: 8,
                            cursor: "pointer",
                            fontSize: 14,
                            whiteSpace: "nowrap",
                        }}
                    >
                        ← Back
                    </button>
                </div>

                {/* Supplier & Invoice Details - Responsive Grid */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr",
                        gap: 25,
                        marginBottom: 30,
                    }}
                >
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr",
                            gap: 25,
                        }}
                    >
                        <div>
                            <h3
                                style={{
                                    margin: "0 0 12px 0",
                                    color: "#1e293b",
                                }}
                            >
                                Supplier Details
                            </h3>
                            <div
                                style={{
                                    display: "grid",
                                    gap: 6,
                                }}
                            >
                                <p style={{ margin: 0 }}>
                                    <strong>Name:</strong> {purchase.supplier_name}
                                </p>
                                <p style={{ margin: 0 }}>
                                    <strong>Company:</strong> {purchase.company_name}
                                </p>
                                <p style={{ margin: 0 }}>
                                    <strong>Phone:</strong> {purchase.supplier_phone}
                                </p>
                                <p style={{ margin: 0 }}>
                                    <strong>Address:</strong> {purchase.address}
                                </p>
                            </div>
                        </div>
                        <div>
                            <h3
                                style={{
                                    margin: "0 0 12px 0",
                                    color: "#1e293b",
                                }}
                            >
                                Invoice Details
                            </h3>
                            <div
                                style={{
                                    display: "grid",
                                    gap: 6,
                                }}
                            >
                                <p style={{ margin: 0 }}>
                                    <strong>Date:</strong>{" "}
                                    {new Date(purchase.created_at).toLocaleDateString(
                                        "en-IN",
                                        {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                        }
                                    )}
                                </p>
                                <p style={{ margin: 0 }}>
                                    <strong>Status:</strong>{" "}
                                    <span
                                        style={{
                                            display: "inline-block",
                                            padding: "2px 12px",
                                            borderRadius: 20,
                                            fontSize: 12,
                                            fontWeight: 600,
                                            background:
                                                purchase.payment_status === "Paid"
                                                    ? "#dcfce7"
                                                    : purchase.payment_status === "Partial"
                                                    ? "#fef9c3"
                                                    : "#fee2e2",
                                            color:
                                                purchase.payment_status === "Paid"
                                                    ? "#166534"
                                                    : purchase.payment_status === "Partial"
                                                    ? "#854d0e"
                                                    : "#991b1b",
                                        }}
                                    >
                                        {purchase.payment_status}
                                    </span>
                                </p>
                                <p style={{ margin: 0 }}>
                                    <strong>Payment:</strong> {purchase.payment_method}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Purchase Items */}
                <h3
                    style={{
                        marginBottom: 15,
                        color: "#1e293b",
                    }}
                >
                    Purchase Items
                </h3>
                <div
                    style={{
                        overflowX: "auto",
                        marginBottom: 10,
                    }}
                >
                    <table
                        width="100%"
                        cellPadding="12"
                        style={{
                            borderCollapse: "collapse",
                            minWidth: 500,
                        }}
                    >
                        <thead>
                            <tr
                                style={{
                                    background: "#2563eb",
                                    color: "#fff",
                                }}
                            >
                                <th align="left">Product</th>
                                <th align="center">Qty</th>
                                <th align="right">Price</th>
                                <th align="right">Tax</th>
                                <th align="right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr
                                    key={index}
                                    style={{
                                        borderBottom: "1px solid #eee",
                                    }}
                                >
                                    <td>{item.product_name}</td>
                                    <td align="center">{item.quantity}</td>
                                    <td align="right">
                                        ₹{Number(item.purchase_price).toFixed(2)}
                                    </td>
                                    <td align="right">
                                        ₹{Number(item.tax).toFixed(2)}
                                    </td>
                                    <td align="right">
                                        <strong>₹{Number(item.total).toFixed(2)}</strong>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Invoice Summary - Responsive */}
                <div
                    style={{
                        marginTop: 30,
                        display: "flex",
                        justifyContent: "flex-end",
                    }}
                >
                    <div
                        style={{
                            width: "100%",
                            maxWidth: 350,
                            background: "#f8fafc",
                            padding: 20,
                            borderRadius: 10,
                            border: "1px solid #e5e7eb",
                            boxSizing: "border-box",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: 10,
                            }}
                        >
                            <span>Subtotal</span>
                            <strong>₹{Number(purchase.subtotal).toFixed(2)}</strong>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: 10,
                            }}
                        >
                            <span>Discount</span>
                            <strong>₹{Number(purchase.discount).toFixed(2)}</strong>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: 10,
                            }}
                        >
                            <span>Tax</span>
                            <strong>₹{Number(purchase.tax).toFixed(2)}</strong>
                        </div>
                        <hr
                            style={{
                                border: "none",
                                borderTop: "1px solid #d1d5db",
                                margin: "12px 0",
                            }}
                        />
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginTop: 15,
                                fontSize: "clamp(18px, 3vw, 20px)",
                                fontWeight: "bold",
                            }}
                        >
                            <span>Total</span>
                            <span>₹{Number(purchase.total_amount).toFixed(2)}</span>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginTop: 15,
                            }}
                        >
                            <span>Paid</span>
                            <strong
                                style={{
                                    color: "#16a34a",
                                }}
                            >
                                ₹{Number(purchase.paid_amount).toFixed(2)}
                            </strong>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginTop: 10,
                            }}
                        >
                            <span>Due</span>
                            <strong
                                style={{
                                    color: "#dc2626",
                                }}
                            >
                                ₹{Number(purchase.due_amount).toFixed(2)}
                            </strong>
                        </div>
                    </div>
                </div>

                {/* Buttons - Responsive */}
                <div
                    style={{
                        marginTop: 35,
                        display: "flex",
                        gap: 12,
                        flexWrap: "wrap",
                        justifyContent: "space-between",
                    }}
                >
                    <button
                        onClick={() => window.print()}
                        style={{
                            background: "#16a34a",
                            color: "#fff",
                            border: "none",
                            padding: "12px 22px",
                            borderRadius: 8,
                            cursor: "pointer",
                            fontSize: 14,
                            flex: "1 1 auto",
                            minWidth: 120,
                            whiteSpace: "nowrap",
                        }}
                    >
                        🖨️ Print Invoice
                    </button>
                    <button
                        onClick={() => navigate("/purchases")}
                        style={{
                            background: "#2563eb",
                            color: "#fff",
                            border: "none",
                            padding: "12px 22px",
                            borderRadius: 8,
                            cursor: "pointer",
                            fontSize: 14,
                            flex: "1 1 auto",
                            minWidth: 120,
                            whiteSpace: "nowrap",
                        }}
                    >
                        ← Back to Purchases
                    </button>
                </div>
            </div>
        </div>
    );
}