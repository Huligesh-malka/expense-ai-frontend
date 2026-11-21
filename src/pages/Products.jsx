import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

/*
  Products / Inventory — Easy Trading Style
  ------------------------------------------------
  - Keeps existing product fields and actions.
  - Uses authenticated API routes without trusting business_id
    from localStorage. Backend should scope queries using req.businessId.
  - View / Edit / Delete are retained.
  - Search, barcode lookup, category filter, stock filter and sorting retained.
*/

const Icons = {
  Search: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  ),
  Scan: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
      <path d="M8 8h8v8H8z" />
    </svg>
  ),
  Plus: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Package: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
    </svg>
  ),
  Alert: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3 2.8 20h18.4L12 3Z" />
      <path d="M12 9v5M12 17h.01" />
    </svg>
  ),
  Check: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
      <path d="m5 12 4 4L19 6" />
    </svg>
  ),
  Edit: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4L16.5 3.5Z" />
    </svg>
  ),
  Eye: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  ),
  Trash: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h16M10 11v6M14 11v6M9 7V4h6v3M6 7l1 14h10l1-14" />
    </svg>
  ),
  ArrowUp: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
      <path d="m6 14 6-6 6 6" />
    </svg>
  ),
  ArrowDown: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
      <path d="m6 10 6 6 6-6" />
    </svg>
  ),
  Refresh: ({ size = 17 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 11a8 8 0 0 0-14.8-4L3 10" />
      <path d="M3 5v5h5M4 13a8 8 0 0 0 14.8 4L21 14" />
      <path d="M21 19v-5h-5" />
    </svg>
  ),
  Close: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  ),
  Chevron: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
};

