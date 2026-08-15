import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import API from "../services/api";
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
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(true);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [referenceNo, setReferenceNo] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentSaving, setPaymentSaving] = useState(false);

  const [showHistory, setShowHistory] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [historyPurchase, setHistoryPurchase] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    loadSupplier();
  }, [id]);

  const loadSupplier = async () => {
    try {
      const [supplierRes, purchaseRes] = await Promise.all([
        API.get(`/suppliers/${id}`),
        API.get(`/purchases/suppliers/${id}/purchases`)
      ]);

      setSupplier(supplierRes.data.data);
      setPurchases(purchaseRes.data.data || []);

    } catch (err) {
      console.log(err);
      alert(
        err.response?.data?.message ||
        "Failed to load supplier details"
      );

      navigate("/suppliers");
    } finally {
      setLoading(false);
      setPurchaseLoading(false);
    }
  };

  const openPaymentModal = (purchase) => {
    const balance = Number(purchase.due_amount || 0);

    if (balance <= 0) {
      return;
    }

    setSelectedPurchase(purchase);
    setPaymentAmount(balance.toFixed(2));
    setPaymentMethod("Cash");
    setReferenceNo("");
    setPaymentNotes("");
    setShowPaymentModal(true);
  };

  const submitPayment = async () => {
    if (!selectedPurchase) return;

    const amount = Number(paymentAmount);
    const balance = Number(selectedPurchase.due_amount || 0);

    if (!amount || amount <= 0) {
      alert("Enter a valid payment amount");
      return;
    }

    if (amount > balance) {
      alert(
        `Payment cannot be greater than ₹${balance.toFixed(2)}`
      );
      return;
    }

    try {
      setPaymentSaving(true);

      await API.post(
        `/purchases/${selectedPurchase.id}/payments`,
        {
          amount,
          payment_method: paymentMethod,
          reference_no: referenceNo || null,
          notes: paymentNotes || null
        }
      );

      alert("Payment recorded successfully.");

      setShowPaymentModal(false);
      setSelectedPurchase(null);

      // Reload supplier + invoices
      await loadSupplier();

    } catch (err) {
      console.log(err);

      alert(
        err.response?.data?.message ||
        "Failed to record payment"
      );
    } finally {
      setPaymentSaving(false);
    }
  };

  const openPaymentHistory = async (purchase) => {
    try {
      setHistoryPurchase(purchase);
      setShowHistory(true);
      setHistoryLoading(true);

      const res = await API.get(
        `/purchases/${purchase.id}/payments`
      );

      setPaymentHistory(res.data.data || []);

    } catch (err) {
      console.log(err);

      alert(
        err.response?.data?.message ||
        "Failed to load payment history"
      );
    } finally {
      setHistoryLoading(false);
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

  const thStyle = {
    padding: "12px 14px",
    textAlign: "left",
    fontSize: 13,
    color: "#6b7280",
    fontWeight: 600
  };

  const tdStyle = {
    padding: "14px",
    fontSize: 14,
    color: "#1f2937"
  };

  const labelStyle = {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 6
  };

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    fontSize: 14,
    outline: "none"
  };

  const cancelButtonStyle = {
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#374151",
    padding: "10px 16px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600
  };

  const payButtonStyle = {
    border: "none",
    background: "#2563eb",
    color: "#fff",
    padding: "10px 18px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600
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

        {/* Purchase Invoices */}
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 24,
            boxShadow: "0 2px 8px rgba(0,0,0,.08)"
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
              flexWrap: "wrap",
              gap: 10
            }}
          >
            <h3
              style={{
                margin: 0,
                color: "#1f2937",
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              <FiCreditCard />
              Purchase Invoices
            </h3>

            <span
              style={{
                background: "#eff6ff",
                color: "#2563eb",
                padding: "6px 12px",
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600
              }}
            >
              {purchases.length} Invoice
              {purchases.length !== 1 ? "s" : ""}
            </span>
          </div>

          {purchaseLoading ? (
            <div
              style={{
                textAlign: "center",
                padding: 30,
                color: "#6b7280"
              }}
            >
              Loading purchase invoices...
            </div>
          ) : purchases.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: 40,
                background: "#f9fafb",
                borderRadius: 10,
                color: "#6b7280"
              }}
            >
              <FiFileText size={30} />
              <div style={{ marginTop: 10 }}>
                No purchase invoices found for this supplier.
              </div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: 1000
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "#f9fafb",
                      borderBottom: "1px solid #e5e7eb"
                    }}
                  >
                    <th style={thStyle}>Invoice</th>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Total</th>
                    <th style={thStyle}>Paid</th>
                    <th style={thStyle}>Balance</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {purchases.map((purchase) => {
                    const total = Number(purchase.total_amount || 0);
                    const paid = Number(purchase.paid_amount || 0);
                    const balance = Number(purchase.due_amount || 0);

                    let status = "Unpaid";

                    if (balance <= 0) {
                      status = "Paid";
                    } else if (paid > 0) {
                      status = "Partial";
                    }

                    return (
                      <tr
                        key={purchase.id}
                        style={{
                          borderBottom: "1px solid #f1f5f9"
                        }}
                      >
                        <td style={tdStyle}>
                          <strong>{purchase.invoice_no}</strong>
                        </td>

                        <td style={tdStyle}>
                          {formatDate(purchase.created_at)}
                        </td>

                        <td style={tdStyle}>
                          ₹{total.toFixed(2)}
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            color: "#16a34a",
                            fontWeight: 600
                          }}
                        >
                          ₹{paid.toFixed(2)}
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            color: balance > 0 ? "#dc2626" : "#16a34a",
                            fontWeight: 700
                          }}
                        >
                          ₹{balance.toFixed(2)}
                        </td>

                        <td style={tdStyle}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              padding: "5px 12px",
                              borderRadius: 20,
                              fontSize: 12,
                              fontWeight: 600,

                              background:
                                status === "Paid"
                                  ? "#dcfce7"
                                  : status === "Partial"
                                  ? "#fef3c7"
                                  : "#fee2e2",

                              color:
                                status === "Paid"
                                  ? "#166534"
                                  : status === "Partial"
                                  ? "#92400e"
                                  : "#991b1b"
                            }}
                          >
                            {status === "Paid" && <FiCheckCircle />}
                            {status === "Partial" && <FiAlertCircle />}
                            {status === "Unpaid" && <FiXCircle />}

                            {status}
                          </span>
                        </td>

                        <td style={tdStyle}>
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              alignItems: "center",
                              flexWrap: "wrap"
                            }}
                          >
                            {balance > 0 && (
                              <button
                                onClick={() => openPaymentModal(purchase)}
                                style={{
                                  border: "none",
                                  background: "#2563eb",
                                  color: "#fff",
                                  padding: "7px 12px",
                                  borderRadius: 7,
                                  cursor: "pointer",
                                  fontSize: 12,
                                  fontWeight: 600
                                }}
                              >
                                Pay ₹{balance.toFixed(2)}
                              </button>
                            )}

                            <button
                              onClick={() => openPaymentHistory(purchase)}
                              style={{
                                border: "1px solid #d1d5db",
                                background: "#fff",
                                color: "#374151",
                                padding: "7px 12px",
                                borderRadius: 7,
                                cursor: "pointer",
                                fontSize: 12,
                                fontWeight: 600
                              }}
                            >
                              History
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedPurchase && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 20
          }}
        >
          <div
            style={{
              background: "#fff",
              width: "100%",
              maxWidth: 500,
              borderRadius: 14,
              padding: 24,
              boxShadow: "0 20px 50px rgba(0,0,0,.2)"
            }}
          >
            <h2
              style={{
                margin: "0 0 20px",
                fontSize: 20,
                color: "#111827"
              }}
            >
              Pay Purchase Balance
            </h2>

            <div
              style={{
                background: "#f9fafb",
                padding: 16,
                borderRadius: 10,
                marginBottom: 20
              }}
            >
              <div style={{ marginBottom: 10 }}>
                <span style={{ color: "#6b7280", fontSize: 13 }}>
                  Invoice
                </span>

                <div
                  style={{
                    fontWeight: 700,
                    color: "#111827",
                    marginTop: 3
                  }}
                >
                  {selectedPurchase.invoice_no}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 12
                }}
              >
                <div>
                  <div style={{ color: "#6b7280", fontSize: 12 }}>
                    Total
                  </div>

                  <strong>
                    ₹
                    {Number(
                      selectedPurchase.total_amount || 0
                    ).toFixed(2)}
                  </strong>
                </div>

                <div>
                  <div style={{ color: "#6b7280", fontSize: 12 }}>
                    Paid
                  </div>

                  <strong style={{ color: "#16a34a" }}>
                    ₹
                    {Number(
                      selectedPurchase.paid_amount || 0
                    ).toFixed(2)}
                  </strong>
                </div>

                <div>
                  <div style={{ color: "#6b7280", fontSize: 12 }}>
                    Remaining
                  </div>

                  <strong style={{ color: "#dc2626" }}>
                    ₹
                    {Number(
                      selectedPurchase.due_amount || 0
                    ).toFixed(2)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Payment Amount */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>
                Payment Amount
              </label>

              <input
                type="number"
                min="0"
                max={Number(selectedPurchase.due_amount || 0)}
                step="0.01"
                value={paymentAmount}
                onChange={(e) =>
                  setPaymentAmount(e.target.value)
                }
                style={inputStyle}
              />
            </div>

            {/* Payment Method */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>
                Payment Method
              </label>

              <select
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value)
                }
                style={inputStyle}
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">
                  Bank Transfer
                </option>
                <option value="Card">Card</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            {/* Reference */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>
                Reference No. <span style={{ color: "#9ca3af" }}>(Optional)</span>
              </label>

              <input
                type="text"
                value={referenceNo}
                onChange={(e) =>
                  setReferenceNo(e.target.value)
                }
                placeholder="UPI / transaction / cheque number"
                style={inputStyle}
              />
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>
                Notes <span style={{ color: "#9ca3af" }}>(Optional)</span>
              </label>

              <textarea
                value={paymentNotes}
                onChange={(e) =>
                  setPaymentNotes(e.target.value)
                }
                rows={3}
                style={{
                  ...inputStyle,
                  resize: "vertical"
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10
              }}
            >
              <button
                onClick={() => setShowPaymentModal(false)}
                disabled={paymentSaving}
                style={cancelButtonStyle}
              >
                Cancel
              </button>

              <button
                onClick={submitPayment}
                disabled={paymentSaving}
                style={payButtonStyle}
              >
                {paymentSaving
                  ? "Saving..."
                  : `Pay ₹${Number(
                      paymentAmount || 0
                    ).toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {showHistory && historyPurchase && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 20
          }}
        >
          <div
            style={{
              background: "#fff",
              width: "100%",
              maxWidth: 600,
              borderRadius: 14,
              padding: 24,
              maxHeight: "80vh",
              overflowY: "auto"
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 20
                  }}
                >
                  Payment History
                </h2>

                <div
                  style={{
                    color: "#6b7280",
                    fontSize: 13,
                    marginTop: 4
                  }}
                >
                  {historyPurchase.invoice_no}
                </div>
              </div>

              <button
                onClick={() => setShowHistory(false)}
                style={{
                  border: "none",
                  background: "#f3f4f6",
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  cursor: "pointer",
                  fontSize: 18
                }}
              >
                ×
              </button>
            </div>

            {historyLoading ? (
              <div
                style={{
                  textAlign: "center",
                  padding: 30,
                  color: "#6b7280"
                }}
              >
                Loading payment history...
              </div>
            ) : paymentHistory.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: 30,
                  background: "#f9fafb",
                  borderRadius: 10,
                  color: "#6b7280"
                }}
              >
                No payment history available.
              </div>
            ) : (
              <div>
                {paymentHistory.map((payment, index) => (
                  <div
                    key={payment.id}
                    style={{
                      padding: "15px 0",
                      borderBottom:
                        "1px solid #e5e7eb"
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10
                      }}
                    >
                      <div>
                        <strong>
                          Payment #{index + 1}
                        </strong>

                        <div
                          style={{
                            color: "#6b7280",
                            fontSize: 13,
                            marginTop: 5
                          }}
                        >
                          {formatDate(
                            payment.payment_date
                          )}
                        </div>

                        <div
                          style={{
                            color: "#6b7280",
                            fontSize: 13,
                            marginTop: 3
                          }}
                        >
                          {payment.payment_method}

                          {payment.reference_no
                            ? ` • ${payment.reference_no}`
                            : ""}
                        </div>
                      </div>

                      <strong
                        style={{
                          color: "#16a34a",
                          fontSize: 16
                        }}
                      >
                        ₹
                        {Number(
                          payment.amount || 0
                        ).toFixed(2)}
                      </strong>
                    </div>

                    {payment.notes && (
                      <div
                        style={{
                          marginTop: 8,
                          fontSize: 13,
                          color: "#6b7280"
                        }}
                      >
                        {payment.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowHistory(false)}
              style={{
                marginTop: 20,
                width: "100%",
                padding: 11,
                border: "1px solid #d1d5db",
                background: "#fff",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}