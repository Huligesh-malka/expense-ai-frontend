import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../services/api";

export default function CustomerDetails() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomer();
  }, [id]);

  const loadCustomer = async () => {
    try {
      const res = await API.get(`/customers/${id}/history`);
      if (res.data.success) {
        setCustomer(res.data.customer);
        setSales(res.data.sales || []);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
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
    title: {
      fontSize: "2rem",
      fontWeight: 700,
      color: "#0f172a",
      margin: 0,
      letterSpacing: "-0.025em",
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
    },
    backButton: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.6rem 1.5rem",
      backgroundColor: "white",
      color: "#475569",
      border: "2px solid #e2e8f0",
      borderRadius: "10px",
      fontSize: "0.9rem",
      fontWeight: 500,
      textDecoration: "none",
      transition: "all 0.15s ease",
      cursor: "pointer",
    },
    card: {
      backgroundColor: "white",
      borderRadius: "16px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)",
      border: "1px solid #f1f5f9",
      marginBottom: "2rem",
      overflow: "hidden",
    },
    cardBody: {
      padding: "2rem",
    },
    cardHeader: {
      padding: "1.25rem 2rem",
      backgroundColor: "#f8fafc",
      borderBottom: "1px solid #f1f5f9",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    cardTitle: {
      fontSize: "1.1rem",
      fontWeight: 600,
      color: "#0f172a",
      margin: 0,
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "2rem",
    },
    infoGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "0.75rem",
    },
    infoRow: {
      display: "flex",
      alignItems: "flex-start",
      gap: "0.5rem",
    },
    infoLabel: {
      fontWeight: 600,
      color: "#64748b",
      fontSize: "0.875rem",
      minWidth: "110px",
    },
    infoValue: {
      color: "#0f172a",
      fontSize: "0.95rem",
      fontWeight: 500,
      wordBreak: "break-word",
    },
    customerName: {
      fontSize: "1.5rem",
      fontWeight: 700,
      color: "#0f172a",
      marginBottom: "0.5rem",
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
    tableWrapper: {
      overflow: "hidden",
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
      padding: "0.875rem 1.25rem",
      textAlign: "left",
      fontWeight: 600,
      color: "#475569",
      fontSize: "0.8rem",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    },
    td: {
      padding: "0.875rem 1.25rem",
      borderBottom: "1px solid #f1f5f9",
      verticalAlign: "middle",
    },
    paymentBadge: (status) => ({
      padding: "0.25rem 0.75rem",
      borderRadius: "9999px",
      fontSize: "0.75rem",
      fontWeight: 600,
      backgroundColor: status === "Paid" ? "#dcfce7" : "#fef3c7",
      color: status === "Paid" ? "#166534" : "#92400e",
    }),
    viewInvoiceButton: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.375rem",
      padding: "0.4rem 1rem",
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
      padding: "2.5rem 1.5rem",
      color: "#94a3b8",
    },
    emptyIcon: {
      fontSize: "2.5rem",
      marginBottom: "0.5rem",
      opacity: 0.5,
    },
    emptyText: {
      fontSize: "0.95rem",
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
    notFound: {
      textAlign: "center",
      padding: "3rem 1.5rem",
    },
    alert: {
      backgroundColor: "#fee2e2",
      color: "#991b1b",
      padding: "1rem 1.5rem",
      borderRadius: "12px",
      border: "1px solid #fecaca",
      marginBottom: "1.5rem",
      fontSize: "0.95rem",
    },
    statsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "1rem",
      marginBottom: "1.5rem",
    },
    statCard: {
      backgroundColor: "#f8fafc",
      padding: "1rem 1.25rem",
      borderRadius: "10px",
      border: "1px solid #f1f5f9",
    },
    statLabel: {
      fontSize: "0.75rem",
      fontWeight: 600,
      color: "#64748b",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    },
    statValue: {
      fontSize: "1.25rem",
      fontWeight: 700,
      color: "#0f172a",
      marginTop: "0.25rem",
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
        <span style={styles.loadingText}>Loading customer details...</span>
      </div>
    );
  }

  if (!customer) {
    return (
      <div style={{ ...styles.container, ...styles.notFound }}>
        <div style={styles.alert}>
          <i className="fas fa-exclamation-triangle" style={{ marginRight: "0.5rem" }}></i>
          Customer not found.
        </div>
        <Link to="/customers" style={styles.backButton}>
          <i className="fas fa-arrow-left"></i>
          Back to Customers
        </Link>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>
          <i className="fas fa-user-circle" style={{ color: "#6366f1", fontSize: "1.75rem" }}></i>
          Customer Details
        </h1>
        <Link
          to="/customers"
          style={styles.backButton}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#f8fafc";
            e.target.style.borderColor = "#cbd5e1";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "white";
            e.target.style.borderColor = "#e2e8f0";
          }}
        >
          <i className="fas fa-arrow-left"></i>
          Back
        </Link>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Orders</div>
          <div style={styles.statValue}>{customer.total_orders || 0}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Spent</div>
          <div style={styles.statValue}>
            ₹{(Number(customer.total_spent) || 0).toFixed(2)}
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Last Purchase</div>
          <div style={styles.statValue} style={{ fontSize: "0.9rem" }}>
            {customer.last_purchase
              ? new Date(customer.last_purchase).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "—"}
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Status</div>
          <div style={styles.statValue}>
            <span style={styles.statusBadge(customer.status)}>
              <span style={styles.statusDot(customer.status)}></span>
              {customer.status || "inactive"}
            </span>
          </div>
        </div>
      </div>

      {/* Customer Information Card */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h4 style={styles.cardTitle}>
            <i className="fas fa-id-card" style={{ color: "#6366f1" }}></i>
            Personal Information
          </h4>
        </div>
        <div style={styles.cardBody}>
          <div style={styles.customerName}>
            {customer.customer_name}
          </div>
          <div style={styles.grid}>
            <div style={styles.infoGroup}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>
                  <i className="fas fa-phone" style={{ color: "#6366f1", width: "16px", marginRight: "8px" }}></i>
                  Phone
                </span>
                <span style={styles.infoValue}>{customer.customer_phone || "—"}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>
                  <i className="fas fa-map-marker-alt" style={{ color: "#6366f1", width: "16px", marginRight: "8px" }}></i>
                  Address
                </span>
                <span style={styles.infoValue}>{customer.address || "—"}</span>
              </div>
            </div>
            <div style={styles.infoGroup}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>
                  <i className="fas fa-calendar-alt" style={{ color: "#6366f1", width: "16px", marginRight: "8px" }}></i>
                  Member Since
                </span>
                <span style={styles.infoValue}>
                  {customer.created_at
                    ? new Date(customer.created_at).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })
                    : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase History */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h4 style={styles.cardTitle}>
            <i className="fas fa-shopping-bag" style={{ color: "#6366f1" }}></i>
            Purchase History
          </h4>
          <span style={{ fontSize: "0.875rem", color: "#64748b" }}>
            {sales.length} orders
          </span>
        </div>
        <div style={styles.cardBody}>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead style={styles.thead}>
                <tr>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Invoice</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Payment</th>
                  <th style={styles.th}>Status</th>
                  <th style={{ ...styles.th, textAlign: "right" }}>Total</th>
                  <th style={{ ...styles.th, textAlign: "center" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={styles.emptyState}>
                      <div style={styles.emptyIcon}>
                        <i className="fas fa-receipt"></i>
                      </div>
                      <div style={styles.emptyText}>No purchase history</div>
                      <div style={{ fontSize: "0.875rem", marginTop: "0.25rem", color: "#cbd5e1" }}>
                        This customer hasn't made any purchases yet
                      </div>
                    </td>
                  </tr>
                ) : (
                  sales.map((sale, index) => (
                    <tr key={sale.id}>
                      <td style={{ ...styles.td, color: "#94a3b8", fontWeight: 500 }}>
                        {index + 1}
                      </td>
                      <td style={{ ...styles.td, fontWeight: 600 }}>
                        <span style={{ color: "#6366f1" }}>#{sale.invoice_no}</span>
                      </td>
                      <td style={styles.td}>
                        {new Date(sale.created_at).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td style={styles.td}>
                        <span style={{ textTransform: "capitalize" }}>
                          {sale.payment_method || "—"}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.paymentBadge(sale.payment_status)}>
                          {sale.payment_status || "Pending"}
                        </span>
                      </td>
                      <td style={{ ...styles.td, textAlign: "right", fontWeight: 600 }}>
                        ₹{(Number(sale.total_amount) || 0).toFixed(2)}
                      </td>
                      <td style={{ ...styles.td, textAlign: "center" }}>
                        <Link
                          to={`/invoice/${sale.id}`}
                          style={styles.viewInvoiceButton}
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
                          <i className="fas fa-file-invoice"></i>
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
      </div>
    </div>
  );
}