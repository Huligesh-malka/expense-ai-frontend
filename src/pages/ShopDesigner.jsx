// src/pages/ShopDesigner.jsx
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Text, Box, Html } from "@react-three/drei";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import API from "../services/api";

// ─────────────────────────────────────────────
// Default object presets
// ─────────────────────────────────────────────
const OBJECT_PRESETS = {
  Shelf:   { width: 4,   height: 2,   depth: 1,   color: "#8B4513" },
  Counter: { width: 6,   height: 1.1, depth: 2,   color: "#A0522D" },
  Rack:    { width: 3,   height: 4,   depth: 1.5, color: "#654321" },
  Display: { width: 2,   height: 3,   depth: 2,   color: "#D2691E" },
  Fridge:  { width: 3,   height: 5,   depth: 2.5, color: "#B0C4DE" },
};

// ─────────────────────────────────────────────
// Small toast helper (no external dependency)
// ─────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const show = useCallback((message, type = "info") => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, type });
    timerRef.current = setTimeout(() => setToast(null), 2800);
  }, []);

  useEffect(() => () => timerRef.current && clearTimeout(timerRef.current), []);

  return { toast, show };
}

export default function ShopDesigner() {
  // ── Auth / business context ─────────────────
  const businessId =
    localStorage.getItem("businessId") ||
    localStorage.getItem("business_id");

  // ── State ───────────────────────────────────
  const [layout, setLayout]               = useState(null);
  const [objects, setObjects]             = useState([]);
  const [selectedObject, setSelectedObject] = useState(null);
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);

  const [editObject, setEditObject] = useState({
    x: 0, y: 0, z: 0, rotation: 0,
  });

  const { toast, show } = useToast();

  // ─────────────────────────────────────────
  // Load layout + objects
  // ─────────────────────────────────────────
  const loadLayout = useCallback(async () => {
    if (!businessId) {
      show("No business selected. Please log in again.", "error");
      setLoading(false);
      return;
    }

    try {
      const res = await API.get(`/shop/layout/${businessId}`);
      setLayout(res.data.layout);
      setObjects(res.data.objects || []);
    } catch (err) {
      console.error("Error loading layout:", err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to load shop layout";
      show(msg, "error");
    } finally {
      setLoading(false);
    }
  }, [businessId, show]);

  useEffect(() => {
    loadLayout();
  }, [loadLayout]);

  // ─────────────────────────────────────────
  // Add object (uses preset)
  // ─────────────────────────────────────────
  const addObject = async (type = "Shelf") => {
    if (!layout?.id) {
      show("Layout not loaded yet", "error");
      return;
    }

    const preset = OBJECT_PRESETS[type] || OBJECT_PRESETS.Shelf;

    const newObject = {
      layout_id:   layout.id,
      object_type: type,
      object_name: type,
      x: 0,
      y: preset.height / 2,   // sit on floor
      z: 0,
      rotation: 0,
      ...preset,
    };

    try {
      const res = await API.post("/shop/object", newObject);
      // Server may return { id, object } or just { id }
      const created = {
        id: res.data.id ?? res.data.object?.id,
        ...newObject,
        ...(res.data.object || {}),
      };
      setObjects((prev) => [...prev, created]);
      show(`${type} added`, "success");
    } catch (err) {
      console.error("Error adding object:", err);
      show(err.response?.data?.message || "Failed to add object", "error");
    }
  };

  // ─────────────────────────────────────────
  // Delete selected
  // ─────────────────────────────────────────
  const deleteObject = async () => {
    if (!selectedObject) return;
    if (!window.confirm("Delete this object?")) return;

    try {
      await API.delete(`/shop/object/${selectedObject}`);
      setObjects((prev) => prev.filter((o) => o.id !== selectedObject));
      setSelectedObject(null);
      setEditObject({ x: 0, y: 0, z: 0, rotation: 0 });
      show("Object deleted", "success");
    } catch (err) {
      console.error("Error deleting object:", err);
      show(err.response?.data?.message || "Failed to delete object", "error");
    }
  };

  // ─────────────────────────────────────────
  // Save changes to selected object
  // ─────────────────────────────────────────
  const saveObjectChanges = async () => {
    if (!selectedObject) return;
    const obj = objects.find((o) => o.id === selectedObject);
    if (!obj) return;

    setSaving(true);
    try {
      const payload = {
        ...editObject,
        // keep server-required fields
        width:       obj.width,
        height:      obj.height,
        depth:       obj.depth,
        color:       obj.color,
        object_name: obj.object_name,
        object_type: obj.object_type,
      };

      await API.put(`/shop/object/${selectedObject}`, payload);

      setObjects((prev) =>
        prev.map((o) =>
          o.id === selectedObject ? { ...o, ...editObject } : o
        )
      );

      show("Changes saved", "success");
    } catch (err) {
      console.error("Error saving object:", err);
      show(err.response?.data?.message || "Failed to save changes", "error");
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────
  // Duplicate
  // ─────────────────────────────────────────
  const duplicateObject = async () => {
    if (!selectedObject) return;
    try {
      await API.post(`/shop/object/${selectedObject}/duplicate`);
      await loadLayout();
      show("Object duplicated", "success");
    } catch (err) {
      console.error("Error duplicating object:", err);
      show(err.response?.data?.message || "Failed to duplicate", "error");
    }
  };

  // ─────────────────────────────────────────
  // Rotate (accepts radians, syncs both state + server)
  // ─────────────────────────────────────────
  const rotateObject = async (rotationRadians) => {
    if (!selectedObject) return;

    // Optimistic UI
    setEditObject((prev) => ({ ...prev, rotation: rotationRadians }));
    setObjects((prev) =>
      prev.map((o) =>
        o.id === selectedObject ? { ...o, rotation: rotationRadians } : o
      )
    );

    try {
      await API.put(`/shop/object/${selectedObject}/rotate`, {
        rotation: rotationRadians,
      });
    } catch (err) {
      console.error("Error rotating object:", err);
      show("Failed to rotate object", "error");
      // Rollback
      await loadLayout();
    }
  };

  // ─────────────────────────────────────────
  // Select object → hydrate edit form
  // ─────────────────────────────────────────
  const handleSelectObject = useCallback((obj) => {
    setSelectedObject(obj.id);
    setEditObject({
      x:        Number(obj.x)        || 0,
      y:        Number(obj.y)        || 0,
      z:        Number(obj.z)        || 0,
      rotation: Number(obj.rotation) || 0,
    });
  }, []);

  // ─────────────────────────────────────────
  // Keyboard shortcuts
  // ─────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (!selectedObject) return;
      // Ignore if typing in an input
      if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteObject();
      } else if (e.key === "Escape") {
        setSelectedObject(null);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveObjectChanges();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedObject, objects, editObject]);

  // ─────────────────────────────────────────
  // Derived
  // ─────────────────────────────────────────
  const selectedObjectData = useMemo(
    () => objects.find((o) => o.id === selectedObject),
    [objects, selectedObject]
  );

  const cameraDistance = useMemo(() => {
    if (!layout) return 30;
    const w = Number(layout.width) || 20;
    const l = Number(layout.length) || 20;
    return Math.max(w, l) * 1.2 + 10;
  }, [layout]);

  // ─────────────────────────────────────────
  // Loading / error screens
  // ─────────────────────────────────────────
  if (loading) {
    return (
      <div style={styles.centered}>
        <div style={styles.spinner} />
        <p style={{ marginTop: 16, color: "#555" }}>Loading 3D shop…</p>
      </div>
    );
  }

  if (!layout) {
    return (
      <div style={styles.centered}>
        <h2>No layout found</h2>
        <p style={{ color: "#666" }}>
          Please create a shop layout before opening the designer.
        </p>
      </div>
    );
  }

  // ─────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────
  return (
    <>
      {/* Toast */}
      {toast && (
        <div
          style={{
            ...styles.toast,
            background:
              toast.type === "error"   ? "#fee2e2" :
              toast.type === "success" ? "#dcfce7" : "#e0f2fe",
            color:
              toast.type === "error"   ? "#991b1b" :
              toast.type === "success" ? "#166534" : "#075985",
            borderColor:
              toast.type === "error"   ? "#fca5a5" :
              toast.type === "success" ? "#86efac" : "#7dd3fc",
          }}
        >
          {toast.message}
        </div>
      )}

      {/* ── Left toolbar + properties ── */}
      <div style={styles.toolbar}>
        <div style={styles.toolbarButtons}>
          {Object.keys(OBJECT_PRESETS).map((type) => (
            <button
              key={type}
              onClick={() => addObject(type)}
              style={styles.addBtn}
              title={`Add ${type}`}
            >
              + {type}
            </button>
          ))}
        </div>

        <div style={styles.panel}>
          <h3 style={styles.panelTitle}>Properties</h3>

          {selectedObjectData ? (
            <>
              <Row label="ID"   value={selectedObjectData.id} />
              <Row label="Name" value={selectedObjectData.object_name} />
              <Row label="Type" value={selectedObjectData.object_type} />

              <hr style={styles.hr} />

              <NumberField
                label="Position X"
                value={editObject.x}
                onChange={(v) => setEditObject((p) => ({ ...p, x: v }))}
              />
              <NumberField
                label="Position Y"
                value={editObject.y}
                onChange={(v) => setEditObject((p) => ({ ...p, y: v }))}
              />
              <NumberField
                label="Position Z"
                value={editObject.z}
                onChange={(v) => setEditObject((p) => ({ ...p, z: v }))}
              />

              <NumberField
                label="Rotation (°)"
                value={Math.round((editObject.rotation * 180) / Math.PI)}
                onChange={(v) =>
                  setEditObject((p) => ({
                    ...p,
                    rotation: (v * Math.PI) / 180,
                  }))
                }
              />

              <div style={styles.rotateRow}>
                {[
                  { label: "0°",   rad: 0 },
                  { label: "90°",  rad: Math.PI / 2 },
                  { label: "180°", rad: Math.PI },
                  { label: "270°", rad: (3 * Math.PI) / 2 },
                ].map((b) => (
                  <button
                    key={b.label}
                    onClick={() => rotateObject(b.rad)}
                    style={styles.smallBtn}
                  >
                    {b.label}
                  </button>
                ))}
              </div>

              <hr style={styles.hr} />

              <button
                onClick={saveObjectChanges}
                disabled={saving}
                style={{ ...styles.actionBtn, background: "#16a34a", opacity: saving ? 0.6 : 1 }}
              >
                {saving ? "Saving…" : "💾 Save Changes"}
              </button>

              <button
                onClick={duplicateObject}
                style={{ ...styles.actionBtn, background: "#8b5cf6" }}
              >
                📋 Duplicate
              </button>

              <button
                onClick={deleteObject}
                style={{ ...styles.actionBtn, background: "#dc2626" }}
              >
                🗑️ Delete
              </button>

              <p style={styles.hint}>
                Tip: press <kbd>Del</kbd> to delete, <kbd>Esc</kbd> to deselect,
                <kbd> Ctrl+S</kbd> to save.
              </p>
            </>
          ) : (
            <div style={{ color: "#666" }}>
              <p style={{ margin: "0 0 8px" }}>No object selected</p>
              <p style={{ margin: 0, fontSize: 13, color: "#999" }}>
                Click a shelf in the 3D view to edit its properties.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── 3D Canvas ── */}
      <div style={{ width: "100%", height: "100vh", background: "#f0f4f8" }}>
        <Canvas
          camera={{ position: [cameraDistance, cameraDistance, cameraDistance], fov: 55 }}
          shadows
        >
          <ambientLight intensity={1.4} />
          <directionalLight
            position={[25, 30, 25]}
            intensity={2}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />

          <OrbitControls makeDefault enableDamping dampingFactor={0.1} />

          <Grid
            args={[100, 100]}
            cellColor="#cbd5e1"
            sectionColor="#94a3b8"
            fadeDistance={80}
            fadeStrength={1.5}
          />

          {/* Floor */}
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -0.01, 0]}
            receiveShadow
          >
            <planeGeometry args={[Number(layout.width) || 20, Number(layout.length) || 20]} />
            <meshStandardMaterial color="#d9d9d9" />
          </mesh>

          {/* Shop name label */}
          <Text
            position={[0, 0.1, -(Number(layout.length) || 20) / 2 - 2]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={1}
            color="#1f2937"
          >
            {layout.shop_name}
          </Text>

          {/* Objects */}
          {objects.map((obj) => {
            const w = Number(obj.width)  || 1;
            const h = Number(obj.height) || 1;
            const d = Number(obj.depth)  || 1;
            const isSelected = selectedObject === obj.id;

            return (
              <group
                key={obj.id}
                position={[Number(obj.x) || 0, Number(obj.y) || 0, Number(obj.z) || 0]}
                rotation={[0, Number(obj.rotation) || 0, 0]}
              >
                <Box
                  args={[w, h, d]}
                  castShadow
                  receiveShadow
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectObject(obj);
                  }}
                  onPointerOver={(e) => {
                    e.stopPropagation();
                    document.body.style.cursor = "pointer";
                  }}
                  onPointerOut={() => {
                    document.body.style.cursor = "default";
                  }}
                >
                  <meshStandardMaterial
                    color={isSelected ? "#ef4444" : obj.color || "#8B4513"}
                  />
                </Box>

                {/* Selection outline */}
                {isSelected && (
                  <Box args={[w + 0.08, h + 0.08, d + 0.08]}>
                    <meshBasicMaterial color="#ef4444" wireframe />
                  </Box>
                )}

                {/* Floating label */}
                <Html
                  position={[0, h / 2 + 0.4, 0]}
                  center
                  distanceFactor={12}
                  style={{ pointerEvents: "none" }}
                >
                  <div
                    style={{
                      background: isSelected ? "#ef4444" : "rgba(30,41,59,0.85)",
                      color: "#fff",
                      padding: "3px 8px",
                      borderRadius: 6,
                      fontSize: 12,
                      whiteSpace: "nowrap",
                      fontWeight: 600,
                    }}
                  >
                    {obj.object_name || obj.object_type || "Object"}
                  </div>
                </Html>
              </group>
            );
          })}
        </Canvas>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// Tiny presentational helpers
