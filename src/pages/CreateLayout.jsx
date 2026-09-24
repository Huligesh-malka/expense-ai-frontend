// src/pages/CreateLayout.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { FiHome, FiArrowRight, FiAlertCircle } from "react-icons/fi";

export default function CreateLayout() {
  const navigate = useNavigate();

  const [shopName, setShopName] = useState("");
  const [width, setWidth]       = useState("");
  const [length, setLength]     = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const businessId =
    localStorage.getItem("businessId") ||
    localStorage.getItem("business_id");

  // ─────────────────────────────────────────
  // Validation
  // ─────────────────────────────────────────
  const validate = () => {
    if (!shopName.trim()) return "Shop name is required";
    if (!width || Number(width) <= 0) return "Width must be greater than 0";
    if (!length || Number(length) <= 0) return "Length must be greater than 0";
    if (Number(width) > 500)  return "Width seems too large (max 500 ft)";
    if (Number(length) > 500) return "Length seems too large (max 500 ft)";
    return null;
  };

  // ─────────────────────────────────────────
  // Submit
  // ─────────────────────────────────────────
  const createLayout = async (e) => {
    e.preventDefault();
    setError("");

    if (!businessId) {
      setError("No business selected. Please log in again.");
      return;
    }

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await API.post("/shop/layout", {
        business_id: businessId,
        shop_name:   shopName.trim(),
        width:       Number(width),
        length:      Number(length),
      });

      // Tolerate different response shapes
      const layoutId =
        res.data?.layoutId ||
        res.data?.id ||
        res.data?.layout?.id;

      navigate("/shop-designer", {
        state: { layoutId },
        replace: false,
      });
    } catch (err) {
      console.error("Error creating layout:", err);
      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to create layout"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.iconWrap}>
            <FiHome size={22} color="#2563eb" />
          </div>
          <div>
            <h2 style={styles.title}>Create Shop Layout</h2>
            <p style={styles.subtitle}>
              Set up your shop dimensions to start designing in 3D
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={styles.errorBox}>
            <FiAlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={createLayout} noValidate>
          <div style={styles.field}>
            <label style={styles.label}>Shop Name</label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="e.g., My Grocery Shop"
              style={styles.input}
              disabled={loading}
              autoFocus
            />
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Width (feet)</label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                placeholder="20"
                min="1"
                max="500"
                style={styles.input}
                disabled={loading}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Length (feet)</label>
              <input
                type="number"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                placeholder="30"
                min="1"
                max="500"
                style={styles.input}
                disabled={loading}
              />
            </div>
          </div>

          {width && length && Number(width) > 0 && Number(length) > 0 && (
            <div style={styles.preview}>
              <strong>Total area:</strong>{" "}
              {(Number(width) * Number(length)).toLocaleString("en-IN")} sq. ft.
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? (
              "Creating…"
            ) : (
              <>
                Create Layout <FiArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: 520,
    background: "#fff",
    padding: 32,
    borderRadius: 14,
    boxShadow: "0 4px 24px rgba(0,0,0,.08)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 24,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    background: "#dbeafe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  title: {
    margin: 0,
    fontSize: 20,
    color: "#1f2937",
  },
  subtitle: {
    margin: "4px 0 0",
    fontSize: 13,
    color: "#6b7280",
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#fee2e2",
    color: "#991b1b",
    border: "1px solid #fca5a5",
    padding: "10px 14px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    marginBottom: 16,
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
  },
  field: {
    marginBottom: 18,
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 8,
    border: "1px solid #d1d5db",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color .15s",
  },
  preview: {
    background: "#f0f9ff",
    color: "#075985",
    border: "1px solid #bae6fd",
    padding: "10px 14px",
    borderRadius: 8,
    fontSize: 13,
    marginBottom: 18,
  },
  button: {
    width: "100%",
    padding: "14px 16px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    transition: "background .15s",
  },
};