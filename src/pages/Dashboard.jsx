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
  FiSettings,
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
      setError(
        err.response?.data?.message || "Failed to load dashboard."
      );
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
    return `₹${value.toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    })}`;
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
      <div className="modern-dashboard loading-screen">
        <div className="loading-card">
          <div className="loading-logo"><FiZap /></div>
          <div className="loader" />
          <h3>Preparing your workspace</h3>
          <p>Loading your business intelligence...</p>
        </div>
        <DashboardStyles />
      </div>
    );
  }

  if (error) {
    return (
      <div className="modern-dashboard error-screen">
        <div className="error-card">
          <div className="error-icon"><FiAlertCircle /></div>
          <span className="section-kicker">WORKSPACE ERROR</span>
          <h2>We couldn't load your dashboard</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button
              className="primary-btn"
              onClick={() =>
                loadAll(true)
              }
            >
              <FiRefreshCw />
              Try Again
            </button>
            <Link className="ghost-btn" to="/settings">
              Settings
            </Link>
          </div>
        </div>
        <DashboardStyles />
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
      tone: "blue",
      to: "/products",
    },
    {
      title: "Customers",
      value: Number(dashboard.totalCustomers || 0).toLocaleString("en-IN"),
      note: "Customer records",
      icon: <FiUsers />,
      tone: "orange",
      to: "/customers",
    },
  ];

  return (
    <div className="modern-dashboard">
      <aside className="side-nav">
        <div className="side-brand">
          <div className="brand-mark"><FiZap /></div>
          <div>
            <strong>BusinessOS</strong>
            <span>Smart retail workspace</span>
          </div>
        </div>

        <div className="nav-label">WORKSPACE</div>
        <nav>
          <Link className="nav-item active" to="/dashboard">
            <FiHome />
            <span>Overview</span>
          </Link>
          <Link className="nav-item" to="/billing-pos">
            <FiShoppingBag />
            <span>Billing POS</span>
            <b>F2</b>
          </Link>
          <Link className="nav-item" to="/products">
            <FiGrid />
            <span>Products</span>
          </Link>
          <Link className="nav-item" to="/customers">
            <FiUsers />
            <span>Customers</span>
          </Link>
          <Link className="nav-item" to="/suppliers">
            <FiTruck />
            <span>Suppliers</span>
          </Link>
          <Link className="nav-item" to="/purchases">
            <FiShoppingCart />
            <span>Purchases</span>
          </Link>
        </nav>

        <div className="nav-label nav-label-space">INSIGHTS</div>
        <nav>
          <Link className="nav-item" to="/sales">
            <FiList />
            <span>Sales History</span>
          </Link>
          <Link className="nav-item" to="/reports">
            <FiBarChart2 />
            <span>Reports</span>
          </Link>
          <Link className="nav-item" to="/ai-business">
            <span className="ai-nav-icon"><FiZap /></span>
            <span>AI Business Engine</span>
            <em>AI</em>
          </Link>
          <Link className="nav-item" to="/create-layout">
            <FiGrid />
            <span>3D Shop Designer</span>
          </Link>
          <Link className="nav-item" to="/qr-orders">
            <FiCreditCard />
            <span>QR Orders</span>
          </Link>
        </nav>

        <div className="side-bottom">
          <div className="online-card">
            <span className="online-dot" />
            <div>
              <strong>System online</strong>
              <small>All services connected</small>
            </div>
          </div>
          <Link className="nav-item" to="/settings">
            <FiSettings />
            <span>Settings</span>
          </Link>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="topbar">
          <div className="mobile-brand">
            <div className="brand-mark"><FiZap /></div>
            <strong>BusinessOS</strong>
          </div>

          <div className="breadcrumb">
            <span>Workspace</span>
            <FiChevronDown />
            <strong>Overview</strong>
          </div>

          <div className="top-actions">
            <div className="live-time">
              <span className="live-dot" />
              <FiClock />
              {formatTime()}
            </div>

            <button
              className={`icon-button ${refreshing ? "rotating" : ""}`}
              title="Refresh dashboard"
              onClick={() => loadAll(true)}
            >
              <FiRefreshCw />
            </button>

            <div className="profile-wrap">
              <button
                className="profile-button"
                onClick={() => setShowProfileMenu((v) => !v)}
              >
                <div className="profile-avatar">
                  {businessLogo ? (
                    <img src={businessLogo} alt="Business logo" />
                  ) : (
                    <FiBriefcase />
                  )}
                </div>
                <div className="profile-copy">
                  <strong>
                    {businessName.length > 18
                      ? businessName.substring(0, 18) + "..."
                      : businessName}
                  </strong>
                  <span>{businessType || "Business"}</span>
                </div>
                <FiChevronDown
                  className={showProfileMenu ? "chevron-up" : ""}
                />
              </button>

              {showProfileMenu && (
                <>
                  <div
                    className="menu-backdrop"
                    onClick={() => setShowProfileMenu(false)}
                  />
                  <div className="profile-menu">
                    <div className="profile-menu-head">
                      <div className="large-avatar">
                        {businessLogo ? (
                          <img src={businessLogo} alt="Business logo" />
                        ) : (
                          <FiBriefcase />
                        )}
                      </div>
                      <div>
                        <strong>{businessName}</strong>
                        <span>{businessType || "Business Account"}</span>
                      </div>
                    </div>

                    <Link to="/dashboard" onClick={() => setShowProfileMenu(false)}>
                      <FiHome /> Dashboard
                    </Link>
                    <Link to="/edit-business" onClick={() => setShowProfileMenu(false)}>
                      <FiEdit /> Edit Business Profile
                    </Link>
                    <Link to="/settings" onClick={() => setShowProfileMenu(false)}>
                      <FiSettings /> Settings
                    </Link>
                    <button onClick={handleLogout}>
                      <FiLogOut /> Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <section className="page-heading">
          <div>
            <div className="section-kicker">
              <span className="kicker-line" />
              BUSINESS COMMAND CENTER
            </div>
            <h1>
              Good to see you, <span>{businessName}</span>
            </h1>
            <p>
              Track sales, inventory and customers from one clean workspace.
            </p>
          </div>

          <div className="heading-actions">
            <Link className="outline-btn" to="/reports">
              <FiBarChart2 /> View Reports
            </Link>
            <Link className="primary-btn" to="/billing-pos">
              <FiShoppingBag /> Open POS
              <FiArrowUpRight />
            </Link>
          </div>
        </section>

        <section className="hero-panel">
          <div className="hero-glow glow-one" />
          <div className="hero-glow glow-two" />
          <div className="hero-content">
            <span className="hero-tag"><FiZap /> SMART BUSINESS</span>
            <h2>Everything you need to run today's store.</h2>
            <p>
              Your business activity is organized here so you can move from
              insight to action without extra clicks.
            </p>
            <div className="hero-buttons">
              <Link to="/billing-pos" className="hero-primary">
                Start Billing <FiArrowRight />
              </Link>
              <Link to="/ai-business" className="hero-secondary">
                Ask AI Business Engine <FiZap />
              </Link>
            </div>
          </div>

          <div className="hero-side">
            <div className="hero-stat-label">TODAY'S REVENUE</div>
            <div className="hero-stat-value">{formatCurrency(dashboard.todaySales)}</div>
            <div className="hero-stat-foot">
              <span><FiActivity /> Live dashboard</span>
              <span>{Number(dashboard.todaySales || 0) > 0 ? "Active" : "Ready"}</span>
            </div>
          </div>
        </section>

        <section className="stats-grid">
          {statCards.map((card) => (
            <Link to={card.to} className={`stat-card ${card.tone}`} key={card.title}>
              <div className="stat-card-top">
                <div className="stat-icon">{card.icon}</div>
                <FiArrowUpRight className="stat-arrow" />
              </div>
              <div className="stat-title">{card.title}</div>
              <div className="stat-value">{card.value}</div>
              <div className="stat-note">{card.note}</div>
            </Link>
          ))}
        </section>

        <section className="workspace-grid">
          <div className="content-card">
            <div className="card-header">
              <div>
                <span className="section-kicker">FAST ACCESS</span>
                <h3>What do you want to do?</h3>
              </div>
              <span className="shortcut-hint">Built for speed</span>
            </div>

            <div className="action-grid">
              <QuickAction to="/add-product" icon={<FiPlus />} label="Add Product" tone="blue" />
              <QuickAction to="/billing-pos" icon={<FiShoppingBag />} label="New Sale" tone="lime" />
              <QuickAction to="/products" icon={<FiGrid />} label="Manage Products" tone="violet" />
              <QuickAction to="/customers" icon={<FiUsers />} label="Customers" tone="pink" />
              <QuickAction to="/suppliers" icon={<FiTruck />} label="Suppliers" tone="orange" />
              <QuickAction to="/add-purchase" icon={<FiShoppingCart />} label="New Purchase" tone="cyan" />
              <QuickAction to="/reports" icon={<FiBarChart2 />} label="Business Reports" tone="indigo" />
              <QuickAction to="/ai-business" icon={<FiZap />} label="AI Insights" tone="gold" />
            </div>
          </div>

          <div className="content-card inventory-card">
            <div className="card-header">
              <div>
                <span className="section-kicker">INVENTORY</span>
                <h3>Store health</h3>
              </div>
              <Link to="/products" className="text-link">View all <FiArrowRight /></Link>
            </div>

            <div className="health-number">
              <div>
                <strong>{dashboard.totalProducts || 0}</strong>
                <span>Total products</span>
              </div>
              <div className={`health-badge ${(dashboard.lowStock || 0) > 0 ? "warning" : "good"}`}>
                {(dashboard.lowStock || 0) > 0 ? <FiAlertCircle /> : <FiCheckCircle />}
                {(dashboard.lowStock || 0) > 0 ? "Attention" : "Healthy"}
              </div>
            </div>

            <div className="health-bar">
              <span
                style={{
                  width: `${Math.min(
                    100,
                    Number(dashboard.totalProducts || 0) === 0
                      ? 4
                      : Math.max(
                          8,
                          100 -
                            (Number(dashboard.lowStock || 0) /
                              Number(dashboard.totalProducts || 1)) *
                              100
                        )
                  )}%`,
                }}
              />
            </div>

            <div className="health-row">
              <span><i className="dot green-dot" /> Healthy stock</span>
              <strong>
                {Math.max(
                  0,
                  Number(dashboard.totalProducts || 0) -
                    Number(dashboard.lowStock || 0)
                )}
              </strong>
            </div>
            <div className="health-row">
              <span><i className="dot red-dot" /> Low stock</span>
              <strong className="danger-text">{dashboard.lowStock || 0}</strong>
            </div>
            <Link to="/products" className="inventory-cta">
              Review inventory <FiArrowRight />
            </Link>
          </div>
        </section>

        <section className="content-card sales-card">
          <div className="card-header sales-header">
            <div>
              <span className="section-kicker">LIVE ACTIVITY</span>
              <h3>Recent sales</h3>
            </div>
            <div className="header-actions">
              <span className="sales-count">
                <FiActivity /> {recentSales.length} recent
              </span>
              <Link to="/sales" className="text-link">
                View all <FiArrowRight />
              </Link>
            </div>
          </div>

          {recentSales.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><FiShoppingBag /></div>
              <h4>No sales yet</h4>
              <p>Start your first sale from the POS and it will appear here.</p>
              <Link className="primary-btn small" to="/billing-pos">
                Open Billing POS <FiArrowRight />
              </Link>
            </div>
          ) : (
            <div className="sales-table-wrap">
              <table className="sales-table">
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
                          <strong className="invoice-number">
                            #{sale.invoice_no || "0001"}
                          </strong>
                        </td>
                        <td>
                          <div className="customer-cell">
                            <div className="customer-avatar">
                              <FiUser />
                            </div>
                            <span>
                              {sale.customer_phone || "Walk-in Customer"}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="item-cell">
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
                                {sale.items.length > 1 ? ` +${sale.items.length - 1}` : ""}
                              </small>
                            )}
                          </div>
                        </td>
                        <td>
                          <strong className="amount-cell">
                            {formatCurrency(sale.total_amount || 0)}
                          </strong>
                        </td>
                        <td>
                          <span
                            className={`status-pill ${
                              paid ? "paid" : pending ? "pending" : "failed"
                            }`}
                          >
                            {paid ? <FiCheckCircle /> : pending ? <FiClock /> : <FiXCircle />}
                            {sale.payment_status || "Paid"}
                          </span>
                        </td>
                        <td className="date-cell">{formatDate(sale.created_at)}</td>
                        <td>
                          <button className="row-menu" title="More">
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

        <section className="bottom-grid">
          <Link to="/ai-business" className="ai-card">
            <div className="ai-orbit orbit-one" />
            <div className="ai-orbit orbit-two" />
            <div className="ai-card-icon"><FiZap /></div>
            <div className="ai-card-content">
              <span className="ai-label">AI BUSINESS ENGINE</span>
              <h3>Turn your store data into actions.</h3>
              <p>Analyze sales, stock and customer activity from one place.</p>
            </div>
            <div className="ai-go"><FiArrowUpRight /></div>
          </Link>

          <div className="mini-info-card">
            <div className="mini-info-icon"><FiUsers /></div>
            <div>
              <span>Customers</span>
              <strong>{dashboard.totalCustomers || 0}</strong>
              <small>Registered customers</small>
            </div>
            <Link to="/customers"><FiArrowUpRight /></Link>
          </div>

          <div className="mini-info-card">
            <div className="mini-info-icon supplier"><FiTruck /></div>
            <div>
              <span>Suppliers</span>
              <strong>{dashboard.totalSuppliers || 0}</strong>
              <small>Supplier records</small>
            </div>
            <Link to="/suppliers"><FiArrowUpRight /></Link>
          </div>

          <div className="mini-info-card">
            <div className="mini-info-icon sales"><FiCreditCard /></div>
            <div>
              <span>Total Sales</span>
              <strong>{formatCurrency(dashboard.totalSales)}</strong>
              <small>All-time sales value</small>
            </div>
            <Link to="/sales"><FiArrowUpRight /></Link>
          </div>
        </section>

        <footer className="dashboard-footer">
          <span>BusinessOS • Smart retail workspace</span>
          <span><i className="dot green-dot" /> Connected</span>
        </footer>
      </main>

      <DashboardStyles />
    </div>
  );
}

