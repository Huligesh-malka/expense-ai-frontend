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

    useEffect(() => {
        loadProducts();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, selectedCategory, selectedStockStatus]);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const businessId = localStorage.getItem("businessId");
            if (!businessId) {
                setMessage("Business ID not found");
                setMessageType("error");
                setLoading(false);
                return;
            }

            const res = await API.get(`/products?business_id=${businessId}`);
            setProducts(res.data.data || []);
            setMessage("");
        } catch (err) {
            console.error("Error loading products:", err);
            setMessage("Couldn't load products");
            setMessageType("error");
        } finally {
            setLoading(false);
        }
    };

    const deleteProduct = async (id) => {
        if (!window.confirm("Remove this product from inventory?")) return;

        try {
            await API.delete(`/products/${id}`);
            setMessage("Product removed");
            setMessageType("success");
            loadProducts();

            setTimeout(() => {
                setMessage("");
                setMessageType("");
            }, 3000);
        } catch (err) {
            console.error("Error deleting product:", err);
            setMessage("Couldn't remove product");
            setMessageType("error");
        }
    };

    const getUnitLabel = (unit) => String(unit || "pcs").toUpperCase();

    // ─── Stock status ─────────────────────────────────────────
    const getStockStatusInfo = (stock, minStock) => {
        const ratio = minStock > 0 ? stock / minStock : Infinity;
        if (stock <= 0) return { key: "out_of_stock", label: "Out", color: "#B3261E", bg: "#FBEAE9", ring: "#E4B8B5" };
        if (stock <= minStock) return { key: "low_stock", label: "Low", color: "#A66A00", bg: "#FBF1DE", ring: "#E7CB92" };
        if (ratio <= 3) return { key: "medium", label: "OK", color: "#3D5A80", bg: "#EAF0F6", ring: "#B9CBDD" };
        return { key: "in_stock", label: "Stocked", color: "#2F6F4E", bg: "#E9F3ED", ring: "#B7D6C4" };
    };

    // ─── Expiry (display only) ─────────────────────────────────
    const getExpiryStatus = (expiryDate) => {
        if (!expiryDate) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(expiryDate);
        expiry.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { label: "Expired", color: "#B3261E", bg: "#FBEAE9" };
        if (diffDays <= 7) return { label: "This week", color: "#A66A00", bg: "#FBF1DE" };
        if (diffDays <= 30) return { label: "This month", color: "#8A6D00", bg: "#FAF4DE" };
        return { label: "Fine", color: "#2F6F4E", bg: "#E9F3ED" };
    };

    const renderExpiryCell = (expiryDate) => {
        if (!expiryDate) return <span style={styles.dash}>—</span>;
        const status = getExpiryStatus(expiryDate);
        return (
            <div style={styles.expiryCell}>
                <span style={styles.expiryDate}>{new Date(expiryDate).toLocaleDateString("en-IN")}</span>
                <span style={{ ...styles.expiryTag, color: status.color, background: status.bg }}>
                    {status.label}
                </span>
            </div>
        );
    };

    const categories = useMemo(() => {
        const cats = new Set();
        products.forEach((p) => {
            if (p.category) cats.add(p.category);
        });
        return Array.from(cats);
    }, [products]);

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
                if (selectedStockStatus === "low_stock") matchesStockStatus = stockInfo.key === "low_stock";
                else if (selectedStockStatus === "out_of_stock") matchesStockStatus = stockInfo.key === "out_of_stock";
                else if (selectedStockStatus === "in_stock")
                    matchesStockStatus = stockInfo.key === "in_stock" || stockInfo.key === "medium";
            }

            return matchesSearch && matchesCategory && matchesStockStatus;
        });

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

    const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentProducts = filteredAndSortedProducts.slice(startIndex, endIndex);

    const stats = useMemo(() => {
        const total = filteredAndSortedProducts.length;
        const lowStock = filteredAndSortedProducts.filter((p) => p.stock > 0 && p.stock <= p.min_stock).length;
        const outOfStock = filteredAndSortedProducts.filter((p) => p.stock <= 0).length;
        return { total, lowStock, outOfStock };
    }, [filteredAndSortedProducts]);

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
        return <span style={{ ...styles.sortIcon, color: "#C08A1E" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>;
    };

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                {/* Header — ledger stamp */}
                <div style={styles.header}>
                    <div style={styles.headerLeft}>
                        <span style={styles.eyebrow}>Inventory · Register</span>
                        <h1 style={styles.title}>Products</h1>
                        <p style={styles.subtitle}>
                            <span style={styles.subtitleCount}>{products.length}</span> items on the shelf
                        </p>
                    </div>
                    <Link to="/add-product" style={styles.addButton}>
                        + Add product
                    </Link>
                </div>
                <div style={styles.headerRule} />

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

                {/* Stat strip */}
                <div style={styles.statsContainer}>
                    <div style={styles.statCard}>
                        <span style={{ ...styles.statEdge, background: "#C08A1E" }} />
                        <span style={styles.statValue}>{stats.total}</span>
                        <span style={styles.statLabel}>Total products</span>
                    </div>
                    <div style={styles.statCard}>
                        <span style={{ ...styles.statEdge, background: "#A66A00" }} />
                        <span style={{ ...styles.statValue, color: "#A66A00" }}>{stats.lowStock}</span>
                        <span style={styles.statLabel}>Running low</span>
                    </div>
                    <div style={styles.statCard}>
                        <span style={{ ...styles.statEdge, background: "#B3261E" }} />
                        <span style={{ ...styles.statValue, color: "#B3261E" }}>{stats.outOfStock}</span>
                        <span style={styles.statLabel}>Out of stock</span>
                    </div>
                </div>

                {/* Toolbar */}
                <div style={styles.toolbar}>
                    <div style={styles.searchWrapper}>
                        <span style={styles.searchIcon}>⌕</span>
                        <input
                            placeholder="Search by name or scan barcode…"
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

                    <div style={styles.filterWrapper}>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            style={styles.filterSelect}
                        >
                            <option value="all">All categories</option>
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
                            <option value="all">All stock levels</option>
                            <option value="in_stock">Stocked</option>
                            <option value="low_stock">Running low</option>
                            <option value="out_of_stock">Out of stock</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <div style={styles.loadingState}>
                        <div style={styles.spinner}></div>
                        <p style={styles.loadingText}>Loading the register…</p>
                    </div>
                ) : (
                    <>
                        <div style={styles.tableWrapper}>
                            <div style={styles.marginRule} />
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={styles.th} onClick={() => handleSort("product_name")}>
                                            Product {renderSortIcon("product_name")}
                                        </th>
                                        <th style={styles.th} onClick={() => handleSort("category")}>
                                            Category {renderSortIcon("category")}
                                        </th>
                                        <th style={{ ...styles.th, textAlign: "right" }} onClick={() => handleSort("selling_price")}>
                                            Price {renderSortIcon("selling_price")}
                                        </th>
                                        <th style={{ ...styles.th, textAlign: "right" }} onClick={() => handleSort("stock")}>
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
                                                        <div style={styles.noDataTitle}>No matches</div>
                                                        <div style={styles.noDataSub}>Try a different search or filter.</div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div style={styles.noDataTitle}>Nothing on the shelf yet</div>
                                                        <div style={styles.noDataSub}>
                                                            Use <strong>Add product</strong> to start the register.
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ) : (
                                        currentProducts.map((product, idx) => {
                                            const unit = getUnitLabel(product.unit);
                                            const stockInfo = getStockStatusInfo(product.stock, product.min_stock);
                                            const formattedStock = Number(product.stock).toFixed(
                                                Number.isInteger(Number(product.stock)) ? 0 : 2
                                            );

                                            return (
                                                <tr key={product.id} style={idx % 2 === 1 ? styles.tableRowAlt : styles.tableRow}>
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
                                                                    {product.product_name?.[0]?.toUpperCase() || "?"}
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
                                                        <span style={styles.categoryTag}>{product.category || "Other"}</span>
                                                    </td>
                                                    <td style={{ ...styles.td, textAlign: "right" }}>
                                                        <span style={styles.priceValue}>
                                                            ₹{parseFloat(product.selling_price || 0).toFixed(2)}
                                                        </span>
                                                        <span style={styles.priceUnit}>
                                                            /{product.price_per || 1} {String(product.price_unit || "pcs").toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td style={{ ...styles.td, textAlign: "right" }}>
                                                        <div style={styles.stockCell}>
                                                            <div>
                                                                <span style={styles.stockValue}>{formattedStock}</span>
                                                                <span style={styles.stockUnit}> {unit}</span>
                                                            </div>
                                                            <span
                                                                style={{
                                                                    ...styles.stockStamp,
                                                                    color: stockInfo.color,
                                                                    borderColor: stockInfo.ring,
                                                                    background: stockInfo.bg,
                                                                }}
                                                            >
                                                                {stockInfo.label}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td style={styles.td}>{renderExpiryCell(product.expiry_date)}</td>
                                                    <td style={styles.td}>
                                                        <div style={styles.actionButtons}>
                                                            <Link
                                                                to={`/edit-product/${product.id}`}
                                                                style={styles.editButton}
                                                                title="Edit product"
                                                            >
                                                                Edit
                                                            </Link>
                                                            <button
                                                                style={styles.deleteButton}
                                                                onClick={() => deleteProduct(product.id)}
                                                                title="Delete product"
                                                            >
                                                                ✕
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

                        {totalPages > 1 && (
                            <div style={styles.pagination}>
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    style={{ ...styles.pageButton, ...(currentPage === 1 ? styles.pageButtonDisabled : {}) }}
                                >
                                    ← Prev
                                </button>
                                <div style={styles.pageInfo}>
                                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) pageNum = i + 1;
                                        else if (currentPage <= 3) pageNum = i + 1;
                                        else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                        else pageNum = currentPage - 2 + i;
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
                                    {totalPages > 5 && currentPage < totalPages - 2 && <span style={styles.pageEllipsis}>…</span>}
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

                        <div style={styles.footerInfo}>
                            Showing {startIndex + 1}–{Math.min(endIndex, filteredAndSortedProducts.length)} of{" "}
                            {filteredAndSortedProducts.length}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ============================================================
// STYLES — ledger / khata-book direction
// ============================================================
const INK = "#1F2A44";
const INK_SOFT = "#5B6478";
const PAPER = "#F7F4EE";
const RULE = "#DFD9C8";
const GOLD = "#C08A1E";

const styles = {
    page: {
        background: PAPER,
        minHeight: "100%",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: INK,
    },
    container: {
        maxWidth: "1180px",
        margin: "0 auto",
        padding: "40px 24px 64px",
    },

    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: "16px",
        flexWrap: "wrap",
    },
    headerLeft: {
        display: "flex",
        flexDirection: "column",
        gap: "2px",
    },
    eyebrow: {
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "11px",
        letterSpacing: "1.6px",
        textTransform: "uppercase",
        color: GOLD,
        fontWeight: "600",
    },
    title: {
        fontFamily: "'Fraunces', Georgia, serif",
        fontSize: "40px",
        fontWeight: "600",
        color: INK,
        margin: "2px 0 0 0",
        letterSpacing: "-0.5px",
    },
    subtitle: {
        fontSize: "14px",
        color: INK_SOFT,
        margin: "6px 0 0 0",
    },
    subtitleCount: {
        fontFamily: "'IBM Plex Mono', monospace",
        fontWeight: "600",
        color: INK,
    },
    addButton: {
        background: INK,
        color: PAPER,
        textDecoration: "none",
        padding: "13px 24px",
        borderRadius: "3px",
        fontSize: "14px",
        fontWeight: "600",
        whiteSpace: "nowrap",
        letterSpacing: "0.2px",
        transition: "all 0.15s",
    },
    headerRule: {
        height: "3px",
        background: `repeating-linear-gradient(90deg, ${INK} 0, ${INK} 6px, transparent 6px, transparent 10px)`,
        opacity: 0.5,
        margin: "20px 0 28px",
    },

    message: {
        padding: "12px 18px",
        marginBottom: "20px",
        borderRadius: "4px",
        fontSize: "14px",
        fontWeight: "500",
        borderLeft: "3px solid",
    },
    successMessage: {
        background: "#E9F3ED",
        color: "#215838",
        borderLeftColor: "#2F6F4E",
    },
    errorMessage: {
        background: "#FBEAE9",
        color: "#8C1D14",
        borderLeftColor: "#B3261E",
    },

    statsContainer: {
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "1px",
        background: RULE,
        border: `1px solid ${RULE}`,
        borderRadius: "4px",
        overflow: "hidden",
        marginBottom: "28px",
    },
    statCard: {
        position: "relative",
        background: "#FFFFFF",
        padding: "20px 22px 18px",
        display: "flex",
        flexDirection: "column",
        gap: "2px",
    },
    statEdge: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "3px",
    },
    statValue: {
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "30px",
        fontWeight: "600",
        color: INK,
        lineHeight: 1.1,
        fontVariantNumeric: "tabular-nums",
    },
    statLabel: {
        fontSize: "12px",
        color: INK_SOFT,
        fontWeight: "500",
        marginTop: "4px",
    },

    toolbar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "22px",
        gap: "14px",
        flexWrap: "wrap",
    },
    searchWrapper: {
        position: "relative",
        maxWidth: "400px",
        width: "100%",
        flex: 1,
        minWidth: "220px",
    },
    searchIcon: {
        position: "absolute",
        left: "14px",
        top: "50%",
        transform: "translateY(-50%)",
        color: INK_SOFT,
        fontSize: "16px",
    },
    searchBox: {
        width: "100%",
        padding: "11px 40px 11px 38px",
        border: `1px solid ${RULE}`,
        borderRadius: "4px",
        fontSize: "14px",
        backgroundColor: "#FFFFFF",
        boxSizing: "border-box",
        color: INK,
        outline: "none",
    },
    clearButton: {
        position: "absolute",
        right: "10px",
        top: "50%",
        transform: "translateY(-50%)",
        background: "none",
        border: "none",
        color: INK_SOFT,
        cursor: "pointer",
        fontSize: "14px",
        padding: "4px 6px",
    },
    filterWrapper: {
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
    },
    filterSelect: {
        padding: "10px 12px",
        border: `1px solid ${RULE}`,
        borderRadius: "4px",
        fontSize: "13px",
        backgroundColor: "#FFFFFF",
        cursor: "pointer",
        color: INK,
        outline: "none",
        minWidth: "150px",
    },

    tableWrapper: {
        position: "relative",
        overflowX: "auto",
        background: "#FFFFFF",
        border: `1px solid ${RULE}`,
        borderRadius: "4px",
        marginBottom: "18px",
        paddingLeft: "10px",
    },
    marginRule: {
        position: "absolute",
        top: 0,
        bottom: 0,
        left: "10px",
        width: "1px",
        background: "#D9B9B6",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        fontSize: "13.5px",
        minWidth: "760px",
    },
    th: {
        padding: "14px 16px",
        textAlign: "left",
        fontWeight: "600",
        color: INK_SOFT,
        fontSize: "11px",
        textTransform: "uppercase",
        letterSpacing: "0.6px",
        borderBottom: `1px solid ${RULE}`,
        whiteSpace: "nowrap",
        cursor: "pointer",
        userSelect: "none",
    },
    tableRow: {
        borderBottom: `1px solid #EFEBE1`,
    },
    tableRowAlt: {
        borderBottom: `1px solid #EFEBE1`,
        background: "#FBFAF6",
    },
    td: {
        padding: "13px 16px",
        verticalAlign: "middle",
        fontSize: "13.5px",
        color: INK,
    },
    dash: {
        color: "#B7B0A0",
        fontSize: "13px",
    },
    productInfo: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
    },
    productImage: {
        width: "36px",
        height: "36px",
        borderRadius: "4px",
        objectFit: "cover",
        border: `1px solid ${RULE}`,
        flexShrink: 0,
    },
    productImagePlaceholder: {
        width: "36px",
        height: "36px",
        borderRadius: "4px",
        border: `1px solid ${RULE}`,
        background: "#F1EDE1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "14px",
        fontWeight: "700",
        color: GOLD,
        flexShrink: 0,
        fontFamily: "'Fraunces', serif",
    },
    productNameWrapper: {
        display: "flex",
        flexDirection: "column",
    },
    productName: {
        fontWeight: "600",
        color: INK,
        fontSize: "14px",
    },
    productCode: {
        fontSize: "11px",
        color: INK_SOFT,
        fontFamily: "'IBM Plex Mono', monospace",
        marginTop: "1px",
    },
    categoryTag: {
        fontSize: "12px",
        color: INK_SOFT,
        fontWeight: "500",
        borderBottom: `1px dotted ${RULE}`,
        paddingBottom: "1px",
    },
    priceValue: {
        fontFamily: "'IBM Plex Mono', monospace",
        color: INK,
        fontSize: "14px",
        fontWeight: "600",
        fontVariantNumeric: "tabular-nums",
    },
    priceUnit: {
        fontSize: "10px",
        color: INK_SOFT,
        display: "block",
        marginTop: "1px",
    },
    stockCell: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "4px",
    },
    stockValue: {
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "14px",
        fontWeight: "600",
        color: INK,
        fontVariantNumeric: "tabular-nums",
    },
    stockUnit: {
        fontSize: "11px",
        color: INK_SOFT,
    },
    stockStamp: {
        fontSize: "10px",
        fontWeight: "700",
        letterSpacing: "0.5px",
        textTransform: "uppercase",
        padding: "2px 8px",
        borderRadius: "20px",
        border: "1px solid",
    },
    expiryCell: {
        display: "flex",
        flexDirection: "column",
        gap: "2px",
    },
    expiryDate: {
        fontSize: "13px",
        color: INK,
    },
    expiryTag: {
        fontSize: "10px",
        fontWeight: "600",
        padding: "1px 7px",
        borderRadius: "20px",
        width: "fit-content",
    },
    actionButtons: {
        display: "flex",
        gap: "6px",
        alignItems: "center",
    },
    editButton: {
        background: "transparent",
        color: INK,
        padding: "6px 12px",
        textDecoration: "none",
        borderRadius: "3px",
        fontSize: "12px",
        fontWeight: "600",
        border: `1px solid ${RULE}`,
        cursor: "pointer",
        lineHeight: 1,
    },
    deleteButton: {
        background: "transparent",
        color: "#B3261E",
        border: "1px solid #EAC7C4",
        padding: "6px 10px",
        cursor: "pointer",
        borderRadius: "3px",
        fontSize: "12px",
        lineHeight: 1,
    },
    noData: {
        padding: "56px 20px",
        textAlign: "center",
    },
    noDataTitle: {
        fontFamily: "'Fraunces', serif",
        fontSize: "18px",
        color: INK,
        marginBottom: "4px",
    },
    noDataSub: {
        fontSize: "13px",
        color: INK_SOFT,
    },

    pagination: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "10px",
        padding: "8px 0 16px",
        flexWrap: "wrap",
    },
    pageButton: {
        padding: "8px 16px",
        background: "#FFFFFF",
        border: `1px solid ${RULE}`,
        borderRadius: "3px",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: "500",
        color: INK,
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
        padding: "6px 11px",
        borderRadius: "3px",
        border: "none",
        background: "transparent",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: "500",
        color: INK_SOFT,
        fontFamily: "'IBM Plex Mono', monospace",
        minWidth: "30px",
        textAlign: "center",
    },
    pageNumberActive: {
        background: INK,
        color: PAPER,
    },
    pageEllipsis: {
        color: INK_SOFT,
        padding: "0 4px",
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
        width: "36px",
        height: "36px",
        border: `3px solid ${RULE}`,
        borderTop: `3px solid ${GOLD}`,
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
    },
    loadingText: {
        color: INK_SOFT,
        fontSize: "14px",
    },

    footerInfo: {
        textAlign: "center",
        fontSize: "12px",
        color: INK_SOFT,
        fontFamily: "'IBM Plex Mono', monospace",
        padding: "4px 0 8px",
    },

    sortIcon: {
        marginLeft: "4px",
        fontSize: "11px",
        color: "#B7B0A0",
        display: "inline-block",
    },
};

// Inject fonts, keyframes and interaction states
if (typeof document !== "undefined" && !document.getElementById("products-page-styles")) {
    const styleSheet = document.createElement("style");
    styleSheet.id = "products-page-styles";
    styleSheet.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        th:hover { color: ${INK} !important; }
        .search-box:focus { border-color: ${GOLD} !important; box-shadow: 0 0 0 3px rgba(192,138,30,0.12) !important; }
        .filter-select:focus { border-color: ${GOLD} !important; }
        a[href="/add-product"]:hover { background: #33456B !important; }
        .page-button:hover:not(:disabled) { border-color: ${GOLD} !important; }
        tr:hover td { background: #FBF4E4 !important; }
    `;
    document.head.appendChild(styleSheet);
}