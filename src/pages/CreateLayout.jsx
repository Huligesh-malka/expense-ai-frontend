// src/pages/CreateLayout.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

import {
  FiHome,
  FiArrowRight,
  FiAlertCircle,
  FiShoppingBag,
  FiMaximize,
  FiBox,
  FiCpu,
  FiMapPin,
  FiCheck,
  FiChevronLeft,
} from "react-icons/fi";

export default function CreateLayout() {
  const navigate = useNavigate();

  // ─────────────────────────────────────────────
  // Business / Shop Information
  // ─────────────────────────────────────────────

  const [shopName, setShopName] = useState("");

  const [shopType, setShopType] = useState("Grocery");

  const [width, setWidth] = useState("");
  const [length, setLength] = useState("");
  const [height, setHeight] = useState("10");

  const [unit, setUnit] = useState("feet");

  const [entranceSide, setEntranceSide] = useState("front");

  const [template, setTemplate] = useState("smart");

  const [aiOptimization, setAiOptimization] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const businessId =
    localStorage.getItem("businessId") ||
    localStorage.getItem("business_id");

  // ─────────────────────────────────────────────
  // Shop Types
  // ─────────────────────────────────────────────

  const shopTypes = [
    {
      value: "Grocery",
      label: "Grocery Store",
      icon: "🛒",
    },
    {
      value: "Medical",
      label: "Medical Store",
      icon: "💊",
    },
    {
      value: "Clothing",
      label: "Clothing Store",
      icon: "👕",
    },
    {
      value: "Electronics",
      label: "Electronics",
      icon: "📱",
    },
    {
      value: "Bakery",
      label: "Bakery",
      icon: "🥖",
    },
    {
      value: "Restaurant",
      label: "Restaurant",
      icon: "🍽️",
    },
    {
      value: "General",
      label: "General Store",
      icon: "🏪",
    },
  ];

  // ─────────────────────────────────────────────
  // Validation
  // ─────────────────────────────────────────────

  const validate = () => {
    if (!shopName.trim()) {
      return "Shop name is required";
    }

    if (!width || Number(width) <= 0) {
      return "Width must be greater than 0";
    }

    if (!length || Number(length) <= 0) {
      return "Length must be greater than 0";
    }

    if (!height || Number(height) <= 0) {
      return "Height must be greater than 0";
    }

    if (Number(width) > 500) {
      return "Width seems too large (maximum 500 feet)";
    }

    if (Number(length) > 500) {
      return "Length seems too large (maximum 500 feet)";
    }

    if (Number(height) > 100) {
      return "Height seems too large (maximum 100 feet)";
    }

    return null;
  };

  // ─────────────────────────────────────────────
  // Create Layout
  // ─────────────────────────────────────────────

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
      const payload = {
        business_id: businessId,

        shop_name: shopName.trim(),

        shop_type: shopType,

        width: Number(width),

        length: Number(length),

        height: Number(height),

        unit,

        entrance_side: entranceSide,

        template,

        ai_optimization: aiOptimization,
      };

      console.log("Creating shop layout:", payload);

      const res = await API.post("/shop/layout", payload);

      // Support different backend response structures
      const layoutId =
        res.data?.layoutId ||
        res.data?.id ||
        res.data?.layout?.id;

      if (!layoutId) {
        throw new Error(
          "Layout was created but no layout ID was returned by the server."
        );
      }

      // Store temporarily for designer
      localStorage.setItem(
        "activeShopLayout",
        JSON.stringify({
          layoutId,
          businessId,
          shopName: shopName.trim(),
          shopType,
          width: Number(width),
          length: Number(length),
          height: Number(height),
          unit,
          entranceSide,
          template,
          aiOptimization,
        })
      );

      navigate("/shop-designer", {
        state: {
          layoutId,
        },
      });
    } catch (err) {
      console.error("Error creating layout:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to create shop layout"
      );
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // Area
  // ─────────────────────────────────────────────

  const area =
    Number(width) > 0 && Number(length) > 0
      ? Number(width) * Number(length)
      : 0;

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* ───────────────────────────────────────
            Header
        ─────────────────────────────────────── */}

        <div style={styles.topBar}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={styles.backButton}
          >
            <FiChevronLeft size={18} />
            Back
          </button>

          <div style={styles.stepText}>
            Step 1 of 3
          </div>
        </div>

        <div style={styles.card}>
          {/* Header */}

          <div style={styles.header}>
            <div style={styles.iconWrap}>
              <FiHome size={25} color="#2563eb" />
            </div>

            <div>
              <h1 style={styles.title}>
                Create Your Shop
              </h1>

              <p style={styles.subtitle}>
                Set up your shop before entering the 3D designer
              </p>
            </div>
          </div>

          {/* Progress */}

          <div style={styles.progressContainer}>
            <div style={styles.progressActive}>
              <span>1</span>
              Shop Setup
            </div>

            <div style={styles.progressLine} />

            <div style={styles.progressInactive}>
              <span>2</span>
              3D Design
            </div>

            <div style={styles.progressLine} />

            <div style={styles.progressInactive}>
              <span>3</span>
              AI Optimize
            </div>
          </div>

          {/* Error */}

          {error && (
            <div style={styles.errorBox}>
              <FiAlertCircle size={18} />

              <span>{error}</span>
            </div>
          )}

          <form
            onSubmit={createLayout}
            noValidate
          >
            {/* ─────────────────────────────────
                Basic Information
            ───────────────────────────────── */}

            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <FiShoppingBag
                  size={19}
                  color="#2563eb"
                />

                <div>
                  <h2 style={styles.sectionTitle}>
                    Shop Information
                  </h2>

                  <p style={styles.sectionSubtitle}>
                    Tell us about your business
                  </p>
                </div>
              </div>

              {/* Shop Name */}

              <div style={styles.field}>
                <label style={styles.label}>
                  Shop Name
                </label>

                <input
                  type="text"
                  value={shopName}
                  onChange={(e) =>
                    setShopName(e.target.value)
                  }
                  placeholder="e.g. Basavaraja Super Market"
                  style={styles.input}
                  disabled={loading}
                  autoFocus
                />
              </div>

              {/* Shop Type */}

              <div style={styles.field}>
                <label style={styles.label}>
                  Business Type
                </label>

                <div style={styles.typeGrid}>
                  {shopTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      disabled={loading}
                      onClick={() =>
                        setShopType(type.value)
                      }
                      style={{
                        ...styles.typeCard,

                        ...(shopType === type.value
                          ? styles.typeCardActive
                          : {}),
                      }}
                    >
                      <span style={styles.typeEmoji}>
                        {type.icon}
                      </span>

                      <span>{type.label}</span>

                      {shopType === type.value && (
                        <span style={styles.checkIcon}>
                          <FiCheck size={12} />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ─────────────────────────────────
                Dimensions
            ───────────────────────────────── */}

            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <FiMaximize
                  size={19}
                  color="#7c3aed"
                />

                <div>
                  <h2 style={styles.sectionTitle}>
                    Shop Dimensions
                  </h2>

                  <p style={styles.sectionSubtitle}>
                    These dimensions create your 3D floor
                  </p>
                </div>
              </div>

              <div style={styles.dimensionGrid}>
                {/* Width */}

                <div style={styles.field}>
                  <label style={styles.label}>
                    Width
                  </label>

                  <div style={styles.inputWithUnit}>
                    <input
                      type="number"
                      value={width}
                      onChange={(e) =>
                        setWidth(e.target.value)
                      }
                      placeholder="20"
                      min="1"
                      max="500"
                      step="0.1"
                      style={styles.numberInput}
                      disabled={loading}
                    />

                    <span>ft</span>
                  </div>
                </div>

                {/* Length */}

                <div style={styles.field}>
                  <label style={styles.label}>
                    Length
                  </label>

                  <div style={styles.inputWithUnit}>
                    <input
                      type="number"
                      value={length}
                      onChange={(e) =>
                        setLength(e.target.value)
                      }
                      placeholder="30"
                      min="1"
                      max="500"
                      step="0.1"
                      style={styles.numberInput}
                      disabled={loading}
                    />

                    <span>ft</span>
                  </div>
                </div>

                {/* Height */}

                <div style={styles.field}>
                  <label style={styles.label}>
                    Ceiling Height
                  </label>

                  <div style={styles.inputWithUnit}>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) =>
                        setHeight(e.target.value)
                      }
                      placeholder="10"
                      min="1"
                      max="100"
                      step="0.1"
                      style={styles.numberInput}
                      disabled={loading}
                    />

                    <span>ft</span>
                  </div>
                </div>
              </div>

              {/* Area */}

              {area > 0 && (
                <div style={styles.areaCard}>
                  <div>
                    <div style={styles.areaLabel}>
                      Total Shop Area
                    </div>

                    <div style={styles.areaValue}>
                      {area.toLocaleString("en-IN")} sq. ft.
                    </div>
                  </div>

                  <FiMaximize
                    size={26}
                    color="#0284c7"
                  />
                </div>
              )}
            </div>

            {/* ─────────────────────────────────
                Entrance
            ───────────────────────────────── */}

            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <FiMapPin
                  size={19}
                  color="#16a34a"
                />

                <div>
                  <h2 style={styles.sectionTitle}>
                    Entrance Position
                  </h2>

                  <p style={styles.sectionSubtitle}>
                    AI will use this for customer-flow
                    optimization
                  </p>
                </div>
              </div>

              <div style={styles.entranceGrid}>
                {[
                  {
                    value: "front",
                    label: "Front",
                    icon: "⬆️",
                  },
                  {
                    value: "left",
                    label: "Left",
                    icon: "⬅️",
                  },
                  {
                    value: "right",
                    label: "Right",
                    icon: "➡️",
                  },
                  {
                    value: "back",
                    label: "Back",
                    icon: "⬇️",
                  },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    disabled={loading}
                    onClick={() =>
                      setEntranceSide(item.value)
                    }
                    style={{
                      ...styles.entranceButton,

                      ...(entranceSide === item.value
                        ? styles.entranceActive
                        : {}),
                    }}
                  >
                    <span>
                      {item.icon}
                    </span>

                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ─────────────────────────────────
                Template
            ───────────────────────────────── */}

            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <FiBox
                  size={19}
                  color="#ea580c"
                />

                <div>
                  <h2 style={styles.sectionTitle}>
                    Starting Layout
                  </h2>

                  <p style={styles.sectionSubtitle}>
                    Choose how your 3D shop should begin
                  </p>
                </div>
              </div>

              <div style={styles.templateGrid}>
                {/* Smart */}

                <button
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    setTemplate("smart")
                  }
                  style={{
                    ...styles.templateCard,

                    ...(template === "smart"
                      ? styles.templateActive
                      : {}),
                  }}
                >
                  <div style={styles.templateIcon}>
                    🤖
                  </div>

                  <div style={styles.templateContent}>
                    <strong>
                      Smart Layout
                    </strong>

                    <span>
                      AI creates an optimized starting
                      structure
                    </span>
                  </div>

                  {template === "smart" && (
                    <FiCheck
                      size={20}
                      color="#2563eb"
                    />
                  )}
                </button>

                {/* Empty */}

                <button
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    setTemplate("empty")
                  }
                  style={{
                    ...styles.templateCard,

                    ...(template === "empty"
                      ? styles.templateActive
                      : {}),
                  }}
                >
                  <div style={styles.templateIcon}>
                    🏗️
                  </div>

                  <div style={styles.templateContent}>
                    <strong>
                      Empty Shop
                    </strong>

                    <span>
                      Start from an empty 3D floor
                    </span>
                  </div>

                  {template === "empty" && (
                    <FiCheck
                      size={20}
                      color="#2563eb"
                    />
                  )}
                </button>
              </div>
            </div>

            {/* ─────────────────────────────────
                AI
            ───────────────────────────────── */}

            <div style={styles.aiCard}>
              <div style={styles.aiIcon}>
                <FiCpu
                  size={22}
                  color="#7c3aed"
                />
              </div>

              <div style={styles.aiContent}>
                <strong>
                  Enable AI Shop Optimization
                </strong>

                <p>
                  After designing your shop, AI can
                  analyze sales, inventory, product
                  placement and customer flow.
                </p>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  setAiOptimization(
                    !aiOptimization
                  )
                }
                style={{
                  ...styles.switch,

                  background: aiOptimization
                    ? "#7c3aed"
                    : "#d1d5db",
                }}
                aria-label="Toggle AI optimization"
              >
                <span
                  style={{
                    ...styles.switchCircle,

                    transform: aiOptimization
                      ? "translateX(20px)"
                      : "translateX(0)",
                  }}
                />
              </button>
            </div>

            {/* ─────────────────────────────────
                Summary
            ───────────────────────────────── */}

            <div style={styles.summary}>
              <div style={styles.summaryTitle}>
                Shop Setup Summary
              </div>

              <div style={styles.summaryGrid}>
                <div>
                  <span>Business</span>
                  <strong>{shopType}</strong>
                </div>

                <div>
                  <span>Dimensions</span>
                  <strong>
                    {width || "—"} × {length || "—"} ft
                  </strong>
                </div>

                <div>
                  <span>Area</span>
                  <strong>
                    {area
                      ? `${area.toLocaleString(
                          "en-IN"
                        )} sq.ft`
                      : "—"}
                  </strong>
                </div>

                <div>
                  <span>Template</span>
                  <strong>
                    {template === "smart"
                      ? "Smart AI"
                      : "Empty"}
                  </strong>
                </div>
              </div>
            </div>

            {/* ─────────────────────────────────
                Submit
            ───────────────────────────────── */}

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.createButton,

                opacity: loading ? 0.7 : 1,

                cursor: loading
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {loading ? (
                <>
                  <span style={styles.spinner} />
                  Creating Shop...
                </>
              ) : (
                <>
                  Create Shop & Open 3D Designer
                  <FiArrowRight size={18} />
                </>
              )}
            </button>

            <p style={styles.bottomText}>
              You can change all shop objects,
              dimensions and layout inside the 3D
              designer.
            </p>
          </form>
        </div>
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
    background:
      "linear-gradient(135deg, #f5f7fb 0%, #eef4ff 100%)",
    padding: "30px 20px",
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    boxSizing: "border-box",
  },

  container: {
    width: "100%",
    maxWidth: 820,
    margin: "0 auto",
  },

  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  backButton: {
    border: "none",
    background: "transparent",
    color: "#475569",
    display: "flex",
    alignItems: "center",
    gap: 4,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    padding: "8px 0",
  },

  stepText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: 600,
  },

  card: {
    background: "#fff",
    borderRadius: 20,
    padding: "30px",
    boxShadow:
      "0 10px 40px rgba(15, 23, 42, 0.08)",
    border: "1px solid #e5e7eb",
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: 15,
    marginBottom: 28,
  },

  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    background: "#dbeafe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  title: {
    margin: 0,
    fontSize: 24,
    color: "#111827",
    fontWeight: 750,
  },

  subtitle: {
    margin: "5px 0 0",
    fontSize: 14,
    color: "#64748b",
  },

  progressContainer: {
    display: "flex",
    alignItems: "center",
    marginBottom: 28,
    width: "100%",
  },

  progressActive: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    fontSize: 12,
    fontWeight: 700,
    color: "#2563eb",
    whiteSpace: "nowrap",
  },

  progressInactive: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    fontSize: 12,
    fontWeight: 600,
    color: "#94a3b8",
    whiteSpace: "nowrap",
  },

  progressLine: {
    height: 1,
    background: "#e2e8f0",
    flex: 1,
    margin: "0 10px",
  },

  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    padding: "11px 14px",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 20,
  },

  section: {
    marginBottom: 28,
  },

  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
  },

  sectionTitle: {
    margin: 0,
    color: "#1e293b",
    fontSize: 16,
    fontWeight: 700,
  },

  sectionSubtitle: {
    margin: "3px 0 0",
    color: "#94a3b8",
    fontSize: 12,
  },

  field: {
    marginBottom: 18,
  },

  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 650,
    color: "#374151",
    marginBottom: 7,
  },

  input: {
    width: "100%",
    padding: "13px 14px",
    borderRadius: 10,
    border: "1px solid #d1d5db",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    background: "#fff",
    color: "#111827",
  },

  typeGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 10,
  },

  typeCard: {
    position: "relative",
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 11,
    padding: "13px 11px",
    display: "flex",
    alignItems: "center",
    gap: 9,
    cursor: "pointer",
    color: "#475569",
    fontSize: 12,
    fontWeight: 600,
    textAlign: "left",
  },

  typeCardActive: {
    border: "1.5px solid #2563eb",
    background: "#eff6ff",
    color: "#1d4ed8",
  },

  typeEmoji: {
    fontSize: 21,
  },

  checkIcon: {
    position: "absolute",
    right: 7,
    top: 7,
    width: 18,
    height: 18,
    borderRadius: "50%",
    background: "#2563eb",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  dimensionGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
  },

  inputWithUnit: {
    display: "flex",
    alignItems: "center",
    border: "1px solid #d1d5db",
    borderRadius: 10,
    overflow: "hidden",
    background: "#fff",
  },

  numberInput: {
    width: "100%",
    minWidth: 0,
    border: "none",
    outline: "none",
    padding: "13px 12px",
    fontSize: 14,
    color: "#111827",
    boxSizing: "border-box",
  },

  areaCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#f0f9ff",
    border: "1px solid #bae6fd",
    padding: "13px 16px",
    borderRadius: 11,
  },

  areaLabel: {
    fontSize: 11,
    color: "#0369a1",
    marginBottom: 3,
    fontWeight: 600,
  },

  areaValue: {
    fontSize: 17,
    color: "#075985",
    fontWeight: 750,
  },

  entranceGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, 1fr)",
    gap: 10,
  },

  entranceButton: {
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 10,
    padding: "12px 8px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 5,
    color: "#64748b",
    fontSize: 12,
    fontWeight: 600,
  },

  entranceActive: {
    border: "1.5px solid #16a34a",
    background: "#f0fdf4",
    color: "#15803d",
  },

  templateGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(250px, 1fr))",
    gap: 12,
  },

  templateCard: {
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 12,
    padding: 15,
    display: "flex",
    alignItems: "center",
    gap: 12,
    cursor: "pointer",
    textAlign: "left",
  },

  templateActive: {
    border: "1.5px solid #2563eb",
    background: "#eff6ff",
  },

  templateIcon: {
    fontSize: 28,
    width: 42,
    textAlign: "center",
  },

  templateContent: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    flex: 1,
  },

  aiCard: {
    display: "flex",
    alignItems: "center",
    gap: 13,
    background:
      "linear-gradient(135deg, #faf5ff, #f5f3ff)",
    border: "1px solid #ddd6fe",
    borderRadius: 13,
    padding: 15,
    marginBottom: 24,
  },

  aiIcon: {
    width: 42,
    height: 42,
    borderRadius: 11,
    background: "#ede9fe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  aiContent: {
    flex: 1,
  },

  switch: {
    width: 42,
    height: 23,
    border: "none",
    borderRadius: 20,
    padding: 2,
    cursor: "pointer",
    transition: "background .2s",
    flexShrink: 0,
  },

  switchCircle: {
    display: "block",
    width: 19,
    height: 19,
    background: "#fff",
    borderRadius: "50%",
    transition: "transform .2s",
  },

  summary: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 16,
    marginBottom: 18,
  },

  summaryTitle: {
    fontSize: 13,
    fontWeight: 750,
    color: "#334155",
    marginBottom: 13,
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(130px, 1fr))",
    gap: 12,
  },

  summaryItem: {
    display: "flex",
    flexDirection: "column",
  },

  createButton: {
    width: "100%",
    minHeight: 50,
    padding: "14px 18px",
    background:
      "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#fff",
    border: "none",
    borderRadius: 11,
    fontSize: 15,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    transition: "all .2s",
  },

  spinner: {
    width: 17,
    height: 17,
    border: "2px solid rgba(255,255,255,.4)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    display: "inline-block",
    animation: "spin 1s linear infinite",
  },

  bottomText: {
    textAlign: "center",
    margin: "12px 0 0",
    fontSize: 11,
    color: "#94a3b8",
  },
};