// ─────────────────────────────────────────────
function Row({ label, value }) {
  return (
    <p style={{ margin: "4px 0", fontSize: 13 }}>
      <strong>{label}:</strong> {value}
    </p>
  );
}

function NumberField({ label, value, onChange }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 600,
          marginBottom: 4,
        }}
      >
        {label}
      </label>
      <input
        type="number"
        step="0.1"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
        style={styles.input}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const styles = {
  centered: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    fontFamily: "system-ui, sans-serif",
  },
  spinner: {
    width: 44,
    height: 44,
    border: "4px solid #e5e7eb",
    borderTopColor: "#2563eb",
    borderRadius: "50%",
    animation: "spin 0.9s linear infinite",
  },
  toast: {
    position: "fixed",
    top: 20,
    right: 20,
    zIndex: 2000,
    padding: "12px 20px",
    borderRadius: 10,
    border: "1px solid",
    fontWeight: 600,
    boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
    fontFamily: "system-ui, sans-serif",
  },
  toolbar: {
    position: "absolute",
    top: 20,
    left: 20,
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    maxHeight: "90vh",
    overflowY: "auto",
    fontFamily: "system-ui, sans-serif",
  },
  toolbarButtons: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    background: "#fff",
    padding: 10,
    borderRadius: 10,
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    maxWidth: 320,
  },
  addBtn: {
    padding: "8px 12px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  },
  panel: {
    background: "#fff",
    padding: 18,
    borderRadius: 10,
    width: 300,
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  },
  panelTitle: {
    margin: "0 0 12px 0",
    fontSize: 16,
    fontWeight: 700,
    color: "#1f2937",
  },
  hr: {
    margin: "14px 0",
    border: "none",
    borderTop: "1px solid #e5e7eb",
  },
  input: {
    width: "100%",
    padding: "8px 10px",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    fontSize: 13,
    boxSizing: "border-box",
    outline: "none",
  },
  rotateRow: {
    display: "flex",
    gap: 5,
    marginTop: 6,
  },
  smallBtn: {
    flex: 1,
    padding: "6px 0",
    background: "#e5e7eb",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
  },
  actionBtn: {
    width: "100%",
    padding: "10px 0",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 8,
  },
  hint: {
    marginTop: 10,
    fontSize: 11,
    color: "#9ca3af",
    lineHeight: 1.5,
  },
};

// Inject keyframes once
if (typeof document !== "undefined" && !document.getElementById("sd-spin")) {
  const s = document.createElement("style");
  s.id = "sd-spin";
  s.textContent = "@keyframes spin { to { transform: rotate(360deg); } }";
  document.head.appendChild(s);
}