import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import * as XLSX from "xlsx";

export default function Products() {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedExpiryFilter, setSelectedExpiryFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState("product_name");
    const [sortDirection, setSortDirection] = useState("asc");
    const [viewMode, setViewMode] = useState("table");
    const [showBarcodeModal, setShowBarcodeModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const itemsPerPage = 10;

    // Load products on mount
    useEffect(() => {
        loadProducts();
    }, []);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, selectedStatus, selectedCategory, selectedExpiryFilter]);

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

    const calculateProfit = (purchase, selling) => {
        if (!purchase || !selling || purchase === 0) return null;
        const profit = selling - purchase;
        const margin = ((profit / purchase) * 100);
        return { profit, margin };
    };

    const getUnitIcon = (unit) => {
        const icons = {
            'kg': '⚖️',
            'g': '⚖️',
            'pcs': '📦',
            'l': '🥤',
            'ml': '🥤',
            'meter': '📏',
            'feet': '📏',
            'pack': '📦',
            'box': '📦',
            'bottle': '🧴',
            'dozen': '📦'
        };
        return icons[unit] || '📦';
    };

    // ─── Expiry Helpers ──────────────────────────────────────────
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
        if (!status) return null;
        
        return (
            <span style={{
                ...styles.expiryBadge,
                background: status.bg,
                color: status.color,
            }}>
                <span style={{ marginRight: "4px" }}>{status.icon}</span>
                {status.label}
                {expiryDate && (
                    <span style={styles.expiryDateText}>
                        {new Date(expiryDate).toLocaleDateString()}
                    </span>
                )}
            </span>
        );
    };

    const getStatusBadge = (status) => {
        const configs = {
            active: { bg: "#dcfce7", color: "#166534", icon: "●", label: "Active" },
            inactive: { bg: "#fee2e2", color: "#991b1b", icon: "○", label: "Inactive" },
        };
        const config = configs[status?.toLowerCase()] || configs.active;
        return (
            <span style={{
                ...styles.statusBadge,
                background: config.bg,
                color: config.color,
            }}>
                <span style={{ marginRight: "4px" }}>{config.icon}</span>
                {config.label}
            </span>
        );
    };

    const getProfitBadge = (purchase, selling) => {
        const result = calculateProfit(purchase, selling);
        if (!result) return <span style={styles.noProfitBadge}>—</span>;

        const { profit, margin } = result;
        const isProfit = profit >= 0;

        return (
            <span style={{
                ...styles.profitBadge,
                background: isProfit ? "#dcfce7" : "#fee2e2",
                color: isProfit ? "#166534" : "#991b1b",
            }}>
                <span style={{ marginRight: "4px" }}>{isProfit ? "📈" : "📉"}</span>
                {isProfit ? "+" : ""}{profit.toFixed(2)}
                <span style={{ fontSize: "10px", opacity: 0.7, marginLeft: "2px" }}>
                    ({margin.toFixed(1)}%)
                </span>
            </span>
        );
    };

    const getStockStatus = (stock, minStock) => {
        const ratio = minStock > 0 ? stock / minStock : Infinity;
        if (stock <= 0) return { label: "Out of Stock", color: "#991b1b", bg: "#fee2e2" };
        if (stock <= minStock) return { label: "Low Stock", color: "#92400e", bg: "#fef3c7" };
        if (ratio <= 3) return { label: "Medium", color: "#1e40af", bg: "#dbeafe" };
        return { label: "In Stock", color: "#166534", bg: "#dcfce7" };
    };

    // Generate barcode image URL
    const generateBarcode = (barcode) => {
        if (!barcode) return null;
        return `https://barcode.tec-it.com/barcode.ashx?data=${barcode}&code=Code128&dpi=96&datatype=Code128`;
    };

    // Get unique categories for filter
    const categories = useMemo(() => {
        const cats = new Set();
        products.forEach(p => {
            if (p.category) cats.add(p.category);
        });
        return Array.from(cats);
    }, [products]);

    // Filter and sort products
    const filteredAndSortedProducts = useMemo(() => {
        let filtered = products.filter(item => {
            const matchesSearch = item.product_name?.toLowerCase().includes(search.toLowerCase()) ||
                item.product_code?.toLowerCase().includes(search.toLowerCase()) ||
                item.barcode?.includes(search);

            const matchesStatus = selectedStatus === "all" || item.status === selectedStatus;
            const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;

            // Expiry filter
            let matchesExpiry = true;
            if (selectedExpiryFilter !== "all") {
                const expiryStatus = getExpiryStatus(item.expiry_date);
                if (selectedExpiryFilter === "expired") {
                    matchesExpiry = expiryStatus?.status === "expired";
                } else if (selectedExpiryFilter === "expiring_soon") {
                    matchesExpiry = expiryStatus?.status === "expiring_soon";
                } else if (selectedExpiryFilter === "expiring") {
                    matchesExpiry = expiryStatus?.status === "expiring" || expiryStatus?.status === "expiring_soon";
                } else if (selectedExpiryFilter === "valid") {
                    matchesExpiry = expiryStatus?.status === "good";
                } else if (selectedExpiryFilter === "no_expiry") {
                    matchesExpiry = !item.expiry_date;
                }
            }

            return matchesSearch && matchesStatus && matchesCategory && matchesExpiry;
        });

        // Sort
        filtered.sort((a, b) => {
            let aVal = a[sortField] ?? "";
            let bVal = b[sortField] ?? "";

            if (sortField === "purchase_price" || sortField === "selling_price" || sortField === "stock") {
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
    }, [products, search, selectedStatus, selectedCategory, selectedExpiryFilter, sortField, sortDirection]);

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentProducts = filteredAndSortedProducts.slice(startIndex, endIndex);

    // Summary stats
    const stats = useMemo(() => {
        const total = filteredAndSortedProducts.length;
        const active = filteredAndSortedProducts.filter(p => p.status === "active").length;
        const lowStock = filteredAndSortedProducts.filter(p => p.stock <= p.min_stock).length;
        const outOfStock = filteredAndSortedProducts.filter(p => p.stock <= 0).length;

        // Expiry stats
        const expired = filteredAndSortedProducts.filter(p => {
            const status = getExpiryStatus(p.expiry_date);
            return status?.status === "expired";
        }).length;
        
        const expiringSoon = filteredAndSortedProducts.filter(p => {
            const status = getExpiryStatus(p.expiry_date);
            return status?.status === "expiring_soon";
        }).length;

        const productsWithPrices = filteredAndSortedProducts.filter(
            p => p.purchase_price > 0 && p.selling_price > 0
        );
        let avgMargin = 0;
        if (productsWithPrices.length > 0) {
            avgMargin = productsWithPrices.reduce((acc, p) => {
                const margin = ((p.selling_price - p.purchase_price) / p.purchase_price) * 100;
                return acc + margin;
            }, 0) / productsWithPrices.length;
        }

        const totalValue = filteredAndSortedProducts.reduce((acc, p) => {
            return acc + (parseFloat(p.stock) || 0) * (parseFloat(p.purchase_price) || 0);
        }, 0);

        return { total, active, lowStock, outOfStock, avgMargin, totalValue, expired, expiringSoon };
    }, [filteredAndSortedProducts]);

    // Handle sort
    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(prev => prev === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const renderSortIcon = (field) => {
        if (sortField !== field) return <span style={styles.sortIcon}>↕</span>;
        return <span style={styles.sortIcon}>{sortDirection === "asc" ? "↑" : "↓"}</span>;
    };

    const exportToExcel = () => {
        if (products.length === 0) {
            alert("No products to export.");
            return;
        }

        const data = products.map(p => ({
            'ID': p.id,
            'Product Name': p.product_name,
            'Product Code': p.product_code || '',
            'Barcode': p.barcode || '',
            'Category': p.category || '',
            'Purchase Price': parseFloat(p.purchase_price || 0),
            'Selling Price': parseFloat(p.selling_price || 0),
            'Price Per Unit': p.price_per || 1,
            'Price Unit': p.price_unit || 'pcs',
            'Stock': parseFloat(p.stock || 0),
            'Unit': p.unit || 'pcs',
            'Min Stock': parseFloat(p.min_stock || 0),
            'Expiry Date': p.expiry_date ? new Date(p.expiry_date).toLocaleDateString() : '',
            'Status': p.status || 'active',
            'Created At': p.created_at ? new Date(p.created_at).toLocaleString() : '',
            'Updated At': p.updated_at ? new Date(p.updated_at).toLocaleString() : '',
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Products");
        XLSX.writeFile(wb, `products_${new Date().toISOString().slice(0,10)}.xlsx`);
    };

    // ─── View Product Handler ──────────────────────────────────
    const handleViewProduct = (product) => {
        setSelectedProduct(product);
        setShowBarcodeModal(true);
    };

    // ─── Barcode Modal ─────────────────────────────────────────
    const renderBarcodeModal = () => {
        if (!showBarcodeModal || !selectedProduct) return null;

        const barcodeImage = generateBarcode(selectedProduct.barcode);
        const expiryStatus = getExpiryStatus(selectedProduct.expiry_date);
        const profitResult = calculateProfit(
            parseFloat(selectedProduct.purchase_price),
            parseFloat(selectedProduct.selling_price)
        );

        return (
            <div style={styles.modalOverlay} onClick={() => setShowBarcodeModal(false)}>
                <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                    <div style={styles.modalHeader}>
                        <h2 style={styles.modalTitle}>📱 Product Details</h2>
                        <button 
                            style={styles.modalClose}
                            onClick={() => setShowBarcodeModal(false)}
                        >
                            ✕
                        </button>
                    </div>

                    <div style={styles.modalBody}>
                        {/* Product Image */}
                        <div style={styles.modalImageSection}>
                            {selectedProduct.image ? (
                                <img 
                                    src={selectedProduct.image} 
                                    alt={selectedProduct.product_name}
                                    style={styles.modalImage}
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            ) : (
                                <div style={styles.modalImagePlaceholder}>
                                    <span>📦</span>
                                </div>
                            )}
                            <div style={styles.modalProductInfo}>
                                <h3 style={styles.modalProductName}>{selectedProduct.product_name}</h3>
                                <div style={styles.modalProductMeta}>
                                    <span style={styles.modalCategory}>{selectedProduct.category || "Other"}</span>
                                    {getStatusBadge(selectedProduct.status)}
                                </div>
                                {selectedProduct.product_code && (
                                    <div style={styles.modalProductCode}>
                                        Code: {selectedProduct.product_code}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Barcode Section */}
                        {selectedProduct.barcode && (
                            <div style={styles.modalBarcodeSection}>
                                <h4 style={styles.modalSectionTitle}>📊 Barcode</h4>
                                <div style={styles.modalBarcodeWrapper}>
                                    <img 
                                        src={barcodeImage} 
                                        alt="Barcode"
                                        style={styles.modalBarcodeImage}
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.parentElement.innerHTML = `
                                                <div style="text-align:center;padding:20px;">
                                                    <div style="font-size:48px;margin-bottom:10px;">📊</div>
                                                    <div style="font-size:18px;font-weight:600;color:#0f172a;">${selectedProduct.barcode}</div>
                                                    <div style="font-size:12px;color:#94a3b8;margin-top:5px;">Barcode Number</div>
                                                </div>
                                            `;
                                        }}
                                    />
                                </div>
                                <div style={styles.modalBarcodeInfo}>
                                    <span style={styles.modalBarcodeLabel}>Barcode:</span>
                                    <span style={styles.modalBarcodeValue}>{selectedProduct.barcode}</span>
                                    <button 
                                        onClick={() => navigator.clipboard.writeText(selectedProduct.barcode)}
                                        style={styles.copyButton}
                                    >
                                        📋 Copy
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Pricing & Stock Details */}
                        <div style={styles.modalDetailsGrid}>
                            <div style={styles.modalDetailItem}>
                                <span style={styles.modalDetailLabel}>Purchase Price</span>
                                <span style={styles.modalDetailValue}>₹{parseFloat(selectedProduct.purchase_price || 0).toFixed(2)}</span>
                            </div>
                            <div style={styles.modalDetailItem}>
                                <span style={styles.modalDetailLabel}>Selling Price</span>
                                <span style={styles.modalDetailValue}>₹{parseFloat(selectedProduct.selling_price || 0).toFixed(2)}</span>
                            </div>
                            <div style={styles.modalDetailItem}>
                                <span style={styles.modalDetailLabel}>Profit</span>
                                {profitResult ? (
                                    <span style={{
                                        ...styles.modalDetailValue,
                                        color: profitResult.profit >= 0 ? "#166534" : "#991b1b"
                                    }}>
                                        {profitResult.profit >= 0 ? "+" : ""}{profitResult.profit.toFixed(2)}
                                        <span style={{ fontSize: "12px", opacity: 0.7, marginLeft: "4px" }}>
                                            ({profitResult.margin.toFixed(1)}%)
                                        </span>
                                    </span>
                                ) : (
                                    <span style={styles.modalDetailValue}>—</span>
                                )}
                            </div>
                            <div style={styles.modalDetailItem}>
                                <span style={styles.modalDetailLabel}>Stock</span>
                                <span style={styles.modalDetailValue}>
                                    {getUnitIcon(selectedProduct.unit)} {selectedProduct.stock} {String(selectedProduct.unit || "pcs").toUpperCase()}
                                </span>
                            </div>
                            {selectedProduct.expiry_date && (
                                <div style={styles.modalDetailItem}>
                                    <span style={styles.modalDetailLabel}>Expiry Date</span>
                                    <span style={styles.modalDetailValue}>
                                        {new Date(selectedProduct.expiry_date).toLocaleDateString()}
                                        {expiryStatus && (
                                            <span style={{
                                                marginLeft: "8px",
                                                fontSize: "13px",
                                                color: expiryStatus.color,
                                                fontWeight: "600"
                                            }}>
                                                {expiryStatus.icon} {expiryStatus.label}
                                            </span>
                                        )}
                                    </span>
                                </div>
                            )}
                            <div style={styles.modalDetailItem}>
                                <span style={styles.modalDetailLabel}>Minimum Stock</span>
                                <span style={styles.modalDetailValue}>{selectedProduct.min_stock || 0}</span>
                            </div>
                            {selectedProduct.tax > 0 && (
                                <div style={styles.modalDetailItem}>
                                    <span style={styles.modalDetailLabel}>Tax</span>
                                    <span style={styles.modalDetailValue}>{selectedProduct.tax}%</span>
                                </div>
                            )}
                            {selectedProduct.description && (
                                <div style={styles.modalDetailItem} style={{ gridColumn: "1 / -1" }}>
                                    <span style={styles.modalDetailLabel}>Description</span>
                                    <span style={styles.modalDetailValue}>{selectedProduct.description}</span>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div style={styles.modalActions}>
                            <Link
                                to={`/edit-product/${selectedProduct.id}`}
                                style={styles.modalEditButton}
                            >
                                ✏️ Edit Product
                            </Link>
                            <button
                                style={styles.modalDeleteButton}
                                onClick={() => {
                                    setShowBarcodeModal(false);
                                    deleteProduct(selectedProduct.id);
                                }}
                            >
                                🗑️ Delete Product
                            </button>
                            <button
                                style={styles.modalCloseButton}
                                onClick={() => setShowBarcodeModal(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Render table view
    const renderTableView = () => (
        <div style={styles.tableWrapper}>
            <table style={styles.table}>
                <thead>
                    <tr style={styles.tableHeader}>
                        <th style={styles.th} onClick={() => handleSort("id")} className="sortable">
                            ID {renderSortIcon("id")}
                        </th>
                        <th style={styles.th} onClick={() => handleSort("product_name")} className="sortable">
                            Product {renderSortIcon("product_name")}
                        </th>
                        <th style={styles.th} onClick={() => handleSort("category")} className="sortable">
                            Category {renderSortIcon("category")}
                        </th>
                        <th style={styles.th} onClick={() => handleSort("purchase_price")} className="sortable">
                            Cost {renderSortIcon("purchase_price")}
                        </th>
                        <th style={styles.th} onClick={() => handleSort("selling_price")} className="sortable">
                            Price {renderSortIcon("selling_price")}
                        </th>
                        <th style={styles.th}>Profit</th>
                        <th style={styles.th} onClick={() => handleSort("stock")} className="sortable">
                            Stock {renderSortIcon("stock")}
                        </th>
                        <th style={styles.th} onClick={() => handleSort("expiry_date")} className="sortable">
                            Expiry {renderSortIcon("expiry_date")}
                        </th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th} style={{ textAlign: "center" }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {currentProducts.length === 0 ? (
                        <tr>
                            <td colSpan="10" style={styles.noData}>
                                {search || selectedStatus !== "all" || selectedCategory !== "all" || selectedExpiryFilter !== "all" ?
                                    <div>
                                        <span style={{ fontSize: "32px", display: "block", marginBottom: "8px" }}>🔍</span>
                                        No products match your filters
                                    </div> :
                                    <div>
                                        <span style={{ fontSize: "32px", display: "block", marginBottom: "8px" }}>📦</span>
                                        No products found. Click <strong>"Add Product"</strong> to get started.
                                    </div>
                                }
                            </td>
                        </tr>
                    ) : (
                        currentProducts.map(product => {
                            const formattedStock = Number(product.stock).toFixed(2);
                            const unit = String(product.unit || "pcs").toUpperCase();
                            const unitIcon = getUnitIcon(product.unit);
                            const stockStatus = getStockStatus(product.stock, product.min_stock);
                            const expiryStatus = getExpiryStatus(product.expiry_date);

                            return (
                                <tr key={product.id} style={styles.tableRow}>
                                    <td style={styles.td}>
                                        <span style={styles.idBadge}>#{product.id}</span>
                                    </td>
                                    <td style={styles.td}>
                                        <div style={styles.productInfo}>
                                            {product.image ? (
                                                <img
                                                    src={product.image}
                                                    alt={product.product_name}
                                                    style={styles.productImage}
                                                    onError={(e) => { e.target.style.display = 'none'; }}
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
                                        <span style={styles.categoryBadge}>
                                            {product.category || "Other"}
                                        </span>
                                    </td>
                                    <td style={styles.td}>
                                        <span style={styles.purchasePrice}>
                                            ₹{parseFloat(product.purchase_price || 0).toFixed(2)}
                                        </span>
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
                                        {getProfitBadge(
                                            parseFloat(product.purchase_price),
                                            parseFloat(product.selling_price)
                                        )}
                                    </td>
                                    <td style={styles.td}>
                                        <div style={styles.stockCell}>
                                            <span style={{
                                                ...styles.stockBadge,
                                                background: stockStatus.bg,
                                                color: stockStatus.color,
                                            }}>
                                                {unitIcon} {formattedStock} {unit}
                                            </span>
                                            <div style={styles.stockBarWrapper}>
                                                <div style={{
                                                    ...styles.stockBar,
                                                    width: `${Math.min((product.stock / (product.min_stock || 1)) * 100, 100)}%`,
                                                    background: stockStatus.color,
                                                }} />
                                            </div>
                                        </div>
                                    </td>
                                    <td style={styles.td}>
                                        {product.expiry_date ? (
                                            <div>
                                                {getExpiryBadge(product.expiry_date)}
                                                {expiryStatus && (
                                                    <div style={{
                                                        fontSize: "11px",
                                                        color: expiryStatus.color,
                                                        fontWeight: "500",
                                                        marginTop: "2px"
                                                    }}>
                                                        {expiryStatus.status === "expired" ? "⚠️ Expired" :
                                                         expiryStatus.status === "expiring_soon" ? "⚠️ Expiring soon" :
                                                         expiryStatus.status === "expiring" ? "⏳ Expiring" :
                                                         "✅ Valid"}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span style={{ color: "#94a3b8", fontSize: "12px" }}>—</span>
                                        )}
                                    </td>
                                    <td style={styles.td}>
                                        {getStatusBadge(product.status)}
                                    </td>
                                    <td style={styles.td}>
                                        <div style={styles.actionButtons}>
                                            <button
                                                style={styles.viewButtonAction}
                                                onClick={() => handleViewProduct(product)}
                                                title="View Product"
                                            >
                                                👁️
                                            </button>
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

    // Render grid view
    const renderGridView = () => (
        <div style={styles.gridContainer}>
            {currentProducts.length === 0 ? (
                <div style={styles.noDataGrid}>
                    <span style={{ fontSize: "48px", display: "block", marginBottom: "12px" }}>📦</span>
                    {search || selectedStatus !== "all" || selectedCategory !== "all" || selectedExpiryFilter !== "all" ?
                        "No products match your filters" :
                        "No products found. Click 'Add Product' to get started."
                    }
                </div>
            ) : (
                currentProducts.map(product => {
                    const formattedStock = Number(product.stock).toFixed(2);
                    const unit = String(product.unit || "pcs").toUpperCase();
                    const unitIcon = getUnitIcon(product.unit);
                    const stockStatus = getStockStatus(product.stock, product.min_stock);
                    const profitResult = calculateProfit(
                        parseFloat(product.purchase_price),
                        parseFloat(product.selling_price)
                    );
                    const expiryStatus = getExpiryStatus(product.expiry_date);

                    return (
                        <div key={product.id} style={styles.gridCard}>
                            <div style={styles.gridCardHeader}>
                                {product.image ? (
                                    <img
                                        src={product.image}
                                        alt={product.product_name}
                                        style={styles.gridCardImage}
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                ) : (
                                    <div style={styles.gridCardImagePlaceholder}>
                                        <span>📦</span>
                                    </div>
                                )}
                                <div style={styles.gridCardStatus}>
                                    {getStatusBadge(product.status)}
                                </div>
                                {product.expiry_date && (
                                    <div style={{
                                        position: "absolute",
                                        bottom: "12px",
                                        left: "12px",
                                        ...styles.expiryBadge,
                                        background: expiryStatus?.bg || "#f1f5f9",
                                        color: expiryStatus?.color || "#475569",
                                        fontSize: "11px",
                                        padding: "3px 10px",
                                    }}>
                                        {expiryStatus?.icon} {expiryStatus?.label}
                                    </div>
                                )}
                            </div>
                            <div style={styles.gridCardBody}>
                                <h3 style={styles.gridCardTitle}>{product.product_name}</h3>
                                <div style={styles.gridCardCode}>
                                    {product.product_code && `#${product.product_code}`}
                                    {product.barcode && ` • ${product.barcode}`}
                                </div>
                                <div style={styles.gridCardMeta}>
                                    <span style={styles.gridCardCategory}>
                                        {product.category || "Other"}
                                    </span>
                                    {product.expiry_date && (
                                        <span style={{
                                            ...styles.gridCardCategory,
                                            background: expiryStatus?.bg || "#f1f5f9",
                                            color: expiryStatus?.color || "#475569",
                                        }}>
                                            📅 {new Date(product.expiry_date).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                                <div style={styles.gridCardPrices}>
                                    <div>
                                        <span style={styles.gridCardPriceLabel}>Cost</span>
                                        <span style={styles.gridCardPrice}>₹{parseFloat(product.purchase_price || 0).toFixed(2)}</span>
                                    </div>
                                    <div>
                                        <span style={styles.gridCardPriceLabel}>Sell</span>
                                        <span style={styles.gridCardPrice}>₹{parseFloat(product.selling_price || 0).toFixed(2)}</span>
                                    </div>
                                    <div>
                                        <span style={styles.gridCardPriceLabel}>Profit</span>
                                        {profitResult ? (
                                            <span style={{
                                                ...styles.gridCardPrice,
                                                color: profitResult.profit >= 0 ? "#166534" : "#991b1b"
                                            }}>
                                                {profitResult.profit >= 0 ? "+" : ""}{profitResult.profit.toFixed(2)}
                                            </span>
                                        ) : (
                                            <span style={styles.gridCardPrice}>—</span>
                                        )}
                                    </div>
                                </div>
                                <div style={styles.gridCardStock}>
                                    <div style={styles.gridCardStockInfo}>
                                        <span>
                                            {unitIcon} {formattedStock} {unit}
                                        </span>
                                        <span style={{
                                            ...styles.gridCardStockLabel,
                                            color: stockStatus.color,
                                            background: stockStatus.bg,
                                            padding: "2px 10px",
                                            borderRadius: "12px",
                                            fontSize: "11px",
                                            fontWeight: "600",
                                        }}>
                                            {stockStatus.label}
                                        </span>
                                    </div>
                                    <div style={styles.stockBarWrapper}>
                                        <div style={{
                                            ...styles.stockBar,
                                            width: `${Math.min((product.stock / (product.min_stock || 1)) * 100, 100)}%`,
                                            background: stockStatus.color,
                                        }} />
                                    </div>
                                    <div style={styles.gridCardMinStock}>
                                        Min: {product.min_stock || 0} {unit}
                                    </div>
                                </div>
                                <div style={styles.gridCardActions}>
                                    <button
                                        style={styles.gridCardView}
                                        onClick={() => handleViewProduct(product)}
                                    >
                                        👁️ View
                                    </button>
                                    <Link
                                        to={`/edit-product/${product.id}`}
                                        style={styles.gridCardEdit}
                                    >
                                        ✏️ Edit
                                    </Link>
                                    <button
                                        style={styles.gridCardDelete}
                                        onClick={() => deleteProduct(product.id)}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>📦 Products</h1>
                    <p style={styles.subtitle}>
                        {products.length} products in your inventory
                    </p>
                </div>
                <Link to="/add-product" style={styles.addButton}>
                    <span style={styles.addIcon}>+</span> Add Product
                </Link>
            </div>

            {/* Message */}
            {message && (
                <div style={{
                    ...styles.message,
                    ...(messageType === "success" ? styles.successMessage : styles.errorMessage)
                }}>
                    {message}
                </div>
            )}

            {/* Stats Cards */}
            <div style={styles.statsContainer}>
                <div style={styles.statCard}>
                    <div style={styles.statIcon}>📦</div>
                    <div style={styles.statContent}>
                        <span style={styles.statValue}>{stats.total}</span>
                        <span style={styles.statLabel}>Total Products</span>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={{ ...styles.statIcon, background: "#dcfce7", color: "#166534" }}>✅</div>
                    <div style={styles.statContent}>
                        <span style={styles.statValue}>{stats.active}</span>
                        <span style={styles.statLabel}>Active</span>
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
                <div style={styles.statCard}>
                    <div style={{ ...styles.statIcon, background: "#fee2e2", color: "#991b1b" }}>🔴</div>
                    <div style={styles.statContent}>
                        <span style={styles.statValue}>{stats.expired}</span>
                        <span style={styles.statLabel}>Expired</span>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={{ ...styles.statIcon, background: "#fff7ed", color: "#ea580c" }}>🟠</div>
                    <div style={styles.statContent}>
                        <span style={styles.statValue}>{stats.expiringSoon}</span>
                        <span style={styles.statLabel}>Expiring Soon</span>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={{ ...styles.statIcon, background: "#dbeafe", color: "#1e40af" }}>📊</div>
                    <div style={styles.statContent}>
                        <span style={styles.statValue}>{stats.avgMargin.toFixed(1)}%</span>
                        <span style={styles.statLabel}>Avg Margin</span>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={{ ...styles.statIcon, background: "#e0e7ff", color: "#4338ca" }}>💰</div>
                    <div style={styles.statContent}>
                        <span style={styles.statValue}>₹{stats.totalValue.toFixed(0)}</span>
                        <span style={styles.statLabel}>Total Value</span>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div style={styles.toolbar}>
                <div style={styles.toolbarLeft}>
                    <div style={styles.searchWrapper}>
                        <span style={styles.searchIcon}>🔍</span>
                        <input
                            placeholder="Search by name, code, or barcode..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={styles.searchBox}
                        />
                        {search && (
                            <button
                                style={styles.clearButton}
                                onClick={() => setSearch("")}
                            >
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
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>

                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            style={styles.filterSelect}
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>

                        <select
                            value={selectedExpiryFilter}
                            onChange={(e) => setSelectedExpiryFilter(e.target.value)}
                            style={styles.filterSelect}
                        >
                            <option value="all">All Expiry</option>
                            <option value="expired">🔴 Expired</option>
                            <option value="expiring_soon">🟠 Expiring Soon (7 days)</option>
                            <option value="expiring">🟡 Expiring (30 days)</option>
                            <option value="valid">✅ Valid</option>
                            <option value="no_expiry">— No Expiry</option>
                        </select>
                    </div>

                    <button
                        onClick={exportToExcel}
                        style={styles.exportButton}
                        title="Export all products to Excel"
                    >
                        📊 Export Excel
                    </button>

                    <div style={styles.viewToggle}>
                        <button
                            onClick={() => setViewMode("table")}
                            style={{
                                ...styles.viewButton,
                                ...(viewMode === "table" ? styles.viewButtonActive : {})
                            }}
                            title="Table View"
                        >
                            📋
                        </button>
                        <button
                            onClick={() => setViewMode("grid")}
                            style={{
                                ...styles.viewButton,
                                ...(viewMode === "grid" ? styles.viewButtonActive : {})
                            }}
                            title="Grid View"
                        >
                            🔲
                        </button>
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
                    {/* Products View */}
                    {viewMode === "table" ? renderTableView() : renderGridView()}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={styles.pagination}>
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                style={{
                                    ...styles.pageButton,
                                    ...(currentPage === 1 ? styles.pageButtonDisabled : {})
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
                                                ...(currentPage === pageNum ? styles.pageNumberActive : {})
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
                                    <button
                                        onClick={() => setCurrentPage(totalPages)}
                                        style={styles.pageNumber}
                                    >
                                        {totalPages}
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                style={{
                                    ...styles.pageButton,
                                    ...(currentPage === totalPages ? styles.pageButtonDisabled : {})
                                }}
                            >
                                Next →
                            </button>
                        </div>
                    )}

                    {/* Footer Info */}
                    <div style={styles.footerInfo}>
                        Showing {startIndex + 1}–{Math.min(endIndex, filteredAndSortedProducts.length)} of {filteredAndSortedProducts.length} products
                    </div>
                </>
            )}

            {/* Barcode/View Modal */}
            {renderBarcodeModal()}
        </div>
    );
}

// ============================================================
// STYLES
// ============================================================
const styles = {
    container: {
        maxWidth: "1440px",
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
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
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
        minWidth: "140px",
    },
    exportButton: {
        padding: "10px 18px",
        background: "#16a34a",
        color: "#fff",
        border: "none",
        borderRadius: "10px",
        fontSize: "13px",
        fontWeight: "600",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        transition: "all 0.2s",
        whiteSpace: "nowrap",
        boxShadow: "0 2px 8px rgba(22, 163, 74, 0.25)",
    },
    viewToggle: {
        display: "flex",
        border: "1px solid #e2e8f0",
        borderRadius: "10px",
        overflow: "hidden",
        background: "#f8fafc",
    },
    viewButton: {
        padding: "8px 14px",
        border: "none",
        background: "transparent",
        cursor: "pointer",
        fontSize: "16px",
        transition: "all 0.2s",
        color: "#94a3b8",
        lineHeight: 1,
    },
    viewButtonActive: {
        background: "#0f172a",
        color: "#fff",
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
        minWidth: "1200px",
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
        cursor: "default",
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
    idBadge: {
        fontSize: "12px",
        fontWeight: "600",
        color: "#94a3b8",
        fontFamily: "monospace",
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
    purchasePrice: {
        color: "#64748b",
        fontSize: "13px",
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
    profitBadge: {
        padding: "4px 12px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "600",
        display: "inline-flex",
        alignItems: "center",
        whiteSpace: "nowrap",
    },
    noProfitBadge: {
        color: "#94a3b8",
        fontSize: "13px",
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
    minStockText: {
        fontSize: "12px",
        color: "#94a3b8",
        fontWeight: "500",
    },
    statusBadge: {
        padding: "4px 14px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "600",
        display: "inline-flex",
        alignItems: "center",
        textTransform: "capitalize",
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
    expiryDateText: {
        fontSize: "10px",
        opacity: 0.7,
        marginLeft: "4px",
        fontWeight: "400",
    },
    actionButtons: {
        display: "flex",
        gap: "6px",
        alignItems: "center",
        justifyContent: "center",
    },
    viewButtonAction: {
        background: "#eff6ff",
        color: "#2563eb",
        padding: "6px 12px",
        border: "none",
        borderRadius: "8px",
        fontSize: "14px",
        transition: "all 0.2s",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 1,
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

    gridContainer: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "20px",
        marginBottom: "24px",
    },
    gridCard: {
        background: "#ffffff",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        overflow: "hidden",
        transition: "all 0.25s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    },
    gridCardHeader: {
        position: "relative",
        height: "160px",
        background: "#f8fafc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderBottom: "1px solid #e2e8f0",
    },
    gridCardImage: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
    },
    gridCardImagePlaceholder: {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "48px",
        color: "#94a3b8",
    },
    gridCardStatus: {
        position: "absolute",
        top: "12px",
        right: "12px",
    },
    gridCardBody: {
        padding: "16px 18px 18px",
    },
    gridCardTitle: {
        fontSize: "16px",
        fontWeight: "700",
        color: "#0f172a",
        margin: "0 0 2px 0",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    gridCardCode: {
        fontSize: "12px",
        color: "#94a3b8",
        fontFamily: "monospace",
        marginBottom: "8px",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    gridCardMeta: {
        display: "flex",
        gap: "8px",
        marginBottom: "12px",
        flexWrap: "wrap",
    },
    gridCardCategory: {
        background: "#f1f5f9",
        padding: "2px 12px",
        borderRadius: "20px",
        fontSize: "12px",
        color: "#475569",
        fontWeight: "500",
    },
    gridCardPrices: {
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "8px",
        padding: "12px 0",
        borderTop: "1px solid #f1f5f9",
        borderBottom: "1px solid #f1f5f9",
        marginBottom: "12px",
    },
    gridCardPriceLabel: {
        fontSize: "10px",
        textTransform: "uppercase",
        color: "#94a3b8",
        fontWeight: "600",
        letterSpacing: "0.3px",
        display: "block",
    },
    gridCardPrice: {
        fontSize: "15px",
        fontWeight: "700",
        color: "#0f172a",
        display: "block",
        marginTop: "1px",
    },
    gridCardStock: {
        marginBottom: "14px",
    },
    gridCardStockInfo: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "6px",
        fontSize: "13px",
        fontWeight: "500",
        color: "#0f172a",
    },
    gridCardStockLabel: {
        fontSize: "11px",
        fontWeight: "600",
    },
    gridCardMinStock: {
        fontSize: "11px",
        color: "#94a3b8",
        marginTop: "4px",
    },
    gridCardActions: {
        display: "flex",
        gap: "8px",
    },
    gridCardView: {
        flex: 1,
        background: "#eff6ff",
        color: "#2563eb",
        border: "none",
        padding: "8px 0",
        cursor: "pointer",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: "600",
        textAlign: "center",
        transition: "all 0.2s",
    },
    gridCardEdit: {
        flex: 1,
        background: "#0f172a",
        color: "#fff",
        padding: "8px 0",
        textDecoration: "none",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: "600",
        textAlign: "center",
        transition: "all 0.2s",
        border: "none",
        cursor: "pointer",
    },
    gridCardDelete: {
        flex: 0.5,
        background: "#fef2f2",
        color: "#dc2626",
        border: "none",
        padding: "8px 0",
        cursor: "pointer",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: "600",
        textAlign: "center",
        transition: "all 0.2s",
    },
    noDataGrid: {
        gridColumn: "1 / -1",
        padding: "60px 20px",
        textAlign: "center",
        color: "#94a3b8",
        fontSize: "16px",
        background: "#f8fafc",
        borderRadius: "12px",
        border: "1px dashed #e2e8f0",
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

    // ─── Modal Styles ──────────────────────────────────────────
    modalOverlay: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
        animation: "fadeIn 0.3s ease",
    },
    modalContent: {
        background: "#ffffff",
        borderRadius: "20px",
        maxWidth: "700px",
        width: "100%",
        maxHeight: "90vh",
        overflow: "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        animation: "slideUp 0.3s ease",
    },
    modalHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 24px",
        borderBottom: "1px solid #e2e8f0",
        background: "#f8fafc",
        borderRadius: "20px 20px 0 0",
    },
    modalTitle: {
        fontSize: "20px",
        fontWeight: "700",
        color: "#0f172a",
        margin: 0,
    },
    modalClose: {
        background: "#f1f5f9",
        border: "none",
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        fontSize: "18px",
        cursor: "pointer",
        color: "#64748b",
        transition: "all 0.2s",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    modalBody: {
        padding: "24px",
    },
    modalImageSection: {
        display: "flex",
        gap: "20px",
        marginBottom: "24px",
        paddingBottom: "24px",
        borderBottom: "1px solid #f1f5f9",
    },
    modalImage: {
        width: "100px",
        height: "100px",
        borderRadius: "12px",
        objectFit: "cover",
        border: "1px solid #e2e8f0",
        flexShrink: 0,
    },
    modalImagePlaceholder: {
        width: "100px",
        height: "100px",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        background: "#f8fafc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "40px",
        flexShrink: 0,
    },
    modalProductInfo: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: "6px",
    },
    modalProductName: {
        fontSize: "20px",
        fontWeight: "700",
        color: "#0f172a",
        margin: 0,
    },
    modalProductMeta: {
        display: "flex",
        gap: "8px",
        alignItems: "center",
        flexWrap: "wrap",
    },
    modalCategory: {
        background: "#f1f5f9",
        padding: "2px 12px",
        borderRadius: "20px",
        fontSize: "13px",
        color: "#475569",
        fontWeight: "500",
    },
    modalProductCode: {
        fontSize: "13px",
        color: "#94a3b8",
        fontFamily: "monospace",
        marginTop: "2px",
    },
    modalBarcodeSection: {
        background: "#f8fafc",
        padding: "20px",
        borderRadius: "12px",
        marginBottom: "24px",
        border: "1px solid #e2e8f0",
        textAlign: "center",
    },
    modalSectionTitle: {
        fontSize: "15px",
        fontWeight: "600",
        color: "#0f172a",
        margin: "0 0 16px 0",
    },
    modalBarcodeWrapper: {
        background: "#ffffff",
        padding: "16px",
        borderRadius: "8px",
        display: "inline-block",
        marginBottom: "12px",
        border: "1px solid #e2e8f0",
    },
    modalBarcodeImage: {
        maxWidth: "280px",
        height: "auto",
        display: "block",
    },
    modalBarcodeInfo: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        flexWrap: "wrap",
    },
    modalBarcodeLabel: {
        fontSize: "13px",
        fontWeight: "500",
        color: "#64748b",
    },
    modalBarcodeValue: {
        fontSize: "16px",
        fontWeight: "700",
        color: "#0f172a",
        fontFamily: "'Courier New', monospace",
        letterSpacing: "1px",
        padding: "2px 12px",
        background: "#ffffff",
        borderRadius: "4px",
        border: "1px solid #e2e8f0",
    },
    copyButton: {
        padding: "4px 12px",
        background: "#eff6ff",
        border: "1px solid #bfdbfe",
        borderRadius: "6px",
        color: "#2563eb",
        fontSize: "13px",
        cursor: "pointer",
        transition: "all 0.2s",
    },
    modalDetailsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "12px",
        marginBottom: "24px",
    },
    modalDetailItem: {
        background: "#f8fafc",
        padding: "12px 16px",
        borderRadius: "10px",
        border: "1px solid #f1f5f9",
    },
    modalDetailLabel: {
        display: "block",
        fontSize: "11px",
        textTransform: "uppercase",
        color: "#94a3b8",
        fontWeight: "600",
        letterSpacing: "0.3px",
        marginBottom: "4px",
    },
    modalDetailValue: {
        fontSize: "16px",
        fontWeight: "600",
        color: "#0f172a",
    },
    modalActions: {
        display: "flex",
        gap: "12px",
        flexWrap: "wrap",
        paddingTop: "20px",
        borderTop: "1px solid #f1f5f9",
    },
    modalEditButton: {
        flex: 1,
        background: "#0f172a",
        color: "#fff",
        padding: "10px 20px",
        textDecoration: "none",
        borderRadius: "10px",
        fontSize: "14px",
        fontWeight: "600",
        textAlign: "center",
        transition: "all 0.2s",
        border: "none",
        cursor: "pointer",
    },
    modalDeleteButton: {
        flex: 1,
        background: "#fef2f2",
        color: "#dc2626",
        border: "none",
        padding: "10px 20px",
        cursor: "pointer",
        borderRadius: "10px",
        fontSize: "14px",
        fontWeight: "600",
        textAlign: "center",
        transition: "all 0.2s",
    },
    modalCloseButton: {
        flex: 1,
        background: "#f1f5f9",
        color: "#475569",
        border: "none",
        padding: "10px 20px",
        cursor: "pointer",
        borderRadius: "10px",
        fontSize: "14px",
        fontWeight: "600",
        textAlign: "center",
        transition: "all 0.2s",
    },
};

// Inject keyframe animations and hover styles
const styleSheet = document.createElement("style");
styleSheet.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    @keyframes slideUp {
        from { opacity: 0; transform: translateY(20px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .sortable:hover {
        color: #0f172a !important;
        cursor: pointer !important;
    }
    .sortable:hover .sort-icon {
        color: #475569 !important;
    }
    .search-box:focus {
        border-color: #0f172a !important;
        box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.08) !important;
        background: #ffffff !important;
    }
    .filter-select:focus {
        border-color: #0f172a !important;
        box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.06) !important;
    }
    .view-button-action:hover {
        background: #dbeafe !important;
        transform: scale(1.05);
    }
    .edit-button:hover {
        background: #e2e8f0 !important;
        transform: scale(1.05);
    }
    .delete-button:hover {
        background: #fecaca !important;
        transform: scale(1.05);
    }
    .add-button:hover {
        background: #1e293b !important;
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(15, 23, 42, 0.2) !important;
    }
    .page-button:hover:not(:disabled) {
        background: #e2e8f0 !important;
        border-color: #cbd5e1 !important;
    }
    .page-number:hover:not(.active) {
        background: #f1f5f9 !important;
    }
    .table-row:hover {
        background: #f8fafc !important;
    }
    .grid-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.06) !important;
        border-color: #cbd5e1 !important;
    }
    .stat-card:hover {
        border-color: #cbd5e1 !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05) !important;
    }
    .clear-button:hover {
        background: #f1f5f9 !important;
        color: #475569 !important;
    }
    .view-button:hover:not(.active) {
        background: #f1f5f9 !important;
        color: #0f172a !important;
    }
    .grid-card-view:hover {
        background: #dbeafe !important;
    }
    .grid-card-edit:hover {
        background: #1e293b !important;
    }
    .grid-card-delete:hover {
        background: #fecaca !important;
    }
    .export-button:hover {
        background: #15803d !important;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3) !important;
    }
    .modal-close:hover {
        background: #e2e8f0 !important;
        transform: rotate(90deg);
    }
    .copy-button:hover {
        background: #dbeafe !important;
    }
    .modal-edit-button:hover {
        background: #1e293b !important;
    }
    .modal-delete-button:hover {
        background: #fecaca !important;
    }
    .modal-close-button:hover {
        background: #e2e8f0 !important;
    }
`;
document.head.appendChild(styleSheet);