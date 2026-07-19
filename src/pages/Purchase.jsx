import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import {
    FiPlus,
    FiSearch,
    FiEye,
    FiEdit,
    FiTrash2,
    FiShoppingCart
} from "react-icons/fi";

export default function Purchase() {

    const businessId = localStorage.getItem("businessId");

    const [purchases, setPurchases] = useState([]);

    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");

    useEffect(() => {

        loadPurchases();

    }, []);

    const loadPurchases = async () => {

        try {

            const res = await axios.get(

                `http://localhost:5000/api/purchases?business_id=${businessId}`

            );

            setPurchases(res.data.data || []);

        } catch (err) {

            console.log(err);

            alert("Failed to load purchases");

        } finally {

            setLoading(false);

        }

    };

    const deletePurchase = async (id) => {

        const ok = window.confirm(
            "Delete this purchase?"
        );

        if (!ok) return;

        try {

            await axios.delete(

                `http://localhost:5000/api/purchases/${id}`

            );

            alert("Purchase Deleted");

            loadPurchases();

        } catch (err) {

            console.log(err);

            alert(
                err.response?.data?.message ||
                "Delete Failed"
            );

        }

    };

    const filteredPurchases = purchases.filter((item) =>

        item.invoice_no
            .toLowerCase()
            .includes(search.toLowerCase())

        ||

        item.supplier_name
            .toLowerCase()
            .includes(search.toLowerCase())

    );

    if (loading) {

        return (

            <div
                style={{
                    padding: 40,
                    textAlign: "center",
                    fontSize: 18
                }}
            >

                Loading Purchases...

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

            {/* Header */}

            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 25,
                    flexWrap: "wrap",
                    gap: 15
                }}
            >

                <div>

                    <h1
                        style={{
                            margin: 0,
                            color: "#1f2937"
                        }}
                    >
                        Purchases
                    </h1>

                    <p
                        style={{
                            color: "#6b7280"
                        }}
                    >
                        Manage Purchase Invoices
                    </p>

                </div>

                <Link to="/add-purchase">

                    <button
                        style={{
                            background: "#2563eb",
                            color: "#fff",
                            border: "none",
                            padding: "12px 20px",
                            borderRadius: 10,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            transition: "background 0.2s"
                        }}
                        onMouseEnter={(e) => e.target.style.background = "#1d4ed8"}
                        onMouseLeave={(e) => e.target.style.background = "#2563eb"}
                    >

                        <FiPlus />

                        New Purchase

                    </button>

                </Link>

            </div>

            {/* Search */}

            <div
                style={{
                    background: "#fff",
                    padding: 20,
                    borderRadius: 12,
                    marginBottom: 20
                }}
            >

                <div
                    style={{
                        position: "relative"
                    }}
                >

                    <FiSearch
                        style={{
                            position: "absolute",
                            top: 14,
                            left: 15,
                            color: "#999"
                        }}
                    />

                    <input

                        type="text"

                        placeholder="Search Invoice or Supplier"

                        value={search}

                        onChange={(e) => setSearch(e.target.value)}

                        style={{
                            width: "100%",
                            padding: "12px 45px",
                            border: "1px solid #ddd",
                            borderRadius: 8,
                            outline: "none",
                            fontSize: 14
                        }}

                    />

                </div>

            </div>

            {/* Purchase Table */}

            <div
                style={{
                    background: "#fff",
                    borderRadius: 12,
                    overflow: "hidden",
                    boxShadow: "0 2px 8px rgba(0,0,0,.08)",
                    overflowX: "auto"
                }}
            >

                <table
                    width="100%"
                    cellPadding="15"
                    style={{
                        borderCollapse: "collapse",
                        minWidth: "800px"
                    }}
                >

                    <thead>

                        <tr
                            style={{
                                background: "#2563eb",
                                color: "#fff"
                            }}
                        >

                            <th align="left">Invoice</th>

                            <th align="left">Supplier</th>

                            <th align="left">Total</th>

                            <th align="left">Paid</th>

                            <th align="left">Due</th>

                            <th align="left">Status</th>

                            <th align="center">Action</th>

                        </tr>

                    </thead>

                    <tbody>

                        {filteredPurchases.length === 0 && (

                            <tr>

                                <td
                                    colSpan="7"
                                    align="center"
                                    style={{
                                        padding: 40
                                    }}
                                >

                                    No Purchases Found

                                </td>

                            </tr>

                        )}

                        {filteredPurchases.map((purchase) => (

                            <tr
                                key={purchase.id}
                                style={{
                                    borderBottom: "1px solid #eee",
                                    transition: "background 0.2s"
                                }}
                                onMouseEnter={(e) => e.target.style.background = "#f8fafc"}
                                onMouseLeave={(e) => e.target.style.background = "transparent"}
                            >

                                <td>

                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 10
                                        }}
                                    >

                                        <div
                                            style={{
                                                width: 45,
                                                height: 45,
                                                borderRadius: "50%",
                                                background: "#dbeafe",
                                                display: "flex",
                                                justifyContent: "center",
                                                alignItems: "center",
                                                flexShrink: 0
                                            }}
                                        >

                                            <FiShoppingCart color="#2563eb" />

                                        </div>

                                        <div>

                                            <div
                                                style={{
                                                    fontWeight: "bold"
                                                }}
                                            >
                                                {purchase.invoice_no}
                                            </div>

                                            <div
                                                style={{
                                                    fontSize: 13,
                                                    color: "#777"
                                                }}
                                            >
                                                {new Date(purchase.created_at).toLocaleDateString('en-IN', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </div>

                                        </div>

                                    </div>

                                </td>

                                <td>

                                    <div
                                        style={{
                                            fontWeight: 600
                                        }}
                                    >

                                        {purchase.supplier_name}

                                    </div>

                                </td>

                                <td>

                                    ₹{Number(purchase.total_amount).toFixed(2)}

                                </td>

                                <td>

                                    ₹{Number(purchase.paid_amount).toFixed(2)}

                                </td>

                                <td>

                                    ₹{Number(purchase.due_amount).toFixed(2)}

                                </td>

                                <td>

                                    <span
                                        style={{
                                            background:
                                                purchase.payment_status === "Paid"
                                                    ? "#dcfce7"
                                                    : purchase.payment_status === "Pending"
                                                        ? "#fee2e2"
                                                        : "#fef3c7",

                                            color:
                                                purchase.payment_status === "Paid"
                                                    ? "#15803d"
                                                    : purchase.payment_status === "Pending"
                                                        ? "#dc2626"
                                                        : "#b45309",

                                            padding: "6px 14px",

                                            borderRadius: 30,

                                            fontSize: 13,

                                            fontWeight: 600,

                                            display: "inline-block"
                                        }}
                                    >

                                        {purchase.payment_status}

                                    </span>

                                </td>

                                <td align="center">

                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "center",
                                            gap: 8,
                                            flexWrap: "wrap"
                                        }}
                                    >

                                        <Link
                                            to={`/purchase/${purchase.id}`}
                                        >

                                            <button
                                                style={{
                                                    background: "#0ea5e9",
                                                    color: "#fff",
                                                    border: "none",
                                                    padding: "8px 10px",
                                                    borderRadius: 8,
                                                    cursor: "pointer",
                                                    transition: "transform 0.1s, background 0.2s",
                                                    display: "inline-flex",
                                                    alignItems: "center"
                                                }}
                                                title="View Purchase"
                                                onMouseEnter={(e) => {
                                                    e.target.style.background = "#0284c7";
                                                    e.target.style.transform = "scale(1.05)";
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.background = "#0ea5e9";
                                                    e.target.style.transform = "scale(1)";
                                                }}
                                            >

                                                <FiEye />

                                            </button>

                                        </Link>

                                        <Link
                                            to={`/edit-purchase/${purchase.id}`}
                                        >

                                            <button
                                                style={{
                                                    background: "#f59e0b",
                                                    color: "#fff",
                                                    border: "none",
                                                    padding: "8px 10px",
                                                    borderRadius: 8,
                                                    cursor: "pointer",
                                                    transition: "transform 0.1s, background 0.2s",
                                                    display: "inline-flex",
                                                    alignItems: "center"
                                                }}
                                                title="Edit Purchase"
                                                onMouseEnter={(e) => {
                                                    e.target.style.background = "#d97706";
                                                    e.target.style.transform = "scale(1.05)";
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.background = "#f59e0b";
                                                    e.target.style.transform = "scale(1)";
                                                }}
                                            >

                                                <FiEdit />

                                            </button>

                                        </Link>

                                        <button

                                            onClick={() => deletePurchase(purchase.id)}

                                            style={{
                                                background: "#ef4444",
                                                color: "#fff",
                                                border: "none",
                                                padding: "8px 10px",
                                                borderRadius: 8,
                                                cursor: "pointer",
                                                transition: "transform 0.1s, background 0.2s",
                                                display: "inline-flex",
                                                alignItems: "center"
                                            }}
                                            title="Delete Purchase"
                                            onMouseEnter={(e) => {
                                                e.target.style.background = "#dc2626";
                                                e.target.style.transform = "scale(1.05)";
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.background = "#ef4444";
                                                e.target.style.transform = "scale(1)";
                                            }}
                                        >

                                            <FiTrash2 />

                                        </button>

                                    </div>

                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

        </div>

    );

}