import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import { FiSearch, FiPlus, FiEye, FiTrash2, FiFilter, FiDownload, FiCalendar, FiUser, FiCreditCard, FiTrendingUp, FiPrinter } from "react-icons/fi";

export default function SalesHistory() {
    const [sales, setSales] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [filterStatus, setFilterStatus] = useState("all");
    const [selectedPeriod, setSelectedPeriod] = useState("all");

    useEffect(() => {
        loadSales();
    }, []);

    const loadSales = async () => {
        setLoading(true);
        try {
            const res = await API.get("/sales");
            setSales(res.data.data || []);
        } catch (err) {
            console.error("Error loading sales:", err);
            alert("Failed to load sales data");
        } finally {
            setLoading(false);
        }
    };

    const deleteSale = async (id) => {
        if (!window.confirm("Are you sure you want to delete this sale? This action cannot be undone.")) return;

        try {
            await API.delete(`/sales/${id}`);
            await loadSales();
            alert("Sale deleted successfully");
        } catch (err) {
            console.error("Error deleting sale:", err);
            alert(err.response?.data?.message || "Failed to delete sale");
        }
    };

    const getStatusConfig = (status) => {
        const configs = {
            paid: { color: "#10b981", bg: "#d1fae5", icon: "✅" },
            pending: { color: "#f59e0b", bg: "#fef3c7", icon: "⏳" },
            failed: { color: "#ef4444", bg: "#fee2e2", icon: "❌" },
            refunded: { color: "#6b7280", bg: "#f3f4f6", icon: "↩️" },
        };
        return configs[status?.toLowerCase()] || { color: "#6b7280", bg: "#f3f4f6", icon: "📌" };
    };

    const getPaymentIcon = (method) => {
        const icons = {
            cash: "💵",
            card: "💳",
            upi: "📱",
            bank: "🏦",
        };
        return icons[method?.toLowerCase()] || "💵";
    };

    const getPeriodStats = () => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);

        let filtered = sales;
        if (selectedPeriod === "today") {
            filtered = sales.filter(s => new Date(s.created_at) >= today);
        } else if (selectedPeriod === "week") {
            filtered = sales.filter(s => new Date(s.created_at) >= weekAgo);
        } else if (selectedPeriod === "month") {
            filtered = sales.filter(s => new Date(s.created_at) >= monthAgo);
        }

        const total = filtered.reduce((sum, s) => sum + Number(s.total_amount), 0);
        const count = filtered.length;
        const paid = filtered.filter(s => s.payment_status?.toLowerCase() === "paid").length;
        const pending = filtered.filter(s => s.payment_status?.toLowerCase() === "pending").length;

        return { total, count, paid, pending };
    };

    const getItemsSummary = (items) => {
        if (!items || items.length === 0) return "No items";
        return items.map(item => {
            const qty = item.entered_quantity || item.quantity || 1;
            const unit = item.entered_unit || item.unit || "pcs";
            return `${item.product_name} (${qty} ${unit})`;
        }).join(", ");
    };

    const stats = getPeriodStats();

    const filtered = sales.filter((item) => {
        const matchesSearch = 
            (item.invoice_no || "")
                .toLowerCase()
                .includes(search.toLowerCase()) ||
            (item.customer_name || "")
                .toLowerCase()
                .includes(search.toLowerCase());

        const matchesStatus = 
            filterStatus === "all" || 
            item.payment_status?.toLowerCase() === filterStatus;

        let matchesPeriod = true;
        if (selectedPeriod === "today") {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            matchesPeriod = new Date(item.created_at) >= today;
        } else if (selectedPeriod === "week") {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            matchesPeriod = new Date(item.created_at) >= weekAgo;
        } else if (selectedPeriod === "month") {
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            matchesPeriod = new Date(item.created_at) >= monthAgo;
        }

        return matchesSearch && matchesStatus && matchesPeriod;
    });

    const handlePrint = (id) => {
        window.open(`/invoice/${id}?print=true`, '_blank');
    };

    const handleDownloadPDF = (id) => {
        // Implement PDF download logic
        window.open(`/api/sales/invoice/${id}/pdf`, '_blank');
    };

    return (
        <div className="sales-history-container" style={styles.container}>
            {/* Header */}
            <div className="sales-history-header" style={styles.header}>
                <div>
                    <h1 className="sales-history-title" style={styles.title}>Sales History</h1>
                    <p style={styles.subtitle}>Track and manage all your sales transactions</p>
                </div>
                <Link to="/billing-pos" style={styles.primaryButton}>
                    <FiPlus size={18} />
                    New Billing
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="sales-history-stats-grid" style={styles.statsGrid}>
                <div style={styles.statCard}>
                    <div style={styles.statIcon}>
                        <FiTrendingUp size={20} color="#3b82f6" />
                    </div>
                    <div>
                        <div style={styles.statLabel}>Total Sales</div>
                        <div style={styles.statValue}>₹{stats.total.toFixed(2)}</div>
                        <div style={styles.statSub}>{stats.count} transactions</div>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={{...styles.statIcon, background: "#d1fae5"}}>
                        <FiCreditCard size={20} color="#10b981" />
                    </div>
                    <div>
                        <div style={styles.statLabel}>Paid</div>
                        <div style={styles.statValue}>{stats.paid}</div>
                        <div style={styles.statSub}>{((stats.paid/stats.count)*100 || 0).toFixed(0)}% of total</div>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={{...styles.statIcon, background: "#fef3c7"}}>
                        <FiCalendar size={20} color="#f59e0b" />
                    </div>
                    <div>
                        <div style={styles.statLabel}>Pending</div>
                        <div style={styles.statValue}>{stats.pending}</div>
                        <div style={styles.statSub}>Awaiting payment</div>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={{...styles.statIcon, background: "#dbeafe"}}>
                        <FiUser size={20} color="#3b82f6" />
                    </div>
                    <div>
                        <div style={styles.statLabel}>Customers</div>
                        <div style={styles.statValue}>
                            {new Set(sales.map(s => s.customer_name)).size}
                        </div>
                        <div style={styles.statSub}>Unique customers</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div style={styles.filtersSection}>
                <div style={styles.filtersLeft}>
                    <div style={styles.searchWrapper}>
                        <FiSearch size={18} color="#9ca3af" style={styles.searchIcon} />
                        <input
                            placeholder="Search by invoice or customer..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={styles.searchInput}
                        />
                    </div>
                    <div style={styles.filterGroup}>
                        <FiFilter size={18} color="#6b7280" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            style={styles.filterSelect}
                        >
                            <option value="all">All Status</option>
                            <option value="paid">✅ Paid</option>
                            <option value="pending">⏳ Pending</option>
                            <option value="failed">❌ Failed</option>
                            <option value="refunded">↩️ Refunded</option>
                        </select>
                    </div>
                    <div style={styles.filterGroup}>
                        <FiCalendar size={18} color="#6b7280" />
                        <select
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                            style={styles.filterSelect}
                        >
                            <option value="all">All Time</option>
                            <option value="today">Today</option>
                            <option value="week">Last 7 Days</option>
                            <option value="month">Last 30 Days</option>
                        </select>
                    </div>
                </div>
                <div style={styles.filtersRight}>
                    <span style={styles.resultCount}>
                        {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                    </span>
                    <button style={styles.iconButton} onClick={() => window.print()}>
                        <FiDownload size={18} />
                    </button>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div style={styles.loadingContainer}>
                    <div style={styles.loadingSpinner}></div>
                    <p style={styles.loadingText}>Loading sales data...</p>
                </div>
            ) : (
                <div style={styles.tableContainer}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Invoice</th>
                                <th style={styles.th}>Date & Time</th>
                                <th style={styles.th}>Customer</th>
                                <th style={styles.th}>Items</th>
                                <th style={styles.th}>Payment</th>
                                <th style={styles.th}>Status</th>
                                <th style={{...styles.th, textAlign: "right"}}>Total</th>
                                <th style={{...styles.th, textAlign: "center"}}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="8" style={styles.emptyState}>
                                        <div style={styles.emptyIcon}>📭</div>
                                        <p style={styles.emptyText}>
                                            {search || filterStatus !== "all" || selectedPeriod !== "all"
                                                ? "No matching sales found"
                                                : "No sales recorded yet"}
                                        </p>
                                        {!search && filterStatus === "all" && selectedPeriod === "all" && (
                                            <Link to="/billing-pos" style={styles.emptyButton}>
                                                Create your first sale
                                            </Link>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((item) => {
                                    const statusConfig = getStatusConfig(item.payment_status);
                                    const itemsList = item.items || [];
                                    return (
                                        <tr key={item.id} style={styles.tableRow}>
                                            <td>
                                                <span style={styles.invoiceNumber}>
                                                    #{item.invoice_no}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={styles.dateTime}>
                                                    <div style={styles.date}>
                                                        {new Date(item.created_at).toLocaleDateString("en-IN", {
                                                            day: "2-digit",
                                                            month: "short",
                                                            year: "numeric"
                                                        })}
                                                    </div>
                                                    <div style={styles.time}>
                                                        {new Date(item.created_at).toLocaleTimeString("en-IN", {
                                                            hour: "2-digit",
                                                            minute: "2-digit"
                                                        })}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={styles.customerCell}>
                                                    <div style={styles.customerAvatar}>
                                                        {item.customer_name?.[0] || "W"}
                                                    </div>
                                                    <div>
                                                        <div style={styles.customerName}>
                                                            {item.customer_name || "Walk-in Customer"}
                                                        </div>
                                                        {item.customer_phone && (
                                                            <div style={styles.customerPhone}>
                                                                {item.customer_phone}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={styles.itemsCell}>
                                                    <div style={styles.itemsCount}>
                                                        {itemsList.length} {itemsList.length === 1 ? 'item' : 'items'}
                                                    </div>
                                                    <div style={styles.itemsSummary}>
                                                        {itemsList.slice(0, 3).map((product, idx) => {
                                                            const qty = product.entered_quantity || product.quantity || 1;
                                                            const unit = product.entered_unit || product.unit || "pcs";
                                                            return (
                                                                <div key={idx} style={styles.itemChip}>
                                                                    {product.product_name} ({qty} {unit})
                                                                </div>
                                                            );
                                                        })}
                                                        {itemsList.length > 3 && (
                                                            <div style={styles.moreItems}>
                                                                +{itemsList.length - 3} more
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span style={styles.paymentMethodBadge}>
                                                    {getPaymentIcon(item.payment_method)} {item.payment_method || "N/A"}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{
                                                    ...styles.statusBadge,
                                                    background: statusConfig.bg,
                                                    color: statusConfig.color
                                                }}>
                                                    {statusConfig.icon} {item.payment_status || "N/A"}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: "right" }}>
                                                <span style={styles.amount}>
                                                    ₹{Number(item.total_amount).toFixed(2)}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={styles.actionButtons}>
                                                    <Link
                                                        to={`/invoice/${item.id}`}
                                                        style={styles.viewButton}
                                                    >
                                                        <FiEye size={14} />
                                                        View
                                                    </Link>
                                                    <button
                                                        style={styles.printButton}
                                                        onClick={() => handlePrint(item.id)}
                                                        title="Print Invoice"
                                                    >
                                                        <FiPrinter size={14} />
                                                    </button>
                                                    <button
                                                        style={styles.pdfButton}
                                                        onClick={() => handleDownloadPDF(item.id)}
                                                        title="Download PDF"
                                                    >
                                                        <FiDownload size={14} />
                                                    </button>
                                                    <button
                                                        style={styles.deleteButton}
                                                        onClick={() => deleteSale(item.id)}
                                                        title="Delete Invoice"
                                                    >
                                                        <FiTrash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

const styles = {
    container: {
        minHeight: "100vh",
        padding: "28px",
        maxWidth: "1600px",
        margin: "0 auto",
        background: "#f5f7fb",
        color: "#0f172a",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    },

    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "20px",
        marginBottom: "22px",
        padding: "22px 24px",
        borderRadius: "20px",
        background: "linear-gradient(135deg, #0f172a 0%, #172554 55%, #1e3a8a 100%)",
        boxShadow: "0 18px 45px rgba(15, 23, 42, 0.18)",
        position: "relative",
        overflow: "hidden"
    },

    title: {
        margin: 0,
        color: "#ffffff",
        fontSize: "30px",
        lineHeight: 1.15,
        fontWeight: "800",
        letterSpacing: "-0.8px"
    },

    subtitle: {
        margin: "7px 0 0",
        color: "#cbd5e1",
        fontSize: "13px",
        lineHeight: 1.5
    },

    primaryButton: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        padding: "12px 18px",
        borderRadius: "12px",
        background: "#a3e635",
        color: "#172554",
        textDecoration: "none",
        fontSize: "13px",
        fontWeight: "800",
        boxShadow: "0 8px 24px rgba(163, 230, 53, 0.25)",
        whiteSpace: "nowrap",
        transition: "transform .2s ease, box-shadow .2s ease"
    },

    statsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: "14px",
        marginBottom: "18px"
    },

    statCard: {
        minWidth: 0,
        display: "flex",
        alignItems: "center",
        gap: "14px",
        padding: "18px",
        borderRadius: "16px",
        background: "#ffffff",
        border: "1px solid #e7ebf2",
        boxShadow: "0 8px 25px rgba(15, 23, 42, 0.05)",
        transition: "transform .2s ease, box-shadow .2s ease"
    },

    statIcon: {
        width: "46px",
        height: "46px",
        borderRadius: "13px",
        background: "#e8f0ff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0
    },

    statLabel: {
        fontSize: "11px",
        fontWeight: "800",
        color: "#64748b",
        textTransform: "uppercase",
        letterSpacing: "0.65px"
    },

    statValue: {
        margin: "3px 0 2px",
        fontSize: "22px",
        lineHeight: 1.2,
        fontWeight: "800",
        color: "#0f172a",
        letterSpacing: "-0.3px"
    },

    statSub: {
        fontSize: "11px",
        color: "#94a3b8"
    },

    filtersSection: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "14px",
        flexWrap: "wrap",
        padding: "13px",
        marginBottom: "16px",
        borderRadius: "16px",
        background: "#ffffff",
        border: "1px solid #e7ebf2",
        boxShadow: "0 6px 22px rgba(15, 23, 42, 0.04)"
    },

    filtersLeft: {
        display: "flex",
        alignItems: "center",
        gap: "9px",
        flexWrap: "wrap",
        flex: 1,
        minWidth: "280px"
    },

    filtersRight: {
        display: "flex",
        alignItems: "center",
        gap: "10px"
    },

    searchWrapper: {
        display: "flex",
        alignItems: "center",
        minWidth: "260px",
        flex: "1 1 300px",
        height: "42px",
        padding: "0 13px",
        border: "1px solid #e2e8f0",
        borderRadius: "11px",
        background: "#f8fafc",
        transition: "border-color .2s ease, box-shadow .2s ease"
    },

    searchIcon: {
        marginRight: "8px",
        flexShrink: 0
    },

    searchInput: {
        width: "100%",
        border: "none",
        outline: "none",
        background: "transparent",
        color: "#0f172a",
        fontSize: "13px"
    },

    filterGroup: {
        display: "flex",
        alignItems: "center",
        gap: "5px",
        height: "42px",
        padding: "0 10px",
        border: "1px solid #e2e8f0",
        borderRadius: "11px",
        background: "#f8fafc"
    },

    filterSelect: {
        border: "none",
        outline: "none",
        background: "transparent",
        color: "#334155",
        fontSize: "12px",
        fontWeight: "700",
        cursor: "pointer"
    },

    resultCount: {
        color: "#64748b",
        fontSize: "12px",
        fontWeight: "700",
        whiteSpace: "nowrap"
    },

    iconButton: {
        width: "40px",
        height: "40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid #e2e8f0",
        borderRadius: "10px",
        background: "#f8fafc",
        color: "#475569",
        cursor: "pointer"
    },

    tableContainer: {
        overflowX: "auto",
        borderRadius: "18px",
        background: "#ffffff",
        border: "1px solid #e7ebf2",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.055)"
    },

    table: {
        width: "100%",
        minWidth: "1120px",
        borderCollapse: "separate",
        borderSpacing: 0,
        fontSize: "13px"
    },

    th: {
        padding: "14px 16px",
        textAlign: "left",
        fontSize: "10px",
        fontWeight: "800",
        color: "#64748b",
        textTransform: "uppercase",
        letterSpacing: "0.75px",
        background: "#f8fafc",
        borderBottom: "1px solid #e7ebf2",
        whiteSpace: "nowrap"
    },

    tableRow: {
        borderBottom: "1px solid #eef2f7",
        transition: "background .15s ease"
    },

    invoiceNumber: {
        display: "inline-flex",
        alignItems: "center",
        padding: "5px 8px",
        borderRadius: "8px",
        background: "#eef2ff",
        color: "#4338ca",
        fontWeight: "800",
        fontSize: "12px",
        whiteSpace: "nowrap"
    },

    dateTime: {
        display: "flex",
        flexDirection: "column",
        gap: "2px"
    },

    date: {
        color: "#1e293b",
        fontWeight: "700",
        fontSize: "12px"
    },

    time: {
        color: "#94a3b8",
        fontSize: "11px"
    },

    customerCell: {
        display: "flex",
        alignItems: "center",
        gap: "9px"
    },

    customerAvatar: {
        width: "34px",
        height: "34px",
        borderRadius: "10px",
        background: "linear-gradient(135deg, #dbeafe, #e0e7ff)",
        color: "#3730a3",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "800",
        fontSize: "13px",
        flexShrink: 0
    },

    customerName: {
        color: "#1e293b",
        fontWeight: "700",
        fontSize: "12px"
    },

    customerPhone: {
        marginTop: "2px",
        color: "#94a3b8",
        fontSize: "10px"
    },

    itemsCell: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        maxWidth: "280px"
    },

    itemsCount: {
        color: "#334155",
        fontSize: "11px",
        fontWeight: "800"
    },

    itemsSummary: {
        display: "flex",
        flexWrap: "wrap",
        gap: "4px"
    },

    itemChip: {
        padding: "4px 7px",
        borderRadius: "6px",
        background: "#f1f5f9",
        color: "#475569",
        fontSize: "10px",
        whiteSpace: "nowrap"
    },

    moreItems: {
        padding: "4px 6px",
        color: "#64748b",
        fontSize: "10px",
        fontWeight: "700"
    },

    paymentMethodBadge: {
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "6px 9px",
        borderRadius: "8px",
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        color: "#475569",
        fontSize: "11px",
        fontWeight: "700",
        whiteSpace: "nowrap"
    },

    statusBadge: {
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "6px 9px",
        borderRadius: "999px",
        fontSize: "10px",
        fontWeight: "800",
        whiteSpace: "nowrap"
    },

    amount: {
        color: "#0f172a",
        fontSize: "14px",
        fontWeight: "900",
        whiteSpace: "nowrap"
    },

    actionButtons: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "5px",
        flexWrap: "wrap"
    },

    viewButton: {
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "7px 9px",
        borderRadius: "8px",
        background: "#0f172a",
        color: "#ffffff",
        textDecoration: "none",
        fontSize: "10px",
        fontWeight: "800"
    },

    printButton: {
        width: "30px",
        height: "30px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        border: "none",
        borderRadius: "8px",
        background: "#2563eb",
        color: "#ffffff",
        cursor: "pointer"
    },

    pdfButton: {
        width: "30px",
        height: "30px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        border: "none",
        borderRadius: "8px",
        background: "#7c3aed",
        color: "#ffffff",
        cursor: "pointer"
    },

    deleteButton: {
        width: "30px",
        height: "30px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        border: "none",
        borderRadius: "8px",
        background: "#fff1f2",
        color: "#e11d48",
        cursor: "pointer"
    },

    loadingContainer: {
        minHeight: "360px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "18px",
        background: "#ffffff",
        border: "1px solid #e7ebf2"
    },

    loadingSpinner: {
        width: "38px",
        height: "38px",
        border: "3px solid #e2e8f0",
        borderTop: "3px solid #2563eb",
        borderRadius: "50%",
        animation: "spin .8s linear infinite"
    },

    loadingText: {
        marginTop: "14px",
        color: "#64748b",
        fontSize: "13px",
        fontWeight: "600"
    },

    emptyState: {
        textAlign: "center",
        padding: "80px 20px",
        color: "#94a3b8"
    },

    emptyIcon: {
        fontSize: "46px",
        marginBottom: "12px"
    },

    emptyText: {
        margin: "0 0 14px",
        color: "#64748b",
        fontSize: "14px",
        fontWeight: "600"
    },

    emptyButton: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "10px 16px",
        borderRadius: "10px",
        background: "#2563eb",
        color: "#ffffff",
        textDecoration: "none",
        fontSize: "12px",
        fontWeight: "800"
    }
};

// Add keyframe animation
const styleSheet = document.createElement("style");
styleSheet.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(styleSheet);

<style>
@media (max-width: 1050px) {
    .sales-history-stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
}
@media (max-width: 720px) {
    .sales-history-container { padding: 14px !important; }
    .sales-history-header { align-items: flex-start !important; flex-direction: column !important; }
    .sales-history-title { font-size: 24px !important; }
    .sales-history-stats-grid { grid-template-columns: 1fr !important; }
}
</style>
