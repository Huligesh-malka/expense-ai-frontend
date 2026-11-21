import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

import {
  FiPlus,
  FiSearch,
  FiEye,
  FiX,
  FiRefreshCw,
  FiAlertCircle,
  FiShoppingCart,
  FiChevronRight,
} from "react-icons/fi";

const STATUS_TABS = [
  { key: "all", label: "All bills" },
  { key: "unpaid", label: "Not paid" },
  { key: "partial", label: "Partially paid" },
  { key: "paid", label: "Fully paid" },
];

const STATUS_LABELS = {
  paid: "Fully paid",
  partial: "Partially paid",
  unpaid: "Not paid",
};

const DATE_OPTIONS = [
  { value: "All", label: "All dates" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

/* ---------- helpers ---------- */

const toNumber = (value) => Number(value) || 0;

const getStatusKey = (purchase) => {
  const total = toNumber(purchase.total_amount);
  const paid = toNumber(purchase.paid_amount);
  const backendStatus = String(purchase.payment_status || "").toLowerCase();

  if (backendStatus === "paid" || (total > 0 && paid >= total)) return "paid";
  if (backendStatus === "partial" || (paid > 0 && paid < total)) return "partial";
  return "unpaid";
};

const getDue = (purchase) => {
  const fallback = toNumber(purchase.total_amount) - toNumber(purchase.paid_amount);
  const due =
    purchase.due_amount !== undefined && purchase.due_amount !== null
      ? toNumber(purchase.due_amount)
      : fallback;
  return Math.max(0, due);
};

const formatMoney = (value) =>
  `₹${toNumber(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/* ---------- component ---------- */

export default function Purchase() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSupplier, setFilterSupplier] = useState("All");
  const [filterDate, setFilterDate] = useState("All");

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const res = await API.get("/purchases");
      setPurchases(res.data.data || []);
    } catch (err) {
      console.error("Failed to load purchases:", err);
      setError(
        err.response?.data?.message || "Unable to load purchases right now."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* ---------- derived data ---------- */

  const summary = useMemo(() => {
    const totalBought = purchases.reduce(
      (sum, p) => sum + toNumber(p.total_amount),
      0
    );
    const totalPaid = purchases.reduce(
      (sum, p) => sum + toNumber(p.paid_amount),
      0
    );
    const totalDue = purchases.reduce((sum, p) => sum + getDue(p), 0);
    const openBills = purchases.filter((p) => getStatusKey(p) !== "paid").length;

    return {
      totalPurchases: purchases.length,
      totalBought,
      totalPaid,
      totalDue,
      openBills,
    };
  }, [purchases]);

  const statusCounts = useMemo(() => {
    const counts = { all: purchases.length, paid: 0, partial: 0, unpaid: 0 };
    purchases.forEach((p) => {
      counts[getStatusKey(p)] += 1;
    });
    return counts;
  }, [purchases]);

  const suppliers = useMemo(() => {
    const names = purchases.map((p) => p.supplier_name).filter(Boolean);
    return ["All", ...new Set(names)];
  }, [purchases]);

  const filteredPurchases = useMemo(() => {
    const query = search.trim().toLowerCase();

    let cutoff = null;
    if (filterDate !== "All") {
      cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - parseInt(filterDate, 10));
    }

    return purchases.filter((item) => {
      if (query) {
        const invoice = String(item.invoice_no || "").toLowerCase();
        const supplier = String(item.supplier_name || "").toLowerCase();
        if (!invoice.includes(query) && !supplier.includes(query)) return false;
      }

      if (filterStatus !== "all" && getStatusKey(item) !== filterStatus) {
        return false;
      }

      if (filterSupplier !== "All" && item.supplier_name !== filterSupplier) {
        return false;
      }

      if (cutoff && new Date(item.created_at) < cutoff) return false;

      return true;
    });
  }, [purchases, search, filterStatus, filterSupplier, filterDate]);

  const filtersActive =
    search !== "" ||
    filterStatus !== "all" ||
    filterSupplier !== "All" ||
    filterDate !== "All";

  const clearFilters = () => {
    setSearch("");
    setFilterStatus("all");
    setFilterSupplier("All");
    setFilterDate("All");
  };

  const hasDue = summary.totalDue > 0;

  /* ---------- loading ---------- */

  if (loading) {
    return (
      <div className="pu-page">
        <div className="pu-center" role="status" aria-live="polite">
          <div className="pu-spinner" />
          <span>Loading purchases…</span>
        </div>
        <Styles />
      </div>
    );
  }

  /* ---------- main ---------- */

  return (
    <div className="pu-page">
      <main className="pu-shell">
        {/* HEADER */}
        <header className="pu-header">
          <div>
            <h1>Purchases</h1>
            <p>Track supplier bills and what you still need to pay.</p>
          </div>

          <div className="pu-header-actions">
            <button
              className="pu-btn pu-btn-ghost"
              onClick={() => loadPurchases(true)}
              disabled={refreshing}
              type="button"
            >
              <FiRefreshCw className={refreshing ? "pu-spin" : ""} />
              {refreshing ? "Updating…" : "Refresh"}
            </button>

            <Link to="/add-purchase" className="pu-btn pu-btn-primary">
              <FiPlus />
              New purchase
            </Link>
          </div>
        </header>

        {error && (
          <div className="pu-alert" role="alert">
            <span>
              <FiAlertCircle />
              {error}
            </span>
            <button type="button" onClick={() => loadPurchases()}>
              Try again
            </button>
          </div>
        )}

        {/* OVERVIEW */}
        <section className="pu-overview" aria-label="Purchase summary">
          <div className="pu-due">
            <div>
              <span className="pu-due-label">
                {hasDue ? "You need to pay" : "Supplier dues"}
              </span>
              <strong
                className={`pu-due-amount ${hasDue ? "" : "pu-due-clear"}`}
              >
                {hasDue ? formatMoney(summary.totalDue) : "All paid"}
              </strong>
            </div>

            <span className="pu-due-note">
              {hasDue
                ? `${summary.openBills} ${
                    summary.openBills === 1 ? "bill" : "bills"
                  } still open`
                : "No pending supplier bills"}
            </span>
          </div>

          <div className="pu-stats">
            <div className="pu-stat">
              <span className="pu-stat-label">Purchase bills</span>
              <strong>{summary.totalPurchases.toLocaleString("en-IN")}</strong>
              <span className="pu-stat-note">Recorded so far</span>
            </div>

            <div className="pu-stat">
              <span className="pu-stat-label">Total bought</span>
              <strong>{formatMoney(summary.totalBought)}</strong>
              <span className="pu-stat-note">Value of all bills</span>
            </div>

            <div className="pu-stat">
              <span className="pu-stat-label">Already paid</span>
              <strong>{formatMoney(summary.totalPaid)}</strong>
              <span className="pu-stat-note">Paid to suppliers</span>
            </div>

            <div className="pu-stat">
              <span className="pu-stat-label">Open bills</span>
              <strong>{summary.openBills.toLocaleString("en-IN")}</strong>
              <span className="pu-stat-note">Not fully paid</span>
            </div>
          </div>
        </section>

        {/* BILLS */}
        <section className="pu-card">
          <div className="pu-toolbar">
            <div className="pu-search">
              <FiSearch />
              <input
                type="search"
                placeholder="Search bill number or supplier"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search purchases"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <FiX />
                </button>
              )}
            </div>

            <label className="pu-select">
              <select
                value={filterSupplier}
                onChange={(e) => setFilterSupplier(e.target.value)}
                aria-label="Filter by supplier"
              >
                {suppliers.map((supplier) => (
                  <option key={supplier} value={supplier}>
                    {supplier === "All" ? "All suppliers" : supplier}
                  </option>
                ))}
              </select>
            </label>

            <label className="pu-select">
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                aria-label="Filter by date"
              >
                {DATE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="pu-tabs" role="group" aria-label="Filter by payment status">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={filterStatus === tab.key ? "pu-tab-active" : ""}
                onClick={() => setFilterStatus(tab.key)}
                aria-pressed={filterStatus === tab.key}
              >
                {tab.label}
                <span>{statusCounts[tab.key]}</span>
              </button>
            ))}

            {filtersActive && (
              <button type="button" className="pu-clear" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>

          {filteredPurchases.length === 0 ? (
            <div className="pu-empty">
              <div className="pu-empty-icon">
                <FiShoppingCart size={24} />
              </div>
              <h3>
                {purchases.length === 0
                  ? "No purchases yet"
                  : "No bills match your filters"}
              </h3>
              <p>
                {purchases.length === 0
                  ? "Add your first supplier bill to start tracking what you owe."
                  : "Try a different search or clear the filters."}
              </p>
              {purchases.length === 0 ? (
                <Link to="/add-purchase" className="pu-btn pu-btn-primary">
                  <FiPlus />
                  New purchase
                </Link>
              ) : (
                <button
                  className="pu-btn pu-btn-primary"
                  onClick={clearFilters}
                  type="button"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="pu-table-wrap">
              <table className="pu-table">
                <thead>
                  <tr>
                    <th>Bill</th>
                    <th>Supplier</th>
                    <th>Date</th>
                    <th className="pu-right">Total</th>
                    <th className="pu-right">Paid</th>
                    <th className="pu-right">To pay</th>
                    <th>Status</th>
                    <th className="pu-right">
                      <span className="pu-sr">Actions</span>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPurchases.map((purchase) => {
                    const statusKey = getStatusKey(purchase);
                    const due = getDue(purchase);

                    return (
                      <tr key={purchase.id}>
                        <td data-label="Bill">
                          <span className="pu-bill">
                            <span className="pu-bill-icon">
                              <FiShoppingCart size={15} />
                            </span>
                            {purchase.invoice_no || `#${purchase.id}`}
                          </span>
                        </td>

                        <td data-label="Supplier">
                          <span className="pu-supplier">
                            {purchase.supplier_name || "—"}
                          </span>
                        </td>

                        <td data-label="Date">
                          <span className="pu-date">
                            {formatDate(purchase.created_at)}
                          </span>
                        </td>

                        <td className="pu-right" data-label="Total">
                          {formatMoney(purchase.total_amount)}
                        </td>

                        <td className="pu-right" data-label="Paid">
                          {formatMoney(purchase.paid_amount)}
                        </td>

                        <td className="pu-right" data-label="To pay">
                          <strong
                            className={due > 0 ? "pu-owed" : "pu-settled"}
                          >
                            {formatMoney(due)}
                          </strong>
                        </td>

                        <td data-label="Status">
                          <span className={`pu-status pu-status-${statusKey}`}>
                            <span />
                            {STATUS_LABELS[statusKey]}
                          </span>
                        </td>

                        <td className="pu-right pu-action" data-label="">
                          <div className="pu-actions">
                            <Link
                              to={`/purchase/${purchase.id}`}
                              className="pu-view"
                              title="View purchase details"
                            >
                              <FiEye size={14} />
                              View
                            </Link>

                            {statusKey !== "paid" && (
                              <Link
                                to={`/purchase/${purchase.id}/pay`}
                                className="pu-pay"
                                title="Record a payment"
                              >
                                Pay now
                                <FiChevronRight size={13} />
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <footer className="pu-footer">
            <span>
              Showing <strong>{filteredPurchases.length}</strong> of{" "}
              <strong>{purchases.length}</strong> bills
            </span>

            {filteredPurchases.length > 0 && (
              <span>
                To pay on these bills:{" "}
                <strong>
                  {formatMoney(
                    filteredPurchases.reduce((sum, p) => sum + getDue(p), 0)
                  )}
                </strong>
              </span>
            )}
          </footer>
        </section>
      </main>

      <Styles />
    </div>
  );
}

/* ====================================================== */
/* Styles — scoped under .pu- so nothing leaks globally    */
/* ====================================================== */

function Styles() {
  return (
    <style>{`
      @import url("https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap");

      .pu-page {
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
        --gold: #f6c453;

        min-height: 100vh;
        background: var(--bg);
        color: var(--ink);
        font-family: Manrope, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-variant-numeric: tabular-nums;
        -webkit-font-smoothing: antialiased;
      }

      .pu-page *,
      .pu-page *::before,
      .pu-page *::after {
        box-sizing: border-box;
      }

      .pu-page h1,
      .pu-page h3,
      .pu-page p {
        margin: 0;
      }

      .pu-page :focus-visible {
        outline: 3px solid #93b4ff;
        outline-offset: 2px;
      }

      .pu-sr {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
        white-space: nowrap;
      }

      .pu-shell {
        width: min(1360px, calc(100% - 40px));
        margin: 0 auto;
        padding: 28px 0 64px;
      }

      /* ---------- header ---------- */

      .pu-header {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 20px;
      }

      .pu-header h1 {
        font-size: clamp(28px, 4vw, 36px);
        font-weight: 800;
        letter-spacing: -1px;
      }

      .pu-header p {
        margin-top: 6px;
        font-size: 14px;
        color: var(--muted);
      }

      .pu-header-actions {
        display: flex;
        gap: 10px;
      }

      .pu-btn {
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

      .pu-btn:disabled {
        opacity: 0.6;
        cursor: wait;
      }

      .pu-btn-primary {
        background: var(--ink);
        color: #fff;
      }

      .pu-btn-primary:hover {
        background: #0c1529;
      }

      .pu-btn-ghost {
        background: var(--surface);
        color: var(--ink-soft);
        border-color: var(--line);
      }

      .pu-btn-ghost:hover:not(:disabled) {
        border-color: #c5cddd;
        color: var(--ink);
      }

      .pu-spin {
        animation: pu-rotate 0.8s linear infinite;
      }

      .pu-alert {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 16px;
        padding: 12px 16px;
        border: 1px solid #f2c2be;
        border-radius: 12px;
        background: var(--red-soft);
        color: var(--red);
        font-size: 13px;
        font-weight: 700;
      }

      .pu-alert span {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }

      .pu-alert button {
        border: 0;
        background: none;
        color: inherit;
        font: 800 13px Manrope, inherit;
        text-decoration: underline;
        cursor: pointer;
      }

      /* ---------- overview ---------- */

      .pu-overview {
        margin-bottom: 20px;
        border: 1px solid var(--line);
        border-radius: 20px;
        overflow: hidden;
        background: var(--surface);
      }

      .pu-due {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 16px;
        padding: 24px 28px;
        background: var(--ink);
        color: #fff;
      }

      .pu-due-label {
        display: block;
        font-size: 13px;
        font-weight: 600;
        color: #b8c3dd;
      }

      .pu-due-amount {
        display: block;
        margin-top: 6px;
        font-size: clamp(28px, 4vw, 38px);
        font-weight: 800;
        letter-spacing: -1px;
        color: var(--gold);
      }

      .pu-due-clear {
        color: #8be0b0;
      }

      .pu-due-note {
        font-size: 13px;
        font-weight: 600;
        color: #b8c3dd;
      }

      .pu-stats {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
      }

      .pu-stat {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 20px 24px;
        border-right: 1px solid var(--line);
      }

      .pu-stat:last-child {
        border-right: 0;
      }

      .pu-stat-label {
        font-size: 13px;
        font-weight: 600;
        color: var(--muted);
      }

      .pu-stat strong {
        font-size: 24px;
        font-weight: 800;
        letter-spacing: -0.6px;
      }

      .pu-stat-note {
        font-size: 12px;
        color: var(--muted);
      }

      /* ---------- card / toolbar ---------- */

      .pu-card {
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: 20px;
        overflow: hidden;
      }

      .pu-toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        padding: 20px 24px 14px;
      }

      .pu-search {
        position: relative;
        display: flex;
        align-items: center;
        flex: 1 1 280px;
        max-width: 440px;
        height: 44px;
        border: 1px solid var(--line);
        border-radius: 11px;
        background: #f8f9fc;
        transition: background 0.15s, border-color 0.15s;
      }

      .pu-search:focus-within {
        background: #fff;
        border-color: #93b4ff;
      }

      .pu-search > svg {
        position: absolute;
        left: 14px;
        color: var(--muted);
        pointer-events: none;
      }

      .pu-search input {
        width: 100%;
        height: 100%;
        padding: 0 40px;
        border: 0;
        outline: 0;
        background: transparent;
        color: var(--ink);
        font: 600 13px Manrope, inherit;
      }

      .pu-search input::placeholder {
        color: #8c97b0;
        font-weight: 500;
      }

      .pu-search button {
        position: absolute;
        right: 8px;
        width: 26px;
        height: 26px;
        display: grid;
        place-items: center;
        border: 0;
        border-radius: 7px;
        background: #e6eaf3;
        color: var(--muted);
        cursor: pointer;
      }

      .pu-select select {
        height: 44px;
        min-width: 160px;
        padding: 0 14px;
        border: 1px solid var(--line);
        border-radius: 11px;
        background: #f8f9fc;
        color: var(--ink);
        font: 600 13px Manrope, inherit;
        cursor: pointer;
      }

      .pu-select select:focus {
        outline: none;
        background: #fff;
        border-color: #93b4ff;
      }

      .pu-tabs {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 6px;
        padding: 0 24px 14px;
        border-bottom: 1px solid var(--line);
      }

      .pu-tabs button {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        height: 36px;
        padding: 0 13px;
        border: 1px solid var(--line);
        border-radius: 10px;
        background: #fff;
        color: var(--ink-soft);
        font: 700 13px Manrope, inherit;
        cursor: pointer;
      }

      .pu-tabs button:hover {
        border-color: #c5cddd;
      }

      .pu-tabs button span {
        min-width: 22px;
        padding: 2px 6px;
        border-radius: 6px;
        background: rgba(20, 33, 61, 0.07);
        font-size: 11px;
        text-align: center;
      }

      .pu-tabs .pu-tab-active {
        background: var(--ink);
        border-color: var(--ink);
        color: #fff;
      }

      .pu-tabs .pu-tab-active span {
        background: rgba(255, 255, 255, 0.18);
      }

      .pu-tabs .pu-clear {
        margin-left: auto;
        border-color: transparent;
        background: none;
        color: var(--brand);
      }

      .pu-tabs .pu-clear:hover {
        text-decoration: underline;
        border-color: transparent;
      }

      /* ---------- table ---------- */

      .pu-table-wrap {
        overflow-x: auto;
      }

      .pu-table {
        width: 100%;
        min-width: 1000px;
        border-collapse: collapse;
      }

      .pu-table th {
        padding: 0 20px;
        height: 46px;
        text-align: left;
        background: #f8f9fc;
        border-bottom: 1px solid var(--line);
        color: var(--muted);
        font-size: 12px;
        font-weight: 700;
        white-space: nowrap;
      }

      .pu-table td {
        padding: 16px 20px;
        border-bottom: 1px solid #eef1f6;
        vertical-align: middle;
        font-size: 13px;
        color: var(--ink-soft);
      }

      .pu-table tbody tr:last-child td {
        border-bottom: 0;
      }

      .pu-table tbody tr:hover {
        background: #f8f9fc;
      }

      .pu-right {
        text-align: right !important;
      }

      .pu-bill {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
        font-weight: 800;
        color: var(--ink);
      }

      .pu-bill-icon {
        width: 34px;
        height: 34px;
        display: grid;
        place-items: center;
        border-radius: 10px;
        background: var(--brand-soft);
        color: var(--brand);
      }

      .pu-supplier {
        font-weight: 700;
        color: var(--ink);
      }

      .pu-date {
        white-space: nowrap;
      }

      .pu-table td.pu-right {
        white-space: nowrap;
      }

      .pu-owed {
        font-weight: 800;
        color: var(--red);
      }

      .pu-settled {
        font-weight: 800;
        color: var(--green);
      }

      .pu-status {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 5px 11px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
        white-space: nowrap;
      }

      .pu-status > span {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
      }

      .pu-status-paid { background: var(--green-soft); color: var(--green); }
      .pu-status-partial { background: var(--amber-soft); color: var(--amber); }
      .pu-status-unpaid { background: var(--red-soft); color: var(--red); }

      .pu-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }

      .pu-view,
      .pu-pay {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        height: 36px;
        padding: 0 13px;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 700;
        text-decoration: none;
        white-space: nowrap;
        transition: background 0.15s, color 0.15s, border-color 0.15s;
      }

      .pu-view {
        border: 1px solid var(--line);
        background: #fff;
        color: var(--ink-soft);
      }

      .pu-view:hover {
        background: var(--brand-soft);
        border-color: #c4d4f8;
        color: var(--brand);
      }

      .pu-pay {
        border: 1px solid var(--ink);
        background: var(--ink);
        color: #fff;
      }

      .pu-pay:hover {
        background: #0c1529;
      }

      /* ---------- footer / empty / loading ---------- */

      .pu-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 10px;
        padding: 14px 24px;
        border-top: 1px solid var(--line);
        background: #f8f9fc;
        font-size: 12px;
        color: var(--muted);
      }

      .pu-footer strong {
        color: var(--ink);
        font-weight: 800;
      }

      .pu-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 56px 24px;
        text-align: center;
      }

      .pu-empty-icon {
        width: 62px;
        height: 62px;
        display: grid;
        place-items: center;
        margin-bottom: 16px;
        border-radius: 20px;
        background: #e6eaf3;
        color: var(--muted);
      }

      .pu-empty h3 {
        font-size: 19px;
        font-weight: 800;
      }

      .pu-empty p {
        max-width: 380px;
        margin-top: 6px;
        font-size: 14px;
        line-height: 1.5;
        color: var(--muted);
      }

      .pu-empty .pu-btn {
        margin-top: 18px;
      }

      .pu-center {
        min-height: 70vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 14px;
        font-size: 14px;
        font-weight: 600;
        color: var(--muted);
      }

      .pu-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #dbe1ee;
        border-top-color: var(--brand);
        border-radius: 50%;
        animation: pu-rotate 0.8s linear infinite;
      }

      @keyframes pu-rotate {
        to { transform: rotate(360deg); }
      }

      @media (prefers-reduced-motion: reduce) {
        .pu-spinner,
        .pu-spin { animation-duration: 2s; }
        .pu-page * { transition: none !important; }
      }

      /* ---------- responsive ---------- */

      @media (max-width: 960px) {
        .pu-stats {
          grid-template-columns: repeat(2, 1fr);
        }

        .pu-stat:nth-child(2) {
          border-right: 0;
        }

        .pu-stat:nth-child(-n + 2) {
          border-bottom: 1px solid var(--line);
        }
      }

      /* Table turns into stacked bill cards on phones */
      @media (max-width: 720px) {
        .pu-shell {
          width: calc(100% - 24px);
          padding-top: 18px;
        }

        .pu-header {
          flex-direction: column;
          align-items: stretch;
        }

        .pu-header-actions > * {
          flex: 1;
        }

        .pu-due {
          padding: 20px;
        }

        .pu-toolbar {
          padding: 16px;
        }

        .pu-search {
          max-width: none;
          flex-basis: 100%;
        }

        .pu-select {
          flex: 1;
        }

        .pu-select select {
          width: 100%;
          min-width: 0;
        }

        .pu-tabs {
          padding: 0 16px 12px;
          flex-wrap: nowrap;
          overflow-x: auto;
        }

        .pu-tabs button {
          flex: none;
        }

        .pu-tabs .pu-clear {
          margin-left: 0;
        }

        .pu-table {
          min-width: 0;
        }

        .pu-table thead {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
        }

        .pu-table,
        .pu-table tbody,
        .pu-table tr,
        .pu-table td {
          display: block;
          width: 100%;
        }

        .pu-table tbody tr {
          padding: 14px 16px;
          border-bottom: 1px solid var(--line);
        }

        .pu-table tbody tr:last-child {
          border-bottom: 0;
        }

        .pu-table td {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 7px 0;
          border: 0;
          text-align: right;
        }

        .pu-table td::before {
          content: attr(data-label);
          flex: none;
          font-size: 12px;
          font-weight: 700;
          color: var(--muted);
        }

        .pu-table td[data-label="Bill"] {
          padding-top: 0;
          padding-bottom: 10px;
        }

        .pu-table td[data-label=""]::before {
          content: none;
        }

        .pu-action {
          padding-bottom: 0 !important;
        }

        .pu-actions {
          width: 100%;
        }

        .pu-view,
        .pu-pay {
          flex: 1;
          justify-content: center;
        }

        .pu-footer {
          flex-direction: column;
          align-items: flex-start;
          padding: 14px 16px;
        }
      }

      @media (max-width: 480px) {
        .pu-stats {
          grid-template-columns: 1fr;
        }

        .pu-stat {
          padding: 16px 20px;
          border-right: 0;
          border-bottom: 1px solid var(--line);
        }

        .pu-stat:last-child {
          border-bottom: 0;
        }
      }
    `}</style>
  );
}