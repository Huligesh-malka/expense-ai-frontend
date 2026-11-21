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
      <div className="lux-shell lux-loading">
        <div className="lux-loading-card">
          <div className="lux-mark"><FiZap /></div>
          <div className="lux-spin" />
          <h3>Opening your workspace</h3>
          <p>Connecting to live business data…</p>
        </div>
        <PremiumStyles />
      </div>
    );
  }

  if (error) {
    return (
      <div className="lux-shell lux-loading">
        <div className="lux-loading-card">
          <div className="lux-mark lux-mark-danger"><FiAlertCircle /></div>
          <span className="lux-eyebrow">WORKSPACE ERROR</span>
          <h2>Couldn't load your dashboard</h2>
          <p>{error}</p>
          <button className="lux-btn-primary" onClick={() => loadAll(true)}>
            <FiRefreshCw /> Try Again
          </button>
        </div>
        <PremiumStyles />
      </div>
    );
  }

  const statCards = [
    {
      title: "Today's Revenue",
      value: formatCurrency(dashboard.todaySales),
      note: "Today's completed sales",
      icon: <FiDollarSign />,
      tone: "gold",
      to: "/sales",
    },
    {
      title: "Monthly Revenue",
      value: formatCurrency(dashboard.monthSales),
      note: "Current month",
      icon: <FiTrendingUp />,
      tone: "ink",
      to: "/reports",
    },
    {
      title: "Products",
      value: Number(dashboard.totalProducts || 0).toLocaleString("en-IN"),
      note: `${dashboard.lowStock || 0} low stock`,
      icon: <FiBox />,
      tone: "slate",
      to: "/products",
    },
    {
      title: "Customers",
      value: Number(dashboard.totalCustomers || 0).toLocaleString("en-IN"),
      note: "Customer records",
      icon: <FiUsers />,
      tone: "clay",
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
    <div className="lux-shell">
      {/* ---------- SIDEBAR ---------- */}
      <aside className="lux-sidebar">
        <Link to="/dashboard" className="lux-brand">
          <span className="lux-mark"><FiZap /></span>
          <span className="lux-brand-text">
            <strong>BusinessOS</strong>
            <small>Retail Terminal</small>
          </span>
        </Link>

        <nav className="lux-nav">
          <p className="lux-nav-label">Workspace</p>
          <Link className="lux-nav-item is-active" to="/dashboard">
            <FiHome />
            <span>Overview</span>
          </Link>
          <Link className="lux-nav-item" to="/billing-pos">
            <FiShoppingBag />
            <span>Billing POS</span>
            <kbd>F2</kbd>
          </Link>
          <Link className="lux-nav-item" to="/products">
            <FiGrid />
            <span>Products</span>
          </Link>
          <Link className="lux-nav-item" to="/customers">
            <FiUsers />
            <span>Customers</span>
          </Link>
          <Link className="lux-nav-item" to="/suppliers">
            <FiTruck />
            <span>Suppliers</span>
          </Link>
          <Link className="lux-nav-item" to="/purchases">
            <FiShoppingCart />
            <span>Purchases</span>
          </Link>

          <p className="lux-nav-label lux-nav-gap">Insights</p>
          <Link className="lux-nav-item" to="/sales">
            <FiList />
            <span>Sales History</span>
          </Link>
          <Link className="lux-nav-item" to="/reports">
            <FiBarChart2 />
            <span>Reports</span>
          </Link>
          <Link className="lux-nav-item" to="/qr-orders">
            <FiCreditCard />
            <span>QR Orders</span>
          </Link>
          <Link className="lux-nav-item" to="/qr-ordering">
            <FiGrid />
            <span>QR Setup</span>
          </Link>
        </nav>

        <div className="lux-sidebar-foot">
          <div className="lux-status">
            <span className="lux-status-dot" />
            <div>
              <strong>Systems live</strong>
              <small>Secure session</small>
            </div>
          </div>
        </div>
      </aside>

      {/* ---------- MAIN ---------- */}
      <main className="lux-main">
        {/* Topbar */}
        <header className="lux-topbar">
          <div className="lux-mobile-brand">
            <span className="lux-mark"><FiZap /></span>
            <strong>BusinessOS</strong>
          </div>

          <div className="lux-crumbs">
            <span>Workspace</span>
            <span className="lux-slash">/</span>
            <strong>Overview</strong>
          </div>

          <div className="lux-topbar-actions">
            <span className="lux-live-chip">
              <i />
              {formatTime()}
            </span>

            <button
              className={`lux-icon-btn ${refreshing ? "is-spinning" : ""}`}
              title="Refresh dashboard"
              onClick={() => loadAll(true)}
            >
              <FiRefreshCw />
            </button>

            <div className="lux-profile-wrap">
              <button
                className="lux-profile-btn"
                onClick={() => setShowProfileMenu((v) => !v)}
              >
                <span className="lux-avatar">
                  {businessLogo ? (
                    <img src={businessLogo} alt="Business logo" />
                  ) : (
                    <FiBriefcase />
                  )}
                </span>
                <span className="lux-profile-copy">
                  <strong>
                    {businessName.length > 18
                      ? businessName.substring(0, 18) + "…"
                      : businessName}
                  </strong>
                  <small>{businessType || "Business"}</small>
                </span>
                <FiChevronDown className={showProfileMenu ? "is-up" : ""} />
              </button>

              {showProfileMenu && (
                <>
                  <div
                    className="lux-menu-backdrop"
                    onClick={() => setShowProfileMenu(false)}
                  />
                  <div className="lux-profile-menu">
                    <div className="lux-menu-head">
                      <span className="lux-avatar-lg">
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
                    <button onClick={handleLogout} className="lux-menu-danger">
                      <FiLogOut /> Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Masthead */}
        <section className="lux-masthead">
          <div className="lux-masthead-copy">
            <span className="lux-eyebrow">
              <i /> {formatDate(new Date())} · COMMAND CENTER
            </span>
            <h1>
              Good to see you,{" "}
              <span className="lux-accent">{businessName}</span>
            </h1>
          </div>

          <div className="lux-masthead-actions">
            <Link className="lux-btn-ghost" to="/reports">
              <FiBarChart2 /> Reports
            </Link>
            <Link className="lux-btn-primary" to="/billing-pos">
              <FiShoppingBag /> Open POS <FiArrowUpRight />
            </Link>
          </div>
        </section>

        {/* Hero + Stats */}
        <section className="lux-grid-hero">
          <div className="lux-hero">
            <div className="lux-hero-grain" />
            <div className="lux-hero-ring lux-ring-a" />
            <div className="lux-hero-ring lux-ring-b" />

            <div className="lux-hero-inner">
              <div className="lux-hero-label">
                <span className="lux-dot-pulse" />
                LIVE · TODAY
              </div>

              <div className="lux-hero-value">
                {formatCurrency(dashboard.todaySales)}
              </div>
              <div className="lux-hero-suffix">
                today's revenue
              </div>

              <div className="lux-hero-foot">
                <div className="lux-hero-foot-item">
                  <FiActivity />
                  <div>
                    <strong>{Number(dashboard.todaySales || 0) > 0 ? "Active" : "Ready"}</strong>
                    <small>Session status</small>
                  </div>
                </div>
                <div className="lux-hero-foot-item">
                  <FiTrendingUp />
                  <div>
                    <strong>{formatCurrency(dashboard.monthSales)}</strong>
                    <small>this month</small>
                  </div>
                </div>
                <Link to="/billing-pos" className="lux-hero-cta">
                  Start Billing <FiArrowRight />
                </Link>
              </div>
            </div>
          </div>

          <div className="lux-stat-grid">
            {statCards.map((card) => (
              <Link
                to={card.to}
                className={`lux-stat lux-tone-${card.tone}`}
                key={card.title}
              >
                <span className="lux-stat-icon">{card.icon}</span>
                <span className="lux-stat-arrow"><FiArrowUpRight /></span>
                <span className="lux-stat-title">{card.title}</span>
                <strong className="lux-stat-value">{card.value}</strong>
                <span className="lux-stat-note">{card.note}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Quick actions + Store health */}
        <section className="lux-grid-two">
          <div className="lux-card">
            <header className="lux-card-head">
              <div>
                <span className="lux-eyebrow">SHORTCUTS</span>
                <h3>Move fast</h3>
              </div>
              <span className="lux-hint">10 actions</span>
            </header>

            <div className="lux-action-grid">
              <QuickAction to="/add-product" icon={<FiPlus />} label="Add Product" tone="gold" />
              <QuickAction to="/billing-pos" icon={<FiShoppingBag />} label="New Sale" tone="ink" />
              <QuickAction to="/products" icon={<FiGrid />} label="Manage Products" tone="slate" />
              <QuickAction to="/customers" icon={<FiUsers />} label="Customers" tone="clay" />
              <QuickAction to="/suppliers" icon={<FiTruck />} label="Suppliers" tone="sage" />
              <QuickAction to="/add-purchase" icon={<FiShoppingCart />} label="New Purchase" tone="gold" />
              <QuickAction to="/reports" icon={<FiBarChart2 />} label="Business Reports" tone="ink" />
              <QuickAction to="/sales" icon={<FiList />} label="Invoices" tone="slate" />
              <QuickAction to="/qr-orders" icon={<FiCreditCard />} label="QR Orders" tone="clay" />
              <QuickAction to="/qr-ordering" icon={<FiGrid />} label="QR Setup" tone="sage" />
            </div>
          </div>

          <div className="lux-card">
            <header className="lux-card-head">
              <div>
                <span className="lux-eyebrow">INVENTORY</span>
                <h3>Store health</h3>
              </div>
              <Link to="/products" className="lux-text-link">
                View all <FiArrowRight />
              </Link>
            </header>

            <div className="lux-health-top">
              <div>
                <strong>{dashboard.totalProducts || 0}</strong>
                <span>Total products</span>
              </div>
              <span
                className={`lux-health-badge ${
                  (dashboard.lowStock || 0) > 0 ? "warn" : "good"
                }`}
              >
                {(dashboard.lowStock || 0) > 0 ? (
                  <FiAlertCircle />
                ) : (
                  <FiCheckCircle />
                )}
                {(dashboard.lowStock || 0) > 0 ? "Attention" : "Healthy"}
              </span>
            </div>

            <div className="lux-health-bar">
              <span style={{ width: `${healthPct}%` }} />
            </div>

            <div className="lux-health-row">
              <span><i className="lux-dot ok" /> Healthy stock</span>
              <strong>
                {Math.max(
                  0,
                  Number(dashboard.totalProducts || 0) -
                    Number(dashboard.lowStock || 0)
                )}
              </strong>
            </div>
            <div className="lux-health-row">
              <span><i className="lux-dot bad" /> Low stock</span>
              <strong className="lux-danger">{dashboard.lowStock || 0}</strong>
            </div>

            <Link to="/products" className="lux-health-cta">
              Review inventory <FiArrowRight />
            </Link>
          </div>
        </section>

        {/* Recent sales */}
        <section className="lux-card lux-sales-card">
          <header className="lux-card-head">
            <div>
              <span className="lux-eyebrow">LIVE ACTIVITY</span>
              <h3>Recent sales</h3>
            </div>
            <div className="lux-head-right">
              <span className="lux-activity-chip">
                <FiActivity /> {recentSales.length} recent
              </span>
              <Link to="/sales" className="lux-text-link">
                View all <FiArrowRight />
              </Link>
            </div>
          </header>

          {recentSales.length === 0 ? (
            <div className="lux-empty">
              <span className="lux-empty-icon"><FiShoppingBag /></span>
              <h4>No sales yet</h4>
              <p>Start your first sale from the POS and it will appear here.</p>
              <Link className="lux-btn-primary lux-btn-sm" to="/billing-pos">
                Open Billing POS <FiArrowRight />
              </Link>
            </div>
          ) : (
            <div className="lux-table-wrap">
              <table className="lux-table">
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
                          <strong className="lux-invoice">
                            #{sale.invoice_no || "0001"}
                          </strong>
                        </td>
                        <td>
                          <div className="lux-customer">
                            <span className="lux-customer-avatar"><FiUser /></span>
                            <span>{sale.customer_phone || "Walk-in Customer"}</span>
                          </div>
                        </td>
                        <td>
                          <div className="lux-item-cell">
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
                          <strong className="lux-amount">
                            {formatCurrency(sale.total_amount || 0)}
                          </strong>
                        </td>
                        <td>
                          <span
                            className={`lux-status ${
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
                        <td className="lux-date">{formatDate(sale.created_at)}</td>
                        <td>
                          <button className="lux-row-menu" title="More">
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
        <section className="lux-grid-three">
          <div className="lux-mini">
            <span className="lux-mini-icon ink"><FiUsers /></span>
            <div>
              <span>Customers</span>
              <strong>{dashboard.totalCustomers || 0}</strong>
              <small>Registered customers</small>
            </div>
            <Link to="/customers" className="lux-mini-arrow">
              <FiArrowUpRight />
            </Link>
          </div>

          <div className="lux-mini">
            <span className="lux-mini-icon sage"><FiTruck /></span>
            <div>
              <span>Suppliers</span>
              <strong>{dashboard.totalSuppliers || 0}</strong>
              <small>Supplier records</small>
            </div>
            <Link to="/suppliers" className="lux-mini-arrow">
              <FiArrowUpRight />
            </Link>
          </div>

          <div className="lux-mini">
            <span className="lux-mini-icon gold"><FiCreditCard /></span>
            <div>
              <span>Total Sales</span>
              <strong>{formatCurrency(dashboard.totalSales)}</strong>
              <small>All-time sales value</small>
            </div>
            <Link to="/sales" className="lux-mini-arrow">
              <FiArrowUpRight />
            </Link>
          </div>
        </section>

        <footer className="lux-footer">
          <span>BusinessOS · Retail Terminal</span>
          <span><i className="lux-dot ok" /> Connected</span>
        </footer>
      </main>

      <PremiumStyles />
    </div>
  );
}

function QuickAction({ to, icon, label, tone }) {
  return (
    <Link to={to} className={`lux-quick lux-tone-${tone}`}>
      <span className="lux-quick-icon">{icon}</span>
      <span className="lux-quick-label">{label}</span>
      <FiArrowUpRight className="lux-quick-arrow" />
    </Link>
  );
}

function PremiumStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Geist:wght@400;500;600;700&display=swap');

      .lux-shell {
        --canvas: #efece5;
        --canvas-2: #e7e3d9;
        --paper: #fbf9f4;
        --paper-2: #f4f1ea;
        --ink: #0f0f0e;
        --ink-2: #1a1a18;
        --ink-soft: #3a3a36;
        --muted: #8a8780;
        --line: #ded9cd;
        --line-strong: #cdc6b6;
        --dark: #14140f;
        --dark-2: #1c1c17;
        --gold: #c9a24a;
        --gold-soft: #e6c987;
        --gold-bg: #f7edd4;
        --danger: #b63b3b;
        --ok: #3f7d4f;
        --radius-xl: 20px;
        --radius-lg: 16px;
        --radius-md: 12px;
        --shadow-1: 0 1px 0 rgba(20,20,15,.03), 0 8px 24px rgba(30,28,20,.06);
        --shadow-2: 0 1px 0 rgba(20,20,15,.03), 0 24px 48px rgba(30,28,20,.08);

        min-height: 100vh;
        background: var(--canvas);
        background-image:
          radial-gradient(1200px 600px at 100% -10%, rgba(201,162,74,.07), transparent 60%),
          radial-gradient(900px 500px at -10% 110%, rgba(20,20,15,.05), transparent 60%);
        color: var(--ink);
        font-family: 'Geist', system-ui, -apple-system, sans-serif;
        display: flex;
        -webkit-font-smoothing: antialiased;
        letter-spacing: -.005em;
      }

      .lux-shell a { color: inherit; text-decoration: none; }
      .lux-shell * { box-sizing: border-box; }

      /* ============ SIDEBAR ============ */
      .lux-sidebar {
        width: 252px;
        min-width: 252px;
        margin: 16px 0 16px 16px;
        padding: 24px 14px 18px;
        background: var(--dark);
        border-radius: var(--radius-xl);
        color: #efece5;
        display: flex;
        flex-direction: column;
        gap: 6px;
        position: sticky;
        top: 16px;
        height: calc(100vh - 32px);
        overflow-y: auto;
        scrollbar-width: thin;
        z-index: 40;
        box-shadow: 0 30px 60px rgba(20,20,15,.25);
        background-image:
          linear-gradient(180deg, rgba(201,162,74,.04), transparent 30%);
      }
      .lux-sidebar::after {
        content: "";
        position: absolute;
        inset: 1px;
        border-radius: inherit;
        border: 1px solid rgba(255,255,255,.04);
        pointer-events: none;
      }

      .lux-brand {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 4px 8px 22px;
        margin-bottom: 4px;
        border-bottom: 1px solid rgba(255,255,255,.06);
      }
      .lux-mark {
        width: 38px;
        height: 38px;
        display: grid;
        place-items: center;
        border-radius: 11px;
        background: linear-gradient(160deg, var(--gold-soft), var(--gold));
        color: #14140f;
        font-size: 17px;
        flex-shrink: 0;
        box-shadow: 0 8px 22px rgba(201,162,74,.25);
      }
      .lux-mark-danger {
        background: linear-gradient(160deg, #e88a8a, var(--danger));
        color: #fff;
        box-shadow: 0 8px 22px rgba(182,59,59,.25);
      }

      .lux-brand-text strong {
        display: block;
        font-family: 'Fraunces', Georgia, serif;
        font-size: 16px;
        letter-spacing: -.3px;
        font-weight: 600;
        color: #fbf9f4;
      }
      .lux-brand-text small {
        display: block;
        color: #8a8780;
        font-size: 10px;
        margin-top: 3px;
        letter-spacing: .3px;
      }

      .lux-nav { display: flex; flex-direction: column; gap: 2px; }

      .lux-nav-label {
        color: #6b6961;
        font-size: 9.5px;
        letter-spacing: 1.8px;
        font-weight: 600;
        margin: 12px 12px 6px;
        text-transform: uppercase;
      }
      .lux-nav-gap { margin-top: 22px; }

      .lux-nav-item {
        display: flex;
        align-items: center;
        gap: 11px;
        min-height: 40px;
        padding: 0 12px;
        border-radius: 10px;
        color: #b5b2a6;
        font-size: 13px;
        font-weight: 500;
        transition: all .2s ease;
        position: relative;
      }
      .lux-nav-item svg { font-size: 16px; flex-shrink: 0; }
      .lux-nav-item span { flex: 1; }
      .lux-nav-item kbd {
        font-size: 9px;
        color: #6b6961;
        border: 1px solid rgba(255,255,255,.08);
        padding: 2px 5px;
        border-radius: 4px;
        font-family: 'Geist', sans-serif;
      }
      .lux-nav-item:hover {
        color: #fbf9f4;
        background: rgba(255,255,255,.035);
      }
      .lux-nav-item.is-active {
        color: #fbf9f4;
        background: rgba(201,162,74,.08);
        font-weight: 600;
      }
      .lux-nav-item.is-active::before {
        content: "";
        position: absolute;
        left: -14px;
        top: 10px;
        bottom: 10px;
        width: 2px;
        border-radius: 4px;
        background: var(--gold);
      }
      .lux-nav-item.is-active svg { color: var(--gold); }
      .lux-nav-item.is-active kbd {
        color: var(--gold);
        border-color: rgba(201,162,74,.3);
      }

      .lux-sidebar-foot { margin-top: auto; padding-top: 16px; }

      .lux-status {
        display: flex;
        align-items: center;
        gap: 11px;
        padding: 12px;
        border-radius: 11px;
        background: rgba(255,255,255,.03);
        border: 1px solid rgba(255,255,255,.06);
      }
      .lux-status strong {
        display: block;
        font-size: 11px;
        color: #fbf9f4;
        font-weight: 600;
      }
      .lux-status small {
        display: block;
        color: #6b6961;
        font-size: 9.5px;
        margin-top: 2px;
      }
      .lux-status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #6fbf7c;
        box-shadow: 0 0 0 4px rgba(111,191,124,.12);
        animation: lux-pulse 2.4s ease-in-out infinite;
        flex-shrink: 0;
      }
      @keyframes lux-pulse {
        0%,100% { box-shadow: 0 0 0 4px rgba(111,191,124,.12); }
        50%     { box-shadow: 0 0 0 6px rgba(111,191,124,.04); }
      }

      /* ============ MAIN ============ */
      .lux-main {
        flex: 1;
        min-width: 0;
        padding: 0 32px 28px;
        display: flex;
        flex-direction: column;
      }

      /* Topbar */
      .lux-topbar {
        min-height: 84px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        padding: 12px 0;
        margin-bottom: 8px;
        border-bottom: 1px solid var(--line);
      }
      .lux-mobile-brand {
        display: none;
        align-items: center;
        gap: 9px;
        font-family: 'Fraunces', serif;
        font-size: 15px;
        font-weight: 600;
      }
      .lux-mobile-brand .lux-mark { width: 32px; height: 32px; font-size: 15px; border-radius: 9px; }

      .lux-crumbs {
        display: flex;
        align-items: center;
        gap: 10px;
        color: var(--muted);
        font-size: 12px;
        letter-spacing: .2px;
      }
      .lux-slash { color: var(--line-strong); }
      .lux-crumbs strong { color: var(--ink); font-weight: 600; }

      .lux-topbar-actions { display: flex; align-items: center; gap: 9px; }

      .lux-live-chip,
      .lux-icon-btn,
      .lux-profile-btn {
        height: 42px;
        background: var(--paper);
        border: 1px solid var(--line);
        border-radius: 11px;
      }

      .lux-live-chip {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0 14px;
        color: var(--ink-soft);
        font-size: 11.5px;
        font-weight: 500;
        font-variant-numeric: tabular-nums;
      }
      .lux-live-chip i {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--ok);
        box-shadow: 0 0 0 3px rgba(63,125,79,.15);
      }

      .lux-icon-btn {
        width: 42px;
        display: grid;
        place-items: center;
        color: var(--ink-soft);
        cursor: pointer;
        transition: all .2s ease;
      }
      .lux-icon-btn:hover {
        color: var(--ink);
        border-color: var(--line-strong);
        transform: translateY(-1px);
      }
      .lux-icon-btn.is-spinning svg { animation: lux-spin .8s linear infinite; }
      @keyframes lux-spin { to { transform: rotate(360deg); } }

      .lux-profile-wrap { position: relative; }

      .lux-profile-btn {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 4px 11px 4px 5px;
        cursor: pointer;
        min-width: 190px;
        text-align: left;
        transition: all .2s ease;
      }
      .lux-profile-btn:hover { border-color: var(--line-strong); }

      .lux-avatar {
        width: 32px;
        height: 32px;
        border-radius: 9px;
        display: grid;
        place-items: center;
        overflow: hidden;
        color: #fff;
        background: linear-gradient(160deg, #4a4a40, var(--ink));
        flex-shrink: 0;
        font-size: 14px;
      }
      .lux-avatar img,
      .lux-avatar-lg img {
        width: 100%; height: 100%; object-fit: cover;
      }

      .lux-profile-copy { flex: 1; min-width: 0; }
      .lux-profile-copy strong,
      .lux-profile-copy small {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .lux-profile-copy strong {
        font-size: 12px;
        font-weight: 600;
        color: var(--ink);
      }
      .lux-profile-copy small {
        font-size: 10.5px;
        color: var(--muted);
        margin-top: 1px;
      }

      .lux-profile-btn > svg {
        color: var(--muted);
        font-size: 13px;
        transition: transform .25s ease;
      }
      .lux-profile-btn > svg.is-up { transform: rotate(180deg); }

      .lux-menu-backdrop { position: fixed; inset: 0; z-index: 90; }

      .lux-profile-menu {
        position: absolute;
        top: 52px;
        right: 0;
        width: 280px;
        background: var(--paper);
        border: 1px solid var(--line);
        border-radius: 14px;
        box-shadow: 0 30px 80px rgba(20,20,15,.18);
        padding: 8px;
        z-index: 100;
        animation: lux-menu-in .2s ease;
      }
      @keyframes lux-menu-in {
        from { opacity: 0; transform: translateY(-6px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      .lux-menu-head {
        display: flex;
        align-items: center;
        gap: 11px;
        padding: 12px;
        border-bottom: 1px solid var(--line);
        margin-bottom: 6px;
      }
      .lux-avatar-lg {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        display: grid;
        place-items: center;
        overflow: hidden;
        color: #fff;
        background: linear-gradient(160deg, #4a4a40, var(--ink));
        flex-shrink: 0;
        font-size: 16px;
      }
      .lux-menu-head strong {
        display: block;
        font-size: 12.5px;
        font-weight: 600;
        color: var(--ink);
      }
      .lux-menu-head small {
        display: block;
        color: var(--muted);
        font-size: 10.5px;
        margin-top: 2px;
      }

      .lux-profile-menu a,
      .lux-profile-menu button {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 10px;
        border: 0;
        background: transparent;
        padding: 10px 12px;
        border-radius: 8px;
        color: var(--ink-soft);
        font: inherit;
        font-size: 12.5px;
        font-weight: 500;
        cursor: pointer;
        text-align: left;
        transition: all .15s ease;
      }
      .lux-profile-menu a:hover { background: var(--paper-2); color: var(--ink); }
      .lux-menu-danger { color: var(--danger) !important; }
      .lux-menu-danger:hover { background: #fbeeee; }

      /* ============ MASTHEAD ============ */
      .lux-masthead {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 24px;
        padding: 22px 0 26px;
      }

      .lux-eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        color: var(--muted);
        font-size: 10px;
        letter-spacing: 2px;
        font-weight: 600;
        text-transform: uppercase;
      }
      .lux-eyebrow i {
        width: 14px;
        height: 1.5px;
        border-radius: 4px;
        background: var(--gold);
      }

      .lux-masthead-copy h1 {
        font-family: 'Fraunces', Georgia, serif;
        font-size: clamp(28px, 3.6vw, 44px);
        line-height: 1.05;
        letter-spacing: -1.6px;
        margin: 12px 0 0;
        font-weight: 600;
        color: var(--ink);
      }
      .lux-accent {
        font-style: italic;
        color: var(--ink);
        position: relative;
        padding-bottom: 2px;
      }
      .lux-accent::after {
        content: "";
        position: absolute;
        left: 2px;
        right: 2px;
        bottom: -2px;
        height: 6px;
        background: var(--gold);
        opacity: .28;
        border-radius: 3px;
        z-index: -1;
      }

      .lux-masthead-actions { display: flex; gap: 10px; flex-shrink: 0; }

      /* Buttons */
      .lux-btn-primary,
      .lux-btn-ghost {
        min-height: 42px;
        padding: 0 16px;
        border-radius: 10px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-size: 12.5px;
        font-weight: 600;
        cursor: pointer;
        transition: all .2s ease;
        border: 1px solid transparent;
        font-family: inherit;
      }

      .lux-btn-primary {
        background: var(--ink);
        color: var(--paper);
        box-shadow: 0 8px 22px rgba(20,20,15,.20);
      }
      .lux-btn-primary:hover {
        background: var(--ink-2);
        transform: translateY(-2px);
        box-shadow: 0 14px 28px rgba(20,20,15,.24);
      }

      .lux-btn-ghost {
        background: transparent;
        color: var(--ink);
        border-color: var(--line-strong);
      }
      .lux-btn-ghost:hover {
        border-color: var(--ink);
        background: var(--paper);
      }
      .lux-btn-sm { min-height: 38px; font-size: 11.5px; }

      /* ============ GRID HERO ============ */
      .lux-grid-hero {
        display: grid;
        grid-template-columns: minmax(0, 1.45fr) minmax(0, 1fr);
        gap: 18px;
        margin-bottom: 18px;
      }

      /* Hero */
      .lux-hero {
        position: relative;
        overflow: hidden;
        padding: 36px 34px 30px;
        border-radius: var(--radius-xl);
        color: #fbf9f4;
        background:
          radial-gradient(700px 400px at 90% 10%, rgba(201,162,74,.18), transparent 60%),
          linear-gradient(150deg, #14140f 0%, #1d1d17 60%, #14140f 100%);
        box-shadow: 0 30px 60px rgba(20,20,15,.30);
        min-height: 320px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        border: 1px solid rgba(201,162,74,.14);
      }

      .lux-hero-grain {
        position: absolute; inset: 0;
        background-image:
          radial-gradient(circle at 20% 30%, rgba(255,255,255,.015) 0, transparent 40%),
          radial-gradient(circle at 80% 70%, rgba(255,255,255,.02) 0, transparent 40%);
        pointer-events: none;
      }

      .lux-hero-ring {
        position: absolute;
        border-radius: 50%;
        border: 1px solid rgba(201,162,74,.15);
        pointer-events: none;
      }
      .lux-ring-a { width: 300px; height: 300px; right: -120px; top: -110px; }
      .lux-ring-b { width: 440px; height: 440px; right: -190px; top: -170px; border-color: rgba(201,162,74,.08); }

      .lux-hero-inner { position: relative; z-index: 1; }

      .lux-hero-label {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        color: var(--gold-soft);
        font-size: 10px;
        letter-spacing: 2px;
        font-weight: 600;
        text-transform: uppercase;
        padding: 6px 12px;
        border-radius: 999px;
        background: rgba(201,162,74,.06);
        border: 1px solid rgba(201,162,74,.18);
      }

      .lux-dot-pulse {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--gold);
        box-shadow: 0 0 0 4px rgba(201,162,74,.18);
        animation: lux-pulse 2.4s ease-in-out infinite;
      }

      .lux-hero-value {
        font-family: 'Fraunces', Georgia, serif;
        font-size: clamp(42px, 5.2vw, 64px);
        line-height: 1;
        letter-spacing: -2.4px;
        font-weight: 600;
        margin: 22px 0 6px;
        color: #fbf9f4;
        font-variant-numeric: tabular-nums;
      }
      .lux-hero-suffix {
        color: #8a8780;
        font-size: 12px;
        letter-spacing: .5px;
        text-transform: lowercase;
      }

      .lux-hero-foot {
        display: flex;
        align-items: center;
        gap: 28px;
        margin-top: 32px;
        padding-top: 22px;
        border-top: 1px solid rgba(255,255,255,.07);
        flex-wrap: wrap;
      }
      .lux-hero-foot-item {
        display: flex;
        align-items: center;
        gap: 10px;
        color: #b5b2a6;
        font-size: 12px;
      }
      .lux-hero-foot-item svg {
        color: var(--gold);
        font-size: 15px;
        flex-shrink: 0;
      }
      .lux-hero-foot-item strong {
        display: block;
        color: #fbf9f4;
        font-size: 12.5px;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
      }
      .lux-hero-foot-item small {
        display: block;
        color: #6b6961;
        font-size: 10px;
        margin-top: 2px;
        letter-spacing: .2px;
      }
      .lux-hero-cta {
        margin-left: auto;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 11px 18px;
        border-radius: 10px;
        background: var(--gold);
        color: var(--ink);
        font-size: 12px;
        font-weight: 600;
        transition: all .2s ease;
        box-shadow: 0 12px 26px rgba(201,162,74,.28);
      }
      .lux-hero-cta:hover {
        background: var(--gold-soft);
        transform: translateY(-2px);
      }

      /* Stats */
      .lux-stat-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }

      .lux-stat {
        position: relative;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 20px;
        background: var(--paper);
        border: 1px solid var(--line);
        border-radius: var(--radius-lg);
        transition: all .22s ease;
        min-height: 150px;
      }
      .lux-stat:hover {
        transform: translateY(-3px);
        border-color: var(--line-strong);
        box-shadow: var(--shadow-1);
      }
      .lux-stat::after {
        content: "";
        position: absolute;
        width: 100px;
        height: 100px;
        border-radius: 50%;
        right: -60px;
        bottom: -60px;
        background: currentColor;
        opacity: .04;
        transition: opacity .25s ease;
      }
      .lux-stat:hover::after { opacity: .07; }

      .lux-stat-icon {
        width: 36px;
        height: 36px;
        display: grid;
        place-items: center;
        border-radius: 10px;
        font-size: 16px;
        margin-bottom: 10px;
      }
      .lux-stat-arrow {
        position: absolute;
        top: 18px;
        right: 18px;
        color: var(--muted);
        font-size: 14px;
        transition: all .25s ease;
      }
      .lux-stat:hover .lux-stat-arrow {
        color: var(--ink);
        transform: translate(2px,-2px);
      }
      .lux-stat-title {
        color: var(--muted);
        font-size: 11px;
        font-weight: 500;
        letter-spacing: .2px;
      }
      .lux-stat-value {
        font-family: 'Fraunces', Georgia, serif;
        font-size: 24px;
        font-weight: 600;
        color: var(--ink);
        letter-spacing: -.7px;
        line-height: 1.1;
        font-variant-numeric: tabular-nums;
      }
      .lux-stat-note {
        color: var(--muted);
        font-size: 10.5px;
        margin-top: 3px;
      }

      .lux-tone-gold { color: #a8802a; }
      .lux-tone-gold .lux-stat-icon { background: var(--gold-bg); color: #a8802a; }

      .lux-tone-ink { color: var(--ink); }
      .lux-tone-ink .lux-stat-icon { background: var(--ink); color: var(--paper); }

      .lux-tone-slate { color: #4d545c; }
      .lux-tone-slate .lux-stat-icon { background: #e2e5e6; color: #4d545c; }

      .lux-tone-clay { color: #9e5b3c; }
      .lux-tone-clay .lux-stat-icon { background: #f5e3d6; color: #9e5b3c; }

      .lux-tone-sage { color: #4a7457; }
      .lux-tone-sage .lux-stat-icon { background: #e0eae1; color: #4a7457; }

      /* ============ TWO COLUMN ============ */
      .lux-grid-two {
        display: grid;
        grid-template-columns: minmax(0, 1.6fr) minmax(300px, 1fr);
        gap: 18px;
        margin-bottom: 18px;
      }

      .lux-card {
        background: var(--paper);
        border: 1px solid var(--line);
        border-radius: var(--radius-lg);
        padding: 24px;
        box-shadow: var(--shadow-1);
        min-width: 0;
      }

      .lux-card-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 14px;
        margin-bottom: 20px;
      }
      .lux-card-head h3 {
        font-family: 'Fraunces', Georgia, serif;
        font-size: 19px;
        font-weight: 600;
        margin: 6px 0 0;
        letter-spacing: -.5px;
        color: var(--ink);
      }

      .lux-hint {
        color: var(--muted);
        font-size: 10.5px;
        padding: 5px 10px;
        border: 1px solid var(--line);
        border-radius: 7px;
        white-space: nowrap;
        background: var(--paper-2);
      }

      .lux-text-link {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        color: var(--ink);
        font-size: 11.5px;
        font-weight: 600;
        white-space: nowrap;
        border-bottom: 1px solid transparent;
        padding-bottom: 1px;
        transition: all .2s ease;
      }
      .lux-text-link:hover {
        border-bottom-color: var(--gold);
        color: var(--ink);
      }

      /* Quick actions */
      .lux-action-grid {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 10px;
      }

      .lux-quick {
        position: relative;
        min-height: 92px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 8px;
        padding: 14px;
        border: 1px solid var(--line);
        border-radius: 12px;
        background: var(--paper-2);
        transition: all .2s ease;
      }
      .lux-quick:hover {
        transform: translateY(-3px);
        background: var(--paper);
        border-color: var(--line-strong);
        box-shadow: 0 14px 28px rgba(30,28,20,.06);
      }

      .lux-quick-icon {
        width: 30px;
        height: 30px;
        display: grid;
        place-items: center;
        border-radius: 8px;
        font-size: 14px;
      }
      .lux-quick-label {
        color: var(--ink);
        font-size: 11.5px;
        font-weight: 600;
        line-height: 1.3;
      }
      .lux-quick-arrow {
        position: absolute;
        top: 12px;
        right: 12px;
        color: var(--muted);
        font-size: 11px;
        opacity: 0;
        transform: translate(-3px, 3px);
        transition: all .2s ease;
      }
      .lux-quick:hover .lux-quick-arrow { opacity: 1; transform: translate(0,0); }

      .lux-quick.lux-tone-gold .lux-quick-icon { background: var(--gold-bg); color: #a8802a; }
      .lux-quick.lux-tone-ink .lux-quick-icon { background: var(--ink); color: var(--paper); }
      .lux-quick.lux-tone-slate .lux-quick-icon { background: #e2e5e6; color: #4d545c; }
      .lux-quick.lux-tone-clay .lux-quick-icon { background: #f5e3d6; color: #9e5b3c; }
      .lux-quick.lux-tone-sage .lux-quick-icon { background: #e0eae1; color: #4a7457; }

      /* Health */
      .lux-health-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
      }
      .lux-health-top strong {
        display: block;
        font-family: 'Fraunces', Georgia, serif;
        font-size: 36px;
        font-weight: 600;
        letter-spacing: -1px;
        color: var(--ink);
        font-variant-numeric: tabular-nums;
      }
      .lux-health-top span { color: var(--muted); font-size: 11.5px; }

      .lux-health-badge {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 6px 11px;
        border-radius: 999px;
        font-size: 10.5px;
        font-weight: 600;
        letter-spacing: .2px;
      }
      .lux-health-badge.good { color: var(--ok); background: #e4efe4; }
      .lux-health-badge.warn { color: #a8802a; background: var(--gold-bg); }

      .lux-health-bar {
        height: 6px;
        background: var(--canvas-2);
        border-radius: 99px;
        overflow: hidden;
        margin: 20px 0;
      }
      .lux-health-bar span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, var(--gold), var(--gold-soft));
        transition: width .5s cubic-bezier(.4,0,.2,1);
      }

      .lux-health-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 11px 0;
        border-top: 1px solid var(--line);
        color: var(--ink-soft);
        font-size: 11.5px;
      }
      .lux-health-row span { display: flex; align-items: center; gap: 7px; }
      .lux-health-row strong {
        color: var(--ink);
        font-weight: 600;
        font-size: 12.5px;
        font-variant-numeric: tabular-nums;
      }
      .lux-danger { color: var(--danger) !important; }

      .lux-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        display: inline-block;
      }
      .lux-dot.ok { background: var(--ok); }
      .lux-dot.bad { background: var(--danger); }

      .lux-health-cta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 14px;
        min-height: 40px;
        padding: 0 14px;
        border-radius: 9px;
        background: var(--paper-2);
        color: var(--ink);
        font-size: 11.5px;
        font-weight: 600;
        border: 1px solid var(--line);
        transition: all .18s ease;
      }
      .lux-health-cta:hover { background: var(--canvas-2); }

      /* ============ SALES TABLE ============ */
      .lux-sales-card { margin-bottom: 18px; }
      .lux-head-right { display: flex; align-items: center; gap: 16px; }
      .lux-activity-chip {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        color: var(--muted);
        font-size: 10.5px;
      }

      .lux-table-wrap { width: 100%; overflow-x: auto; }
      .lux-table { width: 100%; border-collapse: collapse; min-width: 760px; }
      .lux-table th {
        text-align: left;
        padding: 10px 10px;
        color: var(--muted);
        font-size: 9.5px;
        letter-spacing: 1.4px;
        text-transform: uppercase;
        font-weight: 600;
        border-bottom: 1px solid var(--line);
      }
      .lux-table td {
        padding: 14px 10px;
        border-bottom: 1px solid var(--line);
        font-size: 12px;
        color: var(--ink-soft);
      }
      .lux-table tbody tr { transition: background .15s ease; }
      .lux-table tbody tr:hover { background: var(--paper-2); }
      .lux-table tbody tr:last-child td { border-bottom: 0; }

      .lux-invoice {
        color: var(--ink);
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        font-size: 12px;
      }
      .lux-customer { display: flex; align-items: center; gap: 9px; }
      .lux-customer-avatar {
        width: 28px;
        height: 28px;
        display: grid;
        place-items: center;
        border-radius: 8px;
        background: var(--canvas-2);
        color: var(--ink-soft);
        font-size: 12px;
        flex-shrink: 0;
      }
      .lux-item-cell strong { display: block; color: var(--ink); font-weight: 500; font-size: 12px; }
      .lux-item-cell small {
        display: block;
        color: var(--muted);
        font-size: 10.5px;
        margin-top: 2px;
        max-width: 160px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .lux-amount {
        color: var(--ink);
        font-weight: 600;
        font-variant-numeric: tabular-nums;
      }
      .lux-date {
        color: var(--muted) !important;
        white-space: nowrap;
        font-size: 11.5px !important;
        font-variant-numeric: tabular-nums;
      }

      .lux-status {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 5px 9px;
        border-radius: 999px;
        font-size: 10.5px;
        font-weight: 600;
        letter-spacing: .2px;
      }
      .lux-status.paid { color: var(--ok); background: #e4efe4; }
      .lux-status.pending { color: #a8802a; background: var(--gold-bg); }
      .lux-status.failed { color: var(--danger); background: #fbeeee; }

      .lux-row-menu {
        width: 28px;
        height: 28px;
        display: grid;
        place-items: center;
        border: 0;
        border-radius: 7px;
        background: transparent;
        color: var(--muted);
        cursor: pointer;
        transition: all .15s ease;
      }
      .lux-row-menu:hover { background: var(--canvas-2); color: var(--ink); }

      .lux-empty { text-align: center; padding: 44px 20px 30px; }
      .lux-empty-icon {
        width: 52px;
        height: 52px;
        display: grid;
        place-items: center;
        margin: 0 auto 14px;
        border-radius: 12px;
        background: var(--gold-bg);
        color: var(--gold);
        font-size: 22px;
      }
      .lux-empty h4 {
        font-family: 'Fraunces', serif;
        font-size: 16px;
        color: var(--ink);
        margin: 0 0 6px;
        font-weight: 600;
      }
      .lux-empty p {
        color: var(--muted);
        font-size: 12px;
        margin: 0 0 18px;
      }

      /* ============ BOTTOM GRID ============ */
      .lux-grid-three {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
        margin-bottom: 18px;
      }

      .lux-mini {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 20px;
        background: var(--paper);
        border: 1px solid var(--line);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-1);
        position: relative;
        transition: all .22s ease;
      }
      .lux-mini:hover {
        transform: translateY(-3px);
        border-color: var(--line-strong);
        box-shadow: var(--shadow-2);
      }

      .lux-mini-icon {
        width: 42px;
        height: 42px;
        display: grid;
        place-items: center;
        border-radius: 11px;
        font-size: 17px;
        flex-shrink: 0;
      }
      .lux-mini-icon.ink { background: var(--ink); color: var(--paper); }
      .lux-mini-icon.sage { background: #e0eae1; color: #4a7457; }
      .lux-mini-icon.gold { background: var(--gold-bg); color: #a8802a; }

      .lux-mini span { color: var(--muted); font-size: 11px; }
      .lux-mini strong {
        display: block;
        font-family: 'Fraunces', serif;
        font-size: 20px;
        font-weight: 600;
        color: var(--ink);
        margin: 2px 0;
        letter-spacing: -.4px;
        font-variant-numeric: tabular-nums;
      }
      .lux-mini small { color: var(--muted); font-size: 10.5px; }

      .lux-mini-arrow {
        position: absolute;
        top: 16px;
        right: 16px;
        color: var(--muted);
        font-size: 14px;
        transition: all .2s ease;
      }
      .lux-mini:hover .lux-mini-arrow {
        color: var(--ink);
        transform: translate(2px,-2px);
      }

      /* ============ FOOTER ============ */
      .lux-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: var(--muted);
        font-size: 11px;
        padding: 18px 4px 0;
        border-top: 1px solid var(--line);
        letter-spacing: .2px;
      }
      .lux-footer span:last-child { display: flex; align-items: center; gap: 6px; }

      /* ============ LOADING ============ */
      .lux-loading {
        width: 100%;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
      }

      .lux-loading-card {
        width: min(440px, 100%);
        padding: 42px 34px;
        background: var(--paper);
        border: 1px solid var(--line);
        border-radius: var(--radius-xl);
        box-shadow: var(--shadow-2);
        text-align: center;
      }

      .lux-loading-card .lux-mark,
      .lux-loading-card .lux-mark-danger {
        width: 56px;
        height: 56px;
        margin: 0 auto 18px;
        border-radius: 14px;
        font-size: 24px;
      }

      .lux-spin {
        width: 24px;
        height: 24px;
        border: 2.5px solid var(--line);
        border-top-color: var(--ink);
        border-radius: 50%;
        animation: lux-spin .8s linear infinite;
        margin: 0 auto 18px;
      }

      .lux-loading-card h3,
      .lux-loading-card h2 {
        font-family: 'Fraunces', serif;
        font-size: 19px;
        font-weight: 600;
        margin: 0 0 8px;
        color: var(--ink);
      }
      .lux-loading-card p {
        color: var(--muted);
        font-size: 12px;
        margin: 0;
        line-height: 1.6;
      }
      .lux-loading-card .lux-btn-primary { margin-top: 22px; }

      /* ============ RESPONSIVE ============ */
      @media (max-width: 1300px) {
        .lux-action-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      }

      @media (max-width: 1200px) {
        .lux-grid-hero { grid-template-columns: 1fr; }
        .lux-hero { min-height: 280px; }
        .lux-stat-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      }

      @media (max-width: 1080px) {
        .lux-sidebar {
          width: 76px;
          min-width: 76px;
          padding: 22px 9px;
        }
        .lux-brand { justify-content: center; padding: 4px 0 20px; }
        .lux-brand-text,
        .lux-nav-label,
        .lux-nav-item span,
        .lux-nav-item kbd,
        .lux-status div { display: none; }
        .lux-nav-item { justify-content: center; padding: 0; }
        .lux-nav-item.is-active::before { left: -9px; }
        .lux-status { justify-content: center; padding: 11px 0; }
        .lux-masthead { align-items: flex-start; flex-direction: column; gap: 16px; }
        .lux-masthead-actions { width: 100%; }
      }

      @media (max-width: 900px) {
        .lux-main { padding: 0 20px 24px; }
        .lux-topbar { min-height: 72px; }
        .lux-crumbs { display: none; }
        .lux-mobile-brand { display: flex; }
        .lux-profile-copy { display: none; }
        .lux-profile-btn { min-width: auto; padding: 4px; }
        .lux-live-chip { display: none; }
        .lux-grid-two { grid-template-columns: 1fr; }
        .lux-action-grid { grid-template-columns: repeat(3, 1fr); }
        .lux-grid-three { grid-template-columns: 1fr 1fr; }
        .lux-grid-three .lux-mini:last-child { grid-column: 1 / -1; }
        .lux-masthead-actions { flex-wrap: wrap; }
        .lux-masthead-actions > * { flex: 1; min-width: 140px; }
      }

      @media (max-width: 700px) {
        .lux-stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .lux-hero { padding: 26px 22px; }
        .lux-hero-foot { gap: 16px; flex-direction: column; align-items: flex-start; }
        .lux-hero-cta { margin-left: 0; }
      }

      @media (max-width: 620px) {
        .lux-sidebar { display: none; }
        .lux-main { padding: 0 14px 22px; }
        .lux-masthead { padding: 18px 0 22px; }
        .lux-masthead-copy h1 { font-size: 27px; letter-spacing: -1px; }
        .lux-hero-value { font-size: 42px; letter-spacing: -1.6px; }
        .lux-action-grid { grid-template-columns: repeat(2, 1fr); }
        .lux-grid-three { grid-template-columns: 1fr; }
        .lux-grid-three .lux-mini:last-child { grid-column: auto; }
        .lux-card { padding: 18px; }
        .lux-head-right .lux-activity-chip { display: none; }
        .lux-footer { flex-direction: column; align-items: flex-start; gap: 8px; }
      }
    `}</style>
  );
}