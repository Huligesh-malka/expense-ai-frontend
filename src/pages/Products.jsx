import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

export default function Products() {
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedStockStatus, setSelectedStockStatus] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState("product_name");
    const [sortDirection, setSortDirection] = useState("asc");
    const itemsPerPage = 10;

    // Load products on mount
    useEffect(() => {
        loadProducts();
    }, []);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, selectedCategory, selectedStockStatus]);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const businessId = localStorage.getItem("businessId");
            if (!businessId) {
                setMessage("❌ Business ID not found");
                setMessageType("error");
                setLoading(false);
                return;
            }

            const res = await API.get(`/products?business_id=${businessId}`);
            setProducts(res.data.data || []);
            setMessage("");
        } catch (err) {
            console.error("Error loading products:", err);
            setMessage("❌ Failed to load products");
            setMessageType("error");
        } finally {
            setLoading(false);
        }
    };

    const deleteProduct = async (id) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;

        try {
            await API.delete(`/products/${id}`);
            setMessage("✅ Product deleted successfully!");
            setMessageType("success");
            loadProducts();

            setTimeout(() => {
                setMessage("");
                setMessageType("");
            }, 3000);
        } catch (err) {
            console.error("Error deleting product:", err);
            setMessage("❌ Failed to delete product");
            setMessageType("error");
        }
    };

    const getUnitIcon = (unit) => {
        const icons = {
            kg: "⚖️",
            g: "⚖️",
            pcs: "📦",
            l: "🥤",
            ml: "🥤",
            meter: "📏",
            feet: "📏",
            pack: "📦",
            box: "📦",
            bottle: "🧴",
            dozen: "📦",
        };
        return icons[unit] || "📦";
    };

    // ─── Stock status helper ─────────────────────────────────
    const getStockStatusInfo = (stock, minStock) => {
        const ratio = minStock > 0 ? stock / minStock : Infinity;
        if (stock <= 0) return { key: "out_of_stock", label: "Out of Stock", color: "#991b1b", bg: "#fee2e2" };
        if (stock <= minStock) return { key: "low_stock", label: "Low Stock", color: "#92400e", bg: "#fef3c7" };
        if (ratio <= 3) return { key: "medium", label: "Medium", color: "#1e40af", bg: "#dbeafe" };
        return { key: "in_stock", label: "In Stock", color: "#166534", bg: "#dcfce7" };
    };

    // ─── Expiry helper (kept for display only, no filter) ────
    const getExpiryStatus = (expiryDate) => {
        if (!expiryDate) return null;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const expiry = new Date(expiryDate);
        expiry.setHours(0, 0, 0, 0);

        const diffTime = expiry - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { status: "expired", label: "Expired", color: "#dc2626", bg: "#fee2e2", icon: "🔴" };
        } else if (diffDays <= 7) {
            return { status: "expiring_soon", label: "Expiring Soon", color: "#ea580c", bg: "#fff7ed", icon: "🟠" };
        } else if (diffDays <= 30) {
            return { status: "expiring", label: "Expiring", color: "#ca8a04", bg: "#fefce8", icon: "🟡" };
        } else {
            return { status: "good", label: "Valid", color: "#16a34a", bg: "#dcfce7", icon: "✅" };
        }
    };

    const getExpiryBadge = (expiryDate) => {
        const status = getExpiryStatus(expiryDate);
        if (!status) return <span style={{ color: "#94a3b8", fontSize: "12px" }}>—</span>;

        return (
            <span
                style={{
                    ...styles.expiryBadge,
                    background: status.bg,
                    color: status.color,
                }}
            >
                <span style={{ marginRight: "4px" }}>{status.icon}</span>
                {new Date(expiryDate).toLocaleDateString()}
            </span>
        );
    };

    // Get unique categories for filter
    const categories = useMemo(() => {
        const cats = new Set();
        products.forEach((p) => {
            if (p.category) cats.add(p.category);
        });
        return Array.from(cats);
    }, [products]);

    // Filter and sort products
    const filteredAndSortedProducts = useMemo(() => {
        let filtered = products.filter((item) => {
            const matchesSearch =
                item.product_name?.toLowerCase().includes(search.toLowerCase()) ||
                item.product_code?.toLowerCase().includes(search.toLowerCase()) ||
                item.barcode?.includes(search);

            const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;

            let matchesStockStatus = true;
            if (selectedStockStatus !== "all") {
                const stockInfo = getStockStatusInfo(item.stock, item.min_stock);
                if (selectedStockStatus === "low_stock") {
                    matchesStockStatus = stockInfo.key === "low_stock";
                } else if (selectedStockStatus === "out_of_stock") {
                    matchesStockStatus = stockInfo.key === "out_of_stock";
                } else if (selectedStockStatus === "in_stock") {
                    matchesStockStatus = stockInfo.key === "in_stock" || stockInfo.key === "medium";
                }
            }

            return matchesSearch && matchesCategory && matchesStockStatus;
        });

        // Sort
        filtered.sort((a, b) => {
            let aVal = a[sortField] ?? "";
            let bVal = b[sortField] ?? "";

            if (sortField === "selling_price" || sortField === "stock") {
                aVal = parseFloat(aVal) || 0;
                bVal = parseFloat(bVal) || 0;
            } else if (sortField === "expiry_date") {
                aVal = aVal ? new Date(aVal).getTime() : 0;
                bVal = bVal ? new Date(bVal).getTime() : 0;
            } else if (typeof aVal === "string") {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }

            if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
            if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [products, search, selectedCategory, selectedStockStatus, sortField, sortDirection]);

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentProducts = filteredAndSortedProducts.slice(startIndex, endIndex);

    // Summary stats — only the 3 that matter day-to-day
    const stats = useMemo(() => {
        const total = filteredAndSortedProducts.length;
        const lowStock = filteredAndSortedProducts.filter((p) => p.stock > 0 && p.stock <= p.min_stock).length;
        const outOfStock = filteredAndSortedProducts.filter((p) => p.stock <= 0).length;
        return { total, lowStock, outOfStock };
    }, [filteredAndSortedProducts]);

    // Handle sort
    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const renderSortIcon = (field) => {
        if (sortField !== field) return <span style={styles.sortIcon}>↕</span>;
        return <span style={styles.sortIcon}>{sortDirection === "asc" ? "↑" : "↓"}</span>;
    };

    // Render table
    const renderTableView = () => (
        <div style={styles.tableWrapper}>
            <table style={styles.table}>
                <thead>
                    <tr style={styles.tableHeader}>
                        <th style={styles.th} onClick={() => handleSort("product_name")}>
                            Product {renderSortIcon("product_name")}
                        </th>
                        <th style={styles.th} onClick={() => handleSort("category")}>
                            Category {renderSortIcon("category")}
                        </th>
                        <th style={styles.th} onClick={() => handleSort("selling_price")}>
                            Price {renderSortIcon("selling_price")}
                        </th>
                        <th style={styles.th} onClick={() => handleSort("stock")}>
                            Stock {renderSortIcon("stock")}
                        </th>
                        <th style={styles.th} onClick={() => handleSort("expiry_date")}>
                            Expiry {renderSortIcon("expiry_date")}
                        </th>
                        <th style={{ ...styles.th, textAlign: "center" }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {currentProducts.length === 0 ? (
                        <tr>
                            <td colSpan="6" style={styles.noData}>
                                {search || selectedCategory !== "all" || selectedStockStatus !== "all" ? (
                                    <div>
                                        <span style={{ fontSize: "32px", display: "block", marginBottom: "8px" }}>🔍</span>
                                        No products match your filters
                                    </div>
                                ) : (
                                    <div>
                                        <span style={{ fontSize: "32px", display: "block", marginBottom: "8px" }}>📦</span>
                                        No products found. Click <strong>"Add Product"</strong> to get started.
                                    </div>
                                )}
                            </td>
                        </tr>
                    ) : (
                        currentProducts.map((product) => {
                            const formattedStock = Number(product.stock).toFixed(2);
                            const unit = String(product.unit || "pcs").toUpperCase();
                            const unitIcon = getUnitIcon(product.unit);
                            const stockInfo = getStockStatusInfo(product.stock, product.min_stock);

                            return (
                                <tr key={product.id} style={styles.tableRow}>
                                    <td style={styles.td}>
                                        <div style={styles.productInfo}>
                                            {product.image ? (
                                                <img
                                                    src={product.image}
                                                    alt={product.product_name}
                                                    style={styles.productImage}
                                                    onError={(e) => {
                                                        e.target.style.display = "none";
                                                    }}
                                                />
                                            ) : (
                                                <div style={styles.productImagePlaceholder}>
                                                    <span>📦</span>
                                                </div>
                                            )}
                                            <div style={styles.productNameWrapper}>
                                                <div style={styles.productName}>{product.product_name}</div>
                                                {product.product_code && (
                                                    <div style={styles.productCode}>{product.product_code}</div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td style={styles.td}>
                                        <span style={styles.categoryBadge}>{product.category || "Other"}</span>
                                    </td>
                                    <td style={styles.td}>
                                        <span style={styles.sellingPrice}>
                                            ₹{parseFloat(product.selling_price || 0).toFixed(2)}
                                        </span>
                                        <small style={styles.priceUnitText}>
                                            /{product.price_per || 1} {String(product.price_unit || "pcs").toUpperCase()}
                                        </small>
                                    </td>
                                    <td style={styles.td}>
                                        <div style={styles.stockCell}>
                                            <span
                                                style={{
                                                    ...styles.stockBadge,
                                                    background: stockInfo.bg,
                                                    color: stockInfo.color,
                                                }}
                                            >
                                                {unitIcon} {formattedStock} {unit}
                                            </span>
                                            <div style={styles.stockBarWrapper}>
                                                <div
                                                    style={{
                                                        ...styles.stockBar,
                                                        width: `${Math.min(
                                                            (product.stock / (product.min_stock || 1)) * 100,
                                                            100
                                                        )}%`,
                                                        background: stockInfo.color,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td style={styles.td}>{getExpiryBadge(product.expiry_date)}</td>
                                    <td style={styles.td}>
                                        <div style={styles.actionButtons}>
                                            <Link
                                                to={`/edit-product/${product.id}`}
                                                style={styles.editButton}
                                                title="Edit Product"
                                            >
                                                ✏️
                                            </Link>
                                            <button
                                                style={styles.deleteButton}
                                                onClick={() => deleteProduct(product.id)}
                                                title="Delete Product"
                                            >
                                                🗑️
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
    );

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>📦 Products</h1>
                    <p style={styles.subtitle}>{products.length} products in your inventory</p>
                </div>
                <Link to="/add-product" style={styles.addButton}>
                    <span style={styles.addIcon}>+</span> Add Product
                </Link>
            </div>

            {/* Message */}
            {message && (
                <div
                    style={{
                        ...styles.message,
                        ...(messageType === "success" ? styles.successMessage : styles.errorMessage),
                    }}
                >
                    {message}
                </div>
            )}

            {/* Stats Cards — only 3 */}
            <div style={styles.statsContainer}>
                <div style={styles.statCard}>
                    <div style={styles.statIcon}>📦</div>
                    <div style={styles.statContent}>
                        <span style={styles.statValue}>{stats.total}</span>
                        <span style={styles.statLabel}>Total Products</span>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={{ ...styles.statIcon, background: "#fef3c7", color: "#92400e" }}>⚠️</div>
                    <div style={styles.statContent}>
                        <span style={styles.statValue}>{stats.lowStock}</span>
                        <span style={styles.statLabel}>Low Stock</span>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={{ ...styles.statIcon, background: "#fee2e2", color: "#991b1b" }}>🚫</div>
                    <div style={styles.statContent}>
                        <span style={styles.statValue}>{stats.outOfStock}</span>
                        <span style={styles.statLabel}>Out of Stock</span>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div style={styles.toolbar}>
                <div style={styles.toolbarLeft}>
                    <div style={styles.searchWrapper}>
                        <span style={styles.searchIcon}>🔍</span>
                        <input
                            placeholder="Search product / barcode..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={styles.searchBox}
                        />
                        {search && (
                            <button style={styles.clearButton} onClick={() => setSearch("")}>
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                <div style={styles.toolbarRight}>
                    <div style={styles.filterWrapper}>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            style={styles.filterSelect}
                        >
                            <option value="all">All Categories</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>

                        <select
                            value={selectedStockStatus}
                            onChange={(e) => setSelectedStockStatus(e.target.value)}
                            style={styles.filterSelect}
                        >
                            <option value="all">All Stock Status</option>
                            <option value="in_stock">✅ In Stock</option>
                            <option value="low_stock">⚠️ Low Stock</option>
                            <option value="out_of_stock">🚫 Out of Stock</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {loading ? (
                <div style={styles.loadingState}>
                    <div style={styles.spinner}></div>
                    <p style={styles.loadingText}>Loading products...</p>
                </div>
            ) : (
                <>
                    {renderTableView()}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={styles.pagination}>
                            <button
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                style={{
                                    ...styles.pageButton,
                                    ...(currentPage === 1 ? styles.pageButtonDisabled : {}),
                                }}
                            >
                                ← Previous
                            </button>
                            <div style={styles.pageInfo}>
                                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            style={{
                                                ...styles.pageNumber,
                                                ...(currentPage === pageNum ? styles.pageNumberActive : {}),
                                            }}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                                {totalPages > 5 && currentPage < totalPages - 2 && (
                                    <span style={styles.pageEllipsis}>…</span>
                                )}
                                {totalPages > 5 && currentPage < totalPages - 2 && (
                                    <button onClick={() => setCurrentPage(totalPages)} style={styles.pageNumber}>
                                        {totalPages}
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                style={{
                                    ...styles.pageButton,
                                    ...(currentPage === totalPages ? styles.pageButtonDisabled : {}),
                                }}
                            >
                                Next →
                            </button>
                        </div>
                    )}

                    {/* Footer Info */}
                    <div style={styles.footerInfo}>
                        Showing {startIndex + 1}–{Math.min(endIndex, filteredAndSortedProducts.length)} of{" "}
                        {filteredAndSortedProducts.length} products
                    </div>
                </>
            )}
        </div>
    );
}

// ============================================================
// STYLES
// ============================================================
const styles = {
    container: {
        maxWidth: "1200px",
        margin: "24px auto",
        padding: "0 24px",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },

    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "28px",
        flexWrap: "wrap",
        gap: "16px",
    },
    title: {
        fontSize: "28px",
        fontWeight: "700",
        color: "#0f172a",
        margin: "0 0 4px 0",
        letterSpacing: "-0.5px",
    },
    subtitle: {
        fontSize: "14px",
        color: "#64748b",
        margin: 0,
    },
    addButton: {
        background: "#0f172a",
        color: "#fff",
        textDecoration: "none",
        padding: "12px 28px",
        borderRadius: "10px",
        fontSize: "15px",
        fontWeight: "600",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        transition: "all 0.2s",
        whiteSpace: "nowrap",
        border: "none",
        cursor: "pointer",
        boxShadow: "0 4px 12px rgba(15, 23, 42, 0.15)",
    },
    addIcon: {
        fontSize: "20px",
        fontWeight: "300",
        lineHeight: 1,
    },

    message: {
        padding: "14px 20px",
        marginBottom: "24px",
        borderRadius: "10px",
        fontSize: "14px",
        fontWeight: "500",
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },
    successMessage: {
        background: "#f0fdf4",
        color: "#166534",
        border: "1px solid #bbf7d0",
    },
    errorMessage: {
        background: "#fef2f2",
        color: "#991b1b",
        border: "1px solid #fecaca",
    },

    statsContainer: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "12px",
        marginBottom: "24px",
    },
    statCard: {
        background: "#ffffff",
        padding: "16px 18px",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        transition: "all 0.2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    },
    statIcon: {
        width: "44px",
        height: "44px",
        borderRadius: "10px",
        background: "#f1f5f9",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "20px",
        flexShrink: 0,
    },
    statContent: {
        display: "flex",
        flexDirection: "column",
    },
    statValue: {
        fontSize: "22px",
        fontWeight: "700",
        color: "#0f172a",
        lineHeight: 1.2,
    },
    statLabel: {
        fontSize: "12px",
        color: "#94a3b8",
        fontWeight: "500",
        textTransform: "uppercase",
        letterSpacing: "0.3px",
    },

    toolbar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "24px",
        gap: "16px",
        flexWrap: "wrap",
    },
    toolbarLeft: {
        flex: 1,
        minWidth: "200px",
    },
    toolbarRight: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        flexWrap: "wrap",
    },
    searchWrapper: {
        position: "relative",
        maxWidth: "420px",
        width: "100%",
    },
    searchIcon: {
        position: "absolute",
        left: "14px",
        top: "50%",
        transform: "translateY(-50%)",
        color: "#94a3b8",
        fontSize: "16px",
    },
    searchBox: {
        width: "100%",
        padding: "11px 40px 11px 42px",
        border: "1px solid #e2e8f0",
        borderRadius: "10px",
        fontSize: "14px",
        backgroundColor: "#f8fafc",
        transition: "all 0.2s",
        boxSizing: "border-box",
        color: "#0f172a",
        outline: "none",
    },
    clearButton: {
        position: "absolute",
        right: "12px",
        top: "50%",
        transform: "translateY(-50%)",
        background: "none",
        border: "none",
        color: "#94a3b8",
        cursor: "pointer",
        fontSize: "16px",
        padding: "4px 8px",
        borderRadius: "6px",
        transition: "background 0.2s",
    },
    filterWrapper: {
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
    },
    filterSelect: {
        padding: "10px 14px",
        border: "1px solid #e2e8f0",
        borderRadius: "10px",
        fontSize: "13px",
        backgroundColor: "#f8fafc",
        cursor: "pointer",
        color: "#0f172a",
        outline: "none",
        transition: "border-color 0.2s",
        minWidth: "150px",
    },

    tableWrapper: {
        overflowX: "auto",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        background: "#ffffff",
        marginBottom: "20px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        fontSize: "13px",
        minWidth: "760px",
    },
    tableHeader: {
        background: "#f8fafc",
        borderBottom: "1px solid #e2e8f0",
    },
    th: {
        padding: "14px 16px",
        textAlign: "left",
        fontWeight: "600",
        color: "#475569",
        fontSize: "12px",
        textTransform: "uppercase",
        letterSpacing: "0.4px",
        borderBottom: "1px solid #e2e8f0",
        whiteSpace: "nowrap",
        cursor: "pointer",
        userSelect: "none",
    },
    tableRow: {
        borderBottom: "1px solid #f1f5f9",
        transition: "background 0.15s",
    },
    td: {
        padding: "12px 16px",
        verticalAlign: "middle",
        borderBottom: "1px solid #f1f5f9",
        fontSize: "13px",
        color: "#0f172a",
    },
    productInfo: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
    },
    productImage: {
        width: "40px",
        height: "40px",
        borderRadius: "8px",
        objectFit: "cover",
        border: "1px solid #e2e8f0",
        background: "#f8fafc",
        flexShrink: 0,
    },
    productImagePlaceholder: {
        width: "40px",
        height: "40px",
        borderRadius: "8px",
        border: "1px solid #e2e8f0",
        background: "#f8fafc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "18px",
        flexShrink: 0,
    },
    productNameWrapper: {
        display: "flex",
        flexDirection: "column",
    },
    productName: {
        fontWeight: "600",
        color: "#0f172a",
        fontSize: "14px",
    },
    productCode: {
        fontSize: "11px",
        color: "#94a3b8",
        fontFamily: "monospace",
        marginTop: "1px",
    },
    categoryBadge: {
        background: "#f1f5f9",
        padding: "4px 12px",
        borderRadius: "20px",
        fontSize: "12px",
        color: "#475569",
        display: "inline-block",
        fontWeight: "500",
    },
    sellingPrice: {
        color: "#0f172a",
        fontSize: "14px",
        fontWeight: "700",
        display: "block",
    },
    priceUnitText: {
        fontSize: "10px",
        color: "#94a3b8",
        fontWeight: "400",
        display: "block",
        marginTop: "1px",
    },
    stockCell: {
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        minWidth: "80px",
    },
    stockBadge: {
        display: "inline-block",
        padding: "3px 12px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "600",
        whiteSpace: "nowrap",
    },
    stockBarWrapper: {
        width: "100%",
        height: "4px",
        background: "#e2e8f0",
        borderRadius: "4px",
        overflow: "hidden",
    },
    stockBar: {
        height: "100%",
        borderRadius: "4px",
        transition: "width 0.4s ease",
    },
    expiryBadge: {
        padding: "4px 12px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "600",
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        whiteSpace: "nowrap",
    },
    actionButtons: {
        display: "flex",
        gap: "6px",
        alignItems: "center",
        justifyContent: "center",
    },
    editButton: {
        background: "#f1f5f9",
        color: "#0f172a",
        padding: "6px 12px",
        textDecoration: "none",
        borderRadius: "8px",
        fontSize: "14px",
        transition: "all 0.2s",
        border: "none",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 1,
    },
    deleteButton: {
        background: "#fef2f2",
        color: "#dc2626",
        border: "none",
        padding: "6px 12px",
        cursor: "pointer",
        borderRadius: "8px",
        fontSize: "14px",
        transition: "all 0.2s",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 1,
    },
    noData: {
        padding: "48px 20px",
        textAlign: "center",
        color: "#94a3b8",
        fontSize: "15px",
    },

    pagination: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "12px",
        marginTop: "8px",
        padding: "16px 0",
        flexWrap: "wrap",
    },
    pageButton: {
        padding: "8px 18px",
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: "500",
        color: "#475569",
        transition: "all 0.2s",
    },
    pageButtonDisabled: {
        opacity: 0.4,
        cursor: "not-allowed",
    },
    pageInfo: {
        display: "flex",
        alignItems: "center",
        gap: "4px",
    },
    pageNumber: {
        padding: "6px 12px",
        borderRadius: "6px",
        border: "none",
        background: "transparent",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: "500",
        color: "#475569",
        transition: "all 0.2s",
        minWidth: "32px",
        textAlign: "center",
    },
    pageNumberActive: {
        background: "#0f172a",
        color: "#fff",
    },
    pageEllipsis: {
        color: "#94a3b8",
        padding: "0 4px",
        fontSize: "14px",
    },

    loadingState: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 20px",
        gap: "16px",
    },
    spinner: {
        width: "44px",
        height: "44px",
        border: "4px solid #e2e8f0",
        borderTop: "4px solid #0f172a",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
    },
    loadingText: {
        color: "#94a3b8",
        fontSize: "15px",
        fontWeight: "500",
    },

    footerInfo: {
        textAlign: "center",
        fontSize: "13px",
        color: "#94a3b8",
        padding: "4px 0 8px",
    },

    sortIcon: {
        marginLeft: "4px",
        fontSize: "12px",
        color: "#94a3b8",
        display: "inline-block",
    },
};

// Inject keyframe animations and hover styles
if (typeof document !== "undefined" && !document.getElementById("products-page-styles")) {
    const styleSheet = document.createElement("style");
    styleSheet.id = "products-page-styles";
    styleSheet.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        th:hover {
            color: #0f172a !important;
        }
        .search-box:focus {
            border-color: #0f172a !important;
            box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.08) !important;
            background: #ffffff !important;
        }
        .page-button:hover:not(:disabled) {
            background: #e2e8f0 !important;
            border-color: #cbd5e1 !important;
        }
    `;
    document.head.appendChild(styleSheet);
}