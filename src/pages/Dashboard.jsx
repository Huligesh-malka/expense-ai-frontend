import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
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
} from "react-icons/fi";

export default function BusinessDashboard() {
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

  // Get business_id from localStorage
  const businessId = localStorage.getItem("businessId") || "1";

  // ---------- Load Data ----------
  useEffect(() => {
    loadDashboard();
    loadRecentSales();
    loadBusinessInfo();
  }, []);

  const loadBusinessInfo = () => {
    // Get business name from localStorage or API
    const name = localStorage.getItem("businessName") || "Your Store";
    setBusinessName(name);
  };

  const loadDashboard = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/dashboard?business_id=${businessId}`
      );
      setDashboard(res.data);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentSales = async () => {
    try {
      // Load only 5 recent sales
      const res = await axios.get(
        `http://localhost:5000/api/sales?business_id=${businessId}&limit=5`
      );
      // Ensure we only show 5 items
      const salesData = res.data.data || [];
      setRecentSales(salesData.slice(0, 5));
    } catch (err) {
      console.error("Failed to load recent sales:", err);
      setRecentSales([]);
    }
  };

  // ---------- Format Currency ----------
  const formatCurrency = (amount) => {
    return `₹${Number(amount).toLocaleString()}`;
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
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
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
                e.currentTarget.style.boxShadow =
                  "0 6px 20px rgba(37, 99, 235, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(37, 99, 235, 0.3)";
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
                e.currentTarget.style.boxShadow =
                  "0 6px 20px rgba(22, 163, 74, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(22, 163, 74, 0.3)";
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
                e.currentTarget.style.boxShadow =
                  "0 6px 20px rgba(147, 51, 234, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(147, 51, 234, 0.3)";
              }}
            >
              <FiShoppingCart /> Add Purchase
            </button>
          </Link>
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
          {/* New 3D Shop Designer Button */}
          <QuickActionButton
            to="/create-layout"
            icon={<FiGrid size={20} />}
            label="3D Shop Designer"
            color="#0ea5e9"
          />
        </div>
      </div>

      {/* Recent Sales - Only 5 items */}
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
                {recentSales.map((sale, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom:
                        idx < recentSales.length - 1
                          ? "1px solid #e8edf5"
                          : "none",
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
                      #INV-{sale.invoice_no || "0001"}
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
                          background:
                            sale.payment_status === "Paid" || sale.payment_status === "paid"
                              ? "#dcfce7"
                              : sale.payment_status === "Pending" || sale.payment_status === "pending"
                              ? "#fef3c7"
                              : "#fee2e2",
                          color:
                            sale.payment_status === "Paid" || sale.payment_status === "paid"
                              ? "#16a34a"
                              : sale.payment_status === "Pending" || sale.payment_status === "pending"
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
                        {sale.payment_status === "Paid" || sale.payment_status === "paid" ? (
                          <FiCheckCircle size={14} />
                        ) : sale.payment_status === "Pending" || sale.payment_status === "pending" ? (
                          <FiClock size={14} />
                        ) : (
                          <FiXCircle size={14} />
                        )}
                        {sale.payment_status || "Paid"}
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
                ))}
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