import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

export default function Products() {
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedStockStatus, setSelectedStockStatus] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState("product_name");
    const [sortDirection, setSortDirection] = useState("asc");
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [barcodeInput, setBarcodeInput] = useState("");
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
            const res = await API.get("/products");
            setProducts(res.data.data || []);
            setMessage("");
        } catch (err) {
            console.error("Error loading products:", err);
            setMessage(err.response?.data?.message || "Couldn't load products");
            setMessageType("error");
        } finally {
            setLoading(false);
        }
    };

    const deleteProduct = async (id) => {
        if (!window.confirm("Remove this product from inventory?")) return;

        try {
            await API.delete(`/products/${id}`);
            
            setProducts((prevProducts) =>
                prevProducts.filter((product) => product.id !== id)
            );

            setMessage("Product removed successfully");
            setMessageType("success");

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

    const viewProductDetails = async (id) => {
        try {
            const res = await API.get(`/products/${id}`);
            setSelectedProduct(res.data.data);
            setShowDetailsModal(true);
        } catch (err) {
            console.error("Error fetching product details:", err);
            setMessage("Couldn't load product details");
            setMessageType("error");
        }
    };

    const closeDetailsModal = () => {
        setShowDetailsModal(false);
        setSelectedProduct(null);
    };

    // ─── BARCODE SEARCH ─────────────────────────────────────
    const handleBarcodeSearch = async () => {
        if (!barcodeInput.trim()) return;

        try {
            const res = await API.get(`/products/barcode/${barcodeInput.trim()}`);
            
            if (res.data.data) {
                const product = res.data.data;
                setSearch(product.product_name || product.product_code || "");
                setBarcodeInput("");
                setMessage(`Found: ${product.product_name}`);
                setMessageType("success");
                
                setTimeout(() => {
                    setMessage("");
                    setMessageType("");
                }, 3000);
            }
        } catch (err) {
            console.error("Error searching by barcode:", err);
            setMessage("Product not found by barcode");
            setMessageType("error");
            setTimeout(() => {
                setMessage("");
                setMessageType("");
            }, 3000);
        }
    };

    const getUnitLabel = (unit) => String(unit || "pcs").toUpperCase();

    // ─── Stock status ─────────────────────────────────────────
    const getStockStatusInfo = (stock, minStock) => {
        const ratio = minStock > 0 ? stock / minStock : Infinity;
        if (stock <= 0) return { key: "out_of_stock", label: "Out", color: "#D6482B", bg: "#FBE7E0", ring: "#F0BDA9" };
        if (stock <= minStock) return { key: "low_stock", label: "Low", color: "#C97A12", bg: "#FCF0DA", ring: "#F0D49B" };
        if (ratio <= 3) return { key: "medium", label: "OK", color: "#2A6E8C", bg: "#E4F0F5", ring: "#B7D4E2" };
        return { key: "in_stock", label: "Stocked", color: "#2F8F5B", bg: "#E4F5EC", ring: "#B3DEC5" };
    };

    // ─── Expiry (display only) ─────────────────────────────────
    const getExpiryStatus = (expiryDate) => {
        if (!expiryDate) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(expiryDate);
        expiry.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { label: "Expired", color: "#D6482B", bg: "#FBE7E0" };
        if (diffDays <= 7) return { label: "This week", color: "#C97A12", bg: "#FCF0DA" };
        if (diffDays <= 30) return { label: "This month", color: "#9C7A00", bg: "#FBF3D6" };
        return { label: "Fine", color: "#2F8F5B", bg: "#E4F5EC" };
    };

    const renderExpiryCell = (expiryDate) => {
        if (!expiryDate) return <span style={styles.dash}>—</span>;
        const status = getExpiryStatus(expiryDate);
        return (
        <div style={styles.page}>
            <div style={styles.shell}>
                {/* Top command bar */}
                <header className="products-trading-topbar" style={styles.topbar}>
                    <div style={styles.brandBlock}>
                        <div style={styles.brandMark}>P</div>
                        <div>
                            <div style={styles.eyebrow}>INVENTORY CONTROL</div>
                            <h1 style={styles.title}>Products</h1>
                        </div>
                    </div>

                    <div className="products-trading-actions" style={styles.topActions}>
                        <div style={styles.livePill}>
                            <span style={styles.liveDot} />
                            Live inventory
                        </div>
                        <Link to="/add-product" style={styles.primaryButton}>
                            <span style={styles.primaryPlus}>+</span>
                            Add product
                        </Link>
                    </div>
                </header>

                {message && (
                    <div
                        style={{
                            ...styles.alert,
                            ...(messageType === "success" ? styles.successAlert : styles.errorAlert),
                        }}
                    >
                        <span>{message}</span>
                        <button style={styles.alertClose} onClick={() => setMessage("")}>×</button>
                    </div>
                )}

                {/* Inventory overview */}
                <section className="products-trading-metrics" style={styles.overviewGrid}>
                    <div style={{ ...styles.metricCard, ...styles.metricPrimary }}>
                        <div style={styles.metricTop}>
                            <span style={styles.metricLabel}>TOTAL PRODUCTS</span>
                            <span style={styles.metricIcon}>◈</span>
                        </div>
                        <div style={styles.metricValue}>{stats.total}</div>
                        <div style={styles.metricFoot}>Items currently in inventory</div>
                    </div>

                    <div style={styles.metricCard}>
                        <div style={styles.metricTop}>
                            <span style={styles.metricLabel}>LOW STOCK</span>
                            <span style={styles.metricIconWarning}>!</span>
                        </div>
                        <div style={{ ...styles.metricValue, color: "#F59E0B" }}>{stats.lowStock}</div>
                        <div style={styles.metricFoot}>Need attention soon</div>
                    </div>

                    <div style={styles.metricCard}>
                        <div style={styles.metricTop}>
                            <span style={styles.metricLabel}>OUT OF STOCK</span>
                            <span style={styles.metricIconDanger}>×</span>
                        </div>
                        <div style={{ ...styles.metricValue, color: "#EF4444" }}>{stats.outOfStock}</div>
                        <div style={styles.metricFoot}>Unavailable for billing</div>
                    </div>

                    <div style={{ ...styles.metricCard, ...styles.metricActionCard }}>
                        <div style={styles.metricTop}>
                            <span style={styles.metricLabel}>QUICK ACTION</span>
                            <span style={styles.metricIconBlue}>⌕</span>
                        </div>
                        <button
                            style={styles.scanQuickButton}
                            onClick={() => document.getElementById("inventory-barcode-input")?.focus()}
                        >
                            Scan barcode →
                        </button>
                        <div style={styles.metricFoot}>Find a product instantly</div>
                    </div>
                </section>

                {/* Main workspace */}
                <section style={styles.workspace}>
                    <div style={styles.workspaceHeader}>
                        <div>
                            <div style={styles.sectionKicker}>INVENTORY WORKSPACE</div>
                            <h2 style={styles.sectionTitle}>Your product book</h2>
                            <p style={styles.sectionSub}>
                                Search, scan, filter and manage your stock from one place.
                            </p>
                        </div>
                        <div style={styles.resultBadge}>
                            {filteredAndSortedProducts.length} shown
                        </div>
                    </div>

                    {/* Search / filter command row */}
                    <div className="products-trading-command" style={styles.commandRow}>
                        <div style={styles.searchBoxWrap}>
                            <span style={styles.searchGlyph}>⌕</span>
                            <input
                                type="search"
                                placeholder="Search product, code or barcode..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                autoComplete="off"
                                aria-label="Search products"
                                style={styles.searchInput}
                            />
                            {search && (
                                <button style={styles.inputClear} onClick={() => setSearch("")}>×</button>
                            )}
                        </div>

                        <div style={styles.scanWrap}>
                            <span style={styles.scanGlyph}>▣</span>
                            <input
                                id="inventory-barcode-input"
                                placeholder="Scan barcode"
                                value={barcodeInput}
                                onChange={(e) => setBarcodeInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleBarcodeSearch();
                                }}
                                autoComplete="off"
                                style={styles.scanInput}
                            />
                            <button style={styles.scanButton} onClick={handleBarcodeSearch}>Scan</button>
                        </div>

                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            style={styles.select}
                        >
                            <option value="all">All categories</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>

                        <select
                            value={selectedStockStatus}
                            onChange={(e) => setSelectedStockStatus(e.target.value)}
                            style={styles.select}
                        >
                            <option value="all">All stock</option>
                            <option value="in_stock">In stock</option>
                            <option value="low_stock">Low stock</option>
                            <option value="out_of_stock">Out of stock</option>
                        </select>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div style={styles.loadingState}>
                            <div style={styles.spinner} />
                            <div style={styles.loadingTitle}>Loading inventory</div>
                            <div style={styles.loadingText}>Syncing your product book...</div>
                        </div>
                    ) : (
                        <>
                            <div style={styles.tableScroll}>
                                <table style={styles.table}>
                                    <thead>
                                        <tr>
                                            <th style={styles.th} onClick={() => handleSort("product_name")}>
                                                Product {renderSortIcon("product_name")}
                                            </th>
                                            <th style={styles.th} onClick={() => handleSort("category")}>
                                                Category {renderSortIcon("category")}
                                            </th>
                                            <th style={styles.th} onClick={() => handleSort("selling_price")}>
                                                Selling price {renderSortIcon("selling_price")}
                                            </th>
                                            <th style={{ ...styles.th, textAlign: "right" }} onClick={() => handleSort("stock")}>
                                                Stock {renderSortIcon("stock")}
                                            </th>
                                            <th style={styles.th} onClick={() => handleSort("expiry_date")}>
                                                Expiry {renderSortIcon("expiry_date")}
                                            </th>
                                            <th style={styles.th} onClick={() => handleSort("status")}>
                                                Status {renderSortIcon("status")}
                                            </th>
                                            <th style={{ ...styles.th, textAlign: "right" }}>Actions</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {currentProducts.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" style={styles.emptyCell}>
                                                    <div style={styles.emptyIcon}>⌕</div>
                                                    <div style={styles.emptyTitle}>
                                                        {search || selectedCategory !== "all" || selectedStockStatus !== "all"
                                                            ? "No products match your filters"
                                                            : "No products yet"}
                                                    </div>
                                                    <div style={styles.emptyText}>
                                                        {search || selectedCategory !== "all" || selectedStockStatus !== "all"
                                                            ? "Try another search or change the filters."
                                                            : "Add your first product to start managing inventory."}
                                                    </div>
                                                    {!search && selectedCategory === "all" && selectedStockStatus === "all" && (
                                                        <Link to="/add-product" style={styles.emptyButton}>+ Add product</Link>
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
                                                    <tr key={product.id} style={idx % 2 ? styles.rowAlt : styles.row}>
                                                        <td style={styles.td}>
                                                            <div style={styles.productCell}>
                                                                {product.image ? (
                                                                    <img
                                                                        src={product.image}
                                                                        alt={product.product_name}
                                                                        style={styles.productAvatar}
                                                                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                                                                    />
                                                                ) : (
                                                                    <div style={styles.productAvatarFallback}>
                                                                        {product.product_name?.[0]?.toUpperCase() || "P"}
                                                                    </div>
                                                                )}
                                                                <div style={styles.productText}>
                                                                    <div style={styles.productName}>{product.product_name}</div>
                                                                    <div style={styles.productMeta}>
                                                                        {product.product_code || "No product code"}
                                                                    </div>
                                                                    {product.barcode && (
                                                                        <div style={styles.barcodeMeta}>⌁ {product.barcode}</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td style={styles.td}>
                                                            <span style={styles.categoryBadge}>
                                                                {product.category || "Other"}
                                                            </span>
                                                        </td>

                                                        <td style={styles.td}>
                                                            <div style={styles.priceBlock}>
                                                                <strong>₹{parseFloat(product.selling_price || 0).toFixed(2)}</strong>
                                                                <span>/{product.price_per || 1} {String(product.price_unit || "pcs").toUpperCase()}</span>
                                                            </div>
                                                            {product.purchase_price > 0 && (
                                                                <div style={styles.costText}>
                                                                    Cost ₹{parseFloat(product.purchase_price).toFixed(2)}
                                                                </div>
                                                            )}
                                                        </td>

                                                        <td style={{ ...styles.td, textAlign: "right" }}>
                                                            <div style={styles.stockBlock}>
                                                                <strong>{formattedStock}</strong>
                                                                <span>{unit}</span>
                                                                <em style={{
                                                                    ...styles.stockBadge,
                                                                    color: stockInfo.color,
                                                                    background: stockInfo.bg,
                                                                    borderColor: stockInfo.ring,
                                                                }}>
                                                                    {stockInfo.label}
                                                                </em>
                                                            </div>
                                                        </td>

                                                        <td style={styles.td}>{renderExpiryCell(product.expiry_date)}</td>

                                                        <td style={styles.td}>{getStatusBadge(product.status)}</td>

                                                        <td style={styles.td}>
                                                            <div style={styles.actionGroup}>
                                                                <button
                                                                    style={styles.viewButton}
                                                                    onClick={() => viewProductDetails(product.id)}
                                                                >
                                                                    View
                                                                </button>
                                                                <Link
                                                                    to={`/edit-product/${product.id}`}
                                                                    style={styles.editButton}
                                                                >
                                                                    Edit
                                                                </Link>
                                                                <button
                                                                    style={styles.deleteButton}
                                                                    onClick={() => deleteProduct(product.id)}
                                                                    title="Delete product"
                                                                >
                                                                    ×
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
                                        style={{ ...styles.pageButton, ...(currentPage === 1 ? styles.pageDisabled : {}) }}
                                    >
                                        ← Previous
                                    </button>

                                    <div style={styles.pageNumbers}>
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
                                    </div>

                                    <button
                                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        style={{ ...styles.pageButton, ...(currentPage === totalPages ? styles.pageDisabled : {}) }}
                                    >
                                        Next →
                                    </button>
                                </div>
                            )}

                            <div style={styles.tableFooter}>
                                Showing {filteredAndSortedProducts.length === 0 ? 0 : startIndex + 1}–
                                {Math.min(endIndex, filteredAndSortedProducts.length)} of {filteredAndSortedProducts.length}
                            </div>
                        </>
                    )}
                </section>
            </div>

            {/* Product details */}
            {showDetailsModal && selectedProduct && (
                <div style={styles.modalOverlay} onClick={closeDetailsModal}>
                    <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalTop}>
                            <div>
                                <div style={styles.sectionKicker}>PRODUCT PROFILE</div>
                                <h2 style={styles.modalTitle}>{selectedProduct.product_name}</h2>
                            </div>
                            <button style={styles.modalX} onClick={closeDetailsModal}>×</button>
                        </div>

                        <div style={styles.detailHero}>
                            {selectedProduct.image ? (
                                <img
                                    src={selectedProduct.image}
                                    alt={selectedProduct.product_name}
                                    style={styles.detailAvatar}
                                />
                            ) : (
                                <div style={styles.detailAvatarFallback}>
                                    {selectedProduct.product_name?.[0]?.toUpperCase() || "P"}
                                </div>
                            )}
                            <div style={styles.detailHeroText}>
                                <div style={styles.detailCategory}>{selectedProduct.category || "Other"}</div>
                                <div style={styles.detailCode}>
                                    {selectedProduct.product_code || "No product code"}
                                </div>
                                {selectedProduct.barcode && (
                                    <div style={styles.detailCode}>Barcode: {selectedProduct.barcode}</div>
                                )}
                                <div style={styles.detailStatusLine}>
                                    {getStatusBadge(selectedProduct.status)}
                                </div>
                            </div>
                        </div>

                        <div style={styles.detailCards}>
                            <div style={styles.detailCard}>
                                <span>SELLING PRICE</span>
                                <strong>₹{parseFloat(selectedProduct.selling_price || 0).toFixed(2)}</strong>
                                <small>{selectedProduct.price_per || 1} {getUnitLabel(selectedProduct.price_unit)}</small>
                            </div>
                            <div style={styles.detailCard}>
                                <span>PURCHASE PRICE</span>
                                <strong>₹{parseFloat(selectedProduct.purchase_price || 0).toFixed(2)}</strong>
                                <small>Cost price</small>
                            </div>
                            <div style={styles.detailCard}>
                                <span>CURRENT STOCK</span>
                                <strong>
                                    {Number(selectedProduct.stock).toFixed(
                                        Number.isInteger(Number(selectedProduct.stock)) ? 0 : 2
                                    )}
                                </strong>
                                <small>{getUnitLabel(selectedProduct.unit)}</small>
                            </div>
                            <div style={styles.detailCard}>
                                <span>MINIMUM STOCK</span>
                                <strong>{selectedProduct.min_stock || 0}</strong>
                                <small>Reorder level</small>
                            </div>
                        </div>

                        <div className="products-trading-details" style={styles.detailSections}>
                            <div style={styles.infoPanel}>
                                <div style={styles.infoPanelTitle}>Stock status</div>
                                <div style={styles.infoRow}>
                                    <span>Availability</span>
                                    <strong style={{
                                        color: getStockStatusInfo(selectedProduct.stock, selectedProduct.min_stock).color
                                    }}>
                                        {getStockStatusInfo(selectedProduct.stock, selectedProduct.min_stock).label}
                                    </strong>
                                </div>
                                <div style={styles.infoRow}>
                                    <span>Unit</span>
                                    <strong>{getUnitLabel(selectedProduct.unit)}</strong>
                                </div>
                                {selectedProduct.expiry_date && (
                                    <div style={styles.infoRow}>
                                        <span>Expiry</span>
                                        <strong>{new Date(selectedProduct.expiry_date).toLocaleDateString("en-IN")}</strong>
                                    </div>
                                )}
                            </div>

                            <div style={styles.infoPanel}>
                                <div style={styles.infoPanelTitle}>Additional information</div>
                                {selectedProduct.tax > 0 && (
                                    <div style={styles.infoRow}>
                                        <span>Tax rate</span>
                                        <strong>{selectedProduct.tax}%</strong>
                                    </div>
                                )}
                                {selectedProduct.description && (
                                    <div style={styles.infoRow}>
                                        <span>Description</span>
                                        <strong style={{ maxWidth: "65%", textAlign: "right" }}>
                                            {selectedProduct.description}
                                        </strong>
                                    </div>
                                )}
                                {selectedProduct.id && (
                                    <div style={styles.infoRow}>
                                        <span>Product ID</span>
                                        <strong>#{selectedProduct.id}</strong>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={styles.modalFooter}>
                            <Link
                                to={`/edit-product/${selectedProduct.id}`}
                                style={styles.modalEdit}
                                onClick={closeDetailsModal}
                            >
                                Edit product
                            </Link>
                            <button style={styles.modalCloseButton} onClick={closeDetailsModal}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const NAVY = "#0B1020";
const NAVY2 = "#121A2D";
const LIME = "#C8FF00";
const BLUE = "#4F7CFF";
const BG = "#F5F7FB";
const CARD = "#FFFFFF";
const TEXT = "#111827";
const MUTED = "#718096";
const BORDER = "#E5E9F2";
const GREEN = "#16A06A";
const RED = "#EF4444";

const styles = {
    page: {
        minHeight: "100vh",
        background: BG,
        color: TEXT,
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
    shell: {
        maxWidth: "1440px",
        margin: "0 auto",
        padding: "28px 28px 60px",
    },
    topbar: {
        background: NAVY,
        borderRadius: "20px",
        padding: "18px 22px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "20px",
        boxShadow: "0 18px 45px rgba(11,16,32,.16)",
        marginBottom: "20px",
    },
    brandBlock: {
        display: "flex",
        alignItems: "center",
        gap: "13px",
    },
    brandMark: {
        width: "44px",
        height: "44px",
        borderRadius: "13px",
        background: LIME,
        color: NAVY,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "20px",
        fontWeight: 900,
        boxShadow: "0 0 28px rgba(200,255,0,.22)",
    },
    eyebrow: {
        color: "#8D98B2",
        fontSize: "10px",
        letterSpacing: "1.8px",
        fontWeight: 800,
    },
    title: {
        color: "#FFFFFF",
        fontSize: "25px",
        margin: "2px 0 0",
        letterSpacing: "-.5px",
    },
    topActions: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
    },
    livePill: {
        color: "#C7D0E4",
        border: "1px solid #2A344C",
        background: "#151D31",
        padding: "10px 13px",
        borderRadius: "11px",
        fontSize: "12px",
        fontWeight: 700,
    },
    liveDot: {
        display: "inline-block",
        width: "7px",
        height: "7px",
        borderRadius: "50%",
        background: "#2DD4BF",
        marginRight: "7px",
        boxShadow: "0 0 0 4px rgba(45,212,191,.10)",
    },
    primaryButton: {
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        background: LIME,
        color: NAVY,
        textDecoration: "none",
        padding: "11px 16px",
        borderRadius: "11px",
        fontSize: "13px",
        fontWeight: 900,
        boxShadow: "0 8px 22px rgba(200,255,0,.14)",
    },
    primaryPlus: { fontSize: "20px", lineHeight: .8 },
    alert: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 15px",
        borderRadius: "12px",
        marginBottom: "18px",
        fontSize: "13px",
        fontWeight: 700,
    },
    successAlert: { background: "#E8F8F1", color: "#08764C", border: "1px solid #BCEBD7" },
    errorAlert: { background: "#FFF0F0", color: "#B42318", border: "1px solid #F8CACA" },
    alertClose: { border: 0, background: "transparent", fontSize: "20px", cursor: "pointer", color: "inherit" },

    overviewGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: "14px",
        marginBottom: "18px",
    },
    metricCard: {
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: "17px",
        padding: "18px",
        minHeight: "125px",
        boxShadow: "0 7px 24px rgba(22,35,64,.045)",
    },
    metricPrimary: {
        background: "linear-gradient(145deg,#11192C,#19243B)",
        borderColor: "#1F2A42",
        color: "#FFFFFF",
    },
    metricActionCard: { background: "#F8FAFF" },
    metricTop: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "12px",
    },
    metricLabel: { fontSize: "10px", letterSpacing: "1.1px", fontWeight: 900, color: "#8791A8" },
    metricIcon: { color: LIME, fontSize: "16px" },
    metricIconWarning: { color: "#F59E0B", fontWeight: 900, fontSize: "17px" },
    metricIconDanger: { color: "#EF4444", fontWeight: 900, fontSize: "17px" },
    metricIconBlue: { color: BLUE, fontWeight: 900, fontSize: "17px" },
    metricValue: { fontSize: "30px", lineHeight: 1, fontWeight: 900, letterSpacing: "-1px", color: TEXT },
    metricFoot: { marginTop: "10px", color: "#929CAF", fontSize: "11px" },
    scanQuickButton: {
        border: 0,
        background: "transparent",
        padding: 0,
        fontSize: "17px",
        fontWeight: 900,
        color: "#1D4ED8",
        cursor: "pointer",
    },

    workspace: {
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: "20px",
        boxShadow: "0 10px 35px rgba(22,35,64,.055)",
        overflow: "hidden",
    },
    workspaceHeader: {
        padding: "23px 24px 18px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: "15px",
    },
    sectionKicker: { color: "#6B77FF", fontSize: "10px", fontWeight: 900, letterSpacing: "1.7px" },
    sectionTitle: { fontSize: "22px", margin: "4px 0 3px", letterSpacing: "-.4px" },
    sectionSub: { color: MUTED, fontSize: "12px", margin: 0 },
    resultBadge: {
        background: "#F0F3FA",
        color: "#59657D",
        borderRadius: "9px",
        padding: "8px 11px",
        fontSize: "11px",
        fontWeight: 800,
        whiteSpace: "nowrap",
    },

    commandRow: {
        margin: "0 20px 18px",
        padding: "10px",
        borderRadius: "14px",
        background: "#F5F7FB",
        border: "1px solid #E7EBF3",
        display: "grid",
        gridTemplateColumns: "minmax(240px,1.6fr) minmax(210px,1fr) 160px 150px",
        gap: "8px",
    },
    searchBoxWrap: { position: "relative", minWidth: 0 },
    searchGlyph: { position: "absolute", left: "13px", top: "10px", color: "#8792A9", fontSize: "17px" },
    searchInput: {
        width: "100%",
        boxSizing: "border-box",
        border: "1px solid #E0E5EF",
        background: "#FFFFFF",
        borderRadius: "10px",
        padding: "10px 34px 10px 35px",
        outline: "none",
        fontSize: "13px",
        color: TEXT,
    },
    inputClear: {
        position: "absolute", right: "7px", top: "6px", border: 0,
        background: "#EEF1F6", color: "#657089", borderRadius: "7px",
        width: "27px", height: "27px", cursor: "pointer", fontSize: "17px",
    },
    scanWrap: { display: "flex", alignItems: "center", gap: "5px", minWidth: 0 },
    scanGlyph: { color: BLUE, fontSize: "14px", marginLeft: "4px" },
    scanInput: {
        width: "100%", minWidth: 0, border: "1px solid #E0E5EF",
        background: "#FFFFFF", borderRadius: "10px", padding: "10px 9px",
        outline: "none", fontSize: "12px", fontFamily: "monospace",
    },
    scanButton: {
        border: 0, background: NAVY, color: "#FFFFFF", borderRadius: "9px",
        padding: "10px 13px", fontWeight: 800, cursor: "pointer", fontSize: "12px",
    },
    select: {
        width: "100%", border: "1px solid #E0E5EF", background: "#FFFFFF",
        borderRadius: "10px", padding: "10px 9px", outline: "none",
        color: "#3C465B", fontSize: "12px", fontWeight: 700,
    },

    tableScroll: { overflowX: "auto" },
    table: { width: "100%", minWidth: "1040px", borderCollapse: "collapse" },
    th: {
        padding: "12px 18px",
        background: "#FAFBFD",
        borderTop: "1px solid #EEF1F6",
        borderBottom: "1px solid #E9EDF4",
        textAlign: "left",
        color: "#7A8498",
        fontSize: "10px",
        textTransform: "uppercase",
        letterSpacing: ".9px",
        fontWeight: 900,
        cursor: "pointer",
        whiteSpace: "nowrap",
    },
    row: { borderBottom: "1px solid #EEF1F5", background: "#FFFFFF" },
    rowAlt: { borderBottom: "1px solid #EEF1F5", background: "#FCFDFE" },
    td: { padding: "13px 18px", verticalAlign: "middle", fontSize: "12px" },
    productCell: { display: "flex", alignItems: "center", gap: "11px", minWidth: "250px" },
    productAvatar: { width: "40px", height: "40px", objectFit: "cover", borderRadius: "11px", border: "1px solid #E4E8F0" },
    productAvatarFallback: {
        width: "40px", height: "40px", borderRadius: "11px",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "#EEF2FF", color: "#4F46E5", fontWeight: 900, fontSize: "14px",
    },
    productText: { minWidth: 0 },
    productName: { fontSize: "13px", fontWeight: 900, color: "#172033", marginBottom: "3px" },
    productMeta: { fontSize: "10px", color: "#8A94A8", fontFamily: "monospace" },
    barcodeMeta: { fontSize: "9px", color: "#A0A9B8", fontFamily: "monospace", marginTop: "2px" },
    categoryBadge: {
        display: "inline-block", background: "#F1F4F8", color: "#566176",
        padding: "5px 9px", borderRadius: "8px", fontSize: "10px", fontWeight: 800,
    },
    priceBlock: { display: "flex", alignItems: "baseline", gap: "5px", whiteSpace: "nowrap" },
    priceBlockStrong: {},
    costText: { color: "#A0A8B8", fontSize: "9px", marginTop: "4px" },
    stockBlock: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" },
    stockBlockStrong: {},
    stockBadge: {
        border: "1px solid", borderRadius: "999px", padding: "3px 7px",
        fontStyle: "normal", fontSize: "9px", fontWeight: 900,
    },
    expiryCell: { display: "flex", flexDirection: "column", gap: "4px" },
    expiryDate: { color: "#344054", fontSize: "11px", whiteSpace: "nowrap" },
    expiryTag: { width: "fit-content", padding: "2px 6px", borderRadius: "999px", fontSize: "9px", fontWeight: 900 },
    statusBadgeActive: {
        display: "inline-block", background: "#E9F9F2", color: GREEN,
        padding: "5px 9px", borderRadius: "999px", fontSize: "10px", fontWeight: 900,
    },
    statusBadgeInactive: {
        display: "inline-block", background: "#FFF0F0", color: RED,
        padding: "5px 9px", borderRadius: "999px", fontSize: "10px", fontWeight: 900,
    },
    actionGroup: { display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "5px" },
    viewButton: {
        border: 0, background: NAVY, color: "#FFFFFF", padding: "7px 10px",
        borderRadius: "8px", fontSize: "10px", fontWeight: 800, cursor: "pointer",
    },
    editButton: {
        textDecoration: "none", background: "#EEF3FF", color: "#3159C8",
        padding: "7px 10px", borderRadius: "8px", fontSize: "10px", fontWeight: 800,
    },
    deleteButton: {
        border: 0, background: "#FFF0F0", color: RED, width: "29px", height: "29px",
        borderRadius: "8px", cursor: "pointer", fontSize: "18px", lineHeight: 1,
    },
    emptyCell: { padding: "70px 20px", textAlign: "center" },
    emptyIcon: {
        width: "46px", height: "46px", margin: "0 auto 12px", borderRadius: "14px",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "#F1F4FA", color: "#8A94A8", fontSize: "22px",
    },
    emptyTitle: { fontWeight: 900, fontSize: "16px", marginBottom: "4px" },
    emptyText: { color: MUTED, fontSize: "12px", marginBottom: "15px" },
    emptyButton: {
        display: "inline-block", textDecoration: "none", background: NAVY, color: "#FFFFFF",
        padding: "9px 14px", borderRadius: "9px", fontSize: "12px", fontWeight: 800,
    },

    pagination: {
        display: "flex", justifyContent: "center", alignItems: "center",
        gap: "12px", padding: "18px 20px 8px",
    },
    pageButton: {
        border: "1px solid #E1E6EF", background: "#FFFFFF", color: "#3F4A61",
        padding: "8px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "11px", fontWeight: 800,
    },
    pageDisabled: { opacity: .4, cursor: "not-allowed" },
    pageNumbers: { display: "flex", gap: "4px" },
    pageNumber: {
        border: 0, background: "transparent", width: "30px", height: "30px",
        borderRadius: "8px", cursor: "pointer", color: "#6D778C", fontWeight: 800, fontSize: "11px",
    },
    pageNumberActive: { background: NAVY, color: "#FFFFFF" },
    tableFooter: {
        textAlign: "center", color: "#99A2B2", fontSize: "10px",
        padding: "8px 20px 18px", fontFamily: "monospace",
    },

    loadingState: { padding: "90px 20px", textAlign: "center" },
    spinner: {
        width: "34px", height: "34px", border: "3px solid #E9EDF4",
        borderTopColor: BLUE, borderRadius: "50%", margin: "0 auto 12px",
        animation: "productsSpin .7s linear infinite",
    },
    loadingTitle: { fontWeight: 900, fontSize: "14px" },
    loadingText: { color: MUTED, fontSize: "11px", marginTop: "4px" },

    modalOverlay: {
        position: "fixed", inset: 0, background: "rgba(5,10,22,.68)",
        backdropFilter: "blur(8px)", zIndex: 1000, display: "flex",
        alignItems: "center", justifyContent: "center", padding: "20px",
    },
    modal: {
        width: "100%", maxWidth: "920px", maxHeight: "92vh", overflowY: "auto",
        background: "#F7F9FC", borderRadius: "22px", boxShadow: "0 30px 90px rgba(0,0,0,.35)",
    },
    modalTop: {
        background: NAVY, color: "#FFFFFF", padding: "21px 24px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        borderTopLeftRadius: "22px", borderTopRightRadius: "22px",
    },
    modalTitle: { fontSize: "23px", margin: "4px 0 0", letterSpacing: "-.4px" },
    modalX: {
        width: "35px", height: "35px", border: "1px solid #34405B",
        borderRadius: "10px", background: "#171F34", color: "#FFFFFF",
        cursor: "pointer", fontSize: "21px",
    },
    detailHero: {
        margin: "18px 20px 0", background: "#FFFFFF", border: `1px solid ${BORDER}`,
        borderRadius: "16px", padding: "18px", display: "flex", gap: "15px", alignItems: "center",
    },
    detailAvatar: { width: "72px", height: "72px", objectFit: "cover", borderRadius: "16px" },
    detailAvatarFallback: {
        width: "72px", height: "72px", borderRadius: "16px", background: "#EEF2FF",
        color: "#4F46E5", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "24px", fontWeight: 900,
    },
    detailHeroText: { display: "flex", flexDirection: "column", gap: "6px" },
    detailCategory: {
        width: "fit-content", background: "#EEF2FF", color: "#4359C7",
        borderRadius: "8px", padding: "4px 8px", fontSize: "10px", fontWeight: 900,
    },
    detailCode: { color: "#7B869A", fontSize: "11px", fontFamily: "monospace" },
    detailStatusLine: { marginTop: "2px" },
    detailCards: {
        display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "10px",
        padding: "12px 20px",
    },
    detailCard: {
        background: "#FFFFFF", border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "14px",
    },
    detailCardSpan: {},
    detailCardStrong: {},
    detailSections: {
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", padding: "0 20px 18px",
    },
    infoPanel: {
        background: "#FFFFFF", border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "15px",
    },
    infoPanelTitle: {
        color: "#67728A", fontSize: "10px", fontWeight: 900, letterSpacing: "1px",
        textTransform: "uppercase", paddingBottom: "10px", borderBottom: "1px solid #EEF1F5",
        marginBottom: "5px",
    },
    infoRow: {
        display: "flex", justifyContent: "space-between", gap: "12px",
        padding: "9px 0", borderBottom: "1px solid #F1F3F7", fontSize: "11px",
        color: "#7B8497",
    },
    modalFooter: {
        padding: "15px 20px", borderTop: "1px solid #E7EBF1",
        display: "flex", justifyContent: "flex-end", gap: "8px",
    },
    modalEdit: {
        textDecoration: "none", background: LIME, color: NAVY,
        padding: "10px 15px", borderRadius: "9px", fontSize: "12px", fontWeight: 900,
    },
    modalCloseButton: {
        border: "1px solid #DCE1EA", background: "#FFFFFF", color: "#4C566B",
        padding: "10px 15px", borderRadius: "9px", fontSize: "12px", fontWeight: 800, cursor: "pointer",
    },
};

if (typeof document !== "undefined" && !document.getElementById("products-trading-styles")) {
    const styleSheet = document.createElement("style");
    styleSheet.id = "products-trading-styles";
    styleSheet.textContent = `
        @keyframes productsSpin {
            to { transform: rotate(360deg); }
        }
        @media (max-width: 1050px) {
            .products-trading-command { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 900px) {
            .products-trading-metrics { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 700px) {
            .products-trading-topbar { flex-direction: column !important; align-items: flex-start !important; }
            .products-trading-actions { width: 100% !important; justify-content: space-between !important; }
            .products-trading-metrics { grid-template-columns: 1fr !important; }
            .products-trading-details { grid-template-columns: 1fr !important; }
        }
    `;
    document.head.appendChild(styleSheet);
}

}
