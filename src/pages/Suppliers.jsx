import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api"; // Use centralized API service
import {
  FiPlus,
  FiSearch,
  FiEdit,
  FiTrash2,
  FiEye,
  FiTruck,
  FiPhone,
  FiMail
} from "react-icons/fi";

export default function Suppliers() {
  const businessId = localStorage.getItem("businessId");
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const res = await API.get(`/suppliers?business_id=${businessId}`);
      setSuppliers(res.data.data || []);
    } catch (err) {
      console.error("Error loading suppliers:", err);
      alert("Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  };

  const deleteSupplier = async (id) => {
    const ok = window.confirm(
      "Are you sure you want to delete this supplier?"
    );
    if (!ok) return;

    try {
      await API.delete(`/suppliers/${id}`);
      alert("Supplier deleted successfully.");
      loadSuppliers();
    } catch (err) {
      console.error("Error deleting supplier:", err);
      alert(
        err.response?.data?.message ||
        "Failed to delete supplier."
      );
    }
  };

  const filteredSuppliers = suppliers.filter((item) =>
    item.supplier_name
      ?.toLowerCase()
      .includes(search.toLowerCase()) ||

    (item.company_name || "")
      ?.toLowerCase()
      .includes(search.toLowerCase()) ||

    (item.supplier_phone || "")
      ?.includes(search)
  );

  // Get status color
  const getStatusColor = (status) => {
    const statusColors = {
      'active': '#22c55e',
      'inactive': '#ef4444',
      'pending': '#f59e0b'
    };
    return statusColors[status?.toLowerCase()] || '#6b7280';
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>Loading Suppliers...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Suppliers</h1>
          <p style={styles.subtitle}>Manage all suppliers</p>
        </div>
        <Link to="/add-supplier" style={styles.primaryButton}>
          <FiPlus size={18} />
          Add Supplier
        </Link>
      </div>

      {/* Search */}
      <div style={styles.searchSection}>
        <div style={styles.searchWrapper}>
          <FiSearch size={18} color="#9ca3af" style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by supplier name, company or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <span style={styles.resultCount}>
          {filteredSuppliers.length} supplier{filteredSuppliers.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Supplier</th>
              <th style={styles.th}>Phone</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Opening Balance</th>
              <th style={styles.th}>Status</th>
              <th style={{...styles.th, textAlign: "center"}}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredSuppliers.length === 0 && (
              <tr>
                <td colSpan="6" style={styles.emptyState}>
                  <div style={styles.emptyIcon}>📦</div>
                  <p style={styles.emptyText}>
                    {search ? "No matching suppliers found" : "No suppliers added yet"}
                  </p>
                  {!search && (
                    <Link to="/add-supplier" style={styles.emptyButton}>
                      Add your first supplier
                    </Link>
                  )}
                </td>
              </tr>
            )}
            {filteredSuppliers.map((supplier) => (
              <tr key={supplier.id} style={styles.tableRow}>
                <td>
                  <div style={styles.supplierCell}>
                    <div style={styles.supplierAvatar}>
                      <FiTruck size={20} color="#3b82f6" />
                    </div>
                    <div>
                      <div style={styles.supplierName}>
                        {supplier.supplier_name}
                      </div>
                      <div style={styles.companyName}>
                        {supplier.company_name || "-"}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={styles.contactCell}>
                    <FiPhone size={14} color="#94a3b8" />
                    {supplier.supplier_phone || "-"}
                  </div>
                </td>
                <td>
                  <div style={styles.contactCell}>
                    <FiMail size={14} color="#94a3b8" />
                    {supplier.supplier_email || "-"}
                  </div>
                </td>
                <td>
                  <span style={styles.balance}>
                    ₹{Number(supplier.opening_balance || 0).toFixed(2)}
                  </span>
                </td>
                <td>
                  <span style={{
                    ...styles.statusBadge,
                    background: getStatusColor(supplier.status),
                    color: "#fff"
                  }}>
                    {supplier.status || "Active"}
                  </span>
                </td>
                <td>
                  <div style={styles.actionButtons}>
                    <Link to={`/supplier/${supplier.id}`} style={styles.viewButton} title="View Supplier">
                      <FiEye size={14} />
                    </Link>
                    <Link to={`/edit-supplier/${supplier.id}`} style={styles.editButton} title="Edit Supplier">
                      <FiEdit size={14} />
                    </Link>
                    <button
                      onClick={() => deleteSupplier(supplier.id)}
                      style={styles.deleteButton}
                      title="Delete Supplier"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "30px",
    maxWidth: "1440px",
    margin: "0 auto",
    background: "#f8fafc",
    minHeight: "100vh",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "30px",
    flexWrap: "wrap",
    gap: "15px"
  },
  title: {
    margin: 0,
    fontSize: "28px",
    fontWeight: "700",
    color: "#0f172a",
    letterSpacing: "-0.5px"
  },
  subtitle: {
    margin: "4px 0 0",
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "400"
  },
  primaryButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#3b82f6",
    padding: "12px 24px",
    color: "#fff",
    textDecoration: "none",
    borderRadius: "10px",
    fontWeight: "600",
    fontSize: "14px",
    transition: "all 0.2s",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)"
  },
  searchSection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "15px",
    marginBottom: "24px",
    background: "#fff",
    padding: "16px 20px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0"
  },
  searchWrapper: {
    display: "flex",
    alignItems: "center",
    background: "#f1f5f9",
    borderRadius: "8px",
    padding: "0 12px",
    flex: 1,
    minWidth: "200px",
    transition: "all 0.2s"
  },
  searchIcon: {
    marginRight: "8px"
  },
  searchInput: {
    border: "none",
    background: "transparent",
    padding: "10px 0",
    fontSize: "14px",
    outline: "none",
    width: "100%",
    color: "#0f172a"
  },
  resultCount: {
    fontSize: "14px",
    color: "#64748b",
    fontWeight: "500",
    whiteSpace: "nowrap"
  },
  tableContainer: {
    background: "#fff",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    overflowX: "auto",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
    minWidth: "800px"
  },
  th: {
    padding: "16px 20px",
    textAlign: "left",
    fontWeight: "600",
    color: "#475569",
    borderBottom: "2px solid #e2e8f0",
    background: "#f8fafc",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },
  tableRow: {
    borderBottom: "1px solid #f1f5f9",
    transition: "background 0.15s"
  },
  supplierCell: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  supplierAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    background: "#dbeafe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  supplierName: {
    fontWeight: "600",
    color: "#0f172a"
  },
  companyName: {
    fontSize: "13px",
    color: "#94a3b8"
  },
  contactCell: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#0f172a"
  },
  balance: {
    fontWeight: "600",
    color: "#0f172a"
  },
  statusBadge: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "capitalize"
  },
  actionButtons: {
    display: "flex",
    gap: "6px",
    justifyContent: "center"
  },
  viewButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#10b981",
    color: "#fff",
    padding: "8px 10px",
    textDecoration: "none",
    borderRadius: "6px",
    transition: "all 0.2s",
    border: "none",
    cursor: "pointer"
  },
  editButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f59e0b",
    color: "#fff",
    padding: "8px 10px",
    textDecoration: "none",
    borderRadius: "6px",
    transition: "all 0.2s",
    border: "none",
    cursor: "pointer"
  },
  deleteButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#fee2e2",
    color: "#dc2626",
    padding: "8px 10px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.2s"
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px",
    background: "#fff",
    borderRadius: "12px",
    border: "1px solid #e2e8f0"
  },
  loadingSpinner: {
    border: "3px solid #f1f5f9",
    borderTop: "3px solid #3b82f6",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    animation: "spin 0.8s linear infinite"
  },
  loadingText: {
    marginTop: "16px",
    color: "#64748b",
    fontSize: "14px"
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    color: "#94a3b8"
  },
  emptyIcon: {
    fontSize: "48px",
    marginBottom: "16px"
  },
  emptyText: {
    fontSize: "16px",
    marginBottom: "12px",
    color: "#64748b"
  },
  emptyButton: {
    display: "inline-block",
    padding: "10px 24px",
    background: "#3b82f6",
    color: "#fff",
    textDecoration: "none",
    borderRadius: "8px",
    fontWeight: "500",
    transition: "all 0.2s"
  }
};

// Add keyframe animation
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);