import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";
import {
  FiDollarSign,
  FiShoppingBag,
  FiShoppingCart,
  FiFolder,
  FiTrendingUp,
  FiUsers,
  FiTruck,
  FiAlertCircle,
  FiPackage,
  FiPlus,
  FiList,
  FiBarChart2,
  FiGrid,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiUser,
  FiEdit,
  FiLogOut,
  FiChevronDown,
  FiHome,
  FiBriefcase,
  FiZap,
  FiArrowUpRight,
  FiArrowRight,
  FiMoreHorizontal,
  FiActivity,
  FiBox,
  FiCreditCard,
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi";

export default function BusinessDashboard() {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  const [dashboard, setDashboard] = useState({
    totalProducts: 0,
    totalCategories: 0,
    todaySales: 0,
    monthSales: 0,
    totalCustomers: 0,
    totalSuppliers: 0,
    totalSales: 0,
    lowStock: 0,
  });

  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [businessName, setBusinessName] = useState("Your Store");
  const [businessType, setBusinessType] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [businessLogo, setBusinessLogo] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);

    try {
      setError("");
      await Promise.all([
        loadDashboard(),
        loadRecentSales(),
        loadBusinessInfo(),
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadBusinessInfo = async () => {
    const name = localStorage.getItem("businessName") || "Your Store";
    const type = localStorage.getItem("businessType") || "";
    setBusinessName(name);
    setBusinessType(type);

    try {
      const res = await API.get("/business/profile");
      if (res.data.business) {
        setBusinessLogo(res.data.business.logo || "");
        if (res.data.business.business_name) {
          setBusinessName(res.data.business.business_name);
        }
        if (res.data.business.business_type) {
          setBusinessType(res.data.business.business_type);
        }
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
      const salesData = res.data.data || [];
      setRecentSales(salesData.slice(0, 5));
    } catch (err) {
      console.error("Failed to load recent sales:", err);
      setRecentSales([]);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const formatCurrency = (amount) => {
    const value = Number(amount || 0);
    return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = () => {
    return new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="neo-dashboard neo-loading-screen">
        <div className="neo-loading-card">
          <div className="neo-loading-logo"><FiZap /></div>
          <div className="neo-loader" />
          <h3>Warming up your workspace</h3>
          <p>Fetching live business intelligence…</p>
        </div>
        <NeoStyles />
      </div>
    );
  }

  if (error) {
    return (
      <div className="neo-dashboard neo-loading-screen">
        <div className="neo-loading-card">
          <div className="neo-error-icon"><FiAlertCircle /></div>
          <span className="neo-eyebrow">WORKSPACE ERROR</span>
          <h2>Couldn't load your dashboard</h2>
          <p>{error}</p>
          <button className="neo-btn-primary" onClick={() => loadAll(true)}>
            <FiRefreshCw /> Try Again
          </button>
        </div>
        <NeoStyles />
      </div>
    );
  }

  const statCards = [
    {
      title: "Today's Revenue",
      value: formatCurrency(dashboard.todaySales),
      note: "Today's completed sales",
      icon: <FiDollarSign />,
      tone: "lime",
      to: "/sales",
    },
    {
      title: "Monthly Revenue",
      value: formatCurrency(dashboard.monthSales),
      note: "Current month",
      icon: <FiTrendingUp />,
      tone: "violet",
      to: "/reports",
    },
    {
      title: "Products",
      value: Number(dashboard.totalProducts || 0).toLocaleString("en-IN"),
      note: `${dashboard.lowStock || 0} low stock`,
      icon: <FiBox />,
      tone: "sky",
      to: "/products",
    },
    {
      title: "Customers",
      value: Number(dashboard.totalCustomers || 0).toLocaleString("en-IN"),
      note: "Customer records",
      icon: <FiUsers />,
      tone: "peach",
      to: "/customers",
    },
  ];

  const healthPct =
    Number(dashboard.totalProducts || 0) === 0
      ? 4
      : Math.min(
          100,
          Math.max(
            8,
            100 -
              (Number(dashboard.lowStock || 0) /
                Number(dashboard.totalProducts || 1)) *
                100
          )
        );

  return (
    <div className="neo-dashboard">
      {/* Floating Sidebar */}
      <aside className="neo-sidebar">
        <Link to="/dashboard" className="neo-brand">
          <span className="neo-brand-mark"><FiZap /></span>
          <span className="neo-brand-text">
            <strong>BusinessOS</strong>
            <small>Retail workspace</small>
          </span>
        </Link>

        <nav className="neo-nav">
          <p className="neo-nav-label">Workspace</p>
          <Link className="neo-nav-item is-active" to="/dashboard">
            <FiHome />
            <span>Overview</span>
          </Link>
          <Link className="neo-nav-item" to="/billing-pos">
            <FiShoppingBag />
            <span>Billing POS</span>
            <kbd>F2</kbd>
          </Link>
          <Link className="neo-nav-item" to="/products">
            <FiGrid />
            <span>Products</span>
          </Link>
          <Link className="neo-nav-item" to="/customers">
            <FiUsers />
            <span>Customers</span>
          </Link>
          <Link className="neo-nav-item" to="/suppliers">
            <FiTruck />
            <span>Suppliers</span>
          </Link>
          <Link className="neo-nav-item" to="/purchases">
            <FiShoppingCart />
            <span>Purchases</span>
          </Link>

          <p className="neo-nav-label neo-nav-gap">Insights</p>
          <Link className="neo-nav-item" to="/sales">
            <FiList />
            <span>Sales History</span>
          </Link>
          <Link className="neo-nav-item" to="/reports">
            <FiBarChart2 />
            <span>Reports</span>
          </Link>
          <Link className="neo-nav-item" to="/qr-orders">
            <FiCreditCard />
            <span>QR Orders</span>
          </Link>
          <Link className="neo-nav-item" to="/qr-ordering">
            <FiGrid />
            <span>QR Setup</span>
          </Link>
        </nav>

        <div className="neo-sidebar-footer">
          <div className="neo-pulse-card">
            <span className="neo-pulse-dot" />
            <div>
              <strong>All systems live</strong>
              <small>Connected & secure</small>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="neo-main">
        {/* Top bar */}
        <header className="neo-topbar">
          <div className="neo-mobile-brand">
            <span className="neo-brand-mark"><FiZap /></span>
            <strong>BusinessOS</strong>
          </div>

          <div className="neo-crumbs">
            <span>Workspace</span>
            <FiChevronDown />
            <strong>Overview</strong>
          </div>

          <div className="neo-topbar-actions">
            <span className="neo-live-chip">
              <i />
              <FiClock />
              {formatTime()}
            </span>

            <button
              className={`neo-icon-btn ${refreshing ? "is-spinning" : ""}`}
              title="Refresh dashboard"
              onClick={() => loadAll(true)}
            >
              <FiRefreshCw />
            </button>

            <div className="neo-profile-wrap">
              <button
                className="neo-profile-btn"
                onClick={() => setShowProfileMenu((v) => !v)}
              >
                <span className="neo-avatar">
                  {businessLogo ? (
                    <img src={businessLogo} alt="Business logo" />
                  ) : (
                    <FiBriefcase />
                  )}
                </span>
                <span className="neo-profile-copy">
                  <strong>
                    {businessName.length > 18
                      ? businessName.substring(0, 18) + "…"
                      : businessName}
                  </strong>
                  <small>{businessType || "Business"}</small>
                </span>
                <FiChevronDown
                  className={showProfileMenu ? "is-up" : ""}
                />
              </button>

              {showProfileMenu && (
                <>
                  <div
                    className="neo-menu-backdrop"
                    onClick={() => setShowProfileMenu(false)}
                  />
                  <div className="neo-profile-menu">
                    <div className="neo-menu-head">
                      <span className="neo-avatar-lg">
                        {businessLogo ? (
                          <img src={businessLogo} alt="Business logo" />
                        ) : (
                          <FiBriefcase />
                        )}
                      </span>
                      <div>
                        <strong>{businessName}</strong>
                        <small>{businessType || "Business Account"}</small>
                      </div>
                    </div>
                    <Link to="/dashboard" onClick={() => setShowProfileMenu(false)}>
                      <FiHome /> Dashboard
                    </Link>
                    <Link to="/edit-business" onClick={() => setShowProfileMenu(false)}>
                      <FiEdit /> Edit Business Profile
                    </Link>
                    <button onClick={handleLogout} className="neo-menu-danger">
                      <FiLogOut /> Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Hero greeting */}
        <section className="neo-hero-row">
          <div className="neo-hero-copy">
            <span className="neo-eyebrow">
              <i /> BUSINESS COMMAND CENTER
            </span>
            <h1>
              Good to see you, <span className="neo-accent">{businessName}</span>
            </h1>
            <p>Track sales, inventory and customers from one clean workspace.</p>
          </div>

          <div className="neo-hero-actions">
            <Link className="neo-btn-ghost" to="/reports">
              <FiBarChart2 /> Reports
            </Link>
            <Link className="neo-btn-primary" to="/billing-pos">
              <FiShoppingBag /> Open POS <FiArrowUpRight />
            </Link>
          </div>
        </section>

        {/* Bento: hero + stat tiles */}
        <section className="neo-bento">
          <div className="neo-hero-card">
            <div className="neo-orb neo-orb-a" />
            <div className="neo-orb neo-orb-b" />
            <div className="neo-orb neo-orb-c" />
            <div className="neo-hero-card-body">
              <span className="neo-hero-tag"><FiZap /> SMART BUSINESS</span>
              <h2>Everything you need to run today's store.</h2>
              <p>
                Your business activity is organised here so you can move from
                insight to action without extra clicks.
              </p>
              <Link to="/billing-pos" className="neo-hero-cta">
                Start Billing <FiArrowRight />
              </Link>
            </div>
            <div className="neo-hero-metric">
              <span className="neo-hero-metric-label">Today's revenue</span>
              <strong>{formatCurrency(dashboard.todaySales)}</strong>
              <div className="neo-hero-metric-foot">
                <span><FiActivity /> Live dashboard</span>
                <span>{Number(dashboard.todaySales || 0) > 0 ? "Active" : "Ready"}</span>
              </div>
            </div>
          </div>

          <div className="neo-stat-grid">
            {statCards.map((card) => (
              <Link to={card.to} className={`neo-stat neo-tone-${card.tone}`} key={card.title}>
                <span className="neo-stat-icon">{card.icon}</span>
                <span className="neo-stat-arrow"><FiArrowUpRight /></span>
                <span className="neo-stat-title">{card.title}</span>
                <strong className="neo-stat-value">{card.value}</strong>
                <span className="neo-stat-note">{card.note}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Quick actions + inventory health */}
        <section className="neo-two-col">
          <div className="neo-card">
            <header className="neo-card-head">
              <div>
                <span className="neo-eyebrow">FAST ACCESS</span>
                <h3>What do you want to do?</h3>
              </div>
              <span className="neo-hint">Built for speed</span>
            </header>

            <div className="neo-action-grid">
              <QuickAction to="/add-product" icon={<FiPlus />} label="Add Product" tone="sky" />
              <QuickAction to="/billing-pos" icon={<FiShoppingBag />} label="New Sale" tone="lime" />
              <QuickAction to="/products" icon={<FiGrid />} label="Manage Products" tone="violet" />
              <QuickAction to="/customers" icon={<FiUsers />} label="Customers" tone="pink" />
              <QuickAction to="/suppliers" icon={<FiTruck />} label="Suppliers" tone="peach" />
              <QuickAction to="/add-purchase" icon={<FiShoppingCart />} label="New Purchase" tone="mint" />
              <QuickAction to="/reports" icon={<FiBarChart2 />} label="Business Reports" tone="indigo" />
              <QuickAction to="/sales" icon={<FiList />} label="Invoices" tone="sky" />
              <QuickAction to="/qr-orders" icon={<FiCreditCard />} label="QR Orders" tone="violet" />
              <QuickAction to="/qr-ordering" icon={<FiGrid />} label="QR Ordering Setup" tone="mint" />
            </div>
          </div>

          <div className="neo-card">
            <header className="neo-card-head">
              <div>
                <span className="neo-eyebrow">INVENTORY</span>
                <h3>Store health</h3>
              </div>
              <Link to="/products" className="neo-text-link">
                View all <FiArrowRight />
              </Link>
            </header>

            <div className="neo-health-top">
              <div>
                <strong>{dashboard.totalProducts || 0}</strong>
                <span>Total products</span>
              </div>
              <span
                className={`neo-health-badge ${
                  (dashboard.lowStock || 0) > 0 ? "warn" : "good"
                }`}
              >
                {(dashboard.lowStock || 0) > 0 ? <FiAlertCircle /> : <FiCheckCircle />}
                {(dashboard.lowStock || 0) > 0 ? "Attention" : "Healthy"}
              </span>
            </div>

            <div className="neo-health-bar">
              <span style={{ width: `${healthPct}%` }} />
            </div>

            <div className="neo-health-row">
              <span><i className="neo-dot ok" /> Healthy stock</span>
              <strong>
                {Math.max(
                  0,
                  Number(dashboard.totalProducts || 0) - Number(dashboard.lowStock || 0)
                )}
              </strong>
            </div>
            <div className="neo-health-row">
              <span><i className="neo-dot bad" /> Low stock</span>
              <strong className="neo-danger">{dashboard.lowStock || 0}</strong>
            </div>

            <Link to="/products" className="neo-health-cta">
              Review inventory <FiArrowRight />
            </Link>
          </div>
        </section>

        {/* Recent sales */}
        <section className="neo-card neo-sales-card">
          <header className="neo-card-head">
            <div>
              <span className="neo-eyebrow">LIVE ACTIVITY</span>
              <h3>Recent sales</h3>
            </div>
            <div className="neo-head-right">
              <span className="neo-activity-chip">
                <FiActivity /> {recentSales.length} recent
              </span>
              <Link to="/sales" className="neo-text-link">
                View all <FiArrowRight />
              </Link>
            </div>
          </header>

          {recentSales.length === 0 ? (
            <div className="neo-empty">
              <span className="neo-empty-icon"><FiShoppingBag /></span>
              <h4>No sales yet</h4>
              <p>Start your first sale from the POS and it will appear here.</p>
              <Link className="neo-btn-primary neo-btn-sm" to="/billing-pos">
                Open Billing POS <FiArrowRight />
              </Link>
            </div>
          ) : (
            <div className="neo-table-wrap">
              <table className="neo-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map((sale, idx) => {
                    const paid =
                      sale.payment_status === "Paid" ||
                      sale.payment_status === "paid";
                    const pending =
                      sale.payment_status === "Pending" ||
                      sale.payment_status === "pending";

                    return (
                      <tr key={sale.id || idx}>
                        <td>
                          <strong className="neo-invoice">
                            #{sale.invoice_no || "0001"}
                          </strong>
                        </td>
                        <td>
                          <div className="neo-customer">
                            <span className="neo-customer-avatar"><FiUser /></span>
                            <span>{sale.customer_phone || "Walk-in Customer"}</span>
                          </div>
                        </td>
                        <td>
                          <div className="neo-item-cell">
                            <strong>
                              {sale.items?.length || 0} item
                              {(sale.items?.length || 0) !== 1 ? "s" : ""}
                            </strong>
                            {sale.items?.length > 0 && (
                              <small>
                                {sale.items
                                  .slice(0, 1)
                                  .map((item) => item.product_name)
                                  .join(", ")}
                                {sale.items.length > 1
                                  ? ` +${sale.items.length - 1}`
                                  : ""}
                              </small>
                            )}
                          </div>
                        </td>
                        <td>
                          <strong className="neo-amount">
                            {formatCurrency(sale.total_amount || 0)}
                          </strong>
                        </td>
                        <td>
                          <span
                            className={`neo-status ${
                              paid ? "paid" : pending ? "pending" : "failed"
                            }`}
                          >
                            {paid ? (
                              <FiCheckCircle />
                            ) : pending ? (
                              <FiClock />
                            ) : (
                              <FiXCircle />
                            )}
                            {sale.payment_status || "Paid"}
                          </span>
                        </td>
                        <td className="neo-date">{formatDate(sale.created_at)}</td>
                        <td>
                          <button className="neo-row-menu" title="More">
                            <FiMoreHorizontal />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Bottom mini cards */}
        <section className="neo-bottom-grid">
          <div className="neo-mini">
            <span className="neo-mini-icon violet"><FiUsers /></span>
            <div>
              <span>Customers</span>
              <strong>{dashboard.totalCustomers || 0}</strong>
              <small>Registered customers</small>
            </div>
            <Link to="/customers" className="neo-mini-arrow"><FiArrowUpRight /></Link>
          </div>

          <div className="neo-mini">
            <span className="neo-mini-icon mint"><FiTruck /></span>
            <div>
              <span>Suppliers</span>
              <strong>{dashboard.totalSuppliers || 0}</strong>
              <small>Supplier records</small>
            </div>
            <Link to="/suppliers" className="neo-mini-arrow"><FiArrowUpRight /></Link>
          </div>

          <div className="neo-mini">
            <span className="neo-mini-icon lime"><FiCreditCard /></span>
            <div>
              <span>Total Sales</span>
              <strong>{formatCurrency(dashboard.totalSales)}</strong>
              <small>All-time sales value</small>
            </div>
            <Link to="/sales" className="neo-mini-arrow"><FiArrowUpRight /></Link>
          </div>
        </section>

        <footer className="neo-footer">
          <span>BusinessOS · Smart retail workspace</span>
          <span><i className="neo-dot ok" /> Connected</span>
        </footer>
      </main>

      <NeoStyles />
    </div>
  );
}

function QuickAction({ to, icon, label, tone }) {
  return (
    <Link to={to} className={`neo-quick neo-tone-${tone}`}>
      <span className="neo-quick-icon">{icon}</span>
      <span className="neo-quick-label">{label}</span>
      <FiArrowUpRight className="neo-quick-arrow" />
    </Link>
  );
}

function NeoStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@600;700;800&display=swap');

      .neo-dashboard {
        --bg: #f4f2ee;
        --bg-alt: #efede7;
        --surface: #ffffff;
        --surface-2: #faf9f6;
        --ink: #0e1014;
        --ink-soft: #4b4f58;
        --muted: #8b8f99;
        --line: #ecebe5;
        --line-strong: #dfdcd2;
        --dark: #101219;
        --dark-2: #171a24;
        --lime: #c9f63a;
        --lime-ink: #1c2500;
        --violet: #7b5bff;
        --sky: #2f8dff;
        --peach: #ff9448;
        --pink: #f45ba6;
        --mint: #1ec6b6;
        --indigo: #5a63e8;
        --danger: #e5484d;
        --ok: #2fbb6b;
        --radius-lg: 26px;
        --radius-md: 18px;
        --radius-sm: 12px;
        --shadow-soft: 0 2px 4px rgba(20,20,30,.03), 0 22px 48px rgba(30,30,50,.05);
        --shadow-hero: 0 26px 60px rgba(20,20,40,.16);

        min-height: 100vh;
        background:
          radial-gradient(1200px 600px at 90% -10%, rgba(123,91,255,.06), transparent 60%),
          radial-gradient(900px 500px at -10% 40%, rgba(201,246,58,.05), transparent 60%),
          var(--bg);
        color: var(--ink);
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        display: flex;
        -webkit-font-smoothing: antialiased;
      }

      .neo-dashboard a { color: inherit; text-decoration: none; }
      .neo-dashboard * { box-sizing: border-box; }

      /* ============ SIDEBAR ============ */
      .neo-sidebar {
        width: 258px;
        min-width: 258px;
        margin: 14px 0 14px 14px;
        padding: 22px 14px;
        background: var(--dark);
        border-radius: var(--radius-lg);
        color: #fff;
        display: flex;
        flex-direction: column;
        gap: 8px;
        position: sticky;
        top: 14px;
        height: calc(100vh - 28px);
        overflow-y: auto;
        scrollbar-width: thin;
        z-index: 40;
        box-shadow: 0 30px 60px rgba(15,18,30,.18);
      }

      .neo-brand {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 6px 8px 20px;
      }

      .neo-brand-mark {
        width: 40px;
        height: 40px;
        display: grid;
        place-items: center;
        border-radius: 14px;
        background: linear-gradient(135deg, var(--lime), #a8d921);
        color: var(--lime-ink);
        font-size: 20px;
        box-shadow: 0 12px 28px rgba(201,246,58,.22);
      }

      .neo-brand-text strong {
        display: block;
        font-family: 'Sora', sans-serif;
        font-size: 15px;
        letter-spacing: -.2px;
      }
      .neo-brand-text small {
        display: block;
        color: #7a8090;
        font-size: 10px;
        margin-top: 2px;
      }

      .neo-nav { display: flex; flex-direction: column; gap: 3px; }

      .neo-nav-label {
        color: #5f6577;
        font-size: 10px;
        letter-spacing: 1.6px;
        font-weight: 700;
        margin: 8px 10px 6px;
        text-transform: uppercase;
      }
      .neo-nav-gap { margin-top: 22px; }

      .neo-nav-item {
        display: flex;
        align-items: center;
        gap: 11px;
        min-height: 42px;
        padding: 0 12px;
        border-radius: 12px;
        color: #9aa0af;
        font-size: 13px;
        font-weight: 500;
        transition: all .18s ease;
      }
      .neo-nav-item svg { font-size: 17px; flex-shrink: 0; }
      .neo-nav-item span { flex: 1; }
      .neo-nav-item kbd {
        font-size: 9px;
        color: #636a7c;
        border: 1px solid #2b3140;
        padding: 2px 5px;
        border-radius: 5px;
        font-family: inherit;
      }
      .neo-nav-item:hover {
        color: #fff;
        background: rgba(255,255,255,.05);
      }
      .neo-nav-item.is-active {
        color: var(--lime-ink);
        background: linear-gradient(135deg, var(--lime), #b7e42d);
        font-weight: 600;
        box-shadow: 0 10px 22px rgba(201,246,58,.18);
      }
      .neo-nav-item.is-active kbd {
        color: rgba(28,37,0,.6);
        border-color: rgba(28,37,0,.2);
      }

      .neo-sidebar-footer { margin-top: auto; padding-top: 14px; }

      .neo-pulse-card {
        display: flex;
        align-items: center;
        gap: 11px;
        padding: 13px;
        border-radius: 14px;
        background: var(--dark-2);
        border: 1px solid #222838;
      }
      .neo-pulse-card strong {
        display: block;
        font-size: 11px;
        color: #fff;
      }
      .neo-pulse-card small {
        display: block;
        color: #7a8090;
        font-size: 9.5px;
        margin-top: 2px;
      }
      .neo-pulse-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #4ade80;
        box-shadow: 0 0 0 5px rgba(74,222,128,.10);
        animation: neo-pulse 2s ease-in-out infinite;
      }
      @keyframes neo-pulse {
        0%,100% { box-shadow: 0 0 0 5px rgba(74,222,128,.10); }
        50%     { box-shadow: 0 0 0 7px rgba(74,222,128,.04); }
      }

      /* ============ MAIN ============ */
      .neo-main {
        flex: 1;
        min-width: 0;
        padding: 0 32px 26px;
        display: flex;
        flex-direction: column;
      }

      /* Topbar */
      .neo-topbar {
        min-height: 82px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        padding: 10px 0;
        margin-bottom: 22px;
        border-bottom: 1px solid var(--line);
      }
      .neo-mobile-brand { display: none; align-items: center; gap: 9px; font-family: 'Sora', sans-serif; font-size: 14px; }
      .neo-mobile-brand .neo-brand-mark { width: 34px; height: 34px; font-size: 16px; border-radius: 11px; }

      .neo-crumbs {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--muted);
        font-size: 12px;
      }
      .neo-crumbs svg { font-size: 12px; }
      .neo-crumbs strong { color: var(--ink); }

      .neo-topbar-actions { display: flex; align-items: center; gap: 9px; }

      .neo-live-chip,
      .neo-icon-btn,
      .neo-profile-btn {
        height: 44px;
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: 14px;
      }

      .neo-live-chip {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0 13px;
        color: var(--ink-soft);
        font-size: 11.5px;
        font-weight: 500;
      }
      .neo-live-chip i {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--ok);
        box-shadow: 0 0 0 4px rgba(47,187,107,.1);
      }

      .neo-icon-btn {
        width: 44px;
        display: grid;
        place-items: center;
        color: var(--ink-soft);
        cursor: pointer;
        transition: all .18s ease;
      }
      .neo-icon-btn:hover { color: var(--ink); border-color: var(--line-strong); transform: translateY(-1px); }
      .neo-icon-btn.is-spinning svg { animation: neo-spin .8s linear infinite; }
      @keyframes neo-spin { to { transform: rotate(360deg); } }

      .neo-profile-wrap { position: relative; }

      .neo-profile-btn {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 4px 11px 4px 5px;
        cursor: pointer;
        min-width: 186px;
        text-align: left;
        transition: all .18s ease;
      }
      .neo-profile-btn:hover { border-color: var(--line-strong); }

      .neo-avatar {
        width: 34px;
        height: 34px;
        border-radius: 11px;
        display: grid;
        place-items: center;
        overflow: hidden;
        color: #fff;
        background: linear-gradient(135deg, var(--violet), #9b7bff);
        flex-shrink: 0;
      }
      .neo-avatar img, .neo-avatar-lg img { width: 100%; height: 100%; object-fit: cover; }

      .neo-profile-copy { flex: 1; min-width: 0; }
      .neo-profile-copy strong,
      .neo-profile-copy small {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .neo-profile-copy strong { font-size: 12px; font-weight: 600; }
      .neo-profile-copy small { font-size: 10.5px; color: var(--muted); margin-top: 1px; }

      .neo-profile-btn > svg {
        color: var(--muted);
        font-size: 14px;
        transition: transform .2s ease;
      }
      .neo-profile-btn > svg.is-up { transform: rotate(180deg); }

      .neo-menu-backdrop { position: fixed; inset: 0; z-index: 90; }

      .neo-profile-menu {
        position: absolute;
        top: 54px;
        right: 0;
        width: 280px;
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: 18px;
        box-shadow: 0 30px 80px rgba(15,18,30,.15);
        padding: 8px;
        z-index: 100;
        animation: neo-menu-in .18s ease;
      }
      @keyframes neo-menu-in {
        from { opacity: 0; transform: translateY(-6px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      .neo-menu-head {
        display: flex;
        align-items: center;
        gap: 11px;
        padding: 12px;
        border-bottom: 1px solid var(--line);
        margin-bottom: 6px;
      }
      .neo-avatar-lg {
        width: 42px;
        height: 42px;
        border-radius: 12px;
        display: grid;
        place-items: center;
        overflow: hidden;
        color: #fff;
        background: linear-gradient(135deg, var(--violet), #9b7bff);
        flex-shrink: 0;
      }
      .neo-menu-head strong { display: block; font-size: 12.5px; }
      .neo-menu-head small { display: block; color: var(--muted); font-size: 10.5px; margin-top: 2px; }

      .neo-profile-menu a,
      .neo-profile-menu button {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 10px;
        border: 0;
        background: transparent;
        padding: 10px 12px;
        border-radius: 10px;
        color: var(--ink-soft);
        font: inherit;
        font-size: 12.5px;
        cursor: pointer;
        text-align: left;
        transition: all .15s ease;
      }
      .neo-profile-menu a:hover { background: var(--surface-2); color: var(--ink); }
      .neo-menu-danger { color: var(--danger) !important; }
      .neo-menu-danger:hover { background: #fff1f2; }

      /* ============ HERO ROW ============ */
      .neo-hero-row {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 24px;
        margin-bottom: 22px;
      }

      .neo-eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: var(--muted);
        font-size: 10.5px;
        letter-spacing: 1.8px;
        font-weight: 700;
        text-transform: uppercase;
      }
      .neo-eyebrow i {
        width: 16px;
        height: 2px;
        border-radius: 4px;
        background: var(--violet);
      }

      .neo-hero-copy h1 {
        font-family: 'Sora', sans-serif;
        font-size: clamp(26px, 3.4vw, 40px);
        line-height: 1.1;
        letter-spacing: -1.6px;
        margin: 10px 0 8px;
        font-weight: 700;
      }
      .neo-accent {
        background: linear-gradient(120deg, var(--violet), #a78bff);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }
      .neo-hero-copy p { color: var(--ink-soft); font-size: 13.5px; margin: 0; }

      .neo-hero-actions { display: flex; gap: 10px; flex-shrink: 0; }

      /* Buttons */
      .neo-btn-primary,
      .neo-btn-ghost {
        min-height: 44px;
        padding: 0 16px;
        border-radius: 13px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-size: 12.5px;
        font-weight: 600;
        cursor: pointer;
        transition: all .2s ease;
        border: 1px solid transparent;
        text-decoration: none;
      }

      .neo-btn-primary {
        background: var(--lime);
        color: var(--lime-ink);
        box-shadow: 0 14px 28px rgba(201,246,58,.28);
      }
      .neo-btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 20px 32px rgba(201,246,58,.32);
      }

      .neo-btn-ghost {
        background: var(--surface);
        color: var(--ink);
        border-color: var(--line);
      }
      .neo-btn-ghost:hover {
        border-color: var(--line-strong);
        transform: translateY(-1px);
      }
      .neo-btn-sm { min-height: 38px; font-size: 11.5px; }

      /* ============ BENTO ============ */
      .neo-bento {
        display: grid;
        grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
        gap: 16px;
        margin-bottom: 16px;
      }

      /* Hero card */
      .neo-hero-card {
        position: relative;
        overflow: hidden;
        display: flex;
        justify-content: space-between;
        gap: 24px;
        padding: 32px;
        border-radius: var(--radius-lg);
        color: #fff;
        background:
          radial-gradient(800px 400px at 100% 0%, rgba(123,91,255,.4), transparent 55%),
          linear-gradient(135deg, #0e1014 0%, #1a1d29 100%);
        box-shadow: var(--shadow-hero);
        min-height: 280px;
      }

      .neo-orb {
        position: absolute;
        border-radius: 50%;
        filter: blur(2px);
        pointer-events: none;
      }
      .neo-orb-a {
        width: 220px; height: 220px;
        right: -60px; top: -80px;
        background: radial-gradient(circle, rgba(123,91,255,.5), transparent 70%);
      }
      .neo-orb-b {
        width: 180px; height: 180px;
        right: 20%; bottom: -100px;
        background: radial-gradient(circle, rgba(201,246,58,.28), transparent 70%);
      }
      .neo-orb-c {
        width: 120px; height: 120px;
        left: -40px; bottom: -40px;
        background: radial-gradient(circle, rgba(47,141,255,.2), transparent 70%);
      }

      .neo-hero-card-body { position: relative; z-index: 1; max-width: 520px; }

      .neo-hero-tag {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--lime);
        font-size: 10.5px;
        letter-spacing: 1.6px;
        font-weight: 700;
        padding: 6px 10px;
        border-radius: 999px;
        background: rgba(201,246,58,.08);
        border: 1px solid rgba(201,246,58,.18);
      }

      .neo-hero-card-body h2 {
        font-family: 'Sora', sans-serif;
        font-size: clamp(22px, 2.6vw, 30px);
        font-weight: 700;
        line-height: 1.18;
        letter-spacing: -.9px;
        margin: 16px 0 10px;
        color: #fff;
      }
      .neo-hero-card-body p {
        color: #c4c8d4;
        font-size: 13px;
        line-height: 1.65;
        margin: 0 0 20px;
        max-width: 460px;
      }

      .neo-hero-cta {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 11px 18px;
        border-radius: 12px;
        background: var(--lime);
        color: var(--lime-ink);
        font-size: 12.5px;
        font-weight: 700;
        box-shadow: 0 14px 28px rgba(201,246,58,.24);
        transition: all .2s ease;
      }
      .neo-hero-cta:hover {
        transform: translateY(-2px);
        box-shadow: 0 20px 34px rgba(201,246,58,.30);
      }

      .neo-hero-metric {
        position: relative;
        z-index: 1;
        align-self: center;
        min-width: 200px;
        padding: 20px;
        border-radius: 18px;
        background: rgba(255,255,255,.05);
        border: 1px solid rgba(255,255,255,.09);
        backdrop-filter: blur(12px);
      }
      .neo-hero-metric-label {
        color: #a8aebd;
        font-size: 10.5px;
        letter-spacing: 1.4px;
        font-weight: 600;
        text-transform: uppercase;
      }
      .neo-hero-metric strong {
        display: block;
        font-family: 'Sora', sans-serif;
        font-size: 26px;
        font-weight: 700;
        margin: 8px 0 14px;
        letter-spacing: -.5px;
      }
      .neo-hero-metric-foot {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        color: #c4c8d4;
        font-size: 10.5px;
        padding-top: 10px;
        border-top: 1px solid rgba(255,255,255,.08);
      }
      .neo-hero-metric-foot span { display: flex; align-items: center; gap: 5px; }

      /* Stat grid */
      .neo-stat-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
        align-content: stretch;
      }

      .neo-stat {
        position: relative;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        gap: 5px;
        padding: 20px;
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        transition: all .22s ease;
        min-height: 140px;
      }
      .neo-stat:hover {
        transform: translateY(-3px);
        border-color: var(--line-strong);
        box-shadow: var(--shadow-soft);
      }
      .neo-stat::after {
        content: "";
        position: absolute;
        width: 110px;
        height: 110px;
        border-radius: 50%;
        right: -60px;
        bottom: -60px;
        background: currentColor;
        opacity: .05;
      }

      .neo-stat-icon {
        width: 38px;
        height: 38px;
        display: grid;
        place-items: center;
        border-radius: 12px;
        font-size: 17px;
        margin-bottom: 8px;
      }
      .neo-stat-arrow {
        position: absolute;
        top: 18px;
        right: 18px;
        color: var(--muted);
        font-size: 15px;
      }
      .neo-stat-title {
        color: var(--muted);
        font-size: 11.5px;
        font-weight: 500;
      }
      .neo-stat-value {
        font-family: 'Sora', sans-serif;
        font-size: 22px;
        font-weight: 700;
        color: var(--ink);
        letter-spacing: -.6px;
        line-height: 1.1;
      }
      .neo-stat-note { color: var(--muted); font-size: 10.5px; margin-top: 2px; }

      .neo-tone-lime { color: #6b8b00; }
      .neo-tone-lime .neo-stat-icon { background: #eef9c9; color: #6b8b00; }
      .neo-tone-violet { color: var(--violet); }
      .neo-tone-violet .neo-stat-icon { background: #ede9ff; color: var(--violet); }
      .neo-tone-sky { color: var(--sky); }
      .neo-tone-sky .neo-stat-icon { background: #e6f1ff; color: var(--sky); }
      .neo-tone-peach { color: var(--peach); }
      .neo-tone-peach .neo-stat-icon { background: #ffeedd; color: var(--peach); }
      .neo-tone-pink { color: var(--pink); }
      .neo-tone-pink .neo-stat-icon { background: #ffe6f1; color: var(--pink); }
      .neo-tone-mint { color: var(--mint); }
      .neo-tone-mint .neo-stat-icon { background: #ddfaf6; color: var(--mint); }
      .neo-tone-indigo { color: var(--indigo); }
      .neo-tone-indigo .neo-stat-icon { background: #e7e9ff; color: var(--indigo); }

      /* ============ TWO-COL ============ */
      .neo-two-col {
        display: grid;
        grid-template-columns: minmax(0, 1.55fr) minmax(300px, .8fr);
        gap: 16px;
        margin-bottom: 16px;
      }

      .neo-card {
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: var(--radius-lg);
        padding: 24px;
        box-shadow: var(--shadow-soft);
        min-width: 0;
      }

      .neo-card-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 14px;
        margin-bottom: 20px;
      }
      .neo-card-head h3 {
        font-family: 'Sora', sans-serif;
        font-size: 17px;
        font-weight: 700;
        margin: 6px 0 0;
        letter-spacing: -.4px;
      }

      .neo-hint {
        color: var(--muted);
        font-size: 10.5px;
        padding: 6px 10px;
        border: 1px solid var(--line);
        border-radius: 9px;
        white-space: nowrap;
      }

      .neo-text-link {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        color: var(--violet);
        font-size: 11.5px;
        font-weight: 600;
        white-space: nowrap;
      }
      .neo-text-link:hover { color: #5c3ce0; }

      /* Quick actions */
      .neo-action-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 10px;
      }

      .neo-quick {
        position: relative;
        min-height: 86px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 8px;
        padding: 14px;
        border: 1px solid var(--line);
        border-radius: 14px;
        background: var(--surface-2);
        transition: all .2s ease;
      }
      .neo-quick:hover {
        transform: translateY(-3px);
        background: var(--surface);
        border-color: var(--line-strong);
        box-shadow: 0 14px 28px rgba(20,20,40,.06);
      }

      .neo-quick-icon {
        width: 30px;
        height: 30px;
        display: grid;
        place-items: center;
        border-radius: 9px;
        font-size: 15px;
        background: currentColor;
        color: inherit;
      }
      .neo-quick-icon svg { color: currentColor; }
      .neo-quick-label {
        color: var(--ink);
        font-size: 11.5px;
        font-weight: 600;
        line-height: 1.25;
      }
      .neo-quick-arrow {
        position: absolute;
        top: 12px;
        right: 12px;
        color: var(--muted);
        font-size: 12px;
        opacity: 0;
        transform: translate(-3px, 3px);
        transition: all .2s ease;
      }
      .neo-quick:hover .neo-quick-arrow { opacity: 1; transform: translate(0,0); }

      .neo-quick.neo-tone-lime .neo-quick-icon { background: #eef9c9; color: #6b8b00; }
      .neo-quick.neo-tone-violet .neo-quick-icon { background: #ede9ff; color: var(--violet); }
      .neo-quick.neo-tone-sky .neo-quick-icon { background: #e6f1ff; color: var(--sky); }
      .neo-quick.neo-tone-peach .neo-quick-icon { background: #ffeedd; color: var(--peach); }
      .neo-quick.neo-tone-pink .neo-quick-icon { background: #ffe6f1; color: var(--pink); }
      .neo-quick.neo-tone-mint .neo-quick-icon { background: #ddfaf6; color: var(--mint); }
      .neo-quick.neo-tone-indigo .neo-quick-icon { background: #e7e9ff; color: var(--indigo); }

      /* Health */
      .neo-health-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
      }
      .neo-health-top strong {
        display: block;
        font-family: 'Sora', sans-serif;
        font-size: 32px;
        font-weight: 700;
        letter-spacing: -.8px;
      }
      .neo-health-top span { color: var(--muted); font-size: 11.5px; }

      .neo-health-badge {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 7px 11px;
        border-radius: 999px;
        font-size: 10.5px;
        font-weight: 600;
      }
      .neo-health-badge.good { color: var(--ok); background: #e9f9f1; }
      .neo-health-badge.warn { color: #c47a10; background: #fff4dd; }

      .neo-health-bar {
        height: 8px;
        background: var(--bg-alt);
        border-radius: 99px;
        overflow: hidden;
        margin: 20px 0;
      }
      .neo-health-bar span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, var(--lime), #7ed321);
        transition: width .4s ease;
      }

      .neo-health-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 11px 0;
        border-top: 1px solid var(--line);
        color: var(--ink-soft);
        font-size: 11.5px;
      }
      .neo-health-row span { display: flex; align-items: center; gap: 7px; }
      .neo-health-row strong { color: var(--ink); font-weight: 600; font-size: 12.5px; }
      .neo-danger { color: var(--danger) !important; }

      .neo-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        display: inline-block;
      }
      .neo-dot.ok { background: var(--ok); }
      .neo-dot.bad { background: var(--danger); }

      .neo-health-cta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 14px;
        min-height: 40px;
        padding: 0 14px;
        border-radius: 11px;
        background: var(--surface-2);
        color: var(--ink);
        font-size: 11.5px;
        font-weight: 600;
        transition: all .18s ease;
      }
      .neo-health-cta:hover { background: var(--bg-alt); }

      /* ============ SALES TABLE ============ */
      .neo-sales-card { margin-bottom: 16px; }
      .neo-head-right { display: flex; align-items: center; gap: 14px; }
      .neo-activity-chip {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        color: var(--muted);
        font-size: 10.5px;
      }

      .neo-table-wrap { width: 100%; overflow-x: auto; }
      .neo-table { width: 100%; border-collapse: collapse; min-width: 760px; }
      .neo-table th {
        text-align: left;
        padding: 12px 10px;
        color: var(--muted);
        font-size: 10px;
        letter-spacing: 1px;
        text-transform: uppercase;
        font-weight: 600;
        border-bottom: 1px solid var(--line);
      }
      .neo-table td {
        padding: 14px 10px;
        border-bottom: 1px solid var(--line);
        font-size: 12px;
        color: var(--ink-soft);
      }
      .neo-table tbody tr { transition: background .15s ease; }
      .neo-table tbody tr:hover { background: var(--surface-2); }
      .neo-table tbody tr:last-child td { border-bottom: 0; }

      .neo-invoice { color: var(--ink); font-weight: 600; }
      .neo-customer { display: flex; align-items: center; gap: 9px; }
      .neo-customer-avatar {
        width: 30px;
        height: 30px;
        display: grid;
        place-items: center;
        border-radius: 9px;
        background: #ede9ff;
        color: var(--violet);
        font-size: 13px;
        flex-shrink: 0;
      }
      .neo-item-cell strong { display: block; color: var(--ink); font-weight: 500; }
      .neo-item-cell small {
        display: block;
        color: var(--muted);
        font-size: 10.5px;
        margin-top: 2px;
        max-width: 160px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .neo-amount { color: var(--ok); font-weight: 600; }
      .neo-date { color: var(--muted) !important; white-space: nowrap; font-size: 11.5px !important; }

      .neo-status {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 5px 9px;
        border-radius: 999px;
        font-size: 10.5px;
        font-weight: 600;
      }
      .neo-status.paid { color: var(--ok); background: #e9f9f1; }
      .neo-status.pending { color: #c47a10; background: #fff4dd; }
      .neo-status.failed { color: var(--danger); background: #ffeff0; }

      .neo-row-menu {
        width: 30px;
        height: 30px;
        display: grid;
        place-items: center;
        border: 0;
        border-radius: 8px;
        background: transparent;
        color: var(--muted);
        cursor: pointer;
        transition: all .15s ease;
      }
      .neo-row-menu:hover { background: var(--bg-alt); color: var(--ink); }

      .neo-empty {
        text-align: center;
        padding: 44px 20px 30px;
      }
      .neo-empty-icon {
        width: 52px;
        height: 52px;
        display: grid;
        place-items: center;
        margin: 0 auto 14px;
        border-radius: 15px;
        background: #ede9ff;
        color: var(--violet);
        font-size: 22px;
      }
      .neo-empty h4 {
        font-family: 'Sora', sans-serif;
        font-size: 15px;
        color: var(--ink);
        margin: 0 0 6px;
      }
      .neo-empty p { color: var(--muted); font-size: 12px; margin: 0 0 18px; }

      /* ============ BOTTOM GRID ============ */
      .neo-bottom-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
        margin-bottom: 16px;
      }

      .neo-mini {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 18px;
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-soft);
        position: relative;
        transition: all .22s ease;
      }
      .neo-mini:hover {
        transform: translateY(-3px);
        border-color: var(--line-strong);
        box-shadow: 0 22px 44px rgba(20,20,40,.08);
      }

      .neo-mini-icon {
        width: 40px;
        height: 40px;
        display: grid;
        place-items: center;
        border-radius: 12px;
        font-size: 17px;
        flex-shrink: 0;
      }
      .neo-mini-icon.violet { background: #ede9ff; color: var(--violet); }
      .neo-mini-icon.mint { background: #ddfaf6; color: var(--mint); }
      .neo-mini-icon.lime { background: #eef9c9; color: #6b8b00; }

      .neo-mini span { color: var(--muted); font-size: 11px; }
      .neo-mini strong {
        display: block;
        font-family: 'Sora', sans-serif;
        font-size: 18px;
        font-weight: 700;
        color: var(--ink);
        margin: 2px 0;
        letter-spacing: -.4px;
      }
      .neo-mini small { color: var(--muted); font-size: 10.5px; }

      .neo-mini-arrow {
        position: absolute;
        top: 14px;
        right: 14px;
        color: var(--muted);
        font-size: 14px;
        transition: all .2s ease;
      }
      .neo-mini:hover .neo-mini-arrow { color: var(--violet); transform: translate(2px,-2px); }

      /* ============ FOOTER ============ */
      .neo-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: var(--muted);
        font-size: 11px;
        padding: 16px 4px 0;
      }
      .neo-footer span:last-child { display: flex; align-items: center; gap: 6px; }

      /* ============ LOADING / ERROR ============ */
      .neo-loading-screen {
        width: 100%;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
      }

      .neo-loading-card {
        width: min(440px, 100%);
        padding: 40px 34px;
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: 24px;
        box-shadow: var(--shadow-soft);
        text-align: center;
      }

      .neo-loading-logo,
      .neo-error-icon {
        width: 58px;
        height: 58px;
        margin: 0 auto 18px;
        border-radius: 17px;
        display: grid;
        place-items: center;
        font-size: 25px;
      }
      .neo-loading-logo { background: var(--lime); color: var(--lime-ink); box-shadow: 0 16px 32px rgba(201,246,58,.24); }
      .neo-error-icon { background: #ffeff0; color: var(--danger); }

      .neo-loader {
        width: 26px;
        height: 26px;
        border: 3px solid var(--line);
        border-top-color: var(--violet);
        border-radius: 50%;
        animation: neo-spin .8s linear infinite;
        margin: 0 auto 18px;
      }

      .neo-loading-card h3,
      .neo-loading-card h2 {
        font-family: 'Sora', sans-serif;
        font-size: 17px;
        margin: 0 0 8px;
      }
      .neo-loading-card p {
        color: var(--muted);
        font-size: 12px;
        margin: 0;
        line-height: 1.6;
      }
      .neo-loading-card .neo-btn-primary { margin-top: 20px; }

      /* ============ RESPONSIVE ============ */
      @media (max-width: 1280px) {
        .neo-bento { grid-template-columns: 1fr; }
        .neo-hero-card { min-height: 240px; }
        .neo-stat-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      }

      @media (max-width: 1080px) {
        .neo-sidebar {
          width: 80px;
          min-width: 80px;
          padding: 22px 10px;
        }
        .neo-brand { justify-content: center; padding: 4px 0 20px; }
        .neo-brand-text,
        .neo-nav-label,
        .neo-nav-item span,
        .neo-nav-item kbd,
        .neo-pulse-card div { display: none; }
        .neo-nav-item { justify-content: center; padding: 0; }
        .neo-pulse-card { justify-content: center; padding: 12px 0; }
        .neo-hero-row { align-items: flex-start; flex-direction: column; }
      }

      @media (max-width: 900px) {
        .neo-main { padding: 0 20px 22px; }
        .neo-topbar { min-height: 72px; }
        .neo-crumbs { display: none; }
        .neo-mobile-brand { display: flex; }
        .neo-profile-copy { display: none; }
        .neo-profile-btn { min-width: auto; padding: 4px; }
        .neo-live-chip { display: none; }
        .neo-two-col { grid-template-columns: 1fr; }
        .neo-action-grid { grid-template-columns: repeat(3, 1fr); }
        .neo-bottom-grid { grid-template-columns: 1fr 1fr; }
        .neo-bottom-grid .neo-mini:last-child { grid-column: 1 / -1; }
      }

      @media (max-width: 700px) {
        .neo-stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .neo-hero-card { padding: 24px; flex-direction: column; }
        .neo-hero-metric { min-width: 0; width: 100%; }
      }

      @media (max-width: 620px) {
        .neo-sidebar { display: none; }
        .neo-main { padding: 0 14px 22px; }
        .neo-hero-copy h1 { font-size: 26px; }
        .neo-hero-actions { width: 100%; }
        .neo-hero-actions > * { flex: 1; }
        .neo-action-grid { grid-template-columns: repeat(2, 1fr); }
        .neo-bottom-grid { grid-template-columns: 1fr; }
        .neo-bottom-grid .neo-mini:last-child { grid-column: auto; }
        .neo-card { padding: 18px; border-radius: 20px; }
        .neo-hero-card { border-radius: 20px; }
        .neo-head-right .neo-activity-chip { display: none; }
        .neo-footer { flex-direction: column; align-items: flex-start; gap: 8px; }
      }
    `}</style>
  );
}