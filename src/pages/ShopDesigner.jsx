
import * as THREE from "three";

import { Canvas, useThree } from "@react-three/fiber";

import {
  OrbitControls,
  Grid,
  Text,
  Box,
  Html,
} from "@react-three/drei";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
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
  FiSearch,
  FiMove,
  FiMaximize,
  FiChevronDown,
  FiChevronUp,
  FiShoppingBag,
  FiPackage,
} from "react-icons/fi";

import API from "../services/api";

// ============================================================
// Object presets
// ============================================================

const OBJECT_PRESETS = {
  Shelf: {
    width: 4,
    height: 2,
    depth: 1,
    color: "#8B4513",
    icon: "🗄️",
  },

  Counter: {
    width: 6,
    height: 1.1,
    depth: 2,
    color: "#A0522D",
    icon: "💳",
  },

  Rack: {
    width: 3,
    height: 4,
    depth: 1.5,
    color: "#654321",
    icon: "🛒",
  },

  Display: {
    width: 2,
    height: 3,
    depth: 2,
    color: "#D2691E",
    icon: "📦",
  },

  Fridge: {
    width: 3,
    height: 5,
    depth: 2.5,
    color: "#8FB8D8",
    icon: "🧊",
  },
};

const PRODUCT_OBJECT_TYPES = new Set([
  "Shelf",
  "Rack",
  "Display",
  "Fridge",
]);

// If your existing products API has a different URL,
// change only this function.
const getProductsEndpoint = (businessId) =>
  `/products?business_id=${encodeURIComponent(businessId)}`;

// ============================================================
// Toast
// ============================================================

