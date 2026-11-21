import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

/*
  Products / Inventory
  ------------------------------------------------
  - Same API routes and actions as before: list, view, edit, delete,
    barcode lookup, search, category / stock filters, sorting, pagination.
  - Does not send business_id from localStorage. The backend should scope
    queries using the authenticated req.businessId.
  - All CSS is scoped under .pr- so it never leaks into other pages.
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

/* ---------- helpers ---------- */

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
    return { key: "out", label: "Out of stock", tone: "danger" };
  }
  if (minimum > 0 && qty <= minimum) {
    return { key: "low", label: "Low stock", tone: "warning" };
  }
  if (minimum > 0 && qty <= minimum * 3) {
    return { key: "medium", label: "Healthy", tone: "info" };
  }
  return { key: "good", label: "In stock", tone: "success" };
}

function stockPercent(stock, minStock) {
  const qty = Number(stock || 0);
  const minimum = Number(minStock || 0);
  if (qty <= 0) return 0;
  if (minimum <= 0) return 100;
  return Math.max(6, Math.min(100, (qty / (minimum * 3)) * 100));
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

const SORT_OPTIONS = [
  { value: "product_name", label: "Name" },
  { value: "selling_price", label: "Selling price" },
  { value: "stock", label: "Stock" },
  { value: "category", label: "Category" },
  { value: "expiry_date", label: "Expiry date" },
];

const STOCK_TABS = [
  { key: "all", label: "All products", note: "In your catalog", tone: "blue", icon: "Package" },
  { key: "in_stock", label: "Healthy stock", note: "Ready to sell", tone: "green", icon: "Check" },
  { key: "low_stock", label: "Low stock", note: "Needs restocking", tone: "amber", icon: "Alert" },
  { key: "out_of_stock", label: "Out of stock", note: "Cannot sell now", tone: "red", icon: "Alert" },
];

/* ---------- component ---------- */

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

  const toastTimer = useRef(null);
  const itemsPerPage = 12;

  useEffect(() => {
    loadProducts();
    return () => window.clearTimeout(toastTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, selectedStockStatus]);

  useEffect(() => {
    if (!showDetails) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setShowDetails(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showDetails]);

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setMessage(""), 3500);
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
      showMessage("Product deleted");
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
      new Set(products.map((product) => product.category).filter(Boolean))
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

  const tabCounts = {
    all: stats.total,
    in_stock: stats.healthy,
    low_stock: stats.low,
    out_of_stock: stats.out,
  };

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

  const filtersActive =
    search !== "" || selectedCategory !== "all" || selectedStockStatus !== "all";

  const resetFilters = () => {
    setSearch("");
    setBarcodeInput("");
    setSelectedCategory("all");
    setSelectedStockStatus("all");
    setCurrentPage(1);
  };

  const pageNumbers = Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
    if (totalPages <= 5) return index + 1;
    if (safePage <= 3) return index + 1;
    if (safePage >= totalPages - 2) return totalPages - 4 + index;
    return safePage - 2 + index;
  });

  return (
    <div className="pr-page">
      <div className="pr-shell">
        {/* HEADER */}
        <header className="pr-header">
          <div>
            <h1>Products</h1>
            <p>Manage your stock, pricing and availability.</p>
          </div>

          <div className="pr-header-actions">
            <button
              className="pr-btn pr-btn-ghost"
              onClick={() => loadProducts(true)}
              disabled={refreshing}
            >
              <Icons.Refresh size={16} />
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>

            <Link className="pr-btn pr-btn-primary" to="/add-product">
              <Icons.Plus size={17} />
              Add product
            </Link>
          </div>
        </header>

        {message && (
          <div
            className={`pr-toast ${
              messageType === "error" ? "pr-toast-error" : "pr-toast-success"
            }`}
            role="status"
          >
            <span>{message}</span>
            <button onClick={() => setMessage("")} aria-label="Close message">
              <Icons.Close size={15} />
            </button>
          </div>
        )}

        {/* STOCK VALUE + CLICKABLE STATUS STRIP */}
        <section className="pr-overview">
          <div className="pr-value">
            <div>
              <span className="pr-value-label">Stock value at cost</span>
              <strong className="pr-value-amount">{money(stats.stockValue)}</strong>
            </div>
            <span className="pr-value-note">
              {stats.total} {stats.total === 1 ? "product" : "products"} ·{" "}
              {categories.length} {categories.length === 1 ? "category" : "categories"}
            </span>
          </div>

          <div className="pr-tabs" role="group" aria-label="Filter by stock status">
            {STOCK_TABS.map((tab) => {
              const Icon = Icons[tab.icon];
              const active = selectedStockStatus === tab.key;

              return (
                <button
                  key={tab.key}
                  type="button"
                  className={`pr-tab pr-tab-${tab.tone} ${active ? "pr-tab-active" : ""}`}
                  onClick={() => setSelectedStockStatus(tab.key)}
                  aria-pressed={active}
                >
                  <span className="pr-tab-icon">
                    <Icon size={18} />
                  </span>
                  <span className="pr-tab-text">
                    <span className="pr-tab-label">{tab.label}</span>
                    <strong>{tabCounts[tab.key]}</strong>
                    <span className="pr-tab-note">{tab.note}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* CATALOG */}
        <section className="pr-card">
          <div className="pr-toolbar">
            <label className="pr-field pr-search">
              <Icons.Search size={17} />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, code or barcode"
                autoComplete="off"
                aria-label="Search products"
              />
              {search && (
                <button
                  type="button"
                  className="pr-clear"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <Icons.Close size={14} />
                </button>
              )}
            </label>

            <div className="pr-field pr-barcode">
              <Icons.Scan size={17} />
              <input
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleBarcodeSearch();
                }}
                placeholder="Scan or type barcode"
                autoComplete="off"
                aria-label="Barcode"
              />
              <button type="button" onClick={handleBarcodeSearch}>
                Find
              </button>
            </div>

            <label className="pr-field pr-select">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label="Category"
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

            <div className="pr-sort">
              <label className="pr-field pr-select">
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value)}
                  aria-label="Sort by"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      Sort: {o.label}
                    </option>
                  ))}
                </select>
                <Icons.Chevron size={15} />
              </label>

              <button
                type="button"
                className="pr-dir"
                onClick={() =>
                  setSortDirection((d) => (d === "asc" ? "desc" : "asc"))
                }
                aria-label={
                  sortDirection === "asc" ? "Sorted ascending" : "Sorted descending"
                }
                title={sortDirection === "asc" ? "Ascending" : "Descending"}
              >
                {sortDirection === "asc" ? (
                  <Icons.ArrowUp size={16} />
                ) : (
                  <Icons.ArrowDown size={16} />
                )}
              </button>
            </div>
          </div>

          <div className="pr-subbar">
            <span>
              {filtersActive
                ? `${filteredProducts.length} of ${products.length} products`
                : `${products.length} ${products.length === 1 ? "product" : "products"}`}
            </span>
            {filtersActive && (
              <button type="button" className="pr-link" onClick={resetFilters}>
                Clear filters
              </button>
            )}
          </div>

          {loading ? (
            <div className="pr-state" role="status">
              <div className="pr-spinner" />
              <strong>Loading inventory</strong>
              <p>Getting your latest products…</p>
            </div>
          ) : currentProducts.length === 0 ? (
            <div className="pr-state">
              <div className="pr-state-icon">
                <Icons.Package size={26} />
              </div>
              <h3>
                {products.length === 0 ? "Your catalog is empty" : "No products found"}
              </h3>
              <p>
                {products.length === 0
                  ? "Add your first product to start billing and tracking stock."
                  : "Try a different search or clear the filters."}
              </p>
              {products.length === 0 ? (
                <Link to="/add-product" className="pr-btn pr-btn-primary">
                  <Icons.Plus size={17} />
                  Add your first product
                </Link>
              ) : (
                <button className="pr-btn pr-btn-ghost" onClick={resetFilters}>
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="pr-table-wrap">
                <table className="pr-table">
                  <thead>
                    <tr>
                      <th>
                        <button type="button" onClick={() => handleSort("product_name")}>
                          Product {sortIndicator("product_name")}
                        </button>
                      </th>
                      <th>
                        <button type="button" onClick={() => handleSort("category")}>
                          Category {sortIndicator("category")}
                        </button>
                      </th>
                      <th>
                        <button type="button" onClick={() => handleSort("selling_price")}>
                          Selling price {sortIndicator("selling_price")}
                        </button>
                      </th>
                      <th>
                        <button type="button" onClick={() => handleSort("stock")}>
                          Stock {sortIndicator("stock")}
                        </button>
                      </th>
                      <th>
                        <button type="button" onClick={() => handleSort("expiry_date")}>
                          Expiry {sortIndicator("expiry_date")}
                        </button>
                      </th>
                      <th className="pr-right">
                        <span className="pr-sr">Actions</span>
                      </th>
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
                      const isActive = product.status === "active";

                      return (
                        <tr key={product.id}>
                          <td data-label="Product">
                            <div className="pr-product">
                              {product.image ? (
                                <img
                                  src={product.image}
                                  alt=""
                                  className="pr-thumb"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="pr-thumb pr-thumb-fallback">
                                  {(product.product_name || "?")[0].toUpperCase()}
                                </div>
                              )}

                              <div className="pr-product-text">
                                <strong>{product.product_name || "Unnamed product"}</strong>
                                <span className="pr-product-meta">
                                  {product.product_code && <span>{product.product_code}</span>}
                                  {product.barcode && <span>Barcode {product.barcode}</span>}
                                  {!isActive && <span className="pr-inactive">Inactive</span>}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td data-label="Category">
                            <span className="pr-pill">{product.category || "Other"}</span>
                          </td>

                          <td data-label="Selling price">
                            <div className="pr-price">
                              <strong>{money(product.selling_price)}</strong>
                              <span>
                                per {product.price_per || 1} {unitLabel(product.price_unit)}
                              </span>
                              {Number(product.purchase_price || 0) > 0 && (
                                <small>Cost {money(product.purchase_price)}</small>
                              )}
                            </div>
                          </td>

                          <td data-label="Stock">
                            <div className="pr-stock">
                              <div className="pr-stock-top">
                                <strong>{formattedQuantity}</strong>
                                <span>{unit}</span>
                              </div>
                              <div className={`pr-bar pr-bar-${status.tone}`} aria-hidden="true">
                                <span
                                  style={{
                                    width: `${stockPercent(product.stock, product.min_stock)}%`,
                                  }}
                                />
                              </div>
                              <span className={`pr-tag pr-tag-${status.tone}`}>
                                {status.label}
                              </span>
                            </div>
                          </td>

                          <td data-label="Expiry">
                            {product.expiry_date ? (
                              <div className="pr-expiry">
                                <strong>
                                  {new Date(product.expiry_date).toLocaleDateString("en-IN")}
                                </strong>
                                <span className={`pr-tag pr-tag-${expiry?.tone || "success"}`}>
                                  {expiry?.label}
                                </span>
                              </div>
                            ) : (
                              <span className="pr-muted">No expiry</span>
                            )}
                          </td>

                          <td className="pr-right pr-actions-cell" data-label="">
                            <div className="pr-actions">
                              <button
                                className="pr-icon pr-icon-view"
                                onClick={() => viewProductDetails(product.id)}
                                title="View product"
                                aria-label={`View ${product.product_name}`}
                              >
                                <Icons.Eye size={16} />
                              </button>

                              <Link
                                className="pr-icon pr-icon-edit"
                                to={`/edit-product/${product.id}`}
                                title="Edit product"
                                aria-label={`Edit ${product.product_name}`}
                              >
                                <Icons.Edit size={16} />
                              </Link>

                              <button
                                className="pr-icon pr-icon-delete"
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

              <div className="pr-footer">
                <span>
                  Showing <strong>{startIndex + 1}</strong>–
                  <strong>
                    {Math.min(startIndex + itemsPerPage, filteredProducts.length)}
                  </strong>{" "}
                  of <strong>{filteredProducts.length}</strong>
                </span>

                <div className="pr-pagination">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                  >
                    Previous
                  </button>

                  {pageNumbers.map((page) => (
                    <button
                      key={page}
                      className={safePage === page ? "pr-current" : ""}
                      onClick={() => setCurrentPage(page)}
                      aria-current={safePage === page ? "page" : undefined}
                    >
                      {page}
                    </button>
                  ))}

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

      {/* DETAILS MODAL */}
      {showDetails && selectedProduct && (
        <div className="pr-backdrop" onClick={() => setShowDetails(false)}>
          <div
            className="pr-modal"
            role="dialog"
            aria-modal="true"
            aria-label={selectedProduct.product_name}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pr-modal-top">
              <div className="pr-modal-hero">
                {selectedProduct.image ? (
                  <img
                    src={selectedProduct.image}
                    alt=""
                    className="pr-modal-img"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="pr-modal-img pr-thumb-fallback">
                    {(selectedProduct.product_name || "?")[0].toUpperCase()}
                  </div>
                )}

                <div>
                  <h2>{selectedProduct.product_name}</h2>
                  <p>
                    {selectedProduct.product_code
                      ? `Code ${selectedProduct.product_code}`
                      : "No product code"}
                  </p>
                  <div className="pr-modal-pills">
                    <span className="pr-pill">{selectedProduct.category || "Other"}</span>
                    <span
                      className={`pr-tag ${
                        selectedProduct.status === "active"
                          ? "pr-tag-success"
                          : "pr-tag-muted"
                      }`}
                    >
                      {selectedProduct.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                className="pr-modal-close"
                onClick={() => setShowDetails(false)}
                aria-label="Close"
              >
                <Icons.Close size={19} />
              </button>
            </div>

            <div className="pr-modal-body">
              <div className="pr-facts">
                <div>
                  <span>Selling price</span>
                  <strong>{money(selectedProduct.selling_price)}</strong>
                  <small>
                    per {selectedProduct.price_per || 1}{" "}
                    {unitLabel(selectedProduct.price_unit)}
                  </small>
                </div>

                <div>
                  <span>Current stock</span>
                  <strong>
                    {Number(selectedProduct.stock || 0)} {unitLabel(selectedProduct.unit)}
                  </strong>
                  <small>
                    Minimum {selectedProduct.min_stock || 0}{" "}
                    {unitLabel(selectedProduct.unit)}
                  </small>
                </div>

                <div>
                  <span>Purchase price</span>
                  <strong>{money(selectedProduct.purchase_price)}</strong>
                  <small>Recorded cost</small>
                </div>

                <div>
                  <span>Tax</span>
                  <strong>{Number(selectedProduct.tax || 0)}%</strong>
                  <small>Configured rate</small>
                </div>
              </div>

              <dl className="pr-details">
                <div>
                  <dt>Barcode</dt>
                  <dd>{selectedProduct.barcode || "Not set"}</dd>
                </div>
                <div>
                  <dt>Expiry</dt>
                  <dd>
                    {selectedProduct.expiry_date
                      ? new Date(selectedProduct.expiry_date).toLocaleDateString("en-IN")
                      : "No expiry"}
                  </dd>
                </div>
                <div>
                  <dt>Description</dt>
                  <dd>{selectedProduct.description || "No description"}</dd>
                </div>
              </dl>
            </div>

            <div className="pr-modal-actions">
              <button
                className="pr-btn pr-btn-ghost"
                onClick={() => setShowDetails(false)}
              >
                Close
              </button>
              <Link
                className="pr-btn pr-btn-primary"
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

      <Styles />
    </div>
  );
}

/* ====================================================== */
/* Styles — scoped under .pr- so nothing leaks globally    */
/* ====================================================== */

function Styles() {
  return (
    <style>{`
      @import url("https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap");

      .pr-page {
        --ink: #14213d;
        --ink-soft: #3b4a68;
        --muted: #6b7794;
        --line: #e1e6ef;
        --bg: #eef1f6;
        --surface: #ffffff;
        --brand: #1d4ed8;
        --brand-soft: #e8eefc;
        --green: #157347;
        --green-soft: #dff4e8;
        --amber: #9a5b00;
        --amber-soft: #fdf0d2;
        --red: #b3261e;
        --red-soft: #fbe3e1;
        --blue: #1d4ed8;
        --blue-soft: #e8eefc;

        min-height: 100vh;
        background: var(--bg);
        color: var(--ink);
        font-family: Manrope, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-variant-numeric: tabular-nums;
        -webkit-font-smoothing: antialiased;
      }

      .pr-page *,
      .pr-page *::before,
      .pr-page *::after {
        box-sizing: border-box;
      }

      .pr-page h1,
      .pr-page h2,
      .pr-page h3,
      .pr-page p,
      .pr-page dl,
      .pr-page dd {
        margin: 0;
      }

      .pr-page :focus-visible {
        outline: 3px solid #93b4ff;
        outline-offset: 2px;
      }

      .pr-sr {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
        white-space: nowrap;
      }

      .pr-shell {
        width: min(1360px, calc(100% - 40px));
        margin: 0 auto;
        padding: 28px 0 64px;
      }

      /* ---------- header ---------- */

      .pr-header {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 20px;
      }

      .pr-header h1 {
        font-size: clamp(28px, 4vw, 36px);
        font-weight: 800;
        letter-spacing: -1px;
      }

      .pr-header p {
        margin-top: 6px;
        font-size: 14px;
        color: var(--muted);
      }

      .pr-header-actions {
        display: flex;
        gap: 10px;
      }

      .pr-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: 42px;
        padding: 0 16px;
        border-radius: 11px;
        border: 1px solid transparent;
        font: 700 13px/1 Manrope, inherit;
        text-decoration: none;
        white-space: nowrap;
        cursor: pointer;
        transition: background 0.15s, border-color 0.15s, color 0.15s;
      }

      .pr-btn:disabled {
        opacity: 0.6;
        cursor: wait;
      }

      .pr-btn-primary {
        background: var(--ink);
        color: #fff;
      }

      .pr-btn-primary:hover {
        background: #0c1529;
      }

      .pr-btn-ghost {
        background: var(--surface);
        color: var(--ink-soft);
        border-color: var(--line);
      }

      .pr-btn-ghost:hover:not(:disabled) {
        border-color: #c5cddd;
        color: var(--ink);
      }

      /* ---------- toast ---------- */

      .pr-toast {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 16px;
        padding: 12px 16px;
        border-radius: 12px;
        border: 1px solid;
        font-size: 13px;
        font-weight: 700;
      }

      .pr-toast-success {
        background: var(--green-soft);
        border-color: #b6e3c9;
        color: var(--green);
      }

      .pr-toast-error {
        background: var(--red-soft);
        border-color: #f2c2be;
        color: var(--red);
      }

      .pr-toast button {
        display: flex;
        padding: 4px;
        border: 0;
        border-radius: 6px;
        background: transparent;
        color: inherit;
        cursor: pointer;
      }

      /* ---------- overview ---------- */

      .pr-overview {
        margin-bottom: 20px;
        border-radius: 20px;
        overflow: hidden;
        border: 1px solid var(--line);
        background: var(--surface);
      }

      .pr-value {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
        padding: 24px 28px;
        background: var(--ink);
        color: #fff;
      }

      .pr-value-label {
        display: block;
        font-size: 13px;
        font-weight: 600;
        color: #b8c3dd;
      }

      .pr-value-amount {
        display: block;
        margin-top: 6px;
        font-size: clamp(28px, 4vw, 38px);
        font-weight: 800;
        letter-spacing: -1px;
        color: #f6c453;
      }

      .pr-value-note {
        font-size: 13px;
        font-weight: 600;
        color: #b8c3dd;
      }

      .pr-tabs {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
      }

      .pr-tab {
        display: flex;
        align-items: flex-start;
        gap: 14px;
        padding: 18px 22px;
        border: 0;
        border-right: 1px solid var(--line);
        border-bottom: 3px solid transparent;
        background: var(--surface);
        color: inherit;
        font: inherit;
        text-align: left;
        cursor: pointer;
        transition: background 0.15s;
      }

      .pr-tab:last-child {
        border-right: 0;
      }

      .pr-tab:hover {
        background: #f8f9fc;
      }

      .pr-tab-active {
        background: #f8f9fc;
      }

      .pr-tab-blue.pr-tab-active { border-bottom-color: var(--blue); }
      .pr-tab-green.pr-tab-active { border-bottom-color: var(--green); }
      .pr-tab-amber.pr-tab-active { border-bottom-color: #d99100; }
      .pr-tab-red.pr-tab-active { border-bottom-color: var(--red); }

      .pr-tab-icon {
        flex: none;
        width: 40px;
        height: 40px;
        display: grid;
        place-items: center;
        border-radius: 12px;
      }

      .pr-tab-blue .pr-tab-icon { background: var(--blue-soft); color: var(--blue); }
      .pr-tab-green .pr-tab-icon { background: var(--green-soft); color: var(--green); }
      .pr-tab-amber .pr-tab-icon { background: var(--amber-soft); color: var(--amber); }
      .pr-tab-red .pr-tab-icon { background: var(--red-soft); color: var(--red); }

      .pr-tab-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }

      .pr-tab-label {
        font-size: 13px;
        font-weight: 600;
        color: var(--muted);
      }

      .pr-tab-text strong {
        font-size: 24px;
        font-weight: 800;
        letter-spacing: -0.6px;
        line-height: 1.15;
      }

      .pr-tab-note {
        font-size: 12px;
        color: var(--muted);
      }

      /* ---------- card + toolbar ---------- */

      .pr-card {
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: 20px;
        overflow: hidden;
      }

      .pr-toolbar {
        display: grid;
        grid-template-columns: minmax(220px, 1.6fr) minmax(200px, 1fr) 190px auto;
        gap: 12px;
        padding: 20px 24px 14px;
      }

      .pr-field {
        position: relative;
        display: flex;
        align-items: center;
        gap: 10px;
        height: 44px;
        padding: 0 12px;
        border: 1px solid var(--line);
        border-radius: 11px;
        background: #f8f9fc;
        color: var(--muted);
        transition: background 0.15s, border-color 0.15s;
      }

      .pr-field:focus-within {
        background: #fff;
        border-color: #93b4ff;
      }

      .pr-field input,
      .pr-field select {
        width: 100%;
        min-width: 0;
        height: 100%;
        border: 0;
        outline: 0;
        background: transparent;
        color: var(--ink);
        font: 600 13px Manrope, inherit;
      }

      .pr-field input::placeholder {
        color: #8c97b0;
        font-weight: 500;
      }

      .pr-select select {
        appearance: none;
        padding-right: 22px;
        cursor: pointer;
      }

      .pr-select svg {
        position: absolute;
        right: 12px;
        pointer-events: none;
      }

      .pr-clear {
        display: flex;
        padding: 4px;
        border: 0;
        border-radius: 6px;
        background: transparent;
        color: var(--muted);
        cursor: pointer;
      }

      .pr-barcode {
        padding-right: 0;
        overflow: hidden;
      }

      .pr-barcode button {
        flex: none;
        height: 100%;
        padding: 0 16px;
        border: 0;
        border-left: 1px solid var(--line);
        background: var(--ink);
        color: #fff;
        font: 700 12px Manrope, inherit;
        cursor: pointer;
      }

      .pr-barcode button:hover {
        background: #0c1529;
      }

      .pr-sort {
        display: flex;
        gap: 8px;
      }

      .pr-sort .pr-field {
        min-width: 170px;
      }

      .pr-dir {
        flex: none;
        width: 44px;
        height: 44px;
        display: grid;
        place-items: center;
        border: 1px solid var(--line);
        border-radius: 11px;
        background: #fff;
        color: var(--ink-soft);
        cursor: pointer;
      }

      .pr-dir:hover {
        border-color: #c5cddd;
        color: var(--brand);
      }

      .pr-subbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 0 24px 14px;
        border-bottom: 1px solid var(--line);
        font-size: 13px;
        font-weight: 600;
        color: var(--muted);
      }

      .pr-link {
        border: 0;
        background: none;
        color: var(--brand);
        font: 700 13px Manrope, inherit;
        cursor: pointer;
      }

      .pr-link:hover {
        text-decoration: underline;
      }

      /* ---------- table ---------- */

      .pr-table-wrap {
        overflow-x: auto;
      }

      .pr-table {
        width: 100%;
        border-collapse: collapse;
        min-width: 980px;
      }

      .pr-table th {
        padding: 0 20px;
        height: 46px;
        text-align: left;
        background: #f8f9fc;
        border-bottom: 1px solid var(--line);
        white-space: nowrap;
      }

      .pr-table th button {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 0;
        border: 0;
        background: none;
        color: var(--muted);
        font: 700 12px Manrope, inherit;
        cursor: pointer;
      }

      .pr-table th button:hover {
        color: var(--ink);
      }

      .pr-table td {
        padding: 16px 20px;
        border-bottom: 1px solid #eef1f6;
        vertical-align: middle;
        font-size: 13px;
        color: var(--ink-soft);
      }

      .pr-table tbody tr:last-child td {
        border-bottom: 0;
      }

      .pr-table tbody tr:hover {
        background: #f8f9fc;
      }

      .pr-right {
        text-align: right !important;
      }

      .pr-product {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 240px;
      }

      .pr-thumb {
        flex: none;
        width: 44px;
        height: 44px;
        border-radius: 12px;
        object-fit: cover;
        border: 1px solid var(--line);
        background: #f8f9fc;
      }

      .pr-thumb-fallback {
        display: grid;
        place-items: center;
        background: #f6c453;
        border-color: #f6c453;
        color: var(--ink);
        font-size: 16px;
        font-weight: 800;
      }

      .pr-product-text {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
      }

      .pr-product-text strong {
        max-width: 280px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 14px;
        font-weight: 800;
        color: var(--ink);
      }

      .pr-product-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 4px 12px;
        font-size: 12px;
        color: var(--muted);
      }

      .pr-inactive {
        color: var(--red);
        font-weight: 700;
      }

      .pr-pill {
        display: inline-flex;
        align-items: center;
        padding: 5px 11px;
        border-radius: 999px;
        background: #eef1f6;
        color: var(--ink-soft);
        font-size: 12px;
        font-weight: 700;
        white-space: nowrap;
      }

      .pr-price {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 120px;
      }

      .pr-price strong {
        font-size: 15px;
        font-weight: 800;
        color: var(--ink);
      }

      .pr-price span,
      .pr-price small {
        font-size: 12px;
        color: var(--muted);
      }

      .pr-stock {
        display: flex;
        flex-direction: column;
        gap: 7px;
        min-width: 130px;
      }

      .pr-stock-top {
        display: flex;
        align-items: baseline;
        gap: 6px;
      }

      .pr-stock-top strong {
        font-size: 16px;
        font-weight: 800;
        color: var(--ink);
      }

      .pr-stock-top span {
        font-size: 12px;
        font-weight: 700;
        color: var(--muted);
      }

      .pr-bar {
        height: 6px;
        border-radius: 999px;
        background: #e6eaf3;
        overflow: hidden;
      }

      .pr-bar span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: currentColor;
      }

      .pr-bar-success { color: #2f9e6b; }
      .pr-bar-info { color: #3b6fe0; }
      .pr-bar-warning { color: #e0a000; }
      .pr-bar-danger { color: #d64545; }

      .pr-tag {
        display: inline-flex;
        align-items: center;
        width: fit-content;
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
        white-space: nowrap;
      }

      .pr-tag-success { background: var(--green-soft); color: var(--green); }
      .pr-tag-info { background: var(--blue-soft); color: var(--blue); }
      .pr-tag-warning { background: var(--amber-soft); color: var(--amber); }
      .pr-tag-danger { background: var(--red-soft); color: var(--red); }
      .pr-tag-muted { background: #eef1f6; color: var(--muted); }

      .pr-expiry {
        display: flex;
        flex-direction: column;
        gap: 6px;
        align-items: flex-start;
      }

      .pr-expiry strong {
        font-size: 13px;
        font-weight: 700;
        color: var(--ink);
      }

      .pr-muted {
        color: #9aa5bd;
        font-size: 13px;
      }

      /* ---------- row actions ---------- */

      .pr-actions {
        display: flex;
        justify-content: flex-end;
        gap: 6px;
      }

      .pr-icon {
        width: 36px;
        height: 36px;
        display: grid;
        place-items: center;
        border: 1px solid var(--line);
        border-radius: 10px;
        background: #fff;
        color: var(--ink-soft);
        text-decoration: none;
        cursor: pointer;
        transition: background 0.15s, color 0.15s, border-color 0.15s;
      }

      .pr-icon-view:hover { background: var(--blue-soft); color: var(--blue); border-color: #c4d4f8; }
      .pr-icon-edit:hover { background: var(--green-soft); color: var(--green); border-color: #b6e3c9; }
      .pr-icon-delete:hover { background: var(--red-soft); color: var(--red); border-color: #f2c2be; }

      /* ---------- footer ---------- */

      .pr-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 14px;
        padding: 14px 24px;
        border-top: 1px solid var(--line);
        background: #f8f9fc;
        font-size: 13px;
        color: var(--muted);
      }

      .pr-footer strong {
        color: var(--ink);
        font-weight: 800;
      }

      .pr-pagination {
        display: flex;
        align-items: center;
        gap: 5px;
      }

      .pr-pagination button {
        min-width: 34px;
        height: 34px;
        padding: 0 10px;
        border: 1px solid var(--line);
        border-radius: 9px;
        background: #fff;
        color: var(--ink-soft);
        font: 700 12px Manrope, inherit;
        cursor: pointer;
      }

      .pr-pagination button:hover:not(:disabled) {
        border-color: #c5cddd;
      }

      .pr-pagination button.pr-current {
        background: var(--ink);
        border-color: var(--ink);
        color: #fff;
      }

      .pr-pagination button:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .pr-pagination span {
        padding: 0 2px;
      }

      /* ---------- loading / empty ---------- */

      .pr-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 340px;
        padding: 48px 24px;
        text-align: center;
      }

      .pr-state h3 {
        font-size: 19px;
        font-weight: 800;
      }

      .pr-state strong {
        font-size: 15px;
        font-weight: 800;
      }

      .pr-state p {
        max-width: 360px;
        margin-top: 6px;
        font-size: 14px;
        line-height: 1.5;
        color: var(--muted);
      }

      .pr-state .pr-btn {
        margin-top: 18px;
      }

      .pr-state-icon {
        width: 62px;
        height: 62px;
        display: grid;
        place-items: center;
        margin-bottom: 16px;
        border-radius: 20px;
        background: #e6eaf3;
        color: var(--muted);
      }

      .pr-spinner {
        width: 38px;
        height: 38px;
        margin-bottom: 14px;
        border: 4px solid #dbe1ee;
        border-top-color: var(--brand);
        border-radius: 50%;
        animation: pr-spin 0.8s linear infinite;
      }

      @keyframes pr-spin {
        to { transform: rotate(360deg); }
      }

      /* ---------- modal ---------- */

      .pr-backdrop {
        position: fixed;
        inset: 0;
        z-index: 2000;
        display: grid;
        place-items: center;
        padding: 20px;
        background: rgba(10, 18, 36, 0.6);
        backdrop-filter: blur(6px);
      }

      .pr-modal {
        width: min(740px, 100%);
        max-height: min(860px, 92vh);
        overflow: auto;
        background: #fff;
        border-radius: 22px;
        box-shadow: 0 30px 80px rgba(0, 0, 0, 0.3);
      }

      .pr-modal-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        padding: 24px;
        background: var(--ink);
        color: #fff;
      }

      .pr-modal-hero {
        display: flex;
        align-items: center;
        gap: 16px;
        min-width: 0;
      }

      .pr-modal-img {
        flex: none;
        width: 76px;
        height: 76px;
        border-radius: 18px;
        object-fit: cover;
        border: 1px solid rgba(255, 255, 255, 0.2);
        font-size: 28px;
      }

      .pr-modal-hero h2 {
        font-size: 22px;
        font-weight: 800;
        letter-spacing: -0.4px;
        overflow-wrap: anywhere;
      }

      .pr-modal-hero p {
        margin-top: 4px;
        font-size: 13px;
        color: #b8c3dd;
      }

      .pr-modal-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 12px;
      }

      .pr-modal-close {
        flex: none;
        width: 38px;
        height: 38px;
        display: grid;
        place-items: center;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 11px;
        background: rgba(255, 255, 255, 0.08);
        color: #fff;
        cursor: pointer;
      }

      .pr-modal-close:hover {
        background: rgba(255, 255, 255, 0.16);
      }

      .pr-modal-body {
        padding: 22px 24px;
      }

      .pr-facts {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        border: 1px solid var(--line);
        border-radius: 14px;
        overflow: hidden;
      }

      .pr-facts > div {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 16px;
        border-right: 1px solid var(--line);
      }

      .pr-facts > div:last-child {
        border-right: 0;
      }

      .pr-facts span {
        font-size: 12px;
        font-weight: 600;
        color: var(--muted);
      }

      .pr-facts strong {
        font-size: 17px;
        font-weight: 800;
        letter-spacing: -0.3px;
        color: var(--ink);
      }

      .pr-facts small {
        font-size: 12px;
        color: var(--muted);
      }

      .pr-details {
        margin-top: 16px;
        border: 1px solid var(--line);
        border-radius: 14px;
        overflow: hidden;
      }

      .pr-details > div {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        padding: 13px 16px;
        border-bottom: 1px solid #eef1f6;
      }

      .pr-details > div:last-child {
        border-bottom: 0;
      }

      .pr-details dt {
        font-size: 13px;
        color: var(--muted);
      }

      .pr-details dd {
        max-width: 70%;
        font-size: 13px;
        font-weight: 700;
        text-align: right;
        overflow-wrap: anywhere;
        color: var(--ink);
      }

      .pr-modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding: 16px 24px;
        border-top: 1px solid var(--line);
        background: #f8f9fc;
      }

      /* ---------- responsive ---------- */

      @media (prefers-reduced-motion: reduce) {
        .pr-spinner { animation-duration: 2s; }
        .pr-page * { transition: none !important; }
      }

      @media (max-width: 1100px) {
        .pr-toolbar {
          grid-template-columns: 1fr 1fr;
        }

        .pr-search {
          grid-column: span 2;
        }
      }

      @media (max-width: 900px) {
        .pr-tabs {
          grid-template-columns: repeat(2, 1fr);
        }

        .pr-tab:nth-child(2) {
          border-right: 0;
        }

        .pr-tab:nth-child(-n + 2) {
          border-bottom: 1px solid var(--line);
        }

        .pr-facts {
          grid-template-columns: repeat(2, 1fr);
        }

        .pr-facts > div:nth-child(2) {
          border-right: 0;
        }

        .pr-facts > div:nth-child(-n + 2) {
          border-bottom: 1px solid var(--line);
        }
      }

      /* Table becomes stacked product cards on phones */
      @media (max-width: 720px) {
        .pr-shell {
          width: calc(100% - 24px);
          padding-top: 18px;
        }

        .pr-header {
          flex-direction: column;
          align-items: stretch;
        }

        .pr-header-actions > * {
          flex: 1;
        }

        .pr-value {
          padding: 20px;
        }

        .pr-toolbar {
          grid-template-columns: 1fr;
          padding: 16px;
        }

        .pr-search {
          grid-column: auto;
        }

        .pr-sort .pr-field {
          flex: 1;
          min-width: 0;
        }

        .pr-subbar {
          padding: 0 16px 12px;
        }

        .pr-table {
          min-width: 0;
        }

        .pr-table thead {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
        }

        .pr-table,
        .pr-table tbody,
        .pr-table tr,
        .pr-table td {
          display: block;
          width: 100%;
        }

        .pr-table tbody tr {
          padding: 14px 16px;
          border-bottom: 1px solid var(--line);
        }

        .pr-table tbody tr:last-child {
          border-bottom: 0;
        }

        .pr-table td {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 8px 0;
          border: 0;
          text-align: right;
        }

        .pr-table td::before {
          content: attr(data-label);
          flex: none;
          font-size: 12px;
          font-weight: 700;
          color: var(--muted);
        }

        .pr-table td[data-label="Product"] {
          display: block;
          padding-top: 0;
        }

        .pr-table td[data-label="Product"]::before,
        .pr-table td[data-label=""]::before {
          content: none;
        }

        .pr-product {
          min-width: 0;
          text-align: left;
        }

        .pr-product-text strong {
          max-width: 100%;
          white-space: normal;
        }

        .pr-price,
        .pr-stock {
          align-items: flex-end;
          min-width: 0;
        }

        .pr-stock {
          width: 150px;
        }

        .pr-expiry {
          align-items: flex-end;
        }

        .pr-actions-cell {
          justify-content: flex-end;
          padding-bottom: 0;
        }

        .pr-footer {
          flex-direction: column;
          align-items: flex-start;
          padding: 14px 16px;
        }

        .pr-pagination {
          width: 100%;
          justify-content: center;
          flex-wrap: wrap;
        }

        .pr-backdrop {
          padding: 8px;
        }

        .pr-modal-top,
        .pr-modal-body,
        .pr-modal-actions {
          padding-left: 16px;
          padding-right: 16px;
        }

        .pr-modal-actions > * {
          flex: 1;
        }
      }

      @media (max-width: 480px) {
        .pr-tab {
          padding: 14px;
          gap: 10px;
        }

        .pr-tab-icon {
          width: 34px;
          height: 34px;
        }

        .pr-tab-text strong {
          font-size: 20px;
        }

        .pr-tab-note {
          display: none;
        }

        .pr-facts {
          grid-template-columns: 1fr;
        }

        .pr-facts > div {
          border-right: 0;
          border-bottom: 1px solid var(--line);
        }

        .pr-facts > div:last-child {
          border-bottom: 0;
        }
      }
    `}</style>
  );
}