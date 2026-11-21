import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

const SORT_OPTIONS = [
  { key: "recent", label: "Recent purchase" },
  { key: "spent", label: "Highest spending" },
  { key: "orders", label: "Most orders" },
];

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("recent");

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const res = await API.get("/customers");
      setCustomers(res.data.data || []);
    } catch (err) {
      console.error("Failed to load customers:", err);
      setError(
        err.response?.data?.message || "Unable to load customers right now."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* ---------- derived data ---------- */

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    const queryDigits = query.replace(/\D/g, "");

    let result = customers.filter((customer) => {
      if (!query) return true;

      const phone = String(customer.customer_phone || "").toLowerCase();
      const phoneDigits = phone.replace(/\D/g, "");

      return (
        phone.includes(query) ||
        (queryDigits !== "" && phoneDigits.includes(queryDigits))
      );
    });

    if (sortBy === "spent") {
      result = [...result].sort(
        (a, b) => (Number(b.total_spent) || 0) - (Number(a.total_spent) || 0)
      );
    } else if (sortBy === "orders") {
      result = [...result].sort(
        (a, b) => (Number(b.total_orders) || 0) - (Number(a.total_orders) || 0)
      );
    } else if (sortBy === "recent") {
      result = [...result].sort(
        (a, b) =>
          new Date(b.last_purchase || 0) - new Date(a.last_purchase || 0)
      );
    }

    return result;
  }, [customers, search, sortBy]);

  const stats = useMemo(() => {
    const totalOrders = customers.reduce(
      (sum, c) => sum + (Number(c.total_orders) || 0),
      0
    );
    const totalRevenue = customers.reduce(
      (sum, c) => sum + (Number(c.total_spent) || 0),
      0
    );
    const active = customers.filter((c) => c.status === "active").length;
    const average = customers.length ? totalRevenue / customers.length : 0;
    const top = [...customers].sort(
      (a, b) => (Number(b.total_spent) || 0) - (Number(a.total_spent) || 0)
    )[0];

    return { totalOrders, totalRevenue, active, average, top };
  }, [customers]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);

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

  /* ---------- loading ---------- */

  if (loading) {
    return (
      <div className="cu-page">
        <div className="cu-center" role="status" aria-live="polite">
          <div className="cu-spinner" />
          <span>Loading customers…</span>
        </div>
        <Styles />
      </div>
    );
  }

  /* ---------- main ---------- */

  return (
    <div className="cu-page">
      <main className="cu-shell">
        {/* HEADER */}
        <header className="cu-header">
          <div>
            <h1>Customers</h1>
            <p>See who buys from you, how often, and how much they spend.</p>
          </div>

          <button
            className="cu-btn cu-btn-ghost"
            onClick={() => loadCustomers(true)}
            disabled={refreshing}
            type="button"
          >
            <i className={`fas fa-sync-alt ${refreshing ? "cu-spin" : ""}`} />
            {refreshing ? "Updating…" : "Refresh"}
          </button>
        </header>

        {error && (
          <div className="cu-alert" role="alert">
            <span>
              <i className="fas fa-exclamation-circle" />
              {error}
            </span>
            <button type="button" onClick={() => loadCustomers()}>
              Try again
            </button>
          </div>
        )}

        {/* OVERVIEW */}
        <section className="cu-overview" aria-label="Customer summary">
          <div className="cu-revenue">
            <div>
              <span className="cu-revenue-label">Total customer revenue</span>
              <strong className="cu-revenue-amount">
                {formatCurrency(stats.totalRevenue)}
              </strong>
            </div>

            <div className="cu-top">
              <span className="cu-top-icon">
                <i className="fas fa-crown" />
              </span>
              <div>
                <span className="cu-top-label">Top customer</span>
                <strong>{stats.top?.customer_phone || "—"}</strong>
                <small>
                  {stats.top
                    ? `${formatCurrency(stats.top.total_spent)} spent`
                    : "No purchase data yet"}
                </small>
              </div>
            </div>
          </div>

          <div className="cu-stats">
            <div className="cu-stat">
              <span className="cu-stat-label">Customers</span>
              <strong>{customers.length.toLocaleString("en-IN")}</strong>
              <span className="cu-stat-note">Registered customers</span>
            </div>

            <div className="cu-stat">
              <span className="cu-stat-label">Active</span>
              <strong>{stats.active.toLocaleString("en-IN")}</strong>
              <span className="cu-stat-note">With active purchase records</span>
            </div>

            <div className="cu-stat">
              <span className="cu-stat-label">Total orders</span>
              <strong>{stats.totalOrders.toLocaleString("en-IN")}</strong>
              <span className="cu-stat-note">From all customers</span>
            </div>

            <div className="cu-stat">
              <span className="cu-stat-label">Average spend</span>
              <strong>{formatCurrency(stats.average)}</strong>
              <span className="cu-stat-note">Per customer</span>
            </div>
          </div>
        </section>

        {/* DIRECTORY */}
        <section className="cu-card">
          <div className="cu-toolbar">
            <div className="cu-search">
              <i className="fas fa-search" />
              <input
                type="search"
                placeholder="Search by phone number"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search customers by phone number"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <i className="fas fa-times" />
                </button>
              )}
            </div>

            <div className="cu-segment" role="group" aria-label="Sort customers">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={sortBy === option.key ? "cu-segment-active" : ""}
                  onClick={() => setSortBy(option.key)}
                  aria-pressed={sortBy === option.key}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="cu-subbar">
            <span>
              {search
                ? `${filteredCustomers.length} of ${customers.length} customers`
                : `${customers.length} ${
                    customers.length === 1 ? "customer" : "customers"
                  }`}
            </span>

            {search && (
              <button
                type="button"
                className="cu-link"
                onClick={() => setSearch("")}
              >
                Clear search
              </button>
            )}
          </div>

          {filteredCustomers.length === 0 ? (
            <div className="cu-empty">
              <div className="cu-empty-icon">
                <i className="fas fa-user-slash" />
              </div>
              <h3>{search ? "No customers found" : "No customers yet"}</h3>
              <p>
                {search
                  ? "Try another phone number or clear the search."
                  : "Customers appear here after you record a sale."}
              </p>
              {search && (
                <button
                  className="cu-btn cu-btn-primary"
                  onClick={() => setSearch("")}
                  type="button"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="cu-table-wrap">
              <table className="cu-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th className="cu-center-text">Orders</th>
                    <th className="cu-right">Total spent</th>
                    <th>Last purchase</th>
                    <th>Status</th>
                    <th className="cu-right">
                      <span className="cu-sr">Action</span>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCustomers.map((customer, index) => {
                    const phone = customer.customer_phone || "";
                    const status = String(
                      customer.status || "inactive"
                    ).toLowerCase();

                    return (
                      <tr key={customer.id || index}>
                        <td data-label="Customer">
                          <div className="cu-person">
                            <div className="cu-avatar" aria-hidden="true">
                              {phone ? (
                                phone.slice(-2)
                              ) : (
                                <i className="fas fa-mobile-alt" />
                              )}
                            </div>

                            <div className="cu-person-text">
                              <strong>{phone || "Phone unavailable"}</strong>
                              <small>Customer #{customer.id || index + 1}</small>
                            </div>
                          </div>
                        </td>

                        <td className="cu-center-text" data-label="Orders">
                          <span className="cu-orders">
                            {Number(customer.total_orders) || 0}
                          </span>
                        </td>

                        <td className="cu-right" data-label="Total spent">
                          <strong className="cu-spent">
                            {formatCurrency(customer.total_spent)}
                          </strong>
                        </td>

                        <td data-label="Last purchase">
                          <span className="cu-date">
                            {formatDate(customer.last_purchase)}
                          </span>
                        </td>

                        <td data-label="Status">
                          <span className={`cu-status cu-status-${status}`}>
                            <span />
                            {status}
                          </span>
                        </td>

                        <td className="cu-right cu-action" data-label="">
                          <Link
                            className="cu-view"
                            to={`/customers/${customer.id}`}
                            aria-label={`View purchase history for ${
                              phone || `customer ${customer.id}`
                            }`}
                          >
                            View history
                            <i className="fas fa-chevron-right" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <footer className="cu-footer">
            <span>
              Showing <strong>{filteredCustomers.length}</strong> of{" "}
              <strong>{customers.length}</strong> customers
            </span>
            <span>
              <i className="fas fa-check-circle" />
              Customer data is up to date
            </span>
          </footer>
        </section>
      </main>

      <Styles />
    </div>
  );
}

/* ====================================================== */
/* Styles — scoped under .cu- so nothing leaks globally    */
/* ====================================================== */

function Styles() {
  return (
    <style>{`
      @import url("https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap");

      .cu-page {
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

      .cu-page *,
      .cu-page *::before,
      .cu-page *::after {
        box-sizing: border-box;
      }

      .cu-page h1,
      .cu-page h3,
      .cu-page p {
        margin: 0;
      }

      .cu-page :focus-visible {
        outline: 3px solid #93b4ff;
        outline-offset: 2px;
      }

      .cu-sr {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
        white-space: nowrap;
      }

      .cu-shell {
        width: min(1360px, calc(100% - 40px));
        margin: 0 auto;
        padding: 28px 0 64px;
      }

      /* ---------- header ---------- */

      .cu-header {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 20px;
      }

      .cu-header h1 {
        font-size: clamp(28px, 4vw, 36px);
        font-weight: 800;
        letter-spacing: -1px;
      }

      .cu-header p {
        margin-top: 6px;
        font-size: 14px;
        color: var(--muted);
      }

      .cu-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: 42px;
        padding: 0 16px;
        border-radius: 11px;
        border: 1px solid transparent;
        font: 700 13px/1 Manrope, inherit;
        cursor: pointer;
        white-space: nowrap;
        transition: background 0.15s, border-color 0.15s, color 0.15s;
      }

      .cu-btn:disabled {
        opacity: 0.6;
        cursor: wait;
      }

      .cu-btn-ghost {
        background: var(--surface);
        color: var(--ink-soft);
        border-color: var(--line);
      }

      .cu-btn-ghost:hover:not(:disabled) {
        border-color: #c5cddd;
        color: var(--ink);
      }

      .cu-btn-primary {
        background: var(--ink);
        color: #fff;
      }

      .cu-btn-primary:hover {
        background: #0c1529;
      }

      .cu-spin {
        animation: cu-rotate 0.8s linear infinite;
      }

      .cu-alert {
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

      .cu-alert i {
        margin-right: 8px;
      }

      .cu-alert button {
        border: 0;
        background: none;
        color: inherit;
        font: 800 13px Manrope, inherit;
        text-decoration: underline;
        cursor: pointer;
      }

      /* ---------- overview ---------- */

      .cu-overview {
        margin-bottom: 20px;
        border: 1px solid var(--line);
        border-radius: 20px;
        overflow: hidden;
        background: var(--surface);
      }

      .cu-revenue {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 20px;
        padding: 24px 28px;
        background: var(--ink);
        color: #fff;
      }

      .cu-revenue-label {
        display: block;
        font-size: 13px;
        font-weight: 600;
        color: #b8c3dd;
      }

      .cu-revenue-amount {
        display: block;
        margin-top: 6px;
        font-size: clamp(28px, 4vw, 38px);
        font-weight: 800;
        letter-spacing: -1px;
        color: var(--gold);
      }

      .cu-top {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 12px 18px 12px 12px;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.06);
      }

      .cu-top-icon {
        width: 42px;
        height: 42px;
        display: grid;
        place-items: center;
        border-radius: 13px;
        background: var(--gold);
        color: var(--ink);
        font-size: 16px;
      }

      .cu-top > div {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .cu-top-label {
        font-size: 12px;
        font-weight: 600;
        color: #b8c3dd;
      }

      .cu-top strong {
        font-size: 16px;
        font-weight: 800;
      }

      .cu-top small {
        font-size: 12px;
        color: #b8c3dd;
      }

      .cu-stats {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
      }

      .cu-stat {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 20px 24px;
        border-right: 1px solid var(--line);
      }

      .cu-stat:last-child {
        border-right: 0;
      }

      .cu-stat-label {
        font-size: 13px;
        font-weight: 600;
        color: var(--muted);
      }

      .cu-stat strong {
        font-size: 24px;
        font-weight: 800;
        letter-spacing: -0.6px;
      }

      .cu-stat-note {
        font-size: 12px;
        color: var(--muted);
      }

      /* ---------- card / toolbar ---------- */

      .cu-card {
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: 20px;
        overflow: hidden;
      }

      .cu-toolbar {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
        padding: 20px 24px 14px;
      }

      .cu-search {
        position: relative;
        display: flex;
        align-items: center;
        flex: 1 1 280px;
        max-width: 420px;
        height: 44px;
        border: 1px solid var(--line);
        border-radius: 11px;
        background: #f8f9fc;
        transition: background 0.15s, border-color 0.15s;
      }

      .cu-search:focus-within {
        background: #fff;
        border-color: #93b4ff;
      }

      .cu-search > i {
        position: absolute;
        left: 14px;
        font-size: 13px;
        color: var(--muted);
        pointer-events: none;
      }

      .cu-search input {
        width: 100%;
        height: 100%;
        padding: 0 40px;
        border: 0;
        outline: 0;
        background: transparent;
        color: var(--ink);
        font: 600 13px Manrope, inherit;
      }

      .cu-search input::placeholder {
        color: #8c97b0;
        font-weight: 500;
      }

      .cu-search button {
        position: absolute;
        right: 8px;
        width: 26px;
        height: 26px;
        border: 0;
        border-radius: 7px;
        background: #e6eaf3;
        color: var(--muted);
        cursor: pointer;
      }

      .cu-segment {
        display: inline-flex;
        gap: 4px;
        margin-left: auto;
        padding: 4px;
        border: 1px solid var(--line);
        border-radius: 12px;
        background: #f8f9fc;
      }

      .cu-segment button {
        height: 34px;
        padding: 0 14px;
        border: 0;
        border-radius: 9px;
        background: transparent;
        color: var(--ink-soft);
        font: 700 13px Manrope, inherit;
        cursor: pointer;
        white-space: nowrap;
      }

      .cu-segment button:hover {
        color: var(--ink);
      }

      .cu-segment .cu-segment-active {
        background: var(--ink);
        color: #fff;
      }

      .cu-subbar {
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

      .cu-link {
        border: 0;
        background: none;
        color: var(--brand);
        font: 700 13px Manrope, inherit;
        cursor: pointer;
      }

      .cu-link:hover {
        text-decoration: underline;
      }

      /* ---------- table ---------- */

      .cu-table-wrap {
        overflow-x: auto;
      }

      .cu-table {
        width: 100%;
        min-width: 820px;
        border-collapse: collapse;
      }

      .cu-table th {
        padding: 0 24px;
        height: 46px;
        text-align: left;
        background: #f8f9fc;
        border-bottom: 1px solid var(--line);
        color: var(--muted);
        font-size: 12px;
        font-weight: 700;
        white-space: nowrap;
      }

      .cu-table td {
        padding: 16px 24px;
        border-bottom: 1px solid #eef1f6;
        vertical-align: middle;
        font-size: 13px;
        color: var(--ink-soft);
      }

      .cu-table tbody tr:last-child td {
        border-bottom: 0;
      }

      .cu-table tbody tr:hover {
        background: #f8f9fc;
      }

      .cu-right {
        text-align: right !important;
      }

      .cu-center-text {
        text-align: center !important;
      }

      .cu-person {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .cu-avatar {
        flex: none;
        width: 42px;
        height: 42px;
        display: grid;
        place-items: center;
        border-radius: 13px;
        background: var(--gold);
        color: var(--ink);
        font-size: 14px;
        font-weight: 800;
      }

      .cu-person-text {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }

      .cu-person-text strong {
        font-size: 14px;
        font-weight: 800;
        color: var(--ink);
      }

      .cu-person-text small {
        font-size: 12px;
        color: var(--muted);
      }

      .cu-orders {
        display: inline-flex;
        justify-content: center;
        min-width: 34px;
        padding: 5px 10px;
        border-radius: 8px;
        background: #eef1f6;
        color: var(--ink);
        font-weight: 800;
      }

      .cu-spent {
        font-size: 15px;
        font-weight: 800;
        color: var(--ink);
        white-space: nowrap;
      }

      .cu-date {
        white-space: nowrap;
      }

      .cu-status {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 5px 11px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
        text-transform: capitalize;
      }

      .cu-status > span {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
      }

      .cu-status-active {
        background: var(--green-soft);
        color: var(--green);
      }

      .cu-status-inactive {
        background: var(--red-soft);
        color: var(--red);
      }

      .cu-view {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 9px;
        color: var(--brand);
        font-size: 13px;
        font-weight: 700;
        text-decoration: none;
        white-space: nowrap;
        transition: background 0.15s;
      }

      .cu-view i {
        font-size: 10px;
      }

      .cu-view:hover {
        background: var(--brand-soft);
      }

      /* ---------- footer / empty / loading ---------- */

      .cu-footer {
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

      .cu-footer strong {
        color: var(--ink);
        font-weight: 800;
      }

      .cu-footer i {
        margin-right: 7px;
        color: #2f9e6b;
      }

      .cu-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 56px 24px;
        text-align: center;
      }

      .cu-empty-icon {
        width: 62px;
        height: 62px;
        display: grid;
        place-items: center;
        margin-bottom: 16px;
        border-radius: 20px;
        background: #e6eaf3;
        color: var(--muted);
        font-size: 22px;
      }

      .cu-empty h3 {
        font-size: 19px;
        font-weight: 800;
      }

      .cu-empty p {
        max-width: 360px;
        margin-top: 6px;
        font-size: 14px;
        line-height: 1.5;
        color: var(--muted);
      }

      .cu-empty .cu-btn {
        margin-top: 18px;
      }

      .cu-center {
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

      .cu-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #dbe1ee;
        border-top-color: var(--brand);
        border-radius: 50%;
        animation: cu-rotate 0.8s linear infinite;
      }

      @keyframes cu-rotate {
        to { transform: rotate(360deg); }
      }

      @media (prefers-reduced-motion: reduce) {
        .cu-spinner,
        .cu-spin { animation-duration: 2s; }
        .cu-page * { transition: none !important; }
      }

      /* ---------- responsive ---------- */

      @media (max-width: 960px) {
        .cu-stats {
          grid-template-columns: repeat(2, 1fr);
        }

        .cu-stat:nth-child(2) {
          border-right: 0;
        }

        .cu-stat:nth-child(-n + 2) {
          border-bottom: 1px solid var(--line);
        }

        .cu-segment {
          margin-left: 0;
        }
      }

      /* Table turns into stacked customer cards on phones */
      @media (max-width: 720px) {
        .cu-shell {
          width: calc(100% - 24px);
          padding-top: 18px;
        }

        .cu-header {
          align-items: stretch;
          flex-direction: column;
        }

        .cu-revenue {
          padding: 20px;
        }

        .cu-top {
          width: 100%;
        }

        .cu-toolbar {
          padding: 16px;
        }

        .cu-search {
          max-width: none;
          flex-basis: 100%;
        }

        .cu-segment {
          width: 100%;
          overflow-x: auto;
        }

        .cu-segment button {
          flex: 1;
        }

        .cu-subbar {
          padding: 0 16px 12px;
        }

        .cu-table {
          min-width: 0;
        }

        .cu-table thead {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
        }

        .cu-table,
        .cu-table tbody,
        .cu-table tr,
        .cu-table td {
          display: block;
          width: 100%;
        }

        .cu-table tbody tr {
          padding: 14px 16px;
          border-bottom: 1px solid var(--line);
        }

        .cu-table tbody tr:last-child {
          border-bottom: 0;
        }

        .cu-table td {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 7px 0;
          border: 0;
          text-align: right;
        }

        .cu-table td::before {
          content: attr(data-label);
          flex: none;
          font-size: 12px;
          font-weight: 700;
          color: var(--muted);
        }

        .cu-table td[data-label="Customer"] {
          display: block;
          padding-top: 0;
          padding-bottom: 10px;
          text-align: left;
        }

        .cu-table td[data-label="Customer"]::before,
        .cu-table td[data-label=""]::before {
          content: none;
        }

        .cu-action {
          justify-content: flex-end;
          padding-bottom: 0;
        }

        .cu-view {
          background: var(--brand-soft);
        }

        .cu-footer {
          flex-direction: column;
          align-items: flex-start;
          padding: 14px 16px;
        }
      }

      @media (max-width: 480px) {
        .cu-stats {
          grid-template-columns: 1fr;
        }

        .cu-stat {
          padding: 16px 20px;
          border-right: 0;
          border-bottom: 1px solid var(--line);
        }

        .cu-stat:last-child {
          border-bottom: 0;
        }
      }
    `}</style>
  );
}