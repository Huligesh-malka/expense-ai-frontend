import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState("recent");

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
    let result = customers.filter((customer) =>
      String(customer.customer_phone || "").toLowerCase().includes(query)
    );

    if (sortBy === "spent") {
      result = [...result].sort((a, b) => (Number(b.total_spent) || 0) - (Number(a.total_spent) || 0));
    } else if (sortBy === "orders") {
      result = [...result].sort((a, b) => (Number(b.total_orders) || 0) - (Number(a.total_orders) || 0));
    } else if (sortBy === "recent") {
      result = [...result].sort((a, b) => new Date(b.last_purchase || 0) - new Date(a.last_purchase || 0));
    }
    return result;
  }, [customers, search, sortBy]);

  const totalOrders = customers.reduce((sum, customer) => sum + (Number(customer.total_orders) || 0), 0);
  const totalRevenue = customers.reduce((sum, customer) => sum + (Number(customer.total_spent) || 0), 0);
  const activeCustomers = customers.filter((customer) => customer.status === "active").length;
  const averageSpend = customers.length ? totalRevenue / customers.length : 0;
  const topCustomer = [...customers].sort((a, b) => (Number(b.total_spent) || 0) - (Number(a.total_spent) || 0))[0];

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value) || 0);

  const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="customer-v2-page">
        <div className="customer-v2-loading"><div className="customer-v2-spinner" /><span>Loading customer workspace...</span></div>
        <CustomerV2Styles />
      </div>
    );
  }

  return (
    <div className="customer-v2-page">
      <main className="customer-v2-shell">
        <header className="customer-v2-header">
          <div>
            <div className="customer-v2-eyebrow"><span className="customer-v2-dot" /> CUSTOMER MANAGEMENT</div>
            <h1>Customers <span>.</span></h1>
            <p>Know your customers, track loyalty, and understand their spending.</p>
          </div>
          <div className="customer-v2-header-actions">
            <button className="customer-v2-refresh" onClick={() => loadCustomers(true)} disabled={refreshing} type="button">
              <i className={`fas fa-rotate ${refreshing ? "customer-v2-spin" : ""}`} />
              {refreshing ? "Updating" : "Refresh"}
            </button>
            <div className="customer-v2-total-pill"><i className="fas fa-users" /> {customers.length} customers</div>
          </div>
        </header>

        <section className="customer-v2-stats">
          <article className="customer-v2-stat customer-v2-stat-primary">
            <div className="customer-v2-stat-head"><span className="customer-v2-stat-icon"><i className="fas fa-users" /></span><span>Customer base</span></div>
            <div className="customer-v2-stat-number">{customers.length.toLocaleString("en-IN")}</div>
            <div className="customer-v2-stat-note">Registered customers</div>
          </article>
          <article className="customer-v2-stat">
            <div className="customer-v2-stat-head"><span className="customer-v2-stat-icon green"><i className="fas fa-user-check" /></span><span>Active customers</span></div>
            <div className="customer-v2-stat-number">{activeCustomers.toLocaleString("en-IN")}</div>
            <div className="customer-v2-stat-note"><span className="customer-v2-green-dot" /> Active purchase records</div>
          </article>
          <article className="customer-v2-stat">
            <div className="customer-v2-stat-head"><span className="customer-v2-stat-icon blue"><i className="fas fa-bag-shopping" /></span><span>Total orders</span></div>
            <div className="customer-v2-stat-number">{totalOrders.toLocaleString("en-IN")}</div>
            <div className="customer-v2-stat-note">Orders from all customers</div>
          </article>
          <article className="customer-v2-stat">
            <div className="customer-v2-stat-head"><span className="customer-v2-stat-icon amber"><i className="fas fa-indian-rupee-sign" /></span><span>Customer revenue</span></div>
            <div className="customer-v2-stat-number revenue">{formatCurrency(totalRevenue)}</div>
            <div className="customer-v2-stat-note">Lifetime spending recorded</div>
          </article>
        </section>

        <section className="customer-v2-insight-strip">
          <div className="customer-v2-insight">
            <div className="customer-v2-insight-icon"><i className="fas fa-chart-line" /></div>
            <div><span>Average spend per customer</span><strong>{formatCurrency(averageSpend)}</strong></div>
          </div>
          <div className="customer-v2-insight-divider" />
          <div className="customer-v2-insight">
            <div className="customer-v2-insight-icon gold"><i className="fas fa-crown" /></div>
            <div><span>Top customer</span><strong>{topCustomer?.customer_phone || "—"}</strong><small>{topCustomer ? formatCurrency(topCustomer.total_spent) : "No purchase data"}</small></div>
          </div>
          <div className="customer-v2-insight-tip"><i className="fas fa-lightbulb" /><span>Customer purchase data helps you identify loyal buyers and improve service.</span></div>
        </section>

        <section className="customer-v2-directory">
          <div className="customer-v2-directory-head">
            <div>
              <div className="customer-v2-kicker">DIRECTORY</div>
              <h2>Customer records</h2>
              <p>Search, sort, and open individual customer purchase history.</p>
            </div>
            <div className="customer-v2-result-pill"><strong>{filteredCustomers.length}</strong> results</div>
          </div>

          <div className="customer-v2-toolbar">
            <div className="customer-v2-search">
              <i className="fas fa-search" />
              <input type="search" placeholder="Search phone number..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search customers by phone number" />
              {search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search"><i className="fas fa-times" /></button>}
            </div>
            <label className="customer-v2-sort">
              <span>Sort by</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="recent">Recent purchase</option>
                <option value="spent">Highest spending</option>
                <option value="orders">Most orders</option>
              </select>
            </label>
            <div className="customer-v2-search-hint"><i className="fas fa-shield-halved" /> Phone number search</div>
          </div>

          <div className="customer-v2-table-wrap">
            <table className="customer-v2-table">
              <thead><tr><th>#</th><th>Customer</th><th className="center">Orders</th><th className="right">Total spent</th><th>Last purchase</th><th>Status</th><th className="center">Action</th></tr></thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr><td colSpan="7"><div className="customer-v2-empty"><div><i className="fas fa-user-slash" /></div><strong>{search ? "No customers found" : "No customer records yet"}</strong><p>{search ? "Try another phone number or clear the search." : "Customers will appear after a sale is recorded."}</p>{search && <button onClick={() => setSearch("")} type="button">Clear search</button>}</div></td></tr>
                ) : filteredCustomers.map((customer, index) => {
                  const phone = customer.customer_phone || "";
                  const status = String(customer.status || "inactive").toLowerCase();
                  return (
                    <tr key={customer.id || index}>
                      <td className="customer-v2-index">{index + 1}</td>
                      <td><div className="customer-v2-person"><div className="customer-v2-avatar">{phone ? phone.slice(-2) : <i className="fas fa-mobile-alt" />}</div><div><strong>{phone || "Phone unavailable"}</strong><small>Customer #{customer.id || index + 1}</small></div></div></td>
                      <td className="center"><span className="customer-v2-orders">{Number(customer.total_orders) || 0}</span></td>
                      <td className="right"><strong className="customer-v2-spent">{formatCurrency(customer.total_spent)}</strong></td>
                      <td><span className="customer-v2-date">{formatDate(customer.last_purchase)}</span></td>
                      <td><span className={`customer-v2-status ${status}`}><span />{status}</span></td>
                      <td className="center"><Link className="customer-v2-view" to={`/customers/${customer.id}`}><span>View</span><i className="fas fa-arrow-up-right-from-square" /></Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <footer className="customer-v2-footer"><span>Showing <strong>{filteredCustomers.length}</strong> of <strong>{customers.length}</strong> customers</span><span><i className="fas fa-circle-check" /> Customer data synced</span></footer>
        </section>
      </main>
      <CustomerV2Styles />
    </div>
  );
}

function CustomerV2Styles() {
  return <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    .customer-v2-page{min-height:100vh;background:radial-gradient(circle at 95% 0%,rgba(14,165,153,.07),transparent 27%),#f5f7fb;color:#172033;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    .customer-v2-shell{width:min(1420px,calc(100% - 36px));margin:auto;padding:26px 0 55px}
    .customer-v2-header{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:22px}
    .customer-v2-eyebrow,.customer-v2-kicker{display:flex;align-items:center;gap:8px;font-size:10px;font-weight:800;letter-spacing:1.45px;color:#718096}
    .customer-v2-dot{width:7px;height:7px;border-radius:50%;background:#0f8b83;box-shadow:0 0 0 4px rgba(15,139,131,.1)}
    .customer-v2-header h1{margin:8px 0 5px;font-size:clamp(31px,3.5vw,42px);font-weight:900;letter-spacing:-1.7px;line-height:1;color:#111827}
    .customer-v2-header h1 span{color:#0f8b83}
    .customer-v2-header p{margin:0;color:#7b8799;font-size:13px}
    .customer-v2-header-actions{display:flex;align-items:center;gap:9px}
    .customer-v2-refresh,.customer-v2-total-pill{height:40px;padding:0 14px;border-radius:11px;display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700}
    .customer-v2-refresh{background:#fff;border:1px solid #e2e8f0;color:#334155;cursor:pointer;transition:.18s}
    .customer-v2-refresh:hover{color:#0f766e;border-color:#b8e2dc;background:#f0fdfa}
    .customer-v2-refresh:disabled{opacity:.6}
    .customer-v2-total-pill{background:#e9f8f6;color:#0f766e;border:1px solid #d0eee9}
    .customer-v2-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:15px}
    .customer-v2-stat{background:#fff;border:1px solid #e6edf5;border-radius:17px;padding:17px 19px;min-height:125px;box-shadow:0 5px 20px rgba(15,23,42,.025);transition:.2s}
    .customer-v2-stat:hover{transform:translateY(-2px);box-shadow:0 12px 25px rgba(15,23,42,.06)}
    .customer-v2-stat-head{display:flex;align-items:center;gap:9px;color:#64748b;font-size:11px;font-weight:700}
    .customer-v2-stat-icon{width:34px;height:34px;border-radius:11px;background:#e9f7f5;color:#0f8b83;display:grid;place-items:center;font-size:13px}
    .customer-v2-stat-icon.green{background:#eaf9f0;color:#16a34a}.customer-v2-stat-icon.blue{background:#edf4ff;color:#4778df}.customer-v2-stat-icon.amber{background:#fff5e5;color:#d99000}
    .customer-v2-stat-number{margin-top:12px;color:#111827;font-size:29px;font-weight:850;letter-spacing:-1px;line-height:1}
    .customer-v2-stat-number.revenue{font-size:clamp(19px,1.7vw,26px);letter-spacing:-.8px}
    .customer-v2-stat-note{margin-top:9px;color:#94a3b8;font-size:10px;display:flex;align-items:center;gap:6px}
    .customer-v2-green-dot{width:6px;height:6px;background:#16a34a;border-radius:50%}
    .customer-v2-insight-strip{display:flex;align-items:center;gap:22px;padding:14px 18px;margin-bottom:18px;background:#fff;border:1px solid #e6edf5;border-radius:16px;box-shadow:0 4px 16px rgba(15,23,42,.025)}
    .customer-v2-insight{display:flex;align-items:center;gap:11px;min-width:185px}
    .customer-v2-insight-icon{width:34px;height:34px;border-radius:10px;background:#eaf8f6;color:#0f8b83;display:grid;place-items:center}
    .customer-v2-insight-icon.gold{background:#fff5e3;color:#c58a13}
    .customer-v2-insight div:last-child{display:flex;flex-direction:column;gap:3px}
    .customer-v2-insight span{font-size:10px;color:#94a3b8}
    .customer-v2-insight strong{font-size:13px;color:#172033;font-weight:800}
    .customer-v2-insight small{font-size:10px;color:#0f8b83}
    .customer-v2-insight-divider{height:35px;width:1px;background:#edf1f5}
    .customer-v2-insight-tip{margin-left:auto;display:flex;align-items:center;gap:8px;color:#8491a4;font-size:10px;max-width:310px;line-height:1.5}
    .customer-v2-insight-tip i{color:#d49a20;font-size:14px}
    .customer-v2-directory{overflow:hidden;background:#fff;border:1px solid #e5ecf4;border-radius:20px;box-shadow:0 8px 28px rgba(15,23,42,.035)}
    .customer-v2-directory-head{display:flex;align-items:flex-end;justify-content:space-between;padding:20px 22px 17px;border-bottom:1px solid #edf1f6}
    .customer-v2-kicker{color:#0f8b83}
    .customer-v2-directory-head h2{margin:7px 0 5px;font-size:21px;letter-spacing:-.55px;font-weight:800}
    .customer-v2-directory-head p{margin:0;color:#8491a4;font-size:12px}
    .customer-v2-result-pill{display:flex;gap:5px;align-items:center;padding:7px 11px;border-radius:999px;background:#f0fdfa;border:1px solid #d1eee9;color:#0f766e;font-size:11px}
    .customer-v2-result-pill strong{font-size:13px}
    .customer-v2-toolbar{display:flex;align-items:center;gap:12px;padding:13px 22px;background:#fbfcfe;border-bottom:1px solid #edf1f6}
    .customer-v2-search{position:relative;display:flex;align-items:center;flex:1;max-width:480px;height:43px;background:#fff;border:1px solid #e2eaf2;border-radius:11px;transition:.18s}
    .customer-v2-search:focus-within{border-color:#7bc9c1;box-shadow:0 0 0 3px rgba(15,139,131,.08)}
    .customer-v2-search>i{position:absolute;left:13px;color:#9aa7b7;font-size:12px}
    .customer-v2-search input{width:100%;height:100%;padding:0 40px;background:transparent;border:0;outline:0;font:inherit;font-size:12px;color:#172033}
    .customer-v2-search input::placeholder{color:#9aa7b7}
    .customer-v2-search button{position:absolute;right:8px;width:25px;height:25px;border:0;border-radius:7px;background:#f1f5f9;color:#64748b;cursor:pointer}
    .customer-v2-sort{display:flex;align-items:center;gap:8px;color:#94a3b8;font-size:10px;font-weight:700}
    .customer-v2-sort select{height:40px;padding:0 12px;border:1px solid #e2eaf2;border-radius:10px;background:#fff;color:#475569;font:inherit;font-size:11px;outline:0}
    .customer-v2-search-hint{margin-left:auto;display:flex;align-items:center;gap:6px;color:#94a3b8;font-size:10px;white-space:nowrap}
    .customer-v2-search-hint i{color:#0f8b83}
    .customer-v2-table-wrap{overflow-x:auto}
    .customer-v2-table{width:100%;min-width:850px;border-collapse:collapse;font-size:12px}
    .customer-v2-table thead{background:#f8fafc}
    .customer-v2-table th{padding:12px 18px;text-align:left;color:#738196;font-size:9px;font-weight:800;letter-spacing:1px;text-transform:uppercase;border-bottom:1px solid #e8edf4;white-space:nowrap}
    .customer-v2-table td{padding:13px 18px;border-bottom:1px solid #edf1f6;vertical-align:middle}
    .customer-v2-table tbody tr{transition:background .15s}
    .customer-v2-table tbody tr:hover{background:#f9fcfc}
    .customer-v2-table tbody tr:last-child td{border-bottom:0}
    .customer-v2-table .center{text-align:center!important}.customer-v2-table .right{text-align:right!important}
    .customer-v2-index{width:45px;color:#a0aabc;font-size:11px}
    .customer-v2-person{display:flex;align-items:center;gap:10px}
    .customer-v2-avatar{width:35px;height:35px;display:grid;place-items:center;flex-shrink:0;border-radius:10px;background:#eaf8f6;color:#0f766e;font-size:11px;font-weight:800}
    .customer-v2-person>div:last-child{display:flex;flex-direction:column;gap:3px}
    .customer-v2-person strong{color:#172033;font-size:12px;font-weight:750}
    .customer-v2-person small{color:#9aa7b7;font-size:9px}
    .customer-v2-orders{display:inline-flex;min-width:30px;justify-content:center;padding:5px 8px;border-radius:7px;background:#f1f5f9;color:#475569;font-weight:750}
    .customer-v2-spent{color:#172033;font-size:12px;font-weight:750;font-variant-numeric:tabular-nums}
    .customer-v2-date{color:#718096;font-size:11px;white-space:nowrap}
    .customer-v2-status{display:inline-flex;align-items:center;gap:6px;padding:6px 9px;border-radius:999px;font-size:9px;font-weight:750;text-transform:capitalize}
    .customer-v2-status>span{width:5px;height:5px;border-radius:50%}
    .customer-v2-status.active{background:#e9f9f0;color:#087a55}.customer-v2-status.active>span{background:#16a34a}
    .customer-v2-status.inactive{background:#fff1f2;color:#be123c}.customer-v2-status.inactive>span{background:#e11d48}
    .customer-v2-view{display:inline-flex;align-items:center;gap:6px;height:31px;padding:0 10px;border:1px solid #d2eee9;border-radius:8px;background:#f0fdfa;color:#0f766e;text-decoration:none;font-size:10px;font-weight:750;transition:.18s}
    .customer-v2-view:hover{background:#0f8b83;color:#fff;border-color:#0f8b83}
    .customer-v2-view i{font-size:9px}
    .customer-v2-empty{text-align:center;padding:52px 20px}
    .customer-v2-empty>div{width:48px;height:48px;margin:0 auto 12px;display:grid;place-items:center;border-radius:15px;background:#f1f5f9;color:#94a3b8;font-size:18px}
    .customer-v2-empty strong{display:block;color:#172033;font-size:14px}
    .customer-v2-empty p{color:#94a3b8;font-size:12px;margin:7px 0 0}
    .customer-v2-empty button{margin-top:12px;border:0;border-radius:8px;padding:8px 12px;background:#0f8b83;color:white;font-weight:700;cursor:pointer}
    .customer-v2-footer{display:flex;justify-content:space-between;gap:12px;padding:12px 18px;background:#fbfcfe;border-top:1px solid #edf1f6;color:#94a3b8;font-size:10px}
    .customer-v2-footer strong{color:#475569}
    .customer-v2-footer span:last-child{display:flex;align-items:center;gap:5px}.customer-v2-footer i{color:#16a34a}
    .customer-v2-loading{min-height:60vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:#64748b;font-size:12px}
    .customer-v2-spinner{width:34px;height:34px;border:3px solid #dce8e7;border-top-color:#0f8b83;border-radius:50%;animation:customer-v2-spin .8s linear infinite}
    .customer-v2-spin{animation:customer-v2-spin .8s linear infinite}@keyframes customer-v2-spin{to{transform:rotate(360deg)}}
    @media(max-width:1050px){.customer-v2-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.customer-v2-insight-tip{display:none}}
    @media(max-width:700px){.customer-v2-shell{width:calc(100% - 18px);padding:18px 0 35px}.customer-v2-header{align-items:flex-start;flex-direction:column}.customer-v2-header-actions{width:100%;justify-content:space-between}.customer-v2-header h1{font-size:34px}.customer-v2-header p{font-size:12px;line-height:1.5}.customer-v2-stats{gap:9px}.customer-v2-stat{padding:13px;min-height:112px;border-radius:14px}.customer-v2-stat-head{font-size:10px;gap:7px}.customer-v2-stat-icon{width:29px;height:29px;border-radius:9px;font-size:11px}.customer-v2-stat-number{font-size:25px;margin-top:10px}.customer-v2-stat-number.revenue{font-size:19px}.customer-v2-stat-note{font-size:9px}.customer-v2-insight-strip{gap:12px;padding:12px;border-radius:13px}.customer-v2-insight{min-width:0;flex:1;gap:8px}.customer-v2-insight-divider{display:none}.customer-v2-insight-icon{width:30px;height:30px}.customer-v2-insight span{font-size:9px}.customer-v2-insight strong{font-size:11px}.customer-v2-insight small{font-size:9px}.customer-v2-directory{border-radius:15px}.customer-v2-directory-head{padding:16px}.customer-v2-directory-head h2{font-size:18px}.customer-v2-directory-head p{font-size:11px;line-height:1.45;max-width:250px}.customer-v2-toolbar{padding:12px;flex-wrap:wrap}.customer-v2-search{max-width:none;flex-basis:100%}.customer-v2-sort{flex:1}.customer-v2-sort select{flex:1;min-width:0}.customer-v2-search-hint{display:none}.customer-v2-footer{padding:12px;flex-direction:column}.customer-v2-table th,.customer-v2-table td{padding:12px 13px}}
  `}</style>;
}
