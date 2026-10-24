import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import {
  FiPlus, FiSearch, FiEdit2, FiEye, FiTruck, FiPhone, FiMail,
  FiCheckCircle, FiXCircle, FiRefreshCw, FiUsers, FiAlertCircle,
  FiArrowUpRight, FiX, FiSliders, FiActivity, FiTrendingUp, FiShield,
  FiBriefcase, FiChevronRight
} from "react-icons/fi";

const SUPPLIERS_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
.suppliers-page{--ink:#171a2b;--muted:#737b91;--line:#e8eaf3;--panel:#fff;--bg:#f7f8fc;--purple:#7458f5;--purple-dark:#5c43dc;--green:#159b69;--red:#e05260;--amber:#c78320;min-height:100vh;padding:clamp(16px,2.5vw,34px);background:radial-gradient(ellipse at 0% 0%,#eeeaff 0%,transparent 36%),radial-gradient(ellipse at 100% 12%,#e8f4ff 0%,transparent 28%),var(--bg);color:var(--ink);font-family:'Plus Jakarta Sans','DM Sans',system-ui,sans-serif}
.suppliers-page *{box-sizing:border-box}.suppliers-shell{max-width:1500px;margin:0 auto}.suppliers-topline{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:24px}.suppliers-terminal-label{display:flex;align-items:center;gap:9px;color:#777b93;font-size:11px;font-weight:800;letter-spacing:.11em;text-transform:uppercase}.suppliers-live-dot{width:8px;height:8px;border-radius:50%;background:#20bd86;box-shadow:0 0 0 4px #20bd861a}.suppliers-market-status{display:inline-flex;align-items:center;gap:8px;padding:9px 12px;border:1px solid #dcd7ff;background:#fff;color:#6952d9;border-radius:999px;font-size:11px;font-weight:800;box-shadow:0 4px 14px #41338b08}.suppliers-heading{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;flex-wrap:wrap;margin-bottom:24px}.suppliers-heading-copy{max-width:760px}.suppliers-eyebrow{display:flex;align-items:center;gap:8px;color:var(--purple);font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;margin-bottom:10px}.suppliers-eyebrow-dot{width:7px;height:7px;border-radius:3px;background:var(--purple)}.suppliers-heading h1{font-size:clamp(29px,3.3vw,44px);line-height:1.12;letter-spacing:-1.8px;margin:0;font-weight:800;color:#171a2b}.suppliers-heading h1 span{color:var(--purple)}.suppliers-heading-copy p{margin:10px 0 0;color:var(--muted);font-size:13px;line-height:1.7}.suppliers-heading-actions{display:flex;gap:9px;align-items:center;flex-wrap:wrap}.suppliers-primary-btn,.suppliers-secondary-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:43px;padding:0 16px;border-radius:11px;font:800 12px 'Plus Jakarta Sans',sans-serif;text-decoration:none;cursor:pointer;transition:transform .18s ease,box-shadow .18s ease,background .18s ease}.suppliers-primary-btn{background:linear-gradient(135deg,#8067ff,#6549ec);color:#fff;border:1px solid #7055f1;box-shadow:0 8px 18px #7458f52b}.suppliers-primary-btn:hover{transform:translateY(-2px);box-shadow:0 11px 24px #7458f53a}.suppliers-secondary-btn{background:#fff;color:#3b4057;border:1px solid #e3e6f0;box-shadow:0 3px 8px #25274a06}.suppliers-secondary-btn:hover{border-color:#cfc7ff;background:#fbfaff}.suppliers-secondary-btn:disabled{opacity:.6;cursor:wait}.suppliers-primary-btn svg,.suppliers-secondary-btn svg{font-size:15px}.suppliers-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px;margin-bottom:22px}.suppliers-metric-card{position:relative;overflow:hidden;background:#fff;border:1px solid #e9eaf4;border-radius:18px;padding:20px 21px;min-height:145px;box-shadow:0 8px 24px #292b5208}.suppliers-metric-card:after{content:"";position:absolute;right:-35px;bottom:-62px;width:145px;height:145px;border-radius:50%;background:linear-gradient(135deg,#f0edff,#faf9ff);opacity:.9}.suppliers-metric-top{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:10px;color:#7d8299;font-size:11px;font-weight:700}.suppliers-metric-icon{width:36px;height:36px;border-radius:12px;display:grid;place-items:center;font-size:17px}.suppliers-metric-icon.violet{background:#f0edff;color:#765bf3}.suppliers-metric-icon.green{background:#e5f8ef;color:#159b69}.suppliers-metric-icon.amber{background:#fff2df;color:#c78320}.suppliers-metric-card>strong{position:relative;z-index:1;display:block;margin-top:13px;font-size:clamp(25px,2.4vw,32px);letter-spacing:-1px;font-weight:800;color:#202239}.suppliers-metric-card>small{position:relative;z-index:1;display:block;margin-top:7px;color:#9a9eb0;font-size:9px;font-weight:800;letter-spacing:.08em}.suppliers-metric-card:nth-child(2)>strong{color:var(--green)}.suppliers-metric-due>strong{color:#c78320}.suppliers-directory{border:1px solid #e7e9f3;border-radius:20px;background:#fff;overflow:hidden;box-shadow:0 12px 36px #292b5208}.suppliers-directory-header{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:22px 23px 17px;border-bottom:1px solid #f0f1f7;background:linear-gradient(110deg,#fff,#fcfbff)}.suppliers-directory-header h2{margin:0;font-size:17px;letter-spacing:-.5px;font-weight:800}.suppliers-directory-header p{margin:6px 0 0;color:#858ba1;font-size:11px}.suppliers-count-pill{padding:8px 11px;border:1px solid #e4dfff;border-radius:9px;background:#f5f2ff;color:#6c52e8;font-size:10px;font-weight:800;white-space:nowrap}.suppliers-toolbar{display:flex;align-items:center;gap:11px;padding:17px 23px 20px}.suppliers-search,.suppliers-filter{height:45px;display:flex;align-items:center;gap:10px;border:1px solid #e5e7f1;background:#fafbfe;border-radius:12px;padding:0 13px;color:#9399ae;transition:border .15s,box-shadow .15s}.suppliers-search{flex:1;min-width:150px}.suppliers-search:focus-within,.suppliers-filter:focus-within{border-color:#b7aaff;box-shadow:0 0 0 4px #7458f510;background:#fff}.suppliers-search>svg,.suppliers-filter>svg{flex-shrink:0;font-size:16px}.suppliers-search input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:#252840;font:500 12px 'DM Sans',sans-serif}.suppliers-search input::placeholder{color:#a2a7b9}.suppliers-clear-search{border:0;background:transparent;color:#8b91a7;cursor:pointer;padding:4px;display:grid;place-items:center}.suppliers-filter select{border:0;outline:0;background:transparent;color:#515770;font:700 11px 'DM Sans',sans-serif;cursor:pointer;min-width:105px}.suppliers-filter option{background:#fff}.suppliers-error{margin:0 23px 16px;padding:13px 14px;border-radius:11px;background:#fff0f1;border:1px solid #ffd6db;color:#c43e50;display:flex;align-items:center;gap:10px;font-size:12px}.suppliers-error span{flex:1}.suppliers-error button{border:0;background:#e05260;color:#fff;border-radius:7px;padding:8px 11px;font-weight:800;cursor:pointer}.suppliers-card-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;padding:0 23px 23px}.supplier-profile-card{position:relative;min-width:0;overflow:hidden;border:1px solid #e9eaf4;border-radius:17px;background:linear-gradient(155deg,#fff 0%,#fdfcff 100%);transition:transform .2s,border-color .2s,box-shadow .2s;box-shadow:0 5px 18px #292b5206}.supplier-profile-card:hover{transform:translateY(-4px);border-color:#d8d0ff;box-shadow:0 16px 32px #3e318c12}.supplier-card-accent{height:4px;background:linear-gradient(90deg,#7458f5,#a28cff 58%,#b9e8ff)}.supplier-card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;padding:18px 17px 15px}.supplier-card-identity{display:flex;align-items:center;gap:12px;min-width:0}.supplier-card-avatar{display:grid;place-items:center;flex:0 0 46px;width:46px;height:46px;border:1px solid #e1dbff;border-radius:14px;background:linear-gradient(145deg,#f0edff,#e5e0ff);color:#6b52e9;font-size:18px;font-weight:800}.supplier-card-title{min-width:0}.supplier-card-title h3{margin:0;overflow-wrap:anywhere;color:#202239;font-size:14px;font-weight:800;letter-spacing:-.25px}.supplier-card-title p{margin:5px 0 5px;color:#777e95;font-size:11px}.supplier-card-title small{color:#a1a6b8;font-size:9px;font-weight:700;letter-spacing:.04em}.suppliers-status{display:inline-flex;align-items:center;gap:6px;padding:7px 9px;border:1px solid transparent;border-radius:8px;font-size:9px;font-weight:800;white-space:nowrap}.suppliers-status i{display:block;width:6px;height:6px;border-radius:50%;background:currentColor}.suppliers-status.active{color:#12875c;background:#e5f8ef;border-color:#d1f2e2}.suppliers-status.inactive{color:#d34a5a;background:#fff0f1;border-color:#ffdbdf}.supplier-card-contact-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.2fr);gap:11px;margin:0 17px;padding:15px 0;border-top:1px solid #f0f1f7;border-bottom:1px solid #f0f1f7}.supplier-card-contact-item{min-width:0;display:flex;flex-direction:column;gap:8px}.supplier-card-label{display:flex;align-items:center;gap:6px;color:#969bb0;font-size:9px;font-weight:800;letter-spacing:.07em}.supplier-card-label svg{color:#8a76f4;font-size:12px}.supplier-card-contact-item>strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#454a63;font-size:10px;font-weight:700}.supplier-card-balance{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:14px 17px 0;padding:13px;border:1px solid #e9eaf4;border-radius:12px;background:#f8f9fd}.supplier-card-balance>div{display:flex;flex-direction:column;gap:7px}.supplier-card-balance>div>strong{font-size:21px;font-weight:800;letter-spacing:-.7px}.supplier-card-balance.has-due{border-color:#ffe0e2;background:#fff5f5}.supplier-card-balance.has-due>div>strong{color:#d94e5d}.supplier-card-balance.is-clear{border-color:#d8f2e5;background:#f0fbf5}.supplier-card-balance.is-clear>div>strong{color:#159b69}.supplier-balance-state{padding:7px 8px;border-radius:7px;background:#fff;color:#747b92;border:1px solid #eceef5;font-size:9px;font-weight:800;white-space:nowrap}.supplier-card-actions{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:14px 17px 17px}.supplier-card-view{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:35px;padding:0 11px;border:1px solid #e1dcff;border-radius:9px;background:#f5f2ff;color:#6a51e5;font-size:10px;font-weight:800;text-decoration:none;transition:background .15s}.supplier-card-view:hover{background:#ebe5ff}.supplier-card-view svg{font-size:13px}.suppliers-row-actions{display:flex;align-items:center;justify-content:flex-end;gap:7px}.suppliers-icon-btn{width:33px;height:33px;display:inline-grid;place-items:center;border:1px solid transparent;border-radius:9px;text-decoration:none;cursor:pointer;transition:background .15s,border-color .15s,transform .15s;font-size:14px}.suppliers-icon-btn:hover{transform:translateY(-1px)}.suppliers-icon-btn:disabled{opacity:.45;cursor:wait}.suppliers-icon-btn.edit{background:#fff6e8;color:#c78320;border-color:#ffe5bb}.suppliers-icon-btn.edit:hover{background:#ffedcf}.suppliers-icon-btn.deactivate{background:#fff0f1;color:#d94e5d;border-color:#ffd9dd}.suppliers-icon-btn.activate{background:#e5f8ef;color:#159b69;border-color:#d0f0e0}.suppliers-card-footer{display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;padding:14px 23px;border-top:1px solid #f0f1f7;background:#fcfcff;color:#9a9fb2;font-size:10px;font-weight:600}.suppliers-card-footer strong{color:#555b75}.suppliers-card-footer span:last-child{display:flex;align-items:center;gap:6px}.suppliers-card-footer svg{color:#8a76f4}.suppliers-loading,.suppliers-empty{min-height:250px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:30px;text-align:center}.suppliers-loading strong,.suppliers-empty h3{margin:0;color:#252840;font-size:15px;font-weight:800}.suppliers-loading>span:last-child,.suppliers-empty p{margin:0;color:#858ba1;font-size:12px;line-height:1.6}.suppliers-loader{width:32px;height:32px;border:3px solid #e8e5ff;border-top-color:var(--purple);border-radius:50%;animation:sp-spin .75s linear infinite}.suppliers-empty-icon{width:56px;height:56px;display:grid;place-items:center;border-radius:16px;background:#f0edff;color:var(--purple);font-size:24px;margin-bottom:5px}.suppliers-empty .suppliers-primary-btn,.suppliers-empty .suppliers-secondary-btn{margin-top:7px}.suppliers-footnote{max-width:1500px;margin:16px auto 0;display:flex;align-items:center;gap:8px;color:#969bb0;font-size:10px;font-weight:600}.suppliers-footnote svg{color:#8a76f4}.suppliers-spinning{animation:sp-spin .8s linear infinite}@keyframes sp-spin{to{transform:rotate(360deg)}}
@media(max-width:1100px){.suppliers-card-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:720px){.suppliers-page{padding:16px 12px}.suppliers-heading{align-items:flex-start;margin-bottom:18px}.suppliers-heading-actions{width:100%}.suppliers-heading-actions>*{flex:1}.suppliers-metrics{grid-template-columns:1fr 1fr;gap:9px}.suppliers-metric-card{padding:14px;min-height:120px;border-radius:15px}.suppliers-metric-card:last-child{grid-column:1/-1}.suppliers-directory-header{padding:17px 14px 14px}.suppliers-toolbar{padding:13px 14px 15px;flex-direction:column;align-items:stretch}.suppliers-search,.suppliers-filter{width:100%}.suppliers-filter select{flex:1}.suppliers-card-grid{grid-template-columns:1fr;padding:0 12px 14px;gap:12px}.supplier-card-head{padding:16px 14px 13px}.supplier-card-contact-grid{margin:0 14px;grid-template-columns:1fr;gap:12px}.supplier-card-balance{margin:12px 14px 0;padding:11px}.supplier-card-actions{padding:13px 14px 14px}.suppliers-card-footer{padding:12px 14px}.suppliers-topline{margin-bottom:20px}}
@media(prefers-reduced-motion:reduce){.suppliers-page *,.suppliers-page *:before,.suppliers-page *:after{animation-duration:.01ms!important;transition-duration:.01ms!important}}
`;

const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value) || 0);
const normalizedStatus = (status) => String(status || "active").toLowerCase() === "inactive" ? "inactive" : "active";

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

  useEffect(() => { loadSuppliers(); }, [loadSuppliers]);

  const filteredSuppliers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return suppliers.filter((item) => {
      const matchesQuery = !query || [item.supplier_name, item.company_name, item.supplier_phone, item.supplier_email]
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
      setSuppliers((current) => current.map((item) => item.id === supplier.id ? { ...item, status: nextStatus } : item));
    } catch (err) {
      window.alert(err?.response?.data?.message || "Could not update supplier status.");
    } finally { setUpdatingId(null); }
  };

  return (
    <main className="suppliers-page">
      <style>{SUPPLIERS_STYLES}</style>
      <div className="suppliers-shell">
        <div className="suppliers-topline">
          <div className="suppliers-terminal-label"><span className="suppliers-live-dot" /> BUSINESSOS / SUPPLIER HUB</div>
          <div className="suppliers-market-status"><FiActivity /> SUPPLIER MANAGEMENT <span>● ACTIVE</span></div>
        </div>

        <section className="suppliers-heading">
          <div className="suppliers-heading-copy">
            <div className="suppliers-eyebrow"><span className="suppliers-eyebrow-dot" /> SUPPLIER WORKSPACE / 01</div>
            <h1>Supplier <span>management.</span></h1>
            <p>Manage supplier relationships, contact details, and outstanding balances in one simple workspace.</p>
          </div>
          <div className="suppliers-heading-actions">
            <button className="suppliers-secondary-btn" onClick={() => loadSuppliers(true)} disabled={refreshing} type="button"><FiRefreshCw className={refreshing ? "suppliers-spinning" : ""} />{refreshing ? "Refreshing" : "Refresh list"}</button>
            <Link className="suppliers-primary-btn" to="/add-supplier"><FiPlus /> Add supplier</Link>
          </div>
        </section>

        <section className="suppliers-metrics" aria-label="Supplier summary">
          <article className="suppliers-metric-card"><div className="suppliers-metric-top"><span>Total suppliers</span><span className="suppliers-metric-icon violet"><FiUsers /></span></div><strong>{summary.total.toLocaleString("en-IN")}</strong><small><FiBriefcase style={{verticalAlign:"-2px",marginRight:5}} />SUPPLIER RECORDS</small></article>
          <article className="suppliers-metric-card"><div className="suppliers-metric-top"><span>Active suppliers</span><span className="suppliers-metric-icon green"><FiCheckCircle /></span></div><strong>{summary.active.toLocaleString("en-IN")}</strong><small><FiTrendingUp style={{verticalAlign:"-2px",marginRight:5}} />READY FOR PURCHASES</small></article>
          <article className="suppliers-metric-card suppliers-metric-due"><div className="suppliers-metric-top"><span>Outstanding balance</span><span className="suppliers-metric-icon amber"><FiAlertCircle /></span></div><strong>{money(summary.due)}</strong><small><FiShield style={{verticalAlign:"-2px",marginRight:5}} />COMBINED BALANCE DUE</small></article>
        </section>

        <section className="suppliers-directory">
          <div className="suppliers-directory-header"><div><h2>All suppliers</h2><p>Search, review and manage supplier accounts.</p></div><span className="suppliers-count-pill">{filteredSuppliers.length} / {suppliers.length} SHOWN</span></div>
          <div className="suppliers-toolbar">
            <label className="suppliers-search"><FiSearch aria-hidden="true" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search supplier, company, phone or email…" aria-label="Search suppliers" />{search && <button type="button" className="suppliers-clear-search" onClick={() => setSearch("")} aria-label="Clear search"><FiX /></button>}</label>
            <label className="suppliers-filter"><FiSliders aria-hidden="true" /><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by supplier status"><option value="all">All statuses</option><option value="active">Active only</option><option value="inactive">Inactive only</option></select></label>
          </div>
          {error && <div className="suppliers-error" role="alert"><FiAlertCircle /><span>{error}</span><button onClick={() => loadSuppliers()} type="button">Retry</button></div>}
          {loading ? (
            <div className="suppliers-loading"><span className="suppliers-loader" /><strong>Loading suppliers</strong><span>Loading account data…</span></div>
          ) : !error && filteredSuppliers.length === 0 ? (
            <div className="suppliers-empty"><div className="suppliers-empty-icon"><FiTruck /></div><h3>{search || statusFilter !== "all" ? "No counterparties match" : "No suppliers registered yet"}</h3><p>{search || statusFilter !== "all" ? "Change the search or status filter and try again." : "Add your first supplier to start tracking vendor accounts."}</p>{search || statusFilter !== "all" ? <button className="suppliers-secondary-btn" onClick={() => { setSearch(""); setStatusFilter("all"); }} type="button">Reset filters</button> : <Link className="suppliers-primary-btn" to="/add-supplier"><FiPlus /> Add first supplier</Link>}</div>
          ) : (
            <>
              <div className="suppliers-card-grid">
                {filteredSuppliers.map((supplier) => {
                  const status = normalizedStatus(supplier.status);
                  const due = Number(supplier.balance_due) || 0;
                  const name = String(supplier.supplier_name || "Unnamed supplier").trim();
                  const initial = name.charAt(0).toUpperCase() || "S";
                  return (
                    <article className="supplier-profile-card" key={supplier.id}>
                      <div className="supplier-card-accent" />
                      <div className="supplier-card-head">
                        <div className="supplier-card-identity"><div className="supplier-card-avatar">{initial}</div><div className="supplier-card-title"><h3>{name}</h3><p>{supplier.company_name || "Independent supplier"}</p><small>REF · {supplier.id}</small></div></div>
                        <span className={`suppliers-status ${status}`}><i />{status === "active" ? "Active" : "Inactive"}</span>
                      </div>
                      <div className="supplier-card-contact-grid">
                        <div className="supplier-card-contact-item"><span className="supplier-card-label"><FiPhone /> PHONE</span><strong>{supplier.supplier_phone || "Not provided"}</strong></div>
                        <div className="supplier-card-contact-item"><span className="supplier-card-label"><FiMail /> EMAIL</span><strong title={supplier.supplier_email || "Not provided"}>{supplier.supplier_email || "Not provided"}</strong></div>
                      </div>
                      <div className={`supplier-card-balance ${due > 0 ? "has-due" : "is-clear"}`}><div><span className="supplier-card-label">OUTSTANDING BALANCE</span><strong>{money(due)}</strong></div><span className="supplier-balance-state">{due > 0 ? "● PAYMENT DUE" : "✓ ACCOUNT CLEAR"}</span></div>
                      <div className="supplier-card-actions"><Link to={`/supplier/${supplier.id}`} className="supplier-card-view"><FiEye /> Account details <FiChevronRight /></Link><div className="suppliers-row-actions"><Link to={`/edit-supplier/${supplier.id}`} className="suppliers-icon-btn edit" title="Edit supplier" aria-label={`Edit ${name}`}><FiEdit2 /></Link><button type="button" className={`suppliers-icon-btn ${status === "inactive" ? "activate" : "deactivate"}`} onClick={() => updateSupplierStatus(supplier)} disabled={updatingId === supplier.id} title={status === "inactive" ? "Activate supplier" : "Deactivate supplier"} aria-label={status === "inactive" ? `Activate ${name}` : `Deactivate ${name}`}>{status === "inactive" ? <FiCheckCircle /> : <FiXCircle />}</button></div></div>
                    </article>
                  );
                })}
              </div>
              <div className="suppliers-card-footer"><span>SHOWING <strong>{filteredSuppliers.length}</strong> OF <strong>{suppliers.length}</strong> SUPPLIERS</span><span><FiArrowUpRight /> BALANCES REFLECT LATEST ACCOUNT DATA</span></div>
            </>
          )}
        </section>
        <footer className="suppliers-footnote"><FiTruck /> Keep supplier contacts and payment obligations up to date for smoother purchasing.</footer>
      </div>
    </main>
  );
}
