import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await API.get("/customers");
      setCustomers(res.data.data || []);
    } catch (err) {
      console.error("Failed to load customers:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter((customer) =>
      String(customer.customer_phone || "").toLowerCase().includes(query)
    );
  }, [customers, search]);

  const totalOrders = customers.reduce(
    (sum, customer) => sum + (Number(customer.total_orders) || 0),
    0
  );

  const totalRevenue = customers.reduce(
    (sum, customer) => sum + (Number(customer.total_spent) || 0),
    0
  );

  const activeCustomers = customers.filter(
    (customer) => customer.status === "active"
  ).length;

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

  if (loading) {
    return (
      <div className="customers-page">
        <div className="customers-loading">
          <div className="customers-spinner" />
          <p>Loading customer insights...</p>
        </div>
        <CustomersStyles />
      </div>
    );
  }

  return (
    <div className="customers-page">
      <main className="customers-shell">
        <header className="customers-header">
          <div className="customers-heading">
            <div className="customers-eyebrow">
              <span className="customers-live-dot" />
              CUSTOMER RELATIONSHIPS
            </div>
            <h1>Customers<span className="customers-title-dot">.</span></h1>
            <p>Understand your customers and keep track of their purchase activity.</p>
          </div>

          <div className="customers-header-actions">
            <button
              className="customers-refresh-button"
              onClick={() => loadCustomers(true)}
              disabled={refreshing}
              type="button"
            >
              <i className={`fas fa-rotate ${refreshing ? "customers-rotating" : ""}`} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
            <div className="customers-count-pill">
              <i className="fas fa-users" />
              <span>{customers.length} customers</span>
            </div>
          </div>
        </header>

        <section className="customers-stats-grid">
          <article className="customers-stat-card customers-stat-total">
            <div className="customers-stat-top">
              <div className="customers-stat-icon"><i className="fas fa-users" /></div>
              <span className="customers-stat-label">Customer base</span>
            </div>
            <div className="customers-stat-value">{customers.length.toLocaleString("en-IN")}</div>
            <div className="customers-stat-foot">Total registered customers</div>
          </article>

          <article className="customers-stat-card">
            <div className="customers-stat-top">
              <div className="customers-stat-icon customers-icon-green"><i className="fas fa-user-check" /></div>
              <span className="customers-stat-label">Active customers</span>
            </div>
            <div className="customers-stat-value">{activeCustomers.toLocaleString("en-IN")}</div>
            <div className="customers-stat-foot"><span className="customers-status-dot" /> Currently active</div>
          </article>

          <article className="customers-stat-card">
            <div className="customers-stat-top">
              <div className="customers-stat-icon customers-icon-blue"><i className="fas fa-bag-shopping" /></div>
              <span className="customers-stat-label">Total orders</span>
            </div>
            <div className="customers-stat-value">{totalOrders.toLocaleString("en-IN")}</div>
            <div className="customers-stat-foot">Across all customers</div>
          </article>

          <article className="customers-stat-card customers-stat-revenue">
            <div className="customers-stat-top">
              <div className="customers-stat-icon customers-icon-amber"><i className="fas fa-indian-rupee-sign" /></div>
              <span className="customers-stat-label">Customer revenue</span>
            </div>
            <div className="customers-stat-value customers-revenue-value">{formatCurrency(totalRevenue)}</div>
            <div className="customers-stat-foot">Total spending recorded</div>
          </article>
        </section>

        <section className="customers-workspace">
          <div className="customers-workspace-header">
            <div>
              <div className="customers-section-kicker">CUSTOMER DIRECTORY</div>
              <h2>Customer records</h2>
              <p>Search customer phone numbers and review their purchase history.</p>
            </div>
            <div className="customers-results-count">
              <strong>{filteredCustomers.length}</strong>
              <span>{filteredCustomers.length === 1 ? "result" : "results"}</span>
            </div>
          </div>

          <div className="customers-search-row">
            <div className="customers-search-box">
              <i className="fas fa-search" />
              <input
                type="search"
                placeholder="Search by phone number..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search customers by phone number"
              />
              {search && (
                <button
                  type="button"
                  className="customers-clear-search"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <i className="fas fa-times" />
                </button>
              )}
            </div>
            <div className="customers-search-hint">
              <i className="fas fa-shield-halved" />
              Phone numbers only
            </div>
          </div>

          <div className="customers-table-scroll">
            <table className="customers-table">
              <thead>
                <tr>
                  <th className="customers-th-number">#</th>
                  <th>Customer</th>
                  <th className="customers-center">Orders</th>
                  <th className="customers-right">Total spent</th>
                  <th>Last purchase</th>
                  <th>Status</th>
                  <th className="customers-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      <div className="customers-empty">
                        <div className="customers-empty-icon"><i className="fas fa-user-slash" /></div>
                        <h3>{search ? "No matching customers" : "No customers yet"}</h3>
                        <p>{search ? "Try a different phone number or clear your search." : "Customers will appear here after they make a purchase."}</p>
                        {search && (
                          <button className="customers-empty-button" onClick={() => setSearch("")} type="button">
                            Clear search
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer, index) => {
                    const phone = customer.customer_phone || "";
                    const status = customer.status || "inactive";
                    return (
                      <tr key={customer.id || index}>
                        <td className="customers-row-number">{index + 1}</td>
                        <td>
                          <div className="customers-person">
                            <div className="customers-avatar">
                              {phone ? phone.slice(-2) : <i className="fas fa-mobile-alt" />}
                            </div>
                            <div className="customers-person-details">
                              <strong>{phone || "Phone unavailable"}</strong>
                              <span>Customer #{customer.id || index + 1}</span>
                            </div>
                          </div>
                        </td>
                        <td className="customers-center">
                          <span className="customers-order-chip">{Number(customer.total_orders) || 0}</span>
                        </td>
                        <td className="customers-right">
                          <strong className="customers-amount">{formatCurrency(customer.total_spent)}</strong>
                        </td>
                        <td>
                          <span className="customers-date">{formatDate(customer.last_purchase)}</span>
                        </td>
                        <td>
                          <span className={`customers-status customers-status-${status.toLowerCase()}`}>
                            <span />
                            {status}
                          </span>
                        </td>
                        <td className="customers-center">
                          <Link className="customers-view-button" to={`/customers/${customer.id}`}>
                            <i className="fas fa-arrow-up-right-from-square" />
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="customers-table-footer">
            <span>Showing <strong>{filteredCustomers.length}</strong> of <strong>{customers.length}</strong> customers</span>
            <span className="customers-footer-note"><i className="fas fa-circle-check" /> Data synced with your business</span>
          </div>
        </section>
      </main>
      <CustomersStyles />
    </div>
  );
}

function CustomersStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

      .customers-page {
        min-height: 100vh;
        background:
          radial-gradient(circle at 92% 0%, rgba(15,139,131,.055), transparent 25%),
          #f6f8fc;
        color: #172033;
        font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .customers-shell {
        width: min(1460px, calc(100% - 40px));
        margin: 0 auto;
        padding: 30px 0 64px;
      }
      .customers-header {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 24px;
        margin-bottom: 28px;
      }
      .customers-eyebrow, .customers-section-kicker {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #64748b;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 1.5px;
      }
      .customers-live-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #0f8b83;
        box-shadow: 0 0 0 4px rgba(15,139,131,.10);
      }
      .customers-heading h1 {
        margin: 10px 0 8px;
        color: #101828;
        font-size: clamp(32px, 4vw, 46px);
        line-height: 1;
        letter-spacing: -1.8px;
        font-weight: 850;
      }
      .customers-title-dot { color: #0f8b83; }
      .customers-heading p {
        margin: 0;
        color: #718096;
        font-size: 14px;
      }
      .customers-header-actions {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .customers-refresh-button, .customers-count-pill {
        min-height: 42px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 9px;
        border-radius: 12px;
        padding: 0 15px;
        font-size: 13px;
        font-weight: 700;
      }
      .customers-refresh-button {
        color: #344054;
        background: white;
        border: 1px solid #e4eaf2;
        cursor: pointer;
        transition: .18s ease;
      }
      .customers-refresh-button:hover {
        border-color: #b9ddd8;
        background: #f0fdfa;
        color: #0f766e;
        transform: translateY(-1px);
      }
      .customers-refresh-button:disabled { opacity: .65; cursor: wait; }
      .customers-count-pill {
        background: #eaf8f6;
        color: #0f766e;
        border: 1px solid #ccece7;
      }
      .customers-stats-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 15px;
        margin-bottom: 22px;
      }
      .customers-stat-card {
        padding: 20px;
        min-height: 145px;
        background: #fff;
        border: 1px solid #e7edf5;
        border-radius: 19px;
        box-shadow: 0 7px 24px rgba(15,23,42,.035);
        transition: transform .18s ease, box-shadow .18s ease;
      }
      .customers-stat-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 14px 28px rgba(15,23,42,.065);
      }
      .customers-stat-top {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 16px;
      }
      .customers-stat-icon {
        width: 38px;
        height: 38px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        background: #e9f7f5;
        color: #0f8b83;
        font-size: 15px;
      }
      .customers-icon-green { background: #e9f9f0; color: #16a34a; }
      .customers-icon-blue { background: #edf4ff; color: #3978ff; }
      .customers-icon-amber { background: #fff6e5; color: #d99000; }
      .customers-stat-label { color: #64748b; font-size: 12px; font-weight: 650; }
      .customers-stat-value {
        color: #111827;
        font-size: 30px;
        font-weight: 850;
        line-height: 1;
        letter-spacing: -1px;
        font-variant-numeric: tabular-nums;
      }
      .customers-revenue-value { font-size: clamp(21px, 2vw, 28px); letter-spacing: -.8px; }
      .customers-stat-foot {
        display: flex;
        align-items: center;
        gap: 7px;
        color: #94a3b8;
        font-size: 11px;
        margin-top: 11px;
      }
      .customers-status-dot {
        width: 6px;
        height: 6px;
        background: #16a34a;
        border-radius: 50%;
      }
      .customers-workspace {
        overflow: hidden;
        background: #fff;
        border: 1px solid #e7edf5;
        border-radius: 22px;
        box-shadow: 0 10px 30px rgba(15,23,42,.045);
      }
      .customers-workspace-header {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 18px;
        padding: 24px 24px 20px;
        border-bottom: 1px solid #edf1f6;
      }
      .customers-section-kicker { color: #0f8b83; }
      .customers-workspace-header h2 {
        margin: 8px 0 6px;
        font-size: 22px;
        letter-spacing: -.6px;
        color: #172033;
      }
      .customers-workspace-header p {
        margin: 0;
        font-size: 13px;
        color: #718096;
      }
      .customers-results-count {
        display: flex;
        align-items: baseline;
        gap: 5px;
        padding: 8px 12px;
        background: #f0fdfa;
        border: 1px solid #d2efea;
        border-radius: 999px;
        color: #0f766e;
        font-size: 12px;
      }
      .customers-results-count strong { font-size: 14px; }
      .customers-search-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        padding: 18px 24px;
        background: #fbfcfe;
        border-bottom: 1px solid #edf1f6;
      }
      .customers-search-box {
        position: relative;
        display: flex;
        align-items: center;
        flex: 1;
        max-width: 520px;
        min-height: 48px;
        background: #fff;
        border: 1px solid #e3eaf2;
        border-radius: 13px;
        transition: .18s ease;
      }
      .customers-search-box:focus-within {
        border-color: #6bc4bb;
        box-shadow: 0 0 0 4px rgba(15,139,131,.09);
      }
      .customers-search-box > i {
        position: absolute;
        left: 15px;
        color: #94a3b8;
        font-size: 14px;
      }
      .customers-search-box input {
        width: 100%;
        border: 0;
        outline: 0;
        background: transparent;
        padding: 0 42px;
        color: #172033;
        font: inherit;
        font-size: 13px;
      }
      .customers-search-box input::placeholder { color: #9aa6b7; }
      .customers-clear-search {
        position: absolute;
        right: 9px;
        border: 0;
        background: #f1f5f9;
        color: #64748b;
        width: 27px;
        height: 27px;
        border-radius: 8px;
        cursor: pointer;
      }
      .customers-search-hint {
        display: flex;
        align-items: center;
        gap: 7px;
        color: #94a3b8;
        font-size: 11px;
        font-weight: 600;
        white-space: nowrap;
      }
      .customers-search-hint i { color: #0f8b83; }
      .customers-table-scroll { overflow-x: auto; }
      .customers-table {
        width: 100%;
        min-width: 850px;
        border-collapse: collapse;
        font-size: 13px;
      }
      .customers-table thead { background: #f8fafc; }
      .customers-table th {
        padding: 13px 20px;
        text-align: left;
        color: #64748b;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 1px;
        text-transform: uppercase;
        border-bottom: 1px solid #e8edf4;
        white-space: nowrap;
      }
      .customers-table td {
        padding: 17px 20px;
        border-bottom: 1px solid #edf1f6;
        vertical-align: middle;
      }
      .customers-table tbody tr { transition: background .15s ease; }
      .customers-table tbody tr:hover { background: #f9fcfc; }
      .customers-table tbody tr:last-child td { border-bottom: 0; }
      .customers-th-number, .customers-row-number { width: 55px; }
      .customers-row-number { color: #9aa6b7; font-size: 12px; font-weight: 600; }
      .customers-center { text-align: center !important; }
      .customers-right { text-align: right !important; }
      .customers-person { display: flex; align-items: center; gap: 12px; }
      .customers-avatar {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        flex-shrink: 0;
        border-radius: 12px;
        background: #e9f7f5;
        color: #0f766e;
        font-size: 12px;
        font-weight: 800;
      }
      .customers-person-details { display: flex; flex-direction: column; gap: 4px; }
      .customers-person-details strong { color: #172033; font-size: 13px; font-weight: 750; letter-spacing: .1px; }
      .customers-person-details span { color: #94a3b8; font-size: 10px; }
      .customers-order-chip {
        display: inline-flex;
        min-width: 32px;
        justify-content: center;
        padding: 5px 9px;
        border-radius: 8px;
        background: #f1f5f9;
        color: #475569;
        font-weight: 750;
        font-variant-numeric: tabular-nums;
      }
      .customers-amount { color: #172033; font-size: 13px; font-weight: 750; font-variant-numeric: tabular-nums; }
      .customers-date { color: #64748b; font-size: 12px; white-space: nowrap; }
      .customers-status {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 7px 10px;
        border-radius: 999px;
        font-size: 10px;
        font-weight: 750;
        text-transform: capitalize;
      }
      .customers-status > span { width: 6px; height: 6px; border-radius: 50%; }
      .customers-status-active { background: #e9f9f0; color: #087a55; }
      .customers-status-active > span { background: #16a34a; }
      .customers-status-inactive { background: #fff1f2; color: #be123c; }
      .customers-status-inactive > span { background: #e11d48; }
      .customers-view-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        min-height: 34px;
        padding: 0 12px;
        color: #0f766e;
        background: #f0fdfa;
        border: 1px solid #ccece7;
        border-radius: 9px;
        text-decoration: none;
        font-size: 11px;
        font-weight: 750;
        transition: .18s ease;
      }
      .customers-view-button:hover {
        background: #0f8b83;
        color: #fff;
        border-color: #0f8b83;
        transform: translateY(-1px);
      }
      .customers-empty { text-align: center; padding: 60px 20px; }
      .customers-empty-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 56px;
        height: 56px;
        margin: 0 auto 15px;
        border-radius: 17px;
        background: #f1f5f9;
        color: #94a3b8;
        font-size: 20px;
      }
      .customers-empty h3 { margin: 0 0 7px; color: #172033; font-size: 16px; }
      .customers-empty p { margin: 0; color: #94a3b8; font-size: 13px; }
      .customers-empty-button {
        margin-top: 15px;
        border: 0;
        border-radius: 9px;
        padding: 9px 14px;
        background: #0f8b83;
        color: white;
        font-weight: 700;
        cursor: pointer;
      }
      .customers-table-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 15px 24px;
        background: #fbfcfe;
        border-top: 1px solid #edf1f6;
        color: #94a3b8;
        font-size: 11px;
      }
      .customers-table-footer strong { color: #475569; }
      .customers-footer-note { display: flex; align-items: center; gap: 6px; }
      .customers-footer-note i { color: #16a34a; }
      .customers-loading {
        min-height: 65vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 14px;
        color: #64748b;
        font-size: 13px;
      }
      .customers-spinner {
        width: 38px;
        height: 38px;
        border: 3px solid #dce8e7;
        border-top-color: #0f8b83;
        border-radius: 50%;
        animation: customers-spin .8s linear infinite;
      }
      .customers-rotating { animation: customers-spin .8s linear infinite; }
      @keyframes customers-spin { to { transform: rotate(360deg); } }

      @media (max-width: 1050px) {
        .customers-stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .customers-header { align-items: flex-start; flex-direction: column; }
        .customers-header-actions { width: 100%; }
      }
      @media (max-width: 650px) {
        .customers-shell { width: calc(100% - 20px); padding: 20px 0 40px; }
        .customers-heading h1 { font-size: 34px; }
        .customers-heading p { max-width: 330px; line-height: 1.5; }
        .customers-header-actions { justify-content: space-between; }
        .customers-stats-grid { gap: 10px; }
        .customers-stat-card { min-height: 128px; padding: 15px; border-radius: 16px; }
        .customers-stat-top { gap: 8px; margin-bottom: 13px; }
        .customers-stat-icon { width: 33px; height: 33px; border-radius: 10px; }
        .customers-stat-label { font-size: 10px; }
        .customers-stat-value { font-size: 27px; }
        .customers-revenue-value { font-size: 21px; }
        .customers-workspace { border-radius: 17px; }
        .customers-workspace-header { padding: 18px; }
        .customers-workspace-header h2 { font-size: 19px; }
        .customers-workspace-header p { max-width: 270px; line-height: 1.5; }
        .customers-search-row { padding: 14px; flex-direction: column; align-items: stretch; }
        .customers-search-box { max-width: none; }
        .customers-search-hint { justify-content: flex-start; }
        .customers-table-footer { padding: 13px 16px; align-items: flex-start; flex-direction: column; }
      }
    `}</style>
  );
}
