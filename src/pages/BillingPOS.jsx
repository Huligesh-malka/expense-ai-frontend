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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=Libre+Barcode+128&display=swap');

        :root {
          --shelf-bg: #EAE6DA;
          --tag-white: #FFFFFF;
          --tag-cream: #FFFDF8;
          --ink: #20241F;
          --ink-soft: #565A50;
          --price-green: #1E7A46;
          --rust: #C1502B;
          --rust-deep: #9C3F21;
          --muted: #8E8A78;
          --line: #DCD6C4;
          --paper: #FFFFFF;
        }

        * { box-sizing: border-box; }

        .pos-wrap {
          font-family: 'IBM Plex Sans', sans-serif;
          background: var(--shelf-bg);
          min-height: 100vh;
          padding: 22px;
        }

        .pos-layout {
          max-width: 1580px;
          margin: 0 auto;
          display: flex;
          gap: 22px;
          align-items: flex-start;
        }

        /* ============ LEFT: SHELF OF PRICE TAGS ============ */
        .shelf-col { flex: 1.7; }

        .shelf-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }
        .shelf-heading {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 800;
          font-size: 28px;
          color: var(--ink);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .shelf-heading .count {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 13px;
          font-weight: 500;
          color: var(--ink-soft);
          text-transform: none;
          letter-spacing: 0;
          margin-left: 10px;
        }

        .shelf-search-row {
          display: flex;
          gap: 10px;
          margin-bottom: 18px;
        }
        .shelf-search {
          flex: 1;
          padding: 12px 16px;
          border-radius: 10px;
          border: 2px solid var(--line);
          background: var(--tag-white);
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s;
        }
        .shelf-search:focus { border-color: var(--rust); }
        .shelf-scan {
          padding: 0 20px;
          background: var(--ink);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 13.5px;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
        }
        .shelf-scan:hover { background: var(--rust-deep); }
        .shelf-scan:active { transform: scale(0.96); }

        .tag-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 14px;
          max-height: calc(100vh - 220px);
          overflow-y: auto;
          padding: 4px 4px 12px 0;
        }
        .tag-grid::-webkit-scrollbar { width: 6px; }
        .tag-grid::-webkit-scrollbar-thumb { background: #C7BFA4; border-radius: 6px; }

        /* ===== the price tag card — hero is name + price ===== */
        .price-tag {
          position: relative;
          background: var(--tag-white);
          border-radius: 12px;
          padding: 16px 14px 12px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.08);
          border: 1px solid var(--line);
          display: flex;
          flex-direction: column;
          transition: transform 0.12s, box-shadow 0.12s;
        }
        .price-tag:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 18px rgba(0,0,0,0.12);
        }
        /* punch hole, like a hanging shelf tag */
        .price-tag::before {
          content: "";
          position: absolute;
          top: 10px;
          left: 14px;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: var(--shelf-bg);
          box-shadow: inset 0 1px 2px rgba(0,0,0,0.25);
        }

        .tag-name {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 19px;
          line-height: 1.15;
          color: var(--ink);
          margin: 6px 0 10px 20px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 44px;
        }

        .tag-price-row {
          display: flex;
          align-items: baseline;
          gap: 5px;
          margin-bottom: 6px;
        }
        .tag-price {
          font-family: 'IBM Plex Mono', monospace;
          font-weight: 700;
          font-size: 24px;
          color: var(--price-green);
        }
        .tag-price-unit {
          font-size: 12px;
          color: var(--ink-soft);
          font-weight: 500;
        }

        .tag-stock {
          font-size: 11.5px;
          color: var(--muted);
          margin-bottom: 8px;
        }
        .tag-stock.low { color: var(--rust-deep); font-weight: 600; }
        .tag-stock.mid { color: #A4762A; font-weight: 600; }

        /* decorative + real barcode number */
        .tag-barcode {
          margin: 2px 0 10px;
          overflow: hidden;
        }
        .tag-barcode .bars {
          font-family: 'Libre Barcode 128', cursive;
          font-size: 30px;
          line-height: 1;
          color: #1a1a1a;
          letter-spacing: 1px;
          white-space: nowrap;
        }
        .tag-barcode .digits {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 1.5px;
          color: var(--muted);
        }

        .tag-add-btn {
          margin-top: auto;
          width: 100%;
          padding: 9px 0;
          background: var(--ink);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
        }
        .tag-add-btn:hover:not(:disabled) { background: var(--rust); }
        .tag-add-btn:active:not(:disabled) { transform: scale(0.96); }
        .tag-add-btn:disabled {
          background: #C9C4B4;
          cursor: not-allowed;
        }

        .no-products {
          grid-column: 1 / -1;
          text-align: center;
          padding: 50px 0;
          color: var(--muted);
        }

        /* ============ RIGHT: THERMAL RECEIPT ============ */
        .receipt-col {
          flex: 1;
          max-width: 400px;
          position: sticky;
          top: 22px;
        }
        .receipt {
          position: relative;
          background: var(--paper);
          padding: 22px 22px 26px;
          font-family: 'IBM Plex Mono', monospace;
          color: var(--ink);
          box-shadow: 0 10px 26px rgba(0,0,0,0.18);
          border-radius: 3px 3px 0 0;
        }
        .receipt::after {
          content: "";
          position: absolute;
          left: 0; right: 0; bottom: -13px;
          height: 14px;
          background:
            linear-gradient(-45deg, transparent 7px, var(--paper) 0) 0 0,
            linear-gradient(45deg, transparent 7px, var(--paper) 0) 0 0;
          background-size: 14px 14px;
          background-repeat: repeat-x;
        }

        .receipt-store {
          text-align: center;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 800;
          font-size: 22px;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .receipt-sub {
          text-align: center;
          font-size: 10.5px;
          color: var(--ink-soft);
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .receipt-dash {
          border: none;
          border-top: 1.5px dashed #B9B4A2;
          margin: 10px 0;
        }
        .receipt-meta-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          padding: 1px 0;
        }

        .save-banner {
          background: var(--price-green);
          color: #fff;
          text-align: center;
          font-size: 12.5px;
          font-weight: 600;
          padding: 7px 0;
          border-radius: 6px;
          margin-bottom: 10px;
          animation: bannerIn 0.25s ease;
        }
        @keyframes bannerIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .customer-line { margin: 10px 0 4px; }
        .customer-line label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: var(--ink-soft);
          display: block;
          margin-bottom: 4px;
        }
        .customer-input {
          width: 100%;
          border: none;
          border-bottom: 1.5px solid var(--ink);
          background: transparent;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 14px;
          padding: 4px 2px;
          outline: none;
        }
        .customer-status {
          font-size: 11.5px;
          margin-top: 5px;
          font-weight: 600;
        }
        .status-found { color: var(--price-green); }
        .status-new { color: var(--ink-soft); }
        .status-searching { color: #A4762A; }
        .status-invalid { color: var(--rust-deep); }

        .items-zone {
          min-height: 90px;
          max-height: 200px;
          overflow-y: auto;
          margin: 10px 0;
        }
        .item-line {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          font-size: 12.5px;
          padding: 5px 0;
        }
        .item-line .name-block { flex: 1; min-width: 0; }
        .item-line .name-block .nm {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: block;
          font-weight: 600;
        }
        .item-line .name-block .qty {
          font-size: 10.5px;
          color: var(--ink-soft);
        }
        .item-line .amt {
          font-weight: 700;
          white-space: nowrap;
        }
        .item-line .rm {
          background: none;
          border: none;
          color: var(--rust);
          font-weight: 700;
          cursor: pointer;
          padding: 0 0 0 6px;
        }
        .empty-receipt {
          text-align: center;
          color: var(--muted);
          font-size: 12.5px;
          padding: 22px 0;
        }

        .totals-block { font-size: 12.5px; }
        .totals-row {
          display: flex;
          justify-content: space-between;
          padding: 2px 0;
          color: var(--ink-soft);
        }
        .totals-row .v { color: var(--ink); font-weight: 500; }
        .grand-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1.5px dashed #B9B4A2;
        }
        .grand-row .label {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 16px;
          text-transform: uppercase;
        }
        .grand-row .value {
          font-size: 22px;
          font-weight: 700;
          color: var(--price-green);
        }

        .field-pair { display: flex; gap: 12px; margin: 12px 0; }
        .field-pair .fld { flex: 1; }
        .field-pair label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--ink-soft);
          display: block;
          margin-bottom: 3px;
        }
        .field-pair input {
          width: 100%;
          border: none;
          border-bottom: 1.5px solid var(--line);
          background: transparent;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 13px;
          padding: 3px 0;
          outline: none;
        }
        .field-pair input:focus { border-bottom-color: var(--rust); }

        .pay-row { display: flex; gap: 6px; margin-bottom: 14px; }
        .pay-opt {
          flex: 1;
          padding: 7px 0;
          text-align: center;
          border: 1.5px solid var(--line);
          background: transparent;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11.5px;
          font-weight: 600;
          border-radius: 5px;
          cursor: pointer;
          color: var(--ink-soft);
        }
        .pay-opt.active {
          border-color: var(--ink);
          background: var(--ink);
          color: #fff;
        }

        .receipt-actions { display: flex; gap: 8px; margin-top: 4px; }
        .btn-clear {
          flex: 1;
          padding: 11px 0;
          background: transparent;
          border: 1.5px solid var(--rust);
          color: var(--rust-deep);
          border-radius: 7px;
          font-weight: 700;
          font-size: 12.5px;
          cursor: pointer;
        }
        .btn-clear:disabled { opacity: 0.35; cursor: not-allowed; }
        .btn-settle {
          flex: 2;
          padding: 11px 0;
          background: var(--price-green);
          color: #fff;
          border: none;
          border-radius: 7px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          font-family: 'IBM Plex Sans', sans-serif;
        }
        .btn-settle:hover:not(:disabled) { background: #175E37; }
        .btn-settle:disabled { background: #B7CBBC; cursor: not-allowed; }

        /* ============ QTY MODAL: an enlarged tag ============ */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(20,20,15,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .qty-tag {
          background: var(--tag-white);
          border-radius: 14px;
          padding: 24px;
          width: 400px;
          max-width: 92%;
          box-shadow: 0 20px 60px rgba(0,0,0,0.4);
          position: relative;
        }
        .qty-tag::before {
          content: "";
          position: absolute;
          top: 14px; left: 20px;
          width: 12px; height: 12px;
          border-radius: 50%;
          background: var(--shelf-bg);
          box-shadow: inset 0 1px 2px rgba(0,0,0,0.25);
        }
        .qty-tag-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin: 8px 0 4px 22px;
        }
        .qty-tag-head h3 {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 22px;
          color: var(--ink);
          margin: 0;
        }
        .qty-close {
          background: none;
          border: none;
          font-size: 20px;
          color: var(--muted);
          cursor: pointer;
        }
        .qty-rate {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 22px;
          font-weight: 700;
          color: var(--price-green);
          margin: 0 0 18px 22px;
        }
        .qty-rate span { font-size: 12px; color: var(--ink-soft); font-weight: 500; }

        .qty-field { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
        .qty-field label { min-width: 70px; font-size: 13px; font-weight: 600; color: var(--ink-soft); }
        .qty-input {
          flex: 1;
          padding: 8px 10px;
          border: 2px solid var(--line);
          border-radius: 8px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 16px;
          text-align: center;
          outline: none;
        }
        .qty-input:focus { border-color: var(--rust); }
        .qty-select {
          flex: 1;
          padding: 8px 10px;
          border: 2px solid var(--line);
          border-radius: 8px;
          font-size: 13.5px;
          background: #fff;
          outline: none;
        }
        .qty-preview {
          background: var(--shelf-bg);
          border-radius: 10px;
          padding: 12px 14px;
          margin-top: 14px;
        }
        .qty-preview-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: var(--ink-soft);
          padding: 3px 0;
        }
        .qty-preview-total {
          display: flex;
          justify-content: space-between;
          padding-top: 6px;
          margin-top: 6px;
          border-top: 2px solid #D1CBB6;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 19px;
          font-weight: 700;
          color: var(--price-green);
        }
        .qty-stock-note {
          font-size: 11.5px;
          color: var(--muted);
          text-align: right;
          margin-top: 8px;
        }
        .qty-footer { display: flex; gap: 10px; margin-top: 18px; }
        .qty-cancel {
          flex: 1;
          padding: 11px;
          background: transparent;
          border: 2px solid var(--line);
          border-radius: 8px;
          font-weight: 600;
          font-size: 13.5px;
          color: var(--ink-soft);
          cursor: pointer;
        }
        .qty-confirm {
          flex: 2;
          padding: 11px;
          background: var(--ink);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          font-size: 13.5px;
          cursor: pointer;
        }
        .qty-confirm:hover { background: var(--rust); }
        .qty-hint {
          text-align: center;
          margin-top: 10px;
          font-size: 11px;
          color: var(--muted);
        }

        @media (max-width: 1100px) {
          .pos-layout { flex-direction: column; }
          .receipt-col { max-width: 100%; position: static; width: 100%; }
          .tag-grid { max-height: 460px; }
        }
        @media (max-width: 520px) {
          .pos-wrap { padding: 12px; }
          .tag-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
          .tag-name { font-size: 16px; min-height: 36px; }
          .tag-price { font-size: 20px; }
        }
      `}</style>

      <div className="pos-wrap">
        <div className="pos-layout">
          {/* LEFT: shelf of price tags */}
          <div className="shelf-col">
            <div className="shelf-topbar">
              <div className="shelf-heading">
                Shelf <span className="count">{products.length} items</span>
              </div>
            </div>

            <div className="shelf-search-row">
              <input
                className="shelf-search"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button className="shelf-scan" onClick={() => setShowScanner(true)}>
                📷 Scan
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
                      <div className="tag-name">{product.product_name}</div>

                      <div className="tag-price-row">
                        <span className="tag-price">₹{product.selling_price}</span>
                        <span className="tag-price-unit">
                          / {product.price_per || 1} {formatUnitDisplay(unit)}
                        </span>
                      </div>

                      {stockStatus ? (
                        <div className={`tag-stock ${stockStatus.tone}`}>{stockStatus.text}</div>
                      ) : (
                        <div className="tag-stock">{product.stock} {formatUnitDisplay(unit)} in stock</div>
                      )}

                      {product.barcode && (
                        <div className="tag-barcode">
                          <div className="bars">{product.barcode}</div>
                          <div className="digits">{product.barcode}</div>
                        </div>
                      )}

                      <button
                        className="tag-add-btn"
                        onClick={() => openQuantityModal(product)}
                        disabled={product.stock <= 0}
                      >
                        {product.stock > 0 ? "Add" : "Sold Out"}
                      </button>
                    </div>
                  );
                })}
              {products.filter((p) =>
                p.product_name.toLowerCase().includes(search.toLowerCase())
              ).length === 0 && <div className="no-products">No products found</div>}
            </div>
          </div>

          {/* RIGHT: thermal receipt */}
          <div className="receipt-col">
            <div className="receipt">
              <div className="receipt-store">Laabha</div>
              <div className="receipt-sub">Bill No. {invoiceNo}</div>

              {saleComplete && <div className="save-banner">✓ Bill settled</div>}

              <div className="receipt-meta-row">
                <span>Date</span>
                <span>{new Date().toLocaleDateString("en-IN")}</span>
              </div>
              <div className="receipt-meta-row">
                <span>Items</span>
                <span>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
              </div>

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

              <hr className="receipt-dash" />

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
                <div className="grand-row">
                  <span className="label">Total</span>
                  <span className="value">₹{grandTotal.toFixed(2)}</span>
                </div>
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

      {/* Quantity modal — enlarged tag */}
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
              ₹{selectedProduct.selling_price}{" "}
              <span>
                / {selectedProduct.price_per || 1} {formatUnitDisplay(selectedProduct.price_unit || "pcs")}
              </span>
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
              <div className="qty-preview-total">
                <span>Total</span>
                <span>₹{calculateLivePrice().total.toFixed(2)}</span>
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