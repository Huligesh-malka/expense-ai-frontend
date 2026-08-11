import { useEffect, useState, useRef } from "react";
import API from "../services/api";
import BarcodeScanner from "../pages/BarcodeScanner";

export default function BillingPOS() {
  const businessId = localStorage.getItem("businessId");

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");

  // Scanner state
  const [showScanner, setShowScanner] = useState(false);
  const [scanMode, setScanMode] = useState("quick"); // "quick" or "ask"

  // Customer fields – phone is now optional
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState(null);
  const [isCustomerFound, setIsCustomerFound] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Discount and GST
  const [discount, setDiscount] = useState(0);
  const [gst, setGst] = useState(18);

  const [invoiceNo, setInvoiceNo] = useState("");
  const [saleComplete, setSaleComplete] = useState(false);

  // Cash received for change calculation
  const [cashReceived, setCashReceived] = useState("");

  // Category filter
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [categories, setCategories] = useState([]);

  // Quantity input refs
  const quantityInputRef = useRef(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showQtyModal, setShowQtyModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedUnit, setSelectedUnit] = useState("pcs");

  // Current time
  const [currentTime, setCurrentTime] = useState(new Date());

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // F2 - Focus search
      if (e.key === "F2") {
        e.preventDefault();
        document.getElementById("search-input")?.focus();
      }
      // F4 - Open scanner
      if (e.key === "F4") {
        e.preventDefault();
        setShowScanner(true);
      }
      // F8 - Focus payment
      if (e.key === "F8") {
        e.preventDefault();
        document.getElementById("cash-received")?.focus();
      }
      // Ctrl+Enter - Complete bill
      if (e.key === "Enter" && e.ctrlKey) {
        e.preventDefault();
        if (cart.length > 0) saveSale();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [cart]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-dismiss the "bill settled" confirmation banner
  useEffect(() => {
    if (saleComplete) {
      const t = setTimeout(() => setSaleComplete(false), 2600);
      return () => clearTimeout(t);
    }
  }, [saleComplete]);

  // Get compatible units based on product's base unit
  const getCompatibleUnits = (priceUnit) => {
    const unitMap = {
      pcs: ["pcs", "dozen"],
      g: ["g", "kg"],
      kg: ["g", "kg"],
      ml: ["ml", "l"],
      l: ["ml", "l"],
      pack: ["pack"],
      box: ["box"],
      bottle: ["bottle"],
      dozen: ["pcs", "dozen"],
      meter: ["meter", "feet"],
      feet: ["meter", "feet"],
    };
    return unitMap[priceUnit] || ["pcs"];
  };

  // Unit display names
  const unitDisplayNames = {
    pcs: "Pieces",
    g: "Gram",
    kg: "Kilogram",
    ml: "Milliliter",
    l: "Liter",
    pack: "Pack",
    box: "Box",
    bottle: "Bottle",
    dozen: "Dozen",
    meter: "Meter",
    feet: "Feet",
  };

  // Convert quantity from one unit to another
  const convertDisplayUnit = (quantity, fromUnit, toUnit) => {
    if (fromUnit === toUnit) return quantity;

    let baseQuantity = quantity;
    if (fromUnit === "kg") baseQuantity = quantity * 1000;
    else if (fromUnit === "l") baseQuantity = quantity * 1000;
    else if (fromUnit === "dozen") baseQuantity = quantity * 12;
    else if (fromUnit === "feet") baseQuantity = quantity * 0.3048;
    else if (fromUnit === "g") baseQuantity = quantity;
    else if (fromUnit === "ml") baseQuantity = quantity;
    else if (fromUnit === "meter") baseQuantity = quantity;
    else if (fromUnit === "pcs") baseQuantity = quantity;

    let result = baseQuantity;
    if (toUnit === "kg") result = baseQuantity / 1000;
    else if (toUnit === "l") result = baseQuantity / 1000;
    else if (toUnit === "dozen") result = baseQuantity / 12;
    else if (toUnit === "feet") result = baseQuantity / 0.3048;
    else if (toUnit === "g") result = baseQuantity;
    else if (toUnit === "ml") result = baseQuantity;
    else if (toUnit === "meter") result = baseQuantity;
    else if (toUnit === "pcs") result = baseQuantity;

    return result;
  };

  // Format unit display
  const formatUnitDisplay = (unit) => {
    return unitDisplayNames[unit] || unit;
  };

  // AUTO CUSTOMER SEARCH FUNCTION
  const searchCustomer = async (phone) => {
    if (phone.length < 10) {
      setIsCustomerFound(false);
      setCustomerId(null);
      setCustomerName("");
      return;
    }

    setIsSearching(true);
    try {
      const res = await API.get(
        `/customers/search/${phone}?business_id=${businessId}`
      );

      if (res.data.success && res.data.data) {
        setCustomerId(res.data.data.id);
        setCustomerName(res.data.data.customer_name);
        setIsCustomerFound(true);
      } else {
        setCustomerId(null);
        setCustomerName("");
        setIsCustomerFound(false);
      }
    } catch (err) {
      setCustomerId(null);
      setCustomerName("");
      setIsCustomerFound(false);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    loadProducts();
    generateInvoiceNo();
    extractCategories();
  }, []);

  const generateInvoiceNo = () => {
    const prefix = "INV";
    const timestamp = Date.now().toString().slice(-8);
    setInvoiceNo(`${prefix}${timestamp}`);
  };

  const loadProducts = async () => {
    try {
      const res = await API.get(`/products?business_id=${businessId}`);
      setProducts(res.data.data);
    } catch (err) {
      console.log(err);
    }
  };

  const extractCategories = () => {
    // Extract unique categories from products (you may need to adjust based on your data structure)
    const uniqueCategories = ["All", "Grocery", "Medical", "Drinks", "Snacks", "Other"];
    setCategories(uniqueCategories);
  };

  const openQuantityModal = (product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setSelectedUnit(product.price_unit || "pcs");
    setShowQtyModal(true);
    setTimeout(() => {
      if (quantityInputRef.current) {
        quantityInputRef.current.focus();
        quantityInputRef.current.select();
      }
    }, 100);
  };

  // Quick add mode - automatically add product with quantity 1
  const quickAddToCart = (product) => {
    const unit = product.price_unit || "pcs";
    const priceData = calculateLivePriceForProduct(product, 1, unit);

    if (product.stock < priceData.convertedQuantity) {
      alert(`Only ${product.stock} ${product.price_unit} available in stock`);
      return;
    }

    const exist = cart.find(
      (item) => item.id === product.id && item.unit === unit
    );

    if (exist) {
      setCart(
        cart.map((item) =>
          item.id === product.id && item.unit === unit
            ? {
                ...item,
                quantity: item.quantity + 1,
                convertedQuantity: item.convertedQuantity + priceData.convertedQuantity,
                displayQuantity: item.displayQuantity + priceData.displayQuantity,
                totalPrice:
                  (item.convertedQuantity + priceData.convertedQuantity) *
                  item.price_per_unit,
              }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          id: product.id,
          product_name: product.product_name,
          price_per_unit: priceData.pricePerUnit,
          base_unit: product.price_unit || "pcs",
          quantity: 1,
          unit: unit,
          convertedQuantity: priceData.convertedQuantity,
          displayQuantity: priceData.displayQuantity,
          displayUnit: priceData.displayUnit,
          totalPrice: priceData.total,
        },
      ]);
    }
  };

  const calculateLivePriceForProduct = (product, qty, unit) => {
    const baseUnit = product.price_unit || "pcs";
    const convertedQuantity = convertDisplayUnit(qty, unit, baseUnit);
    const pricePerUnit = product.selling_price / (product.price_per || 1);
    const total = convertedQuantity * pricePerUnit;

    let displayQuantity = convertedQuantity;
    let displayUnit = baseUnit;

    if (baseUnit === "g" && convertedQuantity >= 1000) {
      displayQuantity = convertedQuantity / 1000;
      displayUnit = "kg";
    } else if (baseUnit === "ml" && convertedQuantity >= 1000) {
      displayQuantity = convertedQuantity / 1000;
      displayUnit = "l";
    } else if (baseUnit === "pcs" && convertedQuantity >= 12) {
      displayQuantity = convertedQuantity / 12;
      displayUnit = "dozen";
    } else {
      displayQuantity = convertedQuantity;
      displayUnit = baseUnit;
    }

    return {
      total,
      convertedQuantity,
      displayQuantity,
      displayUnit,
      baseUnit,
      pricePerUnit,
    };
  };

  const calculateLivePrice = () => {
    if (!selectedProduct)
      return {
        total: 0,
        convertedQuantity: 0,
        displayQuantity: 0,
        displayUnit: selectedProduct?.price_unit || "pcs",
        baseUnit: selectedProduct?.price_unit || "pcs",
        pricePerUnit: 0,
      };

    return calculateLivePriceForProduct(selectedProduct, quantity, selectedUnit);
  };

  const addToCartWithQuantity = () => {
    if (!selectedProduct) return;

    if (quantity <= 0) {
      alert("Quantity must be greater than 0");
      return;
    }

    const priceData = calculateLivePrice();

    if (selectedProduct.stock < priceData.convertedQuantity) {
      alert(`Only ${selectedProduct.stock} ${selectedProduct.price_unit} available in stock`);
      return;
    }

    const exist = cart.find(
      (item) => item.id === selectedProduct.id && item.unit === selectedUnit
    );

    if (exist) {
      setCart(
        cart.map((item) =>
          item.id === selectedProduct.id && item.unit === selectedUnit
            ? {
                ...item,
                quantity: item.quantity + quantity,
                convertedQuantity: item.convertedQuantity + priceData.convertedQuantity,
                displayQuantity: item.displayQuantity + priceData.displayQuantity,
                totalPrice:
                  (item.convertedQuantity + priceData.convertedQuantity) *
                  item.price_per_unit,
              }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          id: selectedProduct.id,
          product_name: selectedProduct.product_name,
          price_per_unit: priceData.pricePerUnit,
          base_unit: selectedProduct.price_unit || "pcs",
          quantity: quantity,
          unit: selectedUnit,
          convertedQuantity: priceData.convertedQuantity,
          displayQuantity: priceData.displayQuantity,
          displayUnit: priceData.displayUnit,
          totalPrice: priceData.total,
        },
      ]);
    }

    setShowQtyModal(false);
    setSelectedProduct(null);
    setQuantity(1);
    setSelectedUnit("pcs");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      addToCartWithQuantity();
    }
    if (e.key === "Escape") {
      setShowQtyModal(false);
      setSelectedProduct(null);
      setQuantity(1);
      setSelectedUnit("pcs");
    }
  };

  const changeQty = (id, delta, unit) => {
    const item = cart.find((i) => i.id === id && i.unit === unit);
    if (!item) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      setCart(cart.filter((i) => !(i.id === id && i.unit === unit)));
      return;
    }

    const ratio = newQty / item.quantity;
    setCart(
      cart.map((i) => {
        if (i.id === id && i.unit === unit) {
          return {
            ...i,
            quantity: newQty,
            convertedQuantity: i.convertedQuantity * ratio,
            displayQuantity: i.displayQuantity * ratio,
            totalPrice: i.price_per_unit * i.convertedQuantity * ratio,
          };
        }
        return i;
      })
    );
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const discountAmount = subtotal * (Number(discount) / 100);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (Number(gst) / 100);
  const cgst = taxAmount / 2;
  const sgst = taxAmount / 2;
  const grandTotal = taxableAmount + taxAmount;

  // Validate phone number (optional now)
  const isPhoneValid = customerPhone.length === 0 || (customerPhone.length === 10 && /^\d{10}$/.test(customerPhone));

  // Calculate change
  const change = cashReceived ? Number(cashReceived) - grandTotal : 0;
  const showChange = paymentMethod === "Cash" && cashReceived && change >= 0;

  const saveSale = async () => {
    try {
      const payload = {
        business_id: businessId,
        customer_id: customerId,
        customer_name: customerName || "Walk-in Customer",
        customer_phone: customerPhone || null,
        payment_method: paymentMethod,
        payment_status: "Paid",
        discount: Number(discount),
        gst: Number(gst),
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          entered_unit: item.unit,
        })),
      };

      const res = await API.post("/sales/create", payload);

      setSaleComplete(true);
      setCart([]);
      loadProducts();
      generateInvoiceNo();

      setCustomerName("");
      setCustomerPhone("");
      setCustomerId(null);
      setIsCustomerFound(false);
      setDiscount(0);
      setGst(18);
      setCashReceived("");
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Error creating sale");
    }
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm("Clear all items from cart?")) {
      setCart([]);
    }
  };

  const getStockStatus = (product) => {
    const unit = product.price_unit || "pcs";
    const unitDisplay = formatUnitDisplay(unit);

    if (product.stock <= 0) {
      return { text: "OUT OF STOCK", tone: "out" };
    } else if (product.stock <= 5) {
      return { text: `${product.stock} ${unitDisplay} left`, tone: "low" };
    } else if (product.stock <= 20) {
      return { text: `${product.stock} ${unitDisplay} left`, tone: "mid" };
    }
    return { text: `${product.stock} ${unitDisplay} available`, tone: "high" };
  };

  const liveTotalDigits = showQtyModal ? calculateLivePrice().total.toFixed(2) : null;

  // Filter products by search and category
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.product_name.toLowerCase().includes(search.toLowerCase()) ||
                          (p.barcode && p.barcode.includes(search)) ||
                          (p.sku && p.sku.includes(search));
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800;900&family=Manrope:wght@400;500;600;700;800&family=Orbitron:wght@500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

        :root {
          --steel-bg: #E6E9EC;
          --steel-panel: #FBFCFD;
          --steel-panel-2: #EFF2F4;
          --charcoal: #1A1D22;
          --charcoal-soft: #262B32;
          --charcoal-line: #3B4048;
          --brass: #C6A15B;
          --brass-bright: #E7C888;
          --brass-deep: #8C6C34;
          --led-amber: #FFB020;
          --led-red: #FF5C4D;
          --ink: #1A1D22;
          --ink-soft: #5B616B;
          --muted: #90959D;
          --line: #D2D7DC;
          --good: #1E8A5C;
        }

        * { box-sizing: border-box; }

        .pos-wrap {
          font-family: 'Manrope', sans-serif;
          background:
            repeating-linear-gradient(115deg, rgba(255,255,255,0.35) 0px, rgba(255,255,255,0.35) 1px, transparent 1px, transparent 34px),
            var(--steel-bg);
          min-height: 100vh;
          padding: 26px;
        }

        /* Top Status Bar */
        .status-bar {
          max-width: 1620px;
          margin: 0 auto 16px;
          background: var(--charcoal);
          border-radius: 12px;
          padding: 10px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #fff;
          font-size: 12px;
        }
        .status-left { display: flex; align-items: center; gap: 16px; }
        .status-brand {
          font-family: 'Big Shoulders Display', sans-serif;
          font-weight: 800;
          font-size: 18px;
          color: var(--brass-bright);
        }
        .status-online {
          color: #5FE0A0;
          font-weight: 600;
          font-size: 11px;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .status-online::before {
          content: '';
          width: 7px;
          height: 7px;
          background: #5FE0A0;
          border-radius: 50%;
          display: inline-block;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .status-right {
          display: flex;
          gap: 20px;
          color: #8C93A0;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
        }

        .pos-layout {
          max-width: 1620px;
          margin: 0 auto;
          display: flex;
          gap: 24px;
          align-items: flex-start;
        }

        /* ============ LEFT: PRODUCT SHELF ============ */
        .shelf-col { flex: 1.75; }

        .shelf-topbar {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 16px;
          padding-bottom: 14px;
          border-bottom: 3px solid var(--charcoal);
        }
        .brand-block { display: flex; align-items: baseline; gap: 12px; }
        .brand-mark {
          width: 34px; height: 34px;
          border-radius: 7px;
          background: linear-gradient(155deg, var(--brass-bright), var(--brass-deep));
          display: flex; align-items: center; justify-content: center;
          font-family: 'Orbitron', sans-serif;
          font-weight: 700;
          font-size: 15px;
          color: var(--charcoal);
          box-shadow: 0 2px 0 var(--brass-deep);
          flex-shrink: 0;
        }
        .shelf-heading {
          font-family: 'Big Shoulders Display', sans-serif;
          font-weight: 900;
          font-size: 34px;
          line-height: 1;
          color: var(--charcoal);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .shelf-heading .sub {
          display: block;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10.5px;
          font-weight: 500;
          color: var(--ink-soft);
          text-transform: uppercase;
          letter-spacing: 2.5px;
          margin-top: 2px;
        }
        .shelf-count {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12.5px;
          color: var(--ink-soft);
          background: var(--steel-panel-2);
          border: 1px solid var(--line);
          padding: 5px 10px;
          border-radius: 20px;
        }

        .shelf-search-row {
          display: flex;
          gap: 10px;
          margin-bottom: 12px;
        }
        .shelf-search {
          flex: 1;
          padding: 13px 16px;
          border-radius: 9px;
          border: 1.5px solid var(--line);
          background: var(--steel-panel);
          font-family: 'Manrope', sans-serif;
          font-size: 14px;
          font-weight: 500;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .shelf-search:focus { border-color: var(--brass); box-shadow: 0 0 0 3px rgba(198,161,91,0.18); }
        .shelf-scan {
          padding: 0 22px;
          background: var(--charcoal);
          color: var(--brass-bright);
          border: none;
          border-radius: 9px;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 0.3px;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
          display: flex; align-items: center; gap: 7px;
        }
        .shelf-scan:hover { background: var(--charcoal-soft); }
        .shelf-scan:active { transform: scale(0.96); }

        /* Category Filters */
        .category-filters {
          display: flex;
          gap: 6px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .cat-btn {
          padding: 5px 14px;
          border: 1.5px solid var(--line);
          background: transparent;
          border-radius: 20px;
          font-family: 'Manrope', sans-serif;
          font-size: 12px;
          font-weight: 600;
          color: var(--ink-soft);
          cursor: pointer;
          transition: all 0.15s;
        }
        .cat-btn:hover { border-color: var(--brass); color: var(--charcoal); }
        .cat-btn.active {
          background: var(--charcoal);
          color: var(--brass-bright);
          border-color: var(--charcoal);
        }

        .tag-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 14px;
          max-height: calc(100vh - 280px);
          overflow-y: auto;
          padding: 4px 6px 12px 2px;
        }
        .tag-grid::-webkit-scrollbar { width: 6px; }
        .tag-grid::-webkit-scrollbar-thumb { background: #B9C0C7; border-radius: 6px; }

        /* ===== COMPACT PRODUCT CARD - Simplified ===== */
        .price-tag {
          position: relative;
          background: var(--steel-panel);
          border-radius: 10px;
          padding: 0 0 12px;
          box-shadow: 0 1px 2px rgba(20,22,26,0.06), 0 6px 16px rgba(20,22,26,0.05);
          border: 1px solid var(--line);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: transform 0.14s, box-shadow 0.14s, border-color 0.14s;
          min-height: 220px;
        }
        .price-tag:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(20,22,26,0.12);
          border-color: var(--brass);
        }
        .tag-brass-strip {
          height: 3px;
          background: linear-gradient(90deg, var(--brass-deep), var(--brass-bright) 45%, var(--brass-deep));
          flex-shrink: 0;
        }

        .tag-body { 
          padding: 14px 14px 10px; 
          display: flex; 
          flex-direction: column; 
          flex: 1; 
          gap: 8px;
        }

        /* 1. Product Name */
        .tag-name {
          font-family: 'Manrope', sans-serif;
          font-weight: 700;
          font-size: 14px;
          line-height: 1.3;
          color: var(--ink);
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 36px;
        }

        /* 2. Price and Unit combined */
        .tag-price-block {
          display: flex;
          align-items: baseline;
          gap: 6px;
          margin: 4px 0;
        }
        .tag-price {
          font-family: 'Orbitron', sans-serif;
          font-weight: 700;
          font-size: 20px;
          color: var(--led-amber);
          text-shadow: 0 0 8px rgba(255,176,32,0.45);
          letter-spacing: 0.5px;
          white-space: nowrap;
        }
        .tag-price .rupee-symbol {
          font-size: 14px;
          opacity: 0.8;
          margin-right: 1px;
        }
        .tag-unit {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: var(--ink-soft);
          font-weight: 500;
          white-space: nowrap;
        }
        .tag-unit .per-text {
          font-size: 10px;
          color: var(--muted);
        }

        /* 3. Available Stock */
        .tag-stock {
          font-size: 12px;
          font-weight: 600;
          color: var(--muted);
          padding: 2px 0;
        }
        .tag-stock.high { color: var(--good); }
        .tag-stock.mid { color: var(--brass-deep); }
        .tag-stock.low { color: var(--led-red); }
        .tag-stock.out { 
          color: var(--led-red); 
          font-weight: 700;
          background: rgba(255,92,77,0.1);
          padding: 2px 8px;
          border-radius: 4px;
          display: inline-block;
          width: fit-content;
        }

        /* 4. Action Button */
        .tag-add-btn {
          margin-top: auto;
          width: 100%;
          padding: 9px 0;
          background: var(--charcoal);
          color: var(--brass-bright);
          border: none;
          border-radius: 8px;
          font-weight: 700;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s, opacity 0.15s;
          font-family: 'Manrope', sans-serif;
        }
        .tag-add-btn:hover:not(:disabled) { 
          background: linear-gradient(135deg, var(--brass-deep), var(--brass)); 
          color: var(--charcoal);
        }
        .tag-add-btn:active:not(:disabled) { transform: scale(0.96); }
        .tag-add-btn:disabled {
          background: var(--steel-panel-2);
          color: var(--muted);
          cursor: not-allowed;
          opacity: 0.7;
        }

        /* 5. SKU - Small at bottom */
        .tag-sku {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          color: var(--muted);
          padding: 2px 0 0;
          border-top: 1px solid var(--line);
          margin-top: 2px;
          opacity: 0.6;
          letter-spacing: 0.3px;
        }

        .no-products {
          grid-column: 1 / -1;
          text-align: center;
          padding: 60px 0;
          color: var(--muted);
          font-weight: 500;
        }

        .search-result-count {
          font-size: 12px;
          color: var(--ink-soft);
          margin-bottom: 12px;
          font-family: 'JetBrains Mono', monospace;
        }

        /* ============ RIGHT: COUNTER DISPLAY PANEL ============ */
        .receipt-col {
          flex: 1;
          max-width: 408px;
          position: sticky;
          top: 26px;
        }
        .receipt {
          background: var(--charcoal);
          border-radius: 16px;
          padding: 22px 22px 24px;
          color: #E8EAEE;
          box-shadow: 0 20px 50px rgba(20,22,26,0.35);
          border: 1px solid var(--charcoal-line);
        }

        .receipt-store-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        .receipt-store {
          font-family: 'Big Shoulders Display', sans-serif;
          font-weight: 800;
          font-size: 21px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: #fff;
        }
        .receipt-inv {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10.5px;
          color: #8C93A0;
          letter-spacing: 0.5px;
        }

        /* the digital weighing-scale total display */
        .scale-display {
          margin-top: 14px;
          background: #0F1114;
          border-radius: 12px;
          padding: 16px 18px;
          border: 1px solid #33383F;
          box-shadow: inset 0 2px 8px rgba(0,0,0,0.5);
        }
        .scale-display .scale-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9.5px;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: #6B7178;
          margin-bottom: 4px;
          display: flex;
          justify-content: space-between;
        }
        .scale-display .scale-total {
          font-family: 'Orbitron', sans-serif;
          font-weight: 700;
          font-size: 40px;
          line-height: 1.1;
          color: var(--led-amber);
          text-shadow: 0 0 14px rgba(255,176,32,0.55), 0 0 2px rgba(255,176,32,0.8);
          letter-spacing: 1px;
        }
        .scale-display .scale-total .rupee { font-size: 22px; margin-right: 3px; opacity: 0.85; }
        .scale-display .scale-meta {
          display: flex;
          justify-content: space-between;
          margin-top: 6px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10.5px;
          color: #6B7178;
        }

        .save-banner {
          background: var(--good);
          color: #fff;
          text-align: center;
          font-size: 12.5px;
          font-weight: 700;
          padding: 8px 0;
          border-radius: 7px;
          margin-top: 12px;
          animation: bannerIn 0.25s ease;
        }
        @keyframes bannerIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .receipt-dash {
          border: none;
          border-top: 1px dashed var(--charcoal-line);
          margin: 16px 0;
        }

        .customer-line label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9.5px;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: #8C93A0;
          display: block;
          margin-bottom: 6px;
        }
        .customer-input {
          width: 100%;
          border: none;
          border-bottom: 1.5px solid var(--charcoal-line);
          background: transparent;
          color: #fff;
          font-family: 'JetBrains Mono', monospace;
          font-size: 14.5px;
          padding: 5px 2px;
          outline: none;
          transition: border-color 0.15s;
        }
        .customer-input:focus { border-bottom-color: var(--brass); }
        .customer-status {
          font-size: 11.5px;
          margin-top: 6px;
          font-weight: 600;
        }
        .status-found { color: #5FE0A0; }
        .status-new { color: #8C93A0; }
        .status-searching { color: var(--led-amber); }
        .status-invalid { color: var(--led-red); }

        .walkin-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          background: #0F1114;
          border-radius: 6px;
          margin-top: 6px;
          font-size: 13px;
          color: #8C93A0;
        }
        .walkin-badge .icon { font-size: 18px; }

        .items-zone {
          min-height: 84px;
          max-height: 190px;
          overflow-y: auto;
          margin: 14px 0;
        }
        .items-zone::-webkit-scrollbar { width: 5px; }
        .items-zone::-webkit-scrollbar-thumb { background: var(--charcoal-line); border-radius: 6px; }
        .item-line {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          padding: 6px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .item-line:last-child { border-bottom: none; }
        .item-line .name-block { flex: 1; min-width: 0; }
        .item-line .name-block .nm {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: block;
          font-weight: 600;
          color: #F2F3F5;
        }
        .item-line .name-block .qty {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: #8C93A0;
        }
        .item-line .qty-controls {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .item-line .qty-btn {
          background: #0F1114;
          border: 1px solid var(--charcoal-line);
          color: #E8EAEE;
          border-radius: 4px;
          width: 22px;
          height: 22px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
        }
        .item-line .qty-btn:hover { background: var(--charcoal-soft); }
        .item-line .qty-val {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          font-weight: 600;
          min-width: 24px;
          text-align: center;
        }
        .item-line .amt {
          font-family: 'JetBrains Mono', monospace;
          font-weight: 700;
          color: var(--led-amber);
          white-space: nowrap;
          font-size: 12px;
          min-width: 60px;
          text-align: right;
        }
        .item-line .rm {
          background: none;
          border: none;
          color: var(--led-red);
          font-weight: 700;
          cursor: pointer;
          padding: 0 0 0 6px;
          opacity: 0.75;
          font-size: 14px;
        }
        .item-line .rm:hover { opacity: 1; }
        .empty-receipt {
          text-align: center;
          color: #6B7178;
          font-size: 12.5px;
          padding: 22px 0;
        }

        .totals-block { font-size: 12.5px; font-family: 'JetBrains Mono', monospace; }
        .totals-row {
          display: flex;
          justify-content: space-between;
          padding: 3px 0;
          color: #8C93A0;
        }
        .totals-row .v { color: #E8EAEE; font-weight: 600; }

        .field-pair { display: flex; gap: 12px; margin: 16px 0 14px; }
        .field-pair .fld { flex: 1; }
        .field-pair label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #6B7178;
          display: block;
          margin-bottom: 4px;
        }
        .field-pair input {
          width: 100%;
          border: none;
          border-bottom: 1.5px solid var(--charcoal-line);
          background: transparent;
          color: #fff;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          padding: 3px 0;
          outline: none;
        }
        .field-pair input:focus { border-bottom-color: var(--brass); }

        .pay-row { display: flex; gap: 6px; margin-bottom: 12px; }
        .pay-opt {
          flex: 1;
          padding: 8px 0;
          text-align: center;
          border: 1.5px solid var(--charcoal-line);
          background: transparent;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11.5px;
          font-weight: 600;
          border-radius: 6px;
          cursor: pointer;
          color: #8C93A0;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }
        .pay-opt.active {
          border-color: var(--brass);
          background: linear-gradient(135deg, var(--brass-bright), var(--brass-deep));
          color: var(--charcoal);
        }

        .cash-change {
          background: #0F1114;
          border-radius: 8px;
          padding: 10px 14px;
          margin-bottom: 12px;
          border: 1px solid #33383F;
        }
        .cash-change-row {
          display: flex;
          justify-content: space-between;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          padding: 2px 0;
        }
        .cash-change-row .lbl { color: #8C93A0; }
        .cash-change-row .val { color: #E8EAEE; font-weight: 600; }
        .cash-change-row .val.change { color: var(--led-amber); }
        .cash-input {
          width: 100%;
          border: none;
          border-bottom: 1.5px solid var(--charcoal-line);
          background: transparent;
          color: #fff;
          font-family: 'JetBrains Mono', monospace;
          font-size: 14px;
          padding: 4px 2px;
          outline: none;
        }
        .cash-input:focus { border-bottom-color: var(--brass); }

        .receipt-actions { display: flex; gap: 8px; }
        .btn-clear {
          flex: 1;
          padding: 13px 0;
          background: transparent;
          border: 1.5px solid var(--led-red);
          color: var(--led-red);
          border-radius: 8px;
          font-weight: 700;
          font-size: 12.5px;
          cursor: pointer;
        }
        .btn-clear:disabled { opacity: 0.3; cursor: not-allowed; }
        .btn-settle {
          flex: 2.2;
          padding: 13px 0;
          background: linear-gradient(135deg, var(--brass-bright), var(--brass-deep));
          color: var(--charcoal);
          border: none;
          border-radius: 8px;
          font-weight: 800;
          font-size: 13.5px;
          letter-spacing: 0.2px;
          cursor: pointer;
          font-family: 'Manrope', sans-serif;
          box-shadow: 0 4px 14px rgba(198,161,91,0.35);
        }
        .btn-settle:hover:not(:disabled) { filter: brightness(1.06); }
        .btn-settle:disabled { background: #3B4048; color: #6B7178; box-shadow: none; cursor: not-allowed; }

        /* Scanner mode toggle */
        .scan-mode-toggle {
          display: flex;
          gap: 6px;
          margin-bottom: 12px;
          background: #0F1114;
          padding: 4px;
          border-radius: 8px;
          border: 1px solid #33383F;
        }
        .scan-mode-btn {
          flex: 1;
          padding: 5px 10px;
          border: none;
          border-radius: 6px;
          background: transparent;
          color: #8C93A0;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .scan-mode-btn.active {
          background: var(--brass);
          color: var(--charcoal);
        }
        .scan-mode-btn:hover:not(.active) { background: var(--charcoal-soft); }

        /* Keyboard shortcuts hint */
        .shortcuts-hint {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 10px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          color: #565C64;
          justify-content: center;
        }
        .shortcuts-hint kbd {
          background: #0F1114;
          padding: 2px 6px;
          border-radius: 3px;
          border: 1px solid #33383F;
          font-size: 9px;
          color: #8C93A0;
        }

        /* ============ QTY MODAL ============ */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15,17,20,0.62);
          backdrop-filter: blur(2px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
        }
        .qty-tag {
          background: var(--charcoal);
          border-radius: 16px;
          padding: 24px;
          width: 400px;
          max-width: 100%;
          box-shadow: 0 24px 64px rgba(0,0,0,0.5);
          position: relative;
          border: 1px solid var(--charcoal-line);
          color: #E8EAEE;
        }
        .qty-tag-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 4px;
        }
        .qty-tag-head h3 {
          font-family: 'Big Shoulders Display', sans-serif;
          font-weight: 800;
          font-size: 22px;
          color: #fff;
          margin: 0;
          padding-right: 12px;
        }
        .qty-close {
          background: none;
          border: none;
          font-size: 18px;
          color: #8C93A0;
          cursor: pointer;
          flex-shrink: 0;
        }
        .qty-rate {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: #8C93A0;
          margin: 0 0 18px;
        }
        .qty-rate b { color: var(--led-amber); font-weight: 700; }

        .qty-field { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
        .qty-field label { min-width: 68px; font-size: 12.5px; font-weight: 600; color: #8C93A0; }
        .qty-input {
          flex: 1;
          padding: 9px 10px;
          border: 1.5px solid var(--charcoal-line);
          background: #0F1114;
          border-radius: 8px;
          color: #fff;
          font-family: 'JetBrains Mono', monospace;
          font-size: 15px;
          text-align: center;
          outline: none;
        }
        .qty-input:focus { border-color: var(--brass); }
        .qty-select {
          flex: 1;
          padding: 9px 10px;
          border: 1.5px solid var(--charcoal-line);
          background: #0F1114;
          color: #fff;
          border-radius: 8px;
          font-size: 13px;
          outline: none;
        }

        .qty-preview {
          margin-top: 16px;
          background: #0F1114;
          border-radius: 12px;
          padding: 4px;
          border: 1px solid #33383F;
        }
        .qty-preview-rows { padding: 10px 12px 4px; }
        .qty-preview-row {
          display: flex;
          justify-content: space-between;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: #8C93A0;
          padding: 3px 0;
        }
        .qty-preview-total {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          padding: 12px 14px;
          margin-top: 6px;
          border-top: 1px dashed #33383F;
        }
        .qty-preview-total .lbl {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9.5px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #6B7178;
        }
        .qty-preview-total .val {
          font-family: 'Orbitron', sans-serif;
          font-size: 26px;
          font-weight: 700;
          color: var(--led-amber);
          text-shadow: 0 0 10px rgba(255,176,32,0.5);
        }

        .qty-stock-note {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: #6B7178;
          text-align: right;
          margin-top: 8px;
        }
        .qty-footer { display: flex; gap: 10px; margin-top: 18px; }
        .qty-cancel {
          flex: 1;
          padding: 12px;
          background: transparent;
          border: 1.5px solid var(--charcoal-line);
          border-radius: 9px;
          font-weight: 600;
          font-size: 13.5px;
          color: #8C93A0;
          cursor: pointer;
        }
        .qty-confirm {
          flex: 2;
          padding: 12px;
          background: linear-gradient(135deg, var(--brass-bright), var(--brass-deep));
          color: var(--charcoal);
          border: none;
          border-radius: 9px;
          font-weight: 800;
          font-size: 13.5px;
          cursor: pointer;
        }
        .qty-confirm:hover { filter: brightness(1.06); }
        .qty-hint {
          text-align: center;
          margin-top: 10px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10.5px;
          color: #565C64;
        }

        @media (max-width: 1100px) {
          .pos-layout { flex-direction: column; }
          .receipt-col { max-width: 100%; position: static; width: 100%; }
          .tag-grid { max-height: 480px; }
        }
        @media (max-width: 520px) {
          .pos-wrap { padding: 12px; }
          .tag-grid { 
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); 
            gap: 10px; 
          }
          .shelf-heading { font-size: 26px; }
          .scale-display .scale-total { font-size: 32px; }
          .status-right { display: none; }
          .tag-price { font-size: 17px; }
          .tag-name { font-size: 13px; }
        }
      `}</style>

      <div className="pos-wrap">
        {/* Status Bar */}
        <div className="status-bar">
          <div className="status-left">
            <span className="status-brand">₹ LAABHA COUNTER</span>
            <span className="status-online">ONLINE</span>
            <span style={{ color: '#6B7178' }}>Cashier: Admin</span>
          </div>
          <div className="status-right">
            <span>Today: ₹24,580</span>
            <span>Bills: 86</span>
            <span>{currentTime.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            <span style={{ color: 'var(--led-amber)' }}>
              {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </span>
          </div>
        </div>

        <div className="pos-layout">
          {/* LEFT: product shelf */}
          <div className="shelf-col">
            <div className="shelf-topbar">
              <div className="brand-block">
                <div className="brand-mark">₹</div>
                <div className="shelf-heading">
                  Laabha
                  <span className="sub">Counter Billing</span>
                </div>
              </div>
              <div className="shelf-count">
                {products.length} PRODUCTS
                {search && ` · Showing ${filteredProducts.length} results`}
              </div>
            </div>

            <div className="shelf-search-row">
              <input
                id="search-input"
                className="shelf-search"
                placeholder="🔍 Search product / barcode / SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button className="shelf-scan" onClick={() => setShowScanner(true)}>
                📷 SCAN
              </button>
            </div>

            {/* Category Filters */}
            <div className="category-filters">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`cat-btn ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="tag-grid">
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product);
                const unit = product.price_unit || "pcs";
                const isOutOfStock = product.stock <= 0;
                
                return (
                  <div key={product.id} className="price-tag">
                    <div className="tag-brass-strip" />
                    <div className="tag-body">
                      {/* 1. Product Name */}
                      <div className="tag-name">{product.product_name}</div>

                      {/* 2. Selling Price + 3. Unit */}
                      <div className="tag-price-block">
                        <span className="tag-price">
                          <span className="rupee-symbol">₹</span>{product.selling_price.toFixed(2)}
                        </span>
                        <span className="tag-unit">
                          <span className="per-text">per</span> {product.price_per || 1} {formatUnitDisplay(unit)}
                        </span>
                      </div>

                      {/* 4. Available Stock */}
                      <div className={`tag-stock ${stockStatus.tone}`}>
                        {isOutOfStock ? '⚠ OUT OF STOCK' : stockStatus.text}
                      </div>

                      {/* 5. Action Button */}
                      <button
                        className="tag-add-btn"
                        onClick={() => {
                          if (scanMode === "quick") {
                            quickAddToCart(product);
                          } else {
                            openQuantityModal(product);
                          }
                        }}
                        disabled={isOutOfStock}
                      >
                        {isOutOfStock ? 'SOLD OUT' : '+ ADD'}
                      </button>

                      {/* Optional: SKU - small at bottom */}
                      {product.sku && (
                        <div className="tag-sku">SKU: {product.sku}</div>
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredProducts.length === 0 && <div className="no-products">No products found</div>}
            </div>
          </div>

          {/* RIGHT: digital counter display */}
          <div className="receipt-col">
            <div className="receipt">
              <div className="receipt-store-row">
                <span className="receipt-store">Laabha Counter</span>
                <span className="receipt-inv">{invoiceNo}</span>
              </div>

              <div className="scale-display">
                <div className="scale-label">
                  <span>BILL TOTAL</span>
                  <span>
                    {currentTime.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    <span style={{ marginLeft: '8px', color: 'var(--led-amber)' }}>
                      {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                    </span>
                  </span>
                </div>
                <div className="scale-total">
                  <span className="rupee">₹</span>{grandTotal.toFixed(2)}
                </div>
                <div className="scale-meta">
                  <span>{cart.reduce((sum, item) => sum + item.quantity, 0)} items</span>
                  <span>{paymentMethod}</span>
                </div>
              </div>

              {saleComplete && <div className="save-banner">✓ Bill settled</div>}

              <hr className="receipt-dash" />

              <div className="customer-line">
                <label>Customer Phone <span style={{ fontWeight: 'normal', color: '#6B7178' }}>(optional)</span></label>
                <input
                  className="customer-input"
                  placeholder="10-digit number or leave blank"
                  value={customerPhone}
                  onChange={(e) => {
                    const phone = e.target.value.replace(/\D/g, "");
                    setCustomerPhone(phone);
                    if (phone.length === 10) {
                      searchCustomer(phone);
                    } else {
                      setIsCustomerFound(false);
                      setCustomerId(null);
                      setCustomerName("");
                    }
                  }}
                  type="tel"
                  maxLength="10"
                />
                {customerPhone.length > 0 ? (
                  <div className="customer-status">
                    {isSearching ? (
                      <span className="status-searching">checking...</span>
                    ) : isCustomerFound ? (
                      <span className="status-found">✓ {customerName}</span>
                    ) : customerPhone.length === 10 ? (
                      <span className="status-new">new customer</span>
                    ) : (
                      <span className="status-invalid">enter 10 digits</span>
                    )}
                  </div>
                ) : (
                  <div className="walkin-badge">
                    <span className="icon">👤</span>
                    Walk-in Customer
                  </div>
                )}
              </div>

              <div className="items-zone">
                {cart.length === 0 ? (
                  <div className="empty-receipt">No items added yet</div>
                ) : (
                  cart.map((item, index) => (
                    <div key={`${item.id}-${index}`} className="item-line">
                      <div className="name-block">
                        <span className="nm">{item.product_name}</span>
                        <span className="qty">
                          {formatUnitDisplay(item.unit)} · ₹{item.price_per_unit.toFixed(2)}/{formatUnitDisplay(item.base_unit)}
                        </span>
                      </div>
                      <div className="qty-controls">
                        <button className="qty-btn" onClick={() => changeQty(item.id, -1, item.unit)}>−</button>
                        <span className="qty-val">{item.quantity}</span>
                        <button className="qty-btn" onClick={() => changeQty(item.id, 1, item.unit)}>+</button>
                      </div>
                      <span className="amt">₹{item.totalPrice.toFixed(2)}</span>
                      <button className="rm" onClick={() => changeQty(item.id, 0, item.unit)}>✕</button>
                    </div>
                  ))
                )}
              </div>

              <hr className="receipt-dash" />

              <div className="totals-block">
                <div className="totals-row"><span>Subtotal</span><span className="v">₹{subtotal.toFixed(2)}</span></div>
                <div className="totals-row"><span>Discount ({discount}%)</span><span className="v">−₹{discountAmount.toFixed(2)}</span></div>
                <div className="totals-row"><span>Taxable</span><span className="v">₹{taxableAmount.toFixed(2)}</span></div>
                <div className="totals-row"><span>CGST ({(gst / 2).toFixed(0)}%)</span><span className="v">₹{cgst.toFixed(2)}</span></div>
                <div className="totals-row"><span>SGST ({(gst / 2).toFixed(0)}%)</span><span className="v">₹{sgst.toFixed(2)}</span></div>
              </div>

              <div className="field-pair">
                <div className="fld">
                  <label>Discount %</label>
                  <input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} min="0" max="100" />
                </div>
                <div className="fld">
                  <label>GST %</label>
                  <input type="number" value={gst} onChange={(e) => setGst(Number(e.target.value))} min="0" max="100" />
                </div>
              </div>

              <div className="pay-row">
                <button
                  className={`pay-opt ${paymentMethod === "Cash" ? "active" : ""}`}
                  onClick={() => setPaymentMethod("Cash")}
                >
                  💵 Cash
                </button>
                <button
                  className={`pay-opt ${paymentMethod === "UPI" ? "active" : ""}`}
                  onClick={() => setPaymentMethod("UPI")}
                >
                  📱 UPI
                </button>
                <button
                  className={`pay-opt ${paymentMethod === "Card" ? "active" : ""}`}
                  onClick={() => setPaymentMethod("Card")}
                >
                  💳 Card
                </button>
              </div>

              {paymentMethod === "Cash" && (
                <div className="cash-change">
                  <div className="cash-change-row">
                    <span className="lbl">Bill Total</span>
                    <span className="val">₹{grandTotal.toFixed(2)}</span>
                  </div>
                  <div className="cash-change-row" style={{ marginTop: '4px' }}>
                    <span className="lbl">Cash Received</span>
                    <input
                      id="cash-received"
                      className="cash-input"
                      type="number"
                      placeholder="0.00"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      style={{ width: '120px', textAlign: 'right', display: 'inline-block' }}
                    />
                  </div>
                  {showChange && (
                    <div className="cash-change-row" style={{ marginTop: '4px', borderTop: '1px dashed #33383F', paddingTop: '4px' }}>
                      <span className="lbl">Change</span>
                      <span className="val change">₹{change.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Scan Mode Toggle */}
              <div className="scan-mode-toggle">
                <button
                  className={`scan-mode-btn ${scanMode === "quick" ? "active" : ""}`}
                  onClick={() => setScanMode("quick")}
                >
                  ⚡ Quick Add
                </button>
                <button
                  className={`scan-mode-btn ${scanMode === "ask" ? "active" : ""}`}
                  onClick={() => setScanMode("ask")}
                >
                  📋 Ask Quantity
                </button>
              </div>

              <div className="receipt-actions">
                <button className="btn-clear" onClick={clearCart} disabled={cart.length === 0}>Clear</button>
                <button
                  className="btn-settle"
                  onClick={saveSale}
                  disabled={cart.length === 0 || !isPhoneValid}
                >
                  Settle ₹{grandTotal.toFixed(2)}
                </button>
              </div>

              <div className="shortcuts-hint">
                <span><kbd>F2</kbd> Search</span>
                <span><kbd>F4</kbd> Scan</span>
                <span><kbd>F8</kbd> Cash</span>
                <span><kbd>Ctrl+Enter</kbd> Complete</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quantity modal */}
      {showQtyModal && selectedProduct && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowQtyModal(false);
            setSelectedProduct(null);
            setQuantity(1);
            setSelectedUnit("pcs");
          }}
        >
          <div className="qty-tag" onClick={(e) => e.stopPropagation()}>
            <div className="qty-tag-head">
              <h3>{selectedProduct.product_name}</h3>
              <button
                className="qty-close"
                onClick={() => {
                  setShowQtyModal(false);
                  setSelectedProduct(null);
                  setQuantity(1);
                  setSelectedUnit("pcs");
                }}
              >
                ✕
              </button>
            </div>
            <div className="qty-rate">
              <b>₹{selectedProduct.selling_price}</b> per {selectedProduct.price_per || 1} {formatUnitDisplay(selectedProduct.price_unit || "pcs")}
            </div>

            <div className="qty-field">
              <label>Quantity</label>
              <input
                ref={quantityInputRef}
                className="qty-input"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                onKeyDown={handleKeyPress}
                min="0.01"
                max={selectedProduct.stock}
                step="0.01"
              />
            </div>

            <div className="qty-field">
              <label>Unit</label>
              <select
                className="qty-select"
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
              >
                {getCompatibleUnits(selectedProduct.price_unit || "pcs").map((unit) => (
                  <option key={unit} value={unit}>{formatUnitDisplay(unit)}</option>
                ))}
              </select>
            </div>

            <div className="qty-preview">
              <div className="qty-preview-rows">
                <div className="qty-preview-row">
                  <span>Quantity</span>
                  <span>{quantity} {formatUnitDisplay(selectedUnit)}</span>
                </div>
                {selectedUnit !== (selectedProduct.price_unit || "pcs") && (
                  <div className="qty-preview-row">
                    <span>Converted</span>
                    <span>
                      {calculateLivePrice().displayQuantity.toFixed(2)}{" "}
                      {formatUnitDisplay(calculateLivePrice().displayUnit)}
                    </span>
                  </div>
                )}
                <div className="qty-preview-row">
                  <span>Rate</span>
                  <span>
                    ₹{selectedProduct.selling_price} / {selectedProduct.price_per || 1}{" "}
                    {formatUnitDisplay(selectedProduct.price_unit || "pcs")}
                  </span>
                </div>
              </div>
              <div className="qty-preview-total">
                <span className="lbl">Total</span>
                <span className="val">₹{liveTotalDigits}</span>
              </div>
            </div>

            <div className="qty-stock-note">
              {selectedProduct.stock} {formatUnitDisplay(selectedProduct.price_unit || "pcs")} available
            </div>

            <div className="qty-footer">
              <button
                className="qty-cancel"
                onClick={() => {
                  setShowQtyModal(false);
                  setSelectedProduct(null);
                  setQuantity(1);
                  setSelectedUnit("pcs");
                }}
              >
                Cancel
              </button>
              <button className="qty-confirm" onClick={addToCartWithQuantity}>
                Add to Bill
              </button>
            </div>
            <div className="qty-hint"><kbd>Enter</kbd> to add · <kbd>Esc</kbd> to cancel</div>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <BarcodeScanner
          businessId={businessId}
          onClose={() => setShowScanner(false)}
          onProductFound={(product) => {
            setShowScanner(false);
            if (scanMode === "quick") {
              quickAddToCart(product);
            } else {
              openQuantityModal(product);
            }
          }}
        />
      )}
    </>
  );
}