function money(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function unitLabel(unit) {
  return String(unit || "pcs").toUpperCase();
}

function stockInfo(stock, minStock) {
  const qty = Number(stock || 0);
  const minimum = Number(minStock || 0);

  if (qty <= 0) {
    return { key: "out", label: "Out of stock", short: "OUT", tone: "danger" };
  }
  if (minimum > 0 && qty <= minimum) {
    return { key: "low", label: "Low stock", short: "LOW", tone: "warning" };
  }
  if (minimum > 0 && qty <= minimum * 3) {
    return { key: "medium", label: "Healthy", short: "OK", tone: "info" };
  }
  return { key: "good", label: "In stock", short: "READY", tone: "success" };
}

function expiryInfo(value) {
  if (!value) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(value);
  expiry.setHours(0, 0, 0, 0);

  const days = Math.ceil((expiry - today) / 86400000);

  if (days < 0) return { label: "Expired", tone: "danger" };
  if (days <= 7) return { label: "Expires soon", tone: "warning" };
  if (days <= 30) return { label: "This month", tone: "warning" };
  return { label: "Good", tone: "success" };
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStockStatus, setSelectedStockStatus] = useState("all");

  const [sortField, setSortField] = useState("product_name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const itemsPerPage = 12;

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, selectedStockStatus]);

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);
    window.clearTimeout(showMessage.timer);
    showMessage.timer = window.setTimeout(() => {
      setMessage("");
    }, 3500);
  };

  const loadProducts = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      // Do not send business_id from localStorage.
      // The backend should scope the request using authenticated req.businessId.
      const res = await API.get("/products");
      const rows = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data?.products)
          ? res.data.products
          : [];
      setProducts(rows);
    } catch (err) {
      console.error("Error loading products:", err);
      showMessage(
        err.response?.data?.message || "Could not load your products",
        "error"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const deleteProduct = async (id, name) => {
    const confirmed = window.confirm(
      `Delete "${name || "this product"}" from your inventory?\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await API.delete(`/products/${id}`);
      setProducts((current) => current.filter((product) => product.id !== id));
      if (selectedProduct?.id === id) {
        setShowDetails(false);
        setSelectedProduct(null);
      }
      showMessage("Product deleted successfully");
    } catch (err) {
      console.error("Error deleting product:", err);
      showMessage(
        err.response?.data?.message || "Could not delete product",
        "error"
      );
    }
  };

  const viewProductDetails = async (id) => {
    try {
      const res = await API.get(`/products/${id}`);
      setSelectedProduct(res.data?.data || null);
      setShowDetails(true);
    } catch (err) {
      console.error("Error fetching product details:", err);
      showMessage("Could not load product details", "error");
    }
  };

  const handleBarcodeSearch = async () => {
    const barcode = barcodeInput.trim();
    if (!barcode) {
      showMessage("Enter or scan a barcode first", "error");
      return;
    }

    try {
      const res = await API.get(`/products/barcode/${encodeURIComponent(barcode)}`);

      if (res.data?.data) {
        const product = res.data.data;
        setSearch(product.product_name || product.product_code || "");
        setBarcodeInput("");
        showMessage(`Found ${product.product_name || "product"}`);
      } else {
        showMessage("Product not found", "error");
      }
    } catch (err) {
      console.error("Error searching by barcode:", err);
      showMessage("No product found for this barcode", "error");
    }
  };

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        products
          .map((product) => product.category)
          .filter(Boolean)
      )
    ).sort((a, b) => String(a).localeCompare(String(b)));
  }, [products]);

  const stats = useMemo(() => {
    const total = products.length;
    const low = products.filter(
      (p) => stockInfo(p.stock, p.min_stock).key === "low"
    ).length;
    const out = products.filter(
      (p) => stockInfo(p.stock, p.min_stock).key === "out"
    ).length;
    const healthy = products.filter((p) => {
      const key = stockInfo(p.stock, p.min_stock).key;
      return key === "good" || key === "medium";
    }).length;

    const stockValue = products.reduce((sum, p) => {
      return sum + Number(p.stock || 0) * Number(p.purchase_price || 0);
    }, 0);

    return { total, low, out, healthy, stockValue };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = products.filter((product) => {
      const matchesSearch =
        !query ||
        String(product.product_name || "").toLowerCase().includes(query) ||
        String(product.product_code || "").toLowerCase().includes(query) ||
        String(product.barcode || "").toLowerCase().includes(query);

      const matchesCategory =
        selectedCategory === "all" ||
        String(product.category || "") === selectedCategory;

      const status = stockInfo(product.stock, product.min_stock);

      const matchesStock =
        selectedStockStatus === "all" ||
        (selectedStockStatus === "in_stock" &&
          (status.key === "good" || status.key === "medium")) ||
        (selectedStockStatus === "low_stock" && status.key === "low") ||
        (selectedStockStatus === "out_of_stock" && status.key === "out");

      return matchesSearch && matchesCategory && matchesStock;
    });

    result.sort((a, b) => {
      let left = a[sortField] ?? "";
      let right = b[sortField] ?? "";

      if (
        ["selling_price", "purchase_price", "stock", "min_stock"].includes(
          sortField
        )
      ) {
        left = Number(left) || 0;
        right = Number(right) || 0;
      } else if (sortField === "expiry_date") {
        left = left ? new Date(left).getTime() : 0;
        right = right ? new Date(right).getTime() : 0;
      } else {
        left = String(left).toLowerCase();
        right = String(right).toLowerCase();
      }

      if (left < right) return sortDirection === "asc" ? -1 : 1;
      if (left > right) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [
    products,
    search,
    selectedCategory,
    selectedStockStatus,
    sortField,
    sortDirection,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / itemsPerPage)
  );

  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const currentProducts = filteredProducts.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortIndicator = (field) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <Icons.ArrowUp size={12} />
    ) : (
      <Icons.ArrowDown size={12} />
    );
  };

  const resetFilters = () => {
    setSearch("");
    setBarcodeInput("");
    setSelectedCategory("all");
    setSelectedStockStatus("all");
    setCurrentPage(1);
  };

  return (
    <div className="products-page">
      <div className="products-shell">
        <header className="products-topbar">
          <div>
            <div className="eyebrow">
              <span className="live-dot" />
              INVENTORY CONTROL
            </div>
            <h1>Products</h1>
            <p>Manage your stock, pricing and product availability.</p>
          </div>

          <div className="topbar-actions">
            <button
              className="refresh-button"
              onClick={() => loadProducts(true)}
              disabled={refreshing}
              title="Refresh products"
            >
              <Icons.Refresh size={16} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>

            <Link className="primary-button" to="/add-product">
              <Icons.Plus size={18} />
              Add product
            </Link>
          </div>
        </header>

        {message && (
          <div className={`toast ${messageType === "error" ? "toast-error" : "toast-success"}`}>
            <span>{message}</span>
            <button onClick={() => setMessage("")} aria-label="Close message">
              <Icons.Close size={15} />
            </button>
          </div>
        )}

        <section className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-icon kpi-blue">
              <Icons.Package size={20} />
            </div>
            <div>
              <span className="kpi-label">Total products</span>
              <strong>{stats.total}</strong>
              <small>Products in your catalog</small>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon kpi-green">
              <Icons.Check size={20} />
            </div>
            <div>
              <span className="kpi-label">Healthy stock</span>
              <strong>{stats.healthy}</strong>
              <small>Ready to sell</small>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon kpi-yellow">
              <Icons.Alert size={20} />
            </div>
            <div>
              <span className="kpi-label">Low stock</span>
              <strong>{stats.low}</strong>
              <small>Needs restocking</small>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon kpi-red">
              <Icons.Alert size={20} />
            </div>
            <div>
              <span className="kpi-label">Out of stock</span>
              <strong>{stats.out}</strong>
              <small>Cannot sell now</small>
            </div>
          </div>
        </section>

        <section className="command-panel">
          <div className="command-heading">
            <div>
              <span className="section-kicker">INVENTORY WORKSPACE</span>
              <h2>Find and manage products</h2>
            </div>
            <span className="result-count">
              {filteredProducts.length} result{filteredProducts.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="command-grid">
            <label className="search-control">
              <Icons.Search size={18} />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search product, code or barcode..."
                autoComplete="off"
              />
              {search && (
                <button
                  type="button"
                  className="input-clear"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <Icons.Close size={14} />
                </button>
              )}
            </label>

            <div className="barcode-control">
              <Icons.Scan size={18} />
              <input
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleBarcodeSearch();
                }}
                placeholder="Scan barcode..."
                autoComplete="off"
              />
              <button type="button" onClick={handleBarcodeSearch}>
                Scan
              </button>
            </div>

            <label className="select-control">
              <span>Category</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <Icons.Chevron size={15} />
            </label>

            <label className="select-control">
              <span>Stock</span>
              <select
                value={selectedStockStatus}
                onChange={(e) => setSelectedStockStatus(e.target.value)}
              >
                <option value="all">All stock</option>
                <option value="in_stock">Healthy</option>
                <option value="low_stock">Low stock</option>
                <option value="out_of_stock">Out of stock</option>
              </select>
              <Icons.Chevron size={15} />
            </label>

            {(search || selectedCategory !== "all" || selectedStockStatus !== "all") && (
              <button className="reset-button" type="button" onClick={resetFilters}>
                Reset
              </button>
            )}
          </div>
        </section>

        <section className="inventory-card">
          <div className="inventory-card-header">
            <div>
              <span className="section-kicker">CATALOG</span>
              <h2>All products</h2>
            </div>
            <div className="inventory-header-right">
              <span className="stock-value">
                Stock value <strong>{money(stats.stockValue)}</strong>
              </span>
              <Link to="/add-product" className="small-add">
                <Icons.Plus size={15} /> Add
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="loading-box">
              <div className="spinner" />
              <strong>Loading inventory</strong>
              <span>Getting your latest products...</span>
            </div>
          ) : currentProducts.length === 0 ? (
            <div className="empty-box">
              <div className="empty-icon">
                <Icons.Package size={28} />
              </div>
              <h3>{products.length === 0 ? "Your catalog is empty" : "No products found"}</h3>
              <p>
                {products.length === 0
                  ? "Add your first product to start billing and tracking stock."
                  : "Try changing the search or filters."}
              </p>
              {products.length === 0 ? (
                <Link to="/add-product" className="primary-button">
                  <Icons.Plus size={17} />
                  Add your first product
                </Link>
              ) : (
                <button className="secondary-button" onClick={resetFilters}>
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="table-scroll">
                <table className="products-table">
                  <thead>
                    <tr>
                      <th onClick={() => handleSort("product_name")}>
                        <span>Product</span>{sortIndicator("product_name")}
                      </th>
                      <th onClick={() => handleSort("category")}>
                        <span>Category</span>{sortIndicator("category")}
                      </th>
                      <th onClick={() => handleSort("selling_price")}>
                        <span>Selling price</span>{sortIndicator("selling_price")}
                      </th>
                      <th onClick={() => handleSort("stock")}>
                        <span>Stock</span>{sortIndicator("stock")}
                      </th>
                      <th onClick={() => handleSort("expiry_date")}>
                        <span>Expiry</span>{sortIndicator("expiry_date")}
                      </th>
                      <th>Status</th>
                      <th className="actions-heading">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {currentProducts.map((product) => {
                      const status = stockInfo(product.stock, product.min_stock);
                      const expiry = expiryInfo(product.expiry_date);
                      const unit = unitLabel(product.unit);
                      const quantity = Number(product.stock || 0);
                      const formattedQuantity = Number.isInteger(quantity)
                        ? quantity
                        : quantity.toFixed(2);

                      return (
                        <tr key={product.id}>
                          <td>
                            <div className="product-cell">
                              {product.image ? (
                                <img
                                  src={product.image}
                                  alt=""
                                  className="product-avatar"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="product-avatar product-avatar-fallback">
                                  {(product.product_name || "?")[0].toUpperCase()}
                                </div>
                              )}

                              <div className="product-main">
                                <strong>{product.product_name || "Unnamed product"}</strong>
                                <div className="product-meta">
                                  {product.product_code && <span>{product.product_code}</span>}
                                  {product.barcode && <span>Barcode {product.barcode}</span>}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td>
                            <span className="category-pill">
                              {product.category || "Other"}
                            </span>
                          </td>

                          <td>
                            <div className="price-cell">
                              <strong>{money(product.selling_price)}</strong>
                              <span>
                                / {product.price_per || 1} {unitLabel(product.price_unit)}
                              </span>
                              {Number(product.purchase_price || 0) > 0 && (
                                <small>Cost {money(product.purchase_price)}</small>
                              )}
                            </div>
                          </td>

                          <td>
                            <div className="stock-cell-modern">
                              <strong>{formattedQuantity}</strong>
                              <span>{unit}</span>
                              <span className={`status-chip ${status.tone}`}>
                                {status.short}
                              </span>
                            </div>
                          </td>

                          <td>
                            {product.expiry_date ? (
                              <div className="expiry-cell">
                                <strong>
                                  {new Date(product.expiry_date).toLocaleDateString("en-IN")}
                                </strong>
                                <span className={`mini-chip ${expiry?.tone || "success"}`}>
                                  {expiry?.label}
                                </span>
                              </div>
                            ) : (
                              <span className="muted">—</span>
                            )}
                          </td>

                          <td>
                            <span
                              className={`active-chip ${
                                product.status === "active" ? "active" : "inactive"
                              }`}
                            >
                              <span />
                              {product.status === "active" ? "Active" : "Inactive"}
                            </span>
                          </td>

                          <td>
                            <div className="row-actions">
                              <button
                                className="icon-action view"
                                onClick={() => viewProductDetails(product.id)}
                                title="View product"
                                aria-label={`View ${product.product_name}`}
                              >
                                <Icons.Eye size={16} />
                              </button>

                              <Link
                                className="icon-action edit"
                                to={`/edit-product/${product.id}`}
                                title="Edit product"
                                aria-label={`Edit ${product.product_name}`}
                              >
                                <Icons.Edit size={16} />
                              </Link>

                              <button
                                className="icon-action delete"
                                onClick={() =>
                                  deleteProduct(product.id, product.product_name)
                                }
                                title="Delete product"
                                aria-label={`Delete ${product.product_name}`}
                              >
                                <Icons.Trash size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="table-footer">
                <span>
                  Showing <strong>{startIndex + 1}</strong>–
                  <strong>{Math.min(startIndex + itemsPerPage, filteredProducts.length)}</strong>{" "}
                  of <strong>{filteredProducts.length}</strong>
                </span>

                <div className="pagination">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                  >
                    Previous
                  </button>

                  {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
                    let page = index + 1;

                    if (totalPages > 5) {
                      if (safePage <= 3) page = index + 1;
                      else if (safePage >= totalPages - 2) {
                        page = totalPages - 4 + index;
                      } else {
                        page = safePage - 2 + index;
                      }
                    }

                    return (
                      <button
                        key={page}
                        className={safePage === page ? "current" : ""}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    );
                  })}

                  {totalPages > 5 && safePage < totalPages - 2 && (
                    <>
                      <span>…</span>
                      <button onClick={() => setCurrentPage(totalPages)}>
                        {totalPages}
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {showDetails && selectedProduct && (
        <div className="modal-backdrop" onClick={() => setShowDetails(false)}>
          <div className="product-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top">
              <div>
                <span className="section-kicker">PRODUCT PROFILE</span>
                <h2>{selectedProduct.product_name}</h2>
              </div>
              <button
                className="modal-close"
                onClick={() => setShowDetails(false)}
                aria-label="Close"
              >
                <Icons.Close size={19} />
              </button>
            </div>

            <div className="modal-content">
              <div className="modal-product-summary">
                {selectedProduct.image ? (
                  <img
                    src={selectedProduct.image}
                    alt=""
                    className="modal-image"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="modal-image modal-image-fallback">
                    {(selectedProduct.product_name || "?")[0].toUpperCase()}
                  </div>
                )}

                <div>
                  <h3>{selectedProduct.product_name}</h3>
                  <p>
                    {selectedProduct.product_code
                      ? `Code: ${selectedProduct.product_code}`
                      : "Product"}
                  </p>

                  <div className="modal-pills">
                    <span className="category-pill">
                      {selectedProduct.category || "Other"}
                    </span>
                    <span
                      className={`active-chip ${
                        selectedProduct.status === "active" ? "active" : "inactive"
                      }`}
                    >
                      <span />
                      {selectedProduct.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="detail-cards">
                <div className="detail-card">
                  <span>Selling price</span>
                  <strong>{money(selectedProduct.selling_price)}</strong>
                  <small>
                    Per {selectedProduct.price_per || 1}{" "}
                    {unitLabel(selectedProduct.price_unit)}
                  </small>
                </div>

                <div className="detail-card">
                  <span>Current stock</span>
                  <strong>
                    {Number(selectedProduct.stock || 0)}{" "}
                    {unitLabel(selectedProduct.unit)}
                  </strong>
                  <small>
                    Minimum {selectedProduct.min_stock || 0}{" "}
                    {unitLabel(selectedProduct.unit)}
                  </small>
                </div>

                <div className="detail-card">
                  <span>Purchase price</span>
                  <strong>{money(selectedProduct.purchase_price)}</strong>
                  <small>Current recorded cost</small>
                </div>

                <div className="detail-card">
                  <span>Tax</span>
                  <strong>{Number(selectedProduct.tax || 0)}%</strong>
                  <small>Configured tax rate</small>
                </div>
              </div>

              <div className="detail-list">
                <div>
                  <span>Barcode</span>
                  <strong>{selectedProduct.barcode || "Not set"}</strong>
                </div>
                <div>
                  <span>Expiry</span>
                  <strong>
                    {selectedProduct.expiry_date
                      ? new Date(selectedProduct.expiry_date).toLocaleDateString("en-IN")
                      : "No expiry"}
                  </strong>
                </div>
                <div>
                  <span>Description</span>
                  <strong>{selectedProduct.description || "No description"}</strong>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() => setShowDetails(false)}
              >
                Close
              </button>
              <Link
                className="primary-button"
                to={`/edit-product/${selectedProduct.id}`}
                onClick={() => setShowDetails(false)}
              >
                <Icons.Edit size={16} />
                Edit product
              </Link>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap');

        :root {
          --p-bg: #f6f8fc;
          --p-card: #ffffff;
          --p-text: #101828;
          --p-muted: #64748b;
          --p-line: #e7edf5;
          --p-dark: #0f172a;
          --p-dark-2: #18233a;
          --p-lime: #b7f000;
          --p-blue: #3978ff;
          --p-green: #0f8b83;
          --p-green-light: #ecfdf5;
          --p-yellow: #f2a900;
          --p-red: #ef476f;
          --p-purple: #7c5cff;
          --p-teal: #0f8b83;
          --p-teal-soft: #f0fdfa;
          --p-teal-border: #c8eee8;
          --p-radius: 22px;
          --p-radius-sm: 14px;
          --p-shadow: 0 10px 30px rgba(15,23,42,.045);
          --p-shadow-hover: 0 14px 34px rgba(15,23,42,.08);
          --p-transition: .2s cubic-bezier(.4,0,.2,1);
        }

        * {
          box-sizing: border-box;
        }

        .products-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 88% 2%, rgba(14,165,164,.07), transparent 25%),
            radial-gradient(circle at 8% 4%, rgba(99,102,241,.045), transparent 24%),
            var(--p-bg);
          color: var(--p-text);
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        .products-shell {
          width: min(1460px, calc(100% - 40px));
          margin: 0 auto;
          padding: 28px 0 70px;
        }

        /* ---------- Topbar ---------- */
        .products-topbar {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 26px;
        }

        .eyebrow,
        .section-kicker {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #69768b;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.6px;
          text-transform: uppercase;
        }

        .live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--p-green);
          box-shadow: 0 0 0 4px rgba(15,139,131,.12);
          animation: livePulse 2s infinite;
        }

        @keyframes livePulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(15,139,131,.12); }
          50% { box-shadow: 0 0 0 6px rgba(15,139,131,.06); }
        }

        .products-topbar h1 {
          margin: 8px 0 6px;
          font-size: clamp(32px, 4vw, 44px);
          line-height: 1;
          letter-spacing: -1.8px;
          font-weight: 800;
          color: #101828;
        }

        .products-topbar p {
          margin: 0;
          color: var(--p-muted);
          font-size: 14px;
          letter-spacing: -.1px;
        }

        .topbar-actions {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-shrink: 0;
        }

        /* ---------- Buttons ---------- */
        .primary-button,
        .refresh-button,
        .secondary-button,
        .small-add {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 12px;
          min-height: 44px;
          padding: 0 18px;
          font: inherit;
          font-size: 13px;
          font-weight: 750;
          text-decoration: none;
          cursor: pointer;
          transition: var(--p-transition);
          white-space: nowrap;
          border: 1px solid transparent;
        }

        .primary-button {
          background: var(--p-green);
          color: #ffffff;
          border-color: var(--p-green);
          box-shadow: 0 6px 16px rgba(15,139,131,.22);
        }

        .primary-button:hover {
          background: #0b726c;
          transform: translateY(-1px);
          box-shadow: 0 10px 24px rgba(15,139,131,.28);
        }

        .refresh-button,
        .secondary-button {
          background: #ffffff;
          color: #253047;
          border: 1px solid var(--p-line);
          box-shadow: 0 2px 6px rgba(15,23,42,.03);
        }

        .refresh-button:hover,
        .secondary-button:hover {
          border-color: #cbd5e1;
          background: #fafbfd;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(15,23,42,.06);
        }

        .refresh-button:disabled {
          opacity: .6;
          cursor: wait;
        }

        /* ---------- Toast ---------- */
        .toast {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 18px;
          margin-bottom: 20px;
          border-radius: var(--p-radius-sm);
          font-size: 13px;
          font-weight: 650;
          border: 1px solid;
          animation: toastSlide .25s ease;
        }

        @keyframes toastSlide {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .toast-success {
          color: #087a55;
          background: var(--p-green-light);
          border-color: #bbf7d0;
        }

        .toast-error {
          color: #b42346;
          background: #fff0f3;
          border-color: #ffd0da;
        }

        .toast button {
          border: 0;
          background: transparent;
          color: currentColor;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          display: flex;
          transition: .15s ease;
        }

        .toast button:hover {
          background: rgba(0,0,0,.06);
        }

        /* ---------- KPI ---------- */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 22px;
        }

        .kpi-card {
          min-height: 122px;
          padding: 22px;
          background: var(--p-card);
          border: 1px solid var(--p-line);
          border-radius: var(--p-radius);
          box-shadow: var(--p-shadow);
          display: flex;
          gap: 16px;
          align-items: flex-start;
          transition: transform var(--p-transition), box-shadow var(--p-transition);
          position: relative;
          overflow: hidden;
        }

        .kpi-card::after {
          content: '';
          position: absolute;
          right: -20px;
          top: -20px;
          width: 100px;
          height: 100px;
          border-radius: 50%;
          opacity: .04;
          background: currentColor;
          pointer-events: none;
        }

        .kpi-card:hover {
          transform: translateY(-3px);
          box-shadow: var(--p-shadow-hover);
        }

        .kpi-icon {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          transition: transform .2s ease;
        }

        .kpi-card:hover .kpi-icon {
          transform: scale(1.06);
        }

        .kpi-blue { color: var(--p-blue); background: #eaf1ff; }
        .kpi-green { color: var(--p-green); background: #e6faf3; }
        .kpi-yellow { color: var(--p-yellow); background: #fff6dc; }
        .kpi-red { color: var(--p-red); background: #fff0f3; }

        .kpi-label {
          display: block;
          color: #758197;
          font-size: 11px;
          font-weight: 650;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: .4px;
        }

        .kpi-card strong {
          display: block;
          font-size: 28px;
          line-height: 1.1;
          letter-spacing: -.8px;
          color: #101828;
        }

        .kpi-card small {
          display: block;
          color: #94a3b8;
          font-size: 11px;
          margin-top: 6px;
        }

        /* ---------- Command panel ---------- */
        .command-panel {
          background: #ffffff;
          border: 1px solid var(--p-line);
          border-radius: var(--p-radius);
          padding: 24px;
          box-shadow: var(--p-shadow);
          margin-bottom: 22px;
        }

        .command-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 20px;
        }

        .command-panel .section-kicker {
          color: var(--p-teal);
        }

        .command-heading h2,
        .inventory-card-header h2 {
          margin: 6px 0 0;
          font-size: 21px;
          font-weight: 750;
          letter-spacing: -.5px;
          color: #172033;
        }

        .result-count {
          background: var(--p-teal-soft);
          color: #0f766e;
          border: 1px solid var(--p-teal-border);
          border-radius: 999px;
          padding: 8px 14px;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        .command-grid {
          display: grid;
          grid-template-columns: minmax(240px, 1.7fr) minmax(220px, 1.15fr) 165px 165px auto;
          gap: 12px;
          align-items: center;
        }

        .search-control,
        .barcode-control,
        .select-control {
          height: 50px;
          background: #f8fafc;
          border: 1px solid #e3eaf3;
          border-radius: 13px;
          display: flex;
          align-items: center;
          position: relative;
          transition: border-color var(--p-transition), box-shadow var(--p-transition), background var(--p-transition);
        }

        .search-control:focus-within,
        .barcode-control:focus-within,
        .select-control:focus-within {
          background: #ffffff;
          border-color: #67c9bd;
          box-shadow: 0 0 0 3px rgba(15,139,131,.10);
        }

        .search-control {
          padding: 0 14px;
          gap: 10px;
          color: #94a3b8;
        }

        .search-control input,
        .barcode-control input {
          width: 100%;
          min-width: 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: #172033;
          font: inherit;
          font-size: 13px;
          font-weight: 500;
        }

        .search-control input::placeholder,
        .barcode-control input::placeholder {
          color: #94a3b8;
          font-weight: 400;
        }

        .input-clear {
          border: 0;
          background: transparent;
          color: #94a3b8;
          cursor: pointer;
          padding: 5px;
          border-radius: 6px;
          display: flex;
          transition: .15s ease;
        }

        .input-clear:hover {
          background: #eef2f7;
          color: #475569;
        }

        .barcode-control {
          padding-left: 14px;
          gap: 9px;
          color: #94a3b8;
        }

        .barcode-control button {
          height: 100%;
          border: 0;
          border-left: 1px solid #e3eaf3;
          background: var(--p-green);
          color: #ffffff;
          padding: 0 16px;
          font: inherit;
          font-size: 12px;
          font-weight: 750;
          cursor: pointer;
          border-radius: 0 12px 12px 0;
          transition: background .18s ease;
          letter-spacing: .2px;
        }

        .barcode-control button:hover {
          background: #0b726c;
        }

        .select-control {
          padding: 0 12px;
          gap: 5px;
          color: #94a3b8;
        }

        .select-control span {
          position: absolute;
          top: 6px;
          left: 12px;
          font-size: 8px;
          text-transform: uppercase;
          letter-spacing: 1.1px;
          font-weight: 800;
          color: #64748b;
        }

        .select-control select {
          width: 100%;
          height: 100%;
          padding: 14px 20px 0 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: #172033;
          appearance: none;
          font: inherit;
          font-size: 12px;
          font-weight: 650;
          cursor: pointer;
        }

        .select-control svg {
          position: absolute;
          right: 9px;
          bottom: 12px;
          pointer-events: none;
          color: #94a3b8;
        }

        .select-control option {
          color: #111827;
          background: white;
          font-weight: 500;
        }

        .reset-button {
          height: 50px;
          padding: 0 16px;
          border-radius: 12px;
          border: 1px solid #e3eaf3;
          color: #64748b;
          background: #ffffff;
          cursor: pointer;
          font: inherit;
          font-size: 12px;
          font-weight: 700;
          transition: .18s ease;
        }

        .reset-button:hover {
          background: #f1f5f9;
          color: #334155;
          border-color: #cbd5e1;
        }

        /* ---------- Inventory card ---------- */
        .inventory-card {
          background: #ffffff;
          border: 1px solid var(--p-line);
          border-radius: var(--p-radius);
          overflow: hidden;
          box-shadow: var(--p-shadow);
        }

        .inventory-card-header {
          min-height: 82px;
          padding: 22px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          border-bottom: 1px solid #edf1f6;
        }

        .inventory-card-header .section-kicker {
          color: #8994a7;
        }

        .inventory-header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .stock-value {
          color: #64748b;
          font-size: 12px;
          white-space: nowrap;
        }

        .stock-value strong {
          color: #172033;
          font-family: "JetBrains Mono", monospace;
          font-size: 14px;
          margin-left: 6px;
        }

        .small-add {
          min-height: 40px;
          padding: 0 14px;
          background: var(--p-green-light);
          color: #087a55;
          border: 1px solid #bbf7d0;
          border-radius: 11px;
          font-size: 12px;
        }

        .small-add:hover {
          background: #d9fbe8;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(15,139,131,.12);
        }

        /* ---------- Table ---------- */
        .table-scroll {
          width: 100%;
          overflow-x: auto;
          scrollbar-width: thin;
        }

        .products-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1040px;
        }

        .products-table thead {
          background: #f8fafc;
        }

        .products-table th {
          height: 50px;
          padding: 0 18px;
          text-align: left;
          color: #64748b;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 1.1px;
          font-weight: 800;
          border-bottom: 1px solid #e9eef5;
          white-space: nowrap;
          cursor: pointer;
          user-select: none;
          transition: color .15s ease;
        }

        .products-table th > span {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .products-table th:hover {
          color: #2f3d56;
        }

        .products-table th.actions-heading {
          text-align: right;
          cursor: default;
        }

        .products-table td {
          padding: 18px;
          border-bottom: 1px solid #edf1f6;
          vertical-align: middle;
          font-size: 12px;
        }

        .products-table tbody tr {
          transition: background .15s ease;
        }

        .products-table tbody tr:hover {
          background: #f8fbff;
        }

        .products-table tbody tr:last-child td {
          border-bottom: 0;
        }

        .product-cell {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 230px;
        }

        .product-avatar {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          object-fit: cover;
          border: 1px solid #e1e7ef;
          flex: 0 0 auto;
          background: #f8fafc;
        }

        .product-avatar-fallback {
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #eff5ff, #e8edff);
          color: #5067b5;
          font-weight: 800;
          font-size: 15px;
        }

        .product-main strong {
          display: block;
          max-width: 260px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #172033;
          font-size: 13px;
          font-weight: 750;
          transition: color .15s ease;
        }

        .products-table tbody tr:hover .product-main strong {
          color: var(--p-teal);
        }

        .product-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 5px;
          color: #94a3b8;
          font-size: 9.5px;
          font-family: "JetBrains Mono", monospace;
          letter-spacing: .1px;
        }

        .product-meta span + span {
          border-left: 1px solid #dce2ea;
          padding-left: 8px;
        }

        .category-pill {
          display: inline-flex;
          align-items: center;
          min-height: 28px;
          padding: 0 10px;
          border-radius: 999px;
          background: #f1f5f9;
          color: #475569;
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
        }

        .price-cell {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 108px;
        }

        .price-cell strong {
          color: #172033;
          font-family: "JetBrains Mono", monospace;
          font-size: 13.5px;
          font-weight: 700;
        }

        .price-cell span {
          color: #94a3b8;
          font-size: 9.5px;
        }

        .price-cell small {
          color: #b0b8c5;
          font-size: 9.5px;
        }

        .stock-cell-modern {
          display: grid;
          grid-template-columns: auto auto;
          gap: 3px 6px;
          align-items: center;
          width: max-content;
        }

        .stock-cell-modern strong {
          color: #172033;
          font-family: "JetBrains Mono", monospace;
          font-size: 13.5px;
          font-weight: 700;
          text-align: right;
        }

        .stock-cell-modern > span:not(.status-chip) {
          color: #94a3b8;
          font-size: 9.5px;
          text-transform: uppercase;
          font-weight: 600;
        }

        .status-chip,
        .mini-chip {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: fit-content;
          border-radius: 999px;
          font-size: 8px;
          line-height: 1;
          font-weight: 850;
          letter-spacing: .5px;
          text-transform: uppercase;
        }

        .status-chip {
          grid-column: 1 / -1;
          padding: 5px 8px;
        }

        .status-chip.success,
        .mini-chip.success {
          color: #087a55;
          background: #e7f8f1;
        }

        .status-chip.warning,
        .mini-chip.warning {
          color: #a86c00;
          background: #fff4d6;
        }

        .status-chip.danger,
        .mini-chip.danger {
          color: #c22f55;
          background: #ffe9ef;
        }

        .status-chip.info {
          color: #3268ca;
          background: #eaf1ff;
        }

        .expiry-cell {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .expiry-cell strong {
          color: #3a465a;
          font-size: 11.5px;
          font-weight: 650;
        }

        .mini-chip {
          padding: 5px 8px;
        }

        .muted {
          color: #cbd5e1;
          font-size: 14px;
        }

        .active-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 9.5px;
          font-weight: 750;
          white-space: nowrap;
        }

        .active-chip > span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .active-chip.active {
          color: #087a55;
          background: #e8f8f2;
        }

        .active-chip.active > span {
          background: #12b981;
        }

        .active-chip.inactive {
          color: #7b8494;
          background: #f0f2f5;
        }

        .active-chip.inactive > span {
          background: #8d96a5;
        }

        /* ---------- Row actions ---------- */
        .row-actions {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 7px;
        }

        .icon-action {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          border: 1px solid;
          cursor: pointer;
          text-decoration: none;
          transition: transform .15s ease, box-shadow .15s ease;
        }

        .icon-action:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(15,23,42,.10);
        }

        .icon-action.view {
          color: #3268ca;
          background: #eef4ff;
          border-color: #dce8ff;
        }

        .icon-action.view:hover {
          background: #e0ebff;
        }

        .icon-action.edit {
          color: #087a55;
          background: #eafaf4;
          border-color: #d1f0e3;
        }

        .icon-action.edit:hover {
          background: #d9fbe8;
        }

        .icon-action.delete {
          color: #d13b5d;
          background: #fff0f3;
          border-color: #ffdce4;
        }

        .icon-action.delete:hover {
          background: #ffe0e8;
        }

        /* ---------- Footer / Pagination ---------- */
        .table-footer {
          min-height: 66px;
          padding: 14px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          border-top: 1px solid var(--p-line);
          color: #94a3b8;
          font-size: 11.5px;
        }

        .table-footer strong {
          color: #47536a;
          font-weight: 700;
        }

        .pagination {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .pagination button {
          min-width: 33px;
          height: 33px;
          padding: 0 9px;
          border-radius: 9px;
          border: 1px solid #e2e7ef;
          background: white;
          color: #5c687d;
          font: inherit;
          font-size: 10.5px;
          font-weight: 700;
          cursor: pointer;
          transition: .15s ease;
        }

        .pagination button:hover:not(:disabled) {
          border-color: #cbd4e2;
          background: #f8fafc;
        }

        .pagination button.current {
          color: #ffffff;
          background: var(--p-green);
          border-color: var(--p-green);
          box-shadow: 0 3px 8px rgba(15,139,131,.25);
        }

        .pagination button:disabled {
          opacity: .35;
          cursor: not-allowed;
        }

        .pagination span {
          color: #94a3b8;
          padding: 0 2px;
        }

        /* ---------- Loading / Empty ---------- */
        .loading-box,
        .empty-box {
          min-height: 380px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 56px 24px;
          text-align: center;
        }

        .spinner {
          width: 38px;
          height: 38px;
          border: 3px solid #e9edf3;
          border-top-color: var(--p-green);
          border-radius: 50%;
          animation: productsSpin .7s linear infinite;
          margin-bottom: 18px;
        }

        @keyframes productsSpin {
          to { transform: rotate(360deg); }
        }

        .loading-box strong {
          font-size: 14px;
          color: #475569;
        }

        .loading-box span,
        .empty-box p {
          color: #94a3b8;
          font-size: 12.5px;
          margin: 7px 0 0;
        }

        .empty-icon {
          width: 62px;
          height: 62px;
          display: grid;
          place-items: center;
          border-radius: 18px;
          background: #eef4ff;
          color: #3978ff;
          margin-bottom: 16px;
        }

        .empty-box h3 {
          margin: 0;
          font-size: 19px;
          color: #172033;
        }

        .empty-box .primary-button,
        .empty-box .secondary-button {
          margin-top: 20px;
        }

        /* ---------- Modal ---------- */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 2000;
          padding: 20px;
          display: grid;
          place-items: center;
          background: rgba(7, 12, 24, .62);
          backdrop-filter: blur(10px);
          animation: modalFade .2s ease;
        }

        @keyframes modalFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .product-modal {
          width: min(780px, 100%);
          max-height: min(840px, 92vh);
          overflow: auto;
          background: #fff;
          border: 1px solid rgba(255,255,255,.4);
          border-radius: 22px;
          box-shadow: 0 30px 90px rgba(0,0,0,.28);
          animation: modalSlide .25s cubic-bezier(.16,1,.3,1);
        }

        @keyframes modalSlide {
          from { opacity: 0; transform: translateY(16px) scale(.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .modal-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 22px 24px;
          border-bottom: 1px solid var(--p-line);
          position: sticky;
          top: 0;
          background: rgba(255,255,255,.95);
          backdrop-filter: blur(10px);
          z-index: 2;
        }

        .modal-top .section-kicker {
          color: #8a95a7;
        }

        .modal-top h2 {
          margin: 6px 0 0;
          font-size: 22px;
          letter-spacing: -.5px;
          color: #101828;
        }

        .modal-close {
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          border: 1px solid #e1e6ee;
          background: #f8fafc;
          color: #667289;
          cursor: pointer;
          transition: .15s ease;
        }

        .modal-close:hover {
          background: #eef2f7;
          color: #334155;
        }

        .modal-content {
          padding: 24px;
        }

        .modal-product-summary {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px;
          border: 1px solid var(--p-line);
          border-radius: 16px;
          background: #f9fbfd;
        }

        .modal-image {
          width: 80px;
          height: 80px;
          border-radius: 14px;
          object-fit: cover;
          border: 1px solid #e0e6ef;
          flex: 0 0 auto;
        }

        .modal-image-fallback {
          display: grid;
          place-items: center;
          background: #eaf1ff;
          color: #456cc1;
          font-size: 28px;
          font-weight: 800;
        }

        .modal-product-summary h3 {
          margin: 0;
          font-size: 18px;
          color: #101828;
        }

        .modal-product-summary p {
          color: #8a95a7;
          margin: 5px 0 10px;
          font-size: 11px;
          font-family: "JetBrains Mono", monospace;
        }

        .modal-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }

        .detail-cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 11px;
          margin-top: 15px;
        }

        .detail-card {
          padding: 16px;
          border: 1px solid var(--p-line);
          border-radius: 14px;
          background: white;
          transition: box-shadow .15s ease;
        }

        .detail-card:hover {
          box-shadow: 0 4px 12px rgba(15,23,42,.05);
        }

        .detail-card span {
          display: block;
          color: #8b95a7;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .8px;
        }

        .detail-card strong {
          display: block;
          color: #172033;
          font-size: 17px;
          margin-top: 8px;
          font-family: "JetBrains Mono", monospace;
        }

        .detail-card small {
          display: block;
          color: #a0a8b6;
          font-size: 9.5px;
          margin-top: 5px;
        }

        .detail-list {
          margin-top: 15px;
          border: 1px solid var(--p-line);
          border-radius: 14px;
          overflow: hidden;
        }

        .detail-list > div {
          min-height: 47px;
          padding: 11px 15px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          border-bottom: 1px solid #edf0f4;
        }

        .detail-list > div:last-child {
          border-bottom: 0;
        }

        .detail-list span {
          color: #8994a7;
          font-size: 11.5px;
        }

        .detail-list strong {
          color: #344158;
          font-size: 11.5px;
          text-align: right;
          max-width: 70%;
          word-break: break-word;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 9px;
          padding: 18px 24px;
          border-top: 1px solid var(--p-line);
        }

        /* ---------- Responsive ---------- */
        @media (max-width: 1150px) {
          .command-grid {
            grid-template-columns: 1fr 1fr;
          }

          .search-control {
            grid-column: span 2;
          }

          .reset-button {
            width: 100%;
          }
        }

        @media (max-width: 900px) {
          .products-shell {
            width: min(100% - 24px, 1460px);
            padding-top: 20px;
          }

          .command-panel {
            padding: 18px;
          }
        }

        @media (max-width: 850px) {
          .products-topbar {
            align-items: flex-start;
            flex-direction: column;
          }

          .topbar-actions {
            width: 100%;
          }

          .topbar-actions > * {
            flex: 1;
          }

          .kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .inventory-card-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .inventory-header-right {
            width: 100%;
            justify-content: space-between;
          }

          .detail-cards {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 580px) {
          .products-shell {
            width: calc(100% - 16px);
          }

          .products-topbar h1 {
            font-size: 30px;
          }

          .kpi-grid {
            grid-template-columns: 1fr;
          }

          .command-grid {
            grid-template-columns: 1fr;
          }

          .search-control {
            grid-column: auto;
          }

          .barcode-control {
            width: 100%;
          }

          .table-footer {
            align-items: flex-start;
            flex-direction: column;
          }

          .pagination {
            width: 100%;
            justify-content: center;
            flex-wrap: wrap;
          }

          .modal-backdrop {
            padding: 8px;
          }

          .modal-content,
          .modal-top {
            padding: 16px;
          }

          .modal-product-summary {
            align-items: flex-start;
            flex-direction: column;
          }

          .detail-cards {
            grid-template-columns: 1fr;
          }

          .modal-actions {
            padding: 13px 16px;
          }

          .modal-actions > * {
            flex: 1;
          }

          .command-panel {
            padding: 15px;
            border-radius: 18px;
          }

          .inventory-card,
          .kpi-card {
            border-radius: 16px;
          }

          .inventory-card-header {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
}