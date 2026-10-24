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
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap');
.suppliers-page{--ink:#e9eef8;--muted:#94a3b8;--line:#27364a;--panel:#111c2c;--bg:#08111f;--green:#35d49a;--red:#ff6b78;--gold:#f6bd60;--blue:#6d9eff;min-height:100vh;padding:clamp(16px,2.5vw,34px);background:radial-gradient(ellipse at 12% 0%,#142641 0%,transparent 34%),var(--bg);color:var(--ink);font-family:Manrope,system-ui,sans-serif}
.suppliers-page *{box-sizing:border-box}.suppliers-shell{max-width:1500px;margin:0 auto}.suppliers-topline{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:25px}.suppliers-terminal-label{display:flex;align-items:center;gap:9px;color:#9cb1cc;font:500 10px 'DM Mono',monospace;letter-spacing:.16em;text-transform:uppercase}.suppliers-live-dot{width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:0 0 0 4px #35d49a1a}.suppliers-market-status{display:inline-flex;align-items:center;gap:8px;padding:8px 11px;border:1px solid #28443f;background:#0d2928;color:#8ce8c5;border-radius:8px;font:500 10px 'DM Mono',monospace}.suppliers-heading{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;flex-wrap:wrap;margin-bottom:24px}.suppliers-heading-copy{max-width:760px}.suppliers-eyebrow{display:flex;align-items:center;gap:8px;color:var(--green);font:500 10px 'DM Mono',monospace;letter-spacing:.15em;text-transform:uppercase;margin-bottom:10px}.suppliers-eyebrow-dot{width:6px;height:6px;border-radius:2px;background:var(--green)}.suppliers-heading h1{font-size:clamp(28px,3.3vw,43px);line-height:1.1;letter-spacing:-1.7px;margin:0;font-weight:800}.suppliers-heading h1 span{color:var(--green)}.suppliers-heading-copy p{margin:10px 0 0;color:var(--muted);font-size:13px;line-height:1.65}.suppliers-heading-actions{display:flex;gap:9px;align-items:center;flex-wrap:wrap}.suppliers-primary-btn,.suppliers-secondary-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:42px;padding:0 15px;border-radius:8px;font:700 12px Manrope,sans-serif;text-decoration:none;cursor:pointer;transition:.18s ease}.suppliers-primary-btn{background:var(--green);color:#061a16;border:1px solid var(--green);box-shadow:0 6px 20px #35d49a18}.suppliers-primary-btn:hover{background:#69e6b7;transform:translateY(-1px)}.suppliers-secondary-btn{background:#111c2c;color:#d2dbea;border:1px solid #2a3b52}.suppliers-secondary-btn:hover{border-color:#58718e;background:#16253a}.suppliers-secondary-btn:disabled{opacity:.6;cursor:wait}.suppliers-primary-btn svg,.suppliers-secondary-btn svg{font-size:15px}.suppliers-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px;margin-bottom:22px}.suppliers-metric-card{position:relative;overflow:hidden;background:linear-gradient(145deg,#132136,#0e1929);border:1px solid #25364c;border-radius:13px;padding:18px 20px;min-height:135px}.suppliers-metric-card:after{content:"";position:absolute;right:-30px;bottom:-52px;width:125px;height:125px;border-radius:50%;border:1px solid #30435a;box-shadow:0 0 0 14px #152338,0 0 0 28px #142136;opacity:.65}.suppliers-metric-top{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:10px;color:#9bacbf;font:500 10px 'DM Mono',monospace;text-transform:uppercase;letter-spacing:.07em}.suppliers-metric-icon{width:32px;height:32px;border-radius:8px;display:grid;place-items:center;font-size:16px}.suppliers-metric-icon.violet{background:#233254;color:#9eb6ff}.suppliers-metric-icon.green{background:#123d35;color:var(--green)}.suppliers-metric-icon.amber{background:#3d3020;color:var(--gold)}.suppliers-metric-card>strong{position:relative;z-index:1;display:block;margin-top:14px;font:800 clamp(24px,2.3vw,31px) 'DM Mono',monospace;letter-spacing:-1px}.suppliers-metric-card>small{position:relative;z-index:1;display:block;margin-top:6px;color:#70839b;font:400 10px 'DM Mono',monospace}.suppliers-metric-card:nth-child(2)>strong{color:var(--green)}.suppliers-metric-due>strong{color:var(--gold)}.suppliers-directory{border:1px solid #26364b;border-radius:14px;background:#0d1827;overflow:hidden;box-shadow:0 18px 45px #00000014}.suppliers-directory-header{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:21px 22px 17px;border-bottom:1px solid #1e2d40;background:linear-gradient(90deg,#111e30,#0d1827)}.suppliers-directory-header h2{margin:0;font-size:16px;letter-spacing:-.35px;font-weight:800}.suppliers-directory-header p{margin:5px 0 0;color:#8496ac;font-size:11px}.suppliers-count-pill{padding:7px 10px;border:1px solid #2c4059;border-radius:6px;background:#14243a;color:#a8c2e8;font:500 10px 'DM Mono',monospace;white-space:nowrap}.suppliers-toolbar{display:flex;align-items:center;gap:10px;padding:16px 22px 18px}.suppliers-search,.suppliers-filter{height:42px;display:flex;align-items:center;gap:9px;border:1px solid #293b51;background:#0a1422;border-radius:8px;padding:0 12px;color:#8195ad}.suppliers-search{flex:1;min-width:150px}.suppliers-search:focus-within,.suppliers-filter:focus-within{border-color:#4a8e83;box-shadow:0 0 0 3px #35d49a12}.suppliers-search>svg,.suppliers-filter>svg{flex-shrink:0;font-size:15px}.suppliers-search input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:#e5edf7;font:500 11px 'DM Mono',monospace}.suppliers-search input::placeholder{color:#61748b}.suppliers-clear-search{border:0;background:transparent;color:#94a3b8;cursor:pointer;padding:4px;display:grid;place-items:center}.suppliers-filter select{border:0;outline:0;background:transparent;color:#c2cede;font:500 11px 'DM Mono',monospace;cursor:pointer;min-width:105px}.suppliers-filter option{background:#0d1827}.suppliers-error{margin:0 22px 16px;padding:12px 14px;border-radius:8px;background:#321c28;border:1px solid #63303e;color:#ff9ba5;display:flex;align-items:center;gap:10px;font-size:12px}.suppliers-error span{flex:1}.suppliers-error button{border:0;background:#ff6b78;color:#240c11;border-radius:6px;padding:7px 10px;font-weight:800;cursor:pointer}.suppliers-card-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px;padding:0 22px 22px}.supplier-profile-card{position:relative;min-width:0;overflow:hidden;border:1px solid #2a3b51;border-radius:12px;background:linear-gradient(160deg,#142237,#0e1929 75%);transition:transform .18s,border-color .18s,box-shadow .18s}.supplier-profile-card:hover{transform:translateY(-3px);border-color:#3e6b68;box-shadow:0 15px 28px #0003}.supplier-card-accent{height:3px;background:linear-gradient(90deg,var(--green),#4f9df5 60%,#8d78ff)}.supplier-card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;padding:17px 16px 15px}.supplier-card-identity{display:flex;align-items:center;gap:11px;min-width:0}.supplier-card-avatar{display:grid;place-items:center;flex:0 0 44px;width:44px;height:44px;border:1px solid #34566a;border-radius:10px;background:#16313b;color:var(--green);font:800 17px 'DM Mono',monospace}.supplier-card-title{min-width:0}.supplier-card-title h3{margin:0;overflow-wrap:anywhere;color:#f0f5fb;font-size:14px;font-weight:800;letter-spacing:-.25px}.supplier-card-title p{margin:5px 0 4px;color:#9eb0c6;font-size:11px}.supplier-card-title small{color:#617790;font:400 9px 'DM Mono',monospace}.suppliers-status{display:inline-flex;align-items:center;gap:6px;padding:6px 8px;border:1px solid currentColor;border-radius:6px;font:500 9px 'DM Mono',monospace;white-space:nowrap;text-transform:uppercase}.suppliers-status i{display:block;width:5px;height:5px;border-radius:50%;background:currentColor}.suppliers-status.active{color:var(--green);background:#103329}.suppliers-status.inactive{color:var(--red);background:#351d2a}.supplier-card-contact-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.2fr);gap:10px;margin:0 16px;padding:14px 0;border-top:1px solid #25364b;border-bottom:1px solid #25364b}.supplier-card-contact-item{min-width:0;display:flex;flex-direction:column;gap:8px}.supplier-card-label{display:flex;align-items:center;gap:6px;color:#70869f;font:500 9px 'DM Mono',monospace;letter-spacing:.09em}.supplier-card-label svg{color:#70a4ff;font-size:12px}.supplier-card-contact-item>strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#d3ddeb;font:500 10px 'DM Mono',monospace}.supplier-card-balance{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:13px 16px 0;padding:12px;border:1px solid #2b3b4e;border-radius:9px;background:#0b1523}.supplier-card-balance>div{display:flex;flex-direction:column;gap:7px}.supplier-card-balance>div>strong{font:700 20px 'DM Mono',monospace;letter-spacing:-.6px}.supplier-card-balance.has-due{border-color:#5b3038;background:#271923}.supplier-card-balance.has-due>div>strong{color:var(--red)}.supplier-card-balance.is-clear{border-color:#22493f;background:#10251f}.supplier-card-balance.is-clear>div>strong{color:var(--green)}.supplier-balance-state{padding:6px 7px;border-radius:5px;background:#192638;color:#9aacc1;font:500 9px 'DM Mono',monospace;white-space:nowrap}.supplier-card-actions{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:14px 16px 16px}.supplier-card-view{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:33px;padding:0 10px;border:1px solid #31516a;border-radius:7px;background:#142b3b;color:#a6d6ef;font-size:10px;font-weight:800;text-decoration:none;transition:background .15s}.supplier-card-view:hover{background:#1a3a4d}.supplier-card-view svg{font-size:13px}.suppliers-row-actions{display:flex;align-items:center;justify-content:flex-end;gap:6px}.suppliers-icon-btn{width:31px;height:31px;display:inline-grid;place-items:center;border:1px solid transparent;border-radius:7px;text-decoration:none;cursor:pointer;transition:background .15s,border-color .15s,transform .15s;font-size:13px}.suppliers-icon-btn:hover{transform:translateY(-1px)}.suppliers-icon-btn:disabled{opacity:.45;cursor:wait}.suppliers-icon-btn.edit{background:#302719;color:var(--gold);border-color:#59432a}.suppliers-icon-btn.edit:hover{background:#493720}.suppliers-icon-btn.deactivate{background:#351d2a;color:var(--red);border-color:#5c2d3c}.suppliers-icon-btn.activate{background:#103329;color:var(--green);border-color:#245947}.suppliers-card-footer{display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;padding:13px 22px;border-top:1px solid #1e2d40;background:#0b1523;color:#71859d;font:400 10px 'DM Mono',monospace}.suppliers-card-footer strong{color:#c6d5e8}.suppliers-card-footer span:last-child{display:flex;align-items:center;gap:6px}.suppliers-card-footer svg{color:#6d9eff}.suppliers-loading,.suppliers-empty{min-height:250px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:30px;text-align:center}.suppliers-loading strong,.suppliers-empty h3{margin:0;color:#e2eaf5;font-size:15px;font-weight:800}.suppliers-loading>span:last-child,.suppliers-empty p{margin:0;color:#8295ac;font-size:12px;line-height:1.6}.suppliers-loader{width:32px;height:32px;border:3px solid #26384d;border-top-color:var(--green);border-radius:50%;animation:sp-spin .75s linear infinite}.suppliers-empty-icon{width:54px;height:54px;display:grid;place-items:center;border-radius:12px;background:#17283c;color:var(--blue);font-size:24px;margin-bottom:5px}.suppliers-empty .suppliers-primary-btn,.suppliers-empty .suppliers-secondary-btn{margin-top:7px}.suppliers-footnote{max-width:1500px;margin:15px auto 0;display:flex;align-items:center;gap:8px;color:#61758d;font:400 10px 'DM Mono',monospace}.suppliers-footnote svg{color:#6d9eff}.suppliers-spinning{animation:sp-spin .8s linear infinite}@keyframes sp-spin{to{transform:rotate(360deg)}}
@media(max-width:1100px){.suppliers-card-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:720px){.suppliers-page{padding:16px 12px}.suppliers-heading{align-items:flex-start;margin-bottom:18px}.suppliers-heading-actions{width:100%}.suppliers-heading-actions>*{flex:1}.suppliers-metrics{grid-template-columns:1fr 1fr;gap:9px}.suppliers-metric-card{padding:14px;min-height:120px}.suppliers-metric-card:last-child{grid-column:1/-1}.suppliers-directory-header{padding:17px 14px 14px}.suppliers-toolbar{padding:13px 14px 15px;flex-direction:column;align-items:stretch}.suppliers-search,.suppliers-filter{width:100%}.suppliers-filter select{flex:1}.suppliers-card-grid{grid-template-columns:1fr;padding:0 12px 14px;gap:11px}.supplier-card-head{padding:16px 14px 13px}.supplier-card-contact-grid{margin:0 14px;grid-template-columns:1fr;gap:12px}.supplier-card-balance{margin:12px 14px 0;padding:11px}.supplier-card-actions{padding:13px 14px 14px}.suppliers-card-footer{padding:12px 14px}.suppliers-topline{margin-bottom:20px}}
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
          <div className="suppliers-terminal-label"><span className="suppliers-live-dot" /> BUSINESSOS / PROCUREMENT TERMINAL</div>
          <div className="suppliers-market-status"><FiActivity /> SUPPLIER NETWORK <span>● LIVE</span></div>
        </div>

        <section className="suppliers-heading">
          <div className="suppliers-heading-copy">
            <div className="suppliers-eyebrow"><span className="suppliers-eyebrow-dot" /> VENDOR INTELLIGENCE / 01</div>
            <h1>Supplier <span>trading desk.</span></h1>
            <p>Track vendor relationships, purchasing readiness and outstanding balances from one operational view.</p>
          </div>
          <div className="suppliers-heading-actions">
            <button className="suppliers-secondary-btn" onClick={() => loadSuppliers(true)} disabled={refreshing} type="button"><FiRefreshCw className={refreshing ? "suppliers-spinning" : ""} />{refreshing ? "Refreshing" : "Sync data"}</button>
            <Link className="suppliers-primary-btn" to="/add-supplier"><FiPlus /> Add supplier</Link>
          </div>
        </section>

        <section className="suppliers-metrics" aria-label="Supplier summary">
          <article className="suppliers-metric-card"><div className="suppliers-metric-top"><span>Supplier universe</span><span className="suppliers-metric-icon violet"><FiUsers /></span></div><strong>{summary.total.toLocaleString("en-IN")}</strong><small><FiBriefcase style={{verticalAlign:"-2px",marginRight:5}} />TOTAL VENDOR RECORDS</small></article>
          <article className="suppliers-metric-card"><div className="suppliers-metric-top"><span>Active counterparties</span><span className="suppliers-metric-icon green"><FiCheckCircle /></span></div><strong>{summary.active.toLocaleString("en-IN")}</strong><small><FiTrendingUp style={{verticalAlign:"-2px",marginRight:5}} />READY FOR PURCHASING</small></article>
          <article className="suppliers-metric-card suppliers-metric-due"><div className="suppliers-metric-top"><span>Outstanding exposure</span><span className="suppliers-metric-icon amber"><FiAlertCircle /></span></div><strong>{money(summary.due)}</strong><small><FiShield style={{verticalAlign:"-2px",marginRight:5}} />TOTAL PAYABLE BALANCE</small></article>
        </section>

        <section className="suppliers-directory">
          <div className="suppliers-directory-header"><div><h2>Counterparty watchlist</h2><p>Search, review and manage supplier accounts.</p></div><span className="suppliers-count-pill">{filteredSuppliers.length} / {suppliers.length} MATCHED</span></div>
          <div className="suppliers-toolbar">
            <label className="suppliers-search"><FiSearch aria-hidden="true" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search supplier, company, phone or email…" aria-label="Search suppliers" />{search && <button type="button" className="suppliers-clear-search" onClick={() => setSearch("")} aria-label="Clear search"><FiX /></button>}</label>
            <label className="suppliers-filter"><FiSliders aria-hidden="true" /><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by supplier status"><option value="all">All statuses</option><option value="active">Active only</option><option value="inactive">Inactive only</option></select></label>
          </div>
          {error && <div className="suppliers-error" role="alert"><FiAlertCircle /><span>{error}</span><button onClick={() => loadSuppliers()} type="button">Retry</button></div>}
          {loading ? (
            <div className="suppliers-loading"><span className="suppliers-loader" /><strong>Syncing supplier records</strong><span>Loading account data…</span></div>
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
                        <div className="supplier-card-contact-item"><span className="supplier-card-label"><FiPhone /> CONTACT LINE</span><strong>{supplier.supplier_phone || "Not provided"}</strong></div>
                        <div className="supplier-card-contact-item"><span className="supplier-card-label"><FiMail /> EMAIL ADDRESS</span><strong title={supplier.supplier_email || "Not provided"}>{supplier.supplier_email || "Not provided"}</strong></div>
                      </div>
                      <div className={`supplier-card-balance ${due > 0 ? "has-due" : "is-clear"}`}><div><span className="supplier-card-label">OPEN PAYABLE</span><strong>{money(due)}</strong></div><span className="supplier-balance-state">{due > 0 ? "● PAYMENT DUE" : "✓ SETTLED"}</span></div>
                      <div className="supplier-card-actions"><Link to={`/supplier/${supplier.id}`} className="supplier-card-view"><FiEye /> Account details <FiChevronRight /></Link><div className="suppliers-row-actions"><Link to={`/edit-supplier/${supplier.id}`} className="suppliers-icon-btn edit" title="Edit supplier" aria-label={`Edit ${name}`}><FiEdit2 /></Link><button type="button" className={`suppliers-icon-btn ${status === "inactive" ? "activate" : "deactivate"}`} onClick={() => updateSupplierStatus(supplier)} disabled={updatingId === supplier.id} title={status === "inactive" ? "Activate supplier" : "Deactivate supplier"} aria-label={status === "inactive" ? `Activate ${name}` : `Deactivate ${name}`}>{status === "inactive" ? <FiCheckCircle /> : <FiXCircle />}</button></div></div>
                    </article>
                  );
                })}
              </div>
              <div className="suppliers-card-footer"><span>DISPLAYING <strong>{filteredSuppliers.length}</strong> OF <strong>{suppliers.length}</strong> ACCOUNTS</span><span><FiArrowUpRight /> PAYABLE VALUES REFLECT LATEST API DATA</span></div>
            </>
          )}
        </section>
        <footer className="suppliers-footnote"><FiTruck /> Procurement terminal · Keep supplier contacts and payment obligations current.</footer>
      </div>
    </main>
  );
}
