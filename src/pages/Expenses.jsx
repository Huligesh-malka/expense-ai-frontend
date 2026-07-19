import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

export default function Expenses() {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");
    const [categories, setCategories] = useState([]);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchExpenses();
        fetchCategories();
    }, []);

    const fetchExpenses = async () => {
        try {
            const res = await axios.get(
                "http://localhost:5000/api/expenses?user_id=1"
            );
            setExpenses(res.data.data);
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await axios.get(
                "http://localhost:5000/api/categories"
            );
            setCategories(res.data.data || []);
        } catch (err) {
            console.log(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this expense?")) {
            try {
                await axios.delete(`http://localhost:5000/api/expenses/${id}`);
                fetchExpenses();
            } catch (err) {
                console.log(err);
                alert("Failed to delete expense");
            }
        }
    };

    const handleView = async (id) => {
        try {
            const res = await axios.get(
                `http://localhost:5000/api/expenses/${id}`
            );
            setSelectedExpense(res.data);
            setShowModal(true);
        } catch (err) {
            console.log(err);
            alert("Unable to load expense details");
        }
    };

    const filteredExpenses = expenses.filter(expense => {
        const matchesSearch = expense.merchant?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             expense.expense_name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === "all" || expense.category_name === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const getCategoryColor = (category) => {
        const colors = {
            'Food': '#f59e0b',
            'Transport': '#3b82f6',
            'Shopping': '#8b5cf6',
            'Entertainment': '#ec4899',
            'Bills': '#ef4444',
            'Health': '#10b981',
            'Education': '#06b6d4',
            'Other': '#6b7280'
        };
        return colors[category] || '#6b7280';
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const totalAmount = filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.pageTitle}>💰 Expenses</h1>
                    <p style={styles.subtitle}>Manage and track all your expenses</p>
                </div>
                <div style={styles.headerActions}>
                    <Link to="/add-expense">
                        <button style={styles.addButton}>
                            <span style={{ marginRight: "8px" }}>➕</span>
                            Add New Expense
                        </button>
                    </Link>
                    <Link to="/upload">
                        <button style={styles.uploadButton}>
                            <span style={{ marginRight: "8px" }}>📤</span>
                            Upload Receipt
                        </button>
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div style={styles.statsContainer}>
                <div style={styles.statCard}>
                    <div style={styles.statIcon}>📊</div>
                    <div>
                        <div style={styles.statValue}>{expenses.length}</div>
                        <div style={styles.statLabel}>Total Expenses</div>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statIcon}>💰</div>
                    <div>
                        <div style={styles.statValue}>₹{totalAmount.toFixed(2)}</div>
                        <div style={styles.statLabel}>Total Amount</div>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statIcon}>🏢</div>
                    <div>
                        <div style={styles.statValue}>
                            {new Set(expenses.map(e => e.merchant)).size}
                        </div>
                        <div style={styles.statLabel}>Unique Merchants</div>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statIcon}>📂</div>
                    <div>
                        <div style={styles.statValue}>
                            {new Set(expenses.map(e => e.category_name)).size}
                        </div>
                        <div style={styles.statLabel}>Categories</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div style={styles.filtersContainer}>
                <div style={styles.searchWrapper}>
                    <span style={styles.searchIcon}>🔍</span>
                    <input
                        type="text"
                        placeholder="Search by merchant or expense name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={styles.searchInput}
                    />
                </div>
                <div style={styles.filterWrapper}>
                    <label style={styles.filterLabel}>Category:</label>
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        style={styles.filterSelect}
                    >
                        <option value="all">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.name}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div style={styles.tableWrapper}>
                {loading ? (
                    <div style={styles.loadingContainer}>
                        <div style={styles.spinner}></div>
                        <p>Loading expenses...</p>
                    </div>
                ) : (
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Merchant</th>
                                <th style={styles.th}>Expense</th>
                                <th style={styles.th}>Category</th>
                                <th style={styles.th}>Amount</th>
                                <th style={styles.th}>Date</th>
                                <th style={styles.th}>Payment</th>
                                <th style={styles.th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredExpenses.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={styles.emptyState}>
                                        <div style={styles.emptyIcon}>📭</div>
                                        <p>No expenses found</p>
                                        <p style={styles.emptySubtext}>
                                            {searchTerm || filterCategory !== "all" 
                                                ? "Try adjusting your filters" 
                                                : "Start tracking your expenses today!"}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredExpenses.map((expense) => (
                                    <tr key={expense.id} style={styles.tr}>
                                        <td style={styles.td}>
                                            <div style={styles.merchantCell}>
                                                <span style={styles.merchantIcon}>🏢</span>
                                                <span>{expense.merchant}</span>
                                            </div>
                                        </td>
                                        <td style={styles.td}>
                                            <strong>{expense.expense_name}</strong>
                                        </td>
                                        <td style={styles.td}>
                                            <span style={{
                                                ...styles.categoryBadge,
                                                backgroundColor: getCategoryColor(expense.category_name) + '20',
                                                color: getCategoryColor(expense.category_name)
                                            }}>
                                                {expense.category_name}
                                            </span>
                                        </td>
                                        <td style={{...styles.td, fontWeight: "600", color: "#dc2626"}}>
                                            ₹{Number(expense.amount).toFixed(2)}
                                        </td>
                                        <td style={styles.td}>{formatDate(expense.expense_date)}</td>
                                        <td style={styles.td}>
                                            <span style={styles.paymentBadge}>
                                                {expense.payment_method}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={styles.actionButtons}>
                                                <button
                                                    onClick={() => handleView(expense.id)}
                                                    style={styles.viewButton}
                                                >
                                                    View
                                                </button>
                                                <Link to={`/edit-expense/${expense.id}`}>
                                                    <button style={styles.editButton}>
                                                        Edit
                                                    </button>
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(expense.id)}
                                                    style={styles.deleteButton}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* View Modal - Only Products and Summary */}
            {showModal && selectedExpense && (
                <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h2>Expense Details</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                style={styles.closeButton}
                            >
                                ✕
                            </button>
                        </div>
                        <div style={styles.modalBody}>
                            {/* Products Section */}
                            {selectedExpense.products && selectedExpense.products.length > 0 ? (
                                <>
                                    <div style={styles.sectionDivider}>
                                        <span style={styles.sectionTitle}>Products</span>
                                    </div>
                                    <div style={styles.tableWrapperSmall}>
                                        <table style={styles.productTable}>
                                            <thead>
                                                <tr>
                                                    <th style={styles.productTh}>Product</th>
                                                    <th style={styles.productTh}>Qty</th>
                                                    <th style={styles.productTh}>Price</th>
                                                    <th style={styles.productTh}>Discount</th>
                                                    <th style={styles.productTh}>GST</th>
                                                    <th style={styles.productTh}>Final</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedExpense.products.map((item) => (
                                                    <tr key={item.id} style={styles.productTr}>
                                                        <td style={styles.productTd}>{item.product_name}</td>
                                                        <td style={styles.productTd}>{item.quantity}</td>
                                                        <td style={styles.productTd}>₹{Number(item.unit_price || 0).toFixed(2)}</td>
                                                        <td style={styles.productTd}>₹{Number(item.discount || 0).toFixed(2)}</td>
                                                        <td style={styles.productTd}>{Number(item.gst_percent || 0).toFixed(2)}%</td>
                                                        <td style={{...styles.productTd, fontWeight: "600", color: "#2563eb"}}>
                                                            ₹{Number(item.final_price || 0).toFixed(2)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            ) : (
                                <div style={styles.noProductsMessage}>
                                    <p>No products found for this expense</p>
                                </div>
                            )}

                            {/* Bill Summary */}
                            {selectedExpense.summary ? (
                                <>
                                    <div style={styles.sectionDivider}>
                                        <span style={styles.sectionTitle}>Bill Summary</span>
                                    </div>
                                    <div style={styles.summaryContainer}>
                                        <div style={styles.summaryRow}>
                                            <span style={styles.summaryLabel}>Subtotal :</span>
                                            <span style={styles.summaryValue}>₹{Number(selectedExpense.summary.subtotal || 0).toFixed(2)}</span>
                                        </div>
                                        <div style={styles.summaryRow}>
                                            <span style={styles.summaryLabel}>Discount :</span>
                                            <span style={{...styles.summaryValue, color: "#dc2626"}}>
                                                -₹{Number(selectedExpense.summary.discount || 0).toFixed(2)}
                                            </span>
                                        </div>
                                        <div style={styles.summaryRow}>
                                            <span style={styles.summaryLabel}>GST :</span>
                                            <span style={styles.summaryValue}>₹{Number(selectedExpense.summary.gst || 0).toFixed(2)}</span>
                                        </div>
                                        <div style={styles.grandTotalRow}>
                                            <span style={styles.grandTotalLabel}>Grand Total :</span>
                                            <span style={styles.grandTotalValue}>
                                                ₹{Number(selectedExpense.summary.grandTotal || 0).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div style={styles.noSummaryMessage}>
                                    <p>No summary available</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    container: {
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "30px",
        background: "#f8fafc",
        minHeight: "100vh"
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "30px",
        padding: "20px",
        background: "#fff",
        borderRadius: "12px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
    },
    pageTitle: {
        fontSize: "28px",
        fontWeight: "700",
        color: "#1e293b",
        marginBottom: "5px"
    },
    subtitle: {
        color: "#64748b",
        fontSize: "14px"
    },
    headerActions: {
        display: "flex",
        gap: "12px"
    },
    addButton: {
        padding: "12px 24px",
        background: "#2563eb",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: "600",
        transition: "all 0.2s"
    },
    uploadButton: {
        padding: "12px 24px",
        background: "#0ea5e9",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: "600",
        transition: "all 0.2s"
    },
    statsContainer: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px",
        marginBottom: "24px"
    },
    statCard: {
        display: "flex",
        alignItems: "center",
        gap: "16px",
        background: "#fff",
        padding: "20px",
        borderRadius: "12px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
    },
    statIcon: {
        fontSize: "28px"
    },
    statValue: {
        fontSize: "24px",
        fontWeight: "700",
        color: "#1e293b"
    },
    statLabel: {
        fontSize: "13px",
        color: "#64748b"
    },
    filtersContainer: {
        display: "flex",
        gap: "16px",
        marginBottom: "24px",
        flexWrap: "wrap"
    },
    searchWrapper: {
        flex: "1",
        position: "relative",
        minWidth: "250px"
    },
    searchIcon: {
        position: "absolute",
        left: "12px",
        top: "50%",
        transform: "translateY(-50%)"
    },
    searchInput: {
        width: "100%",
        padding: "12px 16px 12px 40px",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        fontSize: "14px",
        outline: "none",
        transition: "border-color 0.2s"
    },
    filterWrapper: {
        display: "flex",
        alignItems: "center",
        gap: "8px"
    },
    filterLabel: {
        fontSize: "14px",
        color: "#64748b",
        fontWeight: "500"
    },
    filterSelect: {
        padding: "12px 16px",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        fontSize: "14px",
        outline: "none",
        background: "#fff",
        cursor: "pointer"
    },
    tableWrapper: {
        background: "#fff",
        borderRadius: "12px",
        overflow: "auto",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        fontSize: "14px"
    },
    th: {
        padding: "16px 20px",
        textAlign: "left",
        background: "#f8fafc",
        color: "#475569",
        fontWeight: "600",
        borderBottom: "2px solid #e2e8f0",
        whiteSpace: "nowrap"
    },
    tr: {
        borderBottom: "1px solid #f1f5f9",
        transition: "background 0.1s"
    },
    td: {
        padding: "16px 20px",
        color: "#1e293b"
    },
    merchantCell: {
        display: "flex",
        alignItems: "center",
        gap: "8px"
    },
    merchantIcon: {
        fontSize: "16px"
    },
    categoryBadge: {
        padding: "4px 12px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "500",
        display: "inline-block"
    },
    paymentBadge: {
        padding: "4px 12px",
        background: "#f1f5f9",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "500",
        color: "#475569"
    },
    actionButtons: {
        display: "flex",
        gap: "6px",
        flexWrap: "wrap"
    },
    viewButton: {
        padding: "6px 14px",
        background: "#0ea5e9",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: "500"
    },
    editButton: {
        padding: "6px 14px",
        background: "#8b5cf6",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: "500"
    },
    deleteButton: {
        padding: "6px 14px",
        background: "#ef4444",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: "500"
    },
    loadingContainer: {
        padding: "60px",
        textAlign: "center",
        color: "#64748b"
    },
    spinner: {
        display: "inline-block",
        width: "40px",
        height: "40px",
        border: "4px solid #e2e8f0",
        borderTop: "4px solid #2563eb",
        borderRadius: "50%",
        animation: "spin 1s linear infinite"
    },
    emptyState: {
        padding: "60px",
        textAlign: "center",
        color: "#64748b"
    },
    emptyIcon: {
        fontSize: "48px",
        marginBottom: "16px"
    },
    emptySubtext: {
        fontSize: "13px",
        color: "#94a3b8",
        marginTop: "8px"
    },
    modalOverlay: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px"
    },
    modal: {
        background: "#fff",
        borderRadius: "16px",
        maxWidth: "700px",
        width: "100%",
        maxHeight: "90vh",
        overflow: "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)"
    },
    modalHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "24px 28px",
        borderBottom: "1px solid #f1f5f9",
        position: "sticky",
        top: 0,
        background: "#fff",
        zIndex: 1
    },
    closeButton: {
        background: "none",
        border: "none",
        fontSize: "20px",
        cursor: "pointer",
        color: "#64748b",
        padding: "4px 8px",
        borderRadius: "4px",
        transition: "background 0.2s"
    },
    modalBody: {
        padding: "28px",
        display: "flex",
        flexDirection: "column",
        gap: "16px"
    },
    sectionDivider: {
        marginTop: "12px",
        paddingTop: "12px",
        borderTop: "2px solid #e2e8f0"
    },
    sectionTitle: {
        fontSize: "16px",
        fontWeight: "600",
        color: "#1e293b"
    },
    tableWrapperSmall: {
        overflow: "auto",
        marginTop: "8px"
    },
    productTable: {
        width: "100%",
        borderCollapse: "collapse",
        fontSize: "13px",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        overflow: "hidden"
    },
    productTh: {
        padding: "10px 12px",
        textAlign: "left",
        background: "#f8fafc",
        color: "#475569",
        fontWeight: "600",
        borderBottom: "2px solid #e2e8f0",
        fontSize: "12px",
        textTransform: "uppercase",
        letterSpacing: "0.5px"
    },
    productTr: {
        borderBottom: "1px solid #f1f5f9"
    },
    productTd: {
        padding: "10px 12px",
        color: "#1e293b",
        fontSize: "13px"
    },
    summaryContainer: {
        background: "#f8fafc",
        padding: "16px 20px",
        borderRadius: "8px",
        marginTop: "4px"
    },
    summaryRow: {
        display: "flex",
        justifyContent: "space-between",
        padding: "4px 0"
    },
    summaryLabel: {
        color: "#64748b",
        fontSize: "14px"
    },
    summaryValue: {
        color: "#1e293b",
        fontWeight: "500",
        fontSize: "14px"
    },
    grandTotalRow: {
        display: "flex",
        justifyContent: "space-between",
        padding: "12px 0 4px 0",
        borderTop: "2px solid #cbd5e1",
        marginTop: "8px"
    },
    grandTotalLabel: {
        fontSize: "18px",
        fontWeight: "700",
        color: "#1e293b"
    },
    grandTotalValue: {
        fontSize: "20px",
        fontWeight: "700",
        color: "#2563eb"
    },
    noProductsMessage: {
        textAlign: "center",
        padding: "20px",
        color: "#64748b",
        fontStyle: "italic"
    },
    noSummaryMessage: {
        textAlign: "center",
        padding: "20px",
        color: "#64748b",
        fontStyle: "italic"
    }
};

// Add CSS animation
const styleTag = document.createElement('style');
styleTag.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    button:hover {
        opacity: 0.85;
        transform: translateY(-1px);
    }
    button:active {
        transform: translateY(0px);
    }
`;
document.head.appendChild(styleTag);