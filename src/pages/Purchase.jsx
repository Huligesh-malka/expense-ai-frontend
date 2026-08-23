import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

import {
    FiPlus,
    FiSearch,
    FiEye,
    FiShoppingCart,
    FiDollarSign,
    FiClock,
    FiCheckCircle,
    FiAlertCircle
} from "react-icons/fi";

export default function Purchase() {

    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("All");
    const [filterSupplier, setFilterSupplier] = useState("All");
    const [filterDate, setFilterDate] = useState("All");

    // Summary calculations
    const [summary, setSummary] = useState({
        totalPurchases: 0,
        totalBought: 0,
        totalPaid: 0,
        totalDue: 0
    });

    useEffect(() => {
        loadPurchases();
    }, []);

    const loadPurchases = async () => {
        try {
            const res = await API.get("/purchases");
            const data = res.data.data || [];
            setPurchases(data);
            calculateSummary(data);
        } catch (err) {
            console.log(err);
            alert("Failed to load purchases");
        } finally {
            setLoading(false);
        }
    };

    const calculateSummary = (data) => {
        const totalPurchases = data.length;
        const totalBought = data.reduce((sum, p) => sum + Number(p.total_amount), 0);
        const totalPaid = data.reduce((sum, p) => sum + Number(p.paid_amount), 0);
        const totalDue = totalBought - totalPaid;

        setSummary({
            totalPurchases,
            totalBought,
            totalPaid,
            totalDue
        });
    };

    const getStatus = (purchase) => {
        const total = Number(purchase.total_amount);
        const paid = Number(purchase.paid_amount);

        if (paid === total) return "Fully Paid";
        if (paid > 0 && paid < total) return "Partially Paid";
        return "Not Paid";
    };

    const getStatusColor = (status) => {
        switch(status) {
            case "Fully Paid": return { bg: "#dcfce7", color: "#15803d", icon: "🟢" };
            case "Partially Paid": return { bg: "#fef3c7", color: "#b45309", icon: "🟠" };
            case "Not Paid": return { bg: "#fee2e2", color: "#dc2626", icon: "🔴" };
            default: return { bg: "#f3f4f6", color: "#6b7280", icon: "⚪" };
        }
    };

    const getUniqueSuppliers = () => {
        const suppliers = purchases.map(p => p.supplier_name);
        return ["All", ...new Set(suppliers)];
    };

    const getFilteredPurchases = () => {
        let filtered = purchases;

        // Search filter
        if (search) {
            filtered = filtered.filter((item) =>
                item.invoice_no.toLowerCase().includes(search.toLowerCase()) ||
                item.supplier_name.toLowerCase().includes(search.toLowerCase())
            );
        }

        // Status filter
        if (filterStatus !== "All") {
            filtered = filtered.filter(item => getStatus(item) === filterStatus);
        }

        // Supplier filter
        if (filterSupplier !== "All") {
            filtered = filtered.filter(item => item.supplier_name === filterSupplier);
        }

        // Date filter (last 7 days, 30 days, etc.)
        if (filterDate !== "All") {
            const now = new Date();
            const filterDays = parseInt(filterDate);
            const cutoffDate = new Date(now.setDate(now.getDate() - filterDays));
            filtered = filtered.filter(item => 
                new Date(item.created_at) >= cutoffDate
            );
        }

        return filtered;
    };

    const filteredPurchases = getFilteredPurchases();
    const suppliers = getUniqueSuppliers();

    if (loading) {
        return (
            <div style={{ padding: 40, textAlign: "center", fontSize: 18 }}>
                Loading Purchases...
            </div>
        );
    }

    // Summary Card Component
    const SummaryCard = ({ icon, title, value, color = "#2563eb" }) => (
        <div style={{
            background: "#fff",
            padding: "20px 24px",
            borderRadius: 12,
            boxShadow: "0 2px 8px rgba(0,0,0,.06)",
            flex: 1,
            minWidth: "180px",
            borderLeft: `4px solid ${color}`
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                    background: `${color}20`,
                    padding: 10,
                    borderRadius: 10,
                    color: color
                }}>
                    {icon}
                </div>
                <div>
                    <div style={{ fontSize: 13, color: "#6b7280" }}>{title}</div>
                    <div style={{ fontSize: 22, fontWeight: "bold", color: "#1f2937" }}>
                        {typeof value === 'number' ? `₹${value.toLocaleString('en-IN')}` : value}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div style={{
            background: "#f5f7fb",
            minHeight: "100vh",
            padding: 30
        }}>

            {/* Header */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 25,
                flexWrap: "wrap",
                gap: 15
            }}>
                <div>
                    <h1 style={{ margin: 0, color: "#1f2937" }}>Purchase History</h1>
                    <p style={{ color: "#6b7280" }}>View and manage all purchase invoices</p>
                </div>
                <Link to="/add-purchase">
                    <button style={{
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
                    onMouseLeave={(e) => e.target.style.background = "#2563eb"}>
                        <FiPlus />
                        New Purchase
                    </button>
                </Link>
            </div>

            {/* Summary Cards */}
            <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 16,
                marginBottom: 25
            }}>
                <SummaryCard
                    icon={<FiShoppingCart size={22} />}
                    title="Total Purchases"
                    value={summary.totalPurchases}
                    color="#2563eb"
                />
                <SummaryCard
                    icon={<FiDollarSign size={22} />}
                    title="Total Bought"
                    value={summary.totalBought}
                    color="#059669"
                />
                <SummaryCard
                    icon={<FiCheckCircle size={22} />}
                    title="Already Paid"
                    value={summary.totalPaid}
                    color="#7c3aed"
                />
                <SummaryCard
                    icon={<FiClock size={22} />}
                    title="You Need to Pay"
                    value={summary.totalDue}
                    color="#dc2626"
                />
            </div>

            {/* Search & Filters */}
            <div style={{
                background: "#fff",
                padding: 20,
                borderRadius: 12,
                marginBottom: 20
            }}>
                <div style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 12
                }}>
                    <div style={{ flex: 1, minWidth: "200px", position: "relative" }}>
                        <FiSearch style={{
                            position: "absolute",
                            top: 14,
                            left: 15,
                            color: "#999"
                        }} />
                        <input
                            type="text"
                            placeholder="Search bill or supplier..."
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

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        style={{
                            padding: "12px 16px",
                            border: "1px solid #ddd",
                            borderRadius: 8,
                            outline: "none",
                            fontSize: 14,
                            background: "#fff",
                            minWidth: "150px"
                        }}
                    >
                        <option value="All">All Payments</option>
                        <option value="Fully Paid">Fully Paid</option>
                        <option value="Partially Paid">Partially Paid</option>
                        <option value="Not Paid">Not Paid</option>
                    </select>

                    <select
                        value={filterSupplier}
                        onChange={(e) => setFilterSupplier(e.target.value)}
                        style={{
                            padding: "12px 16px",
                            border: "1px solid #ddd",
                            borderRadius: 8,
                            outline: "none",
                            fontSize: 14,
                            background: "#fff",
                            minWidth: "150px"
                        }}
                    >
                        {suppliers.map(supplier => (
                            <option key={supplier} value={supplier}>{supplier}</option>
                        ))}
                    </select>

                    <select
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        style={{
                            padding: "12px 16px",
                            border: "1px solid #ddd",
                            borderRadius: 8,
                            outline: "none",
                            fontSize: 14,
                            background: "#fff",
                            minWidth: "150px"
                        }}
                    >
                        <option value="All">All Dates</option>
                        <option value="7">Last 7 Days</option>
                        <option value="30">Last 30 Days</option>
                        <option value="90">Last 90 Days</option>
                    </select>
                </div>
            </div>

            {/* Desktop Table View */}
            <div style={{
                background: "#fff",
                borderRadius: 12,
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0,0,0,.08)",
                overflowX: "auto",
                display: window.innerWidth < 768 ? "none" : "block"
            }}>
                <table width="100%" cellPadding="15" style={{
                    borderCollapse: "collapse",
                    minWidth: "900px"
                }}>
                    <thead>
                        <tr style={{ background: "#2563eb", color: "#fff" }}>
                            <th align="left">Bill No.</th>
                            <th align="left">Supplier</th>
                            <th align="left">Date</th>
                            <th align="left">Total</th>
                            <th align="left">Paid</th>
                            <th align="left">You Need to Pay</th>
                            <th align="left">Status</th>
                            <th align="center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPurchases.length === 0 && (
                            <tr>
                                <td colSpan="8" align="center" style={{ padding: 40 }}>
                                    No Purchases Found
                                </td>
                            </tr>
                        )}
                        {filteredPurchases.map((purchase) => {
                            const status = getStatus(purchase);
                            const statusStyle = getStatusColor(status);
                            const due = Number(purchase.total_amount) - Number(purchase.paid_amount);
                            const isFullyPaid = status === "Fully Paid";

                            return (
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
                                        <div style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 10
                                        }}>
                                            <div style={{
                                                width: 45,
                                                height: 45,
                                                borderRadius: "50%",
                                                background: "#dbeafe",
                                                display: "flex",
                                                justifyContent: "center",
                                                alignItems: "center",
                                                flexShrink: 0
                                            }}>
                                                <FiShoppingCart color="#2563eb" />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: "bold" }}>
                                                    {purchase.invoice_no}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>
                                            {purchase.supplier_name}
                                        </div>
                                    </td>
                                    <td>
                                        {new Date(purchase.created_at).toLocaleDateString('en-IN', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </td>
                                    <td>₹{Number(purchase.total_amount).toFixed(2)}</td>
                                    <td>₹{Number(purchase.paid_amount).toFixed(2)}</td>
                                    <td style={{ fontWeight: "bold", color: due > 0 ? "#dc2626" : "#15803d" }}>
                                        ₹{due.toFixed(2)}
                                    </td>
                                    <td>
                                        <span style={{
                                            background: statusStyle.bg,
                                            color: statusStyle.color,
                                            padding: "6px 14px",
                                            borderRadius: 30,
                                            fontSize: 13,
                                            fontWeight: 600,
                                            display: "inline-block"
                                        }}>
                                            {statusStyle.icon} {status}
                                        </span>
                                    </td>
                                    <td align="center">
                                        <div style={{
                                            display: "flex",
                                            justifyContent: "center",
                                            gap: 6,
                                            flexWrap: "wrap"
                                        }}>
                                            <Link to={`/purchase/${purchase.id}`}>
                                                <button style={{
                                                    background: "#0ea5e9",
                                                    color: "#fff",
                                                    border: "none",
                                                    padding: "8px 14px",
                                                    borderRadius: 8,
                                                    cursor: "pointer",
                                                    transition: "transform 0.1s, background 0.2s",
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: 6,
                                                    fontWeight: 500,
                                                    fontSize: 13
                                                }}
                                                title="View Purchase Details"
                                                onMouseEnter={(e) => {
                                                    e.target.style.background = "#0284c7";
                                                    e.target.style.transform = "scale(1.05)";
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.background = "#0ea5e9";
                                                    e.target.style.transform = "scale(1)";
                                                }}>
                                                    <FiEye size={14} /> View
                                                </button>
                                            </Link>

                                            {!isFullyPaid && (
                                                <Link to={`/purchase/${purchase.id}/pay`}>
                                                    <button style={{
                                                        background: "#22c55e",
                                                        color: "#fff",
                                                        border: "none",
                                                        padding: "8px 14px",
                                                        borderRadius: 8,
                                                        cursor: "pointer",
                                                        transition: "transform 0.1s, background 0.2s",
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: 4,
                                                        fontWeight: 600,
                                                        fontSize: 13
                                                    }}
                                                    title="Pay Now"
                                                    onMouseEnter={(e) => {
                                                        e.target.style.background = "#16a34a";
                                                        e.target.style.transform = "scale(1.05)";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.target.style.background = "#22c55e";
                                                        e.target.style.transform = "scale(1)";
                                                    }}>
                                                        <FiDollarSign size={14} /> Pay Now
                                                    </button>
                                                </Link>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div style={{
                display: window.innerWidth < 768 ? "block" : "none"
            }}>
                {filteredPurchases.length === 0 && (
                    <div style={{
                        background: "#fff",
                        padding: 40,
                        borderRadius: 12,
                        textAlign: "center",
                        color: "#6b7280"
                    }}>
                        No Purchases Found
                    </div>
                )}
                {filteredPurchases.map((purchase) => {
                    const status = getStatus(purchase);
                    const statusStyle = getStatusColor(status);
                    const due = Number(purchase.total_amount) - Number(purchase.paid_amount);
                    const isFullyPaid = status === "Fully Paid";

                    return (
                        <div key={purchase.id} style={{
                            background: "#fff",
                            borderRadius: 12,
                            padding: 16,
                            marginBottom: 12,
                            boxShadow: "0 2px 8px rgba(0,0,0,.06)"
                        }}>
                            <div style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: 8
                            }}>
                                <div style={{ fontWeight: "bold", fontSize: 16 }}>
                                    {purchase.invoice_no}
                                </div>
                                <div style={{ fontSize: 13, color: "#6b7280" }}>
                                    {new Date(purchase.created_at).toLocaleDateString('en-IN', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                    })}
                                </div>
                            </div>

                            <div style={{ marginBottom: 8 }}>
                                <span style={{ color: "#6b7280" }}>Supplier: </span>
                                <span style={{ fontWeight: 600 }}>{purchase.supplier_name}</span>
                            </div>

                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: 6,
                                marginBottom: 10
                            }}>
                                <div>
                                    <div style={{ fontSize: 12, color: "#6b7280" }}>Total</div>
                                    <div style={{ fontWeight: "bold" }}>₹{Number(purchase.total_amount).toFixed(2)}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 12, color: "#6b7280" }}>Paid</div>
                                    <div>₹{Number(purchase.paid_amount).toFixed(2)}</div>
                                </div>
                                <div style={{ gridColumn: "1 / -1" }}>
                                    <div style={{ fontSize: 12, color: "#6b7280" }}>You Need to Pay</div>
                                    <div style={{ fontWeight: "bold", color: due > 0 ? "#dc2626" : "#15803d" }}>
                                        ₹{due.toFixed(2)}
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                marginBottom: 12,
                                padding: "4px 12px",
                                background: statusStyle.bg,
                                color: statusStyle.color,
                                borderRadius: 20,
                                fontSize: 13,
                                fontWeight: 600,
                                display: "inline-block"
                            }}>
                                {statusStyle.icon} {status}
                            </div>

                            <div style={{
                                display: "flex",
                                gap: 8,
                                flexWrap: "wrap"
                            }}>
                                <Link to={`/purchase/${purchase.id}`}>
                                    <button style={{
                                        background: "#0ea5e9",
                                        color: "#fff",
                                        border: "none",
                                        padding: "8px 16px",
                                        borderRadius: 8,
                                        cursor: "pointer",
                                        fontSize: 13
                                    }}>
                                        View Details
                                    </button>
                                </Link>
                                {!isFullyPaid && (
                                    <Link to={`/purchase/${purchase.id}/pay`}>
                                        <button style={{
                                            background: "#22c55e",
                                            color: "#fff",
                                            border: "none",
                                            padding: "8px 16px",
                                            borderRadius: 8,
                                            cursor: "pointer",
                                            fontWeight: 600,
                                            fontSize: 13
                                        }}>
                                            Pay Now
                                        </button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

        </div>
    );

}