function useToast() {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const show = useCallback((message, type = "info") => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setToast({ message, type });

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

  return { toast, show };
}

// ============================================================
// Main component
// ============================================================

export default function ShopDesigner() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast, show } = useToast();

  const businessId =
    localStorage.getItem("businessId") ||
    localStorage.getItem("business_id");

  const routeLayoutId = location.state?.layoutId;

  const storedLayout = useMemo(() => {
    try {
      const value =
        localStorage.getItem("activeShopLayout");

      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }, []);

  const layoutId =
    routeLayoutId ||
    storedLayout?.layoutId ||
    null;

  // ----------------------------------------------------------
  // State
  // ----------------------------------------------------------

  const [layout, setLayout] = useState(null);
  const [objects, setObjects] = useState([]);
  const [products, setProducts] = useState([]);

  const [selectedObject, setSelectedObject] =
    useState(null);

  const [assignedProducts, setAssignedProducts] =
    useState([]);

  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] =
    useState(false);
  const [saving, setSaving] = useState(false);
  const [assigningProduct, setAssigningProduct] =
    useState(false);
  const [draggingObject, setDraggingObject] =
    useState(false);

  const [activeMode, setActiveMode] =
    useState("design");

  const [showGrid, setShowGrid] = useState(true);
  const [showWalls, setShowWalls] = useState(true);
  const [showAdvanced, setShowAdvanced] =
    useState(false);
  const [showProducts, setShowProducts] =
    useState(false);

  const [productSearch, setProductSearch] =
    useState("");

  const [editObject, setEditObject] = useState({
    x: 0,
    y: 0,
    z: 0,
    rotation: 0,
    width: 1,
    height: 1,
    depth: 1,
    object_name: "",
  });

  // ----------------------------------------------------------
  // Load layout
  // ----------------------------------------------------------

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

      if (layoutId) {
        try {
          res = await API.get(
            `/shop/layout/id/${layoutId}`
          );
        } catch {
          // Compatible with your current backend:
          // GET /shop/layout/:businessId
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
  }, [businessId, layoutId, show]);

  // ----------------------------------------------------------
  // Load owner's existing POS products
  // ----------------------------------------------------------

  const loadProducts = useCallback(async () => {
    if (!businessId) return;

    setProductsLoading(true);

    try {
      const res = await API.get(
        getProductsEndpoint(businessId)
      );

      const data =
        Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.products)
          ? res.data.products
          : Array.isArray(res.data?.data)
          ? res.data.data
          : [];

      const normalized = data.map((product) => ({
        ...product,

        id:
          product.id ??
          product.product_id,

        name:
          product.product_name ||
          product.name ||
          product.title ||
          `Product ${
            product.id ??
            product.product_id ??
            ""
          }`,
      }));

      setProducts(normalized);
    } catch (err) {
      console.error(
        "Error loading products:",
        err
      );

      setProducts([]);

      show(
        err.response?.data?.message ||
          "Products could not be loaded. Check your products API.",
        "error"
      );
    } finally {
      setProductsLoading(false);
    }
  }, [businessId, show]);

  useEffect(() => {
    loadLayout();
  }, [loadLayout]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // ----------------------------------------------------------
  // Select object
  // ----------------------------------------------------------

  const selectObject = useCallback((obj) => {
    setSelectedObject(obj.id);

    setEditObject({
      x: Number(obj.x) || 0,

      y:
        Number.isFinite(Number(obj.y))
          ? Number(obj.y)
          : (Number(obj.height) || 1) / 2,

      z: Number(obj.z) || 0,

      rotation:
        Number(obj.rotation) || 0,

      width:
        Number(obj.width) || 1,

      height:
        Number(obj.height) || 1,

      depth:
        Number(obj.depth) || 1,

      object_name:
        obj.object_name ||
        obj.object_type ||
        "Object",
    });

    setShowAdvanced(false);

    setShowProducts(
      PRODUCT_OBJECT_TYPES.has(
        obj.object_type
      )
    );
  }, []);

  // ----------------------------------------------------------
  // Add furniture
  // ----------------------------------------------------------

  const addObject = async (type = "Shelf") => {
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

    const sameTypeCount =
      objects.filter(
        (object) =>
          object.object_type === type
      ).length;

    const newObject = {
      layout_id: layout.id,

      object_type: type,

      object_name: `${type} ${
        sameTypeCount + 1
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

      if (!created.id) {
        throw new Error(
          "Object was created but no object ID was returned."
        );
      }

      setObjects((prev) => [
        ...prev,
        created,
      ]);

      selectObject(created);

      show(
        `${type} added. Drag it where you need it.`,
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

  // ----------------------------------------------------------
  // Local object update
  // ----------------------------------------------------------

  const updateLocalObject = useCallback(
    (id, patch) => {
      setObjects((prev) =>
        prev.map((object) =>
          object.id === id
            ? {
                ...object,
                ...patch,
              }
            : object
        )
      );
    },
    []
  );

  // ----------------------------------------------------------
  // Save object
  // ----------------------------------------------------------

  const saveObject = useCallback(
    async (id, patch = {}) => {
      const object = objects.find(
        (item) => item.id === id
      );

      if (!object) {
        return false;
      }

      const payload = {
        x:
          Number(
            patch.x ??
              object.x
          ) || 0,

        y:
          Number(
            patch.y ??
              object.y
          ) || 0,

        z:
          Number(
            patch.z ??
              object.z
          ) || 0,

        rotation:
          Number(
            patch.rotation ??
              object.rotation
          ) || 0,

        width:
          Number(
            patch.width ??
              object.width
          ) || 1,

        height:
          Number(
            patch.height ??
              object.height
          ) || 1,

        depth:
          Number(
            patch.depth ??
              object.depth
          ) || 1,

        color:
          patch.color ??
          object.color ??
          "#8B4513",

        object_name:
          patch.object_name ??
          object.object_name ??
          object.object_type,
      };

      try {
        await API.put(
          `/shop/object/${id}`,
          payload
        );

        updateLocalObject(
          id,
          payload
        );

        if (id === selectedObject) {
          setEditObject((prev) => ({
            ...prev,
            ...payload,
          }));
        }

        return true;
      } catch (err) {
        console.error(
          "Error saving object:",
          err
        );

        show(
          err.response?.data?.message ||
            "Failed to save object",
          "error"
        );

        return false;
      }
    },
    [
      objects,
      selectedObject,
      show,
      updateLocalObject,
    ]
  );

  // ----------------------------------------------------------
  // Save selected object
  // ----------------------------------------------------------

  const saveObjectChanges =
    async () => {
      if (!selectedObject) return;

      setSaving(true);

      try {
        const ok =
          await saveObject(
            selectedObject,
            editObject
          );

        if (ok) {
          show(
            "Changes saved",
            "success"
          );
        }
      } finally {
        setSaving(false);
      }
    };

  // ----------------------------------------------------------
  // Dragging
  // ----------------------------------------------------------

  const handleObjectMove =
    useCallback(
      (id, position) => {
        updateLocalObject(id, {
          x: position.x,
          z: position.z,
        });

        if (
          id === selectedObject
        ) {
          setEditObject((prev) => ({
            ...prev,
            x: position.x,
            z: position.z,
          }));
        }
      },
      [
        selectedObject,
        updateLocalObject,
      ]
    );

  const handleObjectMoveEnd =
    useCallback(
      async (id, position) => {
        setDraggingObject(false);

        const ok =
          await saveObject(id, {
            x: position.x,
            z: position.z,
          });

        if (ok) {
          show(
            "Position saved",
            "success"
          );
        }
      },
      [saveObject, show]
    );

  // ----------------------------------------------------------
  // Easy movement buttons
  // ----------------------------------------------------------

  const moveSelected =
    async (dx, dz) => {
      if (!selectedObject) return;

      const object =
        objects.find(
          (item) =>
            item.id ===
            selectedObject
        );

      if (!object) return;

      const next = {
        x:
          Number(object.x || 0) +
          dx,

        z:
          Number(object.z || 0) +
          dz,
      };

      const ok =
        await saveObject(
          selectedObject,
          next
        );

      if (ok) {
        show(
          "Position updated",
          "success"
        );
      }
    };

  // ----------------------------------------------------------
  // Rotate
  // ----------------------------------------------------------

  const rotateObject =
    async (rotationRadians) => {
      if (!selectedObject) {
        return;
      }

      updateLocalObject(
        selectedObject,
        {
          rotation:
            rotationRadians,
        }
      );

      setEditObject((prev) => ({
        ...prev,
        rotation:
          rotationRadians,
      }));

      try {
        await API.put(
          `/shop/object/${selectedObject}/rotate`,
          {
            rotation:
              rotationRadians,
          }
        );

        show(
          "Rotation saved",
          "success"
        );
      } catch (err) {
        console.error(
          "Rotate error:",
          err
        );

        show(
          err.response?.data?.message ||
            "Failed to rotate object",
          "error"
        );

        await loadLayout();
      }
    };

  // ----------------------------------------------------------
  // Duplicate
  // ----------------------------------------------------------

  const duplicateObject =
    async () => {
      if (!selectedObject) {
        return;
      }

      try {
        const res =
          await API.post(
            `/shop/object/${selectedObject}/duplicate`
          );

        const newId =
          res.data?.id ??
          res.data?.object?.id;

        await loadLayout();

        if (newId) {
          setSelectedObject(
            newId
          );
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

  // ----------------------------------------------------------
  // Delete
  // ----------------------------------------------------------

  const deleteObject =
    async () => {
      if (!selectedObject) {
        return;
      }

      if (
        !window.confirm(
          "Delete this item from your shop?"
        )
      ) {
        return;
      }

      try {
        await API.delete(
          `/shop/object/${selectedObject}`
        );

        setObjects((prev) =>
          prev.filter(
            (object) =>
              object.id !==
              selectedObject
          )
        );

        setSelectedObject(null);
        setShowProducts(false);

        show(
          "Object deleted",
          "success"
        );
      } catch (err) {
        console.error(
          "Delete error:",
          err
        );

        show(
          err.response?.data?.message ||
            "Failed to delete object",
          "error"
        );
      }
    };

  // ----------------------------------------------------------
  // Product assignment
  // ----------------------------------------------------------

  const assignProduct =
    async (product) => {
      if (!selectedObject) {
        show(
          "Select a shelf or rack first.",
          "error"
        );
        return;
      }

      const object =
        objects.find(
          (item) =>
            item.id ===
            selectedObject
        );

      if (!object) return;

      if (
        !PRODUCT_OBJECT_TYPES.has(
          object.object_type
        )
      ) {
        show(
          "Products can be placed on a shelf, rack, display or fridge.",
          "error"
        );
        return;
      }

      const productId =
        product.id ??
        product.product_id;

      if (!productId) {
        show(
          "This product has no ID.",
          "error"
        );
        return;
      }

      setAssigningProduct(true);

      try {
        await API.post(
          "/shop/product-position",
          {
            product_id:
              productId,

            object_id:
              selectedObject,

            shelf_slot: 1,

            quantity:
              Number(
                product.stock_quantity ??
                  product.quantity ??
                  1
              ) || 1,
          }
        );

        show(
          `${product.name} added to ${object.object_name}`,
          "success"
        );

        await loadAssignedProducts();
      } catch (err) {
        console.error(
          "Product assignment error:",
          err
        );

        show(
          err.response?.data?.message ||
            "Failed to add product to shop",
          "error"
        );
      } finally {
        setAssigningProduct(
          false
        );
      }
    };

  // ----------------------------------------------------------
  // Load products already assigned to selected object
  //
  // Recommended backend endpoint:
  // GET /shop/object/:objectId/products
  // ----------------------------------------------------------

  const loadAssignedProducts =
    useCallback(
      async () => {
        if (!selectedObject) {
          setAssignedProducts([]);
          return;
        }

        try {
          const res = await API.get(
            `/shop/object/${selectedObject}/products`
          );

          const rows =
            Array.isArray(res.data)
              ? res.data
              : Array.isArray(res.data?.products)
              ? res.data.products
              : [];

          setAssignedProducts(
            rows.map((row) => ({
              ...row,

              id:
                row.id ??
                row.product_id,

              name:
                row.product_name ||
                row.name ||
                row.title ||
                `Product ${
                  row.id ??
                  row.product_id ??
                  ""
                }`,
            }))
          );
        } catch (err) {
          console.error(
            "Assigned products error:",
            err
          );

          setAssignedProducts([]);
        }
      },
      [selectedObject]
    );

  useEffect(() => {
    loadAssignedProducts();
  }, [loadAssignedProducts]);

  // ----------------------------------------------------------
  // Product search
  // ----------------------------------------------------------

  const filteredProducts =
    useMemo(() => {
      const query =
        productSearch
          .trim()
          .toLowerCase();

      if (!query) {
        return products.slice(
          0,
          80
        );
      }

      return products
        .filter((product) => {
          const name =
            product.name ||
            product.product_name ||
            "";

          const barcode =
            product.barcode ||
            product.product_code ||
            "";

          return (
            String(name)
              .toLowerCase()
              .includes(query) ||
            String(barcode)
              .toLowerCase()
              .includes(query)
          );
        })
        .slice(0, 80);
    }, [
      products,
      productSearch,
    ]);

  // ----------------------------------------------------------
  // Name
  // ----------------------------------------------------------

  const changeObjectName =
    (name) => {
      if (!selectedObject) {
        return;
      }

      setEditObject((prev) => ({
        ...prev,
        object_name: name,
      }));

      updateLocalObject(
        selectedObject,
        {
          object_name: name,
        }
      );
    };

  // ----------------------------------------------------------
  // Easy size
  // ----------------------------------------------------------

  const applySize = async (
    size
  ) => {
    if (!selectedObject) {
      return;
    }

    const object =
      objects.find(
        (item) =>
          item.id ===
          selectedObject
      );

    if (!object) return;

    const base =
      OBJECT_PRESETS[
        object.object_type
      ] ||
      OBJECT_PRESETS.Shelf;

    const multiplier =
      size === "small"
        ? 0.75
        : size === "large"
        ? 1.25
        : 1;

    const patch = {
      width:
        Number(base.width) *
        multiplier,

      height:
        Number(base.height) *
        multiplier,

      depth:
        Number(base.depth) *
        multiplier,
    };

    setEditObject((prev) => ({
      ...prev,
      ...patch,
    }));

    const ok =
      await saveObject(
        selectedObject,
        patch
      );

    if (ok) {
      show(
        `${
          size[0].toUpperCase() +
          size.slice(1)
        } size applied`,
        "success"
      );
    }
  };

  // ----------------------------------------------------------
  // Keyboard shortcuts
  // ----------------------------------------------------------

  useEffect(() => {
    const handler = (e) => {
      if (!selectedObject) {
        return;
      }

      if (
        [
          "INPUT",
          "TEXTAREA",
          "SELECT",
        ].includes(
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
        return;
      }

      if (e.key === "Escape") {
        setSelectedObject(null);
        setShowProducts(false);
        return;
      }

      if (
        (e.ctrlKey ||
          e.metaKey) &&
        e.key.toLowerCase() ===
          "s"
      ) {
        e.preventDefault();
        saveObjectChanges();
        return;
      }

      if (
        e.key === "ArrowLeft"
      ) {
        e.preventDefault();
        moveSelected(
          -0.5,
          0
        );
      }

      if (
        e.key === "ArrowRight"
      ) {
        e.preventDefault();
        moveSelected(
          0.5,
          0
        );
      }

      if (
        e.key === "ArrowUp"
      ) {
        e.preventDefault();
        moveSelected(
          0,
          -0.5
        );
      }

      if (
        e.key === "ArrowDown"
      ) {
        e.preventDefault();
        moveSelected(
          0,
          0.5
        );
      }
    };

    window.addEventListener(
      "keydown",
      handler
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handler
      );
    };
  }, [
    selectedObject,
    objects,
    editObject,
  ]);

  // ----------------------------------------------------------
  // Derived values
  // ----------------------------------------------------------

  const selectedObjectData =
    useMemo(
      () =>
        objects.find(
          (object) =>
            object.id ===
            selectedObject
        ),
      [
        objects,
        selectedObject,
      ]
    );

  const shopWidth =
    Number(layout?.width) || 20;

  const shopLength =
    Number(layout?.length) || 30;

  const shopHeight =
    Number(layout?.height) || 10;

  const shopArea =
    shopWidth * shopLength;

  const cameraDistance =
    Math.max(
      shopWidth,
      shopLength
    ) *
      1.15 +
    10;

  const aiInsights =
    useMemo(() => {
      const shelves =
        objects.filter(
          (o) =>
            o.object_type ===
            "Shelf"
        ).length;

      const counters =
        objects.filter(
          (o) =>
            o.object_type ===
            "Counter"
        ).length;

      const fridges =
        objects.filter(
          (o) =>
            o.object_type ===
            "Fridge"
        ).length;

      const insights = [];

      if (!objects.length) {
        insights.push(
          "Start by adding shelves, racks and a billing counter."
        );
      }

      if (!counters) {
        insights.push(
          "Add a billing counter near the exit or customer flow."
        );
      }

      if (shelves > 8) {
        insights.push(
          "Keep enough aisle space between shelves for comfortable movement."
        );
      }

      if (fridges) {
        insights.push(
          "Use fridge zones for cold drinks and temperature-sensitive products."
        );
      }

      if (products.length) {
        insights.push(
          `${products.length} existing POS products are available for shop placement.`
        );
      }

      if (!insights.length) {
        insights.push(
          "Your layout is ready for POS and AI analysis."
        );
      }

      return insights;
    }, [
      objects,
      products.length,
    ]);

  // ----------------------------------------------------------
  // Loading
  // ----------------------------------------------------------

  if (loading) {
    return (
      <div style={styles.centered}>
        <div style={styles.spinner} />

        <p
          style={{
            marginTop: 16,
          }}
        >
          Loading your 3D shop...
        </p>
      </div>
    );
  }

  // ----------------------------------------------------------
  // No layout
  // ----------------------------------------------------------

  if (!layout) {
    return (
      <div style={styles.centered}>
        <h2>
          No shop layout found
        </h2>

        <p
          style={{
            color: "#64748b",
          }}
        >
          Create a shop layout before
          opening the designer.
        </p>

        <button
          onClick={() =>
            navigate(
              "/create-layout"
            )
          }
          style={
            styles.primaryButton
          }
        >
          Create Shop
        </button>
      </div>
    );
  }

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <header
        style={
          styles.topHeader
        }
      >
        <div
          style={
            styles.headerLeft
          }
        >
          <button
            onClick={() =>
              navigate(
                "/dashboard"
              )
            }
            style={
              styles.iconButton
            }
            title="Back to dashboard"
          >
            <FiArrowLeft
              size={19}
            />
          </button>

          <div>
            <div
              style={
                styles.shopTitle
              }
            >
              {layout.shop_name ||
                "My Shop"}
            </div>

            <div
              style={
                styles.shopMeta
              }
            >
              {layout.shop_type ||
                storedLayout?.shopType ||
                "Shop"}
              {" • "}
              {shopWidth} ×{" "}
              {shopLength} ft
              {" • "}
              {shopArea.toLocaleString(
                "en-IN"
              )}{" "}
              sq.ft
            </div>
          </div>
        </div>

        <div
          style={
            styles.modeButtons
          }
        >
          <button
            onClick={() =>
              setActiveMode(
                "design"
              )
            }
            style={{
              ...styles.modeButton,
              ...(activeMode ===
              "design"
                ? styles.modeActive
                : {}),
            }}
          >
            <FiBox size={15} />
            Design
          </button>

          <button
            onClick={() =>
              setActiveMode(
                "business"
              )
            }
            style={{
              ...styles.modeButton,
              ...(activeMode ===
              "business"
                ? styles.modeActive
                : {}),
            }}
          >
            <FiBarChart2
              size={15}
            />
            Business
          </button>

          <button
            onClick={() =>
              setActiveMode("ai")
            }
            style={{
              ...styles.modeButton,
              ...(activeMode ===
              "ai"
                ? styles.aiActive
                : {}),
            }}
          >
            <FiCpu size={15} />
            AI
          </button>
        </div>

        <button
          onClick={
            saveObjectChanges
          }
          disabled={
            !selectedObject ||
            saving
          }
          style={{
            ...styles.saveTopButton,
            opacity:
              !selectedObject ||
              saving
                ? 0.5
                : 1,
          }}
        >
          <FiSave size={16} />

          {saving
            ? "Saving..."
            : "Save"}
        </button>
      </header>

      {/* TOAST */}
      {toast && (
        <div
          style={{
            ...styles.toast,

            background:
              toast.type ===
              "error"
                ? "#fee2e2"
                : toast.type ===
                  "success"
                ? "#dcfce7"
                : "#e0f2fe",

            color:
              toast.type ===
              "error"
                ? "#991b1b"
                : toast.type ===
                  "success"
                ? "#166534"
                : "#075985",

            borderColor:
              toast.type ===
              "error"
                ? "#fca5a5"
                : toast.type ===
                  "success"
                ? "#86efac"
                : "#7dd3fc",
          }}
        >
          {toast.message}
        </div>
      )}

      <div
        style={
          styles.workspace
        }
      >
        {/* ====================================================
            LEFT PANEL
        ==================================================== */}

        <aside
          style={
            styles.leftPanel
          }
        >
          {activeMode ===
            "design" && (
            <>
              <PanelTitle>
                Add to your shop
              </PanelTitle>

              <p
                style={
                  styles.helperText
                }
              >
                Add shelves, racks,
                counters and fridges.
                Then drag them anywhere
                in the 3D shop.
              </p>

              <div
                style={
                  styles.objectGrid
                }
              >
                {Object.entries(
                  OBJECT_PRESETS
                ).map(
                  ([
                    type,
                    preset,
                  ]) => (
                    <button
                      key={type}
                      onClick={() =>
                        addObject(
                          type
                        )
                      }
                      style={
                        styles.objectButton
                      }
                    >
                      <span
                        style={{
                          fontSize:
                            18,
                        }}
                      >
                        {
                          preset.icon
                        }
                      </span>

                      <span>
                        {type}
                      </span>
                    </button>
                  )
                )}
              </div>

              <div
                style={
                  styles.divider
                }
              />

              <PanelTitle>
                Shop view
              </PanelTitle>

              <label
                style={
                  styles.checkboxRow
                }
              >
                <input
                  type="checkbox"
                  checked={
                    showGrid
                  }
                  onChange={(e) =>
                    setShowGrid(
                      e.target
                        .checked
                    )
                  }
                />
                Show Grid
              </label>

              <label
                style={
                  styles.checkboxRow
                }
              >
                <input
                  type="checkbox"
                  checked={
                    showWalls
                  }
                  onChange={(e) =>
                    setShowWalls(
                      e.target
                        .checked
                    )
                  }
                />
                Show Walls
              </label>

              <div
                style={
                  styles.divider
                }
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
                label="Size"
                value={`${shopWidth} × ${shopLength} ft`}
              />

              <InfoRow
                label="Area"
                value={`${shopArea.toLocaleString(
                  "en-IN"
                )} sq.ft`}
              />

              <InfoRow
                label="Shop items"
                value={
                  objects.length
                }
              />

              <InfoRow
                label="POS products"
                value={
                  products.length
                }
              />

              <div
                style={
                  styles.tipCard
                }
              >
                <FiMove
                  size={16}
                />

                <span>
                  <strong>
                    Easy move:
                  </strong>{" "}
                  select any item
                  and drag it
                  directly in the
                  3D view.
                </span>
              </div>
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
                value={`${products.length}`}
                text="Your existing POS products are available for shop placement."
              />

              <BusinessCard
                icon="📊"
                title="Sales"
                value="Ready"
                text="Sales data can later power a shop heatmap."
              />

              <BusinessCard
                icon="⚠️"
                title="Inventory"
                value="Ready"
                text="Low-stock products can later be highlighted inside the 3D shop."
              />

              <BusinessCard
                icon="💰"
                title="Profit"
                value="Ready"
                text="AI can later compare sales and profit by shop zone."
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
                style={
                  styles.aiHero
                }
              >
                <FiCpu
                  size={26}
                />

                <strong>
                  Smart Shop
                  Analysis
                </strong>

                <span>
                  AI-ready layout
                </span>
              </div>

              {aiInsights.map(
                (
                  item,
                  index
                ) => (
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
                    "AI analysis can be connected to your sales and inventory APIs next.",
                    "info"
                  )
                }
                style={
                  styles.aiButton
                }
              >
                <FiCpu
                  size={16}
                />

                Analyze Shop
              </button>
            </>
          )}

          {/* ==================================================
              SELECTED ITEM
          ================================================== */}

          <div
            style={
              styles.selectedPanel
            }
          >
            <PanelTitle>
              {selectedObjectData
                ? "Selected Item"
                : "Properties"}
            </PanelTitle>

            {selectedObjectData ? (
              <>
                <div
                  style={
                    styles.selectedHero
                  }
                >
                  <div
                    style={
                      styles.selectedIcon
                    }
                  >
                    {OBJECT_PRESETS[
                      selectedObjectData
                        .object_type
                    ]?.icon ||
                      "📦"}
                  </div>

                  <div>
                    <strong>
                      {
                        selectedObjectData.object_name
                      }
                    </strong>

                    <span>
                      {
                        selectedObjectData.object_type
                      }
                    </span>
                  </div>
                </div>

                {/* NAME */}
                <label
                  style={
                    styles.fieldLabel
                  }
                >
                  Name
                </label>

                <input
                  type="text"
                  value={
                    editObject.object_name
                  }
                  onChange={(e) =>
                    changeObjectName(
                      e.target.value
                    )
                  }
                  onBlur={() =>
                    saveObject(
                      selectedObject,
                      {
                        object_name:
                          editObject.object_name,
                      }
                    )
                  }
                  style={
                    styles.input
                  }
                />

                {/* MOVE */}
                <div
                  style={
                    styles.sectionTitle
                  }
                >
                  <FiMove
                    size={14}
                  />
                  Move
                </div>

                <div
                  style={
                    styles.moveGrid
                  }
                >
                  <span />

                  <MoveButton
                    label="↑"
                    onClick={() =>
                      moveSelected(
                        0,
                        -1
                      )
                    }
                  />

                  <span />

                  <MoveButton
                    label="←"
                    onClick={() =>
                      moveSelected(
                        -1,
                        0
                      )
                    }
                  />

                  <MoveButton
                    label="⌖"
                    onClick={() =>
                      moveSelected(
                        0,
                        0
                      )
                    }
                  />

                  <MoveButton
                    label="→"
                    onClick={() =>
                      moveSelected(
                        1,
                        0
                      )
                    }
                  />

                  <span />

                  <MoveButton
                    label="↓"
                    onClick={() =>
                      moveSelected(
                        0,
                        1
                      )
                    }
                  />

                  <span />
                </div>

                <p
                  style={
                    styles.smallHint
                  }
                >
                  Or drag the item
                  directly in the
                  3D view.
                </p>

                {/* SIZE */}
                <div
                  style={
                    styles.sectionTitle
                  }
                >
                  <FiMaximize
                    size={14}
                  />
                  Size
                </div>

                <div
                  style={
                    styles.threeButtons
                  }
                >
                  {[
                    [
                      "small",
                      "Small",
                    ],
                    [
                      "medium",
                      "Medium",
                    ],
                    [
                      "large",
                      "Large",
                    ],
                  ].map(
                    ([
                      value,
                      label,
                    ]) => (
                      <button
                        key={
                          value
                        }
                        onClick={() =>
                          applySize(
                            value
                          )
                        }
                        style={
                          styles.secondaryButton
                        }
                      >
                        {label}
                      </button>
                    )
                  )}
                </div>

                {/* ROTATION */}
                <div
                  style={
                    styles.sectionTitle
                  }
                >
                  <FiRotateCw
                    size={14}
                  />
                  Direction
                </div>

                <div
                  style={
                    styles.rotateGrid
                  }
                >
                  {[
                    {
                      label:
                        "0°",
                      rad: 0,
                    },
                    {
                      label:
                        "90°",
                      rad:
                        Math.PI /
                        2,
                    },
                    {
                      label:
                        "180°",
                      rad:
                        Math.PI,
                    },
                    {
                      label:
                        "270°",
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
                        {
                          item.label
                        }
                      </button>
                    )
                  )}
                </div>

                {/* PRODUCTS */}
                {PRODUCT_OBJECT_TYPES.has(
                  selectedObjectData.object_type
                ) && (
                  <>
                    <button
                      onClick={() =>
                        setShowProducts(
                          (value) =>
                            !value
                        )
                      }
                      style={
                        styles.productsHeader
                      }
                    >
                      <span>
                        <FiPackage
                          size={15}
                        />
                        Products
                      </span>

                      {showProducts ? (
                        <FiChevronUp />
                      ) : (
                        <FiChevronDown />
                      )}
                    </button>

                    {showProducts && (
                      <div
                        style={
                          styles.productsPanel
                        }
                      >
                        <div
                          style={
                            styles.searchWrap
                          }
                        >
                          <FiSearch
                            size={14}
                          />

                          <input
                            value={
                              productSearch
                            }
                            onChange={(
                              e
                            ) =>
                              setProductSearch(
                                e
                                  .target
                                  .value
                              )
                            }
                            placeholder="Search existing products..."
                            style={
                              styles.searchInput
                            }
                          />
                        </div>

                        {assignedProducts.length >
                          0 && (
                          <div
                            style={
                              styles.assignedBox
                            }
                          >
                            <strong>
                              Already assigned
                            </strong>

                            {assignedProducts
                              .slice(
                                0,
                                10
                              )
                              .map(
                                (
                                  product
                                ) => (
                                  <div
                                    key={
                                      product.id
                                    }
                                    style={
                                      styles.assignedRow
                                    }
                                  >
                                    ✓{" "}
                                    {
                                      product.name
                                    }
                                  </div>
                                )
                              )}
                          </div>
                        )}

                        {productsLoading ? (
                          <div
                            style={
                              styles.mutedText
                            }
                          >
                            Loading your
                            products...
                          </div>
                        ) : !products.length ? (
                          <div
                            style={
                              styles.emptyProducts
                            }
                          >
                            <FiShoppingBag
                              size={22}
                            />

                            <strong>
                              No products
                              loaded
                            </strong>

                            <span>
                              Your existing
                              POS products
                              will appear
                              here.
                            </span>
                          </div>
                        ) : (
                          <div
                            style={
                              styles.productList
                            }
                          >
                            {filteredProducts.map(
                              (
                                product
                              ) => (
                                <button
                                  key={
                                    product.id
                                  }
                                  disabled={
                                    assigningProduct
                                  }
                                  onClick={() =>
                                    assignProduct(
                                      product
                                    )
                                  }
                                  style={
                                    styles.productRow
                                  }
                                >
                                  <span
                                    style={
                                      styles.productDot
                                    }
                                  >
                                    +
                                  </span>

                                  <span
                                    style={
                                      styles.productInfo
                                    }
                                  >
                                    <strong>
                                      {
                                        product.name
                                      }
                                    </strong>

                                    {product.barcode && (
                                      <small>
                                        {
                                          product.barcode
                                        }
                                      </small>
                                    )}
                                  </span>
                                </button>
                              )
                            )}

                            {!filteredProducts.length && (
                              <div
                                style={
                                  styles.mutedText
                                }
                              >
                                No matching
                                products.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* ADVANCED */}
                <button
                  onClick={() =>
                    setShowAdvanced(
                      (value) =>
                        !value
                    )
                  }
                  style={
                    styles.advancedHeader
                  }
                >
                  <span>
                    Advanced Settings
                  </span>

                  {showAdvanced ? (
                    <FiChevronUp />
                  ) : (
                    <FiChevronDown />
                  )}
                </button>

                {showAdvanced && (
                  <div
                    style={
                      styles.advancedPanel
                    }
                  >
                    <NumberField
                      label="Position X"
                      value={
                        editObject.x
                      }
                      onChange={(
                        value
                      ) =>
                        setEditObject(
                          (prev) => ({
                            ...prev,
                            x: value,
                          })
                        )
                      }
                    />

                    <NumberField
                      label="Position Y"
                      value={
                        editObject.y
                      }
                      onChange={(
                        value
                      ) =>
                        setEditObject(
                          (prev) => ({
                            ...prev,
                            y: value,
                          })
                        )
                      }
                    />

                    <NumberField
                      label="Position Z"
                      value={
                        editObject.z
                      }
                      onChange={(
                        value
                      ) =>
                        setEditObject(
                          (prev) => ({
                            ...prev,
                            z: value,
                          })
                        )
                      }
                    />

                    <NumberField
                      label="Width"
                      value={
                        editObject.width
                      }
                      onChange={(
                        value
                      ) =>
                        setEditObject(
                          (prev) => ({
                            ...prev,
                            width: value,
                          })
                        )
                      }
                    />

                    <NumberField
                      label="Height"
                      value={
                        editObject.height
                      }
                      onChange={(
                        value
                      ) =>
                        setEditObject(
                          (prev) => ({
                            ...prev,
                            height: value,
                          })
                        )
                      }
                    />

                    <NumberField
                      label="Depth"
                      value={
                        editObject.depth
                      }
                      onChange={(
                        value
                      ) =>
                        setEditObject(
                          (prev) => ({
                            ...prev,
                            depth: value,
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
                      onChange={(
                        value
                      ) =>
                        setEditObject(
                          (prev) => ({
                            ...prev,
                            rotation:
                              (value *
                                Math.PI) /
                              180,
                          })
                        )
                      }
                    />

                    <button
                      onClick={
                        saveObjectChanges
                      }
                      disabled={
                        saving
                      }
                      style={{
                        ...styles.actionButton,
                        background:
                          "#16a34a",
                      }}
                    >
                      <FiSave
                        size={15}
                      />

                      {saving
                        ? "Saving..."
                        : "Save Changes"}
                    </button>
                  </div>
                )}

                {/* ACTIONS */}
                <div
                  style={
                    styles.actionRow
                  }
                >
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
                    <FiCopy
                      size={15}
                    />
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
                    <FiTrash2
                      size={15}
                    />
                    Delete
                  </button>
                </div>
              </>
            ) : (
              <div
                style={
                  styles.emptySelection
                }
              >
                <FiBox
                  size={30}
                  color="#94a3b8"
                />

                <p>
                  Select something
                  in the 3D shop
                </p>

                <span>
                  Click or drag a
                  shelf, rack,
                  counter or fridge.
                </span>
              </div>
            )}
          </div>
        </aside>

        {/* ====================================================
            3D VIEW
        ==================================================== */}

        <main
          style={
            styles.canvas
          }
        >
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
            onPointerMissed={() => {
              setSelectedObject(
                null
              );
              setShowProducts(
                false
              );
            }}
          >
            <color
              attach="background"
              args={[
                "#eef2f7",
              ]}
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
              enabled={
                !draggingObject
              }
              enableDamping
              dampingFactor={0.08}
              minDistance={5}
              maxDistance={200}
              target={[0, 0, 0]}
            />

            {/* GRID */}
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
                sectionThickness={
                  1.2
                }
                sectionColor="#94a3b8"
                fadeDistance={
                  Math.max(
                    shopWidth,
                    shopLength
                  ) * 2
                }
              />
            )}

            {/* FLOOR */}
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
              onPointerDown={(e) =>
                e.stopPropagation()
              }
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

            {/* WALLS */}
            {showWalls && (
              <ShopWalls
                width={shopWidth}
                length={
                  shopLength
                }
                height={
                  shopHeight
                }
                entranceSide={
                  layout.entrance_side ||
                  storedLayout?.entranceSide ||
                  "front"
                }
              />
            )}

            {/* SHOP NAME */}
            <Text
              position={[
                0,
                0.08,
                -shopLength / 2 +
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

            {/* FURNITURE */}
            {objects.map(
              (object) => (
                <DraggableShopObject
                  key={object.id}
                  object={object}
                  selected={
                    selectedObject ===
                    object.id
                  }
                  shopWidth={
                    shopWidth
                  }
                  shopLength={
                    shopLength
                  }
                  onSelect={
                    selectObject
                  }
                  onMove={
                    handleObjectMove
                  }
                  onMoveStart={() =>
                    setDraggingObject(
                      true
                    )
                  }
                  onMoveEnd={
                    handleObjectMoveEnd
                  }
                />
              )
            )}

            <EntranceMarker
              width={shopWidth}
              length={
                shopLength
              }
              entranceSide={
                layout.entrance_side ||
                storedLayout?.entranceSide ||
                "front"
              }
            />
          </Canvas>

          <div
            style={
              styles.canvasControls
            }
          >
            <button
              onClick={() =>
                setShowGrid(
                  (value) =>
                    !value
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
                  (value) =>
                    !value
                )
              }
              style={
                styles.canvasButton
              }
            >
              Walls
            </button>
          </div>

          <div
            style={
              styles.dragHint
            }
          >
            <FiMove size={14} />
            Drag furniture to
            move it
          </div>

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
              {objects.length} shop
              items
            </span>

            <span>
              {products.length} POS
              products
            </span>

            <span>
              {shopWidth} ×{" "}
              {shopLength} ft
            </span>
          </div>
        </main>
      </div>
    </div>
  );
}

// ============================================================
// Draggable 3D furniture
// ============================================================

function DraggableShopObject({
  object,
  selected,
  shopWidth,
  shopLength,
  onSelect,
  onMove,
  onMoveStart,
  onMoveEnd,
}) {
  const { camera } =
    useThree();

  const [dragging, setDragging] =
    useState(false);

  const offsetRef =
    useRef({
      x: 0,
      z: 0,
    });

  const latestPositionRef =
    useRef({
      x: Number(object.x) || 0,
      z: Number(object.z) || 0,
    });

  const planeRef =
    useRef(
      new THREE.Plane(
        new THREE.Vector3(
          0,
          1,
          0
        ),
        0
      )
    );

  const pointRef =
    useRef(
      new THREE.Vector3()
    );

  const getGroundPoint =
    useCallback(
      (event) => {
        const pointer =
          new THREE.Vector2(
            event.pointer.x,
            event.pointer.y
          );

        const raycaster =
          new THREE.Raycaster();

        raycaster.setFromCamera(
          pointer,
          camera
        );

        planeRef.current.set(
          new THREE.Vector3(
            0,
            1,
            0
          ),
          -0.01
        );

        return raycaster.ray.intersectPlane(
          planeRef.current,
          pointRef.current
        );
      },
      [camera]
    );

  const handlePointerDown =
    (event) => {
      event.stopPropagation();

      onSelect(object);

      const point =
        getGroundPoint(event);

      if (!point) {
        return;
      }

      offsetRef.current = {
        x:
          Number(object.x || 0) -
          point.x,

        z:
          Number(object.z || 0) -
          point.z,
      };

      setDragging(true);
      onMoveStart?.();

      try {
        event.target.setPointerCapture(
          event.pointerId
        );
      } catch {
        // Ignore if unavailable.
      }

      document.body.style.cursor =
        "grabbing";
    };

  const handlePointerMove =
    (event) => {
      if (!dragging) {
        return;
      }

      event.stopPropagation();

      const point =
        getGroundPoint(event);

      if (!point) {
        return;
      }

      const halfWidth =
        Math.max(
          Number(object.width) ||
            1,
          0.5
        ) / 2;

      const halfDepth =
        Math.max(
          Number(object.depth) ||
            1,
          0.5
        ) / 2;

      const nextX =
        THREE.MathUtils.clamp(
          point.x +
            offsetRef.current
              .x,

          -shopWidth / 2 +
            halfWidth,

          shopWidth / 2 -
            halfWidth
        );

      const nextZ =
        THREE.MathUtils.clamp(
          point.z +
            offsetRef.current
              .z,

          -shopLength / 2 +
            halfDepth,

          shopLength / 2 -
            halfDepth
        );

      const nextPosition = {
        x: Number(
          nextX.toFixed(3)
        ),
        z: Number(
          nextZ.toFixed(3)
        ),
      };

      latestPositionRef.current =
        nextPosition;

      onMove(
        object.id,
        nextPosition
      );
    };

  const finishDrag =
    (event) => {
      if (!dragging) {
        return;
      }

      event.stopPropagation();

      setDragging(false);

      onMoveEnd?.(
        object.id,
        latestPositionRef.current
      );

      try {
        event.target.releasePointerCapture(
          event.pointerId
        );
      } catch {
        // Ignore.
      }

      document.body.style.cursor =
        "default";
    };

  const width =
    Number(object.width) || 1;

  const height =
    Number(object.height) || 1;

  const depth =
    Number(object.depth) || 1;

  const x =
    Number(object.x) || 0;

  const y =
    Number(object.y) ||
    height / 2;

  const z =
    Number(object.z) || 0;

  const rotation =
    Number(object.rotation) || 0;

  useEffect(() => {
    if (!dragging) {
      latestPositionRef.current = {
        x: Number(object.x) || 0,
        z: Number(object.z) || 0,
      };
    }
  }, [object.x, object.z, dragging]);

  const baseColor =
    object.color ||
    OBJECT_PRESETS[
      object.object_type
    ]?.color ||
    "#8B4513";

  return (
    <group
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
        onClick={(event) => {
          event.stopPropagation();
          onSelect(object);
        }}
        onPointerDown={
          handlePointerDown
        }
        onPointerMove={
          handlePointerMove
        }
        onPointerUp={
          finishDrag
        }
        onPointerOver={(event) => {
          event.stopPropagation();

          document.body.style.cursor =
            "grab";
        }}
        onPointerOut={() => {
          if (!dragging) {
            document.body.style.cursor =
              "default";
          }
        }}
      >
        <meshStandardMaterial
          color={
            selected
              ? "#2563eb"
              : baseColor
          }
          roughness={0.62}
        />
      </Box>

      {selected && (
        <Box
          args={[
            width + 0.08,
            height + 0.08,
            depth + 0.08,
          ]}
        >
          <meshBasicMaterial
            color="#2563eb"
            wireframe
          />
        </Box>
      )}

      <Html
        position={[
          0,
          height / 2 +
            0.35,
          0,
        ]}
        center
        distanceFactor={13}
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
                : "rgba(15,23,42,.88)",

            color: "#fff",

            padding:
              "4px 8px",

            borderRadius: 6,

            fontSize: 11,

            fontWeight: 700,

            whiteSpace:
              "nowrap",
          }}
        >
          {object.object_name ||
            object.object_type ||
            "Object"}
        </div>
      </Html>
    </group>
  );
}

// ============================================================
// Walls
// ============================================================

function ShopWalls({
  width,
  length,
  height,
  entranceSide,
}) {
  const wallThickness =
    0.18;

  const wallColor =
    "#cbd5e1";

  const frontGap =
    entranceSide ===
    "front"
      ? 3
      : 0;

  const backGap =
    entranceSide ===
    "back"
      ? 3
      : 0;

  return (
    <group>
      {/* BACK */}
      {backGap > 0 ? (
        <Box
          position={[
            -(
              width / 2 -
              backGap / 2
            ),
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
            color={
              wallColor
            }
            transparent
            opacity={0.55}
          />
        </Box>
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
            color={
              wallColor
            }
            transparent
            opacity={0.55}
          />
        </Box>
      )}

      {/* LEFT */}
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
          color={
            wallColor
          }
          transparent
          opacity={0.45}
        />
      </Box>

      {/* RIGHT */}
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
          color={
            wallColor
          }
          transparent
          opacity={0.45}
        />
      </Box>

      {/* FRONT */}
      {frontGap > 0 ? (
        <Box
          position={[
            -(
              width / 2 -
              frontGap / 2
            ),
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
            color={
              wallColor
            }
            transparent
            opacity={0.45}
          />
        </Box>
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
            color={
              wallColor
            }
            transparent
            opacity={0.45}
          />
        </Box>
      )}
    </group>
  );
}

// ============================================================
// Entrance
// ============================================================

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

  if (
    entranceSide ===
    "back"
  ) {
    position = [
      0,
      0.08,
      length / 2,
    ];
  }

  if (
    entranceSide ===
    "left"
  ) {
    position = [
      -width / 2,
      0.08,
      0,
    ];
  }

  if (
    entranceSide ===
    "right"
  ) {
    position = [
      width / 2,
      0.08,
      0,
    ];
  }

  return (
    <group
      position={position}
    >
      <Box
        args={
          entranceSide ===
            "left" ||
          entranceSide ===
            "right"
            ? [
                0.15,
                0.08,
                3,
              ]
            : [
                3,
                0.08,
                0.15,
              ]
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

// ============================================================
// UI helpers
// ============================================================

function PanelTitle({
  children,
}) {
  return (
    <h3
      style={{
        margin:
          "0 0 10px",
        fontSize: 14,
        fontWeight: 800,
        color: "#0f172a",
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
        marginBottom: 8,
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
        marginBottom: 9,
      }}
    >
      <label
        style={{
          display: "block",
          fontSize: 11,
          fontWeight: 700,
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
          Number.isFinite(
            Number(value)
          )
            ? value
            : 0
        }
        onChange={(e) =>
          onChange(
            Number(
              e.target.value
            ) || 0
          )
        }
        style={
          styles.input
        }
      />
    </div>
  );
}

function MoveButton({
  label,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={
        styles.moveButton
      }
    >
      {label}
    </button>
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
      style={
        styles.businessCard
      }
    >
      <div
        style={
          styles.businessCardTop
        }
      >
        <span
          style={{
            fontSize: 20,
          }}
        >
          {icon}
        </span>

        <strong>
          {title}
        </strong>

        <span
          style={{
            marginLeft:
              "auto",
            color:
              "#16a34a",
            fontSize: 11,
            fontWeight: 800,
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
          color:
            "#64748b",
        }}
      >
        {text}
      </p>
    </div>
  );
}

// ============================================================
// Styles
// ============================================================

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
    background: "#fff",
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
    alignItems:
      "center",
    gap: 11,
    minWidth: 230,
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
    fontWeight: 800,
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
    fontWeight: 700,
  },

  modeActive: {
    background: "#eff6ff",
    color: "#2563eb",
    borderColor:
      "#bfdbfe",
  },

  aiActive: {
    background:
      "#faf5ff",
    color: "#7c3aed",
    borderColor:
      "#ddd6fe",
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
    fontWeight: 800,
    fontSize: 12,
  },

  workspace: {
    display: "flex",
    height:
      "calc(100vh - 64px)",
  },

  leftPanel: {
    width: 340,
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
    gap: 8,
  },

  objectButton: {
    border:
      "1px solid #dbeafe",
    background: "#eff6ff",
    color: "#2563eb",
    borderRadius: 9,
    padding:
      "10px 7px",
    display: "flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    gap: 7,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 800,
  },

  helperText: {
    margin:
      "0 0 12px",
    color: "#64748b",
    fontSize: 11,
    lineHeight: 1.5,
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

  tipCard: {
    display: "flex",
    gap: 8,
    alignItems:
      "flex-start",
    marginTop: 14,
    padding: 10,
    borderRadius: 9,
    background: "#f0fdf4",
    border:
      "1px solid #bbf7d0",
    color: "#166534",
    fontSize: 11,
    lineHeight: 1.45,
  },

  selectedPanel: {
    marginTop: 18,
    paddingTop: 14,
    borderTop:
      "1px solid #e2e8f0",
  },

  selectedHero: {
    display: "flex",
    alignItems:
      "center",
    gap: 10,
    padding: 10,
    marginBottom: 12,
    background: "#f8fafc",
    border:
      "1px solid #e2e8f0",
    borderRadius: 9,
  },

  selectedIcon: {
    width: 36,
    height: 36,
    borderRadius: 9,
    background: "#eff6ff",
    display: "flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    fontSize: 19,
  },

  fieldLabel: {
    display: "block",
    marginBottom: 5,
    fontSize: 11,
    fontWeight: 750,
    color: "#475569",
  },

  input: {
    width: "100%",
    padding:
      "9px 10px",
    border:
      "1px solid #d1d5db",
    borderRadius: 8,
    fontSize: 12,
    boxSizing:
      "border-box",
    outline: "none",
    background: "#fff",
  },

  sectionTitle: {
    display: "flex",
    alignItems:
      "center",
    gap: 6,
    margin:
      "15px 0 8px",
    color: "#334155",
    fontSize: 12,
    fontWeight: 800,
  },

  moveGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, 1fr)",
    gap: 5,
    width: 160,
    margin: "0 auto",
  },

  moveButton: {
    height: 34,
    border:
      "1px solid #dbe3ed",
    background: "#f8fafc",
    borderRadius: 7,
    color: "#334155",
    cursor: "pointer",
    fontSize: 16,
    fontWeight: 800,
  },

  smallHint: {
    margin:
      "7px 0 0",
    color: "#94a3b8",
    textAlign:
      "center",
    fontSize: 10,
  },

  threeButtons: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, 1fr)",
    gap: 5,
  },

  secondaryButton: {
    border:
      "1px solid #dbe3ed",
    background: "#f8fafc",
    color: "#334155",
    borderRadius: 7,
    padding:
      "8px 5px",
    cursor: "pointer",
    fontSize: 10,
    fontWeight: 750,
  },

  rotateGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, 1fr)",
    gap: 5,
  },

  rotateButton: {
    border: "none",
    background: "#e2e8f0",
    color: "#334155",
    padding:
      "7px 2px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 10,
    fontWeight: 800,
  },

  productsHeader: {
    width: "100%",
    display: "flex",
    alignItems:
      "center",
    justifyContent:
      "space-between",
    border:
      "1px solid #bfdbfe",
    background: "#eff6ff",
    color: "#1d4ed8",
    borderRadius: 8,
    padding:
      "9px 10px",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 800,
    marginTop: 4,
  },

  productsPanel: {
    marginTop: 7,
    padding: 8,
    background: "#f8fafc",
    border:
      "1px solid #e2e8f0",
    borderRadius: 8,
  },

  searchWrap: {
    display: "flex",
    alignItems:
      "center",
    gap: 6,
    background: "#fff",
    border:
      "1px solid #dbe3ed",
    borderRadius: 7,
    padding:
      "0 8px",
    marginBottom: 8,
    color: "#94a3b8",
  },

  searchInput: {
    border: "none",
    outline: "none",
    width: "100%",
    padding:
      "8px 3px",
    fontSize: 11,
  },

  productList: {
    maxHeight: 230,
    overflowY: "auto",
  },

  productRow: {
    width: "100%",
    display: "flex",
    alignItems:
      "center",
    gap: 8,
    border: "none",
    borderBottom:
      "1px solid #edf2f7",
    background: "#fff",
    padding:
      "8px 7px",
    cursor: "pointer",
    textAlign: "left",
  },

  productDot: {
    width: 23,
    height: 23,
    borderRadius: 6,
    background: "#dcfce7",
    color: "#15803d",
    display: "flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    flexShrink: 0,
    fontWeight: 800,
  },

  productInfo: {
    minWidth: 0,
    display: "flex",
    flexDirection:
      "column",
    gap: 2,
  },

  assignedBox: {
    marginBottom: 8,
    padding: 8,
    background: "#f0fdf4",
    border:
      "1px solid #bbf7d0",
    borderRadius: 7,
    fontSize: 10,
    color: "#166534",
  },

  assignedRow: {
    paddingTop: 5,
  },

  emptyProducts: {
    display: "flex",
    flexDirection:
      "column",
    alignItems:
      "center",
    gap: 5,
    padding: 18,
    color: "#94a3b8",
    textAlign:
      "center",
    fontSize: 10,
  },

  mutedText: {
    padding: 12,
    color: "#94a3b8",
    fontSize: 10,
    textAlign:
      "center",
  },

  advancedHeader: {
    width: "100%",
    marginTop: 12,
    display: "flex",
    alignItems:
      "center",
    justifyContent:
      "space-between",
    border: "none",
    background: "#f8fafc",
    color: "#64748b",
    borderRadius: 7,
    padding:
      "9px 10px",
    cursor: "pointer",
    fontSize: 11,
    fontWeight: 750,
  },

  advancedPanel: {
    marginTop: 7,
    padding: 9,
    border:
      "1px solid #e2e8f0",
    borderRadius: 8,
    background: "#f8fafc",
  },

  actionRow: {
    display: "grid",
    gridTemplateColumns:
      "1fr 1fr",
    gap: 7,
    marginTop: 9,
  },

  actionButton: {
    width: "100%",
    border: "none",
    color: "#fff",
    borderRadius: 7,
    padding:
      "9px 8px",
    display: "flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    gap: 6,
    cursor: "pointer",
    fontSize: 11,
    fontWeight: 800,
  },

  emptySelection: {
    minHeight: 150,
    display: "flex",
    flexDirection:
      "column",
    alignItems:
      "center",
    justifyContent:
      "center",
    textAlign:
      "center",
    color: "#94a3b8",
    gap: 3,
  },

  businessCard: {
    border:
      "1px solid #e2e8f0",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    background: "#fff",
  },

  businessCardTop: {
    display: "flex",
    gap: 9,
    alignItems:
      "center",
    marginBottom: 5,
  },

  aiHero: {
    background:
      "linear-gradient(135deg,#f5f3ff,#faf5ff)",
    border:
      "1px solid #ddd6fe",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    display: "flex",
    flexDirection:
      "column",
    alignItems:
      "center",
    gap: 5,
    color: "#7c3aed",
    textAlign:
      "center",
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
    fontWeight: 800,
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
    fontWeight: 700,
  },

  dragHint: {
    position: "absolute",
    top: 14,
    left: 14,
    display: "flex",
    alignItems:
      "center",
    gap: 6,
    background:
      "rgba(255,255,255,.94)",
    border:
      "1px solid #dbe3ed",
    borderRadius: 8,
    padding:
      "7px 10px",
    color: "#475569",
    fontSize: 10,
    pointerEvents:
      "none",
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
    fontWeight: 700,
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
    borderRadius: "50%",
    animation:
      "shop-designer-spin .9s linear infinite",
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

// ============================================================
// Spinner animation
// ============================================================

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
    "@keyframes shop-designer-spin { to { transform: rotate(360deg); } }";

  document.head.appendChild(
    style
  );
}
