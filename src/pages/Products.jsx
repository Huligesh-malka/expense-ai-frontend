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
      setProducts(res.data?.data || []);
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
          --p-bg: #f4f7fb;
          --p-card: #ffffff;
          --p-text: #111827;
          --p-muted: #718096;
          --p-line: #e6ebf2;
          --p-dark: #0f172a;
          --p-dark-2: #18233a;
          --p-lime: #b7f000;
          --p-blue: #3978ff;
          --p-green: #11b981;
          --p-yellow: #f2a900;
          --p-red: #ef476f;
          --p-purple: #7c5cff;
        }

        * {
          box-sizing: border-box;
        }

        .products-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 85% 0%, rgba(124,92,255,.09), transparent 28%),
            radial-gradient(circle at 15% 0%, rgba(57,120,255,.06), transparent 25%),
            var(--p-bg);
          color: var(--p-text);
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .products-shell {
          width: min(1420px, calc(100% - 36px));
          margin: 0 auto;
          padding: 34px 0 70px;
        }

        .products-topbar {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 24px;
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
          box-shadow: 0 0 0 4px rgba(17,185,129,.12);
        }

        .products-topbar h1 {
          margin: 8px 0 5px;
          font-size: clamp(30px, 4vw, 46px);
          line-height: 1;
          letter-spacing: -1.8px;
          font-weight: 800;
        }

        .products-topbar p {
          margin: 0;
          color: var(--p-muted);
          font-size: 14px;
        }

        .topbar-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .primary-button,
        .refresh-button,
        .secondary-button,
        .small-add {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 10px;
          min-height: 42px;
          padding: 0 16px;
          font: inherit;
          font-size: 13px;
          font-weight: 750;
          text-decoration: none;
          cursor: pointer;
          transition: .18s ease;
        }

        .primary-button {
          background: var(--p-lime);
          color: #10150b;
          border: 1px solid #a5dc00;
          box-shadow: 0 8px 20px rgba(183,240,0,.18);
        }

        .primary-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 24px rgba(183,240,0,.26);
        }

        .refresh-button,
        .secondary-button {
          background: white;
          color: #253047;
          border: 1px solid var(--p-line);
        }

        .refresh-button:hover,
        .secondary-button:hover {
          border-color: #cdd5e1;
          background: #fafbfd;
        }

        .refresh-button:disabled {
          opacity: .6;
          cursor: wait;
        }

        .toast {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 15px;
          margin-bottom: 18px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 650;
          border: 1px solid;
        }

        .toast-success {
          color: #087a55;
          background: #eafaf4;
          border-color: #bdebd9;
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
          padding: 3px;
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 18px;
        }

        .kpi-card {
          min-height: 118px;
          padding: 18px;
          background: var(--p-card);
          border: 1px solid var(--p-line);
          border-radius: 16px;
          box-shadow: 0 8px 30px rgba(15,23,42,.035);
          display: flex;
          gap: 13px;
          align-items: flex-start;
        }

        .kpi-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
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
          margin-bottom: 4px;
        }

        .kpi-card strong {
          display: block;
          font-size: 25px;
          line-height: 1.15;
          letter-spacing: -.6px;
        }

        .kpi-card small {
          display: block;
          color: #99a3b4;
          font-size: 10px;
          margin-top: 5px;
        }

        .command-panel {
          background: var(--p-dark);
          color: white;
          border-radius: 18px;
          padding: 19px;
          margin-bottom: 18px;
          box-shadow: 0 16px 45px rgba(15,23,42,.12);
        }

        .command-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 15px;
        }

        .command-heading .section-kicker {
          color: #8f9db3;
        }

        .command-heading h2,
        .inventory-card-header h2 {
          margin: 4px 0 0;
          font-size: 17px;
          letter-spacing: -.35px;
        }

        .result-count {
          color: #9da9bc;
          font-size: 12px;
          font-family: "JetBrains Mono", monospace;
        }

        .command-grid {
          display: grid;
          grid-template-columns: minmax(250px, 1.7fr) minmax(240px, 1.15fr) 165px 165px auto;
          gap: 9px;
          align-items: center;
        }

        .search-control,
        .barcode-control,
        .select-control {
          height: 48px;
          background: var(--p-dark-2);
          border: 1px solid #2b3850;
          border-radius: 10px;
          display: flex;
          align-items: center;
          position: relative;
          transition: .18s ease;
        }

        .search-control:focus-within,
        .barcode-control:focus-within,
        .select-control:focus-within {
          border-color: #60718f;
          box-shadow: 0 0 0 3px rgba(96,113,143,.12);
        }

        .search-control {
          padding: 0 12px;
          gap: 9px;
          color: #8e9cb1;
        }

        .search-control input,
        .barcode-control input {
          width: 100%;
          min-width: 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: white;
          font: inherit;
          font-size: 13px;
        }

        .search-control input::placeholder,
        .barcode-control input::placeholder {
          color: #78869b;
        }

        .input-clear {
          border: 0;
          background: transparent;
          color: #8e9cb1;
          cursor: pointer;
          padding: 4px;
        }

        .barcode-control {
          padding-left: 12px;
          gap: 8px;
          color: #8e9cb1;
        }

        .barcode-control button {
          height: 100%;
          border: 0;
          border-left: 1px solid #2b3850;
          background: #22304a;
          color: white;
          padding: 0 14px;
          font: inherit;
          font-size: 12px;
          font-weight: 750;
          cursor: pointer;
          border-radius: 0 9px 9px 0;
        }

        .barcode-control button:hover {
          background: #30415f;
        }

        .select-control {
          padding: 0 11px;
          gap: 5px;
          color: #8e9cb1;
        }

        .select-control span {
          position: absolute;
          top: 5px;
          left: 11px;
          font-size: 8px;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 800;
          color: #66758d;
        }

        .select-control select {
          width: 100%;
          height: 100%;
          padding: 12px 19px 0 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: white;
          appearance: none;
          font: inherit;
          font-size: 12px;
          cursor: pointer;
        }

        .select-control svg {
          position: absolute;
          right: 8px;
          bottom: 11px;
          pointer-events: none;
        }

        .select-control option {
          color: #111827;
          background: white;
        }

        .reset-button {
          height: 48px;
          padding: 0 12px;
          border-radius: 10px;
          border: 1px solid #394862;
          color: #c9d2df;
          background: transparent;
          cursor: pointer;
          font: inherit;
          font-size: 12px;
          font-weight: 700;
        }

        .reset-button:hover {
          background: #1c2940;
        }

        .inventory-card {
          background: white;
          border: 1px solid var(--p-line);
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 12px 40px rgba(15,23,42,.045);
        }

        .inventory-card-header {
          min-height: 78px;
          padding: 18px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          border-bottom: 1px solid var(--p-line);
        }

        .inventory-card-header .section-kicker {
          color: #8994a7;
        }

        .inventory-header-right {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .stock-value {
          color: #8b95a7;
          font-size: 11px;
        }

        .stock-value strong {
          color: #28344a;
          font-family: "JetBrains Mono", monospace;
          margin-left: 5px;
        }

        .small-add {
          min-height: 36px;
          padding: 0 12px;
          background: #eefbd1;
          color: #263a00;
          border: 1px solid #d9ef9d;
        }

        .small-add:hover {
          background: #e4f8b9;
        }

        .table-scroll {
          width: 100%;
          overflow-x: auto;
        }

        .products-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1040px;
        }

        .products-table th {
          height: 50px;
          padding: 0 16px;
          text-align: left;
          background: #f8fafc;
          color: #8994a7;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 1.05px;
          font-weight: 800;
          border-bottom: 1px solid var(--p-line);
          white-space: nowrap;
          cursor: pointer;
          user-select: none;
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
          padding: 14px 16px;
          border-bottom: 1px solid #edf0f5;
          vertical-align: middle;
          font-size: 12px;
        }

        .products-table tbody tr {
          transition: .14s ease;
        }

        .products-table tbody tr:hover {
          background: #fbfdff;
        }

        .products-table tbody tr:last-child td {
          border-bottom: 0;
        }

        .product-cell {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 230px;
        }

        .product-avatar {
          width: 40px;
          height: 40px;
          border-radius: 11px;
          object-fit: cover;
          border: 1px solid #e1e7ef;
          flex: 0 0 auto;
        }

        .product-avatar-fallback {
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #eff5ff, #e8edff);
          color: #5067b5;
          font-weight: 800;
          font-size: 14px;
        }

        .product-main strong {
          display: block;
          max-width: 260px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #1b2538;
          font-size: 13px;
          font-weight: 750;
        }

        .product-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 4px;
          color: #97a1b1;
          font-size: 9px;
          font-family: "JetBrains Mono", monospace;
        }

        .product-meta span + span {
          border-left: 1px solid #dce2ea;
          padding-left: 7px;
        }

        .category-pill {
          display: inline-flex;
          align-items: center;
          min-height: 27px;
          padding: 0 9px;
          border-radius: 999px;
          background: #f0f3f8;
          color: #4d5c73;
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
        }

        .price-cell {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 105px;
        }

        .price-cell strong {
          color: #172033;
          font-family: "JetBrains Mono", monospace;
          font-size: 13px;
        }

        .price-cell span {
          color: #8f99a9;
          font-size: 9px;
        }

        .price-cell small {
          color: #a0a9b7;
          font-size: 9px;
        }

        .stock-cell-modern {
          display: grid;
          grid-template-columns: auto auto;
          gap: 2px 5px;
          align-items: center;
          width: max-content;
        }

        .stock-cell-modern strong {
          color: #172033;
          font-family: "JetBrains Mono", monospace;
          font-size: 13px;
          text-align: right;
        }

        .stock-cell-modern > span:not(.status-chip) {
          color: #8b95a6;
          font-size: 9px;
          text-transform: uppercase;
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
          padding: 5px 7px;
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
          gap: 4px;
        }

        .expiry-cell strong {
          color: #3a465a;
          font-size: 11px;
          font-weight: 650;
        }

        .mini-chip {
          padding: 5px 7px;
        }

        .muted {
          color: #b1b9c5;
        }

        .active-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 8px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 750;
          white-space: nowrap;
        }

        .active-chip > span {
          width: 5px;
          height: 5px;
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

        .row-actions {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 6px;
        }

        .icon-action {
          width: 33px;
          height: 33px;
          display: grid;
          place-items: center;
          border-radius: 9px;
          border: 1px solid;
          cursor: pointer;
          text-decoration: none;
          transition: .15s ease;
        }

        .icon-action:hover {
          transform: translateY(-1px);
        }

        .icon-action.view {
          color: #3268ca;
          background: #eef4ff;
          border-color: #dce8ff;
        }

        .icon-action.edit {
          color: #087a55;
          background: #eafaf4;
          border-color: #d1f0e3;
        }

        .icon-action.delete {
          color: #d13b5d;
          background: #fff0f3;
          border-color: #ffdce4;
        }

        .table-footer {
          min-height: 64px;
          padding: 12px 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          border-top: 1px solid var(--p-line);
          color: #8994a7;
          font-size: 11px;
        }

        .table-footer strong {
          color: #47536a;
        }

        .pagination {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .pagination button {
          min-width: 31px;
          height: 31px;
          padding: 0 8px;
          border-radius: 8px;
          border: 1px solid #e2e7ef;
          background: white;
          color: #5c687d;
          font: inherit;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
        }

        .pagination button:hover:not(:disabled) {
          border-color: #cbd4e2;
          background: #f8fafc;
        }

        .pagination button.current {
          color: #152000;
          background: var(--p-lime);
          border-color: #a9df00;
        }

        .pagination button:disabled {
          opacity: .4;
          cursor: not-allowed;
        }

        .loading-box,
        .empty-box {
          min-height: 360px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          text-align: center;
        }

        .spinner {
          width: 34px;
          height: 34px;
          border: 3px solid #e9edf3;
          border-top-color: var(--p-blue);
          border-radius: 50%;
          animation: productsSpin .75s linear infinite;
          margin-bottom: 15px;
        }

        .loading-box strong {
          font-size: 13px;
        }

        .loading-box span,
        .empty-box p {
          color: #8994a7;
          font-size: 12px;
          margin: 6px 0 0;
        }

        .empty-icon {
          width: 58px;
          height: 58px;
          display: grid;
          place-items: center;
          border-radius: 16px;
          background: #eef4ff;
          color: #3978ff;
          margin-bottom: 13px;
        }

        .empty-box h3 {
          margin: 0;
          font-size: 18px;
        }

        .empty-box .primary-button,
        .empty-box .secondary-button {
          margin-top: 18px;
        }

        .modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 2000;
          padding: 20px;
          display: grid;
          place-items: center;
          background: rgba(7, 12, 24, .66);
          backdrop-filter: blur(8px);
        }

        .product-modal {
          width: min(760px, 100%);
          max-height: min(820px, 92vh);
          overflow: auto;
          background: #fff;
          border: 1px solid rgba(255,255,255,.4);
          border-radius: 18px;
          box-shadow: 0 30px 90px rgba(0,0,0,.28);
        }

        .modal-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 15px;
          padding: 21px 23px;
          border-bottom: 1px solid var(--p-line);
          position: sticky;
          top: 0;
          background: rgba(255,255,255,.95);
          backdrop-filter: blur(8px);
          z-index: 2;
        }

        .modal-top .section-kicker {
          color: #8a95a7;
        }

        .modal-top h2 {
          margin: 5px 0 0;
          font-size: 21px;
          letter-spacing: -.5px;
        }

        .modal-close {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border-radius: 9px;
          border: 1px solid #e1e6ee;
          background: #f8fafc;
          color: #667289;
          cursor: pointer;
        }

        .modal-close:hover {
          background: #eef2f7;
        }

        .modal-content {
          padding: 23px;
        }

        .modal-product-summary {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 15px;
          border: 1px solid var(--p-line);
          border-radius: 14px;
          background: #f9fbfd;
        }

        .modal-image {
          width: 76px;
          height: 76px;
          border-radius: 13px;
          object-fit: cover;
          border: 1px solid #e0e6ef;
          flex: 0 0 auto;
        }

        .modal-image-fallback {
          display: grid;
          place-items: center;
          background: #eaf1ff;
          color: #456cc1;
          font-size: 27px;
          font-weight: 800;
        }

        .modal-product-summary h3 {
          margin: 0;
          font-size: 17px;
        }

        .modal-product-summary p {
          color: #8a95a7;
          margin: 4px 0 9px;
          font-size: 11px;
          font-family: "JetBrains Mono", monospace;
        }

        .modal-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .detail-cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 9px;
          margin-top: 13px;
        }

        .detail-card {
          padding: 14px;
          border: 1px solid var(--p-line);
          border-radius: 12px;
          background: white;
        }

        .detail-card span {
          display: block;
          color: #8b95a7;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .7px;
        }

        .detail-card strong {
          display: block;
          color: #172033;
          font-size: 16px;
          margin-top: 7px;
          font-family: "JetBrains Mono", monospace;
        }

        .detail-card small {
          display: block;
          color: #a0a8b6;
          font-size: 9px;
          margin-top: 4px;
        }

        .detail-list {
          margin-top: 13px;
          border: 1px solid var(--p-line);
          border-radius: 12px;
          overflow: hidden;
        }

        .detail-list > div {
          min-height: 45px;
          padding: 10px 13px;
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
          font-size: 11px;
        }

        .detail-list strong {
          color: #344158;
          font-size: 11px;
          text-align: right;
          max-width: 70%;
          word-break: break-word;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          padding: 16px 23px;
          border-top: 1px solid var(--p-line);
        }

        @keyframes productsSpin {
          to { transform: rotate(360deg); }
        }

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

        @media (max-width: 850px) {
          .products-shell {
            width: min(100% - 24px, 720px);
            padding-top: 20px;
          }

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
            font-size: 32px;
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
        }
      `}</style>
    </div>
  );
}
