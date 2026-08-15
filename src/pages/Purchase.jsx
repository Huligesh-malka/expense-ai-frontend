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
} from "react-icons/fi";

export default function Purchase() {

    const businessId = localStorage.getItem("businessId");

    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("All");
    const [filterSupplier, setFilterSupplier] = useState("All");
    const [filterDate, setFilterDate] = useState("All");
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    const [summary, setSummary] = useState({
        totalPurchases: 0,
        totalBought: 0,
        totalPaid: 0,
        totalDue: 0
    });

    useEffect(() => {
        loadPurchases();
        const onResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    const loadPurchases = async () => {
        try {
            const res = await API.get(
                `/purchases?business_id=${businessId}`
            );
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

    const STATUS_STYLE = {
        "Fully Paid": { bg: "#e8f2e4", color: "#3d6b2c", dot: "#5a8f3f" },
        "Partially Paid": { bg: "#faf1dc", color: "#a3661a", dot: "#d99a34" },
        "Not Paid": { bg: "#f7e4df", color: "#a13d2c", dot: "#c65a3f" },
    };
    const getStatusStyle = (status) =>
        STATUS_STYLE[status] || { bg: "#eee", color: "#666", dot: "#999" };

    const getUniqueSuppliers = () => {
        const suppliers = purchases.map(p => p.supplier_name);
        return ["All", ...new Set(suppliers)];
    };

    const getFilteredPurchases = () => {
        let filtered = purchases;

        if (search) {
            filtered = filtered.filter((item) =>
                item.invoice_no.toLowerCase().includes(search.toLowerCase()) ||
                item.supplier_name.toLowerCase().includes(search.toLowerCase())
            );
        }

        if (filterStatus !== "All") {
            filtered = filtered.filter(item => getStatus(item) === filterStatus);
        }

        if (filterSupplier !== "All") {
            filtered = filtered.filter(item => item.supplier_name === filterSupplier);
        }

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

    const rupee = (n) => `\u20B9${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    if (loading) {
        return (
            <div style={{
                minHeight: "100vh",
                background: "#f4ecd8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'IBM Plex Mono', monospace",
                color: "#5c4b32"
            }}>
                Loading ledger…
            </div>
        );
    }

    const SummaryCard = ({ icon, title, value, color }) => (
        <div style={{
            background: "#fffdf7",
            border: "1px solid #e6d9b8",
            borderRadius: 10,
            padding: "16px 18px",
            flex: 1,
            minWidth: 170,
            position: "relative",
            boxShadow: "0 1px 3px rgba(92,75,50,0.08)"
        }}>
            <div style={{
                position: "absolute",
                top: 0, left: 0, right: 0,
                height: 3,
                background: color,
                borderRadius: "10px 10px 0 0"
            }} />
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                <div style={{ color, fontSize: 18 }}>{icon}</div>
                <div style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 11,
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                    color: "#8a7a5c"
                }}>{title}</div>
            </div>
            <div style={{
                fontFamily: "'Rozha One', serif",
                fontSize: 26,
                color: "#3d3221",
                marginTop: 6
            }}>
                {typeof value === 'number' && value > 100 ? rupee(value) : value}
            </div>
        </div>
    );

    return (
        <div style={{
            background: "#f4ecd8",
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 27px, rgba(92,75,50,0.06) 28px)",
            minHeight: "100vh",
            padding: "28px 24px 60px",
            fontFamily: "'IBM Plex Mono', monospace"
        }}>
            {/* Header */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                flexWrap: "wrap",
                gap: 16,
                marginBottom: 24,
                borderBottom: "2px solid #3d3221",
                paddingBottom: 16
            }}>
                <div>
                    <div style={{
                        fontFamily: "'Rozha One', serif",
                        fontSize: 32,
                        color: "#3d3221"
                    }}>Purchase Khata</div>
                    <div style={{ color: "#8a7a5c", fontSize: 13, marginTop: 2 }}>
                        Record of stock bought from suppliers
                    </div>
                </div>
                <Link to="/add-purchase" style={{ textDecoration: "none" }}>
                    <button style={{
                        background: "#3d3221",
                        color: "#f4ecd8",
                        border: "none",
                        padding: "12px 22px",
                        borderRadius: 8,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 14,
                        fontWeight: 600,
                        transition: "background 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#5c4b32"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "#3d3221"}>
                        <FiPlus /> New Purchase
                    </button>
                </Link>
            </div>

            {/* Summary strip */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 24 }}>
                <SummaryCard icon={<FiShoppingCart />} title="Bills" value={summary.totalPurchases} color="#6b5a3e" />
                <SummaryCard icon={<FiDollarSign />} title="Total Bought" value={summary.totalBought} color="#5a8f3f" />
                <SummaryCard icon={<FiCheckCircle />} title="Already Paid" value={summary.totalPaid} color="#4a6fa5" />
                <SummaryCard icon={<FiClock />} title="You Need to Pay" value={summary.totalDue} color="#c65a3f" />
            </div>

            {/* Filters */}
            <div style={{
                background: "#fffdf7",
                border: "1px solid #e6d9b8",
                borderRadius: 10,
                padding: 16,
                marginBottom: 20,
                display: "flex",
                flexWrap: "wrap",
                gap: 12
            }}>
                <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
                    <FiSearch style={{
                        position: "absolute", top: 13, left: 13, color: "#a3936f"
                    }} />
                    <input
                        type="text"
                        placeholder="Search bill no. or supplier…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "10px 14px 10px 38px",
                            border: "1px solid #e6d9b8",
                            borderRadius: 8,
                            outline: "none",
                            fontSize: 14,
                            fontFamily: "'IBM Plex Mono', monospace",
                            background: "#fffdf7",
                            color: "#3d3221",
                            boxSizing: "border-box"
                        }}
                    />
                </div>

                {[
                    { value: filterStatus, onChange: setFilterStatus, options: ["All", "Fully Paid", "Partially Paid", "Not Paid"] },
                    { value: filterSupplier, onChange: setFilterSupplier, options: suppliers },
                    { value: filterDate, onChange: setFilterDate, options: [["All","All Dates"],["7","Last 7 Days"],["30","Last 30 Days"],["90","Last 90 Days"]] },
                ].map((sel, i) => (
                    <select
                        key={i}
                        value={sel.value}
                        onChange={(e) => sel.onChange(e.target.value)}
                        style={{
                            padding: "10px 14px",
                            border: "1px solid #e6d9b8",
                            borderRadius: 8,
                            outline: "none",
                            fontSize: 14,
                            fontFamily: "'IBM Plex Mono', monospace",
                            background: "#fffdf7",
                            color: "#3d3221",
                            minWidth: 150,
                            cursor: "pointer"
                        }}
                    >
                        {sel.options.map((opt) => {
                            const [val, label] = Array.isArray(opt) ? opt : [opt, opt];
                            return <option key={val} value={val}>{label}</option>;
                        })}
                    </select>
                ))}
            </div>

            {/* Desktop table */}
            {!isMobile && (
                <div style={{
                    background: "#fffdf7",
                    border: "1px solid #e6d9b8",
                    borderRadius: 10,
                    overflow: "hidden",
                    overflowX: "auto",
                    boxShadow: "0 1px 3px rgba(92,75,50,0.08)"
                }}>
                    <table width="100%" style={{ borderCollapse: "collapse", minWidth: 880 }}>
                        <thead>
                            <tr style={{
                                background: "#3d3221",
                                color: "#f4ecd8",
                                fontSize: 12,
                                textTransform: "uppercase",
                                letterSpacing: 0.5
                            }}>
                                <th style={{ textAlign: "left", padding: "14px 16px" }}>Bill No.</th>
                                <th style={{ textAlign: "left", padding: "14px 16px" }}>Supplier</th>
                                <th style={{ textAlign: "left", padding: "14px 16px" }}>Date</th>
                                <th style={{ textAlign: "right", padding: "14px 16px" }}>Total</th>
                                <th style={{ textAlign: "right", padding: "14px 16px" }}>Paid</th>
                                <th style={{ textAlign: "right", padding: "14px 16px" }}>Due</th>
                                <th style={{ textAlign: "left", padding: "14px 16px" }}>Status</th>
                                <th style={{ textAlign: "center", padding: "14px 16px" }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPurchases.length === 0 && (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: "center", padding: 48, color: "#a3936f" }}>
                                        No purchases found
                                    </td>
                                </tr>
                            )}
                            {filteredPurchases.map((purchase) => {
                                const status = getStatus(purchase);
                                const statusStyle = getStatusStyle(status);
                                const due = Number(purchase.total_amount) - Number(purchase.paid_amount);
                                const isFullyPaid = status === "Fully Paid";

                                return (
                                    <tr
                                        key={purchase.id}
                                        style={{ borderBottom: "1px solid #eee3c8" }}
                                    >
                                        <td style={{ padding: "14px 16px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                <div style={{
                                                    width: 38, height: 38, borderRadius: 8,
                                                    background: "#f0e6cc",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    flexShrink: 0
                                                }}>
                                                    <FiShoppingCart color="#6b5a3e" size={16} />
                                                </div>
                                                <span style={{ fontWeight: 600, color: "#3d3221" }}>
                                                    {purchase.invoice_no}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ padding: "14px 16px", color: "#3d3221" }}>{purchase.supplier_name}</td>
                                        <td style={{ padding: "14px 16px", color: "#8a7a5c", fontSize: 13 }}>
                                            {new Date(purchase.created_at).toLocaleDateString('en-IN', {
                                                day: '2-digit', month: 'short', year: 'numeric'
                                            })}
                                        </td>
                                        <td style={{ padding: "14px 16px", textAlign: "right", color: "#3d3221" }}>
                                            {rupee(purchase.total_amount)}
                                        </td>
                                        <td style={{ padding: "14px 16px", textAlign: "right", color: "#3d3221" }}>
                                            {rupee(purchase.paid_amount)}
                                        </td>
                                        <td style={{
                                            padding: "14px 16px", textAlign: "right", fontWeight: 700,
                                            color: due > 0 ? "#c65a3f" : "#3d6b2c"
                                        }}>
                                            {rupee(due)}
                                        </td>
                                        <td style={{ padding: "14px 16px" }}>
                                            <span style={{
                                                background: statusStyle.bg,
                                                color: statusStyle.color,
                                                padding: "5px 12px",
                                                borderRadius: 20,
                                                fontSize: 12,
                                                fontWeight: 600,
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: 6
                                            }}>
                                                <span style={{
                                                    width: 6, height: 6, borderRadius: "50%",
                                                    background: statusStyle.dot, display: "inline-block"
                                                }} />
                                                {status}
                                            </span>
                                        </td>
                                        <td style={{ padding: "14px 16px" }}>
                                            <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
                                                <Link to={`/purchase/${purchase.id}`}>
                                                    <button style={{
                                                        background: "#eee3c8",
                                                        color: "#3d3221",
                                                        border: "none",
                                                        padding: "8px 12px",
                                                        borderRadius: 7,
                                                        cursor: "pointer",
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: 6,
                                                        fontSize: 13,
                                                        fontWeight: 600
                                                    }} title="View Purchase">
                                                        <FiEye size={14} /> View
                                                    </button>
                                                </Link>
                                                {!isFullyPaid && (
                                                    <Link to={`/purchase/${purchase.id}/pay`}>
                                                        <button style={{
                                                            background: "#5a8f3f",
                                                            color: "#fff",
                                                            border: "none",
                                                            padding: "8px 12px",
                                                            borderRadius: 7,
                                                            cursor: "pointer",
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: 6,
                                                            fontWeight: 600,
                                                            fontSize: 13
                                                        }} title="Pay Now">
                                                            <FiDollarSign size={14} /> Pay
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
            )}

            {/* Mobile cards */}
            {isMobile && (
                <div>
                    {filteredPurchases.length === 0 && (
                        <div style={{
                            background: "#fffdf7",
                            border: "1px solid #e6d9b8",
                            padding: 40,
                            borderRadius: 10,
                            textAlign: "center",
                            color: "#a3936f"
                        }}>
                            No purchases found
                        </div>
                    )}
                    {filteredPurchases.map((purchase) => {
                        const status = getStatus(purchase);
                        const statusStyle = getStatusStyle(status);
                        const due = Number(purchase.total_amount) - Number(purchase.paid_amount);
                        const isFullyPaid = status === "Fully Paid";

                        return (
                            <div key={purchase.id} style={{
                                background: "#fffdf7",
                                border: "1px solid #e6d9b8",
                                borderRadius: 10,
                                padding: 16,
                                marginBottom: 12,
                                boxShadow: "0 1px 3px rgba(92,75,50,0.08)"
                            }}>
                                <div style={{
                                    display: "flex", justifyContent: "space-between",
                                    alignItems: "center", marginBottom: 8
                                }}>
                                    <div style={{ fontWeight: 700, fontSize: 15, color: "#3d3221" }}>
                                        {purchase.invoice_no}
                                    </div>
                                    <div style={{ fontSize: 12, color: "#8a7a5c" }}>
                                        {new Date(purchase.created_at).toLocaleDateString('en-IN', {
                                            day: '2-digit', month: 'short', year: 'numeric'
                                        })}
                                    </div>
                                </div>

                                <div style={{ marginBottom: 8, fontSize: 13, color: "#3d3221" }}>
                                    <span style={{ color: "#8a7a5c" }}>Supplier: </span>
                                    <span style={{ fontWeight: 600 }}>{purchase.supplier_name}</span>
                                </div>

                                <div style={{
                                    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10
                                }}>
                                    <div>
                                        <div style={{ fontSize: 11, color: "#8a7a5c" }}>Total</div>
                                        <div style={{ fontWeight: 700, color: "#3d3221" }}>{rupee(purchase.total_amount)}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, color: "#8a7a5c" }}>Paid</div>
                                        <div style={{ color: "#3d3221" }}>{rupee(purchase.paid_amount)}</div>
                                    </div>
                                    <div style={{ gridColumn: "1 / -1" }}>
                                        <div style={{ fontSize: 11, color: "#8a7a5c" }}>You Need to Pay</div>
                                        <div style={{ fontWeight: 700, color: due > 0 ? "#c65a3f" : "#3d6b2c" }}>
                                            {rupee(due)}
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    marginBottom: 12,
                                    padding: "4px 12px",
                                    background: statusStyle.bg,
                                    color: statusStyle.color,
                                    borderRadius: 20,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 6
                                }}>
                                    <span style={{
                                        width: 6, height: 6, borderRadius: "50%",
                                        background: statusStyle.dot, display: "inline-block"
                                    }} />
                                    {status}
                                </div>

                                <div style={{ display: "flex", gap: 8 }}>
                                    <Link to={`/purchase/${purchase.id}`} style={{ flex: 1 }}>
                                        <button style={{
                                            width: "100%",
                                            background: "#eee3c8",
                                            color: "#3d3221",
                                            border: "none",
                                            padding: "10px 16px",
                                            borderRadius: 7,
                                            cursor: "pointer",
                                            fontSize: 13,
                                            fontWeight: 600
                                        }}>
                                            View
                                        </button>
                                    </Link>
                                    {!isFullyPaid && (
                                        <Link to={`/purchase/${purchase.id}/pay`} style={{ flex: 1 }}>
                                            <button style={{
                                                width: "100%",
                                                background: "#5a8f3f",
                                                color: "#fff",
                                                border: "none",
                                                padding: "10px 16px",
                                                borderRadius: 7,
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
            )}
        </div>
    );
}