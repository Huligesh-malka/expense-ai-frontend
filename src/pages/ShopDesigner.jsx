// src/pages/ShopDesigner.jsx

import {
  Canvas,
  useThree,
} from "@react-three/fiber";

import {
  OrbitControls,
  Grid,
  Text,
  Box,
  Html,
} from "@react-three/drei";

import {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";

import { useLocation, useNavigate } from "react-router-dom";

import {
  FiArrowLeft,
  FiSave,
  FiTrash2,
  FiCopy,
  FiRotateCw,
  FiBox,
  FiCpu,
  FiBarChart2,
  FiShoppingBag,
  FiMaximize,
  FiPlus,
  FiMinus,
} from "react-icons/fi";

import API from "../services/api";

// ─────────────────────────────────────────────
// Object presets
// ─────────────────────────────────────────────

const OBJECT_PRESETS = {
  Shelf: {
    width: 4,
    height: 2,
    depth: 1,
    color: "#8B4513",
  },

  Counter: {
    width: 6,
    height: 1.1,
    depth: 2,
    color: "#A0522D",
  },

  Rack: {
    width: 3,
    height: 4,
    depth: 1.5,
    color: "#654321",
  },

  Display: {
    width: 2,
    height: 3,
    depth: 2,
    color: "#D2691E",
  },

  Fridge: {
    width: 3,
    height: 5,
    depth: 2.5,
    color: "#B0C4DE",
  },
};

// ─────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────

function useToast() {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const show = useCallback((message, type = "info") => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setToast({
      message,
      type,
    });

    timerRef.current = setTimeout(() => {
      setToast(null);
    }, 2800);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    toast,
    show,
  };
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

export default function ShopDesigner() {
  const location = useLocation();
  const navigate = useNavigate();

  const { toast, show } = useToast();

  // ─────────────────────────────────────────
  // Business
  // ─────────────────────────────────────────

  const businessId =
    localStorage.getItem("businessId") ||
    localStorage.getItem("business_id");

  // CreateLayout sends this
  const routeLayoutId = location.state?.layoutId;

  // Backup from localStorage
  const storedLayout = useMemo(() => {
    try {
      const value = localStorage.getItem(
        "activeShopLayout"
      );

      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }, []);

  const layoutId =
    routeLayoutId ||
    storedLayout?.layoutId ||
    null;

  // ─────────────────────────────────────────
  // State
  // ─────────────────────────────────────────

  const [layout, setLayout] = useState(null);

  const [objects, setObjects] = useState([]);

  const [selectedObject, setSelectedObject] =
    useState(null);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [activeMode, setActiveMode] =
    useState("design");

  const [showGrid, setShowGrid] =
    useState(true);

  const [showWalls, setShowWalls] =
    useState(true);

  const [editObject, setEditObject] = useState({
    x: 0,
    y: 0,
    z: 0,
    rotation: 0,
    width: 1,
    height: 1,
    depth: 1,
  });

  // ─────────────────────────────────────────
  // Load layout
  // ─────────────────────────────────────────

  const loadLayout = useCallback(async () => {
    if (!businessId) {
      show(
        "No business selected. Please log in again.",
        "error"
      );

      setLoading(false);

      return;
    }

    setLoading(true);

    try {
      let res;

      /*
       * IMPORTANT:
       *
       * If your backend has:
       *
       * GET /shop/layout/:layoutId
       *
       * this will use the exact layout.
       *
       * Otherwise it falls back to:
       *
       * GET /shop/layout/:businessId
       */

      if (layoutId) {
        try {
          res = await API.get(
            `/shop/layout/id/${layoutId}`
          );
        } catch {
          res = await API.get(
            `/shop/layout/${businessId}`
          );
        }
      } else {
        res = await API.get(
          `/shop/layout/${businessId}`
        );
      }

      setLayout(res.data?.layout || null);

      setObjects(
        Array.isArray(res.data?.objects)
          ? res.data.objects
          : []
      );
    } catch (err) {
      console.error(
        "Error loading shop layout:",
        err
      );

      show(
        err.response?.data?.message ||
          err.message ||
          "Failed to load shop layout",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [
    businessId,
    layoutId,
    show,
  ]);

  useEffect(() => {
    loadLayout();
  }, [loadLayout]);

  // ─────────────────────────────────────────
  // Add object
  // ─────────────────────────────────────────

  const addObject = async (
    type = "Shelf"
  ) => {
    if (!layout?.id) {
      show(
        "Layout is not loaded yet",
        "error"
      );

      return;
    }

    const preset =
      OBJECT_PRESETS[type] ||
      OBJECT_PRESETS.Shelf;

    // Find a free-ish position
    const objectNumber =
      objects.length;

    const newObject = {
      layout_id: layout.id,

      object_type: type,

      object_name: `${type} ${
        objectNumber + 1
      }`,

      x: 0,

      y: preset.height / 2,

      z: 0,

      rotation: 0,

      width: preset.width,

      height: preset.height,

      depth: preset.depth,

      color: preset.color,
    };

    try {
      const res = await API.post(
        "/shop/object",
        newObject
      );

      const created = {
        id:
          res.data?.id ??
          res.data?.object?.id,

        ...newObject,

        ...(res.data?.object || {}),
      };

      setObjects((prev) => [
        ...prev,
        created,
      ]);

      setSelectedObject(created.id);

      setEditObject({
        x: Number(created.x) || 0,
        y: Number(created.y) || 0,
        z: Number(created.z) || 0,
        rotation:
          Number(created.rotation) || 0,
        width:
          Number(created.width) ||
          preset.width,
        height:
          Number(created.height) ||
          preset.height,
        depth:
          Number(created.depth) ||
          preset.depth,
      });

      show(
        `${type} added`,
        "success"
      );
    } catch (err) {
      console.error(
        "Error adding object:",
        err
      );

      show(
        err.response?.data?.message ||
          `Failed to add ${type}`,
        "error"
      );
    }
  };

  // ─────────────────────────────────────────
  // Select
  // ─────────────────────────────────────────

  const handleSelectObject =
    useCallback((obj) => {
      setSelectedObject(obj.id);

      setEditObject({
        x: Number(obj.x) || 0,

        y: Number(obj.y) || 0,

        z: Number(obj.z) || 0,

        rotation:
          Number(obj.rotation) || 0,

        width:
          Number(obj.width) || 1,

        height:
          Number(obj.height) || 1,

        depth:
          Number(obj.depth) || 1,
      });
    }, []);

  // ─────────────────────────────────────────
  // Save object
  // ─────────────────────────────────────────

  const saveObjectChanges = async () => {
    if (!selectedObject) {
      return;
    }

    const obj = objects.find(
      (o) => o.id === selectedObject
    );

    if (!obj) {
      return;
    }

    setSaving(true);

    try {
      const payload = {
        x: Number(editObject.x) || 0,

        y: Number(editObject.y) || 0,

        z: Number(editObject.z) || 0,

        rotation:
          Number(editObject.rotation) || 0,

        width:
          Number(editObject.width) || 1,

        height:
          Number(editObject.height) || 1,

        depth:
          Number(editObject.depth) || 1,

        color:
          obj.color || "#8B4513",

        object_name:
          obj.object_name,

        object_type:
          obj.object_type,
      };

      await API.put(
        `/shop/object/${selectedObject}`,
        payload
      );

      setObjects((prev) =>
        prev.map((o) =>
          o.id === selectedObject
            ? {
                ...o,
                ...payload,
              }
            : o
        )
      );

      show(
        "Object changes saved",
        "success"
      );
    } catch (err) {
      console.error(
        "Error saving object:",
        err
      );

      show(
        err.response?.data?.message ||
          "Failed to save changes",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────
  // Delete
  // ─────────────────────────────────────────

  const deleteObject = async () => {
    if (!selectedObject) {
      return;
    }

    const confirmed =
      window.confirm(
        "Delete this object?"
      );

    if (!confirmed) {
      return;
    }

    try {
      await API.delete(
        `/shop/object/${selectedObject}`
      );

      setObjects((prev) =>
        prev.filter(
          (o) =>
            o.id !== selectedObject
        )
      );

      setSelectedObject(null);

      show(
        "Object deleted",
        "success"
      );
    } catch (err) {
      console.error(
        "Delete object error:",
        err
      );

      show(
        err.response?.data?.message ||
          "Failed to delete object",
        "error"
      );
    }
  };

  // ─────────────────────────────────────────
  // Duplicate
  // ─────────────────────────────────────────

  const duplicateObject = async () => {
    if (!selectedObject) {
      return;
    }

    try {
      const res = await API.post(
        `/shop/object/${selectedObject}/duplicate`
      );

      await loadLayout();

      const newId =
        res.data?.id ||
        res.data?.object?.id;

      if (newId) {
        setSelectedObject(newId);
      }

      show(
        "Object duplicated",
        "success"
      );
    } catch (err) {
      console.error(
        "Duplicate error:",
        err
      );

      show(
        err.response?.data?.message ||
          "Failed to duplicate object",
        "error"
      );
    }
  };

  // ─────────────────────────────────────────
  // Rotate
  // ─────────────────────────────────────────

  const rotateObject = async (
    rotationRadians
  ) => {
    if (!selectedObject) {
      return;
    }

    const oldRotation =
      editObject.rotation;

    setEditObject((prev) => ({
      ...prev,
      rotation:
        rotationRadians,
    }));

    setObjects((prev) =>
      prev.map((o) =>
        o.id === selectedObject
          ? {
              ...o,
              rotation:
                rotationRadians,
            }
          : o
      )
    );

    try {
      await API.put(
        `/shop/object/${selectedObject}/rotate`,
        {
          rotation:
            rotationRadians,
        }
      );
    } catch (err) {
      console.error(
        "Rotate error:",
        err
      );

      setEditObject((prev) => ({
        ...prev,
        rotation: oldRotation,
      }));

      await loadLayout();

      show(
        "Failed to rotate object",
        "error"
      );
    }
  };

  // ─────────────────────────────────────────
  // Keyboard shortcuts
  // ─────────────────────────────────────────

  useEffect(() => {
    const handler = (e) => {
      if (!selectedObject) {
        return;
      }

      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(
          e.target.tagName
        )
      ) {
        return;
      }

      if (
        e.key === "Delete" ||
        e.key === "Backspace"
      ) {
        e.preventDefault();

        deleteObject();
      }

      if (e.key === "Escape") {
        setSelectedObject(null);
      }

      if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "s"
      ) {
        e.preventDefault();

        saveObjectChanges();
      }
    };

    window.addEventListener(
      "keydown",
      handler
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handler
      );
  }, [
    selectedObject,
    editObject,
    objects,
  ]);

  // ─────────────────────────────────────────
  // Selected object
  // ─────────────────────────────────────────

  const selectedObjectData =
    useMemo(
      () =>
        objects.find(
          (o) =>
            o.id === selectedObject
        ),
      [
        objects,
        selectedObject,
      ]
    );

  // ─────────────────────────────────────────
  // Dimensions
  // ─────────────────────────────────────────

  const shopWidth =
    Number(layout?.width) || 20;

  const shopLength =
    Number(layout?.length) || 30;

  const shopHeight =
    Number(layout?.height) || 10;

  const shopArea =
    shopWidth * shopLength;

  // ─────────────────────────────────────────
  // Camera
  // ─────────────────────────────────────────

  const cameraDistance =
    Math.max(
      shopWidth,
      shopLength
    ) *
      1.15 +
    10;

  // ─────────────────────────────────────────
  // AI local insights
  // ─────────────────────────────────────────

  const aiInsights = useMemo(() => {
    const count = objects.length;

    const shelves = objects.filter(
      (o) =>
        o.object_type === "Shelf"
    ).length;

    const counters = objects.filter(
      (o) =>
        o.object_type === "Counter"
    ).length;

    const fridges = objects.filter(
      (o) =>
        o.object_type === "Fridge"
    ).length;

    const insights = [];

    if (count === 0) {
      insights.push(
        "Start by adding shelves, racks and a billing counter."
      );
    }

    if (count > 0 && counters === 0) {
      insights.push(
        "Consider adding a billing counter."
      );
    }

    if (shelves > 8) {
      insights.push(
        "Many shelves detected. Keep enough aisle space for customer movement."
      );
    }

    if (fridges > 0) {
      insights.push(
        "Fridge zones can later be connected with beverage or cold-product sales."
      );
    }

    if (insights.length === 0) {
      insights.push(
        "Your basic layout is ready for POS and AI analysis."
      );
    }

    return insights;
  }, [objects]);

  // ─────────────────────────────────────────
  // Loading
  // ─────────────────────────────────────────

  if (loading) {
    return (
      <div style={styles.centered}>
        <div style={styles.spinner} />

        <p>
          Loading your 3D shop...
        </p>
      </div>
    );
  }

  // ─────────────────────────────────────────
  // No layout
  // ─────────────────────────────────────────

  if (!layout) {
    return (
      <div style={styles.centered}>
        <h2>
          No shop layout found
        </h2>

        <p>
          Create a shop layout before
          opening the designer.
        </p>

        <button
          onClick={() =>
            navigate("/create-layout")
          }
          style={styles.primaryButton}
        >
          Create Shop
        </button>
      </div>
    );
  }

  // ─────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────

  return (
    <div style={styles.page}>
      {/* ───────────────────────────────────
          Top Header
      ─────────────────────────────────── */}

      <div style={styles.topHeader}>
        <div style={styles.headerLeft}>
          <button
            onClick={() =>
              navigate("/dashboard")
            }
            style={styles.iconButton}
            title="Back"
          >
            <FiArrowLeft size={19} />
          </button>

          <div>
            <div style={styles.shopTitle}>
              {layout.shop_name ||
                "My Shop"}
            </div>

            <div style={styles.shopMeta}>
              {layout.shop_type ||
                storedLayout?.shopType ||
                "Shop"}{" "}
              •{" "}
              {shopWidth} ×{" "}
              {shopLength} ft •{" "}
              {shopArea.toLocaleString(
                "en-IN"
              )}{" "}
              sq.ft
            </div>
          </div>
        </div>

        <div style={styles.modeButtons}>
          <button
            onClick={() =>
              setActiveMode("design")
            }
            style={{
              ...styles.modeButton,

              ...(activeMode === "design"
                ? styles.modeActive
                : {}),
            }}
          >
            <FiBox size={15} />
            Design
          </button>

          <button
            onClick={() =>
              setActiveMode("business")
            }
            style={{
              ...styles.modeButton,

              ...(activeMode === "business"
                ? styles.modeActive
                : {}),
            }}
          >
            <FiBarChart2 size={15} />
            Business
          </button>

          <button
            onClick={() =>
              setActiveMode("ai")
            }
            style={{
              ...styles.modeButton,

              ...(activeMode === "ai"
                ? styles.aiActive
                : {}),
            }}
          >
            <FiCpu size={15} />
            AI
          </button>
        </div>

        <button
          onClick={saveObjectChanges}
          disabled={
            !selectedObject ||
            saving
          }
          style={{
            ...styles.saveTopButton,

            opacity:
              !selectedObject || saving
                ? 0.5
                : 1,
          }}
        >
          <FiSave size={16} />

          {saving
            ? "Saving..."
            : "Save"}
        </button>
      </div>

      {/* ───────────────────────────────────
          Toast
      ─────────────────────────────────── */}

      {toast && (
        <div
          style={{
            ...styles.toast,

            background:
              toast.type === "error"
                ? "#fee2e2"
                : toast.type === "success"
                ? "#dcfce7"
                : "#e0f2fe",

            color:
              toast.type === "error"
                ? "#991b1b"
                : toast.type === "success"
                ? "#166534"
                : "#075985",

            borderColor:
              toast.type === "error"
                ? "#fca5a5"
                : toast.type === "success"
                ? "#86efac"
                : "#7dd3fc",
          }}
        >
          {toast.message}
        </div>
      )}

      {/* ───────────────────────────────────
          Main
      ─────────────────────────────────── */}

      <div style={styles.workspace}>
        {/* LEFT PANEL */}

        <div style={styles.leftPanel}>
          {activeMode ===
            "design" && (
            <>
              <PanelTitle>
                Add Objects
              </PanelTitle>

              <div style={styles.objectGrid}>
                {Object.keys(
                  OBJECT_PRESETS
                ).map((type) => (
                  <button
                    key={type}
                    onClick={() =>
                      addObject(type)
                    }
                    style={styles.objectButton}
                  >
                    <FiPlus size={15} />

                    {type}
                  </button>
                ))}
              </div>

              <div
                style={styles.divider}
              />

              <PanelTitle>
                Scene
              </PanelTitle>

              <label
                style={styles.checkboxRow}
              >
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) =>
                    setShowGrid(
                      e.target.checked
                    )
                  }
                />

                Show Grid
              </label>

              <label
                style={styles.checkboxRow}
              >
                <input
                  type="checkbox"
                  checked={showWalls}
                  onChange={(e) =>
                    setShowWalls(
                      e.target.checked
                    )
                  }
                />

                Show Walls
              </label>

              <div
                style={styles.divider}
              />

              <PanelTitle>
                Shop
              </PanelTitle>

              <InfoRow
                label="Type"
                value={
                  layout.shop_type ||
                  storedLayout?.shopType ||
                  "Shop"
                }
              />

              <InfoRow
                label="Width"
                value={`${shopWidth} ft`}
              />

              <InfoRow
                label="Length"
                value={`${shopLength} ft`}
              />

              <InfoRow
                label="Height"
                value={`${shopHeight} ft`}
              />

              <InfoRow
                label="Objects"
                value={objects.length}
              />
            </>
          )}

          {activeMode ===
            "business" && (
            <>
              <PanelTitle>
                Business View
              </PanelTitle>

              <BusinessCard
                icon="📦"
                title="Products"
                value="Connect POS"
                text="Map products to shelves and racks."
              />

              <BusinessCard
                icon="📊"
                title="Sales"
                value="Ready"
                text="Sales heatmap can be connected to POS data."
              />

              <BusinessCard
                icon="⚠️"
                title="Inventory"
                value="Ready"
                text="Low-stock products can be shown inside the shop."
              />

              <BusinessCard
                icon="💰"
                title="Profit"
                value="Ready"
                text="Future version can show profit by shop zone."
              />
            </>
          )}

          {activeMode ===
            "ai" && (
            <>
              <PanelTitle>
                AI Shop Engine
              </PanelTitle>

              <div
                style={styles.aiHero}
              >
                <FiCpu size={25} />

                <strong>
                  Smart Shop Analysis
                </strong>

                <span>
                  AI-ready layout
                  analysis
                </span>
              </div>

              {aiInsights.map(
                (item, index) => (
                  <div
                    key={index}
                    style={
                      styles.insight
                    }
                  >
                    <span>
                      ✓
                    </span>

                    {item}
                  </div>
                )
              )}

              <button
                onClick={() =>
                  show(
                    "AI layout analysis is ready to connect with your sales and inventory APIs.",
                    "info"
                  )
                }
                style={
                  styles.aiButton
                }
              >
                <FiCpu size={16} />

                Analyze Shop
              </button>
            </>
          )}

          {/* Selected object */}

          <div
            style={styles.selectedPanel}
          >
            <PanelTitle>
              Selected Object
            </PanelTitle>

            {selectedObjectData ? (
              <>
                <InfoRow
                  label="Name"
                  value={
                    selectedObjectData.object_name
                  }
                />

                <InfoRow
                  label="Type"
                  value={
                    selectedObjectData.object_type
                  }
                />

                <div
                  style={styles.divider}
                />

                <NumberField
                  label="Position X"
                  value={editObject.x}
                  onChange={(v) =>
                    setEditObject(
                      (p) => ({
                        ...p,
                        x: v,
                      })
                    )
                  }
                />

                <NumberField
                  label="Position Y"
                  value={editObject.y}
                  onChange={(v) =>
                    setEditObject(
                      (p) => ({
                        ...p,
                        y: v,
                      })
                    )
                  }
                />

                <NumberField
                  label="Position Z"
                  value={editObject.z}
                  onChange={(v) =>
                    setEditObject(
                      (p) => ({
                        ...p,
                        z: v,
                      })
                    )
                  }
                />

                <NumberField
                  label="Width"
                  value={editObject.width}
                  onChange={(v) =>
                    setEditObject(
                      (p) => ({
                        ...p,
                        width: v,
                      })
                    )
                  }
                />

                <NumberField
                  label="Height"
                  value={editObject.height}
                  onChange={(v) =>
                    setEditObject(
                      (p) => ({
                        ...p,
                        height: v,
                      })
                    )
                  }
                />

                <NumberField
                  label="Depth"
                  value={editObject.depth}
                  onChange={(v) =>
                    setEditObject(
                      (p) => ({
                        ...p,
                        depth: v,
                      })
                    )
                  }
                />

                <NumberField
                  label="Rotation °"
                  value={Math.round(
                    (editObject.rotation *
                      180) /
                      Math.PI
                  )}
                  onChange={(v) =>
                    setEditObject(
                      (p) => ({
                        ...p,
                        rotation:
                          (v *
                            Math.PI) /
                          180,
                      })
                    )
                  }
                />

                <div
                  style={
                    styles.rotateGrid
                  }
                >
                  {[
                    {
                      label: "0°",
                      rad: 0,
                    },
                    {
                      label: "90°",
                      rad:
                        Math.PI / 2,
                    },
                    {
                      label: "180°",
                      rad: Math.PI,
                    },
                    {
                      label: "270°",
                      rad:
                        (3 *
                          Math.PI) /
                        2,
                    },
                  ].map(
                    (item) => (
                      <button
                        key={
                          item.label
                        }
                        onClick={() =>
                          rotateObject(
                            item.rad
                          )
                        }
                        style={
                          styles.rotateButton
                        }
                      >
                        {item.label}
                      </button>
                    )
                  )}
                </div>

                <button
                  onClick={
                    saveObjectChanges
                  }
                  disabled={saving}
                  style={{
                    ...styles.actionButton,
                    background:
                      "#16a34a",
                  }}
                >
                  <FiSave size={15} />

                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>

                <button
                  onClick={
                    duplicateObject
                  }
                  style={{
                    ...styles.actionButton,
                    background:
                      "#7c3aed",
                  }}
                >
                  <FiCopy size={15} />

                  Duplicate
                </button>

                <button
                  onClick={
                    deleteObject
                  }
                  style={{
                    ...styles.actionButton,
                    background:
                      "#dc2626",
                  }}
                >
                  <FiTrash2 size={15} />

                  Delete
                </button>
              </>
            ) : (
              <div
                style={
                  styles.emptySelection
                }
              >
                <FiBox
                  size={28}
                  color="#94a3b8"
                />

                <p>
                  Select an object
                </p>

                <span>
                  Click a shelf, rack,
                  counter or fridge in
                  the 3D shop.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 3D VIEW */}

        <div style={styles.canvas}>
          <Canvas
            shadows
            camera={{
              position: [
                cameraDistance,
                cameraDistance *
                  0.9,
                cameraDistance,
              ],
              fov: 50,
            }}
          >
            <color
              attach="background"
              args={["#eef2f7"]}
            />

            <ambientLight
              intensity={1.7}
            />

            <directionalLight
              position={[
                20,
                30,
                20,
              ]}
              intensity={2.2}
              castShadow
            />

            <OrbitControls
              makeDefault
              enableDamping
              dampingFactor={0.08}
              minDistance={5}
              maxDistance={200}
              target={[
                0,
                0,
                0,
              ]}
            />

            {/* Grid */}

            {showGrid && (
              <Grid
                args={[
                  Math.max(
                    shopWidth,
                    shopLength
                  ) * 2,
                  Math.max(
                    shopWidth,
                    shopLength
                  ) * 2,
                ]}
                cellSize={1}
                cellThickness={0.6}
                cellColor="#cbd5e1"
                sectionSize={5}
                sectionThickness={1.2}
                sectionColor="#94a3b8"
                fadeDistance={
                  Math.max(
                    shopWidth,
                    shopLength
                  ) * 2
                }
              />
            )}

            {/* Floor */}

            <mesh
              rotation={[
                -Math.PI / 2,
                0,
                0,
              ]}
              position={[
                0,
                -0.05,
                0,
              ]}
              receiveShadow
            >
              <boxGeometry
                args={[
                  shopWidth,
                  0.1,
                  shopLength,
                ]}
              />

              <meshStandardMaterial
                color="#d9dee7"
              />
            </mesh>

            {/* Walls */}

            {showWalls && (
              <ShopWalls
                width={shopWidth}
                length={shopLength}
                height={shopHeight}
                entranceSide={
                  layout.entrance_side ||
                  storedLayout?.entranceSide ||
                  "front"
                }
              />
            )}

            {/* Shop name */}

            <Text
              position={[
                0,
                0.08,
                -shopLength /
                  2 +
                  0.6,
              ]}
              rotation={[
                -Math.PI / 2,
                0,
                0,
              ]}
              fontSize={0.8}
              color="#334155"
              anchorX="center"
            >
              {layout.shop_name ||
                "My Shop"}
            </Text>

            {/* Objects */}

            {objects.map(
              (obj) => {
                const width =
                  Number(
                    obj.width
                  ) || 1;

                const height =
                  Number(
                    obj.height
                  ) || 1;

                const depth =
                  Number(
                    obj.depth
                  ) || 1;

                const x =
                  Number(obj.x) ||
                  0;

                const y =
                  Number(obj.y) ||
                  height / 2;

                const z =
                  Number(obj.z) ||
                  0;

                const rotation =
                  Number(
                    obj.rotation
                  ) || 0;

                const selected =
                  selectedObject ===
                  obj.id;

                return (
                  <group
                    key={obj.id}
                    position={[
                      x,
                      y,
                      z,
                    ]}
                    rotation={[
                      0,
                      rotation,
                      0,
                    ]}
                  >
                    <Box
                      args={[
                        width,
                        height,
                        depth,
                      ]}
                      castShadow
                      receiveShadow
                      onClick={(e) => {
                        e.stopPropagation();

                        handleSelectObject(
                          obj
                        );
                      }}
                    >
                      <meshStandardMaterial
                        color={
                          selected
                            ? "#2563eb"
                            : obj.color ||
                              "#8B4513"
                        }
                        roughness={0.65}
                      />
                    </Box>

                    {/* Selection outline */}

                    {selected && (
                      <Box
                        args={[
                          width +
                            0.08,
                          height +
                            0.08,
                          depth +
                            0.08,
                        ]}
                      >
                        <meshBasicMaterial
                          color="#2563eb"
                          wireframe
                        />
                      </Box>
                    )}

                    {/* Label */}

                    <Html
                      position={[
                        0,
                        height / 2 +
                          0.35,
                        0,
                      ]}
                      center
                      distanceFactor={
                        13
                      }
                      style={{
                        pointerEvents:
                          "none",
                      }}
                    >
                      <div
                        style={{
                          background:
                            selected
                              ? "#2563eb"
                              : "rgba(15,23,42,.85)",
                          color:
                            "#fff",
                          padding:
                            "4px 8px",
                          borderRadius:
                            6,
                          fontSize:
                            11,
                          fontWeight:
                            700,
                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        {obj.object_name ||
                          obj.object_type ||
                          "Object"}
                      </div>
                    </Html>
                  </group>
                );
              }
            )}

            {/* Entrance marker */}

            <EntranceMarker
              width={shopWidth}
              length={shopLength}
              entranceSide={
                layout.entrance_side ||
                storedLayout?.entranceSide ||
                "front"
              }
            />
          </Canvas>

          {/* Canvas controls */}

          <div
            style={
              styles.canvasControls
            }
          >
            <button
              onClick={() =>
                setShowGrid(
                  (v) => !v
                )
              }
              style={
                styles.canvasButton
              }
            >
              Grid
            </button>

            <button
              onClick={() =>
                setShowWalls(
                  (v) => !v
                )
              }
              style={
                styles.canvasButton
              }
            >
              Walls
            </button>
          </div>

          {/* Bottom status */}

          <div
            style={
              styles.canvasStatus
            }
          >
            <span>
              🏪{" "}
              {layout.shop_name}
            </span>

            <span>
              {objects.length} objects
            </span>

            <span>
              {shopWidth} ×{" "}
              {shopLength} ft
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Shop Walls
// ─────────────────────────────────────────────

function ShopWalls({
  width,
  length,
  height,
  entranceSide,
}) {
  const wallThickness = 0.18;

  const wallColor = "#cbd5e1";

  const frontGap =
    entranceSide === "front"
      ? 3
      : 0;

  const backGap =
    entranceSide === "back"
      ? 3
      : 0;

  return (
    <group>
      {/* Back */}

      {backGap > 0 ? (
        <>
          <Box
            position={[
              -(width / 2 -
                backGap / 2),
              height / 2,
              length / 2,
            ]}
            args={[
              width -
                backGap,
              height,
              wallThickness,
            ]}
          >
            <meshStandardMaterial
              color={wallColor}
              transparent
              opacity={0.55}
            />
          </Box>
        </>
      ) : (
        <Box
          position={[
            0,
            height / 2,
            length / 2,
          ]}
          args={[
            width,
            height,
            wallThickness,
          ]}
        >
          <meshStandardMaterial
            color={wallColor}
            transparent
            opacity={0.55}
          />
        </Box>
      )}

      {/* Left */}

      <Box
        position={[
          -width / 2,
          height / 2,
          0,
        ]}
        args={[
          wallThickness,
          height,
          length,
        ]}
      >
        <meshStandardMaterial
          color={wallColor}
          transparent
          opacity={0.45}
        />
      </Box>

      {/* Right */}

      <Box
        position={[
          width / 2,
          height / 2,
          0,
        ]}
        args={[
          wallThickness,
          height,
          length,
        ]}
      >
        <meshStandardMaterial
          color={wallColor}
          transparent
          opacity={0.45}
        />
      </Box>

      {/* Front with entrance gap */}

      {frontGap > 0 ? (
        <>
          <Box
            position={[
              -(width / 2 -
                frontGap / 2),
              height / 2,
              -length / 2,
            ]}
            args={[
              width -
                frontGap,
              height,
              wallThickness,
            ]}
          >
            <meshStandardMaterial
              color={wallColor}
              transparent
              opacity={0.45}
            />
          </Box>
        </>
      ) : (
        <Box
          position={[
            0,
            height / 2,
            -length / 2,
          ]}
          args={[
            width,
            height,
            wallThickness,
          ]}
        >
          <meshStandardMaterial
            color={wallColor}
            transparent
            opacity={0.45}
          />
        </Box>
      )}
    </group>
  );
}

// ─────────────────────────────────────────────
// Entrance marker
// ─────────────────────────────────────────────

function EntranceMarker({
  width,
  length,
  entranceSide,
}) {
  let position = [
    0,
    0.08,
    -length / 2,
  ];

  if (entranceSide === "back") {
    position = [
      0,
      0.08,
      length / 2,
    ];
  }

  if (entranceSide === "left") {
    position = [
      -width / 2,
      0.08,
      0,
    ];
  }

  if (entranceSide === "right") {
    position = [
      width / 2,
      0.08,
      0,
    ];
  }

  return (
    <group position={position}>
      <Box
        args={
          entranceSide ===
            "left" ||
          entranceSide ===
            "right"
            ? [0.15, 0.08, 3]
            : [3, 0.08, 0.15]
        }
      >
        <meshStandardMaterial
          color="#22c55e"
        />
      </Box>

      <Text
        position={[
          0,
          0.15,
          0,
        ]}
        fontSize={0.35}
        color="#166534"
        rotation={[
          -Math.PI / 2,
          0,
          0,
        ]}
        anchorX="center"
      >
        ENTRANCE
      </Text>
    </group>
  );
}

// ─────────────────────────────────────────────
// UI helpers
// ─────────────────────────────────────────────

function PanelTitle({
  children,
}) {
  return (
    <h3
      style={{
        margin:
          "0 0 12px",
        fontSize: 14,
        fontWeight: 750,
        color: "#1e293b",
      }}
    >
      {children}
    </h3>
  );
}

function InfoRow({
  label,
  value,
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent:
          "space-between",
        gap: 10,
        marginBottom: 7,
        fontSize: 12,
      }}
    >
      <span
        style={{
          color: "#64748b",
        }}
      >
        {label}
      </span>

      <strong
        style={{
          color: "#334155",
          textAlign: "right",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}) {
  return (
    <div
      style={{
        marginBottom: 10,
      }}
    >
      <label
        style={{
          display: "block",
          fontSize: 11,
          fontWeight: 650,
          color: "#475569",
          marginBottom: 4,
        }}
      >
        {label}
      </label>

      <input
        type="number"
        step="0.1"
        value={
          Number.isFinite(value)
            ? value
            : 0
        }
        onChange={(e) => {
          const value =
            Number(
              e.target.value
            );

          onChange(
            Number.isFinite(
              value
            )
              ? value
              : 0
          );
        }}
        style={{
          width: "100%",
          padding:
            "8px 9px",
          border:
            "1px solid #d1d5db",
          borderRadius: 7,
          fontSize: 12,
          boxSizing:
            "border-box",
          outline: "none",
        }}
      />
    </div>
  );
}

function BusinessCard({
  icon,
  title,
  value,
  text,
}) {
  return (
    <div
      style={{
        border:
          "1px solid #e2e8f0",
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        background: "#fff",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 9,
          alignItems:
            "center",
          marginBottom: 5,
        }}
      >
        <span
          style={{
            fontSize: 20,
          }}
        >
          {icon}
        </span>

        <strong
          style={{
            fontSize: 13,
          }}
        >
          {title}
        </strong>

        <span
          style={{
            marginLeft:
              "auto",
            fontSize: 10,
            color: "#16a34a",
            fontWeight: 700,
          }}
        >
          {value}
        </span>
      </div>

      <p
        style={{
          margin: 0,
          fontSize: 11,
          lineHeight: 1.5,
          color: "#64748b",
        }}
      >
        {text}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const styles = {
  page: {
    width: "100%",
    height: "100vh",
    overflow: "hidden",
    background: "#eef2f7",
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  topHeader: {
    height: 64,
    background: "#ffffff",
    borderBottom:
      "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    padding:
      "0 16px",
    gap: 14,
    position:
      "relative",
    zIndex: 20,
  },

  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 11,
    minWidth: 220,
    flex: 1,
  },

  iconButton: {
    width: 38,
    height: 38,
    border:
      "1px solid #e2e8f0",
    borderRadius: 9,
    background: "#fff",
    color: "#475569",
    display: "flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    cursor: "pointer",
  },

  shopTitle: {
    fontSize: 16,
    fontWeight: 750,
    color: "#0f172a",
  },

  shopMeta: {
    marginTop: 2,
    fontSize: 11,
    color: "#64748b",
  },

  modeButtons: {
    display: "flex",
    gap: 5,
  },

  modeButton: {
    border:
      "1px solid #e2e8f0",
    background: "#fff",
    color: "#64748b",
    borderRadius: 8,
    padding:
      "8px 11px",
    display: "flex",
    alignItems:
      "center",
    gap: 6,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 650,
  },

  modeActive: {
    background: "#eff6ff",
    color: "#2563eb",
    borderColor: "#bfdbfe",
  },

  aiActive: {
    background: "#faf5ff",
    color: "#7c3aed",
    borderColor: "#ddd6fe",
  },

  saveTopButton: {
    border: "none",
    background: "#16a34a",
    color: "#fff",
    borderRadius: 8,
    padding:
      "9px 14px",
    display: "flex",
    alignItems:
      "center",
    gap: 7,
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 12,
  },

  workspace: {
    display: "flex",
    height:
      "calc(100vh - 64px)",
  },

  leftPanel: {
    width: 320,
    flexShrink: 0,
    background: "#fff",
    borderRight:
      "1px solid #e2e8f0",
    overflowY: "auto",
    padding: 14,
    boxSizing: "border-box",
    zIndex: 10,
  },

  canvas: {
    flex: 1,
    minWidth: 0,
    position: "relative",
  },

  objectGrid: {
    display: "grid",
    gridTemplateColumns:
      "1fr 1fr",
    gap: 7,
  },

  objectButton: {
    border: "1px solid #dbeafe",
    background: "#eff6ff",
    color: "#2563eb",
    borderRadius: 8,
    padding:
      "9px 6px",
    display: "flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    gap: 5,
    cursor: "pointer",
    fontSize: 11,
    fontWeight: 700,
  },

  divider: {
    borderTop:
      "1px solid #e2e8f0",
    margin:
      "15px 0",
  },

  checkboxRow: {
    display: "flex",
    alignItems:
      "center",
    gap: 8,
    marginBottom: 9,
    fontSize: 12,
    color: "#475569",
    cursor: "pointer",
  },

  selectedPanel: {
    marginTop: 18,
    paddingTop: 14,
    borderTop:
      "1px solid #e2e8f0",
  },

  emptySelection: {
    minHeight: 130,
    display: "flex",
    flexDirection:
      "column",
    alignItems:
      "center",
    justifyContent:
      "center",
    textAlign: "center",
    color: "#94a3b8",
  },

  actionButton: {
    width: "100%",
    border: "none",
    color: "#fff",
    borderRadius: 7,
    padding:
      "9px 10px",
    marginBottom: 7,
    display: "flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    gap: 6,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
  },

  rotateGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, 1fr)",
    gap: 4,
    marginBottom: 12,
  },

  rotateButton: {
    border: "none",
    background: "#e2e8f0",
    color: "#334155",
    padding:
      "6px 2px",
    borderRadius: 5,
    cursor: "pointer",
    fontSize: 10,
    fontWeight: 700,
  },

  aiHero: {
    background:
      "linear-gradient(135deg,#f5f3ff,#faf5ff)",
    border:
      "1px solid #ddd6fe",
    borderRadius: 10,
    padding: 13,
    marginBottom: 10,
    display: "flex",
    flexDirection:
      "column",
    alignItems:
      "center",
    gap: 5,
    color: "#7c3aed",
    textAlign: "center",
  },

  insight: {
    background: "#f8fafc",
    border:
      "1px solid #e2e8f0",
    borderRadius: 8,
    padding: 9,
    marginBottom: 7,
    fontSize: 11,
    lineHeight: 1.45,
    color: "#475569",
    display: "flex",
    gap: 7,
  },

  aiButton: {
    width: "100%",
    border: "none",
    background: "#7c3aed",
    color: "#fff",
    borderRadius: 8,
    padding: 10,
    display: "flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    gap: 7,
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 12,
  },

  canvasControls: {
    position: "absolute",
    top: 14,
    right: 14,
    display: "flex",
    gap: 6,
  },

  canvasButton: {
    border:
      "1px solid #dbe3ed",
    background:
      "rgba(255,255,255,.94)",
    color: "#475569",
    borderRadius: 7,
    padding:
      "7px 10px",
    cursor: "pointer",
    fontSize: 11,
    fontWeight: 650,
  },

  canvasStatus: {
    position: "absolute",
    bottom: 14,
    left: 14,
    right: 14,
    background:
      "rgba(255,255,255,.92)",
    border:
      "1px solid #dbe3ed",
    borderRadius: 9,
    padding:
      "8px 12px",
    display: "flex",
    justifyContent:
      "space-between",
    gap: 10,
    fontSize: 11,
    color: "#475569",
    pointerEvents:
      "none",
  },

  toast: {
    position: "fixed",
    top: 78,
    right: 20,
    zIndex: 100,
    padding:
      "11px 16px",
    borderRadius: 9,
    border:
      "1px solid",
    fontWeight: 650,
    fontSize: 12,
    boxShadow:
      "0 4px 16px rgba(0,0,0,.12)",
  },

  centered: {
    minHeight: "100vh",
    display: "flex",
    flexDirection:
      "column",
    alignItems:
      "center",
    justifyContent:
      "center",
    fontFamily:
      "system-ui, sans-serif",
    color: "#334155",
  },

  spinner: {
    width: 40,
    height: 40,
    border:
      "4px solid #e5e7eb",
    borderTopColor:
      "#2563eb",
    borderRadius:
      "50%",
    animation:
      "spin .9s linear infinite",
  },

  primaryButton: {
    marginTop: 15,
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding:
      "10px 18px",
    cursor: "pointer",
    fontWeight: 700,
  },
};

// ─────────────────────────────────────────────
// Keyframes
// ─────────────────────────────────────────────

if (
  typeof document !==
    "undefined" &&
  !document.getElementById(
    "shop-designer-spin"
  )
) {
  const style =
    document.createElement(
      "style"
    );

  style.id =
    "shop-designer-spin";

  style.textContent =
    "@keyframes spin { to { transform: rotate(360deg); } }";

  document.head.appendChild(
    style
  );
}