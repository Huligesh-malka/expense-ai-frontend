import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiArrowLeft,
  FiEdit,
  FiTrash2,
  FiTruck,
  FiPhone,
  FiMail,
  FiMapPin,
  FiHash,
  FiUser,
  FiFileText,
  FiCalendar,
  FiClock,
  FiInfo,
  FiCreditCard,
  FiGlobe,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle
} from "react-icons/fi";

export default function ViewSupplier() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSupplier();
  }, [id]);

  const loadSupplier = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/suppliers/${id}`
      );
      setSupplier(res.data.data);
    } catch (err) {
      console.log(err);
      alert("Failed to load supplier details");
      navigate("/suppliers");
    } finally {
      setLoading(false);
    }
  };

  const deleteSupplier = async () => {
    const ok = window.confirm(
      "Are you sure you want to delete this supplier?"
    );
    if (!ok) return;

    try {
      await axios.delete(`http://localhost:5000/api/suppliers/${id}`);
      alert("Supplier deleted successfully.");
      navigate("/suppliers");
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Failed to delete supplier.");
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      active: "#22c55e",
      inactive: "#ef4444",
      pending: "#f59e0b"
    };
    return statusColors[status?.toLowerCase()] || "#6b7280";
  };

  const getStatusIcon = (status) => {
    const statusIcons = {
      active: <FiCheckCircle size={16} />,
      inactive: <FiXCircle size={16} />,
      pending: <FiAlertCircle size={16} />
    };
    return statusIcons[status?.toLowerCase()] || <FiInfo size={16} />;
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          fontSize: 18,
          color: "#6b7280"
        }}
      >
        <div style={{ display: "inline-block" }}>
          <div
            style={{
              width: 40,
              height: 40,
              border: "4px solid #e5e7eb",
              borderTop: "4px solid #2563eb",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px"
            }}
          />
          <p>Loading supplier details...</p>
        </div>
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

  if (!supplier) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          fontSize: 18,
          color: "#6b7280"
        }}
      >
        Supplier not found
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 30,
        background: "#f5f7fb",
        minHeight: "100vh"
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 25,
          flexWrap: "wrap",
          gap: 15
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link to="/suppliers">
            <button
              style={{
                background: "#fff",
                color: "#1f2937",
                border: "1px solid #e5e7eb",
                padding: "10px 16px",
                borderRadius: 10,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#f3f4f6";
                e.target.style.borderColor = "#d1d5db";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "#fff";
                e.target.style.borderColor = "#e5e7eb";
              }}
            >
              <FiArrowLeft />
              Back
            </button>
          </Link>
          <div>
            <h1 style={{ margin: 0, color: "#1f2937" }}>
              Supplier Details
            </h1>
            <p style={{ color: "#6b7280", margin: "4px 0 0" }}>
              View complete supplier information
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link to={`/edit-supplier/${supplier.id}`}>
            <button
              style={{
                background: "#f59e0b",
                color: "#fff",
                border: "none",
                padding: "10px 20px",
                borderRadius: 10,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "background 0.2s"
              }}
              onMouseEnter={(e) =>
                (e.target.style.background = "#d97706")
              }
              onMouseLeave={(e) =>
                (e.target.style.background = "#f59e0b")
              }
            >
              <FiEdit />
              Edit Supplier
            </button>
          </Link>
          <button
            onClick={deleteSupplier}
            style={{
              background: "#ef4444",
              color: "#fff",
              border: "none",
              padding: "10px 20px",
              borderRadius: 10,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "background 0.2s"
            }}
            onMouseEnter={(e) =>
              (e.target.style.background = "#dc2626")
            }
            onMouseLeave={(e) =>
              (e.target.style.background = "#ef4444")
            }
          >
            <FiTrash2 />
            Delete
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: "grid", gap: 24 }}>
        {/* Profile Card */}
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 30,
            boxShadow: "0 2px 8px rgba(0,0,0,.08)"
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              flexWrap: "wrap"
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "#e0f2fe",
                display: "flex",
                justifyContent: "center",
                alignItems: "center"
              }}
            >
              <FiTruck size={40} color="#2563eb" />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, color: "#1f2937" }}>
                {supplier.supplier_name}
              </h2>
              <p style={{ margin: "4px 0", color: "#6b7280" }}>
                {supplier.company_name || "No company name"}
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 8
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 14px",
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 600,
                    background: getStatusColor(supplier.status),
                    color: "#fff"
                  }}
                >
                  {getStatusIcon(supplier.status)}
                  {supplier.status || "Active"}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    color: "#6b7280"
                  }}
                >
                  ID: #{supplier.id}
                </span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: 14,
                  color: "#6b7280"
                }}
              >
                Opening Balance
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color:
                    supplier.opening_balance < 0
                      ? "#ef4444"
                      : "#22c55e"
                }}
              >
                ₹{Number(supplier.opening_balance || 0).toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Left Column - Contact Info */}
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 24,
              boxShadow: "0 2px 8px rgba(0,0,0,.08)"
            }}
          >
            <h3
              style={{
                margin: "0 0 20px",
                color: "#1f2937",
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              <FiUser />
              Contact Information
            </h3>

            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <div
                  style={{
                    fontSize: 13,
                    color: "#6b7280",
                    marginBottom: 4
                  }}
                >
                  <FiPhone style={{ marginRight: 6 }} />
                  Phone Number
                </div>
                <div style={{ fontSize: 15, color: "#1f2937" }}>
                  {supplier.supplier_phone || "-"}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: 13,
                    color: "#6b7280",
                    marginBottom: 4
                  }}
                >
                  <FiMail style={{ marginRight: 6 }} />
                  Email Address
                </div>
                <div style={{ fontSize: 15, color: "#1f2937" }}>
                  {supplier.supplier_email || "-"}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: 13,
                    color: "#6b7280",
                    marginBottom: 4
                  }}
                >
                  <FiGlobe style={{ marginRight: 6 }} />
                  GST Number
                </div>
                <div style={{ fontSize: 15, color: "#1f2937" }}>
                  {supplier.gst_number || "-"}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Address */}
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 24,
              boxShadow: "0 2px 8px rgba(0,0,0,.08)"
            }}
          >
            <h3
              style={{
                margin: "0 0 20px",
                color: "#1f2937",
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              <FiMapPin />
              Address Details
            </h3>

            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <div
                  style={{
                    fontSize: 13,
                    color: "#6b7280",
                    marginBottom: 4
                  }}
                >
                  Address
                </div>
                <div style={{ fontSize: 15, color: "#1f2937" }}>
                  {supplier.address || "-"}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "#6b7280",
                      marginBottom: 4
                    }}
                  >
                    City
                  </div>
                  <div style={{ fontSize: 15, color: "#1f2937" }}>
                    {supplier.city || "-"}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "#6b7280",
                      marginBottom: 4
                    }}
                  >
                    State
                  </div>
                  <div style={{ fontSize: 15, color: "#1f2937" }}>
                    {supplier.state || "-"}
                  </div>
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: 13,
                    color: "#6b7280",
                    marginBottom: 4
                  }}
                >
                  <FiHash style={{ marginRight: 6 }} />
                  Pincode
                </div>
                <div style={{ fontSize: 15, color: "#1f2937" }}>
                  {supplier.pincode || "-"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 24,
            boxShadow: "0 2px 8px rgba(0,0,0,.08)"
          }}
        >
          <h3
            style={{
              margin: "0 0 20px",
              color: "#1f2937",
              fontSize: 16,
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            <FiFileText />
            Additional Information
          </h3>

          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <div
                style={{
                  fontSize: 13,
                  color: "#6b7280",
                  marginBottom: 4
                }}
              >
                Notes
              </div>
              <div
                style={{
                  fontSize: 15,
                  color: "#1f2937",
                  background: "#f9fafb",
                  padding: 12,
                  borderRadius: 8,
                  minHeight: 60
                }}
              >
                {supplier.notes || "No notes available"}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                paddingTop: 16,
                borderTop: "1px solid #e5e7eb"
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 13,
                    color: "#6b7280",
                    marginBottom: 4,
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  <FiCalendar />
                  Created At
                </div>
                <div style={{ fontSize: 14, color: "#1f2937" }}>
                  {formatDate(supplier.created_at)}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 13,
                    color: "#6b7280",
                    marginBottom: 4,
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  <FiClock />
                  Last Updated
                </div>
                <div style={{ fontSize: 14, color: "#1f2937" }}>
                  {formatDate(supplier.updated_at)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}