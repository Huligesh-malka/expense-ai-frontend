import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../services/api";

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "paid", label: "Paid" },
  { key: "pending", label: "Pending" },
  { key: "unpaid", label: "Unpaid" },
];

/* Values that mean "nothing here" and should never be shown */
const PLACEHOLDER = /^(-+|—+|n\/?a|null|undefined|none|walk[\s-]?in(\s+customer)?)$/i;

/* Returns the first real (non-empty, non-placeholder) value */
const pick = (...values) => {
  for (const v of values) {
    if (v === undefined || v === null) continue;

    const text = String(v).trim();
    if (text !== "" && !PLACEHOLDER.test(text)) return text;
  }
  return "";
};

/* Reads contact details the same way the invoice page does
   (customer_phone / customer_email), and falls back to the
   customer's bills if the customer object doesn't have them. */
function resolveContact(customer, sales) {
  const c = customer || {};
  const fromSale =
    (sales || []).find(
      (s) => s.customer_phone || s.customer_email || s.customer_name
    ) || {};

  return {
    name: pick(c.name, c.customer_name, c.full_name, fromSale.customer_name),
    phone: pick(
      c.phone,
      c.customer_phone,
      c.mobile,
      c.phone_number,
      c.contact,
      fromSale.customer_phone
    ),
    email: pick(c.email, c.customer_email, fromSale.customer_email),
    address: pick(c.address, c.customer_address),
  };
}

