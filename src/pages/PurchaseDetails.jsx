// src/pages/PurchaseDetails.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function PurchaseDetails() {

    const { id } = useParams();
    const navigate = useNavigate();
    const [purchase, setPurchase] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPurchase();
    }, []);

    const loadPurchase = async () => {
        try {
            const res = await axios.get(
                `http://localhost:5000/api/purchases/details/${id}`
            );
            setPurchase(res.data.purchase);
            setItems(res.data.items || []);
        } catch (err) {
            console.log(err);
            alert("Failed to load purchase.");
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
                    fontSize: 20
                }}
            >
                Loading Purchase...
            </div>
        );
    }

    if (!purchase) {
        return (
            <div
                style={{
                    padding: 40
                }}
            >
                Purchase Not Found
            </div>
        );
    }

    return (
        <div
            style={{
                background: "#f5f7fb",
                minHeight: "100vh",
                padding: 30
            }}
        >
            <div
                style={{
                    maxWidth: 1100,
                    margin: "auto",
                    background: "#fff",
                    borderRadius: 12,
                    padding: 30,
                    boxShadow: "0 2px 8px rgba(0,0,0,.08)"
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 25
                    }}
                >
                    <div>
                        <h2
                            style={{
                                margin: 0
                            }}
                        >
                            Purchase Invoice
                        </h2>
                        <p
                            style={{
                                color: "#777"
                            }}
                        >
                            {purchase.invoice_no}
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
                            cursor: "pointer"
                        }}
                    >
                        Back
                    </button>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 25,
                        marginBottom: 30
                    }}
                >
                    <div>
                        <h3>Supplier Details</h3>
                        <p>
                            <strong>Name:</strong>
                            {purchase.supplier_name}
                        </p>
                        <p>
                            <strong>Company:</strong>
                            {purchase.company_name}
                        </p>
                        <p>
                            <strong>Phone:</strong>
                            {purchase.supplier_phone}
                        </p>
                        <p>
                            <strong>Address:</strong>
                            {purchase.address}
                        </p>
                    </div>
                    <div>
                        <h3>Invoice Details</h3>
                        <p>
                            <strong>Date:</strong>
                            {new Date(purchase.created_at).toLocaleDateString()}
                        </p>
                        <p>
                            <strong>Status:</strong>
                            {purchase.payment_status}
                        </p>
                        <p>
                            <strong>Payment:</strong>
                            {purchase.payment_method}
                        </p>
                    </div>
                </div>

                {/* Purchase Items */}
                <h3
                    style={{
                        marginBottom: 15
                    }}
                >
                    Purchase Items
                </h3>
                <div
                    style={{
                        overflowX: "auto"
                    }}
                >
                    <table
                        width="100%"
                        cellPadding="12"
                        style={{
                            borderCollapse: "collapse"
                        }}
                    >
                        <thead>
                            <tr
                                style={{
                                    background: "#2563eb",
                                    color: "#fff"
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
                            {
                                items.map((item, index) => (
                                    <tr
                                        key={index}
                                        style={{
                                            borderBottom: "1px solid #eee"
                                        }}
                                    >
                                        <td>
                                            {item.product_name}
                                        </td>
                                        <td align="center">
                                            {item.quantity}
                                        </td>
                                        <td align="right">
                                            ₹{Number(item.purchase_price).toFixed(2)}
                                        </td>
                                        <td align="right">
                                            ₹{Number(item.tax).toFixed(2)}
                                        </td>
                                        <td align="right">
                                            <strong>
                                                ₹{Number(item.total).toFixed(2)}
                                            </strong>
                                        </td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                </div>

                {/* Invoice Summary */}
                <div
                    style={{
                        marginTop: 30,
                        display: "flex",
                        justifyContent: "flex-end"
                    }}
                >
                    <div
                        style={{
                            width: 350,
                            background: "#f8fafc",
                            padding: 20,
                            borderRadius: 10,
                            border: "1px solid #e5e7eb"
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: 10
                            }}
                        >
                            <span>Subtotal</span>
                            <strong>
                                ₹{Number(purchase.subtotal).toFixed(2)}
                            </strong>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: 10
                            }}
                        >
                            <span>Discount</span>
                            <strong>
                                ₹{Number(purchase.discount).toFixed(2)}
                            </strong>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: 10
                            }}
                        >
                            <span>Tax</span>
                            <strong>
                                ₹{Number(purchase.tax).toFixed(2)}
                            </strong>
                        </div>
                        <hr />
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginTop: 15,
                                fontSize: 20,
                                fontWeight: "bold"
                            }}
                        >
                            <span>Total</span>
                            <span>
                                ₹{Number(purchase.total_amount).toFixed(2)}
                            </span>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginTop: 15
                            }}
                        >
                            <span>Paid</span>
                            <strong
                                style={{
                                    color: "green"
                                }}
                            >
                                ₹{Number(purchase.paid_amount).toFixed(2)}
                            </strong>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginTop: 10
                            }}
                        >
                            <span>Due</span>
                            <strong
                                style={{
                                    color: "red"
                                }}
                            >
                                ₹{Number(purchase.due_amount).toFixed(2)}
                            </strong>
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <div
                    style={{
                        marginTop: 35,
                        display: "flex",
                        justifyContent: "space-between"
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
                            cursor: "pointer"
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
                            cursor: "pointer"
                        }}
                    >
                        Back to Purchases
                    </button>
                </div>
            </div>
        </div>
    );
}