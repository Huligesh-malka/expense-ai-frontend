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

    const viewProductDetails = async (id) => {
        try {
            const businessId = localStorage.getItem("businessId");
            const res = await API.get(`/products/${id}?business_id=${businessId}`);
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
            const businessId = localStorage.getItem("businessId");
            const res = await API.get(`/products/barcode/${barcodeInput.trim()}?business_id=${businessId}`);
            
            if (res.data.data) {
                // Focus on the found product
                const product = res.data.data;
                setSearch(product.product_name || product.product_code || "");
                setBarcodeInput("");
                
                // Optionally scroll to or highlight the product
                setMessage(`Found: ${product.product_name}`);
                setMessageType("success");
                
                // Load all products to ensure we have the full list
                await loadProducts();
                
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
            <div style={styles.expiryCell}>
                <span style={styles.expiryDate}>{new Date(expiryDate).toLocaleDateString("en-IN")}</span>
                <span style={{ ...styles.expiryTag, color: status.color, background: status.bg }}>
                    {status.label}
                </span>
            </div>
        );
    };

    // ─── Get status badge ─────────────────────────────────────
    const getStatusBadge = (status) => {
        if (status === "active") {
            return <span style={styles.statusBadgeActive}>Active</span>;
        }
        return <span style={styles.statusBadgeInactive}>Inactive</span>;
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
                (item.barcode && item.barcode.includes(search));

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

            if (sortField === "selling_price" || sortField === "stock" || sortField === "purchase_price") {
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
        return <span style={{ ...styles.sortIcon, color: "#FFC53D" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>;
    };

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                {/* Signboard header */}
                <div style={styles.signboard}>
                    <div style={styles.signboardInner}>
                        <div>
                            <span style={styles.signboardEyebrow}>Shop Register</span>
                            <h1 style={styles.signboardTitle}>Products</h1>
                        </div>
                        <div style={styles.signboardRight}>
                            <div style={styles.signboardCount}>
                                <span style={styles.signboardCountNum}>{products.length}</span>
                                <span style={styles.signboardCountLabel}>on the shelf</span>
                            </div>
                            <Link to="/add-product" style={styles.addButton}>
                                + Add product
                            </Link>
                        </div>
                    </div>
                    <div style={styles.signboardNotch} />
                </div>

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

                {/* Stat tags */}
                <div style={styles.statsContainer}>
                    <div style={styles.statCard}>
                        <span style={styles.statValue}>{stats.total}</span>
                        <span style={styles.statLabel}>Total products</span>
                    </div>
                    <div style={{ ...styles.statCard, ...styles.statCardWarn }}>
                        <span style={{ ...styles.statValue, color: "#C97A12" }}>{stats.lowStock}</span>
                        <span style={styles.statLabel}>Running low</span>
                    </div>
                    <div style={{ ...styles.statCard, ...styles.statCardDanger }}>
                        <span style={{ ...styles.statValue, color: "#D6482B" }}>{stats.outOfStock}</span>
                        <span style={styles.statLabel}>Out of stock</span>
                    </div>
                </div>

                {/* Toolbar */}
                <div style={styles.toolbar}>
                    <div style={styles.searchWrapper}>
                        <span style={styles.searchIcon}>⌕</span>
                        <input
                            placeholder="Search by name, code or barcode…"
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

                    <div style={styles.barcodeWrapper}>
                        <input
                            placeholder="Scan barcode…"
                            value={barcodeInput}
                            onChange={(e) => setBarcodeInput(e.target.value)}
                            style={styles.barcodeInput}
                            onKeyPress={(e) => e.key === "Enter" && handleBarcodeSearch()}
                        />
                        <button style={styles.barcodeButton} onClick={handleBarcodeSearch}>
                            Scan
                        </button>
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
                        <p style={styles.loadingText}>Loading the shelf…</p>
                    </div>
                ) : (
                    <>
                        <div style={styles.tableWrapper}>
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
                                            Price {renderSortIcon("selling_price")}
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
                                        <th style={{ ...styles.th, textAlign: "center" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentProducts.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" style={styles.noData}>
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
                                                                {product.barcode && (
                                                                    <div style={styles.productBarcode}>📷 {product.barcode}</div>
                                                                )}
                                                                {product.tax > 0 && (
                                                                    <div style={styles.productTax}>Tax: {product.tax}%</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={styles.td}>
                                                        <span style={styles.categoryTag}>{product.category || "Other"}</span>
                                                    </td>
                                                    <td style={styles.td}>
                                                        <div style={styles.priceTagWrapper}>
                                                            <span style={styles.priceTagHole} />
                                                            <span style={styles.priceTag}>
                                                                <span style={styles.priceTagValue}>
                                                                    ₹{parseFloat(product.selling_price || 0).toFixed(2)}
                                                                </span>
                                                                <span style={styles.priceTagUnit}>
                                                                    /{product.price_per || 1}{" "}
                                                                    {String(product.price_unit || "pcs").toUpperCase()}
                                                                </span>
                                                            </span>
                                                            {product.purchase_price > 0 && (
                                                                <span style={styles.costPriceTag}>
                                                                    Cost: ₹{parseFloat(product.purchase_price).toFixed(2)}
                                                                </span>
                                                            )}
                                                        </div>
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
                                                    <td style={styles.td}>{getStatusBadge(product.status)}</td>
                                                    <td style={styles.td}>
                                                        <div style={styles.actionButtons}>
                                                            <button
                                                                style={styles.viewButton}
                                                                onClick={() => viewProductDetails(product.id)}
                                                                title="View details"
                                                            >
                                                                View
                                                            </button>
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

            {/* Product Details Modal */}
            {showDetailsModal && selectedProduct && (
                <div style={styles.modalOverlay} onClick={closeDetailsModal}>
                    <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h2 style={styles.modalTitle}>Product Details</h2>
                            <button style={styles.modalClose} onClick={closeDetailsModal}>✕</button>
                        </div>
                        <div style={styles.modalBody}>
                            <div style={styles.detailGrid}>
                                {/* Left Column - Image & Basic Info */}
                                <div style={styles.detailLeft}>
                                    {selectedProduct.image ? (
                                        <img
                                            src={selectedProduct.image}
                                            alt={selectedProduct.product_name}
                                            style={styles.detailImage}
                                            onError={(e) => {
                                                e.target.style.display = "none";
                                            }}
                                        />
                                    ) : (
                                        <div style={styles.detailImagePlaceholder}>
                                            {selectedProduct.product_name?.[0]?.toUpperCase() || "?"}
                                        </div>
                                    )}
                                    <div style={styles.detailBasicInfo}>
                                        <h3 style={styles.detailName}>{selectedProduct.product_name}</h3>
                                        {selectedProduct.product_code && (
                                            <p style={styles.detailCode}>Code: {selectedProduct.product_code}</p>
                                        )}
                                        {selectedProduct.barcode && (
                                            <p style={styles.detailBarcode}>Barcode: {selectedProduct.barcode}</p>
                                        )}
                                        <span style={styles.detailCategory}>{selectedProduct.category || "Uncategorized"}</span>
                                        <div style={styles.detailStatusWrapper}>
                                            {getStatusBadge(selectedProduct.status)}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column - All Details */}
                                <div style={styles.detailRight}>
                                    <div style={styles.detailSection}>
                                        <h4 style={styles.detailSectionTitle}>Pricing Information</h4>
                                        <div style={styles.detailRow}>
                                            <span style={styles.detailLabel}>Selling Price</span>
                                            <span style={styles.detailValue}>₹{parseFloat(selectedProduct.selling_price || 0).toFixed(2)}</span>
                                        </div>
                                        <div style={styles.detailRow}>
                                            <span style={styles.detailLabel}>Purchase Price</span>
                                            <span style={styles.detailValue}>₹{parseFloat(selectedProduct.purchase_price || 0).toFixed(2)}</span>
                                        </div>
                                        <div style={styles.detailRow}>
                                            <span style={styles.detailLabel}>Price Per</span>
                                            <span style={styles.detailValue}>{selectedProduct.price_per || 1} {getUnitLabel(selectedProduct.price_unit)}</span>
                                        </div>
                                        {selectedProduct.tax > 0 && (
                                            <div style={styles.detailRow}>
                                                <span style={styles.detailLabel}>Tax Rate</span>
                                                <span style={styles.detailValue}>{selectedProduct.tax}%</span>
                                            </div>
                                        )}
                                    </div>

                                    <div style={styles.detailSection}>
                                        <h4 style={styles.detailSectionTitle}>Stock Information</h4>
                                        <div style={styles.detailRow}>
                                            <span style={styles.detailLabel}>Current Stock</span>
                                            <span style={styles.detailValue}>
                                                {Number(selectedProduct.stock).toFixed(
                                                    Number.isInteger(Number(selectedProduct.stock)) ? 0 : 2
                                                )} {getUnitLabel(selectedProduct.unit)}
                                            </span>
                                        </div>
                                        <div style={styles.detailRow}>
                                            <span style={styles.detailLabel}>Minimum Stock</span>
                                            <span style={styles.detailValue}>
                                                {selectedProduct.min_stock || 0} {getUnitLabel(selectedProduct.unit)}
                                            </span>
                                        </div>
                                        <div style={styles.detailRow}>
                                            <span style={styles.detailLabel}>Stock Unit</span>
                                            <span style={styles.detailValue}>{getUnitLabel(selectedProduct.unit)}</span>
                                        </div>
                                        <div style={styles.detailRow}>
                                            <span style={styles.detailLabel}>Stock Status</span>
                                            <span style={{
                                                ...styles.detailStockStatus,
                                                color: getStockStatusInfo(selectedProduct.stock, selectedProduct.min_stock).color,
                                                background: getStockStatusInfo(selectedProduct.stock, selectedProduct.min_stock).bg,
                                            }}>
                                                {getStockStatusInfo(selectedProduct.stock, selectedProduct.min_stock).label}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={styles.detailSection}>
                                        <h4 style={styles.detailSectionTitle}>Additional Information</h4>
                                        {selectedProduct.expiry_date && (
                                            <div style={styles.detailRow}>
                                                <span style={styles.detailLabel}>Expiry Date</span>
                                                <span style={styles.detailValue}>
                                                    {new Date(selectedProduct.expiry_date).toLocaleDateString("en-IN")}
                                                </span>
                                            </div>
                                        )}
                                        {selectedProduct.description && (
                                            <div style={styles.detailRow}>
                                                <span style={styles.detailLabel}>Description</span>
                                                <span style={styles.detailValue}>{selectedProduct.description}</span>
                                            </div>
                                        )}
                                    </div>

                                    {selectedProduct.created_at && (
                                        <div style={styles.detailSection}>
                                            <h4 style={styles.detailSectionTitle}>System Information</h4>
                                            <div style={styles.detailRow}>
                                                <span style={styles.detailLabel}>Created</span>
                                                <span style={styles.detailValue}>
                                                    {new Date(selectedProduct.created_at).toLocaleString("en-IN")}
                                                </span>
                                            </div>
                                            {selectedProduct.updated_at && (
                                                <div style={styles.detailRow}>
                                                    <span style={styles.detailLabel}>Last Updated</span>
                                                    <span style={styles.detailValue}>
                                                        {new Date(selectedProduct.updated_at).toLocaleString("en-IN")}
                                                    </span>
                                                </div>
                                            )}
                                            <div style={styles.detailRow}>
                                                <span style={styles.detailLabel}>Product ID</span>
                                                <span style={styles.detailValue}>#{selectedProduct.id}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div style={styles.modalFooter}>
                            <Link
                                to={`/edit-product/${selectedProduct.id}`}
                                style={styles.modalEditButton}
                                onClick={closeDetailsModal}
                            >
                                Edit Product
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

// ============================================================
// STYLES — shop signboard / price-tag direction
// ============================================================
const TEAL = "#0B4F52";
const TEAL_DARK = "#083B3D";
const MARIGOLD = "#FFC53D";
const PAPER = "#FFFBF2";
const INK = "#182422";
const INK_SOFT = "#5C6B67";
const RULE = "#E4DEC8";
const GREEN = "#2F8F5B";
const RED = "#D6482B";

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
        padding: "32px 24px 64px",
    },

    signboard: {
        position: "relative",
        background: TEAL,
        borderRadius: "14px",
        marginBottom: "26px",
        boxShadow: "0 8px 0 " + TEAL_DARK + ", 0 14px 24px rgba(11,79,82,0.25)",
    },
    signboardInner: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "16px",
        flexWrap: "wrap",
        padding: "24px 28px",
    },
    signboardEyebrow: {
        fontSize: "11px",
        letterSpacing: "2px",
        textTransform: "uppercase",
        color: MARIGOLD,
        fontWeight: "700",
    },
    signboardTitle: {
        fontFamily: "'Baloo 2', 'Inter', sans-serif",
        fontSize: "34px",
        fontWeight: "700",
        color: "#FFFDF6",
        margin: "2px 0 0 0",
    },
    signboardRight: {
        display: "flex",
        alignItems: "center",
        gap: "18px",
    },
    signboardCount: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        color: "#DCEEE9",
    },
    signboardCountNum: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "22px",
        fontWeight: "700",
        color: "#FFFFFF",
        lineHeight: 1,
    },
    signboardCountLabel: {
        fontSize: "11px",
        marginTop: "2px",
    },
    addButton: {
        background: MARIGOLD,
        color: TEAL_DARK,
        textDecoration: "none",
        padding: "12px 22px",
        borderRadius: "10px",
        fontSize: "14px",
        fontWeight: "700",
        whiteSpace: "nowrap",
        boxShadow: "0 3px 0 #D69A18",
        transition: "transform 0.1s",
    },
    signboardNotch: {
        position: "absolute",
        bottom: "-8px",
        left: "32px",
        width: "16px",
        height: "16px",
        background: TEAL_DARK,
        borderRadius: "3px",
        transform: "rotate(45deg)",
    },

    message: {
        padding: "12px 18px",
        marginBottom: "20px",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: "500",
        borderLeft: "4px solid",
    },
    successMessage: {
        background: "#E4F5EC",
        color: "#1F6B45",
        borderLeftColor: GREEN,
    },
    errorMessage: {
        background: "#FBE7E0",
        color: "#A5341A",
        borderLeftColor: RED,
    },

    statsContainer: {
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "14px",
        marginBottom: "26px",
    },
    statCard: {
        background: "#FFFFFF",
        padding: "18px 20px",
        borderRadius: "12px",
        border: `2px solid ${RULE}`,
        display: "flex",
        flexDirection: "column",
        gap: "2px",
    },
    statCardWarn: {
        borderColor: "#F0D49B",
    },
    statCardDanger: {
        borderColor: "#F0BDA9",
    },
    statValue: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "28px",
        fontWeight: "700",
        color: TEAL,
        lineHeight: 1.1,
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
        maxWidth: "320px",
        width: "100%",
        flex: 1,
        minWidth: "180px",
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
        border: `2px solid ${RULE}`,
        borderRadius: "10px",
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
        color: "INK_SOFT",
        cursor: "pointer",
        fontSize: "14px",
        padding: "4px 6px",
    },
    barcodeWrapper: {
        display: "flex",
        gap: "6px",
        alignItems: "center",
    },
    barcodeInput: {
        padding: "11px 14px",
        border: `2px solid ${RULE}`,
        borderRadius: "10px",
        fontSize: "14px",
        backgroundColor: "#FFFFFF",
        boxSizing: "border-box",
        color: INK,
        outline: "none",
        width: "160px",
        fontFamily: "'JetBrains Mono', monospace",
    },
    barcodeButton: {
        padding: "11px 18px",
        background: TEAL,
        color: "#FFFFFF",
        border: "none",
        borderRadius: "10px",
        fontSize: "13px",
        fontWeight: "700",
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition: "background 0.2s",
    },
    filterWrapper: {
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
    },
    filterSelect: {
        padding: "10px 12px",
        border: `2px solid ${RULE}`,
        borderRadius: "10px",
        fontSize: "13px",
        backgroundColor: "#FFFFFF",
        cursor: "pointer",
        color: INK,
        outline: "none",
        minWidth: "150px",
    },

    tableWrapper: {
        overflowX: "auto",
        background: "#FFFFFF",
        border: `2px solid ${RULE}`,
        borderRadius: "12px",
        marginBottom: "18px",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        fontSize: "13.5px",
        minWidth: "900px",
    },
    th: {
        padding: "14px 16px",
        textAlign: "left",
        fontWeight: "700",
        color: TEAL,
        fontSize: "11px",
        textTransform: "uppercase",
        letterSpacing: "0.6px",
        borderBottom: `2px solid ${RULE}`,
        whiteSpace: "nowrap",
        cursor: "pointer",
        userSelect: "none",
        background: "#FBF7EA",
    },
    tableRow: {
        borderBottom: `1px dashed ${RULE}`,
    },
    tableRowAlt: {
        borderBottom: `1px dashed ${RULE}`,
        background: "#FFFCF3",
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
        borderRadius: "8px",
        objectFit: "cover",
        border: `2px solid ${RULE}`,
        flexShrink: 0,
    },
    productImagePlaceholder: {
        width: "36px",
        height: "36px",
        borderRadius: "8px",
        border: `2px solid ${RULE}`,
        background: "#EFF6F0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "14px",
        fontWeight: "700",
        color: TEAL,
        flexShrink: 0,
        fontFamily: "'Baloo 2', sans-serif",
    },
    productNameWrapper: {
        display: "flex",
        flexDirection: "column",
        gap: "1px",
    },
    productName: {
        fontWeight: "600",
        color: INK,
        fontSize: "14px",
    },
    productCode: {
        fontSize: "11px",
        color: INK_SOFT,
        fontFamily: "'JetBrains Mono', monospace",
        marginTop: "1px",
    },
    productBarcode: {
        fontSize: "10px",
        color: INK_SOFT,
        fontFamily: "'JetBrains Mono', monospace",
    },
    productTax: {
        fontSize: "10px",
        color: TEAL,
        fontWeight: "600",
    },
    categoryTag: {
        fontSize: "12px",
        color: TEAL,
        fontWeight: "600",
        background: "#EAF3EE",
        padding: "3px 10px",
        borderRadius: "20px",
        display: "inline-block",
    },

    // ─── Die-cut price tag ─────────────────────────────────────
    priceTagWrapper: {
        display: "inline-flex",
        alignItems: "center",
        position: "relative",
        flexWrap: "wrap",
        gap: "4px",
    },
    priceTagHole: {
        width: "6px",
        height: "6px",
        borderRadius: "50%",
        background: PAPER,
        border: `1.5px solid ${MARIGOLD}`,
        position: "relative",
        left: "8px",
        zIndex: 2,
    },
    priceTag: {
        display: "flex",
        flexDirection: "column",
        background: MARIGOLD,
        color: TEAL_DARK,
        padding: "5px 12px 5px 16px",
        marginLeft: "-4px",
        clipPath: "polygon(10px 0, 100% 0, 100% 100%, 10px 100%, 0 50%)",
    },
    priceTagValue: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "13.5px",
        fontWeight: "700",
        lineHeight: 1.2,
    },
    priceTagUnit: {
        fontSize: "9px",
        fontWeight: "600",
        opacity: 0.75,
    },
    costPriceTag: {
        fontSize: "10px",
        color: INK_SOFT,
        fontWeight: "500",
        marginLeft: "4px",
    },

    stockCell: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "4px",
    },
    stockValue: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "14px",
        fontWeight: "600",
        color: INK,
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
        border: "1.5px solid",
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
        fontWeight: "700",
        padding: "1px 7px",
        borderRadius: "20px",
        width: "fit-content",
    },
    statusBadgeActive: {
        fontSize: "11px",
        fontWeight: "700",
        color: GREEN,
        background: "#E4F5EC",
        padding: "2px 10px",
        borderRadius: "20px",
        display: "inline-block",
    },
    statusBadgeInactive: {
        fontSize: "11px",
        fontWeight: "700",
        color: RED,
        background: "#FBE7E0",
        padding: "2px 10px",
        borderRadius: "20px",
        display: "inline-block",
    },
    actionButtons: {
        display: "flex",
        gap: "6px",
        alignItems: "center",
    },
    viewButton: {
        background: "#E8F0FE",
        color: "#1A5C8C",
        padding: "6px 12px",
        border: "none",
        borderRadius: "8px",
        fontSize: "12px",
        fontWeight: "700",
        cursor: "pointer",
        lineHeight: 1,
        transition: "background 0.2s",
    },
    editButton: {
        background: "#EAF3EE",
        color: TEAL,
        padding: "6px 12px",
        textDecoration: "none",
        borderRadius: "8px",
        fontSize: "12px",
        fontWeight: "700",
        border: "none",
        cursor: "pointer",
        lineHeight: 1,
    },
    deleteButton: {
        background: "#FBE7E0",
        color: RED,
        border: "none",
        padding: "6px 10px",
        cursor: "pointer",
        borderRadius: "8px",
        fontSize: "12px",
        lineHeight: 1,
    },
    noData: {
        padding: "56px 20px",
        textAlign: "center",
    },
    noDataTitle: {
        fontFamily: "'Baloo 2', sans-serif",
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
        border: `2px solid ${RULE}`,
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: "600",
        color: TEAL,
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
        borderRadius: "8px",
        border: "none",
        background: "transparent",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: "600",
        color: INK_SOFT,
        fontFamily: "'JetBrains Mono', monospace",
        minWidth: "30px",
        textAlign: "center",
    },
    pageNumberActive: {
        background: TEAL,
        color: "#FFFFFF",
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
        borderTop: `3px solid ${MARIGOLD}`,
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
        fontFamily: "'JetBrains Mono', monospace",
        padding: "4px 0 8px",
    },

    sortIcon: {
        marginLeft: "4px",
        fontSize: "11px",
        color: "#B7B0A0",
        display: "inline-block",
    },

    // ─── Modal Styles ─────────────────────────────────────
    modalOverlay: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
        animation: "fadeIn 0.3s ease",
    },
    modal: {
        background: PAPER,
        borderRadius: "16px",
        maxWidth: "900px",
        width: "100%",
        maxHeight: "90vh",
        overflowY: "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        animation: "slideUp 0.3s ease",
    },
    modalHeader: {
        padding: "20px 28px",
        borderBottom: `2px solid ${RULE}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "sticky",
        top: 0,
        background: PAPER,
        zIndex: 10,
        borderTopLeftRadius: "16px",
        borderTopRightRadius: "16px",
    },
    modalTitle: {
        fontFamily: "'Baloo 2', sans-serif",
        fontSize: "24px",
        color: TEAL,
        margin: 0,
    },
    modalClose: {
        background: "none",
        border: "none",
        fontSize: "24px",
        color: INK_SOFT,
        cursor: "pointer",
        padding: "4px 8px",
        borderRadius: "6px",
        transition: "background 0.2s",
        lineHeight: 1,
    },
    modalBody: {
        padding: "28px",
    },
    detailGrid: {
        display: "grid",
        gridTemplateColumns: "280px 1fr",
        gap: "32px",
    },
    detailLeft: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
    },
    detailImage: {
        width: "100%",
        maxHeight: "280px",
        objectFit: "contain",
        borderRadius: "12px",
        border: `2px solid ${RULE}`,
        background: "#FFFFFF",
    },
    detailImagePlaceholder: {
        width: "100%",
        height: "200px",
        borderRadius: "12px",
        border: `2px solid ${RULE}`,
        background: "#EFF6F0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "48px",
        fontWeight: "700",
        color: TEAL,
        fontFamily: "'Baloo 2', sans-serif",
    },
    detailBasicInfo: {
        textAlign: "center",
        width: "100%",
    },
    detailName: {
        fontSize: "20px",
        fontWeight: "700",
        color: INK,
        margin: "0 0 4px 0",
    },
    detailCode: {
        fontSize: "13px",
        color: INK_SOFT,
        margin: "4px 0",
        fontFamily: "'JetBrains Mono', monospace",
    },
    detailBarcode: {
        fontSize: "13px",
        color: INK_SOFT,
        margin: "4px 0",
        fontFamily: "'JetBrains Mono', monospace",
    },
    detailCategory: {
        display: "inline-block",
        padding: "4px 14px",
        background: "#EAF3EE",
        color: TEAL,
        borderRadius: "20px",
        fontSize: "13px",
        fontWeight: "600",
        marginTop: "8px",
    },
    detailStatusWrapper: {
        marginTop: "8px",
    },
    detailRight: {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
    },
    detailSection: {
        background: "#FFFFFF",
        padding: "16px 20px",
        borderRadius: "12px",
        border: `2px solid ${RULE}`,
    },
    detailSectionTitle: {
        fontSize: "13px",
        fontWeight: "700",
        color: TEAL,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        margin: "0 0 12px 0",
        borderBottom: `1px solid ${RULE}`,
        paddingBottom: "8px",
    },
    detailRow: {
        display: "flex",
        justifyContent: "space-between",
        padding: "6px 0",
        borderBottom: `1px solid #F5F0E4`,
        fontSize: "14px",
    },
    detailLabel: {
        color: INK_SOFT,
        fontWeight: "500",
    },
    detailValue: {
        color: INK,
        fontWeight: "600",
        textAlign: "right",
    },
    detailStockStatus: {
        padding: "2px 10px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "700",
        textTransform: "uppercase",
    },
    modalFooter: {
        padding: "16px 28px",
        borderTop: `2px solid ${RULE}`,
        display: "flex",
        justifyContent: "flex-end",
        gap: "12px",
    },
    modalEditButton: {
        background: MARIGOLD,
        color: TEAL_DARK,
        padding: "10px 24px",
        textDecoration: "none",
        borderRadius: "10px",
        fontSize: "14px",
        fontWeight: "700",
        border: "none",
        cursor: "pointer",
        transition: "transform 0.1s",
    },
    modalCloseButton: {
        background: "#F0EDE4",
        color: INK_SOFT,
        padding: "10px 24px",
        border: "none",
        borderRadius: "10px",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "background 0.2s",
    },
};

// Inject fonts, keyframes and interaction states
if (typeof document !== "undefined" && !document.getElementById("products-page-styles")) {
    const styleSheet = document.createElement("style");
    styleSheet.id = "products-page-styles";
    styleSheet.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600;700&display=swap');

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes slideUp {
            from { 
                opacity: 0;
                transform: translateY(20px);
            }
            to { 
                opacity: 1;
                transform: translateY(0);
            }
        }

        th:hover { color: #083B3D !important; }
        .search-box:focus { border-color: #FFC53D !important; box-shadow: 0 0 0 3px rgba(255,197,61,0.25) !important; }
        .filter-select:focus { border-color: #FFC53D !important; }
        .barcode-input:focus { border-color: #FFC53D !important; }
        .barcode-button:hover { background: #083B3D !important; }
        a[href="/add-product"]:hover { transform: translateY(1px); box-shadow: 0 2px 0 #D69A18 !important; }
        .page-button:hover:not(:disabled) { border-color: #FFC53D !important; }
        tr:hover td { background: #FFF6DF !important; }
        .view-button:hover { background: #D6E8FF !important; }
        .modal-close:hover { background: #F5F0E4 !important; }
        .modal-close-button:hover { background: #E4DEC8 !important; }
        .modal-edit-button:hover { transform: translateY(-1px); box-shadow: 0 2px 0 #D69A18 !important; }

        /* Scrollbar styling */
        .modal::-webkit-scrollbar {
            width: 8px;
        }
        .modal::-webkit-scrollbar-track {
            background: #F5F0E4;
            border-radius: 0 16px 16px 0;
        }
        .modal::-webkit-scrollbar-thumb {
            background: #D4CBB8;
            border-radius: 4px;
        }
        .modal::-webkit-scrollbar-thumb:hover {
            background: #C4BBA8;
        }
    `;
    document.head.appendChild(styleSheet);
}