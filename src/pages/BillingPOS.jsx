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

  // Customer fields – only phone is required
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

  // Quantity input refs
  const quantityInputRef = useRef(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showQtyModal, setShowQtyModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedUnit, setSelectedUnit] = useState("pcs");

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

  // Convert quantity from one unit to another (for display purposes)
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
  }, []);

  // Auto-dismiss the "bill settled" confirmation banner
  useEffect(() => {
    if (saleComplete) {
      const t = setTimeout(() => setSaleComplete(false), 2600);
      return () => clearTimeout(t);
    }
  }, [saleComplete]);

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

    const baseUnit = selectedProduct.price_unit || "pcs";
    const convertedQuantity = convertDisplayUnit(quantity, selectedUnit, baseUnit);
    const pricePerUnit = selectedProduct.selling_price / (selectedProduct.price_per || 1);
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

  const changeQty = (id, qty, unit) => {
    if (qty <= 0) {
      setCart(cart.filter((item) => !(item.id === id && item.unit === unit)));
      return;
    }

    setCart(
      cart.map((item) => {
        if (item.id === id && item.unit === unit) {
          const ratio = qty / item.quantity;
          return {
            ...item,
            quantity: qty,
            convertedQuantity: item.convertedQuantity * ratio,
            displayQuantity: item.displayQuantity * ratio,
            totalPrice: item.price_per_unit * item.convertedQuantity * ratio,
          };
        }
        return item;
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

  // Validate phone number
  const isPhoneValid = customerPhone.length === 10 && /^\d{10}$/.test(customerPhone);

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

    if (product.stock <= 5) {
      return { text: `${product.stock} ${unitDisplay} left`, tone: "low" };
    } else if (product.stock <= 20) {
      return { text: `${product.stock} ${unitDisplay} left`, tone: "mid" };
    }
    return null;
  };

  const liveTotalDigits = showQtyModal ? calculateLivePrice().total.toFixed(2) : null;

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
          margin-bottom: 18px;
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

        .tag-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(216px, 1fr));
          gap: 14px;
          max-height: calc(100vh - 240px);
          overflow-y: auto;
          padding: 4px 6px 12px 2px;
        }
        .tag-grid::-webkit-scrollbar { width: 6px; }
        .tag-grid::-webkit-scrollbar-thumb { background: #B9C0C7; border-radius: 6px; }

        /* ===== steel shelf tag card ===== */
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
        }
        .price-tag:hover {
          transform: translateY(-3px);
          box-shadow: 0 14px 26px rgba(20,22,26,0.14);
          border-color: var(--brass);
        }
        .tag-brass-strip {
          height: 5px;
          background: linear-gradient(90deg, var(--brass-deep), var(--brass-bright) 45%, var(--brass-deep));
        }

        .tag-body { padding: 13px 14px 0; display: flex; flex-direction: column; flex: 1; }

        .tag-name {
          font-family: 'Manrope', sans-serif;
          font-weight: 700;
          font-size: 14.5px;
          line-height: 1.28;
          color: var(--ink);
          margin: 0 0 10px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 37px;
        }

        /* LED chip, echo of the big counter display */
        .led-chip {
          background: var(--charcoal);
          border-radius: 7px;
          padding: 8px 10px;
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 6px;
          margin-bottom: 9px;
        }
        .led-chip .amt {
          font-family: 'Orbitron', sans-serif;
          font-weight: 700;
          font-size: 18px;
          color: var(--led-amber);
          text-shadow: 0 0 8px rgba(255,176,32,0.55);
          white-space: nowrap;
        }
        .led-chip .per {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9.5px;
          color: #8C93A0;
          text-align: right;
          line-height: 1.3;
        }

        .tag-stock {
          font-size: 11px;
          font-weight: 600;
          color: var(--muted);
          margin-bottom: 10px;
        }
        .tag-stock.low { color: var(--led-red); }
        .tag-stock.mid { color: var(--brass-deep); }

        .tag-add-btn {
          margin-top: auto;
          width: 100%;
          padding: 10px 0;
          background: var(--charcoal);
          color: var(--brass-bright);
          border: none;
          border-radius: 8px;
          font-weight: 700;
          font-size: 12.5px;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
        }
        .tag-add-btn:hover:not(:disabled) { background: linear-gradient(135deg, var(--brass-deep), var(--brass)); color: var(--charcoal); }
        .tag-add-btn:active:not(:disabled) { transform: scale(0.96); }
        .tag-add-btn:disabled {
          background: var(--steel-panel-2);
          color: var(--muted);
          cursor: not-allowed;
        }

        .no-products {
          grid-column: 1 / -1;
          text-align: center;
          padding: 60px 0;
          color: var(--muted);
          font-weight: 500;
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

        /* the digital weighing-scale total display: signature element */
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
          justify-content: space-between;
          gap: 8px;
          font-size: 12.5px;
          padding: 7px 0;
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
          font-size: 10.5px;
          color: #8C93A0;
        }
        .item-line .amt {
          font-family: 'JetBrains Mono', monospace;
          font-weight: 700;
          color: var(--led-amber);
          white-space: nowrap;
        }
        .item-line .rm {
          background: none;
          border: none;
          color: var(--led-red);
          font-weight: 700;
          cursor: pointer;
          padding: 0 0 0 6px;
          opacity: 0.75;
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

        .pay-row { display: flex; gap: 6px; margin-bottom: 16px; }
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
        }
        .pay-opt.active {
          border-color: var(--brass);
          background: linear-gradient(135deg, var(--brass-bright), var(--brass-deep));
          color: var(--charcoal);
        }

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
          .tag-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
          .shelf-heading { font-size: 26px; }
          .scale-display .scale-total { font-size: 32px; }
        }
      `}</style>

      <div className="pos-wrap">
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
              <div className="shelf-count">{products.length} items on shelf</div>
            </div>

            <div className="shelf-search-row">
              <input
                className="shelf-search"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button className="shelf-scan" onClick={() => setShowScanner(true)}>
                Scan
              </button>
            </div>

            <div className="tag-grid">
              {products
                .filter((p) =>
                  p.product_name.toLowerCase().includes(search.toLowerCase())
                )
                .map((product) => {
                  const stockStatus = getStockStatus(product);
                  const unit = product.price_unit || "pcs";
                  return (
                    <div key={product.id} className="price-tag">
                      <div className="tag-brass-strip" />
                      <div className="tag-body">
                        <div className="tag-name">{product.product_name}</div>

                        <div className="led-chip">
                          <span className="amt">₹{product.selling_price}</span>
                          <span className="per">
                            per {product.price_per || 1}<br />{formatUnitDisplay(unit)}
                          </span>
                        </div>

                        {stockStatus ? (
                          <div className={`tag-stock ${stockStatus.tone}`}>{stockStatus.text}</div>
                        ) : (
                          <div className="tag-stock">{product.stock} {formatUnitDisplay(unit)} in stock</div>
                        )}

                        <button
                          className="tag-add-btn"
                          onClick={() => openQuantityModal(product)}
                          disabled={product.stock <= 0}
                        >
                          {product.stock > 0 ? "Add to bill" : "Sold out"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              {products.filter((p) =>
                p.product_name.toLowerCase().includes(search.toLowerCase())
              ).length === 0 && <div className="no-products">No products found</div>}
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
                  <span>Bill Total</span>
                  <span>{new Date().toLocaleDateString("en-IN")}</span>
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
                <label>Customer phone</label>
                <input
                  className="customer-input"
                  placeholder="10-digit number"
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
                {customerPhone.length > 0 && (
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
                )}
              </div>

              <div className="items-zone">
                {cart.length === 0 ? (
                  <div className="empty-receipt">no items added yet</div>
                ) : (
                  cart.map((item, index) => (
                    <div key={`${item.id}-${index}`} className="item-line">
                      <div className="name-block">
                        <span className="nm">{item.product_name}</span>
                        <span className="qty">
                          {item.quantity} {formatUnitDisplay(item.unit)} · ₹{item.price_per_unit.toFixed(2)}/{formatUnitDisplay(item.base_unit)}
                        </span>
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
                {["Cash", "UPI", "Card"].map((method) => (
                  <button
                    key={method}
                    className={`pay-opt ${paymentMethod === method ? "active" : ""}`}
                    onClick={() => setPaymentMethod(method)}
                  >
                    {method}
                  </button>
                ))}
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
            <div className="qty-hint">Enter to add · Esc to cancel</div>
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
            openQuantityModal(product);
          }}
        />
      )}
    </>
  );
}