export default function CustomerDetails() {
  const { id } = useParams();

  const [customer, setCustomer] = useState(null);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  useEffect(() => {
    loadCustomer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadCustomer = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await API.get(`/customers/${id}/history`);

      if (res.data.success) {
        setCustomer(res.data.customer);
        setSales(res.data.sales || []);
      } else {
        setError(res.data.message || "Unable to load customer.");
      }
    } catch (err) {
      console.error("Customer history error:", err);

      setError(
        err.response?.data?.message || "Unable to load customer details."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ---------- helpers ---------- */

  const formatCurrency = (amount) =>
    `₹${(Number(amount) || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatDate = (date) => {
    if (!date) return "—";
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return "—";

    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getPaymentStatus = (status) => {
    const value = String(status || "Pending").toLowerCase();

    if (value === "paid" || value === "completed") return "paid";
    if (value === "pending") return "pending";
    if (value === "unpaid") return "unpaid";
    return "default";
  };

  const getPaymentIcon = (method) => {
    const value = String(method || "").toLowerCase();

    if (value.includes("cash")) return "fa-money-bill";
    if (value.includes("upi")) return "fa-mobile-alt";
    if (value.includes("card")) return "fa-credit-card";
    if (value.includes("online")) return "fa-globe";
    return "fa-wallet";
  };

  const capitalize = (text) =>
    text ? text.charAt(0).toUpperCase() + text.slice(1) : "Unknown";

  const getInitials = (name) => {
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  };

  /* ---------- derived data ---------- */

  const stats = useMemo(() => {
    const totalOrders = Number(customer?.total_orders) || sales.length;
    const totalSpent =
      Number(customer?.total_spent) ||
      sales.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0);

    const outstanding = sales.reduce((sum, s) => {
      return getPaymentStatus(s.payment_status) === "paid"
        ? sum
        : sum + (Number(s.total_amount) || 0);
    }, 0);

    return {
      totalOrders,
      totalSpent,
      outstanding,
      averageOrder: totalOrders > 0 ? totalSpent / totalOrders : 0,
    };
  }, [customer, sales]);

  const statusCounts = useMemo(() => {
    const counts = { all: sales.length, paid: 0, pending: 0, unpaid: 0 };
    sales.forEach((s) => {
      const key = getPaymentStatus(s.payment_status);
      if (counts[key] !== undefined) counts[key] += 1;
    });
    return counts;
  }, [sales]);

  const visibleSales = useMemo(() => {
    const term = search.trim().toLowerCase();

    const filtered = sales.filter((sale) => {
      if (
        statusFilter !== "all" &&
        getPaymentStatus(sale.payment_status) !== statusFilter
      ) {
        return false;
      }

      if (!term) return true;

      const invoice = String(sale.invoice_no || `INV-${sale.id}`).toLowerCase();
      const method = String(sale.payment_method || "").toLowerCase();
      return invoice.includes(term) || method.includes(term);
    });

    return filtered.sort((a, b) => {
      const da = new Date(a.created_at).getTime() || 0;
      const db = new Date(b.created_at).getTime() || 0;
      return sortOrder === "newest" ? db - da : da - db;
    });
  }, [sales, search, statusFilter, sortOrder]);

  const contact = useMemo(
    () => resolveContact(customer, sales),
    [customer, sales]
  );

  const displayName = contact.name || `Customer #${customer?.id || id}`;

  const filtersActive = search.trim() !== "" || statusFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  const exportCsv = () => {
    if (visibleSales.length === 0) return;

    const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const header = ["Invoice", "Date", "Payment method", "Status", "Amount"];

    const rows = visibleSales.map((s) => [
      s.invoice_no || `INV-${s.id}`,
      formatDate(s.created_at),
      capitalize(s.payment_method),
      s.payment_status || "Pending",
      Number(s.total_amount) || 0,
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map(escape).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeName = String(displayName || "customer")
      .replace(/[^a-z0-9]+/gi, "-")
      .toLowerCase();

    link.href = url;
    link.download = `${safeName}-purchase-history.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /* ---------- states ---------- */

  if (loading) {
    return (
      <div className="cd-page">
        <div className="cd-center" role="status" aria-live="polite">
          <div className="cd-spinner"></div>
          <p>Loading purchase history…</p>
        </div>
        <Styles />
      </div>
    );
  }

  if (error) {
    return (
      <div className="cd-page">
        <div className="cd-center" role="alert">
          <div className="cd-state-icon cd-state-icon-error">
            <i className="fas fa-exclamation-circle"></i>
          </div>

          <h2>Couldn’t load this customer</h2>
          <p>{error}</p>

          <div className="cd-state-actions">
            <button onClick={loadCustomer} className="cd-btn cd-btn-primary">
              <i className="fas fa-redo"></i>
              Try again
            </button>

            <Link to="/customers" className="cd-btn cd-btn-ghost">
              <i className="fas fa-arrow-left"></i>
              Back to customers
            </Link>
          </div>
        </div>
        <Styles />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="cd-page">
        <div className="cd-center">
          <div className="cd-state-icon">
            <i className="fas fa-user-slash"></i>
          </div>

          <h2>Customer not found</h2>
          <p>This customer may have been deleted or the link is incorrect.</p>

          <Link to="/customers" className="cd-btn cd-btn-primary">
            <i className="fas fa-arrow-left"></i>
            Back to customers
          </Link>
        </div>
        <Styles />
      </div>
    );
  }

  /* ---------- main view ---------- */

  const hasOutstanding = stats.outstanding > 0;

  return (
    <div className="cd-page">
      {/* TOP BAR */}
      <nav className="cd-topbar" aria-label="Breadcrumb">
        <Link to="/customers" className="cd-crumb">
          <i className="fas fa-arrow-left"></i>
          Customers
        </Link>

        <button className="cd-btn cd-btn-ghost" onClick={loadCustomer}>
          <i className="fas fa-sync-alt"></i>
          Refresh
        </button>
      </nav>

      {/* PROFILE + HEADLINE NUMBERS */}
      <section className="cd-profile">
        <div className="cd-profile-main">
          <div className="cd-avatar" aria-hidden="true">
            {contact.name ? (
              getInitials(contact.name)
            ) : (
              <i className="fas fa-user"></i>
            )}
          </div>

          <div className="cd-identity">
            <h1>{displayName}</h1>

            {(contact.phone || contact.email || contact.address) && (
              <ul className="cd-contact">
                {contact.phone && (
                  <li>
                    <i className="fas fa-phone-alt"></i>
                    {contact.phone}
                  </li>
                )}
                {contact.email && (
                  <li>
                    <i className="fas fa-envelope"></i>
                    {contact.email}
                  </li>
                )}
                {contact.address && (
                  <li>
                    <i className="fas fa-map-marker-alt"></i>
                    {contact.address}
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>

        <div
          className={`cd-balance ${
            hasOutstanding ? "cd-balance-due" : "cd-balance-clear"
          }`}
        >
          <span className="cd-balance-label">
            {hasOutstanding ? "Amount to collect" : "Account status"}
          </span>

          <strong className="cd-balance-value">
            {hasOutstanding ? formatCurrency(stats.outstanding) : "All paid"}
          </strong>

          <span className="cd-balance-note">
            {hasOutstanding
              ? "Pending and unpaid bills"
              : "No pending or unpaid bills"}
          </span>
        </div>
      </section>

      {/* STAT STRIP */}
      <section className="cd-stats" aria-label="Purchase summary">
        <div className="cd-stat">
          <span className="cd-stat-label">Total spent</span>
          <strong className="cd-stat-value">
            {formatCurrency(stats.totalSpent)}
          </strong>
          <span className="cd-stat-note">Lifetime purchase value</span>
        </div>

        <div className="cd-stat">
          <span className="cd-stat-label">Orders</span>
          <strong className="cd-stat-value">{stats.totalOrders}</strong>
          <span className="cd-stat-note">Bills generated</span>
        </div>

        <div className="cd-stat">
          <span className="cd-stat-label">Average bill</span>
          <strong className="cd-stat-value">
            {formatCurrency(stats.averageOrder)}
          </strong>
          <span className="cd-stat-note">Per transaction</span>
        </div>

        <div className="cd-stat">
          <span className="cd-stat-label">Last purchase</span>
          <strong className="cd-stat-value cd-stat-value-sm">
            {customer.last_purchase
              ? formatDate(customer.last_purchase)
              : "No purchases"}
          </strong>
          <span className="cd-stat-note">Most recent bill</span>
        </div>
      </section>

      {/* TRANSACTIONS */}
      <section className="cd-ledger">
        <header className="cd-ledger-head">
          <div>
            <h2>Transactions</h2>
            <p>
              {filtersActive
                ? `Showing ${visibleSales.length} of ${sales.length} bills`
                : `${sales.length} ${
                    sales.length === 1 ? "bill" : "bills"
                  } on record`}
            </p>
          </div>

          <button
            className="cd-btn cd-btn-ghost"
            onClick={exportCsv}
            disabled={visibleSales.length === 0}
          >
            <i className="fas fa-file-download"></i>
            Export CSV
          </button>
        </header>

        {sales.length > 0 && (
          <div className="cd-toolbar">
            <div className="cd-search">
              <i className="fas fa-search"></i>
              <input
                type="search"
                placeholder="Search invoice or payment method"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search transactions"
              />
            </div>

            <div className="cd-chips" role="group" aria-label="Filter by status">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  className={`cd-chip ${
                    statusFilter === f.key ? "cd-chip-active" : ""
                  }`}
                  onClick={() => setStatusFilter(f.key)}
                  aria-pressed={statusFilter === f.key}
                >
                  {f.label}
                  <span className="cd-chip-count">{statusCounts[f.key]}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              className="cd-sort"
              onClick={() =>
                setSortOrder((s) => (s === "newest" ? "oldest" : "newest"))
              }
            >
              <i
                className={`fas ${
                  sortOrder === "newest"
                    ? "fa-sort-amount-down"
                    : "fa-sort-amount-up"
                }`}
              ></i>
              {sortOrder === "newest" ? "Newest first" : "Oldest first"}
            </button>
          </div>
        )}

        {sales.length === 0 ? (
          <div className="cd-empty">
            <div className="cd-state-icon">
              <i className="fas fa-receipt"></i>
            </div>
            <h3>No transactions yet</h3>
            <p>Bills created for this customer will show up here.</p>
          </div>
        ) : visibleSales.length === 0 ? (
          <div className="cd-empty">
            <div className="cd-state-icon">
              <i className="fas fa-search"></i>
            </div>
            <h3>No bills match your filters</h3>
            <p>Try a different search or status.</p>
            <button className="cd-btn cd-btn-primary" onClick={clearFilters}>
              Clear filters
            </button>
          </div>
        ) : (
          <div className="cd-table-wrap">
            <table className="cd-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Date</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th className="cd-right">Amount</th>
                  <th className="cd-right">
                    <span className="cd-sr-only">Action</span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {visibleSales.map((sale, index) => {
                  const status = getPaymentStatus(sale.payment_status);

                  return (
                    <tr key={sale.id || index}>
                      <td data-label="Invoice">
                        <span className="cd-invoice">
                          <i className="fas fa-file-invoice"></i>
                          {sale.invoice_no || `INV-${sale.id}`}
                        </span>
                      </td>

                      <td data-label="Date">{formatDate(sale.created_at)}</td>

                      <td data-label="Payment">
                        <span className="cd-method">
                          <i
                            className={`fas ${getPaymentIcon(
                              sale.payment_method
                            )}`}
                          ></i>
                          {capitalize(sale.payment_method)}
                        </span>
                      </td>

                      <td data-label="Status">
                        <span className={`cd-status cd-status-${status}`}>
                          <span className="cd-status-dot"></span>
                          {sale.payment_status || "Pending"}
                        </span>
                      </td>

                      <td className="cd-right" data-label="Amount">
                        <span className="cd-amount">
                          {formatCurrency(sale.total_amount)}
                        </span>
                      </td>

                      <td className="cd-right cd-action" data-label="">
                        <Link
                          to={`/invoice/${sale.id}`}
                          className="cd-view"
                          aria-label={`View invoice ${
                            sale.invoice_no || sale.id
                          }`}
                        >
                          View
                          <i className="fas fa-chevron-right"></i>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <footer className="cd-ledger-foot">
          <span>
            <i className="fas fa-shield-alt"></i>
            Transaction records are securely stored
          </span>

          {visibleSales.length > 0 && (
            <span>
              Total shown:{" "}
              <strong>
                {formatCurrency(
                  visibleSales.reduce(
                    (sum, s) => sum + (Number(s.total_amount) || 0),
                    0
                  )
                )}
              </strong>
            </span>
          )}
        </footer>
      </section>

      <Styles />
    </div>
  );
}

/* ====================================================== */
/* Styles are scoped under .cd- so nothing leaks globally  */
/* ====================================================== */

function Styles() {
  return (
    <style>{`
      @import url("https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap");

      .cd-page {
        --cd-ink: #14213d;
        --cd-ink-soft: #3b4a68;
        --cd-muted: #6b7794;
        --cd-line: #e1e6ef;
        --cd-bg: #eef1f6;
        --cd-surface: #ffffff;
        --cd-brand: #1d4ed8;
        --cd-brand-soft: #e8eefc;
        --cd-green: #157347;
        --cd-green-soft: #dff4e8;
        --cd-amber: #9a5b00;
        --cd-amber-soft: #fdf0d2;
        --cd-red: #b3261e;
        --cd-red-soft: #fbe3e1;

        box-sizing: border-box;
        min-height: 100vh;
        padding: 28px clamp(16px, 4vw, 40px) 48px;
        background: var(--cd-bg);
        color: var(--cd-ink);
        font-family: Manrope, Inter, -apple-system, BlinkMacSystemFont,
          "Segoe UI", sans-serif;
        font-variant-numeric: tabular-nums;
      }

      .cd-page *,
      .cd-page *::before,
      .cd-page *::after {
        box-sizing: border-box;
      }

      .cd-page h1,
      .cd-page h2,
      .cd-page h3,
      .cd-page p,
      .cd-page ul {
        margin: 0;
        padding: 0;
      }

      .cd-page :focus-visible {
        outline: 3px solid #93b4ff;
        outline-offset: 2px;
      }

      .cd-sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
        white-space: nowrap;
      }

      /* ---------- buttons ---------- */

      .cd-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 10px 16px;
        border-radius: 10px;
        border: 1px solid transparent;
        font: 700 13px/1 inherit;
        font-family: inherit;
        text-decoration: none;
        cursor: pointer;
        transition: background 0.15s, border-color 0.15s, color 0.15s;
      }

      .cd-btn:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }

      .cd-btn-primary {
        background: var(--cd-ink);
        color: #fff;
      }

      .cd-btn-primary:hover {
        background: #0c1529;
      }

      .cd-btn-ghost {
        background: var(--cd-surface);
        color: var(--cd-ink-soft);
        border-color: var(--cd-line);
      }

      .cd-btn-ghost:hover:not(:disabled) {
        border-color: #c5cddd;
        color: var(--cd-ink);
      }

      /* ---------- top bar ---------- */

      .cd-topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 20px;
      }

      .cd-crumb {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        color: var(--cd-ink-soft);
        font-size: 14px;
        font-weight: 700;
        text-decoration: none;
      }

      .cd-crumb:hover {
        color: var(--cd-brand);
      }

      /* ---------- profile ---------- */

      .cd-profile {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 24px;
        align-items: stretch;
        padding: 28px;
        background: var(--cd-ink);
        color: #fff;
        border-radius: 22px 22px 0 0;
      }

      .cd-profile-main {
        display: flex;
        align-items: center;
        gap: 20px;
        min-width: 0;
      }

      .cd-avatar {
        flex: none;
        width: 68px;
        height: 68px;
        display: grid;
        place-items: center;
        border-radius: 20px;
        background: #f6c453;
        color: #14213d;
        font-size: 24px;
        font-weight: 800;
        letter-spacing: -0.5px;
      }

      .cd-identity {
        min-width: 0;
      }

      .cd-identity h1 {
        font-size: clamp(22px, 3vw, 30px);
        font-weight: 800;
        letter-spacing: -0.6px;
        overflow-wrap: anywhere;
      }

      .cd-contact {
        display: flex;
        flex-wrap: wrap;
        gap: 6px 18px;
        margin-top: 10px;
        list-style: none;
        color: #ffffff;
        font-size: 14px;
        font-weight: 600;
      }

      .cd-contact li {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }

      .cd-contact i {
        color: #ffffff;
        opacity: 0.75;
        font-size: 12px;
      }

      .cd-balance {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 4px;
        min-width: 230px;
        padding: 16px 20px;
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.14);
        background: rgba(255, 255, 255, 0.06);
      }

      .cd-balance-label {
        font-size: 12px;
        font-weight: 600;
        color: #b8c3dd;
      }

      .cd-balance-value {
        font-size: 28px;
        font-weight: 800;
        letter-spacing: -0.8px;
      }

      .cd-balance-due .cd-balance-value {
        color: #ffd27a;
      }

      .cd-balance-clear .cd-balance-value {
        color: #8be0b0;
      }

      .cd-balance-note {
        font-size: 12px;
        color: #9aa9cb;
      }

      /* ---------- stat strip ---------- */

      .cd-stats {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        background: var(--cd-surface);
        border: 1px solid var(--cd-line);
        border-top: none;
      }

      .cd-stat {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 20px 24px;
        border-right: 1px solid var(--cd-line);
      }

      .cd-stat:last-child {
        border-right: none;
      }

      .cd-stat-label {
        font-size: 13px;
        font-weight: 600;
        color: var(--cd-muted);
      }

      .cd-stat-value {
        font-size: 24px;
        font-weight: 800;
        letter-spacing: -0.6px;
        color: var(--cd-ink);
      }

      .cd-stat-value-sm {
        font-size: 19px;
        padding: 3px 0;
      }

      .cd-stat-note {
        font-size: 12px;
        color: var(--cd-muted);
      }

      /* ---------- ledger ---------- */

      .cd-ledger {
        margin-top: 20px;
        background: var(--cd-surface);
        border: 1px solid var(--cd-line);
        border-radius: 18px;
        overflow: hidden;
      }

      .cd-ledger-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 22px 24px 8px;
      }

      .cd-ledger-head h2 {
        font-size: 19px;
        font-weight: 800;
        letter-spacing: -0.3px;
      }

      .cd-ledger-head p {
        margin-top: 4px;
        font-size: 13px;
        color: var(--cd-muted);
      }

      .cd-toolbar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px;
        padding: 14px 24px 18px;
        border-bottom: 1px solid var(--cd-line);
      }

      .cd-search {
        position: relative;
        flex: 1 1 240px;
        max-width: 340px;
      }

      .cd-search i {
        position: absolute;
        left: 13px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--cd-muted);
        font-size: 12px;
        pointer-events: none;
      }

      .cd-search input {
        width: 100%;
        height: 40px;
        padding: 0 12px 0 36px;
        border: 1px solid var(--cd-line);
        border-radius: 10px;
        background: #f8f9fc;
        color: var(--cd-ink);
        font: 500 13px inherit;
        font-family: inherit;
      }

      .cd-search input::placeholder {
        color: #8c97b0;
      }

      .cd-search input:focus {
        background: #fff;
        border-color: #93b4ff;
        outline: none;
      }

      .cd-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .cd-chip {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        height: 40px;
        padding: 0 12px;
        border: 1px solid var(--cd-line);
        border-radius: 10px;
        background: #fff;
        color: var(--cd-ink-soft);
        font: 700 13px inherit;
        font-family: inherit;
        cursor: pointer;
        transition: background 0.15s, color 0.15s, border-color 0.15s;
      }

      .cd-chip:hover {
        border-color: #c5cddd;
      }

      .cd-chip-active {
        background: var(--cd-brand-soft);
        border-color: #b8ccf8;
        color: var(--cd-brand);
      }

      .cd-chip-count {
        min-width: 22px;
        padding: 2px 6px;
        border-radius: 6px;
        background: rgba(20, 33, 61, 0.07);
        font-size: 11px;
        text-align: center;
      }

      .cd-chip-active .cd-chip-count {
        background: rgba(29, 78, 216, 0.14);
      }

      .cd-sort {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        height: 40px;
        margin-left: auto;
        padding: 0 12px;
        border: none;
        background: none;
        color: var(--cd-ink-soft);
        font: 700 13px inherit;
        font-family: inherit;
        cursor: pointer;
        border-radius: 10px;
      }

      .cd-sort:hover {
        color: var(--cd-brand);
      }

      /* ---------- table ---------- */

      .cd-table-wrap {
        overflow-x: auto;
      }

      .cd-table {
        width: 100%;
        border-collapse: collapse;
      }

      .cd-table th {
        padding: 13px 24px;
        text-align: left;
        font-size: 12px;
        font-weight: 700;
        color: var(--cd-muted);
        background: #f8f9fc;
        border-bottom: 1px solid var(--cd-line);
        white-space: nowrap;
      }

      .cd-table td {
        padding: 16px 24px;
        border-bottom: 1px solid #eef1f6;
        font-size: 14px;
        font-weight: 500;
        color: var(--cd-ink-soft);
        vertical-align: middle;
      }

      .cd-table tbody tr:last-child td {
        border-bottom: none;
      }

      .cd-table tbody tr:hover {
        background: #f8f9fc;
      }

      .cd-right {
        text-align: right !important;
      }

      .cd-invoice {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        font-weight: 700;
        color: var(--cd-ink);
      }

      .cd-invoice i {
        color: var(--cd-brand);
        font-size: 14px;
      }

      .cd-method {
        display: inline-flex;
        align-items: center;
        gap: 10px;
      }

      .cd-method i {
        width: 16px;
        text-align: center;
        color: var(--cd-muted);
      }

      .cd-status {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 5px 11px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
        text-transform: capitalize;
        white-space: nowrap;
      }

      .cd-status-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
      }

      .cd-status-paid {
        background: var(--cd-green-soft);
        color: var(--cd-green);
      }

      .cd-status-pending {
        background: var(--cd-amber-soft);
        color: var(--cd-amber);
      }

      .cd-status-unpaid {
        background: var(--cd-red-soft);
        color: var(--cd-red);
      }

      .cd-status-default {
        background: #eef1f6;
        color: var(--cd-muted);
      }

      .cd-amount {
        font-size: 15px;
        font-weight: 800;
        color: var(--cd-ink);
        white-space: nowrap;
      }

      .cd-view {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 9px;
        color: var(--cd-brand);
        font-size: 13px;
        font-weight: 700;
        text-decoration: none;
        white-space: nowrap;
        transition: background 0.15s;
      }

      .cd-view i {
        font-size: 10px;
      }

      .cd-view:hover {
        background: var(--cd-brand-soft);
      }

      /* ---------- footer ---------- */

      .cd-ledger-foot {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 14px 24px;
        border-top: 1px solid var(--cd-line);
        background: #f8f9fc;
        font-size: 12px;
        color: var(--cd-muted);
      }

      .cd-ledger-foot i {
        margin-right: 8px;
        color: #2f9e6b;
      }

      .cd-ledger-foot strong {
        color: var(--cd-ink);
        font-weight: 800;
      }

      /* ---------- empty / loading / error ---------- */

      .cd-empty,
      .cd-center {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
      }

      .cd-empty {
        padding: 56px 24px;
      }

      .cd-center {
        min-height: 70vh;
        gap: 4px;
      }

      .cd-state-icon {
        width: 64px;
        height: 64px;
        display: grid;
        place-items: center;
        margin-bottom: 16px;
        border-radius: 20px;
        background: #e6eaf3;
        color: var(--cd-muted);
        font-size: 24px;
      }

      .cd-state-icon-error {
        background: var(--cd-red-soft);
        color: var(--cd-red);
      }

      .cd-empty h3,
      .cd-center h2 {
        font-size: 19px;
        font-weight: 800;
        color: var(--cd-ink);
      }

      .cd-empty p,
      .cd-center p {
        max-width: 380px;
        margin-top: 6px;
        font-size: 14px;
        color: var(--cd-muted);
        line-height: 1.5;
      }

      .cd-empty .cd-btn {
        margin-top: 18px;
      }

      .cd-state-actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 10px;
        margin-top: 22px;
      }

      .cd-center > .cd-btn {
        margin-top: 20px;
      }

      .cd-spinner {
        width: 40px;
        height: 40px;
        margin-bottom: 12px;
        border: 4px solid #dbe1ee;
        border-top-color: var(--cd-brand);
        border-radius: 50%;
        animation: cd-spin 0.8s linear infinite;
      }

      @keyframes cd-spin {
        to {
          transform: rotate(360deg);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .cd-spinner {
          animation-duration: 2s;
        }

        .cd-page * {
          transition: none !important;
        }
      }

      /* ---------- responsive ---------- */

      @media (max-width: 960px) {
        .cd-profile {
          grid-template-columns: 1fr;
        }

        .cd-balance {
          min-width: 0;
        }

        .cd-stats {
          grid-template-columns: repeat(2, 1fr);
        }

        .cd-stat:nth-child(2) {
          border-right: none;
        }

        .cd-stat:nth-child(-n + 2) {
          border-bottom: 1px solid var(--cd-line);
        }
      }

      /* Table turns into stacked bill cards on phones */
      @media (max-width: 720px) {
        .cd-page {
          padding-top: 18px;
        }

        .cd-profile {
          padding: 20px;
          border-radius: 18px 18px 0 0;
        }

        .cd-avatar {
          width: 56px;
          height: 56px;
          font-size: 20px;
          border-radius: 16px;
        }

        .cd-ledger-head,
        .cd-toolbar,
        .cd-ledger-foot {
          padding-left: 16px;
          padding-right: 16px;
        }

        .cd-sort {
          margin-left: 0;
        }

        .cd-search {
          max-width: none;
        }

        .cd-table thead {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
        }

        .cd-table,
        .cd-table tbody,
        .cd-table tr,
        .cd-table td {
          display: block;
          width: 100%;
        }

        .cd-table tbody tr {
          padding: 12px 16px;
          border-bottom: 1px solid var(--cd-line);
        }

        .cd-table tbody tr:last-child {
          border-bottom: none;
        }

        .cd-table td {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 8px 0;
          border: none;
          text-align: right;
        }

        .cd-table td::before {
          content: attr(data-label);
          flex: none;
          font-size: 12px;
          font-weight: 700;
          color: var(--cd-muted);
        }

        .cd-table td.cd-action {
          justify-content: flex-end;
          padding-top: 4px;
        }

        .cd-table td.cd-action::before {
          content: none;
        }

        .cd-view {
          background: var(--cd-brand-soft);
        }
      }

      @media (max-width: 480px) {
        .cd-stats {
          grid-template-columns: 1fr;
        }

        .cd-stat {
          border-right: none;
          border-bottom: 1px solid var(--cd-line);
          padding: 16px 20px;
        }

        .cd-stat:last-child {
          border-bottom: none;
        }

        .cd-balance-value {
          font-size: 24px;
        }

        .cd-ledger-head {
          flex-wrap: wrap;
        }
      }
    `}</style>
  );
}