function QuickAction({ to, icon, label, tone }) {
  return (
    <Link to={to} className={`quick-action ${tone}`}>
      <span className="quick-icon">{icon}</span>
      <span>{label}</span>
      <FiArrowUpRight className="quick-arrow" />
    </Link>
  );
}

function DashboardStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap');

      :root {
        --bg: #f5f6fa;
        --surface: #ffffff;
        --ink: #10131a;
        --muted: #737989;
        --line: #e8eaf0;
        --sidebar: #10131b;
        --sidebar-soft: #181c26;
        --lime: #c8f31d;
        --violet: #725cff;
        --blue: #2388ff;
        --orange: #ff9d42;
        --pink: #f35da9;
        --cyan: #23c8d7;
        --shadow: 0 12px 40px rgba(17, 21, 34, .07);
      }

      * { box-sizing: border-box; }

      .modern-dashboard {
        min-height: 100vh;
        background:
          radial-gradient(circle at 75% 0%, rgba(114,92,255,.07), transparent 25%),
          radial-gradient(circle at 30% 30%, rgba(200,243,29,.035), transparent 20%),
          var(--bg);
        color: var(--ink);
        font-family: 'DM Sans', sans-serif;
        display: flex;
      }

      .modern-dashboard a { color: inherit; text-decoration: none; }

      .side-nav {
        width: 248px;
        min-width: 248px;
        min-height: 100vh;
        background: var(--sidebar);
        color: #fff;
        padding: 24px 15px 18px;
        position: sticky;
        top: 0;
        height: 100vh;
        display: flex;
        flex-direction: column;
        z-index: 50;
      }

      .side-brand {
        display: flex;
        align-items: center;
        gap: 11px;
        padding: 2px 9px 28px;
      }

      .brand-mark {
        width: 39px;
        height: 39px;
        border-radius: 12px;
        display: grid;
        place-items: center;
        color: #111;
        background: var(--lime);
        box-shadow: 0 8px 24px rgba(200,243,29,.18);
        font-size: 19px;
      }

      .side-brand strong {
        display: block;
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 15px;
        letter-spacing: -.3px;
      }

      .side-brand span {
        display: block;
        color: #7f8596;
        font-size: 9px;
        margin-top: 3px;
      }

      .nav-label {
        color: #5f6574;
        font-size: 9px;
        letter-spacing: 1.5px;
        font-weight: 800;
        padding: 0 12px 9px;
      }

      .nav-label-space { margin-top: 20px; }

      .side-nav nav {
        display: grid;
        gap: 4px;
      }

      .nav-item {
        display: flex;
        align-items: center;
        gap: 11px;
        min-height: 42px;
        padding: 0 12px;
        border-radius: 11px;
        color: #8f95a5;
        font-size: 12px;
        font-weight: 600;
        transition: .18s ease;
      }

      .nav-item svg { font-size: 16px; flex: 0 0 auto; }

      .nav-item b {
        margin-left: auto;
        font-size: 8px;
        color: #555c6b;
        border: 1px solid #303541;
        padding: 3px 5px;
        border-radius: 5px;
      }

      .nav-item em {
        margin-left: auto;
        font-size: 8px;
        font-style: normal;
        color: #10131a;
        background: var(--lime);
        padding: 3px 5px;
        border-radius: 5px;
        font-weight: 900;
      }

      .nav-item:hover {
        color: #fff;
        background: rgba(255,255,255,.055);
        transform: translateX(2px);
      }

      .nav-item.active {
        color: #10131a;
        background: var(--lime);
        box-shadow: 0 8px 20px rgba(200,243,29,.12);
      }

      .nav-item.active b { color: #30351b; border-color: rgba(0,0,0,.15); }

      .ai-nav-icon {
        width: 16px;
        height: 16px;
        display: grid;
        place-items: center;
        color: #c8a6ff;
      }

      .side-bottom {
        margin-top: auto;
        display: grid;
        gap: 6px;
      }

      .online-card {
        display: flex;
        align-items: center;
        gap: 9px;
        padding: 12px;
        margin-bottom: 8px;
        border-radius: 12px;
        background: var(--sidebar-soft);
        border: 1px solid #232834;
      }

      .online-card strong,
      .online-card small {
        display: block;
      }

      .online-card strong { font-size: 10px; }
      .online-card small { color: #6d7381; font-size: 8px; margin-top: 2px; }

      .online-dot,
      .live-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #73e28d;
        box-shadow: 0 0 0 4px rgba(115,226,141,.08);
      }

      .dashboard-main {
        width: calc(100% - 248px);
        min-width: 0;
        padding: 0 32px 30px;
      }

      .topbar {
        height: 76px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        border-bottom: 1px solid var(--line);
        margin-bottom: 28px;
      }

      .mobile-brand { display: none; }

      .breadcrumb {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #999eaa;
        font-size: 11px;
      }

      .breadcrumb svg { font-size: 12px; }
      .breadcrumb strong { color: #252a34; }

      .top-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .live-time,
      .icon-button,
      .profile-button {
        height: 42px;
        border: 1px solid var(--line);
        background: #fff;
        border-radius: 11px;
      }

      .live-time {
        display: flex;
        align-items: center;
        gap: 7px;
        padding: 0 11px;
        color: #676d7b;
        font-size: 10px;
      }

      .live-time .live-dot { margin-right: 2px; }

      .icon-button {
        width: 42px;
        display: grid;
        place-items: center;
        cursor: pointer;
        color: #626878;
        transition: .18s;
      }

      .icon-button:hover {
        color: var(--ink);
        border-color: #d2d5de;
        transform: translateY(-1px);
      }

      .rotating svg { animation: rotate .8s linear infinite; }

      .profile-wrap { position: relative; }

      .profile-button {
        display: flex;
        align-items: center;
        gap: 9px;
        padding: 4px 9px 4px 5px;
        cursor: pointer;
        min-width: 180px;
        text-align: left;
      }

      .profile-avatar,
      .large-avatar {
        display: grid;
        place-items: center;
        overflow: hidden;
        color: #fff;
        background: linear-gradient(135deg, #725cff, #9e89ff);
      }

      .profile-avatar {
        width: 32px;
        height: 32px;
        border-radius: 9px;
      }

      .profile-avatar img,
      .large-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .profile-copy { flex: 1; min-width: 0; }
      .profile-copy strong,
      .profile-copy span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .profile-copy strong { font-size: 10px; }
      .profile-copy span { color: #898e9a; font-size: 8px; margin-top: 2px; }

      .profile-button > svg {
        color: #8b909c;
        font-size: 13px;
        transition: .18s;
      }

      .chevron-up { transform: rotate(180deg); }

      .menu-backdrop {
        position: fixed;
        inset: 0;
        z-index: 90;
      }

      .profile-menu {
        position: absolute;
        top: 50px;
        right: 0;
        width: 270px;
        background: #fff;
        border: 1px solid var(--line);
        border-radius: 15px;
        box-shadow: 0 24px 70px rgba(10,15,28,.16);
        padding: 8px;
        z-index: 100;
        animation: menuIn .18s ease;
      }

      .profile-menu-head {
        display: flex;
        gap: 10px;
        align-items: center;
        padding: 12px;
        border-bottom: 1px solid #f0f1f4;
        margin-bottom: 5px;
      }

      .large-avatar {
        width: 40px;
        height: 40px;
        border-radius: 11px;
        flex: 0 0 auto;
      }

      .profile-menu-head strong,
      .profile-menu-head span { display: block; }
      .profile-menu-head strong { font-size: 11px; }
      .profile-menu-head span { color: var(--muted); font-size: 9px; margin-top: 3px; }

      .profile-menu a,
      .profile-menu button {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 10px;
        border: 0;
        background: transparent;
        border-radius: 9px;
        padding: 10px 11px;
        color: #363b46;
        font: inherit;
        font-size: 10px;
        cursor: pointer;
        text-align: left;
      }

      .profile-menu a:hover { background: #f5f6f9; }
      .profile-menu button { color: #df454f; }
      .profile-menu button:hover { background: #fff1f2; }

      .page-heading {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 20px;
        margin-bottom: 20px;
      }

      .section-kicker {
        display: flex;
        align-items: center;
        gap: 7px;
        color: #8a8f9d;
        font-size: 9px;
        letter-spacing: 1.5px;
        font-weight: 800;
      }

      .kicker-line {
        width: 18px;
        height: 2px;
        border-radius: 4px;
        background: var(--violet);
      }

      .page-heading h1 {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: clamp(25px, 3vw, 38px);
        line-height: 1.12;
        letter-spacing: -1.5px;
        margin: 8px 0 7px;
      }

      .page-heading h1 span { color: var(--violet); }
      .page-heading p { margin: 0; color: var(--muted); font-size: 12px; }

      .heading-actions { display: flex; gap: 8px; }

      .primary-btn,
      .outline-btn,
      .ghost-btn {
        min-height: 42px;
        padding: 0 14px;
        border-radius: 10px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        font-size: 10px;
        font-weight: 800;
        cursor: pointer;
        transition: .18s;
        text-decoration: none;
      }

      .primary-btn {
        color: #10131a;
        background: var(--lime);
        border: 1px solid var(--lime);
        box-shadow: 0 8px 22px rgba(200,243,29,.16);
      }

      .primary-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 25px rgba(200,243,29,.23); }

      .outline-btn {
        color: #303541;
        background: #fff;
        border: 1px solid var(--line);
      }

      .outline-btn:hover,
      .ghost-btn:hover { border-color: #cfd2db; transform: translateY(-1px); }

      .ghost-btn {
        color: #454b58;
        background: #f8f9fb;
        border: 1px solid var(--line);
      }

      .primary-btn.small { min-height: 38px; }

      .hero-panel {
        position: relative;
        overflow: hidden;
        min-height: 230px;
        display: flex;
        justify-content: space-between;
        gap: 25px;
        padding: 30px;
        margin-bottom: 16px;
        border-radius: 22px;
        color: #fff;
        background:
          radial-gradient(circle at 80% 20%, rgba(114,92,255,.32), transparent 30%),
          linear-gradient(125deg, #12151e, #1b202b 55%, #12151c);
        box-shadow: 0 22px 50px rgba(15,18,27,.15);
      }

      .hero-glow {
        position: absolute;
        border-radius: 50%;
        filter: blur(3px);
        pointer-events: none;
      }

      .glow-one {
        width: 170px;
        height: 170px;
        right: 16%;
        bottom: -100px;
        background: rgba(200,243,29,.12);
      }

      .glow-two {
        width: 120px;
        height: 120px;
        right: 4%;
        top: -50px;
        background: rgba(114,92,255,.2);
      }

      .hero-content { position: relative; z-index: 1; max-width: 670px; }
      .hero-tag {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: #c8f31d;
        font-size: 8px;
        letter-spacing: 1.5px;
        font-weight: 900;
        text-shadow: 0 0 14px rgba(200,243,29,.20);
      }

      .hero-content h2 {
        max-width: 620px;
        color: #ffffff;
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: clamp(22px, 3vw, 33px);
        font-weight: 800;
        letter-spacing: -1.1px;
        line-height: 1.13;
        margin: 10px 0 8px;
        text-shadow: 0 2px 18px rgba(0,0,0,.18);
      }

      .hero-content p {
        max-width: 600px;
        color: #d4d8e2;
        font-size: 11px;
        line-height: 1.65;
        margin: 0;
      }

      .hero-buttons {
        display: flex;
        gap: 8px;
        margin-top: 20px;
        flex-wrap: wrap;
      }

      .hero-primary,
      .hero-secondary {
        min-height: 38px;
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 0 12px;
        border-radius: 9px;
        font-size: 9px;
        font-weight: 800;
      }

      .hero-primary {
        color: #10131a;
        background: #c8f31d;
        border: 1px solid #c8f31d;
        box-shadow: 0 8px 22px rgba(200,243,29,.18);
      }
      .hero-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 28px rgba(200,243,29,.26);
      }
      .hero-secondary {
        color: #ffffff;
        border: 1px solid rgba(255,255,255,.20);
        background: rgba(255,255,255,.07);
        backdrop-filter: blur(8px);
      }
      .hero-secondary:hover {
        background: rgba(255,255,255,.12);
        border-color: rgba(255,255,255,.30);
      }

      .hero-side {
        position: relative;
        z-index: 1;
        min-width: 220px;
        align-self: center;
        padding: 20px;
        border-radius: 15px;
        background: rgba(255,255,255,.045);
        border: 1px solid rgba(255,255,255,.08);
        backdrop-filter: blur(10px);
      }

      .hero-stat-label { color: #aeb5c4; font-size: 8px; letter-spacing: 1.2px; font-weight: 800; }
      .hero-stat-value {
        color: #ffffff;
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 28px;
        font-weight: 800;
        margin: 7px 0 13px;
        letter-spacing: -.6px;
      }

      .hero-stat-foot {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        color: #c4c9d4;
        font-size: 8px;
      }

      .hero-stat-foot span { display: flex; align-items: center; gap: 4px; }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
        margin-bottom: 16px;
      }

      .stat-card {
        position: relative;
        overflow: hidden;
        min-height: 153px;
        background: #fff;
        border: 1px solid var(--line);
        border-radius: 17px;
        padding: 17px;
        box-shadow: 0 5px 22px rgba(18,22,34,.035);
        transition: .2s ease;
      }

      .stat-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow);
        border-color: #d9dce5;
      }

      .stat-card::after {
        content: "";
        position: absolute;
        width: 95px;
        height: 95px;
        border-radius: 50%;
        right: -50px;
        bottom: -55px;
        background: currentColor;
        opacity: .035;
      }

      .stat-card.lime { color: #719300; }
      .stat-card.violet { color: #725cff; }
      .stat-card.blue { color: #2388ff; }
      .stat-card.orange { color: #e98222; }

      .stat-card-top { display: flex; justify-content: space-between; align-items: center; }
      .stat-icon {
        width: 34px;
        height: 34px;
        border-radius: 10px;
        display: grid;
        place-items: center;
        color: inherit;
        background: currentColor;
        position: relative;
      }

      .stat-icon svg { color: #fff; font-size: 16px; }
      .stat-card.lime .stat-icon { background: #dff38a; }
      .stat-card.violet .stat-icon { background: #e8e4ff; }
      .stat-card.blue .stat-icon { background: #dceeff; }
      .stat-card.orange .stat-icon { background: #fff0df; }
      .stat-card.lime .stat-icon svg { color: #718c00; }
      .stat-card.violet .stat-icon svg { color: #725cff; }
      .stat-card.blue .stat-icon svg { color: #2388ff; }
      .stat-card.orange .stat-icon svg { color: #e98222; }

      .stat-arrow { color: #afb3be; font-size: 14px; }
      .stat-title { margin-top: 14px; color: #777d8b; font-size: 9px; font-weight: 700; }
      .stat-value {
        color: #151820;
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 22px;
        font-weight: 800;
        letter-spacing: -.6px;
        margin-top: 3px;
      }

      .stat-note { color: #a0a4af; font-size: 8px; margin-top: 5px; }

      .workspace-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.55fr) minmax(300px, .75fr);
        gap: 16px;
        margin-bottom: 16px;
      }

      .content-card {
        background: #fff;
        border: 1px solid var(--line);
        border-radius: 19px;
        box-shadow: 0 5px 22px rgba(18,22,34,.035);
        padding: 20px;
        min-width: 0;
      }

      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 16px;
      }

      .card-header h3 {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 16px;
        margin: 5px 0 0;
        letter-spacing: -.4px;
      }

      .shortcut-hint {
        color: #9da2ad;
        font-size: 8px;
        padding: 6px 8px;
        border: 1px solid var(--line);
        border-radius: 7px;
      }

      .action-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 8px;
      }

      .quick-action {
        min-height: 72px;
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 7px;
        padding: 11px;
        border: 1px solid var(--line);
        border-radius: 12px;
        background: #fbfcfd;
        transition: .18s;
      }

      .quick-action:hover {
        transform: translateY(-3px);
        box-shadow: 0 12px 25px rgba(20,25,38,.07);
        background: #fff;
      }

      .quick-icon {
        width: 27px;
        height: 27px;
        border-radius: 8px;
        display: grid;
        place-items: center;
        font-size: 14px;
      }

      .quick-action span:nth-child(2) { color: #373c48; font-size: 9px; font-weight: 800; }
      .quick-arrow { position: absolute; top: 10px; right: 10px; color: #b2b6bf; font-size: 11px; }

      .quick-action.blue .quick-icon { color: #2388ff; background: #eaf4ff; }
      .quick-action.lime .quick-icon { color: #6c8900; background: #eff9c9; }
      .quick-action.violet .quick-icon { color: #725cff; background: #efedff; }
      .quick-action.pink .quick-icon { color: #e24891; background: #ffebf4; }
      .quick-action.orange .quick-icon { color: #e98222; background: #fff0df; }
      .quick-action.cyan .quick-icon { color: #159daa; background: #e5f9fb; }
      .quick-action.indigo .quick-icon { color: #5264d8; background: #eaedff; }
      .quick-action.gold .quick-icon { color: #9a7a00; background: #fff7cf; }

      .health-number {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 15px;
      }

      .health-number strong,
      .health-number span { display: block; }
      .health-number strong { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 29px; }
      .health-number span { color: #9297a4; font-size: 9px; margin-top: 3px; }

      .health-badge {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        border-radius: 999px;
        padding: 7px 9px;
        font-size: 8px;
        font-weight: 800;
      }

      .health-badge.good { color: #15985e; background: #e9f9f1; }
      .health-badge.warning { color: #c87a10; background: #fff3dc; }

      .health-bar {
        height: 7px;
        background: #f0f1f5;
        border-radius: 99px;
        overflow: hidden;
        margin: 17px 0;
      }

      .health-bar span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #c8f31d, #8ed32a);
      }

      .health-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 9px 0;
        border-top: 1px solid #f0f1f4;
        color: #757b89;
        font-size: 9px;
      }

      .health-row span { display: flex; align-items: center; gap: 6px; }
      .health-row strong { color: #303540; font-size: 10px; }
      .danger-text { color: #e4545e !important; }

      .dot {
        display: inline-block;
        width: 6px;
        height: 6px;
        border-radius: 50%;
      }

      .green-dot { background: #5fce7d; }
      .red-dot { background: #ed626c; }

      .inventory-cta {
        margin-top: 11px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-height: 36px;
        padding: 0 10px;
        border-radius: 9px;
        background: #f6f7fa;
        color: #383d48;
        font-size: 9px;
        font-weight: 800;
      }

      .text-link {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        color: #6453e8;
        font-size: 9px;
        font-weight: 800;
      }

      .sales-card { margin-bottom: 16px; }

      .sales-header { margin-bottom: 8px; }
      .header-actions { display: flex; align-items: center; gap: 12px; }
      .sales-count {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        color: #8d929e;
        font-size: 8px;
      }

      .sales-table-wrap { width: 100%; overflow-x: auto; }
      .sales-table { width: 100%; border-collapse: collapse; min-width: 760px; }
      .sales-table th {
        padding: 11px 9px;
        text-align: left;
        color: #a0a5b0;
        font-size: 8px;
        letter-spacing: .7px;
        text-transform: uppercase;
        border-bottom: 1px solid var(--line);
      }

      .sales-table td {
        padding: 12px 9px;
        border-bottom: 1px solid #f0f1f4;
        font-size: 9px;
        color: #4b505b;
      }

      .sales-table tbody tr { transition: .16s; }
      .sales-table tbody tr:hover { background: #fafbfc; }

      .invoice-number { color: #252a34; }
      .customer-cell { display: flex; align-items: center; gap: 7px; }
      .customer-avatar {
        width: 27px;
        height: 27px;
        display: grid;
        place-items: center;
        border-radius: 8px;
        background: #efedff;
        color: #725cff;
        font-size: 12px;
      }

      .item-cell strong,
      .item-cell small { display: block; }
      .item-cell strong { color: #343944; }
      .item-cell small {
        color: #a0a5b0;
        margin-top: 3px;
        max-width: 160px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .amount-cell { color: #15985e; }
      .date-cell { color: #8c919d !important; white-space: nowrap; }

      .status-pill {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        border-radius: 999px;
        padding: 5px 7px;
        font-size: 8px;
        font-weight: 800;
      }

      .status-pill.paid { color: #15985e; background: #e9f9f1; }
      .status-pill.pending { color: #c57b10; background: #fff3dc; }
      .status-pill.failed { color: #df4b57; background: #fff0f2; }

      .row-menu {
        width: 27px;
        height: 27px;
        display: grid;
        place-items: center;
        border: 0;
        border-radius: 7px;
        color: #999eaa;
        background: transparent;
        cursor: pointer;
      }

      .row-menu:hover { background: #f0f1f4; color: #444a56; }

      .empty-state {
        text-align: center;
        padding: 35px 20px 25px;
        color: #9297a4;
      }

      .empty-icon {
        width: 46px;
        height: 46px;
        display: grid;
        place-items: center;
        margin: 0 auto 10px;
        border-radius: 14px;
        background: #f2f1ff;
        color: #725cff;
        font-size: 20px;
      }

      .empty-state h4 { color: #353a45; font-size: 12px; margin: 0 0 5px; }
      .empty-state p { font-size: 9px; margin: 0 0 13px; }

      .bottom-grid {
        display: grid;
        grid-template-columns: 1.65fr repeat(3, 1fr);
        gap: 12px;
      }

      .ai-card {
        min-height: 125px;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        gap: 13px;
        padding: 18px;
        border-radius: 17px;
        color: #fff;
        background:
          radial-gradient(circle at 90% 0%, rgba(200,243,29,.18), transparent 30%),
          linear-gradient(130deg, #201b38, #2d2550);
        border: 1px solid rgba(114,92,255,.25);
        box-shadow: 0 12px 32px rgba(48,34,96,.13);
      }

      .ai-card:hover .ai-go { transform: translate(2px,-2px); }

      .ai-card-icon {
        width: 43px;
        height: 43px;
        display: grid;
        place-items: center;
        border-radius: 12px;
        color: #17121f;
        background: var(--lime);
        box-shadow: 0 8px 20px rgba(200,243,29,.16);
        flex: 0 0 auto;
        position: relative;
        z-index: 2;
      }

      .ai-card-content { position: relative; z-index: 2; }
      .ai-label { color: #bdafff; font-size: 8px; letter-spacing: 1.1px; font-weight: 900; }
      .ai-card h3 { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; margin: 5px 0; }
      .ai-card p { color: #aaa5bd; font-size: 8px; line-height: 1.5; margin: 0; max-width: 350px; }

      .ai-go {
        width: 28px;
        height: 28px;
        display: grid;
        place-items: center;
        margin-left: auto;
        color: #fff;
        border: 1px solid rgba(255,255,255,.15);
        border-radius: 50%;
        position: relative;
        z-index: 2;
        transition: .18s;
      }

      .ai-orbit {
        position: absolute;
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 50%;
      }

      .orbit-one { width: 180px; height: 180px; right: -75px; top: -70px; }
      .orbit-two { width: 110px; height: 110px; right: -40px; top: -35px; }

      .mini-info-card {
        min-height: 125px;
        display: flex;
        align-items: center;
        gap: 9px;
        padding: 16px;
        border-radius: 17px;
        background: #fff;
        border: 1px solid var(--line);
        position: relative;
        transition: .18s;
      }

      .mini-info-card:hover { transform: translateY(-3px); box-shadow: var(--shadow); }

      .mini-info-icon {
        width: 35px;
        height: 35px;
        display: grid;
        place-items: center;
        border-radius: 10px;
        color: #725cff;
        background: #efedff;
        flex: 0 0 auto;
      }

      .mini-info-icon.supplier { color: #159daa; background: #e5f9fb; }
      .mini-info-icon.sales { color: #15985e; background: #e9f9f1; }

      .mini-info-card span,
      .mini-info-card strong,
      .mini-info-card small { display: block; }
      .mini-info-card span { color: #9196a3; font-size: 8px; }
      .mini-info-card strong {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 18px;
        margin: 2px 0;
      }
      .mini-info-card small { color: #a4a8b2; font-size: 7px; }
      .mini-info-card > a {
        position: absolute;
        right: 12px;
        top: 12px;
        color: #b0b4be;
        font-size: 12px;
      }

      .dashboard-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: #9da2ae;
        font-size: 8px;
        padding: 18px 3px 0;
      }

      .dashboard-footer span:last-child {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .loading-screen,
      .error-screen {
        width: 100%;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 25px;
      }

      .loading-card,
      .error-card {
        width: min(430px, 100%);
        padding: 34px;
        background: #fff;
        border: 1px solid var(--line);
        border-radius: 20px;
        box-shadow: var(--shadow);
        text-align: center;
      }

      .loading-logo,
      .error-icon {
        width: 55px;
        height: 55px;
        margin: 0 auto 15px;
        border-radius: 16px;
        display: grid;
        place-items: center;
        font-size: 23px;
      }

      .loading-logo { background: var(--lime); color: #111; }
      .error-icon { background: #fff0f2; color: #df4b57; }

      .loader {
        width: 25px;
        height: 25px;
        border: 3px solid #eceef2;
        border-top-color: #725cff;
        border-radius: 50%;
        animation: rotate .8s linear infinite;
        margin: 0 auto 15px;
      }

      .loading-card h3,
      .error-card h2 {
        font-family: 'Plus Jakarta Sans', sans-serif;
        margin: 0 0 7px;
        font-size: 16px;
      }

      .loading-card p,
      .error-card p { color: var(--muted); font-size: 10px; margin: 0; line-height: 1.6; }

      .error-actions {
        display: flex;
        justify-content: center;
        gap: 8px;
        margin-top: 18px;
      }

      @keyframes rotate { to { transform: rotate(360deg); } }
      @keyframes menuIn {
        from { opacity: 0; transform: translateY(-6px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @media (max-width: 1250px) {
        .bottom-grid { grid-template-columns: 1.4fr 1fr 1fr; }
        .bottom-grid .mini-info-card:last-child { display: none; }
        .action-grid { grid-template-columns: repeat(3, 1fr); }
      }

      @media (max-width: 1050px) {
        .side-nav { width: 78px; min-width: 78px; padding-left: 9px; padding-right: 9px; }
        .side-brand { justify-content: center; padding-left: 0; padding-right: 0; }
        .side-brand > div:last-child,
        .nav-label,
        .nav-item span,
        .nav-item b,
        .nav-item em,
        .online-card div,
        .side-bottom .nav-item span { display: none; }
        .nav-item { justify-content: center; padding: 0; }
        .online-card { justify-content: center; padding: 11px 0; }
        .dashboard-main { width: calc(100% - 78px); }
        .hero-side { min-width: 190px; }
      }

      @media (max-width: 850px) {
        .dashboard-main { padding: 0 18px 24px; }
        .topbar { height: 68px; margin-bottom: 20px; }
        .breadcrumb { display: none; }
        .mobile-brand { display: flex; align-items: center; gap: 8px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; }
        .mobile-brand .brand-mark { width: 30px; height: 30px; border-radius: 9px; font-size: 14px; }
        .profile-copy { display: none; }
        .profile-button { min-width: auto; }
        .live-time { display: none; }
        .page-heading { align-items: flex-start; flex-direction: column; }
        .heading-actions { width: 100%; }
        .heading-actions > * { flex: 1; }
        .hero-panel { flex-direction: column; }
        .hero-side { min-width: 0; width: 100%; }
        .stats-grid { grid-template-columns: repeat(2, 1fr); }
        .workspace-grid { grid-template-columns: 1fr; }
        .bottom-grid { grid-template-columns: 1fr 1fr; }
        .ai-card { grid-column: 1 / -1; }
      }

      @media (max-width: 600px) {
        .side-nav { display: none; }
        .dashboard-main { width: 100%; padding: 0 12px 22px; }
        .topbar { margin-bottom: 17px; }
        .page-heading h1 { font-size: 25px; }
        .hero-panel { padding: 22px; border-radius: 18px; }
        .hero-content h2 { font-size: 23px; }
        .stats-grid { gap: 8px; }
        .stat-card { min-height: 140px; padding: 13px; }
        .stat-value { font-size: 19px; }
        .content-card { padding: 14px; border-radius: 16px; }
        .action-grid { grid-template-columns: repeat(2, 1fr); }
        .bottom-grid { grid-template-columns: 1fr; }
        .ai-card { grid-column: auto; }
        .mini-info-card { min-height: 95px; }
        .sales-header { align-items: flex-start; }
        .header-actions .sales-count { display: none; }
        .dashboard-footer { flex-direction: column; gap: 7px; align-items: flex-start; }
      }
    `}</style>
  );
}
