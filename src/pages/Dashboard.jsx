import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";
import {
  FiDollarSign, FiShoppingBag, FiShoppingCart, FiTrendingUp, FiUsers,
  FiTruck, FiAlertCircle, FiPlus, FiList, FiBarChart2, FiGrid,
  FiClock, FiCheckCircle, FiXCircle, FiUser, FiEdit, FiLogOut,
  FiChevronDown, FiHome, FiBriefcase, FiZap, FiArrowUpRight,
  FiArrowRight, FiMoreHorizontal, FiActivity, FiBox, FiCreditCard,
  FiRefreshCw, FiMenu, FiSearch, FiCommand
} from "react-icons/fi";

export default function BusinessDashboard() {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  const [dashboard, setDashboard] = useState({
    totalProducts: 0, totalCategories: 0, todaySales: 0, monthSales: 0,
    totalCustomers: 0, totalSuppliers: 0, totalSales: 0, lowStock: 0,
  });
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [businessName, setBusinessName] = useState("Your Store");
  const [businessType, setBusinessType] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [businessLogo, setBusinessLogo] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      setError("");
      await Promise.all([loadDashboard(), loadRecentSales(), loadBusinessInfo()]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadBusinessInfo = async () => {
    setBusinessName(localStorage.getItem("businessName") || "Your Store");
    setBusinessType(localStorage.getItem("businessType") || "");
    try {
      const res = await API.get("/business/profile");
      if (res.data.business) {
        const b = res.data.business;
        setBusinessLogo(b.logo || "");
        if (b.business_name) setBusinessName(b.business_name);
        if (b.business_type) setBusinessType(b.business_type);
      }
    } catch (err) {
      console.log("Could not load business profile:", err);
    }
  };

  const loadDashboard = async () => {
    try {
      const res = await API.get("/dashboard");
      setDashboard((prev) => ({ ...prev, ...(res.data || {}) }));
    } catch (err) {
      console.error("Failed to load dashboard:", err);
      setError(err.response?.data?.message || "Failed to load dashboard.");
    }
  };

  const loadRecentSales = async () => {
    try {
      const res = await API.get("/sales?limit=5");
      setRecentSales((res.data.data || []).slice(0, 5));
    } catch (err) {
      console.error("Failed to load recent sales:", err);
      setRecentSales([]);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const formatCurrency = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
  };

  const formatTime = () => new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit",
  });

  if (loading) return (
    <div className="businessos loading-screen">
      <div className="loading-card">
        <div className="loading-logo"><FiZap /></div>
        <div className="loader" />
        <h3>Preparing your workspace</h3>
        <p>Loading your business intelligence...</p>
      </div>
      <DashboardStyles />
    </div>
  );

  if (error) return (
    <div className="businessos error-screen">
      <div className="error-card">
        <div className="error-icon"><FiAlertCircle /></div>
        <span className="eyebrow">WORKSPACE ERROR</span>
        <h2>We couldn't load your dashboard</h2>
        <p>{error}</p>
        <button className="button button-primary" onClick={() => loadAll(true)}>
          <FiRefreshCw /> Try Again
        </button>
      </div>
      <DashboardStyles />
    </div>
  );

  const stats = [
    { label: "Today's revenue", value: formatCurrency(dashboard.todaySales), sub: "Today's completed sales", icon: <FiDollarSign />, color: "green", link: "/sales" },
    { label: "Monthly revenue", value: formatCurrency(dashboard.monthSales), sub: "Revenue this month", icon: <FiTrendingUp />, color: "purple", link: "/reports" },
    { label: "Total products", value: Number(dashboard.totalProducts || 0).toLocaleString("en-IN"), sub: `${dashboard.lowStock || 0} items low in stock`, icon: <FiBox />, color: "blue", link: "/products" },
    { label: "Customers", value: Number(dashboard.totalCustomers || 0).toLocaleString("en-IN"), sub: "Customer database", icon: <FiUsers />, color: "orange", link: "/customers" },
  ];

  const navGroups = [
    {
      title: "WORKSPACE",
      items: [
        { label: "Overview", to: "/dashboard", icon: <FiHome />, active: true },
        { label: "Billing POS", to: "/billing-pos", icon: <FiShoppingBag />, shortcut: "F2" },
        { label: "Products", to: "/products", icon: <FiGrid /> },
        { label: "Customers", to: "/customers", icon: <FiUsers /> },
        { label: "Suppliers", to: "/suppliers", icon: <FiTruck /> },
        { label: "Purchases", to: "/purchases", icon: <FiShoppingCart /> },
      ],
    },
    {
      title: "ANALYTICS",
      items: [
        { label: "Sales history", to: "/sales", icon: <FiList /> },
        { label: "Reports", to: "/reports", icon: <FiBarChart2 /> },
        { label: "QR orders", to: "/qr-orders", icon: <FiCreditCard /> },
        { label: "QR ordering", to: "/qr-ordering", icon: <FiGrid /> },
      ],
    },
  ];

  return (
    <div className="businessos">
      <aside className={`dashboard-sidebar ${mobileNavOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-icon"><FiZap /></div>
          <div><strong>BusinessOS</strong><small>Retail intelligence</small></div>
          <button className="mobile-close" onClick={() => setMobileNavOpen(false)}>×</button>
        </div>

        {navGroups.map((group) => (
          <div className="nav-group" key={group.title}>
            <div className="nav-heading">{group.title}</div>
            <nav>
              {group.items.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className={`sidebar-link ${item.active ? "active" : ""}`}
                  onClick={() => setMobileNavOpen(false)}
                >
                  <span className="sidebar-link-icon">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.shortcut && <kbd>{item.shortcut}</kbd>}
                  {item.active && <span className="active-indicator" />}
                </Link>
              ))}
            </nav>
          </div>
        ))}

        <div className="sidebar-bottom">
          <div className="system-card">
            <div className="system-status"><span className="pulse-dot" /> System operational</div>
            <small>All services connected</small>
          </div>
          <div className="sidebar-version">BUSINESSOS <span>v1.0</span></div>
        </div>
      </aside>

      {mobileNavOpen && <div className="sidebar-overlay" onClick={() => setMobileNavOpen(false)} />}

      <main className="dashboard-content">
        <header className="dashboard-topbar">
          <button className="mobile-menu-btn" onClick={() => setMobileNavOpen(true)}><FiMenu /></button>
          <div className="topbar-title">
            <span>Workspace</span><span className="crumb-divider">/</span><strong>Overview</strong>
          </div>
          <div className="topbar-right">
            <div className="time-chip"><span className="pulse-dot" /><FiClock /> {formatTime()}</div>
            <button className={`refresh-btn ${refreshing ? "refreshing" : ""}`} onClick={() => loadAll(true)} title="Refresh"><FiRefreshCw /></button>
            <div className="profile-container">
              <button className="business-profile" onClick={() => setShowProfileMenu((v) => !v)}>
                <div className="profile-image">
                  {businessLogo ? <img src={businessLogo} alt="Business logo" /> : <FiBriefcase />}
                </div>
                <div className="profile-details">
                  <strong>{businessName.length > 20 ? businessName.slice(0, 20) + "..." : businessName}</strong>
                  <small>{businessType || "Business account"}</small>
                </div>
                <FiChevronDown className={showProfileMenu ? "rotate-icon" : ""} />
              </button>
              {showProfileMenu && <>
                <div className="profile-backdrop" onClick={() => setShowProfileMenu(false)} />
                <div className="profile-dropdown">
                  <div className="profile-dropdown-head">
                    <div className="profile-image large">{businessLogo ? <img src={businessLogo} alt="" /> : <FiBriefcase />}</div>
                    <div><strong>{businessName}</strong><small>{businessType || "Business account"}</small></div>
                  </div>
                  <Link to="/dashboard" onClick={() => setShowProfileMenu(false)}><FiHome /> Dashboard</Link>
                  <Link to="/edit-business" onClick={() => setShowProfileMenu(false)}><FiEdit /> Edit business profile</Link>
                  <button onClick={handleLogout}><FiLogOut /> Sign out</button>
                </div>
              </>}
            </div>
          </div>
        </header>

        <div className="dashboard-inner">
          <section className="welcome-section">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /> BUSINESS COMMAND CENTER</div>
              <h1>Welcome back, <span>{businessName}</span></h1>
              <p>Your business overview, sales and inventory — all in one place.</p>
            </div>
            <div className="welcome-actions">
              <Link to="/reports" className="button button-secondary"><FiBarChart2 /> Reports</Link>
              <Link to="/billing-pos" className="button button-primary"><FiShoppingBag /> Open POS <FiArrowUpRight /></Link>
            </div>
          </section>

          <section className="hero-banner">
            <div className="hero-orb orb-one" /><div className="hero-orb orb-two" />
            <div className="hero-main">
              <div className="hero-label"><span className="hero-label-icon"><FiZap /></span> YOUR BUSINESS, AT A GLANCE</div>
              <h2>Make every sale<br /><span>count.</span></h2>
              <p>Keep track of your store's performance and make smarter decisions with your live business workspace.</p>
              <Link to="/billing-pos" className="hero-cta">Start a new sale <FiArrowRight /></Link>
            </div>
            <div className="hero-revenue">
              <div className="revenue-top"><span>REVENUE TODAY</span><span className="revenue-live"><i /> LIVE</span></div>
              <strong>{formatCurrency(dashboard.todaySales)}</strong>
              <div className="revenue-footer"><span><FiActivity /> Today's performance</span><span>Updated now</span></div>
              <div className="revenue-decoration"><div /><div /><div /><div /><div /><div /><div /><div /><div /><div /><div /><div /></div>
            </div>
          </section>

          <section className="stats-grid">
            {stats.map((stat) => (
              <Link to={stat.link} className={`metric-card ${stat.color}`} key={stat.label}>
                <div className="metric-top">
                  <div className="metric-icon">{stat.icon}</div>
                  <span className="metric-link"><FiArrowUpRight /></span>
                </div>
                <div className="metric-label">{stat.label}</div>
                <div className="metric-value">{stat.value}</div>
                <div className="metric-sub">{stat.sub}</div>
              </Link>
            ))}
          </section>

          <section className="main-grid">
            <div className="panel quick-panel">
              <div className="panel-header">
                <div><span className="panel-eyebrow">QUICK ACTIONS</span><h3>Jump into your workflow</h3></div>
                <span className="panel-header-note"><FiCommand /> Quick access</span>
              </div>
              <div className="quick-grid">
                <QuickAction to="/billing-pos" icon={<FiShoppingBag />} label="New sale" tone="lime" desc="Create an invoice" />
                <QuickAction to="/add-product" icon={<FiPlus />} label="Add product" tone="blue" desc="Add to inventory" />
                <QuickAction to="/products" icon={<FiBox />} label="Inventory" tone="purple" desc="Manage products" />
                <QuickAction to="/customers" icon={<FiUsers />} label="Customers" tone="pink" desc="Customer records" />
                <QuickAction to="/add-purchase" icon={<FiShoppingCart />} label="New purchase" tone="orange" desc="Record stock" />
                <QuickAction to="/suppliers" icon={<FiTruck />} label="Suppliers" tone="cyan" desc="Manage vendors" />
                <QuickAction to="/reports" icon={<FiBarChart2 />} label="Reports" tone="indigo" desc="View performance" />
                <QuickAction to="/sales" icon={<FiList />} label="Invoices" tone="blue" desc="Sales history" />
              </div>
            </div>

            <div className="panel inventory-panel">
              <div className="panel-header">
                <div><span className="panel-eyebrow">INVENTORY OVERVIEW</span><h3>Stock health</h3></div>
                <Link to="/products" className="panel-link">Manage <FiArrowRight /></Link>
              </div>
              <div className="inventory-summary">
                <div><strong>{dashboard.totalProducts || 0}</strong><span>Total products</span></div>
                <div className={`stock-status ${(dashboard.lowStock || 0) > 0 ? "warning" : "healthy"}`}>
                  {(dashboard.lowStock || 0) > 0 ? <FiAlertCircle /> : <FiCheckCircle />}
                  {(dashboard.lowStock || 0) > 0 ? "Needs attention" : "All healthy"}
                </div>
              </div>
              <div className="stock-progress"><span style={{ width: `${Math.min(100, Number(dashboard.totalProducts || 0) === 0 ? 0 : Math.max(0, 100 - (Number(dashboard.lowStock || 0) / Number(dashboard.totalProducts || 1)) * 100))}%` }} /></div>
              <div className="stock-row"><span><i className="stock-dot green" /> Healthy stock</span><strong>{Math.max(0, Number(dashboard.totalProducts || 0) - Number(dashboard.lowStock || 0))}</strong></div>
              <div className="stock-row"><span><i className="stock-dot red" /> Low stock</span><strong className="stock-danger">{dashboard.lowStock || 0}</strong></div>
              <Link to="/products" className="stock-action">Review inventory <FiArrowRight /></Link>
            </div>
          </section>

          <section className="panel sales-panel">
            <div className="panel-header sales-panel-header">
              <div><span className="panel-eyebrow">RECENT ACTIVITY</span><h3>Latest sales</h3></div>
              <div className="sales-panel-actions"><span className="recent-count"><FiActivity /> {recentSales.length} transactions</span><Link to="/sales" className="panel-link">View all <FiArrowRight /></Link></div>
            </div>
            {recentSales.length === 0 ? (
              <div className="empty-sales">
                <div className="empty-sales-icon"><FiShoppingBag /></div>
                <h4>No sales yet</h4>
                <p>Your latest transactions will appear here after your first sale.</p>
                <Link className="button button-primary" to="/billing-pos">Open POS <FiArrowRight /></Link>
              </div>
            ) : (
              <div className="sales-table-wrap">
                <table className="sales-table">
                  <thead><tr><th>Invoice</th><th>Customer</th><th>Items</th><th>Amount</th><th>Payment</th><th>Date</th><th /></tr></thead>
                  <tbody>{recentSales.map((sale, idx) => {
                    const paid = ["Paid", "paid"].includes(sale.payment_status);
                    const pending = ["Pending", "pending"].includes(sale.payment_status);
                    return <tr key={sale.id || idx}>
                      <td><strong className="invoice-number">#{sale.invoice_no || "0001"}</strong></td>
                      <td><div className="customer-cell"><div className="customer-avatar"><FiUser /></div><span>{sale.customer_phone || "Walk-in Customer"}</span></div></td>
                      <td><div className="item-cell"><strong>{sale.items?.length || 0} item{(sale.items?.length || 0) !== 1 ? "s" : ""}</strong>{sale.items?.length > 0 && <small>{sale.items[0]?.product_name}{sale.items.length > 1 ? ` +${sale.items.length - 1}` : ""}</small>}</div></td>
                      <td><strong className="amount-cell">{formatCurrency(sale.total_amount || 0)}</strong></td>
                      <td><span className={`status-pill ${paid ? "paid" : pending ? "pending" : "failed"}`}>{paid ? <FiCheckCircle /> : pending ? <FiClock /> : <FiXCircle />}{sale.payment_status || "Paid"}</span></td>
                      <td className="date-cell">{formatDate(sale.created_at)}</td>
                      <td><button className="row-menu" title="More"><FiMoreHorizontal /></button></td>
                    </tr>;
                  })}</tbody>
                </table>
              </div>
            )}
          </section>

          <section className="bottom-metrics">
            <Link to="/customers" className="bottom-metric"><div className="bottom-icon customers"><FiUsers /></div><div><span>Customers</span><strong>{dashboard.totalCustomers || 0}</strong><small>Registered customers</small></div><FiArrowUpRight className="bottom-arrow" /></Link>
            <Link to="/suppliers" className="bottom-metric"><div className="bottom-icon suppliers"><FiTruck /></div><div><span>Suppliers</span><strong>{dashboard.totalSuppliers || 0}</strong><small>Supplier records</small></div><FiArrowUpRight className="bottom-arrow" /></Link>
            <Link to="/sales" className="bottom-metric"><div className="bottom-icon sales"><FiCreditCard /></div><div><span>Lifetime sales</span><strong>{formatCurrency(dashboard.totalSales)}</strong><small>All-time sales value</small></div><FiArrowUpRight className="bottom-arrow" /></Link>
          </section>

          <footer className="dashboard-footer"><span>BusinessOS <b>•</b> Smart retail workspace</span><span><i className="stock-dot green" /> Connected</span></footer>
        </div>
      </main>
      <DashboardStyles />
    </div>
  );
}

function QuickAction({ to, icon, label, tone, desc }) {
  return <Link to={to} className={`quick-action ${tone}`}><span className="quick-icon">{icon}</span><span className="quick-copy"><strong>{label}</strong><small>{desc}</small></span><FiArrowUpRight className="quick-arrow" /></Link>;
}

function DashboardStyles() {
  return <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap');
    .businessos{--bg:#f6f7fb;--surface:#fff;--ink:#171923;--muted:#8a8e9d;--line:#e9ebf1;--sidebar:#10121a;--lime:#c8f31d;--purple:#7661ff;display:flex;min-height:100vh;background:var(--bg);color:var(--ink);font-family:'DM Sans',sans-serif}
    .businessos *{box-sizing:border-box}.businessos a{text-decoration:none;color:inherit}
    .dashboard-sidebar{width:250px;min-width:250px;height:100vh;position:sticky;top:0;background:var(--sidebar);color:#fff;padding:24px 16px 18px;display:flex;flex-direction:column;z-index:40;overflow-y:auto}
    .sidebar-brand{display:flex;align-items:center;gap:11px;padding:3px 9px 30px}.brand-icon{width:40px;height:40px;border-radius:13px;background:var(--lime);color:#111;display:grid;place-items:center;font-size:19px;box-shadow:0 8px 25px #c8f31d22}.sidebar-brand strong{display:block;font-family:'Plus Jakarta Sans';font-size:15px;letter-spacing:-.4px}.sidebar-brand small{display:block;color:#7f8595;font-size:9px;margin-top:4px}.mobile-close{display:none}
    .nav-group{margin-bottom:25px}.nav-heading{padding:0 12px 10px;color:#636979;font-size:9px;font-weight:800;letter-spacing:1.5px}.dashboard-sidebar nav{display:grid;gap:4px}.sidebar-link{height:43px;border-radius:11px;padding:0 12px;display:flex;align-items:center;gap:11px;color:#9298a8;font-size:11px;font-weight:600;position:relative;transition:.2s}.sidebar-link:hover{background:#ffffff0b;color:#fff;transform:translateX(2px)}.sidebar-link.active{background:var(--lime);color:#111;box-shadow:0 7px 20px #c8f31d18}.sidebar-link-icon{font-size:16px;display:grid;place-items:center}.sidebar-link kbd{margin-left:auto;border:1px solid #303542;color:#777d8d;border-radius:5px;padding:3px 5px;font-size:8px}.active-indicator{margin-left:auto;width:5px;height:5px;border-radius:50%;background:#111}
    .sidebar-bottom{margin-top:auto}.system-card{background:#191d27;border:1px solid #252b37;border-radius:12px;padding:12px}.system-status{display:flex;align-items:center;gap:7px;font-size:10px;font-weight:700}.pulse-dot{width:7px;height:7px;border-radius:50%;background:#59d58a;box-shadow:0 0 0 4px #59d58a12;display:inline-block}.system-card small{display:block;color:#777e8e;font-size:8px;margin:6px 0 0 14px}.sidebar-version{padding:16px 8px 0;color:#555b6b;font-size:8px;letter-spacing:1px;font-weight:800}.sidebar-version span{float:right;color:#73798a}
    .dashboard-content{min-width:0;flex:1}.dashboard-topbar{height:76px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;padding:0 34px;background:#ffffffaa;backdrop-filter:blur(15px);position:sticky;top:0;z-index:20}.topbar-title{display:flex;align-items:center;gap:10px;color:#9a9eaa;font-size:11px}.crumb-divider{color:#d2d5dd}.topbar-title strong{color:#343744}.topbar-right{display:flex;align-items:center;gap:9px}.time-chip,.refresh-btn,.business-profile{height:42px;border:1px solid var(--line);background:#fff;border-radius:12px}.time-chip{display:flex;align-items:center;gap:8px;padding:0 12px;color:#737887;font-size:10px}.time-chip .pulse-dot{width:6px;height:6px}.refresh-btn{width:42px;display:grid;place-items:center;color:#747989;cursor:pointer;transition:.2s}.refresh-btn:hover{color:#222;transform:translateY(-1px)}.refreshing svg{animation:spin .8s linear infinite}.profile-container{position:relative}.business-profile{display:flex;align-items:center;gap:9px;padding:4px 10px 4px 5px;min-width:190px;text-align:left;cursor:pointer}.profile-image{width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,#7865ff,#a394ff);color:#fff;display:grid;place-items:center;overflow:hidden}.profile-image img{width:100%;height:100%;object-fit:cover}.profile-details{flex:1;min-width:0}.profile-details strong,.profile-details small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.profile-details strong{font-size:10px}.profile-details small{font-size:8px;color:#999eaa;margin-top:2px}.business-profile>svg{color:#9297a4;font-size:13px;transition:.2s}.rotate-icon{transform:rotate(180deg)}.profile-backdrop{position:fixed;inset:0;z-index:30}.profile-dropdown{position:absolute;right:0;top:50px;width:260px;background:#fff;border:1px solid var(--line);box-shadow:0 25px 65px #10132220;border-radius:15px;padding:8px;z-index:35}.profile-dropdown-head{display:flex;gap:10px;align-items:center;padding:12px;border-bottom:1px solid var(--line);margin-bottom:5px}.profile-image.large{width:42px;height:42px;border-radius:12px}.profile-dropdown-head strong,.profile-dropdown-head small{display:block}.profile-dropdown-head strong{font-size:11px}.profile-dropdown-head small{color:var(--muted);font-size:9px;margin-top:3px}.profile-dropdown a,.profile-dropdown button{display:flex;align-items:center;gap:9px;width:100%;border:0;background:transparent;padding:10px;border-radius:9px;font-size:10px;color:#454956;cursor:pointer}.profile-dropdown a:hover{background:#f5f6f9}.profile-dropdown button{color:#dc4d5a}.profile-dropdown button:hover{background:#fff0f1}
    .dashboard-inner{max-width:1600px;margin:0 auto;padding:31px 34px 25px}.welcome-section{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:22px}.eyebrow,.panel-eyebrow{font-size:9px;letter-spacing:1.45px;font-weight:800;color:#969baa;display:flex;align-items:center;gap:7px}.eyebrow-line{width:17px;height:2px;border-radius:2px;background:var(--purple)}.welcome-section h1{font-family:'Plus Jakarta Sans';font-size:clamp(24px,2.7vw,36px);letter-spacing:-1.4px;line-height:1.15;margin:10px 0 7px;font-weight:800}.welcome-section h1 span{color:var(--purple)}.welcome-section p{font-size:11px;color:#858a98;margin:0}.welcome-actions{display:flex;gap:8px;flex-shrink:0}
    .button{height:42px;border-radius:11px;padding:0 14px;display:inline-flex;align-items:center;justify-content:center;gap:8px;font-size:10px;font-weight:800;transition:.2s;cursor:pointer;border:1px solid transparent}.button:hover{transform:translateY(-2px)}.button-primary{background:var(--lime);color:#111;border-color:var(--lime);box-shadow:0 7px 20px #c8f31d25}.button-secondary{background:#fff;border-color:var(--line);color:#444957}
    .hero-banner{min-height:245px;position:relative;overflow:hidden;border-radius:23px;padding:31px 34px;display:flex;align-items:center;justify-content:space-between;gap:25px;color:#fff;background:linear-gradient(115deg,#11141c 0%,#1a1e2a 57%,#28213f 100%);box-shadow:0 18px 40px #171a2815;margin-bottom:17px}.hero-orb{position:absolute;border-radius:50%;pointer-events:none}.orb-one{width:250px;height:250px;background:#7561ff20;right:2%;top:-100px;filter:blur(1px)}.orb-two{width:190px;height:190px;background:#c8f31d13;right:33%;bottom:-140px}.hero-main,.hero-revenue{position:relative;z-index:1}.hero-label{display:flex;align-items:center;gap:8px;color:#c8f31d;font-size:8px;font-weight:800;letter-spacing:1.5px}.hero-label-icon{width:23px;height:23px;background:#c8f31d18;border:1px solid #c8f31d30;border-radius:7px;display:grid;place-items:center}.hero-main h2{font-family:'Plus Jakarta Sans';font-size:clamp(27px,3vw,40px);line-height:1.05;letter-spacing:-1.4px;margin:14px 0 9px}.hero-main h2 span{color:var(--lime)}.hero-main p{max-width:450px;color:#b6bdcc;font-size:11px;line-height:1.7;margin:0}.hero-cta{display:inline-flex;align-items:center;gap:8px;margin-top:19px;padding:11px 14px;background:var(--lime);color:#111;border-radius:10px;font-size:9px;font-weight:800;transition:.2s}.hero-cta:hover{transform:translateY(-2px);box-shadow:0 8px 20px #c8f31d30}
    .hero-revenue{min-width:250px;padding:21px;border-radius:17px;background:#ffffff08;border:1px solid #ffffff12;backdrop-filter:blur(10px);overflow:hidden}.revenue-top{display:flex;justify-content:space-between;align-items:center;color:#9ca4b5;font-size:8px;letter-spacing:1.1px;font-weight:800}.revenue-live{display:flex;align-items:center;gap:5px;color:#6be39a;font-size:8px}.revenue-live i{width:5px;height:5px;border-radius:50%;background:#6be39a}.hero-revenue>strong{display:block;font-family:'Plus Jakarta Sans';font-size:30px;letter-spacing:-1px;margin:11px 0 16px}.revenue-footer{display:flex;justify-content:space-between;gap:8px;color:#b6bdcc;font-size:8px}.revenue-footer span{display:flex;align-items:center;gap:4px}.revenue-decoration{display:flex;align-items:flex-end;gap:5px;height:27px;margin-top:16px;opacity:.4}.revenue-decoration div{flex:1;border-radius:3px 3px 0 0;background:linear-gradient(#c8f31d,#7561ff);height:var(--h,50%)}.revenue-decoration div:nth-child(2n){height:65%}.revenue-decoration div:nth-child(3n){height:85%}.revenue-decoration div:nth-child(4n){height:45%}
    .stats-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:13px;margin-bottom:17px}.metric-card{background:#fff;border:1px solid var(--line);border-radius:17px;padding:17px;min-height:145px;transition:.22s;box-shadow:0 3px 16px #14182704}.metric-card:hover{transform:translateY(-4px);box-shadow:0 14px 30px #1518270d;border-color:#dfe2eb}.metric-top{display:flex;justify-content:space-between;align-items:center}.metric-icon{width:35px;height:35px;border-radius:11px;display:grid;place-items:center;font-size:16px}.metric-link{color:#b1b5c0;font-size:14px}.metric-label{font-size:9px;color:#878c9a;font-weight:700;margin-top:13px}.metric-value{font-family:'Plus Jakarta Sans';font-size:23px;font-weight:800;letter-spacing:-.7px;margin-top:3px;color:#171923}.metric-sub{font-size:8px;color:#a0a4af;margin-top:5px}.metric-card.green .metric-icon{background:#eaf8ce;color:#759700}.metric-card.purple .metric-icon{background:#eeeaff;color:#7862ff}.metric-card.blue .metric-icon{background:#e5f2ff;color:#2686ec}.metric-card.orange .metric-icon{background:#fff0df;color:#e88931}
    .main-grid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(280px,.8fr);gap:16px;margin-bottom:17px}.panel{background:#fff;border:1px solid var(--line);border-radius:18px;padding:20px;box-shadow:0 3px 16px #14182704;min-width:0}.panel-header{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:17px}.panel-header h3{font-family:'Plus Jakarta Sans';font-size:16px;letter-spacing:-.4px;margin:5px 0 0}.panel-header-note{display:flex;align-items:center;gap:5px;color:#a0a4af;font-size:8px;padding:6px 8px;border:1px solid var(--line);border-radius:8px}.panel-link{display:inline-flex;align-items:center;gap:5px;color:#7561f7;font-size:9px;font-weight:800}
    .quick-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}.quick-action{display:flex;align-items:center;gap:9px;min-height:68px;border:1px solid #eef0f4;border-radius:12px;padding:10px;position:relative;transition:.18s;background:#fbfcfe}.quick-action:hover{transform:translateY(-3px);border-color:#e0e3ec;background:#fff;box-shadow:0 10px 22px #11182708}.quick-icon{width:31px;height:31px;border-radius:9px;display:grid;place-items:center;font-size:15px;flex-shrink:0}.quick-copy{min-width:0}.quick-copy strong,.quick-copy small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.quick-copy strong{font-size:9px;color:#363a47}.quick-copy small{font-size:7px;color:#a0a4af;margin-top:3px}.quick-arrow{position:absolute;right:8px;top:8px;color:#b8bdc8;font-size:11px}.quick-action.lime .quick-icon{background:#f0facd;color:#7b9800}.quick-action.blue .quick-icon{background:#e9f3ff;color:#2b87ee}.quick-action.purple .quick-icon{background:#efedff;color:#7862ff}.quick-action.pink .quick-icon{background:#ffebf4;color:#e34c99}.quick-action.orange .quick-icon{background:#fff0df;color:#e68b30}.quick-action.cyan .quick-icon{background:#e4f9fb;color:#159eaa}.quick-action.indigo .quick-icon{background:#eaedff;color:#5265d8}
    .inventory-summary{display:flex;align-items:center;justify-content:space-between;gap:12px}.inventory-summary strong{display:block;font-family:'Plus Jakarta Sans';font-size:31px;letter-spacing:-1px}.inventory-summary span{display:block;color:#9297a4;font-size:9px;margin-top:3px}.stock-status{display:flex;align-items:center;gap:5px;border-radius:20px;padding:7px 9px;font-size:8px;font-weight:800}.stock-status.healthy{background:#e9f9f0;color:#17965e}.stock-status.warning{background:#fff3df;color:#c87d16}.stock-progress{height:7px;background:#f0f1f5;border-radius:20px;overflow:hidden;margin:17px 0}.stock-progress span{display:block;height:100%;border-radius:20px;background:linear-gradient(90deg,#c8f31d,#8bd12b);transition:width .5s}.stock-row{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-top:1px solid #f0f1f4;color:#747a88;font-size:9px}.stock-row span{display:flex;align-items:center;gap:7px}.stock-row strong{font-size:10px;color:#333744}.stock-danger{color:#e45560!important}.stock-dot{display:inline-block;width:6px;height:6px;border-radius:50%}.stock-dot.green{background:#51c87a}.stock-dot.red{background:#ef626c}.stock-action{display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding:11px;background:#f7f8fb;border-radius:10px;font-size:9px;font-weight:800;color:#424754}
    .sales-panel{margin-bottom:17px}.sales-panel-header{margin-bottom:9px}.sales-panel-actions{display:flex;align-items:center;gap:13px}.recent-count{display:flex;align-items:center;gap:5px;color:#999eaa;font-size:8px}.sales-table-wrap{width:100%;overflow-x:auto}.sales-table{width:100%;border-collapse:collapse;min-width:740px}.sales-table th{text-align:left;padding:11px 9px;border-bottom:1px solid var(--line);color:#a0a5b0;font-size:8px;letter-spacing:.7px;text-transform:uppercase}.sales-table td{padding:12px 9px;border-bottom:1px solid #f0f1f4;color:#4b505b;font-size:9px}.sales-table tbody tr:hover{background:#fafbfc}.invoice-number{color:#252a34}.customer-cell{display:flex;align-items:center;gap:7px}.customer-avatar{width:27px;height:27px;border-radius:8px;background:#efedff;color:#7561ff;display:grid;place-items:center;font-size:12px}.item-cell strong,.item-cell small{display:block}.item-cell strong{color:#343944}.item-cell small{color:#a0a5b0;margin-top:3px;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.amount-cell{color:#15985e}.date-cell{color:#8c919d!important;white-space:nowrap}.status-pill{display:inline-flex;align-items:center;gap:4px;border-radius:99px;padding:5px 7px;font-size:8px;font-weight:800}.status-pill.paid{color:#15985e;background:#e9f9f1}.status-pill.pending{color:#c57b10;background:#fff3dc}.status-pill.failed{color:#df4b57;background:#fff0f2}.row-menu{width:27px;height:27px;display:grid;place-items:center;border:0;border-radius:7px;color:#999eaa;background:transparent;cursor:pointer}.row-menu:hover{background:#f0f1f4;color:#444a56}
    .empty-sales{text-align:center;padding:34px 20px;color:#9297a4}.empty-sales-icon{width:44px;height:44px;border-radius:13px;background:#f1efff;color:#7561ff;display:grid;place-items:center;margin:0 auto 12px;font-size:18px}.empty-sales h4{margin:0;color:#343944;font-size:13px}.empty-sales p{font-size:10px;margin:7px 0 15px}.bottom-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.bottom-metric{display:flex;align-items:center;gap:12px;background:#fff;border:1px solid var(--line);border-radius:15px;padding:15px;transition:.2s}.bottom-metric:hover{transform:translateY(-3px);box-shadow:0 10px 25px #11182708}.bottom-icon{width:37px;height:37px;border-radius:11px;display:grid;place-items:center;font-size:16px}.bottom-icon.customers{background:#efedff;color:#7561ff}.bottom-icon.suppliers{background:#fff0df;color:#e68b30}.bottom-icon.sales{background:#e7f7ed;color:#18985e}.bottom-metric span,.bottom-metric strong,.bottom-metric small{display:block}.bottom-metric span{color:#878c99;font-size:8px}.bottom-metric strong{font-family:'Plus Jakarta Sans';font-size:17px;margin:2px 0}.bottom-metric small{color:#a0a4af;font-size:8px}.bottom-arrow{margin-left:auto;color:#b5bac5;font-size:13px}.dashboard-footer{display:flex;justify-content:space-between;align-items:center;padding:20px 2px 0;color:#a0a4af;font-size:8px}.dashboard-footer b{padding:0 4px}.dashboard-footer span:last-child{display:flex;align-items:center;gap:6px}
    .loading-screen,.error-screen{display:grid;place-items:center;min-height:100vh;width:100%;padding:20px}.loading-card,.error-card{background:#fff;border:1px solid var(--line);border-radius:20px;padding:35px;text-align:center;box-shadow:0 20px 60px #1118270a}.loading-logo{width:50px;height:50px;border-radius:15px;background:var(--lime);display:grid;place-items:center;margin:0 auto 15px;font-size:22px}.loader{width:25px;height:25px;border:3px solid #e8eaf0;border-top-color:#7661ff;border-radius:50%;animation:spin .8s linear infinite;margin:15px auto}.loading-card h3,.error-card h2{font-family:'Plus Jakarta Sans';margin:10px 0}.loading-card p,.error-card p{color:var(--muted);font-size:11px}.error-icon{width:45px;height:45px;background:#fff0f1;color:#e45560;border-radius:14px;display:grid;place-items:center;margin:0 auto 15px;font-size:20px}
    .mobile-menu-btn{display:none}.sidebar-overlay{display:none}
    @keyframes spin{to{transform:rotate(360deg)}}
    @media(max-width:1200px){.dashboard-inner{padding:26px 24px}.dashboard-topbar{padding:0 24px}.quick-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.hero-revenue{min-width:220px}.main-grid{grid-template-columns:minmax(0,1.35fr) minmax(260px,.8fr)}}
    @media(max-width:900px){.dashboard-sidebar{width:230px;min-width:230px}.dashboard-topbar{padding:0 18px}.dashboard-inner{padding:24px 18px}.stats-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.main-grid{grid-template-columns:1fr}.welcome-section{align-items:flex-start;flex-direction:column}.hero-banner{padding:26px}.hero-revenue{min-width:200px}.bottom-metrics{grid-template-columns:1fr}}
    @media(max-width:680px){.dashboard-sidebar{position:fixed;left:-270px;top:0;width:250px;min-width:250px;transition:left .25s;height:100vh}.dashboard-sidebar.sidebar-open{left:0}.sidebar-overlay{display:block;position:fixed;inset:0;background:#0c0e15a8;z-index:35}.mobile-close{display:block;margin-left:auto;border:0;background:transparent;color:#9aa0af;font-size:22px}.dashboard-topbar{height:65px;padding:0 14px}.mobile-menu-btn{display:grid;place-items:center;width:34px;height:34px;border:1px solid var(--line);background:#fff;border-radius:9px;color:#555;cursor:pointer}.topbar-title{font-size:10px}.topbar-right{gap:6px}.time-chip{display:none}.refresh-btn{width:35px;height:35px}.business-profile{min-width:0;height:35px;padding:3px}.profile-image{width:28px;height:28px}.profile-details{display:none}.business-profile>svg{font-size:12px}.dashboard-inner{padding:22px 13px}.welcome-section h1{font-size:25px}.welcome-section p{font-size:10px;line-height:1.6}.welcome-actions{width:100%}.welcome-actions .button{flex:1}.hero-banner{min-height:0;padding:23px;display:block}.hero-main h2{font-size:29px}.hero-main p{font-size:10px}.hero-revenue{margin-top:22px;min-width:0}.stats-grid{gap:9px}.metric-card{padding:13px;min-height:130px}.metric-value{font-size:20px}.metric-label{font-size:8px}.metric-sub{font-size:7px}.panel{padding:15px}.panel-header h3{font-size:14px}.quick-grid{gap:7px}.quick-action{min-height:60px;padding:8px;gap:7px}.quick-icon{width:27px;height:27px;font-size:13px}.quick-copy strong{font-size:8px}.quick-copy small{font-size:7px}.panel-header-note{display:none}.sales-panel-actions{gap:8px}.recent-count{display:none}.bottom-metrics{gap:8px}.bottom-metric{padding:12px}.dashboard-footer{font-size:7px}.profile-dropdown{right:0;width:250px}}
    @media(max-width:400px){.stats-grid{grid-template-columns:1fr 1fr}.welcome-actions .button{padding:0 10px;font-size:9px}.hero-main h2{font-size:26px}.quick-grid{grid-template-columns:1fr 1fr}}
  `}</style>;
}
