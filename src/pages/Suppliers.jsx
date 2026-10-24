import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import {
  FiPlus, FiSearch, FiEdit2, FiEye, FiTruck, FiPhone, FiMail,
  FiCheckCircle, FiXCircle, FiRefreshCw, FiUsers, FiAlertCircle,
  FiArrowUpRight, FiX, FiSliders
} from "react-icons/fi";

const SUPPLIERS_STYLES = "/* Supplier directory \u2014 responsive procurement workspace */\n.suppliers-page {\n  --sp-ink: #172033;\n  --sp-muted: #7a8498;\n  --sp-line: #e7eaf1;\n  --sp-panel: #ffffff;\n  --sp-bg: #f5f7fb;\n  --sp-violet: #6c5ce7;\n  min-height: 100vh;\n  padding: clamp(18px, 3vw, 38px);\n  color: var(--sp-ink);\n  background: var(--sp-bg);\n  font-family: \"DM Sans\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif;\n}\n.suppliers-page * { box-sizing: border-box; }\n.suppliers-heading { display:flex; align-items:flex-end; justify-content:space-between; gap:24px; flex-wrap:wrap; margin:0 auto 28px; max-width:1500px; }\n.suppliers-heading-copy { max-width:720px; }\n.suppliers-eyebrow { display:flex; align-items:center; gap:9px; color:#7a6ee6; font-size:10px; font-weight:800; letter-spacing:.16em; margin-bottom:11px; }\n.suppliers-eyebrow-dot { width:7px; height:7px; background:#7a6ee6; border-radius:50%; box-shadow:0 0 0 4px #e9e6ff; }\n.suppliers-heading h1 { font-family:Manrope,\"DM Sans\",sans-serif; font-size:clamp(28px,3.1vw,40px); letter-spacing:-1.7px; line-height:1.12; margin:0; font-weight:800; }\n.suppliers-heading h1 span { color:#7565e8; }\n.suppliers-heading-copy p { color:var(--sp-muted); margin:11px 0 0; font-size:14px; line-height:1.6; }\n.suppliers-heading-actions { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }\n.suppliers-primary-btn,.suppliers-secondary-btn { display:inline-flex; justify-content:center; align-items:center; gap:9px; min-height:43px; padding:0 17px; border-radius:11px; font:700 13px \"DM Sans\",sans-serif; cursor:pointer; text-decoration:none; transition:transform .18s,box-shadow .18s,background .18s; }\n.suppliers-primary-btn { border:1px solid #6554df; color:#fff; background:#6c5ce7; box-shadow:0 7px 18px #6c5ce72e; }\n.suppliers-primary-btn:hover { background:#5d4dd5; transform:translateY(-1px); box-shadow:0 10px 22px #6c5ce73d; }\n.suppliers-secondary-btn { background:#fff; color:#46516a; border:1px solid var(--sp-line); }\n.suppliers-secondary-btn:hover { background:#f9faff; }\n.suppliers-secondary-btn:disabled { opacity:.65; cursor:wait; }\n.suppliers-primary-btn svg,.suppliers-secondary-btn svg { font-size:16px; }\n.suppliers-metrics { max-width:1500px; margin:0 auto 25px; display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:16px; }\n.suppliers-metric-card { position:relative; overflow:hidden; background:var(--sp-panel); border:1px solid var(--sp-line); border-radius:17px; padding:20px 22px; box-shadow:0 4px 15px #1d2a4d05; }\n.suppliers-metric-card::after { content:\"\"; position:absolute; width:100px; height:100px; right:-38px; bottom:-55px; border-radius:50%; background:#eeeaff; opacity:.65; pointer-events:none; }\n.suppliers-metric-card:nth-child(2)::after { background:#e2f8ec; }\n.suppliers-metric-card:nth-child(3)::after { background:#fff0d8; }\n.suppliers-metric-top { display:flex; align-items:center; justify-content:space-between; gap:12px; color:#7d879a; font-size:12px; font-weight:700; }\n.suppliers-metric-icon { width:34px; height:34px; border-radius:11px; display:grid; place-items:center; font-size:17px; }\n.suppliers-metric-icon.violet { background:#eeeaff; color:#6c5ce7; }\n.suppliers-metric-icon.green { background:#e3f8eb; color:#15945c; }\n.suppliers-metric-icon.amber { background:#fff0d8; color:#b77919; }\n.suppliers-metric-card > strong { display:block; margin-top:13px; font:800 clamp(24px,2.2vw,30px) Manrope,sans-serif; letter-spacing:-1px; }\n.suppliers-metric-card > small { display:block; margin-top:5px; color:#9aa3b3; font-size:11px; }\n.suppliers-directory { max-width:1500px; margin:0 auto; border:1px solid var(--sp-line); border-radius:18px; background:#fff; box-shadow:0 8px 28px #1d2a4d06; overflow:hidden; }\n.suppliers-directory-header { display:flex; justify-content:space-between; align-items:center; gap:16px; padding:23px 25px 18px; }\n.suppliers-directory-header h2 { margin:0; font:800 19px Manrope,sans-serif; letter-spacing:-.45px; }\n.suppliers-directory-header p { margin:5px 0 0; font-size:12px; color:var(--sp-muted); }\n.suppliers-count-pill { padding:7px 11px; border-radius:9px; background:#f0eeff; color:#6554d7; font-size:11px; font-weight:800; white-space:nowrap; }\n.suppliers-toolbar { display:flex; align-items:center; gap:11px; padding:0 25px 20px; }\n.suppliers-search,.suppliers-filter { height:44px; display:flex; align-items:center; gap:10px; border:1px solid #e7eaf1; background:#fafbfe; border-radius:11px; padding:0 13px; color:#8b94a7; }\n.suppliers-search { flex:1; min-width:160px; }\n.suppliers-search:focus-within,.suppliers-filter:focus-within { border-color:#b5adfa; box-shadow:0 0 0 3px #eeeaff; }\n.suppliers-search > svg,.suppliers-filter > svg { flex-shrink:0; font-size:16px; }\n.suppliers-search input { width:100%; min-width:0; border:0; outline:0; background:transparent; color:#263149; font:500 12px \"DM Sans\",sans-serif; }\n.suppliers-search input::placeholder { color:#a0a8b7; }\n.suppliers-clear-search { border:0; background:transparent; color:#8790a1; cursor:pointer; padding:4px; display:grid; place-items:center; }\n.suppliers-filter select { border:0; outline:0; background:transparent; color:#566078; font:700 12px \"DM Sans\",sans-serif; cursor:pointer; min-width:105px; }\n.suppliers-error { margin:0 25px 18px; padding:13px 15px; border-radius:10px; background:#fff1f0; border:1px solid #ffd7d3; color:#a93228; display:flex; align-items:center; gap:10px; font-size:12px; }\n.suppliers-error span { flex:1; }\n.suppliers-error button { border:0; background:#a93228; color:#fff; border-radius:7px; padding:7px 10px; font-weight:700; cursor:pointer; }\n.suppliers-table-wrap { overflow-x:auto; }\n.suppliers-table { width:100%; border-collapse:collapse; text-align:left; }\n.suppliers-table thead { background:#fafbfe; }\n.suppliers-table th { padding:13px 20px; color:#8b94a7; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:.1em; border-top:1px solid #f0f1f6; border-bottom:1px solid #edf0f5; white-space:nowrap; }\n.suppliers-table th:first-child,.suppliers-table td:first-child { padding-left:25px; }\n.suppliers-table th:last-child,.suppliers-table td:last-child { padding-right:25px; }\n.suppliers-table td { padding:17px 20px; border-bottom:1px solid #f0f2f7; vertical-align:middle; }\n.suppliers-table tbody tr { transition:background .15s; }\n.suppliers-table tbody tr:hover { background:#fbfbff; }\n.suppliers-table tbody tr:last-child td { border-bottom:0; }\n.suppliers-vendor { display:flex; align-items:center; gap:12px; min-width:190px; }\n.suppliers-avatar { flex-shrink:0; width:42px; height:42px; display:grid; place-items:center; border-radius:13px; background:linear-gradient(145deg,#eeeaff,#e4e0ff); color:#6554d7; font:800 16px Manrope,sans-serif; }\n.suppliers-vendor-copy { display:flex; flex-direction:column; gap:3px; min-width:0; }\n.suppliers-vendor-copy strong { color:#202a40; font-size:12px; font-weight:800; }\n.suppliers-vendor-copy span { color:#7e8799; font-size:11px; }\n.suppliers-vendor-copy small { color:#b0b6c3; font-size:10px; }\n.suppliers-contact { display:flex; flex-direction:column; gap:7px; min-width:170px; }\n.suppliers-contact span,.suppliers-mobile-contact span { display:flex; align-items:center; gap:7px; color:#59647b; font-size:11px; white-space:nowrap; }\n.suppliers-contact svg,.suppliers-mobile-contact svg { color:#9ba4b6; font-size:13px; flex-shrink:0; }\n.suppliers-balance { display:block; font:800 12px \"DM Sans\",sans-serif; white-space:nowrap; }\n.suppliers-balance.is-due { color:#d34b48; }\n.suppliers-balance.is-clear { color:#15945c; }\n.suppliers-balance-caption { display:block; margin-top:5px; font-size:10px; color:#a0a8b7; white-space:nowrap; }\n.suppliers-status { display:inline-flex; align-items:center; gap:6px; padding:6px 9px; border-radius:8px; font-size:10px; font-weight:800; white-space:nowrap; text-transform:capitalize; }\n.suppliers-status i { display:block; width:6px; height:6px; border-radius:50%; background:currentColor; }\n.suppliers-status.active { background:#e6f8ee; color:#168755; }\n.suppliers-status.inactive { background:#fff0ef; color:#c44540; }\n.suppliers-actions-head { text-align:right; }\n.suppliers-row-actions { display:flex; align-items:center; justify-content:flex-end; gap:6px; }\n.suppliers-icon-btn { width:32px; height:32px; display:inline-grid; place-items:center; border:1px solid transparent; border-radius:9px; text-decoration:none; cursor:pointer; transition:background .15s,border-color .15s,transform .15s; font-size:14px; }\n.suppliers-icon-btn:hover { transform:translateY(-1px); }\n.suppliers-icon-btn:disabled { opacity:.45; cursor:wait; }\n.suppliers-icon-btn.view { background:#eeeaff; color:#6554d7; border-color:#e5e0ff; }\n.suppliers-icon-btn.view:hover { background:#e2dcff; }\n.suppliers-icon-btn.edit { background:#fff4df; color:#b87916; border-color:#ffebc5; }\n.suppliers-icon-btn.edit:hover { background:#ffebc5; }\n.suppliers-icon-btn.deactivate { background:#fff0ef; color:#c44540; border-color:#ffe2df; }\n.suppliers-icon-btn.activate { background:#e6f8ee; color:#168755; border-color:#d6f2e1; }\n.suppliers-table-footer { display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; padding:14px 25px; background:#fcfcfe; border-top:1px solid #f0f1f6; color:#9aa2b1; font-size:10px; }\n.suppliers-table-footer strong { color:#667087; }\n.suppliers-table-footer span:last-child { display:flex; align-items:center; gap:6px; }\n.suppliers-table-footer svg { color:#9b91ed; }\n.suppliers-loading,.suppliers-empty { min-height:250px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; padding:30px; text-align:center; }\n.suppliers-loading strong,.suppliers-empty h3 { margin:0; color:#29344b; font:800 15px Manrope,sans-serif; }\n.suppliers-loading > span:last-child,.suppliers-empty p { margin:0; color:#8c96a8; font-size:12px; line-height:1.6; }\n.suppliers-loader { width:34px; height:34px; border:3px solid #ece9ff; border-top-color:#6c5ce7; border-radius:50%; animation:sp-spin .75s linear infinite; }\n.suppliers-empty-icon { width:56px; height:56px; display:grid; place-items:center; border-radius:17px; background:#f0eeff; color:#6c5ce7; font-size:25px; margin-bottom:5px; }\n.suppliers-empty .suppliers-primary-btn,.suppliers-empty .suppliers-secondary-btn { margin-top:7px; }\n.suppliers-mobile-list { display:none; }\n.suppliers-footnote { max-width:1500px; margin:16px auto 0; display:flex; align-items:center; gap:8px; color:#9aa2b1; font-size:11px; }\n.suppliers-footnote svg { color:#8b7fe9; }\n.suppliers-spinning { animation:sp-spin .8s linear infinite; }\n@keyframes sp-spin { to { transform:rotate(360deg); } }\n\n@media (max-width: 900px) {\n  .suppliers-page { padding:22px 16px; }\n  .suppliers-metrics { gap:11px; }\n  .suppliers-metric-card { padding:17px; }\n  .suppliers-table th,.suppliers-table td { padding-left:13px; padding-right:13px; }\n  .suppliers-table th:first-child,.suppliers-table td:first-child { padding-left:17px; }\n  .suppliers-table th:last-child,.suppliers-table td:last-child { padding-right:17px; }\n}\n@media (max-width: 680px) {\n  .suppliers-heading { align-items:flex-start; margin-bottom:20px; gap:17px; }\n  .suppliers-heading-actions { width:100%; }\n  .suppliers-heading-actions > * { flex:1; }\n  .suppliers-metrics { grid-template-columns:1fr 1fr; }\n  .suppliers-metric-card:last-child { grid-column:1 / -1; }\n  .suppliers-directory-header { padding:19px 16px 15px; }\n  .suppliers-toolbar { padding:0 16px 16px; flex-direction:column; align-items:stretch; }\n  .suppliers-search,.suppliers-filter { width:100%; }\n  .suppliers-filter select { flex:1; }\n  .suppliers-table-wrap,.suppliers-table-footer { display:none; }\n  .suppliers-mobile-list { display:grid; gap:11px; padding:0 12px 14px; }\n  .suppliers-mobile-card { border:1px solid #edf0f5; border-radius:14px; padding:15px; background:#fff; }\n  .suppliers-mobile-top { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; }\n  .suppliers-mobile-top .suppliers-vendor { min-width:0; }\n  .suppliers-mobile-contact { display:flex; flex-direction:column; gap:8px; padding:14px 0; margin-top:12px; border-top:1px solid #f0f1f6; }\n  .suppliers-mobile-bottom { display:flex; align-items:center; justify-content:space-between; gap:12px; padding-top:12px; border-top:1px solid #f0f1f6; }\n  .suppliers-mobile-bottom small { display:block; color:#9aa2b1; font-size:10px; margin-bottom:5px; }\n  .suppliers-mobile-bottom .suppliers-row-actions { gap:5px; }\n  .suppliers-footnote { align-items:flex-start; line-height:1.5; }\n}\n@media (prefers-reduced-motion: reduce) {\n  .suppliers-page *, .suppliers-page *::before, .suppliers-page *::after { animation-duration:.01ms !important; transition-duration:.01ms !important; }\n}\n";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const normalizedStatus = (status) =>
  String(status || "active").toLowerCase() === "inactive" ? "inactive" : "active";

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const loadSuppliers = useCallback(async (showRefresh = false) => {
    showRefresh ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const res = await API.get("/suppliers");
      const payload = res?.data?.data ?? res?.data?.suppliers ?? [];
      setSuppliers(Array.isArray(payload) ? payload : []);
    } catch (err) {
      console.error("Error loading suppliers:", err);
      setError(err?.response?.data?.message || "We couldn't load suppliers. Check your connection and try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  const filteredSuppliers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return suppliers.filter((item) => {
      const matchesQuery =
        !query ||
        [item.supplier_name, item.company_name, item.supplier_phone, item.supplier_email]
          .some((value) => String(value || "").toLowerCase().includes(query));
      const matchesStatus = statusFilter === "all" || normalizedStatus(item.status) === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [suppliers, search, statusFilter]);

  const summary = useMemo(() => {
    const active = suppliers.filter((s) => normalizedStatus(s.status) === "active").length;
    const due = suppliers.reduce((sum, s) => sum + Math.max(Number(s.balance_due) || 0, 0), 0);
    return { total: suppliers.length, active, due };
  }, [suppliers]);

  const updateSupplierStatus = async (supplier) => {
    const currentStatus = normalizedStatus(supplier.status);
    const nextStatus = currentStatus === "active" ? "inactive" : "active";
    const action = nextStatus === "inactive" ? "deactivate" : "activate";
    if (!window.confirm(`Are you sure you want to ${action} ${supplier.supplier_name || "this supplier"}?`)) return;

    setUpdatingId(supplier.id);
    try {
      await API.put(`/suppliers/${supplier.id}/status`, { status: nextStatus });
      setSuppliers((current) =>
        current.map((item) => item.id === supplier.id ? { ...item, status: nextStatus } : item)
      );
    } catch (err) {
      window.alert(err?.response?.data?.message || "Could not update supplier status.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <main className="suppliers-page">
      <style>{SUPPLIERS_STYLES}</style>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');`}</style>

      <section className="suppliers-heading">
        <div className="suppliers-heading-copy">
          <div className="suppliers-eyebrow"><span className="suppliers-eyebrow-dot" /> PROCUREMENT / CONTACTS</div>
          <h1>Supplier directory<span>.</span></h1>
          <p>Manage vendor relationships, contact details and outstanding balances in one place.</p>
        </div>
        <div className="suppliers-heading-actions">
          <button className="suppliers-secondary-btn" onClick={() => loadSuppliers(true)} disabled={refreshing}>
            <FiRefreshCw className={refreshing ? "suppliers-spinning" : ""} />
            {refreshing ? "Refreshing" : "Refresh"}
          </button>
          <Link className="suppliers-primary-btn" to="/add-supplier"><FiPlus /> Add supplier</Link>
        </div>
      </section>

      <section className="suppliers-metrics" aria-label="Supplier summary">
        <article className="suppliers-metric-card">
          <div className="suppliers-metric-top"><span>Total suppliers</span><span className="suppliers-metric-icon violet"><FiUsers /></span></div>
          <strong>{summary.total}</strong>
          <small>Vendor records in your directory</small>
        </article>
        <article className="suppliers-metric-card">
          <div className="suppliers-metric-top"><span>Active vendors</span><span className="suppliers-metric-icon green"><FiCheckCircle /></span></div>
          <strong>{summary.active}</strong>
          <small>Currently available for purchasing</small>
        </article>
        <article className="suppliers-metric-card suppliers-metric-due">
          <div className="suppliers-metric-top"><span>Outstanding balance</span><span className="suppliers-metric-icon amber"><FiAlertCircle /></span></div>
          <strong>{money(summary.due)}</strong>
          <small>Combined supplier balance due</small>
        </article>
      </section>

      <section className="suppliers-directory">
        <div className="suppliers-directory-header">
          <div>
            <h2>All suppliers</h2>
            <p>Search, review and manage your vendor list.</p>
          </div>
          <span className="suppliers-count-pill">{filteredSuppliers.length} shown</span>
        </div>

        <div className="suppliers-toolbar">
          <label className="suppliers-search">
            <FiSearch aria-hidden="true" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, company, phone or email"
              aria-label="Search suppliers"
            />
            {search && <button type="button" className="suppliers-clear-search" onClick={() => setSearch("")} aria-label="Clear search"><FiX /></button>}
          </label>
          <label className="suppliers-filter">
            <FiSliders aria-hidden="true" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by supplier status">
              <option value="all">All statuses</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>
          </label>
        </div>

        {error && (
          <div className="suppliers-error" role="alert">
            <FiAlertCircle />
            <span>{error}</span>
            <button onClick={() => loadSuppliers()} type="button">Try again</button>
          </div>
        )}

        {loading ? (
          <div className="suppliers-loading"><span className="suppliers-loader" /><strong>Loading supplier records</strong><span>Please wait a moment…</span></div>
        ) : !error && filteredSuppliers.length === 0 ? (
          <div className="suppliers-empty">
            <div className="suppliers-empty-icon"><FiTruck /></div>
            <h3>{search || statusFilter !== "all" ? "No suppliers match your filters" : "Your supplier list is empty"}</h3>
            <p>{search || statusFilter !== "all" ? "Try another search or reset the filters." : "Add your first vendor to start tracking contacts and balances."}</p>
            {search || statusFilter !== "all" ? (
              <button className="suppliers-secondary-btn" onClick={() => { setSearch(""); setStatusFilter("all"); }}>Clear filters</button>
            ) : (
              <Link className="suppliers-primary-btn" to="/add-supplier"><FiPlus /> Add first supplier</Link>
            )}
          </div>
        ) : (
          <>
            <div className="suppliers-table-wrap">
              <table className="suppliers-table">
                <thead><tr>
                  <th>Supplier</th><th>Contact</th><th>Balance due</th><th>Status</th><th className="suppliers-actions-head">Actions</th>
                </tr></thead>
                <tbody>
                  {filteredSuppliers.map((supplier) => {
                    const status = normalizedStatus(supplier.status);
                    const due = Number(supplier.balance_due) || 0;
                    const initial = String(supplier.supplier_name || "S").trim().charAt(0).toUpperCase() || "S";
                    return (
                      <tr key={supplier.id}>
                        <td>
                          <div className="suppliers-vendor">
                            <div className="suppliers-avatar">{initial}</div>
                            <div className="suppliers-vendor-copy">
                              <strong>{supplier.supplier_name || "Unnamed supplier"}</strong>
                              <span>{supplier.company_name || "Independent supplier"}</span>
                              <small>Vendor ID · {supplier.id}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="suppliers-contact">
                            <span><FiPhone /> {supplier.supplier_phone || "No phone provided"}</span>
                            {supplier.supplier_email && <span><FiMail /> {supplier.supplier_email}</span>}
                          </div>
                        </td>
                        <td><span className={`suppliers-balance ${due > 0 ? "is-due" : "is-clear"}`}>{money(due)}</span><small className="suppliers-balance-caption">{due > 0 ? "Payment pending" : "Account clear"}</small></td>
                        <td><span className={`suppliers-status ${status}`}><i />{status === "active" ? "Active" : "Inactive"}</span></td>
                        <td>
                          <div className="suppliers-row-actions">
                            <Link to={`/supplier/${supplier.id}`} className="suppliers-icon-btn view" title="View supplier" aria-label={`View ${supplier.supplier_name}`}><FiEye /></Link>
                            <Link to={`/edit-supplier/${supplier.id}`} className="suppliers-icon-btn edit" title="Edit supplier" aria-label={`Edit ${supplier.supplier_name}`}><FiEdit2 /></Link>
                            <button
                              type="button"
                              className={`suppliers-icon-btn ${status === "inactive" ? "activate" : "deactivate"}`}
                              onClick={() => updateSupplierStatus(supplier)}
                              disabled={updatingId === supplier.id}
                              title={status === "inactive" ? "Activate supplier" : "Deactivate supplier"}
                              aria-label={status === "inactive" ? `Activate ${supplier.supplier_name}` : `Deactivate ${supplier.supplier_name}`}
                            >
                              {status === "inactive" ? <FiCheckCircle /> : <FiXCircle />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="suppliers-table-footer"><span>Showing <strong>{filteredSuppliers.length}</strong> of <strong>{suppliers.length}</strong> suppliers</span><span><FiArrowUpRight /> Supplier balances reflect the latest data returned by your account.</span></div>
            <div className="suppliers-mobile-list">
              {filteredSuppliers.map((supplier) => {
                const status = normalizedStatus(supplier.status);
                const due = Number(supplier.balance_due) || 0;
                return <article className="suppliers-mobile-card" key={supplier.id}>
                  <div className="suppliers-mobile-top"><div className="suppliers-vendor"><div className="suppliers-avatar">{String(supplier.supplier_name || "S").trim().charAt(0).toUpperCase()}</div><div className="suppliers-vendor-copy"><strong>{supplier.supplier_name || "Unnamed supplier"}</strong><span>{supplier.company_name || "Independent supplier"}</span></div></div><span className={`suppliers-status ${status}`}><i />{status}</span></div>
                  <div className="suppliers-mobile-contact">{supplier.supplier_phone && <span><FiPhone />{supplier.supplier_phone}</span>}{supplier.supplier_email && <span><FiMail />{supplier.supplier_email}</span>}</div>
                  <div className="suppliers-mobile-bottom"><div><small>Balance due</small><strong className={`suppliers-balance ${due > 0 ? "is-due" : "is-clear"}`}>{money(due)}</strong></div><div className="suppliers-row-actions"><Link to={`/supplier/${supplier.id}`} className="suppliers-icon-btn view" aria-label="View supplier"><FiEye /></Link><Link to={`/edit-supplier/${supplier.id}`} className="suppliers-icon-btn edit" aria-label="Edit supplier"><FiEdit2 /></Link><button type="button" className={`suppliers-icon-btn ${status === "inactive" ? "activate" : "deactivate"}`} onClick={() => updateSupplierStatus(supplier)} disabled={updatingId === supplier.id} aria-label="Change supplier status">{status === "inactive" ? <FiCheckCircle /> : <FiXCircle />}</button></div></div>
                </article>;
              })}
            </div>
          </>
        )}
      </section>
      <footer className="suppliers-footnote"><FiTruck /> Keep vendor contacts and payment obligations up to date for smoother purchasing.</footer>
    </main>
  );
}
