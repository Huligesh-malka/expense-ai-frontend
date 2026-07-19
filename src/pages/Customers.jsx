import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

// Modern, clean design for Customers page - Phone numbers only
export default function Customers() {
  const businessId = localStorage.getItem("businessId");
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const res = await API.get(`/customers?business_id=${businessId}`);
      setCustomers(res.data.data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.customer_phone?.includes(search)
  );

  // Safe calculation functions with error handling
  const calculateTotalOrders = () => {
    try {
      return customers.reduce((sum, c) => sum + (Number(c.total_orders) || 0), 0);
    } catch {
      return 0;
    }
  };

  const calculateTotalRevenue = () => {
    try {
      const total = customers.reduce((sum, c) => sum + (Number(c.total_spent) || 0), 0);
      return total.toFixed(0);
    } catch {
      return "0";
    }
  };

  const calculateActiveCustomers = () => {
    try {
      return customers.filter((c) => c.status === "active").length;
    } catch {
      return 0;
    }
  };

  // Styles
  const styles = {
    container: {
      maxWidth: "1400px",
      margin: "0 auto",
      padding: "2rem 1.5rem",
      fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
      backgroundColor: "#f8fafc",
      minHeight: "100vh",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "2rem",
      flexWrap: "wrap",
      gap: "1rem",
    },
    headerLeft: {
      display: "flex",
      alignItems: "center",
      gap: "1rem",
    },
    title: {
      fontSize: "2rem",
      fontWeight: 700,
      color: "#0f172a",
      margin: 0,
      letterSpacing: "-0.025em",
    },
    badge: {
      backgroundColor: "#e2e8f0",
      color: "#475569",
      padding: "0.25rem 0.75rem",
      borderRadius: "9999px",
      fontSize: "0.875rem",
      fontWeight: 600,
    },
    stats: {
      display: "flex",
      gap: "1.5rem",
      backgroundColor: "white",
      padding: "0.75rem 1.5rem",
      borderRadius: "12px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    },
    statItem: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
    },
    statLabel: {
      color: "#64748b",
      fontSize: "0.875rem",
      fontWeight: 500,
    },
    statValue: {
      color: "#0f172a",
      fontSize: "1.125rem",
      fontWeight: 700,
    },
    searchWrapper: {
      position: "relative",
      marginBottom: "1.75rem",
    },
    searchIcon: {
      position: "absolute",
      left: "1rem",
      top: "50%",
      transform: "translateY(-50%)",
      color: "#94a3b8",
    },
    searchInput: {
      width: "100%",
      padding: "0.875rem 1rem 0.875rem 3rem",
      fontSize: "0.95rem",
      border: "2px solid #e2e8f0",
      borderRadius: "14px",
      backgroundColor: "white",
      transition: "all 0.2s ease",
      outline: "none",
      fontFamily: "inherit",
    },
    tableWrapper: {
      backgroundColor: "white",
      borderRadius: "16px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)",
      overflow: "hidden",
      border: "1px solid #f1f5f9",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: "0.9rem",
    },
    thead: {
      backgroundColor: "#f8fafc",
      borderBottom: "2px solid #e2e8f0",
    },
    th: {
      padding: "1rem 1.25rem",
      textAlign: "left",
      fontWeight: 600,
      color: "#475569",
      fontSize: "0.8rem",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    },
    td: {
      padding: "1rem 1.25rem",
      borderBottom: "1px solid #f1f5f9",
      verticalAlign: "middle",
    },
    phoneDisplay: {
      fontWeight: 600,
      color: "#0f172a",
      fontSize: "0.95rem",
      letterSpacing: "0.5px",
    },
    phoneAvatar: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "36px",
      height: "36px",
      borderRadius: "50%",
      backgroundColor: "#6366f1",
      color: "white",
      fontWeight: 700,
      fontSize: "0.8rem",
      marginRight: "0.75rem",
      flexShrink: 0,
    },
    customerInfo: {
      display: "flex",
      alignItems: "center",
    },
    statusBadge: (status) => ({
      display: "inline-flex",
      alignItems: "center",
      gap: "0.375rem",
      padding: "0.375rem 0.875rem",
      borderRadius: "9999px",
      fontSize: "0.75rem",
      fontWeight: 600,
      textTransform: "capitalize",
      backgroundColor: status === "active" ? "#dcfce7" : "#fee2e2",
      color: status === "active" ? "#166534" : "#991b1b",
    }),
    statusDot: (status) => ({
      width: "6px",
      height: "6px",
      borderRadius: "50%",
      backgroundColor: status === "active" ? "#22c55e" : "#ef4444",
      display: "inline-block",
    }),
    viewButton: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.375rem",
      padding: "0.5rem 1.25rem",
      backgroundColor: "#6366f1",
      color: "white",
      border: "none",
      borderRadius: "8px",
      fontSize: "0.8rem",
      fontWeight: 500,
      textDecoration: "none",
      transition: "all 0.15s ease",
      cursor: "pointer",
    },
    emptyState: {
      textAlign: "center",
      padding: "3rem 1.5rem",
      color: "#94a3b8",
    },
    emptyIcon: {
      fontSize: "3rem",
      marginBottom: "0.75rem",
      opacity: 0.5,
    },
    emptyText: {
      fontSize: "1rem",
      fontWeight: 500,
      color: "#64748b",
    },
    loadingContainer: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "60vh",
      gap: "1rem",
    },
    spinner: {
      width: "48px",
      height: "48px",
      border: "4px solid #e2e8f0",
      borderTop: "4px solid #6366f1",
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite",
    },
    loadingText: {
      color: "#64748b",
      fontSize: "1rem",
      fontWeight: 500,
    },
    phone: {
      color: "#475569",
      fontVariantNumeric: "tabular-nums",
    },
    amount: {
      fontWeight: 600,
      color: "#0f172a",
    },
    date: {
      color: "#64748b",
      fontSize: "0.85rem",
    },
    index: {
      color: "#94a3b8",
      fontWeight: 500,
      fontSize: "0.85rem",
    },
    noPhone: {
      color: "#94a3b8",
      fontStyle: "italic",
    },
  };

  // Add keyframe animation for spinner
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <span style={styles.loadingText}>Loading customers...</span>
      </div>
    );
  }

  // Calculate stats safely
  const totalOrders = calculateTotalOrders();
  const totalRevenue = calculateTotalRevenue();
  const activeCustomers = calculateActiveCustomers();

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>
            <i className="fas fa-users" style={{ color: "#6366f1", marginRight: "0.75rem", fontSize: "1.75rem" }}></i>
            Customers
          </h1>
          <span style={styles.badge}>{customers.length} total</span>
        </div>
        <div style={styles.stats}>
          <div style={styles.statItem}>
            <i className="fas fa-user-check" style={{ color: "#22c55e" }}></i>
            <span style={styles.statLabel}>Active</span>
            <span style={styles.statValue}>{activeCustomers}</span>
          </div>
          <div style={styles.statItem}>
            <i className="fas fa-shopping-bag" style={{ color: "#6366f1" }}></i>
            <span style={styles.statLabel}>Orders</span>
            <span style={styles.statValue}>{totalOrders}</span>
          </div>
          <div style={styles.statItem}>
            <i className="fas fa-indian-rupee-sign" style={{ color: "#f59e0b" }}></i>
            <span style={styles.statLabel}>Revenue</span>
            <span style={styles.statValue}>₹{totalRevenue}</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={styles.searchWrapper}>
        <i className="fas fa-search" style={styles.searchIcon}></i>
        <input
          type="text"
          style={styles.searchInput}
          placeholder="Search customers by phone number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={(e) => {
            e.target.style.borderColor = "#6366f1";
            e.target.style.boxShadow = "0 0 0 4px rgba(99, 102, 241, 0.1)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#e2e8f0";
            e.target.style.boxShadow = "none";
          }}
        />
      </div>

      {/* Table */}
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead style={styles.thead}>
            <tr>
              <th style={styles.th}>#</th>
              <th style={styles.th}>Phone Number</th>
              <th style={{ ...styles.th, textAlign: "center" }}>Orders</th>
              <th style={{ ...styles.th, textAlign: "right" }}>Total Spent</th>
              <th style={styles.th}>Last Purchase</th>
              <th style={styles.th}>Status</th>
              <th style={{ ...styles.th, textAlign: "center" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan="7" style={styles.emptyState}>
                  <div style={styles.emptyIcon}>
                    <i className="fas fa-user-slash"></i>
                  </div>
                  <div style={styles.emptyText}>No customers found</div>
                  <div style={{ fontSize: "0.875rem", marginTop: "0.25rem", color: "#cbd5e1" }}>
                    {search ? "Try adjusting your search" : "No customers registered yet"}
                  </div>
                </td>
              </tr>
            ) : (
              filteredCustomers.map((customer, index) => (
                <tr key={customer.id || index}>
                  <td style={{ ...styles.td, ...styles.index }}>{index + 1}</td>
                  <td style={styles.td}>
                    <div style={styles.customerInfo}>
                      <div style={styles.phoneAvatar}>
                        {customer.customer_phone ? customer.customer_phone.slice(-4) : "📱"}
                      </div>
                      <span style={styles.phoneDisplay}>
                        {customer.customer_phone || <span style={styles.noPhone}>No phone</span>}
                      </span>
                    </div>
                  </td>
                  <td style={{ ...styles.td, textAlign: "center", fontWeight: 600 }}>
                    {customer.total_orders || 0}
                  </td>
                  <td style={{ ...styles.td, textAlign: "right", ...styles.amount }}>
                    ₹{(Number(customer.total_spent) || 0).toFixed(2)}
                  </td>
                  <td style={{ ...styles.td, ...styles.date }}>
                    {customer.last_purchase
                      ? new Date(customer.last_purchase).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td style={styles.td}>
                    <span style={styles.statusBadge(customer.status)}>
                      <span style={styles.statusDot(customer.status)}></span>
                      {customer.status || "inactive"}
                    </span>
                  </td>
                  <td style={{ ...styles.td, textAlign: "center" }}>
                    <Link
                      to={`/customers/${customer.id}`}
                      style={styles.viewButton}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = "#4f46e5";
                        e.target.style.transform = "translateY(-1px)";
                        e.target.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.35)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "#6366f1";
                        e.target.style.transform = "none";
                        e.target.style.boxShadow = "none";
                      }}
                    >
                      <i className="fas fa-eye" style={{ fontSize: "0.7rem" }}></i>
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}