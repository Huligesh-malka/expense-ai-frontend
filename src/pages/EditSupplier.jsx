import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
  FiArrowLeft,
  FiSave,
  FiX,
  FiUser,
  FiPhone,
  FiMail,
  FiMapPin,
  FiHash,
  FiCreditCard,
  FiFileText,
  FiGlobe,
  FiAlertCircle,
  FiCheckCircle,
  FiBriefcase
} from "react-icons/fi";

export default function EditSupplier() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    supplier_name: "",
    company_name: "",
    supplier_phone: "",
    supplier_email: "",
    gst_number: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    opening_balance: "",
    notes: "",
    status: "active"
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadSupplier();
  }, [id]);

  const loadSupplier = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/suppliers/${id}`
      );
      const data = res.data.data;
      setFormData({
        supplier_name: data.supplier_name || "",
        company_name: data.company_name || "",
        supplier_phone: data.supplier_phone || "",
        supplier_email: data.supplier_email || "",
        gst_number: data.gst_number || "",
        address: data.address || "",
        city: data.city || "",
        state: data.state || "",
        pincode: data.pincode || "",
        opening_balance: data.opening_balance || "",
        notes: data.notes || "",
        status: data.status || "active"
      });
    } catch (err) {
      console.log(err);
      alert("Failed to load supplier details");
      navigate("/suppliers");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ""
      }));
    }
    // Clear messages
    setSuccessMessage("");
    setErrorMessage("");
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.supplier_name.trim()) {
      newErrors.supplier_name = "Supplier name is required";
    }

    if (!formData.supplier_phone.trim()) {
      newErrors.supplier_phone = "Phone number is required";
    } else if (!/^[0-9]{10}$/.test(formData.supplier_phone.replace(/\s/g, ""))) {
      newErrors.supplier_phone = "Please enter a valid 10-digit phone number";
    }

    if (formData.supplier_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.supplier_email)) {
      newErrors.supplier_email = "Please enter a valid email address";
    }

    if (formData.gst_number && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gst_number)) {
      newErrors.gst_number = "Please enter a valid GST number";
    }

    if (formData.pincode && !/^[0-9]{6}$/.test(formData.pincode)) {
      newErrors.pincode = "Please enter a valid 6-digit pincode";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const dataToSend = {
        ...formData,
        opening_balance: parseFloat(formData.opening_balance) || 0
      };

      await axios.put(
        `http://localhost:5000/api/suppliers/${id}`,
        dataToSend
      );

      setSuccessMessage("Supplier updated successfully!");
      
      // Redirect after short delay
      setTimeout(() => {
        navigate("/suppliers");
      }, 1500);
    } catch (err) {
      console.log(err);
      setErrorMessage(
        err.response?.data?.message || "Failed to update supplier"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/suppliers");
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
          <p>Loading supplier data...</p>
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
              Edit Supplier
            </h1>
            <p style={{ color: "#6b7280", margin: "4px 0 0" }}>
              Update supplier information
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div
          style={{
            background: "#dcfce7",
            color: "#166534",
            padding: "12px 20px",
            borderRadius: 10,
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 8
          }}
        >
          <FiCheckCircle />
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            background: "#fee2e2",
            color: "#991b1b",
            padding: "12px 20px",
            borderRadius: 10,
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 8
          }}
        >
          <FiAlertCircle />
          {errorMessage}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: "grid",
            gap: 24
          }}
        >
          {/* Personal Info */}
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
              Personal Information
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#374151",
                    marginBottom: 6
                  }}
                >
                  Supplier Name <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  name="supplier_name"
                  value={formData.supplier_name}
                  onChange={handleChange}
                  placeholder="Enter supplier name"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: `1px solid ${errors.supplier_name ? "#ef4444" : "#d1d5db"}`,
                    outline: "none",
                    fontSize: 14,
                    transition: "border-color 0.2s"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#2563eb";
                  }}
                  onBlur={(e) => {
                    if (!errors.supplier_name) {
                      e.target.style.borderColor = "#d1d5db";
                    }
                  }}
                />
                {errors.supplier_name && (
                  <div style={{ color: "#ef4444", fontSize: 13, marginTop: 4 }}>
                    {errors.supplier_name}
                  </div>
                )}
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#374151",
                    marginBottom: 6
                  }}
                >
                  Company Name
                </label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  placeholder="Enter company name"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    outline: "none",
                    fontSize: 14,
                    transition: "border-color 0.2s"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#2563eb";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#d1d5db";
                  }}
                />
              </div>
            </div>
          </div>

          {/* Contact Info */}
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
              <FiPhone />
              Contact Details
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#374151",
                    marginBottom: 6
                  }}
                >
                  Phone Number <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  name="supplier_phone"
                  value={formData.supplier_phone}
                  onChange={handleChange}
                  placeholder="Enter 10-digit phone number"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: `1px solid ${errors.supplier_phone ? "#ef4444" : "#d1d5db"}`,
                    outline: "none",
                    fontSize: 14,
                    transition: "border-color 0.2s"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#2563eb";
                  }}
                  onBlur={(e) => {
                    if (!errors.supplier_phone) {
                      e.target.style.borderColor = "#d1d5db";
                    }
                  }}
                />
                {errors.supplier_phone && (
                  <div style={{ color: "#ef4444", fontSize: 13, marginTop: 4 }}>
                    {errors.supplier_phone}
                  </div>
                )}
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#374151",
                    marginBottom: 6
                  }}
                >
                  Email Address
                </label>
                <input
                  type="email"
                  name="supplier_email"
                  value={formData.supplier_email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: `1px solid ${errors.supplier_email ? "#ef4444" : "#d1d5db"}`,
                    outline: "none",
                    fontSize: 14,
                    transition: "border-color 0.2s"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#2563eb";
                  }}
                  onBlur={(e) => {
                    if (!errors.supplier_email) {
                      e.target.style.borderColor = "#d1d5db";
                    }
                  }}
                />
                {errors.supplier_email && (
                  <div style={{ color: "#ef4444", fontSize: 13, marginTop: 4 }}>
                    {errors.supplier_email}
                  </div>
                )}
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#374151",
                    marginBottom: 6
                  }}
                >
                  <FiGlobe style={{ marginRight: 6 }} />
                  GST Number
                </label>
                <input
                  type="text"
                  name="gst_number"
                  value={formData.gst_number}
                  onChange={handleChange}
                  placeholder="Enter GST number"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: `1px solid ${errors.gst_number ? "#ef4444" : "#d1d5db"}`,
                    outline: "none",
                    fontSize: 14,
                    transition: "border-color 0.2s"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#2563eb";
                  }}
                  onBlur={(e) => {
                    if (!errors.gst_number) {
                      e.target.style.borderColor = "#d1d5db";
                    }
                  }}
                />
                {errors.gst_number && (
                  <div style={{ color: "#ef4444", fontSize: 13, marginTop: 4 }}>
                    {errors.gst_number}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Address Info */}
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
              Address Information
            </h3>

            <div style={{ display: "grid", gap: 20 }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#374151",
                    marginBottom: 6
                  }}
                >
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter street address"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    outline: "none",
                    fontSize: 14,
                    transition: "border-color 0.2s"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#2563eb";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#d1d5db";
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 14,
                      fontWeight: 500,
                      color: "#374151",
                      marginBottom: 6
                    }}
                  >
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Enter city"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 8,
                      border: "1px solid #d1d5db",
                      outline: "none",
                      fontSize: 14,
                      transition: "border-color 0.2s"
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#2563eb";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#d1d5db";
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 14,
                      fontWeight: 500,
                      color: "#374151",
                      marginBottom: 6
                    }}
                  >
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="Enter state"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 8,
                      border: "1px solid #d1d5db",
                      outline: "none",
                      fontSize: 14,
                      transition: "border-color 0.2s"
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#2563eb";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#d1d5db";
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 14,
                      fontWeight: 500,
                      color: "#374151",
                      marginBottom: 6
                    }}
                  >
                    <FiHash style={{ marginRight: 6 }} />
                    Pincode
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="Enter 6-digit pincode"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 8,
                      border: `1px solid ${errors.pincode ? "#ef4444" : "#d1d5db"}`,
                      outline: "none",
                      fontSize: 14,
                      transition: "border-color 0.2s"
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#2563eb";
                    }}
                    onBlur={(e) => {
                      if (!errors.pincode) {
                        e.target.style.borderColor = "#d1d5db";
                      }
                    }}
                  />
                  {errors.pincode && (
                    <div style={{ color: "#ef4444", fontSize: 13, marginTop: 4 }}>
                      {errors.pincode}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Financial & Status */}
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
              <FiCreditCard />
              Financial & Status
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#374151",
                    marginBottom: 6
                  }}
                >
                  Opening Balance
                </label>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#6b7280",
                      fontWeight: 500
                    }}
                  >
                    ₹
                  </span>
                  <input
                    type="number"
                    name="opening_balance"
                    value={formData.opening_balance}
                    onChange={handleChange}
                    placeholder="0.00"
                    step="0.01"
                    style={{
                      width: "100%",
                      padding: "10px 14px 10px 32px",
                      borderRadius: 8,
                      border: "1px solid #d1d5db",
                      outline: "none",
                      fontSize: 14,
                      transition: "border-color 0.2s"
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#2563eb";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#d1d5db";
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#374151",
                    marginBottom: 6
                  }}
                >
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    outline: "none",
                    fontSize: 14,
                    background: "#fff",
                    transition: "border-color 0.2s"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#2563eb";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#d1d5db";
                  }}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notes */}
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
              Notes
            </h3>

            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add any additional notes about the supplier..."
              rows="4"
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                outline: "none",
                fontSize: 14,
                fontFamily: "inherit",
                resize: "vertical",
                transition: "border-color 0.2s"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#2563eb";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#d1d5db";
              }}
            />
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "flex-end",
              paddingTop: 8
            }}
          >
            <button
              type="button"
              onClick={handleCancel}
              style={{
                padding: "12px 24px",
                borderRadius: 10,
                border: "1px solid #d1d5db",
                background: "#fff",
                color: "#374151",
                cursor: "pointer",
                fontWeight: 500,
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#f3f4f6";
                e.target.style.borderColor = "#9ca3af";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "#fff";
                e.target.style.borderColor = "#d1d5db";
              }}
            >
              <FiX />
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "12px 32px",
                borderRadius: 10,
                border: "none",
                background: saving ? "#93c5fd" : "#2563eb",
                color: "#fff",
                cursor: saving ? "not-allowed" : "pointer",
                fontWeight: 500,
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
              onMouseEnter={(e) => {
                if (!saving) {
                  e.target.style.background = "#1d4ed8";
                }
              }}
              onMouseLeave={(e) => {
                if (!saving) {
                  e.target.style.background = "#2563eb";
                }
              }}
            >
              <FiSave />
              {saving ? "Saving..." : "Update Supplier"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}