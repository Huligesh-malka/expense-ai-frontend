import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import { FiSearch, FiPlus, FiEye, FiTrash2, FiFilter, FiDownload, FiCalendar, FiUser, FiCreditCard, FiTrendingUp, FiPrinter } from "react-icons/fi";

export default function SalesHistory() {
    const businessId = localStorage.getItem("businessId");
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
            const res = await API.get(`/sales?business_id=${businessId}`);
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
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Sales History</h1>
                    <p style={styles.subtitle}>Track and manage all your sales transactions</p>
                </div>
                <Link to="/billing-pos" style={styles.primaryButton}>
                    <FiPlus size={18} />
                    New Billing
                </Link>
            </div>

            {/* Stats Cards */}
            <div style={styles.statsGrid}>
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
        padding: "30px",
        maxWidth: "1440px",
        margin: "0 auto",
        background: "#f8fafc",
        minHeight: "100vh",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "30px",
        flexWrap: "wrap",
        gap: "15px"
    },
    title: {
        margin: 0,
        fontSize: "28px",
        fontWeight: "700",
        color: "#0f172a",
        letterSpacing: "-0.5px"
    },
    subtitle: {
        margin: "4px 0 0",
        color: "#64748b",
        fontSize: "14px",
        fontWeight: "400"
    },
    primaryButton: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        background: "#3b82f6",
        padding: "12px 24px",
        color: "#fff",
        textDecoration: "none",
        borderRadius: "10px",
        fontWeight: "600",
        fontSize: "14px",
        transition: "all 0.2s",
        border: "none",
        cursor: "pointer",
        boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)"
    },
    statsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px",
        marginBottom: "30px"
    },
    statCard: {
        display: "flex",
        alignItems: "center",
        gap: "16px",
        background: "#fff",
        padding: "20px",
        borderRadius: "12px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        border: "1px solid #e2e8f0",
        transition: "all 0.2s"
    },
    statIcon: {
        width: "44px",
        height: "44px",
        borderRadius: "10px",
        background: "#dbeafe",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0
    },
    statLabel: {
        fontSize: "12px",
        fontWeight: "500",
        color: "#64748b",
        textTransform: "uppercase",
        letterSpacing: "0.5px"
    },
    statValue: {
        fontSize: "22px",
        fontWeight: "700",
        color: "#0f172a",
        margin: "2px 0"
    },
    statSub: {
        fontSize: "12px",
        color: "#94a3b8"
    },
    filtersSection: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "15px",
        marginBottom: "24px",
        background: "#fff",
        padding: "16px 20px",
        borderRadius: "12px",
        border: "1px solid #e2e8f0"
    },
    filtersLeft: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        flexWrap: "wrap",
        flex: 1
    },
    filtersRight: {
        display: "flex",
        alignItems: "center",
        gap: "12px"
    },
    searchWrapper: {
        display: "flex",
        alignItems: "center",
        background: "#f1f5f9",
        borderRadius: "8px",
        padding: "0 12px",
        flex: 1,
        minWidth: "200px",
        transition: "all 0.2s"
    },
    searchIcon: {
        marginRight: "8px"
    },
    searchInput: {
        border: "none",
        background: "transparent",
        padding: "10px 0",
        fontSize: "14px",
        outline: "none",
        width: "100%",
        color: "#0f172a"
    },
    filterGroup: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        background: "#f1f5f9",
        borderRadius: "8px",
        padding: "0 12px"
    },
    filterSelect: {
        border: "none",
        background: "transparent",
        padding: "10px 4px",
        fontSize: "13px",
        outline: "none",
        color: "#0f172a",
        cursor: "pointer"
    },
    resultCount: {
        fontSize: "14px",
        color: "#64748b",
        fontWeight: "500"
    },
    iconButton: {
        background: "#f1f5f9",
        border: "none",
        padding: "8px",
        borderRadius: "8px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#64748b",
        transition: "all 0.2s"
    },
    tableContainer: {
        background: "#fff",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        overflowX: "auto",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        fontSize: "14px",
        minWidth: "1100px"
    },
    th: {
        padding: "16px 20px",
        textAlign: "left",
        fontWeight: "600",
        color: "#475569",
        borderBottom: "2px solid #e2e8f0",
        background: "#f8fafc",
        fontSize: "12px",
        textTransform: "uppercase",
        letterSpacing: "0.5px"
    },
    tableRow: {
        borderBottom: "1px solid #f1f5f9",
        transition: "background 0.15s"
    },
    invoiceNumber: {
        fontWeight: "600",
        color: "#3b82f6",
        fontSize: "14px"
    },
    dateTime: {
        display: "flex",
        flexDirection: "column"
    },
    date: {
        fontWeight: "500",
        color: "#0f172a"
    },
    time: {
        fontSize: "12px",
        color: "#94a3b8"
    },
    customerCell: {
        display: "flex",
        alignItems: "center",
        gap: "10px"
    },
    customerAvatar: {
        width: "32px",
        height: "32px",
        borderRadius: "50%",
        background: "#dbeafe",
        color: "#3b82f6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "600",
        fontSize: "14px",
        flexShrink: 0
    },
    customerName: {
        fontWeight: "500",
        color: "#0f172a"
    },
    customerPhone: {
        fontSize: "12px",
        color: "#94a3b8"
    },
    itemsCell: {
        display: "flex",
        flexDirection: "column",
        gap: "4px"
    },
    itemsCount: {
        fontSize: "12px",
        fontWeight: "600",
        color: "#0f172a"
    },
    itemsSummary: {
        display: "flex",
        flexWrap: "wrap",
        gap: "4px"
    },
    itemChip: {
        fontSize: "11px",
        background: "#f1f5f9",
        padding: "2px 8px",
        borderRadius: "4px",
        color: "#475569",
        whiteSpace: "nowrap"
    },
    moreItems: {
        fontSize: "11px",
        color: "#94a3b8",
        padding: "2px 4px"
    },
    paymentMethodBadge: {
        background: "#f1f5f9",
        padding: "4px 12px",
        borderRadius: "6px",
        fontSize: "12px",
        color: "#475569",
        display: "inline-block"
    },
    statusBadge: {
        padding: "4px 12px",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: "500",
        display: "inline-block",
        whiteSpace: "nowrap"
    },
    amount: {
        fontWeight: "600",
        color: "#0f172a",
        fontSize: "15px"
    },
    actionButtons: {
        display: "flex",
        gap: "4px",
        justifyContent: "center",
        flexWrap: "wrap"
    },
    viewButton: {
        display: "flex",
        alignItems: "center",
        gap: "4px",
        background: "#10b981",
        color: "#fff",
        padding: "6px 12px",
        textDecoration: "none",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: "500",
        transition: "all 0.2s",
        border: "none",
        cursor: "pointer"
    },
    printButton: {
        background: "#3b82f6",
        border: "none",
        color: "#fff",
        padding: "6px 10px",
        cursor: "pointer",
        borderRadius: "6px",
        transition: "all 0.2s",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    },
    pdfButton: {
        background: "#8b5cf6",
        border: "none",
        color: "#fff",
        padding: "6px 10px",
        cursor: "pointer",
        borderRadius: "6px",
        transition: "all 0.2s",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    },
    deleteButton: {
        background: "#fee2e2",
        border: "none",
        color: "#dc2626",
        padding: "6px 10px",
        cursor: "pointer",
        borderRadius: "6px",
        transition: "all 0.2s",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    },
    loadingContainer: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px",
        background: "#fff",
        borderRadius: "12px",
        border: "1px solid #e2e8f0"
    },
    loadingSpinner: {
        border: "3px solid #f1f5f9",
        borderTop: "3px solid #3b82f6",
        borderRadius: "50%",
        width: "40px",
        height: "40px",
        animation: "spin 0.8s linear infinite"
    },
    loadingText: {
        marginTop: "16px",
        color: "#64748b",
        fontSize: "14px"
    },
    emptyState: {
        textAlign: "center",
        padding: "60px 20px",
        color: "#94a3b8"
    },
    emptyIcon: {
        fontSize: "48px",
        marginBottom: "16px"
    },
    emptyText: {
        fontSize: "16px",
        marginBottom: "12px",
        color: "#64748b"
    },
    emptyButton: {
        display: "inline-block",
        padding: "10px 24px",
        background: "#3b82f6",
        color: "#fff",
        textDecoration: "none",
        borderRadius: "8px",
        fontWeight: "500",
        transition: "all 0.2s"
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