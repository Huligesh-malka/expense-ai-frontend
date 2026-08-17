import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../services/api";
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
  FiUserPlus,
  FiGrid,
  FiCalendar,
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
} from "react-icons/fi";

export default function BusinessDashboard() {
  const navigate = useNavigate();
  
  // ---------- State ----------
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
  const [businessName, setBusinessName] = useState("Your Store");
  const [businessType, setBusinessType] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [businessLogo, setBusinessLogo] = useState("");

  // ---------- Load Data ----------
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        await Promise.all([
          loadDashboard(),
          loadRecentSales(),
          loadBusinessInfo()
        ]);
      } catch (error) {
        console.error("Dashboard loading error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const loadBusinessInfo = () => {
    // Get business info from localStorage
    const name = localStorage.getItem("businessName") || "Your Store";
    const type = localStorage.getItem("businessType") || "";
    setBusinessName(name);
    setBusinessType(type);
    
    // Load business logo if available
    loadBusinessProfile();
  };

  // FIXED: Removed business_id from URL, using middleware
  const loadBusinessProfile = async () => {
    try {
      const res = await API.get("/business/profile");
      
      if (res.data.business) {
        setBusinessLogo(res.data.business.logo || "");
        // Also update business name from API if available
        if (res.data.business.business_name) {
          setBusinessName(res.data.business.business_name);
        }
      }
    } catch (err) {
      console.log("Could not load business profile:", err);
    }
  };

  // FIXED: Removed business_id from URL, using middleware
  const loadDashboard = async () => {
    try {
      const res = await API.get("/dashboard");
      setDashboard(res.data);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
      throw err;
    }
  };

  // FIXED: Removed business_id from URL, using middleware
  const loadRecentSales = async () => {
    try {
      const res = await API.get("/sales?limit=5");
      const salesData = res.data.data || [];
      setRecentSales(salesData.slice(0, 5));
    } catch (err) {
      console.error("Failed to load recent sales:", err);
      setRecentSales([]);
      throw err;
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // ---------- Format Currency ----------
  const formatCurrency = (amount) => {
    return `₹${Number(amount).toLocaleString()}`;
  };

  // ---------- Normalize Payment Status ----------
  const getPaymentStatus = (status) => {
    const normalized = String(status || "paid").toLowerCase();
    return {
      isPaid: normalized === "paid",
      isPending: normalized === "pending",
      isFailed: normalized === "failed" || normalized === "cancelled",
      label: normalized.charAt(0).toUpperCase() + normalized.slice(1),
    };
  };

  // ---------- Loading State ----------
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#f5f7fb",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              border: "4px solid #e2e8f0",
              borderTop: "4px solid #2563eb",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ color: "#64748b" }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // ---------- Render ----------
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f5f7fb 0%, #e8edf5 100%)",
        padding: "30px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
          flexWrap: "wrap",
          gap: "20px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: "700",
              color: "#1a2332",
              marginBottom: "6px",
            }}
          >
            Business Dashboard
          </h1>
          <p
            style={{
              fontSize: "16px",
              color: "#64748b",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            Welcome back 🏢
            <span
              style={{
                background: "#2563eb",
                color: "#fff",
                padding: "2px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "600",
              }}
            >
              {businessName}
            </span>
          </p>
        </div>
        
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <Link to="/billing-pos">
            <button
              style={{
                padding: "12px 24px",
                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(37, 99, 235, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(37, 99, 235, 0.3)";
              }}
            >
              <FiShoppingBag /> Billing (POS)
            </button>
          </Link>
          <Link to="/add-product">
            <button
              style={{
                padding: "12px 24px",
                background: "linear-gradient(135deg, #16a34a, #15803d)",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 12px rgba(22, 163, 74, 0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(22, 163, 74, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(22, 163, 74, 0.3)";
              }}
            >
              <FiPlus /> Add Product
            </button>
          </Link>
          <Link to="/add-purchase">
            <button
              style={{
                padding: "12px 24px",
                background: "linear-gradient(135deg, #9333ea, #7e22ce)",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 12px rgba(147, 51, 234, 0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(147, 51, 234, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(147, 51, 234, 0.3)";
              }}
            >
              <FiShoppingCart /> Add Purchase
            </button>
          </Link>

          {/* Profile Icon with Dropdown */}
          <div style={{ position: "relative" }}>
            <div
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                cursor: "pointer",
                padding: "8px 12px",
                borderRadius: "50px",
                background: "#fff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                border: "2px solid transparent",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#2563eb";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(37, 99, 235, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "transparent";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
              }}
            >
              {/* Profile Avatar */}
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: businessLogo ? "transparent" : "linear-gradient(135deg, #2563eb, #7c3aed)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                {businessLogo ? (
                  <img
                    src={businessLogo}
                    alt="Business Logo"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <FiUser size={20} color="#fff" />
                )}
              </div>
              
              <div style={{ lineHeight: "1.3", minWidth: "80px" }}>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#1a2332" }}>
                  {businessName.length > 15 ? businessName.substring(0, 15) + "..." : businessName}
                </div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>
                  {businessType || "Business"}
                </div>
              </div>
              
              <FiChevronDown
                size={16}
                style={{
                  color: "#64748b",
                  transition: "transform 0.3s ease",
                  transform: showProfileMenu ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </div>

            {/* Dropdown Menu */}
            {showProfileMenu && (
              <>
                {/* Backdrop */}
                <div
                  onClick={() => setShowProfileMenu(false)}
                  style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 999,
                  }}
                />
                
                {/* Menu */}
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 10px)",
                    right: 0,
                    background: "#fff",
                    borderRadius: "16px",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
                    minWidth: "280px",
                    padding: "8px",
                    zIndex: 1000,
                    animation: "slideDown 0.2s ease",
                    border: "1px solid rgba(0,0,0,0.05)",
                  }}
                >
                  {/* User Info */}
                  <div
                    style={{
                      padding: "16px 16px 12px",
                      borderBottom: "1px solid #f0f0f0",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "50%",
                          background: businessLogo ? "transparent" : "linear-gradient(135deg, #2563eb, #7c3aed)",
                          overflow: "hidden",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {businessLogo ? (
                          <img
                            src={businessLogo}
                            alt="Business Logo"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <FiBriefcase size={24} color="#fff" />
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: "600", color: "#1a2332" }}>
                          {businessName}
                        </div>
                        <div style={{ fontSize: "13px", color: "#64748b" }}>
                          {businessType || "Business Account"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div style={{ padding: "4px 0" }}>
                    <Link
                      to="/dashboard"
                      onClick={() => setShowProfileMenu(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px 16px",
                        color: "#1a2332",
                        textDecoration: "none",
                        borderRadius: "10px",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#f5f7fb";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <FiHome size={18} color="#64748b" />
                      <span>Dashboard</span>
                    </Link>

                    <Link
                      to="/edit-business"
                      onClick={() => setShowProfileMenu(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px 16px",
                        color: "#1a2332",
                        textDecoration: "none",
                        borderRadius: "10px",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#eff6ff";
                        e.currentTarget.style.color = "#2563eb";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "#1a2332";
                      }}
                    >
                      <FiEdit size={18} color="#2563eb" />
                      <span>Edit Business Profile</span>
                    </Link>

                    <Link
                      to="/settings"
                      onClick={() => setShowProfileMenu(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px 16px",
                        color: "#1a2332",
                        textDecoration: "none",
                        borderRadius: "10px",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#f5f7fb";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <FiSettings size={18} color="#64748b" />
                      <span>Settings</span>
                    </Link>
                  </div>

                  {/* Divider */}
                  <div
                    style={{
                      height: "1px",
                      background: "#f0f0f0",
                      margin: "4px 16px",
                    }}
                  />

                  {/* Logout */}
                  <div style={{ padding: "4px 0" }}>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        handleLogout();
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px 16px",
                        background: "transparent",
                        border: "none",
                        width: "100%",
                        borderRadius: "10px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        color: "#dc2626",
                        fontSize: "14px",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#fef2f2";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <FiLogOut size={18} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Business Info Widget */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e293b, #0f172a)",
          borderRadius: "16px",
          padding: "20px 30px",
          marginBottom: "30px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "#fff",
          flexWrap: "wrap",
          gap: "15px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div
            style={{
              background: "rgba(255,255,255,0.1)",
              padding: "12px",
              borderRadius: "12px",
            }}
          >
            <FiShoppingBag size={24} />
          </div>
          <div>
            <div style={{ fontSize: "14px", opacity: 0.8 }}>
              Business Name
            </div>
            <div style={{ fontSize: "20px", fontWeight: "600" }}>
              {businessName}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "30px", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: "13px", opacity: 0.7 }}>Today's Sales</div>
            <div style={{ fontSize: "18px", fontWeight: "600" }}>
              {formatCurrency(dashboard.todaySales)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "13px", opacity: 0.7 }}>
              Total Products
            </div>
            <div style={{ fontSize: "18px", fontWeight: "600" }}>
              {dashboard.totalProducts}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "13px", opacity: 0.7 }}>
              Low Stock Items
            </div>
            <div style={{ fontSize: "18px", fontWeight: "600" }}>
              {dashboard.lowStock}
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        <DashboardCard
          icon={<FiDollarSign size={24} />}
          title="Today's Sales"
          value={formatCurrency(dashboard.todaySales)}
          color="#16a34a"
        />
        <DashboardCard
          icon={<FiTrendingUp size={24} />}
          title="Monthly Sales"
          value={formatCurrency(dashboard.monthSales)}
          color="#f97316"
        />
        <DashboardCard
          icon={<FiShoppingBag size={24} />}
          title="Products"
          value={dashboard.totalProducts}
          color="#2563eb"
        />
        <DashboardCard
          icon={<FiFolder size={24} />}
          title="Categories"
          value={dashboard.totalCategories}
          color="#8b5cf6"
        />
        <DashboardCard
          icon={<FiUsers size={24} />}
          title="Customers"
          value={dashboard.totalCustomers}
          color="#ec4899"
        />
        <DashboardCard
          icon={<FiTruck size={24} />}
          title="Suppliers"
          value={dashboard.totalSuppliers}
          color="#14b8a6"
        />
        <DashboardCard
          icon={<FiPackage size={24} />}
          title="Total Sales"
          value={formatCurrency(dashboard.totalSales)}
          color="#6366f1"
        />
        <DashboardCard
          icon={<FiAlertCircle size={24} />}
          title="Low Stock"
          value={dashboard.lowStock}
          color="#ef4444"
        />
      </div>

      {/* Quick Actions */}
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          padding: "25px 30px",
          marginBottom: "30px",
          boxShadow: "0 2px 8px rgba(0,0,0,.06)",
          border: "1px solid rgba(0,0,0,.04)",
        }}
      >
        <h2
          style={{
            fontSize: "20px",
            fontWeight: "600",
            color: "#1a2332",
            marginBottom: "20px",
          }}
        >
          Quick Actions
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "15px",
          }}
        >
          <QuickActionButton
            to="/add-product"
            icon={<FiPlus size={20} />}
            label="Add Product"
            color="#2563eb"
          />
          <QuickActionButton
            to="/billing-pos"
            icon={<FiShoppingBag size={20} />}
            label="Billing (POS)"
            color="#16a34a"
          />
          <QuickActionButton
            to="/products"
            icon={<FiGrid size={20} />}
            label="Products"
            color="#8b5cf6"
          />
          <QuickActionButton
            to="/customers"
            icon={<FiUsers size={20} />}
            label="Customers"
            color="#ec4899"
          />
          <QuickActionButton
            to="/suppliers"
            icon={<FiTruck size={20} />}
            label="Suppliers"
            color="#14b8a6"
          />
          <QuickActionButton
            to="/purchases"
            icon={<FiShoppingCart size={20} />}
            label="Purchases"
            color="#7c3aed"
          />
          <QuickActionButton
            to="/sales"
            icon={<FiList size={20} />}
            label="Sales History"
            color="#059669"
          /> 
          <QuickActionButton
            to="/reports"
            icon={<FiBarChart2 size={20} />}
            label="Reports"
            color="#f59e0b"
          />
          <QuickActionButton
            to="/create-layout"
            icon={<FiGrid size={20} />}
            label="3D Shop Designer"
            color="#0ea5e9"
          />
        </div>
      </div>

      {/* Recent Sales */}
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          padding: "25px 30px",
          boxShadow: "0 2px 8px rgba(0,0,0,.06)",
          border: "1px solid rgba(0,0,0,.04)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "600",
              color: "#1a2332",
            }}
          >
            Recent Sales
          </h2>
          <Link
            to="/sales"
            style={{
              color: "#2563eb",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            View All →
          </Link>
        </div>
        <div style={{ overflowX: "auto" }}>
          {recentSales.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px",
                color: "#94a3b8",
              }}
            >
              No sales found. Start making sales!
            </div>
          ) : (
            <table
              width="100%"
              cellPadding="12"
              style={{ borderCollapse: "collapse" }}
            >
              <thead>
                <tr style={{ borderBottom: "2px solid #e8edf5" }}>
                  <th
                    align="left"
                    style={{
                      color: "#64748b",
                      fontWeight: "600",
                      fontSize: "13px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Invoice No
                  </th>
                  <th
                    align="left"
                    style={{
                      color: "#64748b",
                      fontWeight: "600",
                      fontSize: "13px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Customer Phone
                  </th>
                  <th
                    align="left"
                    style={{
                      color: "#64748b",
                      fontWeight: "600",
                      fontSize: "13px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Items
                  </th>
                  <th
                    align="left"
                    style={{
                      color: "#64748b",
                      fontWeight: "600",
                      fontSize: "13px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Amount
                  </th>
                  <th
                    align="left"
                    style={{
                      color: "#64748b",
                      fontWeight: "600",
                      fontSize: "13px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Payment
                  </th>
                  <th
                    align="left"
                    style={{
                      color: "#64748b",
                      fontWeight: "600",
                      fontSize: "13px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((sale) => {
                  const paymentStatus = getPaymentStatus(sale.payment_status);
                  
                  // Check if invoice_no already has "INV-" prefix
                  const invoiceDisplay = sale.invoice_no?.startsWith("INV-") 
                    ? sale.invoice_no 
                    : `INV-${sale.invoice_no || "0001"}`;
                  
                  return (
                    <tr
                      key={sale.id || sale._id}
                      style={{
                        borderBottom: "1px solid #e8edf5",
                        transition: "background 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#f8fafc";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <td style={{ fontWeight: "500", color: "#1a2332" }}>
                        #{invoiceDisplay}
                      </td>
                      <td style={{ color: "#1a2332" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              background: "#6366f1",
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "12px",
                              fontWeight: "600",
                            }}
                          >
                            {sale.customer_phone ? sale.customer_phone.slice(-4) : "📱"}
                          </div>
                          <span style={{ fontWeight: "500" }}>
                            {sale.customer_phone || "No phone"}
                          </span>
                        </div>
                      </td>
                      <td>
                        {sale.items && sale.items.length > 0 ? (
                          <>
                            <strong>{sale.items.length} Item{sale.items.length > 1 ? "s" : ""}</strong>
                            <div style={{ marginTop: 4, fontSize: "12px", color: "#64748b" }}>
                              {sale.items.slice(0, 2).map((item, index) => (
                                <div key={index}>
                                  {item.product_name} ({Number(item.entered_quantity)} {item.entered_unit})
                                </div>
                              ))}
                              {sale.items.length > 2 && (
                                <div>+{sale.items.length - 2} more</div>
                              )}
                            </div>
                          </>
                        ) : (
                          "0 Items"
                        )}
                      </td>
                      <td style={{ fontWeight: "600", color: "#16a34a" }}>
                        {formatCurrency(sale.total_amount || 0)}
                      </td>
                      <td>
                        <span
                          style={{
                            background: paymentStatus.isPaid
                              ? "#dcfce7"
                              : paymentStatus.isPending
                              ? "#fef3c7"
                              : "#fee2e2",
                            color: paymentStatus.isPaid
                              ? "#16a34a"
                              : paymentStatus.isPending
                              ? "#f59e0b"
                              : "#dc2626",
                            padding: "4px 12px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: "600",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          {paymentStatus.isPaid ? (
                            <FiCheckCircle size={14} />
                          ) : paymentStatus.isPending ? (
                            <FiClock size={14} />
                          ) : (
                            <FiXCircle size={14} />
                          )}
                          {paymentStatus.label}
                        </span>
                      </td>
                      <td style={{ color: "#64748b", fontSize: "14px" }}>
                        {sale.created_at
                          ? new Date(sale.created_at).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric"
                            })
                          : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* CSS Animation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
}

// ---------- Dashboard Card Component ----------
function DashboardCard({ icon, title, value, color }) {
  return (
    <div
      style={{
        background: "#fff",
        padding: "20px",
        borderRadius: "16px",
        boxShadow: "0 2px 8px rgba(0,0,0,.06)",
        border: "1px solid rgba(0,0,0,.04)",
        transition: "all 0.3s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,.06)";
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "10px",
        }}
      >
        <div
          style={{
            background: `${color}15`,
            padding: "10px",
            borderRadius: "12px",
            color: color,
          }}
        >
          {icon}
        </div>
        <h3
          style={{
            fontSize: "14px",
            fontWeight: "500",
            color: "#64748b",
            margin: 0,
          }}
        >
          {title}
        </h3>
      </div>
      <h1
        style={{
          fontSize: "28px",
          fontWeight: "700",
          color: "#1a2332",
          margin: "5px 0 0 0",
        }}
      >
        {value}
      </h1>
    </div>
  );
}

// ---------- Quick Action Button Component ----------
function QuickActionButton({ to, icon, label, color }) {
  return (
    <Link to={to} style={{ textDecoration: "none" }}>
      <button
        style={{
          padding: "15px 20px",
          border: "none",
          borderRadius: "12px",
          background: `${color}10`,
          color: color,
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "500",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          width: "100%",
          transition: "all 0.3s ease",
          border: `1px solid ${color}20`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = color;
          e.currentTarget.style.color = "#fff";
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = `0 6px 20px ${color}40`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = `${color}10`;
          e.currentTarget.style.color = color;
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {icon}
        {label}
      </button>
    </Link>
  );
}import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../services/api";
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
  FiUserPlus,
  FiGrid,
  FiCalendar,
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
} from "react-icons/fi";

export default function BusinessDashboard() {
  const navigate = useNavigate();
  
  // ---------- State ----------
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
  const [businessName, setBusinessName] = useState("Your Store");
  const [businessType, setBusinessType] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [businessLogo, setBusinessLogo] = useState("");

  // ---------- Load Data ----------
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        await Promise.all([
          loadDashboard(),
          loadRecentSales(),
          loadBusinessInfo()
        ]);
      } catch (error) {
        console.error("Dashboard loading error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const loadBusinessInfo = () => {
    // Get business info from localStorage
    const name = localStorage.getItem("businessName") || "Your Store";
    const type = localStorage.getItem("businessType") || "";
    setBusinessName(name);
    setBusinessType(type);
    
    // Load business logo if available
    loadBusinessProfile();
  };

  // FIXED: Removed business_id from URL, using middleware
  const loadBusinessProfile = async () => {
    try {
      const res = await API.get("/business/profile");
      
      if (res.data.business) {
        setBusinessLogo(res.data.business.logo || "");
        // Also update business name from API if available
        if (res.data.business.business_name) {
          setBusinessName(res.data.business.business_name);
        }
      }
    } catch (err) {
      console.log("Could not load business profile:", err);
    }
  };

  // FIXED: Removed business_id from URL, using middleware
  const loadDashboard = async () => {
    try {
      const res = await API.get("/dashboard");
      setDashboard(res.data);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
      throw err;
    }
  };

  // FIXED: Removed business_id from URL, using middleware
  const loadRecentSales = async () => {
    try {
      const res = await API.get("/sales?limit=5");
      const salesData = res.data.data || [];
      setRecentSales(salesData.slice(0, 5));
    } catch (err) {
      console.error("Failed to load recent sales:", err);
      setRecentSales([]);
      throw err;
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // ---------- Format Currency ----------
  const formatCurrency = (amount) => {
    return `₹${Number(amount).toLocaleString()}`;
  };

  // ---------- Normalize Payment Status ----------
  const getPaymentStatus = (status) => {
    const normalized = String(status || "paid").toLowerCase();
    return {
      isPaid: normalized === "paid",
      isPending: normalized === "pending",
      isFailed: normalized === "failed" || normalized === "cancelled",
      label: normalized.charAt(0).toUpperCase() + normalized.slice(1),
    };
  };

  // ---------- Loading State ----------
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#f5f7fb",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              border: "4px solid #e2e8f0",
              borderTop: "4px solid #2563eb",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ color: "#64748b" }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // ---------- Render ----------
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f5f7fb 0%, #e8edf5 100%)",
        padding: "30px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
          flexWrap: "wrap",
          gap: "20px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: "700",
              color: "#1a2332",
              marginBottom: "6px",
            }}
          >
            Business Dashboard
          </h1>
          <p
            style={{
              fontSize: "16px",
              color: "#64748b",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            Welcome back 🏢
            <span
              style={{
                background: "#2563eb",
                color: "#fff",
                padding: "2px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "600",
              }}
            >
              {businessName}
            </span>
          </p>
        </div>
        
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <Link to="/billing-pos">
            <button
              style={{
                padding: "12px 24px",
                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(37, 99, 235, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(37, 99, 235, 0.3)";
              }}
            >
              <FiShoppingBag /> Billing (POS)
            </button>
          </Link>
          <Link to="/add-product">
            <button
              style={{
                padding: "12px 24px",
                background: "linear-gradient(135deg, #16a34a, #15803d)",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 12px rgba(22, 163, 74, 0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(22, 163, 74, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(22, 163, 74, 0.3)";
              }}
            >
              <FiPlus /> Add Product
            </button>
          </Link>
          <Link to="/add-purchase">
            <button
              style={{
                padding: "12px 24px",
                background: "linear-gradient(135deg, #9333ea, #7e22ce)",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 12px rgba(147, 51, 234, 0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(147, 51, 234, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(147, 51, 234, 0.3)";
              }}
            >
              <FiShoppingCart /> Add Purchase
            </button>
          </Link>

          {/* Profile Icon with Dropdown */}
          <div style={{ position: "relative" }}>
            <div
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                cursor: "pointer",
                padding: "8px 12px",
                borderRadius: "50px",
                background: "#fff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                border: "2px solid transparent",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#2563eb";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(37, 99, 235, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "transparent";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
              }}
            >
              {/* Profile Avatar */}
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: businessLogo ? "transparent" : "linear-gradient(135deg, #2563eb, #7c3aed)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                {businessLogo ? (
                  <img
                    src={businessLogo}
                    alt="Business Logo"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <FiUser size={20} color="#fff" />
                )}
              </div>
              
              <div style={{ lineHeight: "1.3", minWidth: "80px" }}>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#1a2332" }}>
                  {businessName.length > 15 ? businessName.substring(0, 15) + "..." : businessName}
                </div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>
                  {businessType || "Business"}
                </div>
              </div>
              
              <FiChevronDown
                size={16}
                style={{
                  color: "#64748b",
                  transition: "transform 0.3s ease",
                  transform: showProfileMenu ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </div>

            {/* Dropdown Menu */}
            {showProfileMenu && (
              <>
                {/* Backdrop */}
                <div
                  onClick={() => setShowProfileMenu(false)}
                  style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 999,
                  }}
                />
                
                {/* Menu */}
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 10px)",
                    right: 0,
                    background: "#fff",
                    borderRadius: "16px",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
                    minWidth: "280px",
                    padding: "8px",
                    zIndex: 1000,
                    animation: "slideDown 0.2s ease",
                    border: "1px solid rgba(0,0,0,0.05)",
                  }}
                >
                  {/* User Info */}
                  <div
                    style={{
                      padding: "16px 16px 12px",
                      borderBottom: "1px solid #f0f0f0",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "50%",
                          background: businessLogo ? "transparent" : "linear-gradient(135deg, #2563eb, #7c3aed)",
                          overflow: "hidden",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {businessLogo ? (
                          <img
                            src={businessLogo}
                            alt="Business Logo"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <FiBriefcase size={24} color="#fff" />
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: "600", color: "#1a2332" }}>
                          {businessName}
                        </div>
                        <div style={{ fontSize: "13px", color: "#64748b" }}>
                          {businessType || "Business Account"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div style={{ padding: "4px 0" }}>
                    <Link
                      to="/dashboard"
                      onClick={() => setShowProfileMenu(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px 16px",
                        color: "#1a2332",
                        textDecoration: "none",
                        borderRadius: "10px",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#f5f7fb";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <FiHome size={18} color="#64748b" />
                      <span>Dashboard</span>
                    </Link>

                    <Link
                      to="/edit-business"
                      onClick={() => setShowProfileMenu(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px 16px",
                        color: "#1a2332",
                        textDecoration: "none",
                        borderRadius: "10px",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#eff6ff";
                        e.currentTarget.style.color = "#2563eb";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "#1a2332";
                      }}
                    >
                      <FiEdit size={18} color="#2563eb" />
                      <span>Edit Business Profile</span>
                    </Link>

                    <Link
                      to="/settings"
                      onClick={() => setShowProfileMenu(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px 16px",
                        color: "#1a2332",
                        textDecoration: "none",
                        borderRadius: "10px",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#f5f7fb";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <FiSettings size={18} color="#64748b" />
                      <span>Settings</span>
                    </Link>
                  </div>

                  {/* Divider */}
                  <div
                    style={{
                      height: "1px",
                      background: "#f0f0f0",
                      margin: "4px 16px",
                    }}
                  />

                  {/* Logout */}
                  <div style={{ padding: "4px 0" }}>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        handleLogout();
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px 16px",
                        background: "transparent",
                        border: "none",
                        width: "100%",
                        borderRadius: "10px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        color: "#dc2626",
                        fontSize: "14px",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#fef2f2";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <FiLogOut size={18} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Business Info Widget */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e293b, #0f172a)",
          borderRadius: "16px",
          padding: "20px 30px",
          marginBottom: "30px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "#fff",
          flexWrap: "wrap",
          gap: "15px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div
            style={{
              background: "rgba(255,255,255,0.1)",
              padding: "12px",
              borderRadius: "12px",
            }}
          >
            <FiShoppingBag size={24} />
          </div>
          <div>
            <div style={{ fontSize: "14px", opacity: 0.8 }}>
              Business Name
            </div>
            <div style={{ fontSize: "20px", fontWeight: "600" }}>
              {businessName}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "30px", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: "13px", opacity: 0.7 }}>Today's Sales</div>
            <div style={{ fontSize: "18px", fontWeight: "600" }}>
              {formatCurrency(dashboard.todaySales)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "13px", opacity: 0.7 }}>
              Total Products
            </div>
            <div style={{ fontSize: "18px", fontWeight: "600" }}>
              {dashboard.totalProducts}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "13px", opacity: 0.7 }}>
              Low Stock Items
            </div>
            <div style={{ fontSize: "18px", fontWeight: "600" }}>
              {dashboard.lowStock}
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        <DashboardCard
          icon={<FiDollarSign size={24} />}
          title="Today's Sales"
          value={formatCurrency(dashboard.todaySales)}
          color="#16a34a"
        />
        <DashboardCard
          icon={<FiTrendingUp size={24} />}
          title="Monthly Sales"
          value={formatCurrency(dashboard.monthSales)}
          color="#f97316"
        />
        <DashboardCard
          icon={<FiShoppingBag size={24} />}
          title="Products"
          value={dashboard.totalProducts}
          color="#2563eb"
        />
        <DashboardCard
          icon={<FiFolder size={24} />}
          title="Categories"
          value={dashboard.totalCategories}
          color="#8b5cf6"
        />
        <DashboardCard
          icon={<FiUsers size={24} />}
          title="Customers"
          value={dashboard.totalCustomers}
          color="#ec4899"
        />
        <DashboardCard
          icon={<FiTruck size={24} />}
          title="Suppliers"
          value={dashboard.totalSuppliers}
          color="#14b8a6"
        />
        <DashboardCard
          icon={<FiPackage size={24} />}
          title="Total Sales"
          value={formatCurrency(dashboard.totalSales)}
          color="#6366f1"
        />
        <DashboardCard
          icon={<FiAlertCircle size={24} />}
          title="Low Stock"
          value={dashboard.lowStock}
          color="#ef4444"
        />
      </div>

      {/* Quick Actions */}
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          padding: "25px 30px",
          marginBottom: "30px",
          boxShadow: "0 2px 8px rgba(0,0,0,.06)",
          border: "1px solid rgba(0,0,0,.04)",
        }}
      >
        <h2
          style={{
            fontSize: "20px",
            fontWeight: "600",
            color: "#1a2332",
            marginBottom: "20px",
          }}
        >
          Quick Actions
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "15px",
          }}
        >
          <QuickActionButton
            to="/add-product"
            icon={<FiPlus size={20} />}
            label="Add Product"
            color="#2563eb"
          />
          <QuickActionButton
            to="/billing-pos"
            icon={<FiShoppingBag size={20} />}
            label="Billing (POS)"
            color="#16a34a"
          />
          <QuickActionButton
            to="/products"
            icon={<FiGrid size={20} />}
            label="Products"
            color="#8b5cf6"
          />
          <QuickActionButton
            to="/customers"
            icon={<FiUsers size={20} />}
            label="Customers"
            color="#ec4899"
          />
          <QuickActionButton
            to="/suppliers"
            icon={<FiTruck size={20} />}
            label="Suppliers"
            color="#14b8a6"
          />
          <QuickActionButton
            to="/purchases"
            icon={<FiShoppingCart size={20} />}
            label="Purchases"
            color="#7c3aed"
          />
          <QuickActionButton
            to="/sales"
            icon={<FiList size={20} />}
            label="Sales History"
            color="#059669"
          /> 
          <QuickActionButton
            to="/reports"
            icon={<FiBarChart2 size={20} />}
            label="Reports"
            color="#f59e0b"
          />
          <QuickActionButton
            to="/create-layout"
            icon={<FiGrid size={20} />}
            label="3D Shop Designer"
            color="#0ea5e9"
          />
        </div>
      </div>

      {/* Recent Sales */}
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          padding: "25px 30px",
          boxShadow: "0 2px 8px rgba(0,0,0,.06)",
          border: "1px solid rgba(0,0,0,.04)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "600",
              color: "#1a2332",
            }}
          >
            Recent Sales
          </h2>
          <Link
            to="/sales"
            style={{
              color: "#2563eb",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            View All →
          </Link>
        </div>
        <div style={{ overflowX: "auto" }}>
          {recentSales.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px",
                color: "#94a3b8",
              }}
            >
              No sales found. Start making sales!
            </div>
          ) : (
            <table
              width="100%"
              cellPadding="12"
              style={{ borderCollapse: "collapse" }}
            >
              <thead>
                <tr style={{ borderBottom: "2px solid #e8edf5" }}>
                  <th
                    align="left"
                    style={{
                      color: "#64748b",
                      fontWeight: "600",
                      fontSize: "13px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Invoice No
                  </th>
                  <th
                    align="left"
                    style={{
                      color: "#64748b",
                      fontWeight: "600",
                      fontSize: "13px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Customer Phone
                  </th>
                  <th
                    align="left"
                    style={{
                      color: "#64748b",
                      fontWeight: "600",
                      fontSize: "13px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Items
                  </th>
                  <th
                    align="left"
                    style={{
                      color: "#64748b",
                      fontWeight: "600",
                      fontSize: "13px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Amount
                  </th>
                  <th
                    align="left"
                    style={{
                      color: "#64748b",
                      fontWeight: "600",
                      fontSize: "13px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Payment
                  </th>
                  <th
                    align="left"
                    style={{
                      color: "#64748b",
                      fontWeight: "600",
                      fontSize: "13px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((sale) => {
                  const paymentStatus = getPaymentStatus(sale.payment_status);
                  
                  // Check if invoice_no already has "INV-" prefix
                  const invoiceDisplay = sale.invoice_no?.startsWith("INV-") 
                    ? sale.invoice_no 
                    : `INV-${sale.invoice_no || "0001"}`;
                  
                  return (
                    <tr
                      key={sale.id || sale._id}
                      style={{
                        borderBottom: "1px solid #e8edf5",
                        transition: "background 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#f8fafc";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <td style={{ fontWeight: "500", color: "#1a2332" }}>
                        #{invoiceDisplay}
                      </td>
                      <td style={{ color: "#1a2332" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              background: "#6366f1",
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "12px",
                              fontWeight: "600",
                            }}
                          >
                            {sale.customer_phone ? sale.customer_phone.slice(-4) : "📱"}
                          </div>
                          <span style={{ fontWeight: "500" }}>
                            {sale.customer_phone || "No phone"}
                          </span>
                        </div>
                      </td>
                      <td>
                        {sale.items && sale.items.length > 0 ? (
                          <>
                            <strong>{sale.items.length} Item{sale.items.length > 1 ? "s" : ""}</strong>
                            <div style={{ marginTop: 4, fontSize: "12px", color: "#64748b" }}>
                              {sale.items.slice(0, 2).map((item, index) => (
                                <div key={index}>
                                  {item.product_name} ({Number(item.entered_quantity)} {item.entered_unit})
                                </div>
                              ))}
                              {sale.items.length > 2 && (
                                <div>+{sale.items.length - 2} more</div>
                              )}
                            </div>
                          </>
                        ) : (
                          "0 Items"
                        )}
                      </td>
                      <td style={{ fontWeight: "600", color: "#16a34a" }}>
                        {formatCurrency(sale.total_amount || 0)}
                      </td>
                      <td>
                        <span
                          style={{
                            background: paymentStatus.isPaid
                              ? "#dcfce7"
                              : paymentStatus.isPending
                              ? "#fef3c7"
                              : "#fee2e2",
                            color: paymentStatus.isPaid
                              ? "#16a34a"
                              : paymentStatus.isPending
                              ? "#f59e0b"
                              : "#dc2626",
                            padding: "4px 12px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: "600",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          {paymentStatus.isPaid ? (
                            <FiCheckCircle size={14} />
                          ) : paymentStatus.isPending ? (
                            <FiClock size={14} />
                          ) : (
                            <FiXCircle size={14} />
                          )}
                          {paymentStatus.label}
                        </span>
                      </td>
                      <td style={{ color: "#64748b", fontSize: "14px" }}>
                        {sale.created_at
                          ? new Date(sale.created_at).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric"
                            })
                          : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* CSS Animation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
}

// ---------- Dashboard Card Component ----------
function DashboardCard({ icon, title, value, color }) {
  return (
    <div
      style={{
        background: "#fff",
        padding: "20px",
        borderRadius: "16px",
        boxShadow: "0 2px 8px rgba(0,0,0,.06)",
        border: "1px solid rgba(0,0,0,.04)",
        transition: "all 0.3s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,.06)";
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "10px",
        }}
      >
        <div
          style={{
            background: `${color}15`,
            padding: "10px",
            borderRadius: "12px",
            color: color,
          }}
        >
          {icon}
        </div>
        <h3
          style={{
            fontSize: "14px",
            fontWeight: "500",
            color: "#64748b",
            margin: 0,
          }}
        >
          {title}
        </h3>
      </div>
      <h1
        style={{
          fontSize: "28px",
          fontWeight: "700",
          color: "#1a2332",
          margin: "5px 0 0 0",
        }}
      >
        {value}
      </h1>
    </div>
  );
}

// ---------- Quick Action Button Component ----------
function QuickActionButton({ to, icon, label, color }) {
  return (
    <Link to={to} style={{ textDecoration: "none" }}>
      <button
        style={{
          padding: "15px 20px",
          border: "none",
          borderRadius: "12px",
          background: `${color}10`,
          color: color,
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "500",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          width: "100%",
          transition: "all 0.3s ease",
          border: `1px solid ${color}20`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = color;
          e.currentTarget.style.color = "#fff";
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = `0 6px 20px ${color}40`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = `${color}10`;
          e.currentTarget.style.color = color;
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {icon}
        {label}
      </button>
    </Link>
  );
}import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../services/api";
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
  FiUserPlus,
  FiGrid,
  FiCalendar,
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
} from "react-icons/fi";

export default function BusinessDashboard() {
  const navigate = useNavigate();
  
  // ---------- State ----------
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
  const [businessName, setBusinessName] = useState("Your Store");
  const [businessType, setBusinessType] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [businessLogo, setBusinessLogo] = useState("");

  // ---------- Load Data ----------
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        await Promise.all([
          loadDashboard(),
          loadRecentSales(),
          loadBusinessInfo()
        ]);
      } catch (error) {
        console.error("Dashboard loading error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const loadBusinessInfo = () => {
    // Get business info from localStorage
    const name = localStorage.getItem("businessName") || "Your Store";
    const type = localStorage.getItem("businessType") || "";
    setBusinessName(name);
    setBusinessType(type);
    
    // Load business logo if available
    loadBusinessProfile();
  };

  // FIXED: Removed business_id from URL, using middleware
  const loadBusinessProfile = async () => {
    try {
      const res = await API.get("/business/profile");
      
      if (res.data.business) {
        setBusinessLogo(res.data.business.logo || "");
        // Also update business name from API if available
        if (res.data.business.business_name) {
          setBusinessName(res.data.business.business_name);
        }
      }
    } catch (err) {
      console.log("Could not load business profile:", err);
    }
  };

  // FIXED: Removed business_id from URL, using middleware
  const loadDashboard = async () => {
    try {
      const res = await API.get("/dashboard");
      setDashboard(res.data);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
      throw err;
    }
  };

  // FIXED: Removed business_id from URL, using middleware
  const loadRecentSales = async () => {
    try {
      const res = await API.get("/sales?limit=5");
      const salesData = res.data.data || [];
      setRecentSales(salesData.slice(0, 5));
    } catch (err) {
      console.error("Failed to load recent sales:", err);
      setRecentSales([]);
      throw err;
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // ---------- Format Currency ----------
  const formatCurrency = (amount) => {
    return `₹${Number(amount).toLocaleString()}`;
  };

  // ---------- Normalize Payment Status ----------
  const getPaymentStatus = (status) => {
    const normalized = String(status || "paid").toLowerCase();
    return {
      isPaid: normalized === "paid",
      isPending: normalized === "pending",
      isFailed: normalized === "failed" || normalized === "cancelled",
      label: normalized.charAt(0).toUpperCase() + normalized.slice(1),
    };
  };

  // ---------- Loading State ----------
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#f5f7fb",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              border: "4px solid #e2e8f0",
              borderTop: "4px solid #2563eb",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ color: "#64748b" }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // ---------- Render ----------
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f5f7fb 0%, #e8edf5 100%)",
        padding: "30px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
          flexWrap: "wrap",
          gap: "20px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: "700",
              color: "#1a2332",
              marginBottom: "6px",
            }}
          >
            Business Dashboard
          </h1>
          <p
            style={{
              fontSize: "16px",
              color: "#64748b",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            Welcome back 🏢
            <span
              style={{
                background: "#2563eb",
                color: "#fff",
                padding: "2px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "600",
              }}
            >
              {businessName}
            </span>
          </p>
        </div>
        
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <Link to="/billing-pos">
            <button
              style={{
                padding: "12px 24px",
                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(37, 99, 235, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(37, 99, 235, 0.3)";
              }}
            >
              <FiShoppingBag /> Billing (POS)
            </button>
          </Link>
          <Link to="/add-product">
            <button
              style={{
                padding: "12px 24px",
                background: "linear-gradient(135deg, #16a34a, #15803d)",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 12px rgba(22, 163, 74, 0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(22, 163, 74, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(22, 163, 74, 0.3)";
              }}
            >
              <FiPlus /> Add Product
            </button>
          </Link>
          <Link to="/add-purchase">
            <button
              style={{
                padding: "12px 24px",
                background: "linear-gradient(135deg, #9333ea, #7e22ce)",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 12px rgba(147, 51, 234, 0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(147, 51, 234, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(147, 51, 234, 0.3)";
              }}
            >
              <FiShoppingCart /> Add Purchase
            </button>
          </Link>

          {/* Profile Icon with Dropdown */}
          <div style={{ position: "relative" }}>
            <div
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                cursor: "pointer",
                padding: "8px 12px",
                borderRadius: "50px",
                background: "#fff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                border: "2px solid transparent",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#2563eb";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(37, 99, 235, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "transparent";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
              }}
            >
              {/* Profile Avatar */}
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: businessLogo ? "transparent" : "linear-gradient(135deg, #2563eb, #7c3aed)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                {businessLogo ? (
                  <img
                    src={businessLogo}
                    alt="Business Logo"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <FiUser size={20} color="#fff" />
                )}
              </div>
              
              <div style={{ lineHeight: "1.3", minWidth: "80px" }}>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#1a2332" }}>
                  {businessName.length > 15 ? businessName.substring(0, 15) + "..." : businessName}
                </div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>
                  {businessType || "Business"}
                </div>
              </div>
              
              <FiChevronDown
                size={16}
                style={{
                  color: "#64748b",
                  transition: "transform 0.3s ease",
                  transform: showProfileMenu ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </div>

            {/* Dropdown Menu */}
            {showProfileMenu && (
              <>
                {/* Backdrop */}
                <div
                  onClick={() => setShowProfileMenu(false)}
                  style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 999,
                  }}
                />
                
                {/* Menu */}
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 10px)",
                    right: 0,
                    background: "#fff",
                    borderRadius: "16px",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
                    minWidth: "280px",
                    padding: "8px",
                    zIndex: 1000,
                    animation: "slideDown 0.2s ease",
                    border: "1px solid rgba(0,0,0,0.05)",
                  }}
                >
                  {/* User Info */}
                  <div
                    style={{
                      padding: "16px 16px 12px",
                      borderBottom: "1px solid #f0f0f0",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "50%",
                          background: businessLogo ? "transparent" : "linear-gradient(135deg, #2563eb, #7c3aed)",
                          overflow: "hidden",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {businessLogo ? (
                          <img
                            src={businessLogo}
                            alt="Business Logo"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <FiBriefcase size={24} color="#fff" />
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: "600", color: "#1a2332" }}>
                          {businessName}
                        </div>
                        <div style={{ fontSize: "13px", color: "#64748b" }}>
                          {businessType || "Business Account"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div style={{ padding: "4px 0" }}>
                    <Link
                      to="/dashboard"
                      onClick={() => setShowProfileMenu(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px 16px",
                        color: "#1a2332",
                        textDecoration: "none",
                        borderRadius: "10px",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#f5f7fb";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <FiHome size={18} color="#64748b" />
                      <span>Dashboard</span>
                    </Link>

                    <Link
                      to="/edit-business"
                      onClick={() => setShowProfileMenu(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px 16px",
                        color: "#1a2332",
                        textDecoration: "none",
                        borderRadius: "10px",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#eff6ff";
                        e.currentTarget.style.color = "#2563eb";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "#1a2332";
                      }}
                    >
                      <FiEdit size={18} color="#2563eb" />
                      <span>Edit Business Profile</span>
                    </Link>

                    <Link
                      to="/settings"
                      onClick={() => setShowProfileMenu(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px 16px",
                        color: "#1a2332",
                        textDecoration: "none",
                        borderRadius: "10px",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#f5f7fb";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <FiSettings size={18} color="#64748b" />
                      <span>Settings</span>
                    </Link>
                  </div>

                  {/* Divider */}
                  <div
                    style={{
                      height: "1px",
                      background: "#f0f0f0",
                      margin: "4px 16px",
                    }}
                  />

                  {/* Logout */}
                  <div style={{ padding: "4px 0" }}>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        handleLogout();
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px 16px",
                        background: "transparent",
                        border: "none",
                        width: "100%",
                        borderRadius: "10px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        color: "#dc2626",
                        fontSize: "14px",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#fef2f2";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <FiLogOut size={18} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Business Info Widget */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e293b, #0f172a)",
          borderRadius: "16px",
          padding: "20px 30px",
          marginBottom: "30px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "#fff",
          flexWrap: "wrap",
          gap: "15px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div
            style={{
              background: "rgba(255,255,255,0.1)",
              padding: "12px",
              borderRadius: "12px",
            }}
          >
            <FiShoppingBag size={24} />
          </div>
          <div>
            <div style={{ fontSize: "14px", opacity: 0.8 }}>
              Business Name
            </div>
            <div style={{ fontSize: "20px", fontWeight: "600" }}>
              {businessName}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "30px", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: "13px", opacity: 0.7 }}>Today's Sales</div>
            <div style={{ fontSize: "18px", fontWeight: "600" }}>
              {formatCurrency(dashboard.todaySales)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "13px", opacity: 0.7 }}>
              Total Products
            </div>
            <div style={{ fontSize: "18px", fontWeight: "600" }}>
              {dashboard.totalProducts}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "13px", opacity: 0.7 }}>
              Low Stock Items
            </div>
            <div style={{ fontSize: "18px", fontWeight: "600" }}>
              {dashboard.lowStock}
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        <DashboardCard
          icon={<FiDollarSign size={24} />}
          title="Today's Sales"
          value={formatCurrency(dashboard.todaySales)}
          color="#16a34a"
        />
        <DashboardCard
          icon={<FiTrendingUp size={24} />}
          title="Monthly Sales"
          value={formatCurrency(dashboard.monthSales)}
          color="#f97316"
        />
        <DashboardCard
          icon={<FiShoppingBag size={24} />}
          title="Products"
          value={dashboard.totalProducts}
          color="#2563eb"
        />
        <DashboardCard
          icon={<FiFolder size={24} />}
          title="Categories"
          value={dashboard.totalCategories}
          color="#8b5cf6"
        />
        <DashboardCard
          icon={<FiUsers size={24} />}
          title="Customers"
          value={dashboard.totalCustomers}
          color="#ec4899"
        />
        <DashboardCard
          icon={<FiTruck size={24} />}
          title="Suppliers"
          value={dashboard.totalSuppliers}
          color="#14b8a6"
        />
        <DashboardCard
          icon={<FiPackage size={24} />}
          title="Total Sales"
          value={formatCurrency(dashboard.totalSales)}
          color="#6366f1"
        />
        <DashboardCard
          icon={<FiAlertCircle size={24} />}
          title="Low Stock"
          value={dashboard.lowStock}
          color="#ef4444"
        />
      </div>

      {/* Quick Actions */}
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          padding: "25px 30px",
          marginBottom: "30px",
          boxShadow: "0 2px 8px rgba(0,0,0,.06)",
          border: "1px solid rgba(0,0,0,.04)",
        }}
      >
        <h2
          style={{
            fontSize: "20px",
            fontWeight: "600",
            color: "#1a2332",
            marginBottom: "20px",
          }}
        >
          Quick Actions
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "15px",
          }}
        >
          <QuickActionButton
            to="/add-product"
            icon={<FiPlus size={20} />}
            label="Add Product"
            color="#2563eb"
          />
          <QuickActionButton
            to="/billing-pos"
            icon={<FiShoppingBag size={20} />}
            label="Billing (POS)"
            color="#16a34a"
          />
          <QuickActionButton
            to="/products"
            icon={<FiGrid size={20} />}
            label="Products"
            color="#8b5cf6"
          />
          <QuickActionButton
            to="/customers"
            icon={<FiUsers size={20} />}
            label="Customers"
            color="#ec4899"
          />
          <QuickActionButton
            to="/suppliers"
            icon={<FiTruck size={20} />}
            label="Suppliers"
            color="#14b8a6"
          />
          <QuickActionButton
            to="/purchases"
            icon={<FiShoppingCart size={20} />}
            label="Purchases"
            color="#7c3aed"
          />
          <QuickActionButton
            to="/sales"
            icon={<FiList size={20} />}
            label="Sales History"
            color="#059669"
          /> 
          <QuickActionButton
            to="/reports"
            icon={<FiBarChart2 size={20} />}
            label="Reports"
            color="#f59e0b"
          />
          <QuickActionButton
            to="/create-layout"
            icon={<FiGrid size={20} />}
            label="3D Shop Designer"
            color="#0ea5e9"
          />
        </div>
      </div>

      {/* Recent Sales */}
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          padding: "25px 30px",
          boxShadow: "0 2px 8px rgba(0,0,0,.06)",
          border: "1px solid rgba(0,0,0,.04)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "600",
              color: "#1a2332",
            }}
          >
            Recent Sales
          </h2>
          <Link
            to="/sales"
            style={{
              color: "#2563eb",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            View All →
          </Link>
        </div>
        <div style={{ overflowX: "auto" }}>
          {recentSales.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px",
                color: "#94a3b8",
              }}
            >
              No sales found. Start making sales!
            </div>
          ) : (
            <table
              width="100%"
              cellPadding="12"
              style={{ borderCollapse: "collapse" }}
            >
              <thead>
                <tr style={{ borderBottom: "2px solid #e8edf5" }}>
                  <th
                    align="left"
                    style={{
                      color: "#64748b",
                      fontWeight: "600",
                      fontSize: "13px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Invoice No
                  </th>
                  <th
                    align="left"
                    style={{
                      color: "#64748b",
                      fontWeight: "600",
                      fontSize: "13px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Customer Phone
                  </th>
                  <th
                    align="left"
                    style={{
                      color: "#64748b",
                      fontWeight: "600",
                      fontSize: "13px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Items
                  </th>
                  <th
                    align="left"
                    style={{
                      color: "#64748b",
                      fontWeight: "600",
                      fontSize: "13px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Amount
                  </th>
                  <th
                    align="left"
                    style={{
                      color: "#64748b",
                      fontWeight: "600",
                      fontSize: "13px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Payment
                  </th>
                  <th
                    align="left"
                    style={{
                      color: "#64748b",
                      fontWeight: "600",
                      fontSize: "13px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((sale) => {
                  const paymentStatus = getPaymentStatus(sale.payment_status);
                  
                  // Check if invoice_no already has "INV-" prefix
                  const invoiceDisplay = sale.invoice_no?.startsWith("INV-") 
                    ? sale.invoice_no 
                    : `INV-${sale.invoice_no || "0001"}`;
                  
                  return (
                    <tr
                      key={sale.id || sale._id}
                      style={{
                        borderBottom: "1px solid #e8edf5",
                        transition: "background 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#f8fafc";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <td style={{ fontWeight: "500", color: "#1a2332" }}>
                        #{invoiceDisplay}
                      </td>
                      <td style={{ color: "#1a2332" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              background: "#6366f1",
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "12px",
                              fontWeight: "600",
                            }}
                          >
                            {sale.customer_phone ? sale.customer_phone.slice(-4) : "📱"}
                          </div>
                          <span style={{ fontWeight: "500" }}>
                            {sale.customer_phone || "No phone"}
                          </span>
                        </div>
                      </td>
                      <td>
                        {sale.items && sale.items.length > 0 ? (
                          <>
                            <strong>{sale.items.length} Item{sale.items.length > 1 ? "s" : ""}</strong>
                            <div style={{ marginTop: 4, fontSize: "12px", color: "#64748b" }}>
                              {sale.items.slice(0, 2).map((item, index) => (
                                <div key={index}>
                                  {item.product_name} ({Number(item.entered_quantity)} {item.entered_unit})
                                </div>
                              ))}
                              {sale.items.length > 2 && (
                                <div>+{sale.items.length - 2} more</div>
                              )}
                            </div>
                          </>
                        ) : (
                          "0 Items"
                        )}
                      </td>
                      <td style={{ fontWeight: "600", color: "#16a34a" }}>
                        {formatCurrency(sale.total_amount || 0)}
                      </td>
                      <td>
                        <span
                          style={{
                            background: paymentStatus.isPaid
                              ? "#dcfce7"
                              : paymentStatus.isPending
                              ? "#fef3c7"
                              : "#fee2e2",
                            color: paymentStatus.isPaid
                              ? "#16a34a"
                              : paymentStatus.isPending
                              ? "#f59e0b"
                              : "#dc2626",
                            padding: "4px 12px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: "600",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          {paymentStatus.isPaid ? (
                            <FiCheckCircle size={14} />
                          ) : paymentStatus.isPending ? (
                            <FiClock size={14} />
                          ) : (
                            <FiXCircle size={14} />
                          )}
                          {paymentStatus.label}
                        </span>
                      </td>
                      <td style={{ color: "#64748b", fontSize: "14px" }}>
                        {sale.created_at
                          ? new Date(sale.created_at).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric"
                            })
                          : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* CSS Animation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
}

// ---------- Dashboard Card Component ----------
function DashboardCard({ icon, title, value, color }) {
  return (
    <div
      style={{
        background: "#fff",
        padding: "20px",
        borderRadius: "16px",
        boxShadow: "0 2px 8px rgba(0,0,0,.06)",
        border: "1px solid rgba(0,0,0,.04)",
        transition: "all 0.3s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,.06)";
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "10px",
        }}
      >
        <div
          style={{
            background: `${color}15`,
            padding: "10px",
            borderRadius: "12px",
            color: color,
          }}
        >
          {icon}
        </div>
        <h3
          style={{
            fontSize: "14px",
            fontWeight: "500",
            color: "#64748b",
            margin: 0,
          }}
        >
          {title}
        </h3>
      </div>
      <h1
        style={{
          fontSize: "28px",
          fontWeight: "700",
          color: "#1a2332",
          margin: "5px 0 0 0",
        }}
      >
        {value}
      </h1>
    </div>
  );
}

// ---------- Quick Action Button Component ----------
function QuickActionButton({ to, icon, label, color }) {
  return (
    <Link to={to} style={{ textDecoration: "none" }}>
      <button
        style={{
          padding: "15px 20px",
          border: "none",
          borderRadius: "12px",
          background: `${color}10`,
          color: color,
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "500",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          width: "100%",
          transition: "all 0.3s ease",
          border: `1px solid ${color}20`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = color;
          e.currentTarget.style.color = "#fff";
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = `0 6px 20px ${color}40`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = `${color}10`;
          e.currentTarget.style.color = color;
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {icon}
        {label}
      </button>
    </Link>
  );
}