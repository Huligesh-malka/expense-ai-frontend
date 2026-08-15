import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import {
  FiPlus,
  FiSearch,
  FiEdit,
  FiTrash2,
  FiEye,
  FiTruck,
  FiPhone,
  FiMail,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight
} from "react-icons/fi";

export default function Suppliers() {
  const businessId = localStorage.getItem("businessId");
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const res = await API.get(`/suppliers?business_id=${businessId}`);
      setSuppliers(res.data.data || []);
      setTotalItems(res.data.data?.length || 0);
    } catch (err) {
      console.error("Error loading suppliers:", err);
      if (err.response?.status === 401) {
        alert("Session expired. Please login again.");
        window.location.href = "/login";
      } else {
        alert(err.response?.data?.message || "Failed to load suppliers");
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteSupplier = async (id) => {
    const ok = window.confirm(
      "Are you sure you want to delete this supplier?\nThis action cannot be undone."
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
        "Failed to delete supplier. Please try again."
      );
    }
  };

  // Filter suppliers based on search
  const filteredSuppliers = suppliers.filter((item) => {
    const searchLower = search.toLowerCase();
    return (
      (item.supplier_name || "")
        ?.toLowerCase()
        .includes(searchLower) ||
      (item.company_name || "")
        ?.toLowerCase()
        .includes(searchLower) ||
      (item.supplier_phone || "")
        ?.includes(search) ||
      (item.supplier_email || "")
        ?.toLowerCase()
        .includes(searchLower)
    );
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSuppliers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    const statusColors = {
      'active': '#22c55e',
      'inactive': '#ef4444',
      'pending': '#f59e0b',
      'suspended': '#8b5cf6',
      'blacklisted': '#dc2626'
    };
    return statusColors[status?.toLowerCase()] || '#6b7280';
  };

  // Get status label
  const getStatusLabel = (status) => {
    return status || "Active";
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return "-";
    }
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
          <p style={styles.subtitle}>
            Manage all suppliers • {totalItems} total
          </p>
        </div>
        <Link to="/add-supplier" style={styles.primaryButton}>
          <FiPlus size={18} />
          Add Supplier
        </Link>
      </div>

      {/* Search and Filter Section */}
      <div style={styles.searchSection}>
        <div style={styles.searchWrapper}>
          <FiSearch size={18} color="#9ca3af" style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by supplier name, company, phone or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
            style={styles.searchInput}
            aria-label="Search suppliers"
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                setCurrentPage(1);
              }}
              style={styles.clearButton}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        <div style={styles.statsContainer}>
          <span style={styles.resultCount}>
            {filteredSuppliers.length} supplier{filteredSuppliers.length !== 1 ? "s" : ""}
            {search && ` (filtered from ${totalItems})`}
          </span>
        </div>
      </div>

      {/* Table */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Supplier</th>
              <th style={styles.th}>Contact</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Opening Balance</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Added</th>
              <th style={{...styles.th, textAlign: "center"}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan="7" style={styles.emptyState}>
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
            ) : (
              currentItems.map((supplier) => (
                <tr key={supplier.id} style={styles.tableRow}>
                  <td>
                    <div style={styles.supplierCell}>
                      <div style={styles.supplierAvatar}>
                        <FiTruck size={20} color="#3b82f6" />
                      </div>
                      <div>
                        <div style={styles.supplierName}>
                          {supplier.supplier_name || "Unnamed"}
                        </div>
                        <div style={styles.companyName}>
                          {supplier.company_name || "No company"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={styles.contactCell}>
                      <FiPhone size={14} color="#94a3b8" />
                      <span>{supplier.supplier_phone || "-"}</span>
                    </div>
                  </td>
                  <td>
                    <div style={styles.contactCell}>
                      <FiMail size={14} color="#94a3b8" />
                      <span style={styles.emailText}>
                        {supplier.supplier_email || "-"}
                      </span>
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
                      {getStatusLabel(supplier.status)}
                    </span>
                  </td>
                  <td style={styles.dateCell}>
                    {formatDate(supplier.created_at)}
                  </td>
                  <td>
                    <div style={styles.actionButtons}>
                      <Link 
                        to={`/supplier/${supplier.id}`} 
                        style={styles.viewButton} 
                        title="View Supplier Details"
                        aria-label={`View ${supplier.supplier_name}`}
                      >
                        <FiEye size={14} />
                      </Link>
                      <Link 
                        to={`/edit-supplier/${supplier.id}`} 
                        style={styles.editButton} 
                        title="Edit Supplier"
                        aria-label={`Edit ${supplier.supplier_name}`}
                      >
                        <FiEdit size={14} />
                      </Link>
                      <button
                        onClick={() => deleteSupplier(supplier.id)}
                        style={styles.deleteButton}
                        title="Delete Supplier"
                        aria-label={`Delete ${supplier.supplier_name}`}
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredSuppliers.length > 0 && (
        <div style={styles.paginationContainer}>
          <div style={styles.paginationInfo}>
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredSuppliers.length)} of {filteredSuppliers.length} suppliers
          </div>
          <div style={styles.paginationControls}>
            <button
              onClick={() => paginate(1)}
              disabled={currentPage === 1}
              style={{
                ...styles.paginationButton,
                opacity: currentPage === 1 ? 0.5 : 1,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
              aria-label="First page"
            >
              <FiChevronsLeft size={16} />
            </button>
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                ...styles.paginationButton,
                opacity: currentPage === 1 ? 0.5 : 1,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
              aria-label="Previous page"
            >
              <FiChevronLeft size={16} />
            </button>
            
            <span style={styles.pageInfo}>
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{
                ...styles.paginationButton,
                opacity: currentPage === totalPages ? 0.5 : 1,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
              aria-label="Next page"
            >
              <FiChevronRight size={16} />
            </button>
            <button
              onClick={() => paginate(totalPages)}
              disabled={currentPage === totalPages}
              style={{
                ...styles.paginationButton,
                opacity: currentPage === totalPages ? 0.5 : 1,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
              aria-label="Last page"
            >
              <FiChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}
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
    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
    ':hover': {
      background: "#2563eb",
      transform: "translateY(-2px)",
      boxShadow: "0 6px 16px rgba(59, 130, 246, 0.4)"
    }
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
    transition: "all 0.2s",
    position: "relative"
  },
  searchIcon: {
    marginRight: "8px",
    flexShrink: 0
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
  clearButton: {
    background: "none",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    padding: "4px 8px",
    fontSize: "14px",
    borderRadius: "4px",
    transition: "all 0.2s",
    ':hover': {
      background: "#e2e8f0",
      color: "#475569"
    }
  },
  statsContainer: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
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
    minWidth: "1000px"
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
    transition: "background 0.15s",
    ':hover': {
      background: "#f8fafc"
    }
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
  emailText: {
    color: "#0f172a",
    wordBreak: "break-all"
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
  dateCell: {
    color: "#64748b",
    fontSize: "13px"
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
    cursor: "pointer",
    ':hover': {
      background: "#059669",
      transform: "scale(1.05)"
    }
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
    cursor: "pointer",
    ':hover': {
      background: "#d97706",
      transform: "scale(1.05)"
    }
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
    transition: "all 0.2s",
    ':hover': {
      background: "#fecaca",
      transform: "scale(1.05)"
    }
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
    transition: "all 0.2s",
    ':hover': {
      background: "#2563eb",
      transform: "translateY(-2px)"
    }
  },
  paginationContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "20px",
    padding: "16px 20px",
    background: "#fff",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    flexWrap: "wrap",
    gap: "12px"
  },
  paginationInfo: {
    fontSize: "14px",
    color: "#64748b"
  },
  paginationControls: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  paginationButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 10px",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    background: "#fff",
    color: "#475569",
    cursor: "pointer",
    transition: "all 0.2s",
    ':hover': {
      background: "#f1f5f9",
      borderColor: "#94a3b8"
    },
    ':disabled': {
      opacity: 0.5,
      cursor: "not-allowed"
    }
  },
  pageInfo: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#0f172a",
    padding: "0 12px"
  }
};

// Add keyframe animation
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .supplier-row:hover {
      background-color: #f8fafc !important;
    }
    
    .action-button:hover {
      transform: scale(1.05);
    }
    
    @media (max-width: 640px) {
      .pagination-container {
        flex-direction: column;
        align-items: stretch;
      }
      .pagination-controls {
        justify-content: center;
      }
    }
  `;
  document.head.appendChild(styleSheet);
}